import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { fetchApi } from '../api/client';
import type { Project, ApiResponse } from '../types';
import ProjectCard from './ProjectCard';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');

  // State Form Tambah Proyek
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // State Form Edit Proyek
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetchApi<ApiResponse<Project[]>>('/projects');
        setProjects(res.data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat proyek');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    );
  }, [projects, search]);

  // Handler Tambah Proyek
  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newTitle.trim()) {
      setCreateError('Nama proyek wajib diisi');
      return;
    }

    setCreating(true);
    try {
      const res = await fetchApi<ApiResponse<Project>>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        }),
      });

      setProjects((prev) => [res.data, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setShowNewForm(false);
    } catch (err: any) {
      setCreateError(err.message || 'Gagal membuat proyek');
    } finally {
      setCreating(false);
    }
  };

  // Handler Buka Form Edit
  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description || '');
    setUpdateError('');
  };

  // Handler Simpan Edit Proyek
  const handleUpdateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setUpdateError('');

    if (!editTitle.trim()) {
      setUpdateError('Nama proyek wajib diisi');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetchApi<ApiResponse<Project>>(`/projects/${editingProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });

      // Update state local proyek yang diedit
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? res.data : p))
      );
      setEditingProject(null);
    } catch (err: any) {
      setUpdateError(err.message || 'Gagal memperbarui proyek');
    } finally {
      setUpdating(false);
    }
  };

  // Handler Hapus Proyek
  const handleDeleteProject = async (projectId: number) => {
    const confirmed = window.confirm('Hapus proyek ini beserta seluruh tugasnya?');
    if (!confirmed) return;

    try {
      await fetchApi<ApiResponse<Project>>(`/projects/${projectId}`, {
        method: 'DELETE',
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus proyek');
    }
  };

  if (loading) {
    return (
      <div className="state-message loading-state">
        <span className="spinner" aria-hidden="true" />
        <p>Memuat daftar proyek...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-message error-state">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="project-list">
      <div className="search-bar">
        <span className="material-symbols-outlined">search</span>
        <input
          type="text"
          placeholder="Cari proyek..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="project-list-header">
        <h2>Daftar Proyek Kamu</h2>
        <div className="project-list-header-actions">
          <span className="project-count">{projects.length} proyek</span>
          <button
            type="button"
            className="btn-gradient btn-small"
            onClick={() => setShowNewForm((prev) => !prev)}
          >
            <span className="material-symbols-outlined">{showNewForm ? 'close' : 'add'}</span>
            <span>{showNewForm ? 'Batal' : 'Tambah Proyek'}</span>
          </button>
        </div>
      </div>

      {showNewForm && (
        <form className="new-project-form" onSubmit={handleCreateProject}>
          {createError && <div className="error-message">{createError}</div>}

          <div className="form-group">
            <label>Nama Proyek *</label>
            <input
              type="text"
              placeholder="Contoh: Redesign Website"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Deskripsi (opsional)</label>
            <textarea
              rows={2}
              placeholder="Ceritakan singkat tentang proyek ini"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-gradient" disabled={creating}>
            <span>{creating ? 'Menyimpan...' : 'Simpan Proyek'}</span>
          </button>
        </form>
      )}

      {/* Form Modal / Card Edit Proyek */}
      {editingProject && (
        <form className="new-project-form edit-project-form" onSubmit={handleUpdateProject}>
          <div className="form-header">
            <h3>Edit Proyek</h3>
            <button
              type="button"
              className="btn-close"
              onClick={() => setEditingProject(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {updateError && <div className="error-message">{updateError}</div>}

          <div className="form-group">
            <label>Nama Proyek *</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Deskripsi (opsional)</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn-gradient" disabled={updating}>
              <span>{updating ? 'Memperbarui...' : 'Simpan Perubahan'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditingProject(null)}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <p>
            {projects.length === 0
              ? 'Belum ada proyek. Mulai dengan menambahkan proyek pertamamu.'
              : 'Tidak ada proyek yang cocok dengan pencarianmu.'}
          </p>
        </div>
      ) : (
        <ul className="project-grid">
          {filteredProjects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onEdit={() => handleOpenEditModal(proj)}
              onDelete={() => handleDeleteProject(proj.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}