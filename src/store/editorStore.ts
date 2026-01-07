import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EditorSettings, ProjectFile } from '../types';

interface EditorStore {
  // State
  activeFile: string | null;
  openFiles: string[];
  files: ProjectFile[];
  unsavedChanges: Set<string>;
  settings: EditorSettings;
  dependencies: Record<string, string>;
  dependenciesChanged: boolean;

  // Actions
  setActiveFile: (path: string) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setFiles: (files: ProjectFile[]) => void;
  updateFileContent: (path: string, content: string) => void;
  markSaved: (path: string) => void;
  updateSettings: (settings: Partial<EditorSettings>) => void;
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  setDependencies: (deps: Record<string, string>) => void;
  addDependency: (name: string, version: string) => void;
  removeDependency: (name: string) => void;
  markDependenciesSaved: () => void;
  reset: () => void;
}

const defaultSettings: EditorSettings = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimap: true,
  lineNumbers: 'on',
};

const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascriptreact',  // Monaco needs this for JSX support
    ts: 'typescript',
    tsx: 'typescriptreact',  // Monaco needs this for TSX/JSX support
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    py: 'python',
    vue: 'vue',
    svelte: 'svelte',
  };
  return languageMap[ext || ''] || 'plaintext';
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      activeFile: null,
      openFiles: [],
      files: [],
      unsavedChanges: new Set(),
      settings: defaultSettings,
      dependencies: {},
      dependenciesChanged: false,

      setActiveFile: (path) => {
        const { openFiles } = get();
        if (!openFiles.includes(path)) {
          set({ openFiles: [...openFiles, path] });
        }
        set({ activeFile: path });
      },

      openFile: (path) => {
        const { openFiles } = get();
        if (!openFiles.includes(path)) {
          set({ openFiles: [...openFiles, path], activeFile: path });
        } else {
          set({ activeFile: path });
        }
      },

      closeFile: (path) => {
        const { openFiles, activeFile, unsavedChanges } = get();
        const newOpenFiles = openFiles.filter((f) => f !== path);
        const newUnsaved = new Set(unsavedChanges);
        newUnsaved.delete(path);

        let newActiveFile = activeFile;
        if (activeFile === path) {
          const currentIndex = openFiles.indexOf(path);
          newActiveFile =
            newOpenFiles[currentIndex] ||
            newOpenFiles[currentIndex - 1] ||
            null;
        }

        set({
          openFiles: newOpenFiles,
          activeFile: newActiveFile,
          unsavedChanges: newUnsaved,
        });
      },

      setFiles: (files) => set({ files }),

      updateFileContent: (path, content) => {
        const { files, unsavedChanges } = get();
        const newFiles = files.map((f) =>
          f.path === path ? { ...f, content } : f
        );
        const newUnsaved = new Set(unsavedChanges);
        newUnsaved.add(path);
        set({ files: newFiles, unsavedChanges: newUnsaved });
      },

      markSaved: (path) => {
        const { unsavedChanges } = get();
        const newUnsaved = new Set(unsavedChanges);
        newUnsaved.delete(path);
        set({ unsavedChanges: newUnsaved });
      },

      updateSettings: (newSettings) => {
        const { settings } = get();
        set({ settings: { ...settings, ...newSettings } });
      },

      createFile: (path, content = '') => {
        const { files, unsavedChanges } = get();
        if (files.some((f) => f.path === path)) return;

        const newFile: ProjectFile = {
          path,
          content,
          language: getLanguageFromPath(path),
        };
        // Mark new file as unsaved so auto-save picks it up
        const newUnsaved = new Set(unsavedChanges);
        newUnsaved.add(path);
        set({ files: [...files, newFile], unsavedChanges: newUnsaved });
      },

      deleteFile: (path) => {
        const { files, openFiles, activeFile, unsavedChanges } = get();
        const newFiles = files.filter((f) => f.path !== path);
        const newOpenFiles = openFiles.filter((f) => f !== path);
        const newUnsaved = new Set(unsavedChanges);
        newUnsaved.delete(path);

        let newActiveFile = activeFile;
        if (activeFile === path) {
          newActiveFile = newOpenFiles[0] || null;
        }

        set({
          files: newFiles,
          openFiles: newOpenFiles,
          activeFile: newActiveFile,
          unsavedChanges: newUnsaved,
        });
      },

      renameFile: (oldPath, newPath) => {
        const { files, openFiles, activeFile, unsavedChanges } = get();

        const newFiles = files.map((f) =>
          f.path === oldPath
            ? { ...f, path: newPath, language: getLanguageFromPath(newPath) }
            : f
        );

        const newOpenFiles = openFiles.map((f) =>
          f === oldPath ? newPath : f
        );

        const newUnsaved = new Set(
          [...unsavedChanges].map((f) => (f === oldPath ? newPath : f))
        );

        set({
          files: newFiles,
          openFiles: newOpenFiles,
          activeFile: activeFile === oldPath ? newPath : activeFile,
          unsavedChanges: newUnsaved,
        });
      },

      setDependencies: (deps) => set({ dependencies: deps, dependenciesChanged: false }),

      addDependency: (name, version) => {
        const { dependencies } = get();
        set({
          dependencies: { ...dependencies, [name]: version },
          dependenciesChanged: true,
        });
      },

      removeDependency: (name) => {
        const { dependencies } = get();
        const newDeps = { ...dependencies };
        delete newDeps[name];
        set({ dependencies: newDeps, dependenciesChanged: true });
      },

      markDependenciesSaved: () => set({ dependenciesChanged: false }),

      reset: () =>
        set({
          activeFile: null,
          openFiles: [],
          files: [],
          unsavedChanges: new Set(),
          dependencies: {},
          dependenciesChanged: false,
        }),
    }),
    {
      name: 'codelab-editor-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
