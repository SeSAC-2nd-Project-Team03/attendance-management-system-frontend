import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FiLogOut, FiBell, FiUser, FiCheck, FiTrash2, FiX } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAllNotifications } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      attendance: '✅',
      leave: '📝',
      notice: '📢',
      approved: '✅',
      rejected: '❌',
      info: 'ℹ️',
    };
    return icons[type] || '🔔';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
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
        <div className="notification-wrapper" ref={dropdownRef}>
          <button 
            className="navbar-btn" 
            title="알림"
            onClick={toggleNotifications}
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>알림</h3>
                <div className="notification-actions">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} title="모두 읽음">
                      <FiCheck /> 모두 읽음
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAllNotifications} title="모두 삭제">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>

              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 20).map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <span className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">{formatTime(notification.timestamp)}</span>
                      </div>
                      <button 
                        className="notification-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">
                    <span>🔔</span>
                    <p>알림이 없습니다</p>
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

