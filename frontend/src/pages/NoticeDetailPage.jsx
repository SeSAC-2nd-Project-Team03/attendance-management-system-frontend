import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { noticeAPI } from '../api/notice';
import { FiArrowLeft, FiEye, FiCalendar, FiUser } from 'react-icons/fi';
import { formatDateTime } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import './NoticeDetailPage.css';

export default function NoticeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotice();
  }, [id]);

  const loadNotice = async () => {
    try {
      const data = await noticeAPI.getNotice(id);
      setNotice(data);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
      alert('공지사항을 찾을 수 없습니다.');
      navigate('/notices');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!notice) {
    return null;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/notices" className="back-link">
          <FiArrowLeft /> 목록으로
        </Link>
      </div>

      <div className="card notice-detail-card">
        <div className="notice-detail-header">
          <h1 className="notice-detail-title">{notice.title}</h1>
          <div className="notice-meta">
            <span><FiUser /> {notice.authorName || '관리자'}</span>
            <span><FiCalendar /> {formatDateTime(notice.createdAt)}</span>
            <span><FiEye /> {notice.viewCount || 0}회</span>
          </div>
        </div>

        <div className="notice-detail-content">
          {notice.content}
        </div>
      </div>
    </div>
  );
}

