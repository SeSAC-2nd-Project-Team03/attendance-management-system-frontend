import { useState, useEffect } from 'react';
import { leaveAPI } from '../../api/leave';
import { FiFileText, FiCheck, FiX, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { formatDate, getLeaveTypeKorean, getLeaveStatusKorean } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import './LeaveManagement.css';

export default function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadLeaveRequests();
  }, [filter]);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      let response;
      if (filter === 'PENDING') {
        response = await leaveAPI.getPendingLeaveRequests();
      } else {
        response = await leaveAPI.getAllLeaveRequests();
      }
      
      let requests = response?.data || response || [];
      
      // 필터 적용 (ALL이 아닌 경우)
      if (filter !== 'ALL' && filter !== 'PENDING') {
        requests = requests.filter(req => req.status === filter);
      }
      
      // 최신순 정렬
      requests.sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
      
      setLeaveRequests(requests);
    } catch (error) {
      console.error('휴가 신청 목록 조회 실패:', error);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('이 신청을 승인하시겠습니까?')) return;
    
    try {
      await leaveAPI.approveLeaveRequest(id);
      alert('승인되었습니다.');
      loadLeaveRequests();
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    
    try {
      await leaveAPI.rejectLeaveRequest(selectedRequest.id, rejectReason);
      alert('반려되었습니다.');
      setRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      loadLeaveRequests();
    } catch (error) {
      console.error('반려 실패:', error);
      alert('반려 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-error',
      CANCELLED: 'badge-secondary',
    };
    return classes[status] || 'badge-secondary';
  };

  const pendingCount = leaveRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiFileText /> 휴가/조퇴 관리</h1>
          <p className="page-subtitle">
            학생들의 휴가/조퇴 신청을 확인하고 승인/반려합니다
            {pendingCount > 0 && (
              <span className="pending-badge">대기 중 {pendingCount}건</span>
            )}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadLeaveRequests}>
          <FiRefreshCw /> 새로고침
        </button>
      </div>

      {/* 필터 */}
      <div className="card filter-card">
        <div className="filter-row">
          <div className="filter-group">
            <FiFilter />
            <label className="input-label">상태 필터</label>
          </div>
          <div className="filter-buttons">
            {[
              { value: 'ALL', label: '전체' },
              { value: 'PENDING', label: '대기 중' },
              { value: 'APPROVED', label: '승인됨' },
              { value: 'REJECTED', label: '반려됨' },
            ].map((btn) => (
              <button
                key={btn.value}
                className={`filter-btn ${filter === btn.value ? 'active' : ''}`}
                onClick={() => setFilter(btn.value)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 신청 목록 */}
      <div className="card">
        {loading ? (
          <LoadingSpinner text="휴가 신청 목록을 불러오는 중..." />
        ) : leaveRequests.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>신청자</th>
                  <th>휴가 유형</th>
                  <th>신청 날짜</th>
                  <th>사유</th>
                  <th>상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id} className={request.status === 'PENDING' ? 'pending-row' : ''}>
                    <td>
                      <div className="member-info">
                        <span className="member-name">{request.studentName || '알 수 없음'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="leave-type">{getLeaveTypeKorean(request.leaveType)}</span>
                    </td>
                    <td>{formatDate(request.startDate)}</td>
                    <td>
                      <div className="reason-cell" title={request.reason}>
                        {request.reason?.length > 30 
                          ? request.reason.substring(0, 30) + '...' 
                          : request.reason || '-'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                        {getLeaveStatusKorean(request.status)}
                      </span>
                    </td>
                    <td>
                      {request.status === 'PENDING' ? (
                        <div className="action-buttons">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(request.id)}
                            title="승인"
                          >
                            <FiCheck /> 승인
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => openRejectModal(request)}
                            title="반려"
                          >
                            <FiX /> 반려
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">처리 완료</span>
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
            <p>현재 조건에 맞는 휴가/조퇴 신청이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 반려 사유 모달 */}
      {rejectModalOpen && (
        <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">반려 사유 입력</h2>
            <p className="modal-subtitle">
              {selectedRequest?.studentName}님의 {getLeaveTypeKorean(selectedRequest?.leaveType)} 신청을 반려합니다.
            </p>
            <div className="input-group">
              <label className="input-label">반려 사유 *</label>
              <textarea
                className="input-field textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="반려 사유를 입력해주세요..."
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setRejectModalOpen(false)}
              >
                취소
              </button>
              <button 
                className="btn btn-error" 
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

