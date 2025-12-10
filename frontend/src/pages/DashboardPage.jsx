import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../api/attendance';
import { noticeAPI } from '../api/notice';
import { 
  FiCheckCircle, FiClock, FiXCircle, FiCalendar,
  FiArrowRight, FiBell, FiFileText, FiX 
} from 'react-icons/fi';
import { formatDate, getTodayString, getAttendanceStatusKorean } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [recentNotices, setRecentNotices] = useState([]);
  const [popupNotices, setPopupNotices] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const memberId = user?.memberId || 1;
      const courseId = 1;
      
      const [attendanceRes, noticesRes, popupRes] = await Promise.all([
        attendanceAPI.getMyAttendance(memberId, courseId, getTodayString()).catch(() => null),
        noticeAPI.getNotices(0, 5).catch(() => ({ content: [] })),
        noticeAPI.getPopupNotices().catch(() => []),
      ]);

      if (attendanceRes) {
        setTodayAttendance(attendanceRes);
      }
      setRecentNotices(noticesRes.content || noticesRes || []);
      
      // 팝업 공지사항 처리
      const popups = popupRes?.data || popupRes || [];
      if (popups.length > 0) {
        // 오늘 닫은 팝업 확인 (전체 팝업에 대해)
        const closedAllPopups = localStorage.getItem('closedAllPopupsDate');
        const today = getTodayString();
        
        // 오늘 전체 닫기를 하지 않은 경우에만 표시
        if (closedAllPopups !== today) {
          setPopupNotices(popups);
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('대시보드 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 팝업 닫기 (오늘 하루 안 보기)
  const handleClosePopupToday = () => {
    localStorage.setItem('closedAllPopupsDate', getTodayString());
    setShowPopup(false);
  };

  // 팝업 바로 닫기
  const handleClosePopupNow = () => {
    setShowPopup(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  };

  const getCurrentAttendanceSlot = () => {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const time = hour * 60 + minute;
    
    if (time >= 520 && time <= 560) return { type: 'MORNING', label: '아침 출석', code: '1234' };
    if (time >= 730 && time <= 770) return { type: 'LUNCH', label: '점심 출석', code: '5678' };
    if (time >= 1050 && time <= 1090) return { type: 'DINNER', label: '저녁 출석', code: '9012' };
    return null;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentSlot = getCurrentAttendanceSlot();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👋 {getGreeting()}</h1>
        <p className="page-subtitle">{user?.name || '학생'}님, 오늘도 화이팅!</p>
      </div>

      {/* 빠른 출석 체크 카드 */}
      <div className="quick-attendance-card card">
        <div className="quick-attendance-header">
          <div>
            <h2>📍 오늘의 출석</h2>
            <p>{formatDate(new Date())}</p>
          </div>
          {currentSlot && (
            <Link to="/attendance" className="btn btn-primary">
              <FiCheckCircle /> 출석하기
            </Link>
          )}
        </div>

        <div className="attendance-slots">
          <div className={`slot ${todayAttendance?.morningStatus === 'PRESENT' ? 'done' : ''}`}>
            <span className="slot-time">09:00</span>
            <span className="slot-label">아침</span>
            <span className={`slot-status ${todayAttendance?.morningStatus?.toLowerCase() || ''}`}>
              {todayAttendance?.morningStatus ? getAttendanceStatusKorean(todayAttendance.morningStatus) : '-'}
            </span>
          </div>
          <div className={`slot ${todayAttendance?.lunchStatus === 'PRESENT' ? 'done' : ''}`}>
            <span className="slot-time">12:30</span>
            <span className="slot-label">점심</span>
            <span className={`slot-status ${todayAttendance?.lunchStatus?.toLowerCase() || ''}`}>
              {todayAttendance?.lunchStatus ? getAttendanceStatusKorean(todayAttendance.lunchStatus) : '-'}
            </span>
          </div>
          <div className={`slot ${todayAttendance?.dinnerStatus === 'PRESENT' ? 'done' : ''}`}>
            <span className="slot-time">17:50</span>
            <span className="slot-label">저녁</span>
            <span className={`slot-status ${todayAttendance?.dinnerStatus?.toLowerCase() || ''}`}>
              {todayAttendance?.dinnerStatus ? getAttendanceStatusKorean(todayAttendance.dinnerStatus) : '-'}
            </span>
          </div>
        </div>

        {currentSlot && (
          <div className="current-slot-info">
            <FiClock />
            <span>현재 <strong>{currentSlot.label}</strong> 시간입니다!</span>
          </div>
        )}
      </div>

      {/* 통계 */}
      <div className="grid grid-4 dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><FiCalendar /></div>
          <div className="stat-content">
            <h3>15</h3>
            <p>이번 달 출석일</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><FiCheckCircle /></div>
          <div className="stat-content">
            <h3>95%</h3>
            <p>출석률</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><FiClock /></div>
          <div className="stat-content">
            <h3>2</h3>
            <p>지각</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon error"><FiXCircle /></div>
          <div className="stat-content">
            <h3>0</h3>
            <p>결석</p>
          </div>
        </div>
      </div>

      {/* 퀵 액션 & 공지사항 */}
      <div className="grid grid-2">
        {/* 퀵 액션 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🚀 빠른 메뉴</h3>
          </div>
          <div className="quick-actions">
            <Link to="/attendance" className="quick-action">
              <FiCheckCircle className="action-icon" />
              <span>출석 체크</span>
              <FiArrowRight />
            </Link>
            <Link to="/my-attendance" className="quick-action">
              <FiCalendar className="action-icon" />
              <span>출석 현황</span>
              <FiArrowRight />
            </Link>
            <Link to="/leave-request" className="quick-action">
              <FiFileText className="action-icon" />
              <span>휴가 신청</span>
              <FiArrowRight />
            </Link>
            <Link to="/notices" className="quick-action">
              <FiBell className="action-icon" />
              <span>공지사항</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* 최근 공지사항 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📢 최근 공지사항</h3>
            <Link to="/notices" className="btn btn-sm btn-outline">전체보기</Link>
          </div>
          <div className="notice-list">
            {recentNotices.length > 0 ? (
              recentNotices.slice(0, 5).map((notice) => (
                <Link key={notice.id} to={`/notices/${notice.id}`} className="notice-item">
                  <span className="notice-title">{notice.title}</span>
                  <span className="notice-date">{formatDate(notice.createdAt)}</span>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                <p>등록된 공지사항이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 팝업 공지사항 모달 */}
      {showPopup && popupNotices.length > 0 && (
        <div className="popup-overlay">
          <div className="popup-modal">
            <div className="popup-header">
              <span className="popup-badge">📢 공지사항 ({popupNotices.length}건)</span>
              <button className="popup-close-btn" onClick={handleClosePopupNow}>
                <FiX />
              </button>
            </div>
            <div className="popup-scroll-content">
              {popupNotices.map((notice, index) => (
                <div key={notice.id} className="popup-notice-item">
                  {index > 0 && <div className="popup-divider" />}
                  <div className="popup-notice-header">
                    <span className="popup-notice-number">{index + 1}</span>
                    <h3 className="popup-notice-title">{notice.title}</h3>
                  </div>
                  <div 
                    className="popup-notice-body"
                    dangerouslySetInnerHTML={{ __html: notice.content }}
                  />
                  <Link 
                    to={`/notices/${notice.id}`}
                    className="popup-detail-link"
                    onClick={() => setShowPopup(false)}
                  >
                    자세히 보기 →
                  </Link>
                </div>
              ))}
            </div>
            <div className="popup-footer">
              <button 
                className="btn btn-secondary"
                onClick={handleClosePopupToday}
              >
                오늘 하루 안 보기
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleClosePopupNow}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

