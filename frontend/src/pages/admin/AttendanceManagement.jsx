import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import { attendanceAPI } from '../../api/attendance';
import { FiCheckSquare, FiSearch, FiDownload, FiEdit2, FiRefreshCw } from 'react-icons/fi';
import { getTodayString, getAttendanceStatusKorean } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AttendanceManagement.css';

// 출석 마감 시간 설정 (기본값)
const ATTENDANCE_DEADLINES = {
  MORNING: { hour: 10, minute: 0 },   // 아침 출석 마감: 10:00
  LUNCH: { hour: 14, minute: 0 },      // 점심 출석 마감: 14:00
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
            overallStatus: attendanceData?.overallStatus || null,
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
            overallStatus: null,
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

  const handleStatusChange = async (id) => {
    if (!id) {
      alert('출석 ID가 없습니다.');
      return;
    }
    
    if (!window.confirm('출석 상태를 출석으로 변경하시겠습니까?')) return;
    
    try {
      await adminAPI.changeAttendanceStatus(id);
      alert('상태가 변경되었습니다.');
      loadAttendances();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownload = async (type) => {
    try {
      const blob = await adminAPI.downloadAttendance(type, filters.date, filters.courseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${filters.date}.${type === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('다운로드 실패');
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
                  let overallStatus = att.overallStatus;
                  if (!overallStatus) {
                    // 모든 시간대가 결석이면 결석, 일부만 결석이면 부분 결석
                    const statuses = [morningStatus, lunchStatus, dinnerStatus].filter(Boolean);
                    if (statuses.length > 0 && statuses.every(s => s === 'ABSENT')) {
                      overallStatus = 'ABSENT';
                    } else if (statuses.some(s => s === 'ABSENT')) {
                      overallStatus = 'EARLY_LEAVE'; // 일부 결석 = 조퇴로 표시
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
                        <span className={`badge ${getStatusBadgeClass(overallStatus)}`}>
                          {getAttendanceStatusKorean(overallStatus) || '-'}
                        </span>
                      </td>
                      <td>
                        {att.dailyAttendanceId && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusChange(att.dailyAttendanceId)}
                            title="출석으로 변경"
                          >
                            <FiEdit2 /> 상태 변경
                          </button>
                        )}
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
    </div>
  );
}
