import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import type { AuthResponse } from '../types';
import AppHeader from '../components/AppHeader';

export default function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // 1. Simpan token JWT
      localStorage.setItem('token', res.token);

      // =========================================================
      // [PERBAIKAN]: Simpan objek user ke localStorage 
      // agar namanya bisa dibaca dan ditampilkan di Dashboard
      // =========================================================
      if (res.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
      }

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login gagal, periksa email dan password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page">
      <AppHeader subtitle="Profil & Akun" />

      <div className="bg-blobs" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
        <span className="blob blob-4" />
      </div>

      <main className="app-main">
        <div className="auth-card">
           
          <div className="brand-orb" aria-hidden="true">
            <span className="material-symbols-outlined">check_circle</span>
          </div>

          <h1 className="auth-title">
            Masuk ke TaskTracker <span className="sparkle"></span>
          </h1>
          <p className="auth-subtitle">
            Lanjutkan produktivitas harianmu dengan nyaman dan bebas stres.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Email</label>
              <div className="input-icon-wrap">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  type="email"
                  placeholder="nama@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Kata Sandi</label>
              <div className="input-icon-wrap">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-trailing-btn"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-gradient" disabled={loading}>
              <span>{loading ? 'Memproses...' : 'Masuk ke Dashboard'}</span>
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>

          <p className="auth-footer-text">
            Belum punya akun? <Link to="/register">Daftar sekarang</Link>
          </p>
        </div>
      </main>
    </div>
  );
}