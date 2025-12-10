import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiCheckSquare, FiCalendar, FiFileText, 
  FiBell, FiUsers, FiBarChart2, FiSettings 
} from 'react-icons/fi';
import './Sidebar.css';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  const userMenus = [
    { path: '/dashboard', icon: <FiHome />, label: '대시보드' },
    { path: '/attendance', icon: <FiCheckSquare />, label: '출석 체크' },
    { path: '/my-attendance', icon: <FiCalendar />, label: '내 출석 현황' },
    { path: '/leave-request', icon: <FiFileText />, label: '휴가/조퇴 신청' },
    { path: '/my-leaves', icon: <FiFileText />, label: '내 신청 내역' },
    { path: '/notices', icon: <FiBell />, label: '공지사항' },
  ];

  const adminMenus = [
    { path: '/admin', icon: <FiBarChart2 />, label: '관리자 대시보드' },
    { path: '/admin/members', icon: <FiUsers />, label: '회원 관리' },
    { path: '/admin/attendances', icon: <FiCheckSquare />, label: '출석 관리' },
    { path: '/admin/attendance-config', icon: <FiSettings />, label: '출석 설정 관리' },
    { path: '/admin/leaves', icon: <FiFileText />, label: '휴가/조퇴 관리' },
    { path: '/admin/notices', icon: <FiBell />, label: '공지사항 관리' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🎓</span>
        <span className="logo-text">SESAC</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">메뉴</h3>
          {userMenus.map((menu) => (
            <NavLink 
              key={menu.path} 
              to={menu.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{menu.icon}</span>
              <span className="nav-label">{menu.label}</span>
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <div className="nav-section">
            <h3 className="nav-section-title">관리자</h3>
            {adminMenus.map((menu) => (
              <NavLink 
                key={menu.path} 
                to={menu.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{menu.icon}</span>
                <span className="nav-label">{menu.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="version">v1.0.0</div>
      </div>
    </aside>
  );
}

