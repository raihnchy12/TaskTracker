// src/api/client.ts

// 1. Setup Base URL
const BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') 
  : 'http://localhost:3000';

const API_URL = `${BASE_URL}/api`;

// 2. Fetch Wrapper Client
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_URL}${formattedEndpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada server');
  }

  return data as T;
}

// ==========================================
// 3. TYPES / INTERFACES
// ==========================================

export interface Project {
  id: number;
  title: string;
  description?: string;
  owner_id: number;
  created_at?: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date?: string | null;
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
}

// ==========================================
// 4. API SERVICES: PROJECTS
// ==========================================

// Get All Projects
export async function getProjects() {
  return fetchApi<ApiResponse<Project[]>>('/projects');
}

// Create Project
export async function createProject(title: string, description?: string) {
  return fetchApi<ApiResponse<Project>>('/projects', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
}

// Edit / Update Project
export async function updateProject(id: number, title: string, description?: string) {
  return fetchApi<ApiResponse<Project>>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, description }),
  });
}

// Delete Project
export async function deleteProject(id: number) {
  return fetchApi<ApiResponse<Project>>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// 5. API SERVICES: TASKS
// ==========================================

// Get Tasks by Project ID
export async function getTasksByProject(projectId: number) {
  return fetchApi<ApiResponse<Task[]>>(`/tasks/project/${projectId}`);
}

// Create Task
export async function createTask(data: {
  project_id: number;
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date?: string | null;
}) {
  return fetchApi<ApiResponse<Task>>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Edit / Update Full Task Detail
export async function updateTask(
  id: number,
  data: {
    title: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    due_date?: string | null;
  }
) {
  return fetchApi<ApiResponse<Task>>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Quick Update Status Task
export async function updateTaskStatus(id: number, status: 'TODO' | 'IN_PROGRESS' | 'DONE') {
  return fetchApi<ApiResponse<Task>>(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Delete Task
export async function deleteTask(id: number) {
  return fetchApi<ApiResponse<{ id: number }>>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}