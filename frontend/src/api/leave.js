import api from './axios';

export const leaveAPI = {
  // 휴가 신청
  createLeaveRequest: async (studentLoginId, data, file) => {
    const formData = new FormData();
    formData.append('leaveDate', data.leaveDate);
    formData.append('reason', data.reason);
    formData.append('leaveType', data.leaveType);
    if (file) {
      formData.append('evidenceFile', file);
    }

    const response = await api.post('/leave-requests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Student-Login-Id': studentLoginId,
      },
    });
    return response.data;
  },

  // 내 신청 내역 조회
  getMyLeaveRequests: async (studentLoginId) => {
    const response = await api.get('/leave-requests/me', {
      headers: { 'Student-Login-Id': studentLoginId },
    });
    return response.data;
  },

  // 신청 취소
  cancelLeaveRequest: async (id, studentLoginId) => {
    const response = await api.delete(`/leave-requests/${id}`, {
      headers: { 'Student-Login-Id': studentLoginId },
    });
    return response.data;
  },
};

