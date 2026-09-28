import { useState, useEffect, type FormEvent } from 'react';
import { fetchApi } from '../api/client';
import type { Project, Task, ApiResponse } from '../types';
import StatusTabs, { type TaskStatus } from './StatusTabs';
import ConfirmModal from './ConfirmModal';
import KanbanBoard from './KanbanBoard';
import Toast, { type ToastMessage } from './Toast';

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

type SortOption = 'dueDate' | 'createdAt' | 'priority';

const STATUS_LABEL: Record<Task['status'], string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
};

const STATUS_ORDER: Task['status'][] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onRequestMove,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasksForCounts, setAllTasksForCounts] = useState<Task[]>([]); // Menyimpan seluruh task untuk hitungan badge
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState('');

  // Mode Tampilan: Papan Kanban visual vs Daftar Tab status
  const [viewMode, setViewMode] = useState<'kanban' | 'tabs'>('kanban');

  // Filter, Search, Sorting & Pagination
  const [taskSearch, setTaskSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Task['priority']>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServerTasks, setTotalServerTasks] = useState(0);

  // Jika mode Kanban, muat seluruh task (limit 100). Jika Tab Status, tampilkan 5 task/halaman
  const limit = viewMode === 'kanban' ? 100 : 5;

  const [activeStatus, setActiveStatus] = useState<TaskStatus>('BACKLOG');
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  // Form Tambah Tugas
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('BACKLOG');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState('');

  // Form Edit Tugas
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Task['priority']>('MEDIUM');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [updatingTask, setUpdatingTask] = useState(false);
  const [updateTaskError, setUpdateTaskError] = useState('');

  // State Pop-up Modal & Toast
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Memuat total task secara keseluruhan untuk menghitung Badge Tab Status (bebas dari limit pagination)
  const loadAllTasksForCounts = async () => {
    try {
      const res: any = await fetchApi(`/tasks/project/${project.id}?limit=1000`);
      setAllTasksForCounts(res.data || []);
    } catch {
      // Fallback jika API gagal
    }
  };

  // Memuat tugas dari Backend dengan query params
  const loadTasks = async () => {
    setLoadingTasks(true);
    setTasksError('');
    try {
      const queryParams = new URLSearchParams({
        page: String(viewMode === 'kanban' ? 1 : currentPage),
        limit: String(limit),
        sort: sortBy,
      });

      if (taskSearch.trim()) queryParams.append('search', taskSearch.trim());
      if (priorityFilter !== 'ALL') queryParams.append('priority', priorityFilter);

      const res: any = await fetchApi(`/tasks/project/${project.id}?${queryParams.toString()}`);

      setTasks(res.data || []);

      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalServerTasks(res.pagination.totalTasks || (res.data ? res.data.length : 0));
      } else {
        setTotalPages(1);
        setTotalServerTasks(res.data ? res.data.length : 0);
      }
      setTasksLoaded(true);
    } catch (err: any) {
      setTasksError(err.message || 'Gagal memuat tugas');
    } finally {
      setLoadingTasks(false);
    }
  };

  // Reload data ketika ada perubahan state filter/pagination/viewMode
  useEffect(() => {
    if (expanded) {
      loadTasks();
      loadAllTasksForCounts();
    }
  }, [expanded, viewMode, currentPage, taskSearch, priorityFilter, sortBy]);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !tasksLoaded) {
      loadTasks();
      loadAllTasksForCounts();
    }
  };

  const toggleTaskDetail = (taskId: number) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  // Eksekusi perpindahan status tugas
  const executeMoveTask = async (task: Task, nextStatus: Task['status']) => {
    const previousStatus = task.status;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );
    setAllTasksForCounts((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );
    setActiveStatus(nextStatus);

    try {
      await fetchApi<ApiResponse<Task>>(`/tasks/${task.id}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status: nextStatus }),
});

      setToast({
        id: String(Date.now()),
        type: 'success',
        message: `Tugas "${task.title}" dipindahkan ke ${STATUS_LABEL[nextStatus]}!`,
      });

      // Reload tasks & reset ke Halaman 1 jika di mode Tab
      if (viewMode === 'tabs') {
        setCurrentPage(1);
      }
      loadTasks();
      loadAllTasksForCounts();
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: previousStatus } : t))
      );
      setAllTasksForCounts((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: previousStatus } : t))
      );
      setToast({
        id: String(Date.now()),
        type: 'error',
        message: err.message || 'Gagal memindahkan status tugas',
      });
    }
  };

  const handleMoveTaskTab = (task: Task, direction: 'prev' | 'next') => {
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
      await fetchApi<ApiResponse<Task>>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          project_id: project.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          status: newTaskStatus,
          priority: newTaskPriority,
          due_date: newTaskDueDate || null,
        }),
      });

      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskStatus('BACKLOG');
      setNewTaskPriority('MEDIUM');
      setNewTaskDueDate('');
      setShowNewTaskForm(false);
      setActiveStatus(newTaskStatus);

      // Reset ke Halaman 1 agar task baru langsung terlihat
      setCurrentPage(1);
      loadTasks();
      loadAllTasksForCounts();

      setToast({
        id: String(Date.now()),
        type: 'success',
        message: 'Tugas baru berhasil ditambahkan!',
      });
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
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? res.data : t))
        );
      }
      setEditingTask(null);
      loadAllTasksForCounts();

      setToast({
        id: String(Date.now()),
        type: 'success',
        message: 'Perubahan tugas berhasil disimpan!',
      });
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
      setToast({
        id: String(Date.now()),
        type: 'info',
        message: `Tugas "${taskToDelete.title}" telah dihapus`,
      });
      loadTasks();
      loadAllTasksForCounts();
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        message: err.message || 'Gagal menghapus tugas',
      });
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

  // Menghitung total tugas per status dari seluruh data proyek (allTasksForCounts)
  const totalCounts = STATUS_ORDER.reduce((acc, status) => {
    const list = allTasksForCounts.length > 0 ? allTasksForCounts : tasks;
    acc[status] = list.filter((t) => t.status === status).length;
    return acc;
  }, {} as Record<Task['status'], number>);

  const totalTasks = totalServerTasks || tasks.length;
  const doneTasks = (allTasksForCounts.length > 0 ? allTasksForCounts : tasks).filter((t) => t.status === 'DONE').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const visibleTabTasks = tasks.filter((t) => t.status === activeStatus);

  const handleOpenAddTaskToStatus = (status: Task['status']) => {
    setNewTaskStatus(status);
    setShowNewTaskForm(true);
  };

  return (
    <>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <li className="project-card">
        {/* Header Kartu Proyek */}
        <div className="project-card-header">
          <div className="project-card-info">
            <div className="project-card-title-group">
              <h3>{project.title}</h3>
              {tasksLoaded && (
                <span
                  className={`project-status-badge ${progressPercent === 100 ? 'done-badge' : ''}`}
                >
                  {progressPercent === 100
                    ? '🎉 Selesai'
                    : `${doneTasks}/${totalTasks} Tugas`}
                </span>
              )}
            </div>
            {project.description && (
              <p className="project-card-desc">{project.description}</p>
            )}
          </div>

          <div className="project-card-controls">
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

        {/* Progress Bar Proyek */}
        {tasksLoaded && totalTasks > 0 && (
          <div className="project-progress-container" title={`${progressPercent}% selesai`}>
            <div className="project-progress-header">
              <span className="progress-label">Progres Penyelesaian</span>
              <span className="progress-percent">{progressPercent}%</span>
            </div>
            <div className="project-progress-track">
              <div
                className="project-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Toggle Buka/Tutup Tugas */}
        <div className="project-card-toggle-row">
          <button type="button" className="link-toggle" onClick={toggleExpanded}>
            <span className="material-symbols-outlined">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
            <span>
              {expanded
                ? 'Sembunyikan tugas'
                : `Lihat tugas ${tasksLoaded ? `(${totalTasks})` : ''}`}
            </span>
          </button>

          {expanded && (
            <div className="view-mode-toggle-group">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
                title="Tampilan Papan Kanban (Drag & Drop)"
              >
                <span className="material-symbols-outlined">view_kanban</span>
                <span>Papan Kanban</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'tabs' ? 'active' : ''}`}
                onClick={() => setViewMode('tabs')}
                title="Tampilan Daftar Status (Tabs)"
              >
                <span className="material-symbols-outlined">view_agenda</span>
                <span>Tab Status</span>
              </button>
            </div>
          )}
        </div>

        {/* Panel Konten Tugas */}
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
                {/* Bar Filter, Pencarian, & Sorting Tugas */}
                <div className="task-filter-bar">
                  <div className="task-search-input-wrap">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                      type="text"
                      placeholder="Cari tugas di proyek ini..."
                      value={taskSearch}
                      onChange={(e) => {
                        setTaskSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                    {taskSearch && (
                      <button
                        type="button"
                        className="clear-search-btn"
                        onClick={() => {
                          setTaskSearch('');
                          setCurrentPage(1);
                        }}
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    )}
                  </div>

                  <div className="task-priority-filter-wrap">
                    <label>Prioritas:</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => {
                        setPriorityFilter(e.target.value as 'ALL' | Task['priority']);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="ALL">Semua</option>
                      <option value="HIGH">Tinggi</option>
                      <option value="MEDIUM">Sedang</option>
                      <option value="LOW">Rendah</option>
                    </select>
                  </div>

                  {/* Dropdown Sorting */}
                  <div className="task-sort-wrap">
                    <label htmlFor={`sort-select-${project.id}`}>Urutkan:</label>
                    <select
                      id={`sort-select-${project.id}`}
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as SortOption);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="dueDate">Tenggat Terdekat</option>
                      <option value="priority">Prioritas Tertinggi</option>
                      <option value="createdAt">Tanggal Dibuat (Terbaru)</option>
                    </select>
                  </div>

                  {!showNewTaskForm && (
                    <button
                      type="button"
                      className="btn-gradient btn-small add-task-top-btn"
                      onClick={() => {
                        setNewTaskStatus('BACKLOG');
                        setShowNewTaskForm(true);
                      }}
                    >
                      <span className="material-symbols-outlined">add</span>
                      <span>Tambah Tugas</span>
                    </button>
                  )}
                </div>

                {/* Form Tambah Tugas Baru */}
                {showNewTaskForm && (
                  <form className="new-task-form highlight-form" onSubmit={handleCreateTask}>
                    <div className="form-header">
                      <h4>
                        Tambah Tugas Baru ke "{STATUS_LABEL[newTaskStatus]}"
                      </h4>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setShowNewTaskForm(false)}
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    {createTaskError && (
                      <div className="error-message">{createTaskError}</div>
                    )}

                    <div className="form-group">
                      <label>Nama Tugas *</label>
                      <input
                        type="text"
                        placeholder="Contoh: Implementasi autentikasi JWT"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label>Deskripsi (opsional)</label>
                      <textarea
                        rows={2}
                        placeholder="Detail dan petunjuk pengerjaan tugas"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Status Kolom</label>
                        <select
                          value={newTaskStatus}
                          onChange={(e) =>
                            setNewTaskStatus(e.target.value as Task['status'])
                          }
                        >
                          <option value="BACKLOG">Backlog</option>
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="REVIEW">Review</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>

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

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn-gradient btn-small"
                        disabled={creatingTask}
                      >
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
                )}

                {/* Tampilan 1: Papan Kanban Visual (Drag & Drop) */}
                {viewMode === 'kanban' && (
                  <div className="kanban-view-container">
                    <p className="kanban-hint">
                      💡 <em>Tips: Tarik dan geser kartu antar kolom untuk mengubah status tugas secara langsung.</em>
                    </p>
                    <KanbanBoard
                      tasks={allTasksForCounts.length > 0 ? allTasksForCounts : tasks}
                      onMoveTask={executeMoveTask}
                      onEditTask={handleOpenEditTask}
                      onDeleteTask={(t) => setTaskToDelete(t)}
                      onAddTaskToStatus={handleOpenAddTaskToStatus}
                    />
                  </div>
                )}

                {/* Tampilan 2: Daftar Tab Status Tradisional */}
                {viewMode === 'tabs' && (
                  <div className="tabs-view-container">
                    <StatusTabs
                      tasks={tasks}
                      active={activeStatus}
                      onChange={setActiveStatus}
                      totalCounts={totalCounts}
                    />

                    {visibleTabTasks.length === 0 ? (
                      <div className="empty-status-state">
                        <p className="text-muted task-empty">
                          Tidak ada tugas berstatus "{STATUS_LABEL[activeStatus]}" di halaman ini.
                        </p>
                        {totalCounts[activeStatus] > 0 && (
                          <p className="hint-other-page">
                            💡 Terdapat total <strong>{totalCounts[activeStatus]}</strong> tugas berstatus ini di halaman lain. Gunakan tombol navigasi halaman di bawah untuk melihatnya.
                          </p>
                        )}
                      </div>
                    ) : (
                      <ul className="task-list">
                        {visibleTabTasks.map((task) => {
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

                                <span
                                  className={`badge badge-priority-${task.priority.toLowerCase()}`}
                                >
                                  {PRIORITY_LABEL[task.priority]}
                                </span>
                              </div>

                              {isTaskExpanded && (
                                <div className="task-detail-body">
                                  <p className="task-detail-desc">
                                    <strong>Deskripsi:</strong>{' '}
                                    {task.description || (
                                      <em className="text-muted">Tidak ada deskripsi.</em>
                                    )}
                                  </p>
                                  {task.due_date && (
                                    <p className="task-detail-due">
                                      <span className="material-symbols-outlined task-detail-due-icon">
                                        event
                                      </span>
                                      <strong>Tenggat:</strong>{' '}
                                      {formatSafeDate(task.due_date)}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="task-item-footer">
                                <div className="task-move-controls">
                                  <button
                                    type="button"
                                    className="move-btn"
                                    onClick={() => handleMoveTaskTab(task, 'prev')}
                                    disabled={!canMovePrev}
                                    aria-label="Mundurkan status"
                                  >
                                    <span className="material-symbols-outlined">
                                      chevron_left
                                    </span>
                                    <span className="move-btn-label">Mundur</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="move-btn move-btn-primary"
                                    onClick={() => handleMoveTaskTab(task, 'next')}
                                    disabled={!canMoveNext}
                                    aria-label="Majukan status"
                                  >
                                    <span className="move-btn-label">
                                      {canMoveNext
                                        ? `Ke ${STATUS_LABEL[STATUS_ORDER[statusIndex + 1]]}`
                                        : 'Selesai'}
                                    </span>
                                    <span className="material-symbols-outlined">
                                      chevron_right
                                    </span>
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
                                    <span className="material-symbols-outlined">
                                      delete
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {/* Kontrol UI Pagination - Hanya Tampil saat Berada di Mode Tab Status */}
                {viewMode === 'tabs' && totalServerTasks > 0 && (
                  <div className="pagination-bar">
                    <span className="pagination-info">
                      Hal. <strong>{currentPage}</strong>/<strong>{totalPages}</strong> ({totalServerTasks} Task)
                    </span>
                    <div className="pagination-buttons">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                      >
                        &larr; Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="pagination-btn"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </li>

      {/* Modal Edit Detail Tugas */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="material-symbols-outlined modal-icon">edit_note</span>
              <h3>Edit Tugas</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingTask(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {updateTaskError && <div className="error-message">{updateTaskError}</div>}

            <form onSubmit={handleUpdateTask} className="new-task-form">
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
                  rows={3}
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

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-gradient btn-small"
                  disabled={updatingTask}
                >
                  <span>{updatingTask ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
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
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Task */}
      {taskToDelete && (
        <ConfirmModal
          isOpen={!!taskToDelete}
          title="Hapus Tugas"
          message={`Apakah kamu yakin ingin menghapus tugas "${taskToDelete.title}"?`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          isDanger
          onConfirm={handleConfirmDeleteTask}
          onCancel={() => setTaskToDelete(null)}
        />
      )}

      {/* Modal Konfirmasi Hapus Proyek */}
      {showDeleteProjectModal && (
        <ConfirmModal
          isOpen={showDeleteProjectModal}
          title="Hapus Proyek"
          message={`Apakah kamu yakin ingin menghapus proyek "${project.title}"? Semua tugas di dalamnya akan ikut terhapus.`}
          confirmLabel="Hapus Proyek"
          cancelLabel="Batal"
          isDanger
          onConfirm={handleConfirmDeleteProject}
          onCancel={() => setShowDeleteProjectModal(false)}
        />
      )}
    </>
  );
}