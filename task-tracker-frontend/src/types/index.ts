// src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  owner_id: number;
  created_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date: string | null;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user?: { id: number;
    name: string;
    email: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  total?: number;
  data: T;
}