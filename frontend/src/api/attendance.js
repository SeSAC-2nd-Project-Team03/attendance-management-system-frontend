import api from './axios';

export const attendanceAPI = {
  // 출석 체크 (타입 지정)
  checkAttendance: async (memberId, courseId, type, inputNumber) => {
    const response = await api.post('/attendances', {
      memberId,
      courseId,
      type, // 'MORNING', 'LUNCH', 'DINNER'
      inputNumber,
    });
    return response.data;
  },

  // 자동 출석 체크 (시간 기반)
  checkAttendanceAuto: async (memberId, courseId, inputNumber) => {
    const response = await api.post('/attendances/auto', {
      memberId,
      courseId,
      inputNumber,
    });
    return response.data;
  },

  // 내 출석 조회 (morningStatus, lunchStatus, dinnerStatus 포함)
  getMyAttendance: async (memberId, courseId, date) => {
    const response = await api.get('/attendances/me', {
      params: { memberId, courseId, date }
    });
    return response.data;
  },

  // 특정 학생의 출석 상태 조회 (관리자용)
  getMemberAttendance: async (memberId, courseId, date) => {
    const response = await api.get('/attendances/me', {
      params: { memberId, courseId, date }
    });
    return response.data;
  },
};

