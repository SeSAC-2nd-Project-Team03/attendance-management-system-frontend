import api from './axios';

export const attendanceConfigAPI = {
  // 출석 설정 목록 조회 (과정별)
  getConfigs: async (courseId) => {
    const response = await api.get('/admin/attendance-configs', {
      params: { courseId }
    });
    return response.data;
  },

  // 출석 설정 상세 조회
  getConfig: async (id) => {
    const response = await api.get(`/admin/attendance-configs/${id}`);
    return response.data;
  },

  // 출석 설정 생성
  createConfig: async (data) => {
    const response = await api.post('/admin/attendance-configs', data);
    return response.data;
  },

  // 출석 설정 수정
  updateConfig: async (id, data) => {
    const response = await api.patch(`/admin/attendance-configs/${id}`, data);
    return response.data;
  },

  // 인증번호만 수정
  updateAuthNumber: async (id, authNumber) => {
    const response = await api.patch(`/admin/attendance-configs/${id}/auth-number`, {
      authNumber
    });
    return response.data;
  },

  // 출석 설정 삭제
  deleteConfig: async (id) => {
    const response = await api.delete(`/admin/attendance-configs/${id}`);
    return response.data;
  },
};

