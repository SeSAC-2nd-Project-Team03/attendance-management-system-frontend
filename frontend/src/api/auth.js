import api from './axios';

export const authAPI = {
  // 로그인
  login: async (loginId, password) => {
    const response = await api.post('/auth/login', { loginId, password });
    const data = response.data.data || response.data;
    // 백엔드 응답: { accessToken, refreshToken, id, loginId, name, role }
    const { accessToken, refreshToken, id, name, role } = data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify({ 
      loginId, 
      name: name, 
      role: role,
      memberId: id  // 백엔드의 id를 memberId로 저장
    }));
    
    return { ...data, memberId: id };
  },

  // 로그아웃
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  // 현재 사용자 정보
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // 로그인 상태 확인
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  }
};

