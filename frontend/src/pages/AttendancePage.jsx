import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../api/attendance';
import { FiCheckCircle, FiClock, FiHash } from 'react-icons/fi';
import { getAttendanceTypeKorean } from '../utils/dateUtils';
import './AttendancePage.css';

export default function AttendancePage() {
  const { user } = useAuth();
  const [inputNumber, setInputNumber] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [useAuto, setUseAuto] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const memberId = user?.memberId || 1;
  const courseId = 1;

  const getCurrentSlot = () => {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const time = hour * 60 + minute;
    
    if (time >= 520 && time <= 560) return 'MORNING';
    if (time >= 730 && time <= 770) return 'LUNCH';
    if (time >= 1050 && time <= 1090) return 'DINNER';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputNumber || inputNumber.length !== 4) {
      setResult({ success: false, message: '4자리 인증번호를 입력해주세요.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let response;
      
      if (useAuto) {
        response = await attendanceAPI.checkAttendanceAuto(memberId, courseId, inputNumber);
      } else {
        if (!selectedType) {
          setResult({ success: false, message: '출석 유형을 선택해주세요.' });
          setLoading(false);
          return;
        }
        response = await attendanceAPI.checkAttendance(memberId, courseId, selectedType, inputNumber);
      }

      setResult(response);
      if (response.success) {
        setInputNumber('');
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || '출석 체크 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentSlot = getCurrentSlot();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><FiCheckCircle /> 출석 체크</h1>
        <p className="page-subtitle">인증번호를 입력하여 출석을 체크하세요</p>
      </div>

      <div className="attendance-container">
        <div className="card attendance-card">
          <div className="time-info">
            <FiClock className="time-icon" />
            <div>
              <h3>현재 시간</h3>
              <p className="current-time">{new Date().toLocaleTimeString('ko-KR')}</p>
            </div>
            {currentSlot && (
              <span className="current-slot badge badge-success">
                {getAttendanceTypeKorean(currentSlot)} 출석 시간
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="attendance-form">
            <div className="mode-toggle">
              <button
                type="button"
                className={`toggle-btn ${useAuto ? 'active' : ''}`}
                onClick={() => setUseAuto(true)}
              >
                자동 감지
              </button>
              <button
                type="button"
                className={`toggle-btn ${!useAuto ? 'active' : ''}`}
                onClick={() => setUseAuto(false)}
              >
                수동 선택
              </button>
            </div>

            {!useAuto && (
              <div className="type-selector">
                {['MORNING', 'LUNCH', 'DINNER'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`type-btn ${selectedType === type ? 'active' : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    {getAttendanceTypeKorean(type)}
                  </button>
                ))}
              </div>
            )}

            <div className="input-group code-input-group">
              <label className="input-label">
                <FiHash /> 인증번호 4자리
              </label>
              <input
                type="text"
                className="input-field code-input"
                placeholder="0000"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? '처리 중...' : '출석 체크'}
            </button>
          </form>

          {result && (
            <div className={`result-box ${result.success ? 'success' : 'error'}`}>
              <div className="result-icon">
                {result.success ? '✅' : '❌'}
              </div>
              <p className="result-message">{result.message}</p>
              {result.checkTime && (
                <p className="result-time">체크 시간: {result.checkTime}</p>
              )}
            </div>
          )}
        </div>

        <div className="card info-card">
          <h3>📌 출석 체크 안내</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">아침 출석</span>
              <span className="info-value">08:40 ~ 09:20</span>
              <span className="info-code">인증번호: 1234</span>
            </div>
            <div className="info-item">
              <span className="info-label">점심 출석</span>
              <span className="info-value">12:10 ~ 12:50</span>
              <span className="info-code">인증번호: 5678</span>
            </div>
            <div className="info-item">
              <span className="info-label">저녁 출석</span>
              <span className="info-value">17:30 ~ 18:10</span>
              <span className="info-code">인증번호: 9012</span>
            </div>
          </div>

          <div className="status-guide">
            <h4>출석 상태</h4>
            <ul>
              <li><span className="badge badge-success">출석</span> 기준 시간 이전 체크</li>
              <li><span className="badge badge-warning">지각</span> 기준 시간 이후 체크</li>
              <li><span className="badge badge-error">결석</span> 출석 시간 초과 미체크</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

