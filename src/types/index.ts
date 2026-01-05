// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  template: ProjectTemplate;
  files: ProjectFile[];
  ownerId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  forkedFrom?: string;
  stars: number;
  views: number;
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

export type ProjectTemplate =
  | 'react'
  | 'react-ts'
  | 'vanilla'
  | 'vanilla-ts'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'nextjs';

// Editor types
export interface EditorState {
  activeFile: string | null;
  openFiles: string[];
  unsavedChanges: Set<string>;
}

export interface EditorSettings {
  theme: 'vs-dark' | 'vs-light';
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
}

// Template configuration
export interface TemplateConfig {
  name: string;
  icon: string;
  description: string;
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// Search types
export interface SearchResult {
  id: string;
  name: string;
  description: string;
  owner: string;
  stars: number;
  template: ProjectTemplate;
}

// Auth state
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
