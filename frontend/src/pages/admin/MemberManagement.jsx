import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import LoadingSpinner from '../../components/LoadingSpinner';
import './MemberManagement.css';

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    name: '',
    address: '',
    phoneNumber: '',
    role: 'STUDENT',
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await adminAPI.getAllMembers();
      setMembers(data || []);
    } catch (error) {
      console.error('회원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await adminAPI.updateMember(editingMember.loginId, formData);
        alert('회원 정보가 수정되었습니다.');
      } else {
        await adminAPI.createMember(formData);
        alert('회원이 생성되었습니다.');
      }
      setShowModal(false);
      resetForm();
      loadMembers();
    } catch (error) {
      alert(error.response?.data?.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (loginId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await adminAPI.deleteMember(loginId);
      alert('회원이 삭제되었습니다.');
      loadMembers();
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      loginId: member.loginId,
      name: member.name,
      address: member.address || '',
      phoneNumber: member.phoneNumber || '',
      role: member.role,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingMember(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      loginId: '',
      password: '',
      name: '',
      address: '',
      phoneNumber: '',
      role: 'STUDENT',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiUsers /> 회원 관리</h1>
          <p className="page-subtitle">시스템 회원을 관리합니다</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FiPlus /> 회원 추가
        </button>
      </div>

      <div className="card">
        {members.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>아이디</th>
                  <th>이름</th>
                  <th>주소</th>
                  <th>연락처</th>
                  <th>역할</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.loginId}>
                    <td>{member.loginId}</td>
                    <td>{member.name}</td>
                    <td>{member.address || '-'}</td>
                    <td>{member.phoneNumber || '-'}</td>
                    <td>
                      <span className={`badge ${member.role === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                        {member.role === 'ADMIN' ? '관리자' : '학생'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(member)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(member.loginId)}
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
            <div className="empty-state-icon">👥</div>
            <h3>등록된 회원이 없습니다</h3>
          </div>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingMember ? '회원 수정' : '회원 추가'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {!editingMember && (
                <>
                  <div className="input-group">
                    <label className="input-label">아이디 *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.loginId}
                      onChange={(e) => setFormData({...formData, loginId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">비밀번호 *</label>
                    <input
                      type="password"
                      className="input-field"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}
              <div className="input-group">
                <label className="input-label">이름 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">주소</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">연락처</label>
                <input
                  type="tel"
                  className="input-field"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">역할</label>
                <select
                  className="input-field"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="STUDENT">학생</option>
                  <option value="ADMIN">관리자</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

