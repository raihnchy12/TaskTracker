import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  subtitle?: string;
}

export default function AppHeader({ subtitle = 'Task Manager' }: AppHeaderProps) {
  const navigate = useNavigate();

  // Cek apakah user sedang terautentikasi (memiliki token di localStorage)
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const handleLogout = () => {
    // 1. Hapus token JWT & data user
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Lempar kembali ke halaman login
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Brand / Logo */}
        <div className="app-header-brand">
          <div className="brand-mark">
            <span className="material-symbols-outlined">check_box</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">Task Tracker</span>
            <span className="brand-subtitle">{subtitle}</span>
          </div>
        </div>

        {/* Action Button / Logout (Hanya tampil jika user sudah login) */}
        {isAuthenticated && (
          <button 
            onClick={handleLogout} 
            className="btn-ghost"
            title="Keluar dari akun"
          >
            <span className="material-symbols-outlined">logout</span>
            Keluar
          </button>
        )}
      </div>
    </header>
  );
}