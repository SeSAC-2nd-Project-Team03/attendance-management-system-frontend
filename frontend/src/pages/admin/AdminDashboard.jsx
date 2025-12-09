import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/admin';
import { 
  FiBarChart2, FiUsers, FiCheckSquare, FiBell,
  FiDownload, FiArrowRight, FiFileText 
} from 'react-icons/fi';
import { getTodayString } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
    totalNotices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [membersRes] = await Promise.all([
        adminAPI.getAllMembers().catch(() => []),
      ]);

      setStats({
        totalMembers: membersRes?.length || 0,
        todayAttendance: 45,
        pendingLeaves: 3,
        totalNotices: 12,
      });
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      const blob = await adminAPI.downloadAttendance(type, getTodayString(), 1);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${getTodayString()}.${type === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('다운로드 실패');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><FiBarChart2 /> 관리자 대시보드</h1>
        <p className="page-subtitle">시스템 현황을 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-4 admin-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><FiUsers /></div>
          <div className="stat-content">
            <h3>{stats.totalMembers}</h3>
            <p>전체 회원</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><FiCheckSquare /></div>
          <div className="stat-content">
            <h3>{stats.todayAttendance}</h3>
            <p>오늘 출석</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><FiBell /></div>
          <div className="stat-content">
            <h3>{stats.pendingLeaves}</h3>
            <p>대기 중 휴가</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info"><FiBell /></div>
          <div className="stat-content">
            <h3>{stats.totalNotices}</h3>
            <p>공지사항</p>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* 빠른 액션 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🚀 관리 메뉴</h3>
          </div>
          <div className="admin-quick-actions">
            <Link to="/admin/members" className="admin-action">
              <FiUsers className="action-icon" />
              <div>
                <h4>회원 관리</h4>
                <p>회원 조회, 생성, 수정, 삭제</p>
              </div>
              <FiArrowRight />
            </Link>
            <Link to="/admin/attendances" className="admin-action">
              <FiCheckSquare className="action-icon" />
              <div>
                <h4>출석 관리</h4>
                <p>출석 현황 조회, 상태 변경</p>
              </div>
              <FiArrowRight />
            </Link>
            <Link to="/admin/notices" className="admin-action">
              <FiBell className="action-icon" />
              <div>
                <h4>공지사항 관리</h4>
                <p>공지 생성, 수정, 삭제</p>
              </div>
              <FiArrowRight />
            </Link>
            <Link to="/admin/leaves" className="admin-action">
              <FiFileText className="action-icon" />
              <div>
                <h4>휴가 관리</h4>
                <p>휴가 신청 확인, 승인, 반려</p>
              </div>
              <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* 다운로드 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📥 출석부 다운로드</h3>
          </div>
          <div className="download-section">
            <p className="download-desc">오늘 날짜의 출석 데이터를 다운로드합니다.</p>
            <div className="download-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => handleDownload('csv')}
              >
                <FiDownload /> CSV 다운로드
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleDownload('excel')}
              >
                <FiDownload /> Excel 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

