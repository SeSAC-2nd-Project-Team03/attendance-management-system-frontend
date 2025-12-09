import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';
import './LoginPage.css';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  // 이미 로그인된 상태면 역할에 따라 대시보드로 이동
  if (isAuthenticated) {
    const targetPath = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
    navigate(targetPath, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(loginId, password);
      // 알림 추가
      addNotification({
        type: 'info',
        message: `${data.name || loginId}님, 환영합니다! 로그인되었습니다.`,
      });
      // 역할에 따라 적절한 대시보드로 이동
      const targetPath = data.role === 'ADMIN' ? '/admin' : '/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">🎓</div>
            <h1>출석 관리 시스템</h1>
            <p>SESAC Attendance Management</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">
                <FiUser /> 아이디
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="아이디를 입력하세요"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                <FiLock /> 비밀번호
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg login-btn"
              disabled={loading}
            >
              {loading ? (
                <>로그인 중...</>
              ) : (
                <><FiLogIn /> 로그인</>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>테스트 계정</p>
            <code>admin / 1234</code>
            <br />
            <code>student1 / 1234</code>
          </div>
        </div>
      </div>
    </div>
  );
}

