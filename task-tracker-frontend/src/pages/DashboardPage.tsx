import { useState, useEffect } from 'react';
import ProjectList from '../components/ProjectList';
import AppHeader from '../components/AppHeader';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // 1. Coba ambil dari key 'user'
    const storedUser = localStorage.getItem('user');
    
    // 2. Jika key-nya disimpan terpisah sebagai 'user_name' atau 'username'
    const storedDirectName = localStorage.getItem('user_name') || localStorage.getItem('username') || localStorage.getItem('name');

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Cek berbagai kemungkinan nama properti dari object user backend
        const nameFound = 
          parsed.name || 
          parsed.username || 
          parsed.fullName || 
          parsed.full_name || 
          parsed.user_name ||
          (parsed.email ? parsed.email.split('@')[0] : '');

        setUserName(nameFound);
      } catch {
        setUserName(storedUser);
      }
    } else if (storedDirectName) {
      setUserName(storedDirectName);
    }
  }, []);

  return (
    <div className="app-page">
      <AppHeader subtitle="Beranda" />

      <div className="bg-blobs" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
        <span className="blob blob-4" />
      </div>

      <main className="app-main app-main-wide">
        <div className="dashboard-container">
          <header className="dashboard-header">
            <h1>
              Hai, {userName || 'User'} 👋
            </h1>
            <p className="text-muted">Pantau semua proyek dan progresmu di satu tempat.</p>
          </header>

          <ProjectList />
        </div>
      </main>
    </div>
  );
}