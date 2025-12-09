import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import { noticeAPI } from '../../api/notice';
import { FiBell, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import './NoticeManagement.css';

export default function NoticeManagement() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPopup: false,
    popupStartDate: '',
    popupEndDate: '',
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const data = await noticeAPI.getNotices(0, 100);
      setNotices(data.content || data || []);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNotice) {
        await adminAPI.updateNotice(editingNotice.id, formData);
        alert('공지사항이 수정되었습니다.');
      } else {
        await adminAPI.createNotice(formData);
        alert('공지사항이 생성되었습니다.');
      }
      setShowModal(false);
      resetForm();
      loadNotices();
    } catch (error) {
      alert(error.response?.data?.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await adminAPI.deleteNotice(id);
      alert('공지사항이 삭제되었습니다.');
      loadNotices();
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      isPopup: notice.isPopup || false,
      popupStartDate: notice.popupStartDate || '',
      popupEndDate: notice.popupEndDate || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingNotice(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      isPopup: false,
      popupStartDate: '',
      popupEndDate: '',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiBell /> 공지사항 관리</h1>
          <p className="page-subtitle">공지사항을 생성하고 관리합니다</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FiPlus /> 공지 작성
        </button>
      </div>

      <div className="card">
        {notices.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>작성일</th>
                  <th>조회수</th>
                  <th>팝업</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id}>
                    <td className="title-cell">{notice.title}</td>
                    <td>{formatDate(notice.createdAt)}</td>
                    <td>{notice.viewCount || 0}</td>
                    <td>
                      {notice.isPopup ? (
                        <span className="badge badge-info">팝업</span>
                      ) : (
                        <span className="badge badge-pending">-</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(notice)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(notice.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📢</div>
            <h3>공지사항이 없습니다</h3>
          </div>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal notice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingNotice ? '공지사항 수정' : '공지사항 작성'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">제목 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">내용 *</label>
                <textarea
                  className="input-field textarea"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={8}
                  required
                />
              </div>
              
              <div className="input-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isPopup}
                    onChange={(e) => setFormData({...formData, isPopup: e.target.checked})}
                  />
                  <span>팝업으로 표시</span>
                </label>
              </div>

              {formData.isPopup && (
                <div className="popup-dates">
                  <div className="input-group">
                    <label className="input-label">팝업 시작일</label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.popupStartDate}
                      onChange={(e) => setFormData({...formData, popupStartDate: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">팝업 종료일</label>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.popupEndDate}
                      onChange={(e) => setFormData({...formData, popupEndDate: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingNotice ? '수정' : '작성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

