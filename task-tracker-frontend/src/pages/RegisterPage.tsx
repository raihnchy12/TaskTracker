import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../api/client';
import type { ApiResponse, User } from '../types';
import AppHeader from '../components/AppHeader';

export default function RegisterPage() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [agreed, setAgreed] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('Kamu perlu menyetujui Ketentuan Layanan terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      await fetchApi<ApiResponse<User>>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      alert('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal');
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
          
          <h1 className="auth-title">Buat Akun TaskTracker</h1>
          <p className="auth-subtitle">
            Kelola proyek dan tugas harian lebih tenang dan teratur.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Nama Lengkap</label>
              <div className="input-icon-wrap">
                <span className="material-symbols-outlined input-icon">person</span>
                <input
                  type="text"
                  placeholder="Contoh: Raihan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Alamat Email</label>
              <div className="input-icon-wrap">
                <span className="material-symbols-outlined input-icon">alternate_email</span>
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
              <label>Kata Sandi Baru</label>
              <div className="input-icon-wrap">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            <label className="checkbox-pill">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>Saya setuju dengan Ketentuan Layanan & Kebijakan Privasi TaskFlow.</span>
            </label>

            <button type="submit" className="btn-gradient" disabled={loading}>
              <span>{loading ? 'Memproses...' : 'Mulai Petualangan Produktif'}</span>
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>

          <p className="auth-footer-text">
            Sudah punya akun? <Link to="/login">Masuk di sini →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}