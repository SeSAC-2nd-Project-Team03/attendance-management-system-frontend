import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // 로컬 스토리지에서 알림 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 최근 50개만 유지
        setNotifications(parsed.slice(0, 50));
      } catch (e) {
        console.error('알림 로드 실패:', e);
      }
    }
  }, []);

  // 알림이 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // 새 알림 추가
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
  };

  // 알림 읽음 처리
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // 알림 삭제
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 모든 알림 삭제
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

