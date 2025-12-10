import api from './axios';

export const adminAPI = {
  // ===== 회원 관리 =====
  // 전체 회원 조회
  getAllMembers: async () => {
    const response = await api.get('/admin/members');
    return response.data;
  },

  // 회원 생성
  createMember: async (data) => {
    const response = await api.post('/admin/members', data);
    return response.data;
  },

  // 회원 조회
  getMember: async (loginId) => {
    const response = await api.get(`/admin/members/${loginId}`);
    return response.data;
  },

  // 회원 수정
  updateMember: async (loginId, data) => {
    const response = await api.patch(`/admin/members/${loginId}`, data);
    return response.data;
  },

  // 회원 삭제
  deleteMember: async (loginId) => {
    const response = await api.delete(`/admin/members/${loginId}`);
    return response.data;
  },

  // ===== 출석 관리 =====
  // 과정별 수강생 조회
  getEnrollments: async (courseId) => {
    const response = await api.get('/admin/enrollment', {
      params: { courseId }
    });
    return response.data;
  },

  // 통합 출석부 조회 (ResponseByDateAndCourseIdDTO 반환)
  getAttendances: async (date, courseId) => {
    const response = await api.get('/admin/attendances', {
      params: { date, courseId }  // 백엔드는 @RequestParam LocalDate date 사용
    });
    return response.data;
  },

  // 전체 출석 현황 조회
  getDailyAttendance: async (workDate, courseId) => {
    const response = await api.get('/admin/daily-attendance', {
      params: { workDate, courseId }
    });
    return response.data;
  },

  // 출석 상태 변경 (dailyAttendanceId 기반)
  changeAttendanceStatus: async (id) => {
    const response = await api.patch(`/attendances/admin/${id}`);
    return response.data;
  },

  // 출석 상태 변경 (memberId 기반) - dailyAttendanceId가 없어도 동작
  changeAttendanceStatusByMember: async (memberId, courseId, date) => {
    const response = await api.patch(`/attendances/admin/member/${memberId}`, null, {
      params: { courseId, date }
    });
    return response.data;
  },

  // 출석 상태 개별 변경 (아침/점심/저녁/전체 각각 변경)
  updateAttendanceStatus: async (data) => {
    const response = await api.put('/attendances/admin/status', data);
    return response.data;
  },

  // 조퇴/결석 승인
  approveLeave: async (id) => {
    const response = await api.patch(`/admin/leaves/${id}`);
    return response.data;
  },

  // 출석부 다운로드
  downloadAttendance: async (downloadType, workDate, courseId) => {
    const response = await api.get('/attendances/admin/export', {
      params: { downloadType, workDate, courseId },
      responseType: 'blob'
    });
    return response.data;
  },

  // ===== 공지사항 관리 =====
  // 공지사항 생성
  createNotice: async (data) => {
    const response = await api.post('/admin/notices', data);
    return response.data;
  },

  // 공지사항 수정
  updateNotice: async (id, data) => {
    const response = await api.put(`/admin/notices/${id}`, data);
    return response.data;
  },

  // 공지사항 삭제
  deleteNotice: async (id) => {
    const response = await api.delete(`/admin/notices/${id}`);
    return response.data;
  },

  // ===== 휴가 관리 =====
  // 휴가 승인
  approveLeaveRequest: async (id, adminLoginId) => {
    const response = await api.patch(`/leave-requests/${id}/approve`, null, {
      headers: { 'Admin-Login-Id': adminLoginId }
    });
    return response.data;
  },

  // 휴가 반려
  rejectLeaveRequest: async (id, adminLoginId, reason) => {
    const response = await api.patch(`/leave-requests/${id}/reject`, null, {
      params: { reason },
      headers: { 'Admin-Login-Id': adminLoginId }
    });
    return response.data;
  },
};

