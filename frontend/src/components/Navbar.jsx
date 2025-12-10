import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../api/notification';
import { FiLogOut, FiBell, FiUser, FiCheck, FiCheckCircle } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 알림 조회
  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getUnreadNotifications();
      const data = response?.data || response || [];
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error('알림 조회 실패:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // 30초마다 알림 새로고침
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 알림 읽음 처리
  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 알림 클릭 시 처리
  const handleNotificationClick = async (notification) => {
    await handleMarkAsRead(notification.id);
    setShowDropdown(false);
    
    // 알림 타입에 따라 페이지 이동
    if (notification.type === 'LEAVE_REQUEST') {
      navigate('/admin/leaves');
    } else if (notification.type === 'LEAVE_APPROVED' || notification.type === 'LEAVE_REJECTED') {
      navigate('/my-leaves');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  // 알림 타입에 따른 아이콘 색상
  const getNotificationColor = (type) => {
    switch (type) {
      case 'LEAVE_REQUEST': return '#f59e0b'; // 노란색
      case 'LEAVE_APPROVED': return '#10b981'; // 초록색
      case 'LEAVE_REJECTED': return '#ef4444'; // 빨간색
      default: return '#6366f1'; // 보라색
    }
  };

  // 시간 포맷
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return `${Math.floor(diff / 86400000)}일 전`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="brand-icon">📚</span>
          <span className="brand-text">출석 관리</span>
        </Link>
      </div>

      <div className="navbar-actions">
        {/* 알림 버튼 */}
        <div className="notification-container" ref={dropdownRef}>
          <button 
            className="navbar-btn notification-btn" 
            title="알림"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* 알림 드롭다운 */}
          {showDropdown && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>알림</h4>
                {unreadCount > 0 && (
                  <button 
                    className="mark-all-read-btn"
                    onClick={handleMarkAllAsRead}
                  >
                    <FiCheckCircle /> 모두 읽음
                  </button>
                )}
              </div>
              
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div 
                        className="notification-indicator"
                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                      />
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.content}</div>
                        <div className="notification-time">{formatTime(notification.createdAt)}</div>
                      </div>
                      {!notification.isRead && (
                        <button 
                          className="mark-read-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          <FiCheck />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">
                    <FiBell />
                    <p>새로운 알림이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="user-menu">
          <FiUser />
          <span className="user-name">{user?.name || '사용자'}님</span>
          <span className="user-role badge badge-info">
            {user?.role === 'ADMIN' ? '관리자' : '학생'}
          </span>
        </div>

        <button className="navbar-btn logout-btn" onClick={handleLogout} title="로그아웃">
          <FiLogOut />
        </button>
      </div>
    </nav>
  );
}
