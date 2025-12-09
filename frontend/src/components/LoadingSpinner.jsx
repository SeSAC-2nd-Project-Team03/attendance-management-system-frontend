export default function LoadingSpinner({ size = 'default', text = '로딩 중...' }) {
  return (
    <div className={`loading-container ${size}`}>
      <div className="spinner"></div>
      <p className="loading-text">{text}</p>
    </div>
  );
}

