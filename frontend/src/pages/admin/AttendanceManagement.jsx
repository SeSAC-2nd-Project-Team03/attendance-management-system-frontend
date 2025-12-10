import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import { attendanceAPI } from '../../api/attendance';
import { FiCheckSquare, FiSearch, FiDownload, FiEdit2, FiRefreshCw, FiX } from 'react-icons/fi';
import { getTodayString, getAttendanceStatusKorean } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AttendanceManagement.css';

// 출석 상태 옵션
const ATTENDANCE_STATUS_OPTIONS = [
  { value: '', label: '변경 안 함', color: '#94a3b8' },
  { value: 'PRESENT', label: '출석', color: '#10b981' },
  { value: 'LATE', label: '지각', color: '#f59e0b' },
  { value: 'ABSENT', label: '결석', color: '#ef4444' },
  { value: 'EARLY_LEAVE', label: '조퇴', color: '#f59e0b' },
  { value: 'OFFICIAL_LEAVE', label: '공결', color: '#6366f1' },
];

// 출석 마감 시간 설정 (기본값)
const ATTENDANCE_DEADLINES = {
  MORNING: { hour: 10, minute: 0 },   // 아침 출석 마감: 10:00
  LUNCH: { hour: 13, minute: 0 },      // 점심 출석 마감: 13:00
  DINNER: { hour: 19, minute: 0 },     // 저녁 출석 마감: 19:00
};

// 지난 시간대인지 확인하는 함수
const isPastDeadline = (type, selectedDate) => {
  const now = new Date();
  const today = getTodayString();
  
  // 선택한 날짜가 오늘 이전이면 모든 시간대가 지남
  if (selectedDate < today) {
    return true;
  }
  
  // 선택한 날짜가 오늘 이후면 아직 안 지남
  if (selectedDate > today) {
    return false;
  }
  
  // 오늘인 경우 현재 시간과 마감 시간 비교
  const deadline = ATTENDANCE_DEADLINES[type];
  if (!deadline) return false;
  
  const deadlineTime = new Date();
  deadlineTime.setHours(deadline.hour, deadline.minute, 0, 0);
  
  return now > deadlineTime;
};

// 출석 상태 결정 함수 (미출석 + 마감 지남 = 결석)
const determineStatus = (status, type, selectedDate) => {
  if (status) return status; // 이미 상태가 있으면 그대로 반환
  
  // 마감 시간이 지났으면 결석 처리
  if (isPastDeadline(type, selectedDate)) {
    return 'ABSENT';
  }
  
  return null; // 아직 시간이 안 됨
};

