import { useState, type FormEvent } from 'react';
import { fetchApi } from '../api/client';
import type { Project, Task, ApiResponse } from '../types';

interface ProjectCardProps {
  project: Project;
  onDelete: () => void;
}

const STATUS_LABEL: Record<Task['status'], string> = {
  TODO: 'Belum Dikerjakan',
  IN_PROGRESS: 'Dikerjakan',
  DONE: 'Selesai',
};

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
};

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');

  // State untuk menyimpan ID tugas mana yang sedang dibuka deskripsinya
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState('');

  const loadTasks = async () => {
    setLoadingTasks(true);
    setTasksError('');
    try {
      const res = await fetchApi<ApiResponse<Task[]>>(`/tasks/project/${project.id}`);
      setTasks(res.data);
      setTasksLoaded(true);
    } catch (err: any) {
      setTasksError(err.message || 'Gagal memuat tugas');
    } finally {
      setLoadingTasks(false);
    }
  };

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !tasksLoaded) {
      loadTasks();
    }
  };

  // Toggle untuk buka/tutup deskripsi tugas
  const toggleTaskDetail = (taskId: number) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const handleUpdateTaskStatus = async (taskId: number, currentStatus: Task['status']) => {
    // Jika tugas sudah DONE, tidak bisa diubah lagi
    if (currentStatus === 'DONE') return;

    let nextStatus: Task['status'] = 'IN_PROGRESS';
    if (currentStatus === 'IN_PROGRESS') {
      nextStatus = 'DONE';
    }

    try {
      const res = await fetchApi<ApiResponse<Task>>(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: res.data?.status || nextStatus } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengupdate status tugas');
    }
  };

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    setCreateTaskError('');

    if (!newTaskTitle.trim()) {
      setCreateTaskError('Nama tugas wajib diisi');
      return;
    }

    setCreatingTask(true);
    try {
      const res = await fetchApi<ApiResponse<Task>>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          project_id: project.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          priority: newTaskPriority,
          due_date: newTaskDueDate || null,
        }),
      });

      setTasks((prev) => [...prev, res.data]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('MEDIUM');
      setNewTaskDueDate('');
      setShowNewTaskForm(false);
    } catch (err: any) {
      setCreateTaskError(err.message || 'Gagal menambahkan tugas');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const confirmed = window.confirm('Hapus tugas ini?');
    if (!confirmed) return;

    try {
      await fetchApi<ApiResponse<null>>(`/tasks/${taskId}`, {
        method: 'DELETE',
      });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tugas');
    }
  };

  return (
    <li className="project-card">
      <div className="project-card-header">
        <div>
          <h3>{project.title}</h3>
          {project.description && <p>{project.description}</p>}
        </div>
        <button
          type="button"
          className="icon-btn danger"
          onClick={onDelete}
          aria-label={`Hapus proyek ${project.title}`}
          title="Hapus proyek"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      <button type="button" className="link-toggle" onClick={toggleExpanded}>
        {expanded ? 'Sembunyikan tugas' : 'Lihat tugas'}
      </button>

      {expanded && (
        <div className="task-panel">
          {loadingTasks && (
            <div className="state-message loading-state small">
              <span className="spinner" aria-hidden="true" />
              <p>Memuat tugas...</p>
            </div>
          )}

          {!loadingTasks && tasksError && (
            <div className="error-message">{tasksError}</div>
          )}

          {!loadingTasks && !tasksError && (
            <>
              {tasks.length === 0 ? (
                <p className="text-muted task-empty">Belum ada tugas di proyek ini.</p>
              ) : (
                <ul className="task-list">
                  {tasks.map((task) => {
                    const isTaskExpanded = expandedTaskId === task.id;
                    const isDone = task.status === 'DONE';

                    return (
                      <li key={task.id} className="task-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div className="task-item-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          
                          {/* Judul tugas bisa diklik untuk toggle deskripsi */}
                          <div 
                            onClick={() => toggleTaskDetail(task.id)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                            title="Klik untuk melihat/menyembunyikan deskripsi"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#666' }}>
                              {isTaskExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            <span className="task-title" style={{ fontWeight: 500 }}>{task.title}</span>
                          </div>

                          <div className="task-badges" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(task.id, task.status)}
                              className={`badge badge-status-${task.status.toLowerCase()}`}
                              disabled={isDone}
                              style={{
                                border: 'none',
                                cursor: isDone ? 'not-allowed' : 'pointer',
                                opacity: isDone ? 0.7 : 1,
                              }}
                              title={isDone ? 'Tugas telah selesai' : 'Klik untuk mengoper status tugas'}
                            >
                              {STATUS_LABEL[task.status]}
                            </button>
                            <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                              {PRIORITY_LABEL[task.priority]}
                            </span>
                            <button
                              type="button"
                              className="icon-btn danger"
                              onClick={() => handleDeleteTask(task.id)}
                              aria-label={`Hapus tugas ${task.title}`}
                              title="Hapus tugas"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Bagian Detail / Deskripsi Tugas (ditampilkan ketika item diklik) */}
                        {isTaskExpanded && (
                          <div 
                            className="task-detail-body" 
                            style={{ 
                              marginTop: '10px', 
                              padding: '10px 12px', 
                              backgroundColor: 'rgba(0, 0, 0, 0.03)', 
                              borderRadius: '6px',
                              fontSize: '0.9rem'
                            }}
                          >
                            <p style={{ margin: '0 0 6px 0', color: '#333', whiteSpace: 'pre-line' }}>
                              <strong>Deskripsi:</strong> {task.description || <em className="text-muted">Tidak ada deskripsi.</em>}
                            </p>
                            {task.due_date && (
                              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                                📅 <strong>Tenggat:</strong> {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {showNewTaskForm ? (
                <form className="new-task-form" onSubmit={handleCreateTask}>
                  {createTaskError && (
                    <div className="error-message">{createTaskError}</div>
                  )}

                  <div className="form-group">
                    <label>Nama Tugas *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Desain wireframe"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Deskripsi (opsional)</label>
                    <textarea
                      rows={2}
                      placeholder="Detail tugas ini"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Prioritas</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) =>
                          setNewTaskPriority(e.target.value as Task['priority'])
                        }
                      >
                        <option value="LOW">Rendah</option>
                        <option value="MEDIUM">Sedang</option>
                        <option value="HIGH">Tinggi</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Tenggat (opsional)</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="new-task-form-actions">
                    <button type="submit" className="btn-gradient btn-small" disabled={creatingTask}>
                      <span>{creatingTask ? 'Menyimpan...' : 'Simpan Tugas'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setShowNewTaskForm(false)}
                    >
                      <span>Batal</span>
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="btn-ghost add-task-btn"
                  onClick={() => setShowNewTaskForm(true)}
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>Tambah Tugas</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}