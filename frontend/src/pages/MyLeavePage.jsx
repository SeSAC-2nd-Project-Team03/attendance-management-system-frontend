import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { leaveAPI } from '../api/leave';
import { FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatDate, getLeaveTypeKorean, getLeaveStatusKorean } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import './MyLeavePage.css';

export default function MyLeavePage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const data = await leaveAPI.getMyLeaveRequests(user?.loginId || 'student1');
      setLeaves(data || []);
    } catch (error) {
      console.error('휴가 내역 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('신청을 취소하시겠습니까?')) return;

    try {
      await leaveAPI.cancelLeaveRequest(id, user?.loginId || 'student1');
      alert('신청이 취소되었습니다.');
      loadLeaves();
    } catch (error) {
      alert(error.response?.data?.message || '취소 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      PENDING: 'badge-pending',
      APPROVED: 'badge-success',
      REJECTED: 'badge-error',
      CANCELLED: 'badge-warning',
    };
    return classes[status] || 'badge-pending';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiFileText /> 내 신청 내역</h1>
          <p className="page-subtitle">휴가/조퇴 신청 내역을 확인하세요</p>
        </div>
        <Link to="/leave-request" className="btn btn-primary">
          <FiPlus /> 새 신청
        </Link>
      </div>

      <div className="card">
        {leaves.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>신청일</th>
                  <th>휴가일</th>
                  <th>유형</th>
                  <th>사유</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>{formatDate(leave.createdAt)}</td>
                    <td>{formatDate(leave.startDate)}</td>
                    <td>{getLeaveTypeKorean(leave.leaveType)}</td>
                    <td className="reason-cell">{leave.reason}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                        {getLeaveStatusKorean(leave.status)}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'PENDING' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(leave.id)}
                        >
                          <FiTrash2 /> 취소
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>신청 내역이 없습니다</h3>
            <p>새로운 휴가/조퇴를 신청해보세요.</p>
            <Link to="/leave-request" className="btn btn-primary" style={{ marginTop: '16px' }}>
              <FiPlus /> 새 신청
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

