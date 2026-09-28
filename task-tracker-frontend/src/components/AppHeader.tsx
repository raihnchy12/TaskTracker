// src/components/AppHeader.tsx
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

interface AppHeaderProps {
  subtitle?: string;
}

export default function AppHeader({ subtitle = 'Task Manager' }: AppHeaderProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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

        {/* Action Group: Theme Toggle & Logout */}
        <div className="app-header-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle theme mode"
          >
            <span className="material-symbols-outlined theme-icon">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>

          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost btn-logout"
              title="Keluar dari akun"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="btn-logout-label">Keluar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}