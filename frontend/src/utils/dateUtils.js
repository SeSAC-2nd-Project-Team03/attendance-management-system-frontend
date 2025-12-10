export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getAttendanceTypeKorean = (type) => {
  const types = {
    MORNING: '아침',
    LUNCH: '점심',
    DINNER: '저녁',
  };
  return types[type] || type;
};

export const getAttendanceStatusKorean = (status) => {
  const statuses = {
    PRESENT: '출석',
    LATE: '지각',
    ABSENT: '결석',
    LEAVE: '조퇴',
    EARLY_LEAVE: '조퇴',
    EXCUSED: '공결',
    OFFICIAL_LEAVE: '공결',
  };
  return statuses[status] || status;
};

export const getLeaveTypeKorean = (type) => {
  const types = {
    SICK: '병가',
    PERSONAL: '개인 사유',
    OFFICIAL: '공가',
    EARLY_LEAVE: '조퇴',
    OTHER: '기타',
  };
  return types[type] || type;
};

export const getLeaveStatusKorean = (status) => {
  const statuses = {
    PENDING: '대기중',
    APPROVED: '승인',
    REJECTED: '반려',
    CANCELLED: '취소',
  };
  return statuses[status] || status;
};

