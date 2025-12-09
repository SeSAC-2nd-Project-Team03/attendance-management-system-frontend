import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { noticeAPI } from '../api/notice';
import { FiBell, FiChevronLeft, FiChevronRight, FiEye } from 'react-icons/fi';
import { formatDate } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import './NoticePage.css';

export default function NoticePage() {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotices();
  }, [page]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await noticeAPI.getNotices(page, 10);
      setNotices(data.content || data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><FiBell /> 공지사항</h1>
        <p className="page-subtitle">새로운 소식을 확인하세요</p>
      </div>

      <div className="card">
        {notices.length > 0 ? (
          <>
            <div className="notice-grid">
              {notices.map((notice) => (
                <Link key={notice.id} to={`/notices/${notice.id}`} className="notice-card">
                  <div className="notice-card-header">
                    {notice.isPopup && <span className="badge badge-info">팝업</span>}
                    <span className="notice-views"><FiEye /> {notice.viewCount || 0}</span>
                  </div>
                  <h3 className="notice-card-title">{notice.title}</h3>
                  <p className="notice-card-date">{formatDate(notice.createdAt)}</p>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                >
                  <FiChevronLeft /> 이전
                </button>
                <span className="page-info">
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  다음 <FiChevronRight />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📢</div>
            <h3>공지사항이 없습니다</h3>
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

