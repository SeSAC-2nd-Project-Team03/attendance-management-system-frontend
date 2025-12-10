import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { leaveAPI } from '../api/leave';
import { FiFileText, FiUpload, FiX } from 'react-icons/fi';
import { getTodayString } from '../utils/dateUtils';
import './LeaveRequestPage.css';

export default function LeaveRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    leaveDate: '',
    leaveType: '',
    reason: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const leaveTypes = [
    { value: 'SICK', label: '병가' },
    { value: 'PERSONAL', label: '개인 사유' },
    { value: 'OFFICIAL', label: '공가' },
    { value: 'EARLY_LEAVE', label: '조퇴' },
    { value: 'OTHER', label: '기타' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('이미지(jpg, png) 또는 PDF 파일만 첨부 가능합니다.');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.leaveDate || !formData.leaveType || !formData.reason) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      await leaveAPI.createLeaveRequest(user?.loginId || 'student1', formData, file);
      alert('휴가 신청이 완료되었습니다.');
      navigate('/my-leaves');
    } catch (err) {
      setError(err.response?.data?.message || '신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><FiFileText /> 휴가/조퇴 신청</h1>
        <p className="page-subtitle">휴가 또는 조퇴를 신청하세요</p>
      </div>

      <div className="card leave-form-card">
        <form onSubmit={handleSubmit} className="leave-form">
          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          <div className="input-group">
            <label className="input-label">휴가 날짜 *</label>
            <input
              type="date"
              name="leaveDate"
              className="input-field"
              value={formData.leaveDate}
              onChange={handleChange}
              min={getTodayString()}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">휴가 유형 *</label>
            <select
              name="leaveType"
              className="input-field"
              value={formData.leaveType}
              onChange={handleChange}
              required
            >
              <option value="">선택하세요</option>
              {leaveTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">사유 *</label>
            <textarea
              name="reason"
              className="input-field textarea"
              placeholder="휴가 사유를 입력하세요"
              value={formData.reason}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">증빙 서류 (선택)</label>
            <div className="file-upload">
              {file ? (
                <div className="file-preview">
                  <span className="file-name">{file.name}</span>
                  <button type="button" className="file-remove" onClick={removeFile}>
                    <FiX />
                  </button>
                </div>
              ) : (
                <label className="file-input-label">
                  <FiUpload />
                  <span>파일 선택 (이미지 또는 PDF)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

