import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../api/attendance';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getAttendanceStatusKorean, getTodayString } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import './MyAttendancePage.css';

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  const memberId = user?.memberId || 1;
  const courseId = 1;

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await attendanceAPI.getMyAttendance(memberId, courseId, selectedDate);
      setAttendance(data);
    } catch (error) {
      console.error('출석 조회 실패:', error);
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
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
        <h1 className="page-title"><FiCalendar /> 내 출석 현황</h1>
        <p className="page-subtitle">날짜별 출석 현황을 확인하세요</p>
      </div>

      <div className="card">
        {/* 날짜 선택 */}
        <div className="date-selector">
          <button className="btn btn-secondary btn-sm" onClick={() => changeDate(-1)}>
            <FiChevronLeft />
          </button>
          <input
            type="date"
            className="input-field date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getTodayString()}
          />
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => changeDate(1)}
            disabled={selectedDate >= getTodayString()}
          >
            <FiChevronRight />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="출석 정보를 불러오는 중..." />
        ) : attendance ? (
          <div className="attendance-detail">
            <div className="attendance-summary">
              <div className="summary-item">
                <span className="summary-label">최종 상태</span>
                <span className={`badge ${getStatusBadgeClass(attendance.finalStatus)}`}>
                  {getAttendanceStatusKorean(attendance.finalStatus) || '미등록'}
                </span>
              </div>
            </div>

            <div className="attendance-slots-detail">
              <div className="slot-detail">
                <div className="slot-header">
                  <span className="slot-emoji">🌅</span>
                  <span className="slot-name">아침 출석</span>
                </div>
                <div className="slot-body">
                  <span className={`badge ${getStatusBadgeClass(attendance.morningStatus)}`}>
                    {getAttendanceStatusKorean(attendance.morningStatus) || '-'}
                  </span>
                  {attendance.morningCheckTime && (
                    <span className="slot-time">{attendance.morningCheckTime}</span>
                  )}
                </div>
              </div>

              <div className="slot-detail">
                <div className="slot-header">
                  <span className="slot-emoji">☀️</span>
                  <span className="slot-name">점심 출석</span>
                </div>
                <div className="slot-body">
                  <span className={`badge ${getStatusBadgeClass(attendance.lunchStatus)}`}>
                    {getAttendanceStatusKorean(attendance.lunchStatus) || '-'}
                  </span>
                  {attendance.lunchCheckTime && (
                    <span className="slot-time">{attendance.lunchCheckTime}</span>
                  )}
                </div>
              </div>

              <div className="slot-detail">
                <div className="slot-header">
                  <span className="slot-emoji">🌙</span>
                  <span className="slot-name">저녁 출석</span>
                </div>
                <div className="slot-body">
                  <span className={`badge ${getStatusBadgeClass(attendance.dinnerStatus)}`}>
                    {getAttendanceStatusKorean(attendance.dinnerStatus) || '-'}
                  </span>
                  {attendance.dinnerCheckTime && (
                    <span className="slot-time">{attendance.dinnerCheckTime}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>출석 기록이 없습니다</h3>
            <p>해당 날짜의 출석 기록을 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

