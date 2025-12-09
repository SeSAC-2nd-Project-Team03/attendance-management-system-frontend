import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { adminAPI } from '../../api/admin';
import { leaveAPI } from '../../api/leave';
import { FiFileText, FiCheck, FiX, FiSearch, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { formatDate, getLeaveTypeKorean, getLeaveStatusKorean } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import './LeaveManagement.css';

export default function LeaveManagement() {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [rejectModal, setRejectModal] = useState({ show: false, leaveId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      // 1. 모든 회원 조회
      const membersRes = await adminAPI.getAllMembers();
      const members = membersRes || [];

      // 2. 각 회원별 휴가 신청 조회
      const allRequests = [];
      for (const member of members) {
        try {
          const requests = await leaveAPI.getMyLeaveRequests(member.loginId);
          if (requests && requests.length > 0) {
            allRequests.push(...requests);
          }
        } catch (error) {
          console.log(`${member.loginId} 휴가 조회 실패:`, error);
        }
      }

      // 3. 최신순 정렬
      allRequests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      setLeaveRequests(allRequests);
    } catch (error) {
      console.error('휴가 신청 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    if (!window.confirm('이 휴가 신청을 승인하시겠습니까?')) return;

    try {
      const result = await adminAPI.approveLeaveRequest(leaveId, user?.loginId || 'admin');
      // 알림 추가
      addNotification({
        type: 'approved',
        message: `휴가 신청이 승인되었습니다.`,
      });
      alert('승인되었습니다.');
      loadLeaveRequests();
    } catch (error) {
      alert('승인 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const openRejectModal = (leaveId) => {
    setRejectModal({ show: true, leaveId });
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    try {
      await adminAPI.rejectLeaveRequest(rejectModal.leaveId, user?.loginId || 'admin', rejectReason);
      // 알림 추가
      addNotification({
        type: 'rejected',
        message: `휴가 신청이 반려되었습니다.`,
      });
      alert('반려되었습니다.');
      setRejectModal({ show: false, leaveId: null });
      loadLeaveRequests();
    } catch (error) {
      alert('반려 실패: ' + (error.response?.data?.message || error.message));
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

  const filteredRequests = leaveRequests.filter((req) => {
    if (filter === 'ALL') return true;
    return req.status === filter;
  });

  const pendingCount = leaveRequests.filter(r => r.status === 'PENDING').length;

  if (loading) {
    return <LoadingSpinner text="휴가 신청 목록을 불러오는 중..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiFileText /> 휴가 관리</h1>
          <p className="page-subtitle">학생들의 휴가/조퇴 신청을 관리합니다</p>
        </div>
        <button className="btn btn-secondary" onClick={loadLeaveRequests}>
          <FiRefreshCw /> 새로고침
        </button>
      </div>

      {/* 필터 및 통계 */}
      <div className="card filter-card">
        <div className="filter-row">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              전체 ({leaveRequests.length})
            </button>
            <button
              className={`filter-btn pending ${filter === 'PENDING' ? 'active' : ''}`}
              onClick={() => setFilter('PENDING')}
            >
              대기중 ({pendingCount})
            </button>
            <button
              className={`filter-btn ${filter === 'APPROVED' ? 'active' : ''}`}
              onClick={() => setFilter('APPROVED')}
            >
              승인됨
            </button>
            <button
              className={`filter-btn ${filter === 'REJECTED' ? 'active' : ''}`}
              onClick={() => setFilter('REJECTED')}
            >
              반려됨
            </button>
          </div>
        </div>
      </div>

      {/* 휴가 신청 목록 */}
      <div className="card">
        {filteredRequests.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>신청자</th>
                  <th>휴가 유형</th>
                  <th>휴가일</th>
                  <th>사유</th>
                  <th>신청일</th>
                  <th>상태</th>
                  <th>첨부파일</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((leave) => (
                  <tr key={leave.id} className={leave.status === 'PENDING' ? 'pending-row' : ''}>
                    <td>
                      <div className="member-info">
                        <span className="member-name">{leave.studentName}</span>
                        <span className="member-id">({leave.studentLoginId})</span>
                      </div>
                    </td>
                    <td>{getLeaveTypeKorean(leave.leaveType)}</td>
                    <td>{formatDate(leave.startDate)}</td>
                    <td className="reason-cell" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td>{formatDate(leave.requestedAt)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(leave.status)}`}>
                        {getLeaveStatusKorean(leave.status)}
                      </span>
                    </td>
                    <td>
                      {leave.fileUrl ? (
                        <a 
                          href={leave.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline"
                        >
                          <FiDownload /> 보기
                        </a>
                      ) : (
                        <span className="no-file">-</span>
                      )}
                    </td>
                    <td>
                      {leave.status === 'PENDING' && (
                        <div className="action-buttons">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(leave.id)}
                            title="승인"
                          >
                            <FiCheck /> 승인
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => openRejectModal(leave.id)}
                            title="반려"
                          >
                            <FiX /> 반려
                          </button>
                        </div>
                      )}
                      {leave.status === 'APPROVED' && leave.processedBy && (
                        <span className="processed-info">
                          처리: {leave.processedBy}
                        </span>
                      )}
                      {leave.status === 'REJECTED' && (
                        <span className="reject-reason" title={leave.adminComment}>
                          사유: {leave.adminComment || '-'}
                        </span>
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
            <h3>휴가 신청이 없습니다</h3>
            <p>현재 조회 조건에 해당하는 휴가 신청이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 반려 모달 */}
      {rejectModal.show && (
        <div className="modal-overlay" onClick={() => setRejectModal({ show: false, leaveId: null })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">휴가 신청 반려</h2>
              <button 
                className="modal-close" 
                onClick={() => setRejectModal({ show: false, leaveId: null })}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">반려 사유 *</label>
                <textarea
                  className="input-field textarea"
                  placeholder="반려 사유를 입력하세요"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setRejectModal({ show: false, leaveId: null })}
              >
                취소
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleReject}
              >
                반려하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

