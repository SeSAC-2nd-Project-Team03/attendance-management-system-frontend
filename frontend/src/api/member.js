import api from './axios';

export const memberAPI = {
  // 내 정보 조회
  getMyInfo: async () => {
    const response = await api.get('/members/me');
    return response.data;
  },

  // 내 정보 수정
  updateMyInfo: async (data) => {
    const response = await api.patch('/members/me', data);
    return response.data;
  },
};

