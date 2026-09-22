import { useState, useEffect } from 'react';
import ProjectList from '../components/ProjectList';
import AppHeader from '../components/AppHeader';

interface PendingMove {
  taskId: string;
  taskTitle: string;
  fromStatus: string;
  toStatus: string;
  onConfirmCallback?: () => void;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedDirectName =
      localStorage.getItem('user_name') ||
      localStorage.getItem('username') ||
      localStorage.getItem('name');

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
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

  const formatStatus = (status: string) => {
    const labels: Record<string, string> = {
      backlog: 'Backlog',
      todo: 'To Do',
      in_progress: 'In Progress',
      review: 'Review',
      done: 'Done',
    };
    return labels[status] || status;
  };

  const handleConfirmMove = () => {
    if (pendingMove?.onConfirmCallback) {
      pendingMove.onConfirmCallback();
    }
    setPendingMove(null);
  };

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
            <h1>Hai, {userName || 'User'} 👋</h1>
            <p className="text-muted">Pantau semua proyek dan progresmu di satu tempat.</p>
          </header>

          <ProjectList
            onRequestMove={(
              taskId: string,
              taskTitle: string,
              fromStatus: string,
              toStatus: string,
              onConfirm: () => void
            ) => {
              setPendingMove({
                taskId,
                taskTitle,
                fromStatus,
                toStatus,
                onConfirmCallback: onConfirm,
              });
            }}
          />
        </div>
      </main>

      {pendingMove && (
        <div className="modal-overlay" onClick={() => setPendingMove(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="material-symbols-outlined modal-icon">help_outline</span>
              <h3>Konfirmasi Perpindahan</h3>
            </div>

            <p className="modal-body">
              Apakah Kamu yakin ingin memindahkan tugas <strong>"{pendingMove.taskTitle}"</strong>?
            </p>

            <div className="status-flow-badge">
              <span className="badge-flow">{formatStatus(pendingMove.fromStatus)}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
              <span className="badge-flow target">{formatStatus(pendingMove.toStatus)}</span>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setPendingMove(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-gradient btn-small"
                onClick={handleConfirmMove}
              >
                Ya, Pindahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}