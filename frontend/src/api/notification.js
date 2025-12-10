import api from './axios';

export const notificationAPI = {
  // 내 알림 목록 조회
  getMyNotifications: async () => {
    const response = await api.get('/notifications/me');
    return response.data;
  },

  // 읽지 않은 알림 조회
  getUnreadNotifications: async () => {
    const response = await api.get('/notifications/me/unread');
    return response.data;
  },

  // 읽지 않은 알림 개수
  getUnreadCount: async () => {
    const response = await api.get('/notifications/me/unread-count');
    return response.data;
  },

  // 알림 읽음 처리
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // 모든 알림 읽음 처리
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/me/read-all');
    return response.data;
  },
};

