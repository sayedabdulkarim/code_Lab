import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Project, ProjectTemplate } from '../types';
import { getTemplateFiles, getTemplateDependencies } from '../utils/templates';

interface ProjectsStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchUserProjects: (userId: string) => Promise<void>;
  fetchPublicProjects: (limitCount?: number) => Promise<void>;
  fetchProject: (projectId: string) => Promise<Project | null>;
  createProject: (
    userId: string,
    name: string,
    description: string,
    template: ProjectTemplate
  ) => Promise<string>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  forkProject: (projectId: string, userId: string) => Promise<string>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchUserProjects: async (userId) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'projects'),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Project[];
      set({ projects, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPublicProjects: async (limitCount = 20) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'projects'),
        where('isPublic', '==', true),
        orderBy('stars', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Project[];
      set({ projects, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const project = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as Project;
        set({ currentProject: project, loading: false });
        return project;
      } else {
        set({ error: 'Project not found', loading: false });
        return null;
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  createProject: async (userId, name, description, template) => {
    set({ loading: true, error: null });
    try {
      const files = getTemplateFiles(template);
      const dependencies = getTemplateDependencies(template);
      const projectData = {
        name,
        description,
        template,
        files,
        dependencies,
        ownerId: userId,
        isPublic: false,
        stars: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'projects'), projectData);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProject: async (projectId, updates) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'projects', projectId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      const { currentProject, projects } = get();
      if (currentProject?.id === projectId) {
        set({
          currentProject: { ...currentProject, ...updates },
        });
      }
      set({
        projects: projects.map((p) =>
          p.id === projectId ? { ...p, ...updates } : p
        ),
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'projects', projectId));

      const { projects, currentProject } = get();
      set({
        projects: projects.filter((p) => p.id !== projectId),
        currentProject: currentProject?.id === projectId ? null : currentProject,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  forkProject: async (projectId, userId) => {
    set({ loading: true, error: null });
    try {
      const original = await get().fetchProject(projectId);
      if (!original) throw new Error('Project not found');

      const forkedProject = {
        name: `${original.name} (Fork)`,
        description: original.description,
        template: original.template,
        files: original.files,
        ownerId: userId,
        isPublic: false,
        forkedFrom: projectId,
        stars: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'projects'), forkedProject);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  clearError: () => set({ error: null }),
}));