export default function AttendanceManagement() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: getTodayString(),
    courseId: 1,
  });
  
  // 상태 변경 모달
  const [statusModal, setStatusModal] = useState({
    open: false,
    student: null,
    morningStatus: '',
    lunchStatus: '',
    dinnerStatus: '',
    overallStatus: '',
  });

  useEffect(() => {
    loadAttendances();
  }, []);

  const loadAttendances = async () => {
    setLoading(true);
    try {
      // 1. 해당 과정의 수강생 목록을 가져옴
      const enrollmentResponse = await adminAPI.getEnrollments(filters.courseId);
      const enrollments = enrollmentResponse?.data || enrollmentResponse || [];
      console.log('수강생 목록:', enrollments);
      
      if (enrollments.length === 0) {
        setAttendances([]);
        return;
      }
      
      // 2. 각 수강생의 출석 상태를 개별 조회 (morningStatus, lunchStatus, dinnerStatus 포함)
      const attendancePromises = enrollments.map(async (enrollment) => {
        const member = enrollment.member || {};
        const memberId = member.id || enrollment.memberId;
        const memberName = member.name || enrollment.memberName || '이름 없음';
        
        try {
          // 학생 출석 조회 API 호출 (MyAttendanceResponse 반환)
          const response = await attendanceAPI.getMemberAttendance(
            memberId, 
            filters.courseId, 
            filters.date
          );
          
          // ApiResponse에서 data 필드 추출
          const attendanceData = response?.data || response;
          console.log(`${memberName} 출석 데이터:`, attendanceData);
          
          return {
            memberId,
            memberName,
            courseId: filters.courseId,
            courseName: enrollment.course?.courseName || '',
            dailyAttendanceId: attendanceData?.dailyAttendanceId || memberId, // dailyAttendanceId가 없으면 memberId 사용
            morningStatus: attendanceData?.morningStatus || null,
            lunchStatus: attendanceData?.lunchStatus || null,
            dinnerStatus: attendanceData?.dinnerStatus || null,
            finalStatus: attendanceData?.overallStatus || attendanceData?.status || null,
          };
        } catch (error) {
          // 출석 기록이 없는 경우
          console.log(`${memberName} 출석 기록 없음`);
          return {
            memberId,
            memberName,
            courseId: filters.courseId,
            courseName: enrollment.course?.courseName || '',
            dailyAttendanceId: null,
            morningStatus: null,
            lunchStatus: null,
            dinnerStatus: null,
            finalStatus: null,
          };
        }
      });
      
      const processedData = await Promise.all(attendancePromises);
      console.log('최종 처리된 데이터:', processedData);
      setAttendances(processedData);
    } catch (error) {
      console.error('출석 데이터 로드 실패:', error);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadAttendances();
  };

  // 상태 변경 모달 열기
  const openStatusModal = (student) => {
    setStatusModal({
      open: true,
      student,
      morningStatus: '',
      lunchStatus: '',
      dinnerStatus: '',
      overallStatus: '',
    });
  };

  // 상태 변경 모달 닫기
  const closeStatusModal = () => {
    setStatusModal({
      open: false,
      student: null,
      morningStatus: '',
      lunchStatus: '',
      dinnerStatus: '',
      overallStatus: '',
    });
  };

  // 상태 변경 저장
  const handleStatusSave = async () => {
    const { student, morningStatus, lunchStatus, dinnerStatus, overallStatus } = statusModal;
    
    if (!student?.memberId) {
      alert('회원 ID가 없습니다.');
      return;
    }

    // 최소 하나는 변경해야 함
    if (!morningStatus && !lunchStatus && !dinnerStatus && !overallStatus) {
      alert('최소 하나의 상태를 선택해주세요.');
      return;
    }

    try {
      await adminAPI.updateAttendanceStatus({
        memberId: student.memberId,
        courseId: filters.courseId,
        date: filters.date,
        morningStatus: morningStatus || null,
        lunchStatus: lunchStatus || null,
        dinnerStatus: dinnerStatus || null,
        overallStatus: overallStatus || null,
      });
      
      alert('상태가 변경되었습니다.');
      closeStatusModal();
      loadAttendances();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  // 빠른 전체 출석 처리 (기존 기능 유지)
  const handleQuickPresent = async (memberId) => {
    if (!memberId) {
      alert('회원 ID가 없습니다.');
      return;
    }
    
    if (!window.confirm('전체 출석으로 변경하시겠습니까?')) return;
    
    try {
      await adminAPI.changeAttendanceStatusByMember(memberId, filters.courseId, filters.date);
      alert('상태가 변경되었습니다.');
      loadAttendances();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownload = async (type) => {
    try {
      const response = await adminAPI.downloadAttendance(type, filters.date, filters.courseId);
      
      // Blob 타입 명시
      const mimeType = type === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';
      const blob = new Blob([response], { type: mimeType });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${filters.date}.${type === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('다운로드 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      PRESENT: 'badge-success',
      LATE: 'badge-warning',
      ABSENT: 'badge-error',
      EARLY_LEAVE: 'badge-warning',
      EXCUSED: 'badge-info',
    };
    return classes[status] || 'badge-pending';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiCheckSquare /> 출석 관리</h1>
          <p className="page-subtitle">출석 현황을 조회하고 관리합니다</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => handleDownload('csv')}>
            <FiDownload /> CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleDownload('excel')}>
            <FiDownload /> Excel
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="card filter-card">
        <div className="filter-row">
          <div className="input-group filter-group">
            <label className="input-label">날짜</label>
            <input
              type="date"
              className="input-field"
              value={filters.date}
              onChange={(e) => setFilters({...filters, date: e.target.value})}
            />
          </div>
          <div className="input-group filter-group">
            <label className="input-label">과정 ID</label>
            <input
              type="number"
              className="input-field"
              value={filters.courseId}
              onChange={(e) => setFilters({...filters, courseId: Number(e.target.value)})}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>
            <FiSearch /> 조회
          </button>
          <button className="btn btn-secondary" onClick={loadAttendances} title="실시간 새로고침">
            <FiRefreshCw /> 새로고침
          </button>
        </div>
      </div>

      {/* 출석 목록 */}
      <div className="card">
        {loading ? (
          <LoadingSpinner text="출석 데이터를 불러오는 중..." />
        ) : attendances.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>학생명</th>
                  <th>아침</th>
                  <th>점심</th>
                  <th>저녁</th>
                  <th>최종 상태</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((att, index) => {
                  // 각 시간대별 상태 결정 (미출석 + 마감 지남 = 결석)
                  const morningStatus = determineStatus(att.morningStatus, 'MORNING', filters.date);
                  const lunchStatus = determineStatus(att.lunchStatus, 'LUNCH', filters.date);
                  const dinnerStatus = determineStatus(att.dinnerStatus, 'DINNER', filters.date);
                  
                  // 최종 상태 결정: 원래 상태가 있으면 사용, 없으면 시간대별 결석 여부로 계산
                  let finalStatus = att.finalStatus;
                  if (!finalStatus) {
                    // 모든 시간대가 결석이면 결석, 일부만 결석이면 부분 결석
                    const statuses = [morningStatus, lunchStatus, dinnerStatus].filter(Boolean);
                    if (statuses.length > 0 && statuses.every(s => s === 'ABSENT')) {
                      finalStatus = 'ABSENT';
                    } else if (statuses.some(s => s === 'ABSENT')) {
                      finalStatus = 'EARLY_LEAVE'; // 일부 결석 = 조퇴로 표시
                    }
                  }
                  
                  return (
                    <tr key={att.dailyAttendanceId || att.memberId || index}>
                      <td>{att.memberName || '이름 없음'}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(morningStatus)}`}>
                          {getAttendanceStatusKorean(morningStatus) || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(lunchStatus)}`}>
                          {getAttendanceStatusKorean(lunchStatus) || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(dinnerStatus)}`}>
                          {getAttendanceStatusKorean(dinnerStatus) || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(finalStatus)}`}>
                          {getAttendanceStatusKorean(finalStatus) || '-'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openStatusModal(att)}
                            title="상태 개별 변경"
                          >
                            <FiEdit2 /> 상태 변경
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>수강생이 없습니다</h3>
            <p>해당 과정에 등록된 수강생이 없습니다.</p>
            <p className="hint">과정 ID를 확인해주세요. (기본 과정 ID: 1)</p>
          </div>
        )}
      </div>

      {/* 상태 변경 모달 */}
      {statusModal.open && statusModal.student && (
        <div className="modal-overlay" onClick={closeStatusModal}>
          <div className="modal-content status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                📝 출석 상태 변경
              </h2>
              <button className="modal-close" onClick={closeStatusModal}>
                <FiX />
              </button>
            </div>
            
            <div className="student-info-box">
              <span className="student-name">{statusModal.student.memberName}</span>
              <span className="student-date">{filters.date}</span>
            </div>

            <div className="current-status-box">
              <h4>현재 상태</h4>
              <div className="current-status-grid">
                <div className="status-item">
                  <span className="status-label">🌅 아침</span>
                  <span className={`badge ${getStatusBadgeClass(statusModal.student.morningStatus)}`}>
                    {getAttendanceStatusKorean(statusModal.student.morningStatus) || '-'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">☀️ 점심</span>
                  <span className={`badge ${getStatusBadgeClass(statusModal.student.lunchStatus)}`}>
                    {getAttendanceStatusKorean(statusModal.student.lunchStatus) || '-'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">🌙 저녁</span>
                  <span className={`badge ${getStatusBadgeClass(statusModal.student.dinnerStatus)}`}>
                    {getAttendanceStatusKorean(statusModal.student.dinnerStatus) || '-'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">📊 최종</span>
                  <span className={`badge ${getStatusBadgeClass(statusModal.student.finalStatus)}`}>
                    {getAttendanceStatusKorean(statusModal.student.finalStatus) || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="status-change-form">
              <h4>변경할 상태 선택</h4>
              <p className="hint">"변경 안 함"은 기존 상태를 유지합니다.</p>
              
              <div className="status-select-grid">
                <div className="status-select-item">
                  <label>🌅 아침</label>
                  <select
                    value={statusModal.morningStatus}
                    onChange={(e) => setStatusModal({...statusModal, morningStatus: e.target.value})}
                    className="status-select"
                  >
                    {ATTENDANCE_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="status-select-item">
                  <label>☀️ 점심</label>
                  <select
                    value={statusModal.lunchStatus}
                    onChange={(e) => setStatusModal({...statusModal, lunchStatus: e.target.value})}
                    className="status-select"
                  >
                    {ATTENDANCE_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="status-select-item">
                  <label>🌙 저녁</label>
                  <select
                    value={statusModal.dinnerStatus}
                    onChange={(e) => setStatusModal({...statusModal, dinnerStatus: e.target.value})}
                    className="status-select"
                  >
                    {ATTENDANCE_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="status-select-item overall">
                  <label>📊 전체 상태 (직접 지정)</label>
                  <select
                    value={statusModal.overallStatus}
                    onChange={(e) => setStatusModal({...statusModal, overallStatus: e.target.value})}
                    className="status-select"
                  >
                    {ATTENDANCE_STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <small className="select-hint">비워두면 시간대별 상태로 자동 계산</small>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeStatusModal}>
                취소
              </button>
              <button 
                className="btn btn-success"
                onClick={() => handleQuickPresent(statusModal.student.memberId)}
              >
                전체 출석 처리
              </button>
              <button className="btn btn-primary" onClick={handleStatusSave}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
