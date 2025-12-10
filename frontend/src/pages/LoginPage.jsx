import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';
import './LoginPage.css';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 이미 로그인된 경우 역할에 따라 리디렉션
  if (isAuthenticated) {
    const defaultPath = isAdmin ? '/admin' : '/dashboard';
    const from = location.state?.from?.pathname || defaultPath;
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(loginId, password);
      // 역할에 따라 다른 페이지로 이동
      const redirectPath = userData.role === 'ADMIN' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
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

