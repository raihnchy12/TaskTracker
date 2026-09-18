import { useState, type FormEvent } from 'react';
import { fetchApi } from '../api/client';
import type { Project, Task, ApiResponse } from '../types';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
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

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');

  // State toggle deskripsi task
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  // State Form Tambah Task
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState('');

  // State Form Edit Task
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [updatingTask, setUpdatingTask] = useState(false);
  const [updateTaskError, setUpdateTaskError] = useState('');

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

  const toggleTaskDetail = (taskId: number) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const handleUpdateTaskStatus = async (taskId: number, currentStatus: Task['status']) => {
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

  // Handler Buka Form Edit Task
  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(
      task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
    );
    setUpdateTaskError('');
  };

  // Handler Simpan Edit Task
  const handleUpdateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setUpdateTaskError('');

    if (!editTaskTitle.trim()) {
      setUpdateTaskError('Nama tugas wajib diisi');
      return;
    }

    setUpdatingTask(true);
    try {
      const res = await fetchApi<ApiResponse<Task>>(`/tasks/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTaskTitle.trim(),
          description: editTaskDescription.trim() || null,
          priority: editTaskPriority,
          due_date: editTaskDueDate || null,
        }),
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? res.data : t))
      );
      setEditingTask(null);
    } catch (err: any) {
      setUpdateTaskError(err.message || 'Gagal memperbarui tugas');
    } finally {
      setUpdatingTask(false);
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
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={onEdit}
            aria-label={`Edit proyek ${project.title}`}
            title="Edit proyek"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
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
                              className="icon-btn"
                              onClick={() => handleOpenEditTask(task)}
                              aria-label={`Edit tugas ${task.title}`}
                              title="Edit tugas"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>

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

                        {/* Deskripsi Task */}
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

                        {/* Form Edit Task (Tampil saat tombol edit task diklik) */}
                        {editingTask?.id === task.id && (
                          <form className="new-task-form" onSubmit={handleUpdateTask} style={{ marginTop: '12px' }}>
                            <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0 }}>Edit Tugas</h4>
                              <button type="button" className="btn-close" onClick={() => setEditingTask(null)}>
                                <span className="material-symbols-outlined">close</span>
                              </button>
                            </div>

                            {updateTaskError && <div className="error-message">{updateTaskError}</div>}

                            <div className="form-group">
                              <label>Nama Tugas *</label>
                              <input
                                type="text"
                                value={editTaskTitle}
                                onChange={(e) => setEditTaskTitle(e.target.value)}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label>Deskripsi (opsional)</label>
                              <textarea
                                rows={2}
                                value={editTaskDescription}
                                onChange={(e) => setEditTaskDescription(e.target.value)}
                              />
                            </div>

                            <div className="form-row">
                              <div className="form-group">
                                <label>Prioritas</label>
                                <select
                                  value={editTaskPriority}
                                  onChange={(e) =>
                                    setEditTaskPriority(e.target.value as Task['priority'])
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
                                  value={editTaskDueDate}
                                  onChange={(e) => setEditTaskDueDate(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="new-task-form-actions">
                              <button type="submit" className="btn-gradient btn-small" disabled={updatingTask}>
                                <span>{updatingTask ? 'Memperbarui...' : 'Simpan Perubahan'}</span>
                              </button>
                              <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => setEditingTask(null)}
                              >
                                <span>Batal</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Form Tambah Task */}
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