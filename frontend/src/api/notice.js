import api from './axios';

export const noticeAPI = {
  // 공지사항 목록 조회
  getNotices: async (page = 0, size = 10) => {
    const response = await api.get('/notices', {
      params: { page, size, sort: 'createdAt,desc' }
    });
    return response.data;
  },

  // 공지사항 상세 조회
  getNotice: async (id) => {
    const response = await api.get(`/notices/${id}`);
    return response.data;
  },

  // 팝업 공지 조회
  getPopupNotices: async () => {
    const response = await api.get('/notices/popups');
    return response.data;
  },
};

