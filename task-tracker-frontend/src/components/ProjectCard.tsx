import { useState, type FormEvent } from 'react';
import { fetchApi } from '../api/client';
import type { Project, Task, ApiResponse } from '../types';
import StatusTabs, { type TaskStatus } from './StatusTabs';
import ConfirmModal from './ConfirmModal';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onRequestMove?: (
    taskId: string,
    taskTitle: string,
    fromStatus: string,
    toStatus: string,
    onConfirm: () => void
  ) => void;
}

const STATUS_LABEL: Record<Task['status'], string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'IN PROGRESS',
  REVIEW: 'Review',
  DONE: 'DONE',
};

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
};

const STATUS_ORDER: Task['status'][] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export default function ProjectCard({ project, onEdit, onDelete, onRequestMove }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');

  const [activeStatus, setActiveStatus] = useState<TaskStatus>('BACKLOG');
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState('');

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [updatingTask, setUpdatingTask] = useState(false);
  const [updateTaskError, setUpdateTaskError] = useState('');

  // State Pop-up Modal Hapus
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);

  const loadTasks = async () => {
    setLoadingTasks(true);
    setTasksError('');
    try {
      const res = await fetchApi<ApiResponse<Task[]>>(`/tasks/project/${project.id}`);
      setTasks(res.data || []);
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

  const executeMoveTask = async (task: Task, nextStatus: Task['status']) => {
    try {
      const res = await fetchApi<ApiResponse<Task>>(`/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: res.data?.status || nextStatus } : t))
      );
      setActiveStatus(nextStatus);
    } catch (err: any) {
      alert(err.message || 'Gagal memindahkan status tugas');
    }
  };

  const handleMoveTask = (task: Task, direction: 'prev' | 'next') => {
    const currentIndex = STATUS_ORDER.indexOf(task.status);
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= STATUS_ORDER.length) return;
    const nextStatus = STATUS_ORDER[nextIndex];

    if (onRequestMove) {
      onRequestMove(
        String(task.id),
        task.title,
        STATUS_LABEL[task.status],
        STATUS_LABEL[nextStatus],
        () => executeMoveTask(task, nextStatus)
      );
    } else {
      executeMoveTask(task, nextStatus);
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

      if (res.data) {
        setTasks((prev) => [...prev, res.data]);
      }
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('MEDIUM');
      setNewTaskDueDate('');
      setShowNewTaskForm(false);
      setActiveStatus('BACKLOG');
    } catch (err: any) {
      setCreateTaskError(err.message || 'Gagal menambahkan tugas');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskPriority(task.priority);

    if (task.due_date) {
      const parsedDate = new Date(task.due_date);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() < 9999) {
        setEditTaskDueDate(parsedDate.toISOString().split('T')[0]);
      } else {
        setEditTaskDueDate('');
      }
    } else {
      setEditTaskDueDate('');
    }

    setUpdateTaskError('');
  };

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
          status: editingTask.status,
          priority: editTaskPriority,
          due_date: editTaskDueDate || null,
        }),
      });

      if (res.data) {
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? res.data : t)));
      }
      setEditingTask(null);
    } catch (err: any) {
      setUpdateTaskError(err.message || 'Gagal memperbarui tugas');
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await fetchApi<ApiResponse<null>>(`/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tugas');
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleConfirmDeleteProject = () => {
    setShowDeleteProjectModal(false);
    onDelete();
  };

  const formatSafeDate = (rawDate: string | null | undefined) => {
    if (!rawDate) return null;
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime()) || dateObj.getFullYear() > 9999) {
      return 'Format tanggal tidak valid';
    }
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const visibleTasks = tasks.filter((t) => t.status === activeStatus);

  return (
    <>
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
              onClick={() => setShowDeleteProjectModal(true)}
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

            {!loadingTasks && tasksError && <div className="error-message">{tasksError}</div>}

            {!loadingTasks && !tasksError && (
              <>
                <StatusTabs tasks={tasks} active={activeStatus} onChange={setActiveStatus} />

                {visibleTasks.length === 0 ? (
                  <p className="text-muted task-empty">
                    Tidak ada tugas berstatus "{STATUS_LABEL[activeStatus]}".
                  </p>
                ) : (
                  <ul className="task-list">
                    {visibleTasks.map((task) => {
                      const isTaskExpanded = expandedTaskId === task.id;
                      const statusIndex = STATUS_ORDER.indexOf(task.status);
                      const canMovePrev = statusIndex > 0;
                      const canMoveNext = statusIndex < STATUS_ORDER.length - 1;

                      return (
                        <li key={task.id} className="task-item task-item-stacked">
                          <div className="task-item-main-row">
                            <div
                              onClick={() => toggleTaskDetail(task.id)}
                              className="task-title-toggle"
                              title="Klik untuk melihat/menyembunyikan deskripsi"
                            >
                              <span className="material-symbols-outlined task-expand-icon">
                                {isTaskExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                              <span className="task-title">{task.title}</span>
                            </div>

                            <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                              {PRIORITY_LABEL[task.priority]}
                            </span>
                          </div>

                          {isTaskExpanded && (
                            <div className="task-detail-body">
                              <p className="task-detail-desc">
                                <strong>Deskripsi:</strong>{' '}
                                {task.description || <em className="text-muted">Tidak ada deskripsi.</em>}
                              </p>
                              {task.due_date && (
                                <p className="task-detail-due">
                                  <span className="material-symbols-outlined task-detail-due-icon">
                                    event
                                  </span>
                                  <strong>Tenggat:</strong> {formatSafeDate(task.due_date)}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="task-item-footer">
                            <div className="task-move-controls">
                              <button
                                type="button"
                                className="move-btn"
                                onClick={() => handleMoveTask(task, 'prev')}
                                disabled={!canMovePrev}
                                aria-label="Mundurkan status"
                              >
                                <span className="material-symbols-outlined">chevron_left</span>
                                <span className="move-btn-label">Mundur</span>
                              </button>
                              <button
                                type="button"
                                className="move-btn move-btn-primary"
                                onClick={() => handleMoveTask(task, 'next')}
                                disabled={!canMoveNext}
                                aria-label="Majukan status"
                              >
                                <span className="move-btn-label">
                                  {canMoveNext ? `Ke ${STATUS_LABEL[STATUS_ORDER[statusIndex + 1]]}` : 'Selesai'}
                                </span>
                                <span className="material-symbols-outlined">chevron_right</span>
                              </button>
                            </div>

                            <div className="task-item-actions">
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
                                onClick={() => setTaskToDelete(task)}
                                aria-label={`Hapus tugas ${task.title}`}
                                title="Hapus tugas"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </div>

                          {editingTask?.id === task.id && (
                            <form className="new-task-form" onSubmit={handleUpdateTask}>
                              <div className="form-header">
                                <h4>Edit Tugas</h4>
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
                                    onChange={(e) => setEditTaskPriority(e.target.value as Task['priority'])}
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
                                <button type="button" className="btn-ghost" onClick={() => setEditingTask(null)}>
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

                {showNewTaskForm ? (
                  <form className="new-task-form" onSubmit={handleCreateTask}>
                    {createTaskError && <div className="error-message">{createTaskError}</div>}

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
                          onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
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
                      <button type="button" className="btn-ghost" onClick={() => setShowNewTaskForm(false)}>
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

      {/* Pop-up Hapus Tugas */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Hapus Tugas"
        message={`Apakah kamu yakin ingin menghapus tugas "${taskToDelete?.title}"?`}
        confirmLabel="Ya, Hapus"
        onConfirm={handleConfirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />

      {/* Pop-up Hapus Proyek */}
      <ConfirmModal
        isOpen={showDeleteProjectModal}
        title="Hapus Proyek"
        message={`Apakah kamu yakin ingin menghapus proyek "${project.title}" beserta seluruh tugas di dalamnya?`}
        confirmLabel="Ya, Hapus Proyek"
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setShowDeleteProjectModal(false)}
      />
    </>
  );
}