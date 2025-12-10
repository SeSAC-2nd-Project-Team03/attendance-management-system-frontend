import { useState, useEffect } from 'react';
import { attendanceConfigAPI } from '../../api/attendanceConfig';
import { FiSettings, FiEdit2, FiTrash2, FiPlus, FiRefreshCw, FiClock, FiKey } from 'react-icons/fi';
import { getTodayString } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AttendanceConfigManagement.css';

const ATTENDANCE_TYPES = {
  MORNING: { label: '아침', icon: '🌅', color: '#f59e0b' },
  LUNCH: { label: '점심', icon: '☀️', color: '#10b981' },
  DINNER: { label: '저녁', icon: '🌙', color: '#6366f1' },
};

export default function AttendanceConfigManagement() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState(1);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [editModal, setEditModal] = useState({ open: false, config: null });
  const [createModal, setCreateModal] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, [courseId]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await attendanceConfigAPI.getConfigs(courseId);
      const data = response?.data || response || [];
      // 날짜별로 정렬
      data.sort((a, b) => new Date(b.targetDate) - new Date(a.targetDate));
      setConfigs(data);
    } catch (error) {
      console.error('출석 설정 조회 실패:', error);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  // 선택한 날짜의 설정만 필터링
  const filteredConfigs = configs.filter(c => c.targetDate === selectedDate);

  // 인증번호 수정
  const handleUpdateAuthNumber = async (id, newAuthNumber) => {
    if (!newAuthNumber || newAuthNumber.length !== 4) {
      alert('인증번호는 4자리여야 합니다.');
      return;
    }
    try {
      await attendanceConfigAPI.updateAuthNumber(id, newAuthNumber);
      alert('인증번호가 변경되었습니다.');
      loadConfigs();
    } catch (error) {
      alert('인증번호 변경 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  // 설정 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('이 출석 설정을 삭제하시겠습니까?')) return;
    try {
      await attendanceConfigAPI.deleteConfig(id);
      alert('삭제되었습니다.');
      loadConfigs();
    } catch (error) {
      alert('삭제 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  // 설정 수정 저장
  const handleSaveEdit = async () => {
    const { config, startTime, standardTime, deadline, authNumber } = editModal;
    try {
      await attendanceConfigAPI.updateConfig(config.id, {
        startTime: startTime || calculateStartTime(config),
        standardTime,
        deadline,
        authNumber
      });
      alert('수정되었습니다.');
      setEditModal({ open: false, config: null });
      loadConfigs();
    } catch (error) {
      alert('수정 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  // 새 설정 생성
  const handleCreate = async (formData) => {
    try {
      await attendanceConfigAPI.createConfig({
        courseId,
        targetDate: formData.targetDate,
        type: formData.type,
        authNumber: formData.authNumber,
        standardTime: formData.standardTime,
        deadline: formData.deadline,
        validMinutes: parseInt(formData.validMinutes),
      });
      alert('생성되었습니다.');
      setCreateModal(false);
      loadConfigs();
    } catch (error) {
      alert('생성 실패: ' + (error.response?.data?.message || error.message));
    }
  };

  // 시간 포맷
  const formatTime = (time) => {
    if (!time) return '-';
    return time.substring(0, 5); // HH:mm
  };

  // 출석 시작 시간 계산 (standardTime - validMinutes)
  const calculateStartTime = (config) => {
    if (!config.standardTime || !config.validMinutes) return '-';
    const [hours, minutes] = config.standardTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes - config.validMinutes;
    const startHours = Math.floor(totalMinutes / 60);
    const startMinutes = totalMinutes % 60;
    return `${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiSettings /> 출석 설정 관리</h1>
          <p className="page-subtitle">출석 시간 및 인증번호를 관리합니다</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadConfigs}>
            <FiRefreshCw /> 새로고침
          </button>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
            <FiPlus /> 새 설정 추가
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="card filter-card">
        <div className="filter-row">
          <div className="input-group filter-group">
            <label className="input-label">과정 ID</label>
            <input
              type="number"
              className="input-field"
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
            />
          </div>
          <div className="input-group filter-group">
            <label className="input-label">날짜 선택</label>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 오늘 출석 설정 카드 */}
      <div className="config-cards">
        {loading ? (
          <LoadingSpinner text="출석 설정을 불러오는 중..." />
        ) : filteredConfigs.length > 0 ? (
          filteredConfigs.map((config) => {
            const typeInfo = ATTENDANCE_TYPES[config.type] || { label: config.type, icon: '⏰', color: '#64748b' };
            return (
              <div key={config.id} className="config-card" style={{ borderTopColor: typeInfo.color }}>
                <div className="config-card-header">
                  <span className="config-type-icon">{typeInfo.icon}</span>
                  <h3 className="config-type-label">{typeInfo.label} 출석</h3>
                  <div className="config-actions">
                    <button 
                      className="icon-btn edit"
                      onClick={() => setEditModal({
                        open: true,
                        config,
                        startTime: config.startTime || calculateStartTime(config),
                        standardTime: config.standardTime,
                        deadline: config.deadline,
                        authNumber: config.authNumber,
                      })}
                      title="수정"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      className="icon-btn delete"
                      onClick={() => handleDelete(config.id)}
                      title="삭제"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                
                <div className="config-card-body">
                  <div className="config-item">
                    <span className="config-item-icon">🟢</span>
                    <div className="config-item-content">
                      <span className="config-item-label">출석 시작</span>
                      <span className="config-item-value">{formatTime(config.startTime) || calculateStartTime(config)}</span>
                    </div>
                  </div>

                  <div className="config-item">
                    <span className="config-item-icon">🟡</span>
                    <div className="config-item-content">
                      <span className="config-item-label">지각 기준</span>
                      <span className="config-item-value">{formatTime(config.standardTime)} 이후 지각</span>
                    </div>
                  </div>

                  <div className="config-item">
                    <span className="config-item-icon">🔴</span>
                    <div className="config-item-content">
                      <span className="config-item-label">마감 시간</span>
                      <span className="config-item-value">{formatTime(config.deadline)} 이후 결석</span>
                    </div>
                  </div>
                  
                  <div className="config-item">
                    <FiKey className="config-item-icon" />
                    <div className="config-item-content">
                      <span className="config-item-label">인증번호</span>
                      <span className="config-item-value auth-number">{config.authNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="config-card-footer">
                  <span className="config-date">{config.targetDate}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state-full">
            <div className="empty-state-icon">⚙️</div>
            <h3>설정이 없습니다</h3>
            <p>선택한 날짜({selectedDate})에 출석 설정이 없습니다.</p>
            <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
              <FiPlus /> 새 설정 추가
            </button>
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editModal.open && (
        <div className="modal-overlay" onClick={() => setEditModal({ open: false, config: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {ATTENDANCE_TYPES[editModal.config?.type]?.icon} {ATTENDANCE_TYPES[editModal.config?.type]?.label} 출석 설정 수정
            </h2>
            
            <div className="time-guide-box">
              <p><strong>📌 출석 시간 설정 안내</strong></p>
              <ul>
                <li>🟢 <strong>출석 시작</strong>: 이 시간부터 출석 가능</li>
                <li>🟡 <strong>지각 기준</strong>: 이 시간 이후 체크인하면 지각 처리</li>
                <li>🔴 <strong>마감 시간</strong>: 이 시간 이후 출석 불가 (결석 처리)</li>
              </ul>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">🟢 출석 시작 시간</label>
                <input
                  type="time"
                  className="input-field"
                  value={editModal.startTime || calculateStartTime(editModal.config)}
                  onChange={(e) => setEditModal({...editModal, startTime: e.target.value})}
                />
                <small className="input-hint">예: 08:30 (이 시간부터 출석 가능)</small>
              </div>
              <div className="input-group">
                <label className="input-label">🟡 지각 기준 시간</label>
                <input
                  type="time"
                  className="input-field"
                  value={editModal.standardTime}
                  onChange={(e) => setEditModal({...editModal, standardTime: e.target.value})}
                />
                <small className="input-hint">예: 08:50 (이후 체크인하면 지각)</small>
              </div>
              <div className="input-group">
                <label className="input-label">🔴 마감 시간</label>
                <input
                  type="time"
                  className="input-field"
                  value={editModal.deadline}
                  onChange={(e) => setEditModal({...editModal, deadline: e.target.value})}
                />
                <small className="input-hint">예: 09:10 (이후 출석 불가)</small>
              </div>
              <div className="input-group">
                <label className="input-label">🔑 인증번호 (4자리)</label>
                <input
                  type="text"
                  className="input-field"
                  maxLength={4}
                  value={editModal.authNumber}
                  onChange={(e) => setEditModal({...editModal, authNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditModal({ open: false, config: null })}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 생성 모달 */}
      {createModal && (
        <CreateConfigModal 
          onClose={() => setCreateModal(false)} 
          onCreate={handleCreate}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

// 생성 모달 컴포넌트
function CreateConfigModal({ onClose, onCreate, selectedDate }) {
  const [formData, setFormData] = useState({
    targetDate: selectedDate,
    type: 'MORNING',
    authNumber: '',
    startTime: '08:30',     // 출석 시작 시간
    standardTime: '08:50',  // 지각 기준 시간
    deadline: '09:10',      // 마감 시간
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.authNumber.length !== 4) {
      alert('인증번호는 4자리여야 합니다.');
      return;
    }

    // validMinutes 자동 계산 (standardTime - startTime)
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [stdH, stdM] = formData.standardTime.split(':').map(Number);
    const validMinutes = (stdH * 60 + stdM) - (startH * 60 + startM);

    if (validMinutes <= 0) {
      alert('출석 시작 시간은 지각 기준 시간보다 이전이어야 합니다.');
      return;
    }

    onCreate({
      ...formData,
      validMinutes
    });
  };

  // 타입별 기본 시간 설정
  const handleTypeChange = (type) => {
    const defaults = {
      MORNING: { startTime: '08:30', standardTime: '08:50', deadline: '09:10' },
      LUNCH: { startTime: '11:20', standardTime: '12:30', deadline: '13:00' },
      DINNER: { startTime: '17:30', standardTime: '17:50', deadline: '18:00' },
    };
    setFormData({
      ...formData,
      type,
      ...defaults[type]
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">🆕 새 출석 설정 추가</h2>
        
        <div className="time-guide-box">
          <p><strong>📌 출석 시간 설정 안내</strong></p>
          <ul>
            <li>🟢 <strong>출석 시작</strong>: 이 시간부터 출석 가능</li>
            <li>🟡 <strong>지각 기준</strong>: 이 시간 이후 체크인하면 지각 처리</li>
            <li>🔴 <strong>마감 시간</strong>: 이 시간 이후 출석 불가 (결석 처리)</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">날짜</label>
              <input
                type="date"
                className="input-field"
                value={formData.targetDate}
                onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">출석 타입</label>
              <select
                className="input-field"
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="MORNING">🌅 아침</option>
                <option value="LUNCH">☀️ 점심</option>
                <option value="DINNER">🌙 저녁</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">🟢 출석 시작 시간</label>
              <input
                type="time"
                className="input-field"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required
              />
              <small className="input-hint">이 시간부터 출석 체크 가능</small>
            </div>
            <div className="input-group">
              <label className="input-label">🟡 지각 기준 시간</label>
              <input
                type="time"
                className="input-field"
                value={formData.standardTime}
                onChange={(e) => setFormData({...formData, standardTime: e.target.value})}
                required
              />
              <small className="input-hint">이 시간 이후 체크인하면 지각</small>
            </div>
            <div className="input-group">
              <label className="input-label">🔴 마감 시간</label>
              <input
                type="time"
                className="input-field"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                required
              />
              <small className="input-hint">이 시간 이후 출석 불가</small>
            </div>
            <div className="input-group">
              <label className="input-label">🔑 인증번호 (4자리)</label>
              <input
                type="text"
                className="input-field"
                maxLength={4}
                placeholder="예: 1234"
                value={formData.authNumber}
                onChange={(e) => setFormData({...formData, authNumber: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

