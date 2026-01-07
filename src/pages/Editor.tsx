import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
  SandpackLayout,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {
  Button,
  Text,
  Group,
  Stack,
  Spinner,
  Badge,
} from 'ui_zenkit';
import { useProjectsStore, useEditorStore, useToastStore } from '../store';
import { DependencyPanel } from '../components/DependencyPanel';
import type { ProjectFile } from '../types';

// The iframe shell HTML - defined OUTSIDE component to prevent re-creation
const IFRAME_SHELL = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style id="__css__"></style>
</head>
<body>
  <div id="__html__"></div>
  <script>
    var __lastJs__ = '';

    // Signal parent when ready
    window.parent.postMessage({ type: 'ready' }, '*');

    // Listen for updates from parent
    window.addEventListener('message', function(e) {
      if (!e.data || e.data.type !== 'update') return;

      // Update CSS (instant - no reload)
      if (e.data.css !== undefined) {
        document.getElementById('__css__').textContent = e.data.css;
      }

      // Update HTML (instant - no reload)
      if (e.data.html !== undefined) {
        document.getElementById('__html__').innerHTML = e.data.html;
      }

      // Execute JS - wrap in IIFE to avoid redeclaration errors
      if (e.data.js !== undefined && e.data.js !== __lastJs__) {
        __lastJs__ = e.data.js;
        try {
          // Wrap in IIFE to create fresh scope (avoids const/let redeclaration errors)
          var wrappedCode = '(function() {\\n' + e.data.js + '\\n})();';
          var fn = new Function(wrappedCode);
          fn();
        } catch(err) {
          console.error('JS Error:', err.message);
        }
      }
    });
  </script>
</body>
</html>`;

// Vanilla Preview Component - Live updates WITHOUT page reload
// Based on: https://joyofcode.xyz/avoid-flashing-iframe
const VanillaPreview = ({ files }: { files: ProjectFile[] }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [previewUrl] = useState(() => `https://${Math.random().toString(36).slice(2, 8)}.preview.local/`);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Set srcdoc only ONCE on mount (not through React render)
  useEffect(() => {
    if (iframeRef.current && !initializedRef.current) {
      initializedRef.current = true;
      iframeRef.current.srcdoc = IFRAME_SHELL;
    }
  }, []);

  // Extract body content from HTML (without doctype, html, head, body tags)
  const extractBodyContent = useCallback((html: string): string => {
    if (!html) return '';

    // Try to extract content between <body> tags
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      let content = bodyMatch[1];
      // Remove script tags (we handle JS separately)
      content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
      return content.trim();
    }

    // If no body tags, return as-is but remove scripts
    return html.replace(/<script[\s\S]*?<\/script>/gi, '').trim();
  }, []);

  // Get file contents
  const getContents = useCallback(() => {
    const htmlFile = files.find(f => f.path === '/index.html' || f.path === 'index.html');
    const cssFile = files.find(f => f.path.endsWith('.css'));
    const jsFile = files.find(f => f.path.endsWith('.js') && !f.path.includes('package.json'));

    return {
      html: extractBodyContent(htmlFile?.content || ''),
      css: cssFile?.content || '',
      js: jsFile?.content || '',
    };
  }, [files, extractBodyContent]);

  // Listen for ready signal from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'ready') {
        setIsReady(true);
        // Send initial content when iframe is ready
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          const { html, css, js } = getContents();
          iframe.contentWindow.postMessage({ type: 'update', html, css, js }, '*');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [getContents]);

  // Send updates to iframe when files change
  useEffect(() => {
    if (!isReady) return;

    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    // Debounce updates
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const { html, css, js } = getContents();

      // Send update to iframe - it will update DOM without reload
      iframe.contentWindow?.postMessage({
        type: 'update',
        html,
        css,
        js,
      }, '*');
    }, 150); // Fast 150ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [files, isReady, getContents]);

  // Manual refresh - force iframe to reload
  const handleRefresh = useCallback(() => {
    setIsReady(false);
    initializedRef.current = false;
    if (iframeRef.current) {
      iframeRef.current.srcdoc = IFRAME_SHELL;
    }
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{
        height: '40px',
        background: '#1e1e1e',
        borderBottom: '1px solid #374151',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: '4px',
      }}>
        <button
          onClick={handleRefresh}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '6px 8px',
            borderRadius: '4px',
          }}
          title="Refresh"
        >
          ↻
        </button>
        <div style={{
          flex: 1,
          background: '#0f172a',
          borderRadius: '4px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ color: '#10b981', fontSize: '11px' }}>●</span>
          <span style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace' }}>
            {previewUrl}
          </span>
        </div>
      </div>
      {/* Iframe - srcdoc set imperatively, NOT through React */}
      <iframe
        ref={iframeRef}
        title="Preview"
        sandbox="allow-scripts allow-modals"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          background: '#fff',
        }}
      />
    </div>
  );
};

// Custom React Preview with URL bar - matches VanillaPreview style
const ReactPreviewWrapper = ({ projectName }: { projectName: string }) => {
  const { sandpack } = useSandpack();
  const [previewUrl] = useState(() => {
    const slug = projectName?.toLowerCase().replace(/\s+/g, '-') || 'project';
    return `https://${slug}.codesandbox.io/`;
  });

  const handleRefresh = () => {
    // Trigger Sandpack refresh
    sandpack.runSandpack();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Custom Toolbar */}
      <div style={{
        height: '40px',
        background: '#1e1e1e',
        borderBottom: '1px solid #374151',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: '8px',
        flexShrink: 0,
      }}>
        <button
          onClick={handleRefresh}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '6px 8px',
            borderRadius: '4px',
          }}
          title="Refresh"
        >
          ↻
        </button>
        <div style={{
          flex: 1,
          background: '#0f172a',
          borderRadius: '4px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ color: '#10b981', fontSize: '11px' }}>●</span>
          <span style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace' }}>
            {previewUrl}
          </span>
        </div>
      </div>
      {/* Sandpack Preview - hidden navigator since we have custom toolbar */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SandpackPreview
          showNavigator={false}
          showRefreshButton={false}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
};

// File icon helper
const getFileIcon = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    js: '📜',
    jsx: '⚛️',
    ts: '📘',
    tsx: '⚛️',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    json: '📋',
    md: '📝',
    vue: '💚',
    svelte: '🧡',
  };
  return icons[ext || ''] || '📄';
};

// Build file tree from flat file list
interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

interface FileTreeBuildNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  childrenMap?: Record<string, FileTreeBuildNode>;
}

const buildFileTree = (files: { path: string }[]): FileTreeNode[] => {
  const root: Record<string, FileTreeBuildNode> = {};

  files.forEach(file => {
    const parts = file.path.replace(/^\//, '').split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = '/' + parts.slice(0, index + 1).join('/');

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          childrenMap: isFile ? undefined : {},
        };
      }

      if (!isFile && current[part].childrenMap) {
        current = current[part].childrenMap!;
      }
    });
  });

  // Convert to array and sort (folders first, then files)
  const toArray = (obj: Record<string, FileTreeBuildNode>): FileTreeNode[] => {
    return Object.values(obj)
      .map(node => ({
        name: node.name,
        path: node.path,
        type: node.type,
        children: node.childrenMap ? toArray(node.childrenMap) : undefined,
      }))
      .sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
  };

  return toArray(root);
};

// File Tree Item Component
const FileTreeItem = ({
  node,
  depth,
  activeFile,
  unsavedChanges,
  expandedFolders,
  selectedFolder,
  onToggleFolder,
  onOpenFile,
}: {
  node: FileTreeNode;
  depth: number;
  activeFile: string | null;
  unsavedChanges: Set<string>;
  expandedFolders: Set<string>;
  selectedFolder: string | null;
  onToggleFolder: (path: string) => void;
  onOpenFile: (path: string) => void;
}) => {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFile === node.path;
  const isSelected = selectedFolder === node.path;

  return (
    <div>
      <div
        onClick={() => isFolder ? onToggleFolder(node.path) : onOpenFile(node.path)}
        style={{
          padding: '4px 8px',
          paddingLeft: `${8 + depth * 12}px`,
          borderRadius: '4px',
          cursor: 'pointer',
          background: isSelected ? 'rgba(99, 102, 241, 0.2)' : isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
          color: isSelected ? '#a5b4fc' : isActive ? '#818cf8' : '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          marginBottom: '1px',
          borderLeft: isSelected ? '2px solid #818cf8' : '2px solid transparent',
        }}
        onMouseEnter={(e) => !isActive && !isSelected && ((e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={(e) => !isActive && !isSelected && ((e.target as HTMLElement).style.background = 'transparent')}
      >
        {isFolder ? (
          <span style={{ fontSize: '10px', color: '#64748b', width: '12px' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        ) : (
          <span style={{ width: '12px' }} />
        )}
        <span>{isFolder ? '📁' : getFileIcon(node.path)}</span>
        <span style={{ flex: 1 }}>{node.name}</span>
        {!isFolder && unsavedChanges.has(node.path) && (
          <span style={{ color: '#eab308', fontSize: '10px' }}>●</span>
        )}
      </div>
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              unsavedChanges={unsavedChanges}
              expandedFolders={expandedFolders}
              selectedFolder={selectedFolder}
              onToggleFolder={onToggleFolder}
              onOpenFile={onOpenFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject, loading: projectLoading } = useProjectsStore();
  const {
    activeFile,
    openFiles,
    files,
    unsavedChanges,
    settings,
    dependencies,
    dependenciesChanged,
    setFiles,
    setActiveFile,
    openFile,
    closeFile,
    updateFileContent,
    markSaved,
    createFile,
    setDependencies,
    addDependency,
    removeDependency,
    markDependenciesSaved,
    reset,
  } = useEditorStore();
  const toast = useToastStore();

  const [showConsole, setShowConsole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track template type to prevent unmounting during save
  // Once set to vanilla, stay vanilla until explicitly changed to another template
  const templateRef = useRef<string | null>(null);
  if (currentProject?.template && templateRef.current !== currentProject.template) {
    templateRef.current = currentProject.template;
  }
  const isVanilla = templateRef.current === 'vanilla';

  // File modal state
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileModalType, setFileModalType] = useState<'file' | 'folder'>('file');
  const [newFileName, setNewFileName] = useState('');

  // Selected folder for context-aware file creation
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Expanded folders state for file tree
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/src', '/public']));

  const toggleFolder = useCallback((path: string) => {
    // Set this folder as selected
    setSelectedFolder(path);
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Build file tree from files
  const fileTree = buildFileTree(files);

  // Track if we've initialized files for this project
  const initializedProjectRef = useRef<string | null>(null);

  // Fetch project on mount
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
    return () => {
      reset();
      initializedProjectRef.current = null;
    };
  }, [projectId, fetchProject, reset]);

  // Helper to get correct Monaco language from file path
  const getMonacoLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascriptreact',
      ts: 'typescript',
      tsx: 'typescriptreact',
      css: 'css',
      scss: 'scss',
      html: 'html',
      json: 'json',
      md: 'markdown',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  // Set files and dependencies ONLY when project first loads (not on every change)
  useEffect(() => {
    // Only initialize files once per project
    if (currentProject?.id && initializedProjectRef.current !== currentProject.id) {
      // Reset editor state first (clear old project's open tabs)
      reset();
      initializedProjectRef.current = currentProject.id;

      if (currentProject.files) {
        // Fix language mapping for all files (existing projects may have wrong language)
        let projectFiles = currentProject.files.map(f => ({
          ...f,
          language: getMonacoLanguage(f.path),
        }));

        // Auto-generate package.json if it doesn't exist (for React projects)
        if (currentProject.template !== 'vanilla') {
          const hasPackageJson = projectFiles.some(f => f.path === '/package.json' || f.path === 'package.json');
          if (!hasPackageJson) {
            const packageJson = {
              name: currentProject.name?.toLowerCase().replace(/\s+/g, '-') || 'react-app',
              version: '1.0.0',
              main: currentProject.template === 'react-ts' ? '/src/index.tsx' : '/src/index.js',
              dependencies: currentProject.dependencies || {},
            };
            projectFiles.push({
              path: '/package.json',
              content: JSON.stringify(packageJson, null, 2),
              language: 'json',
            });
          }
        }

        setFiles(projectFiles);
        // Open first file by default
        if (projectFiles.length > 0) {
          const firstFile = projectFiles.find(f => f.path.endsWith('.js') || f.path.endsWith('.tsx') || f.path.endsWith('.ts'))
            || projectFiles[0];
          setActiveFile(firstFile.path);
        }
      }
      if (currentProject.dependencies) {
        setDependencies(currentProject.dependencies);
      }
    }
  }, [currentProject, setFiles, setActiveFile, setDependencies, reset]);

  // Keep package.json in sync with dependencies (for React projects)
  useEffect(() => {
    if (currentProject?.template === 'vanilla' || !initializedProjectRef.current) return;

    const packageJsonIndex = files.findIndex(f => f.path === '/package.json' || f.path === 'package.json');
    if (packageJsonIndex === -1) return;

    try {
      const currentPackageJson = JSON.parse(files[packageJsonIndex].content);
      const updatedPackageJson = {
        ...currentPackageJson,
        dependencies: dependencies,
      };
      const newContent = JSON.stringify(updatedPackageJson, null, 2);

      // Only update if content actually changed
      if (files[packageJsonIndex].content !== newContent) {
        updateFileContent(files[packageJsonIndex].path, newContent);
      }
    } catch (e) {
      // Invalid JSON, skip update
    }
  }, [dependencies, currentProject?.template, files, updateFileContent]);

  // Update save status based on unsaved changes
  useEffect(() => {
    if (unsavedChanges.size > 0 || dependenciesChanged) {
      setSaveStatus('unsaved');
    }
  }, [unsavedChanges, dependenciesChanged]);

  // Auto-save with debounce
  useEffect(() => {
    if ((unsavedChanges.size > 0 || dependenciesChanged) && projectId) {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save (2 seconds)
      saveTimeoutRef.current = setTimeout(async () => {
        await handleSave();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [unsavedChanges, dependenciesChanged, files, dependencies, projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, projectId]);

  const handleSave = useCallback(async () => {
    if (!projectId || saving) return;

    setSaving(true);
    setSaveStatus('saving');

    try {
      await updateProject(projectId, { files, dependencies });
      // Mark all files as saved
      unsavedChanges.forEach((path) => markSaved(path));
      markDependenciesSaved();
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  }, [projectId, files, dependencies, unsavedChanges, updateProject, markSaved, markDependenciesSaved, saving]);

  const activeFileData = files.find((f) => f.path === activeFile);

  // Convert files to Sandpack format - memoized to prevent unnecessary re-renders
  const sandpackFiles = useMemo(() => {
    return files.reduce(
      (acc, file) => {
        // Ensure path starts with / for Sandpack
        const path = file.path.startsWith('/') ? file.path : `/${file.path}`;
        acc[path] = { code: file.content };
        return acc;
      },
      {} as Record<string, { code: string }>
    );
  }, [files]);

  // Determine Sandpack template based on project template
  const getSandpackTemplate = () => {
    switch (currentProject?.template) {
      case 'react':
        return 'react' as const;
      case 'react-ts':
        return 'react-ts' as const;
      case 'vanilla':
      default:
        return 'vanilla' as const;
    }
  };

  // Save status indicator
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'unsaved':
        return 'Unsaved changes';
      default:
        return 'Saved';
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'var(--warning)';
      case 'unsaved':
        return 'var(--danger)';
      default:
        return 'var(--success)';
    }
  };

  // File operations
  const handleCreateFile = (type: 'file' | 'folder') => {
    setFileModalType(type);
    setNewFileName('');
    setShowFileModal(true);
  };

  const handleFileModalSubmit = () => {
    if (!newFileName.trim()) return;

    // Build full path - prepend selected folder if exists
    let fileName = newFileName.trim();
    // Remove leading slash from input since we'll add the base path
    if (fileName.startsWith('/')) {
      fileName = fileName.slice(1);
    }

    // Combine selected folder with file name
    let filePath: string;
    if (selectedFolder) {
      filePath = `${selectedFolder}/${fileName}`;
    } else {
      filePath = `/${fileName}`;
    }

    if (fileModalType === 'folder') {
      // For folder, add a .gitkeep file to represent the folder
      const gitkeepPath = filePath.endsWith('/') ? filePath + '.gitkeep' : filePath + '/.gitkeep';
      if (files.some((f) => f.path === gitkeepPath)) {
        toast.error('Folder exists', 'A folder with this name already exists');
        return;
      }
      createFile(gitkeepPath, '');
      // Expand the new folder
      setExpandedFolders(prev => new Set([...prev, filePath]));
      toast.success('Folder created', `"${filePath}" has been created`);
    } else {
      // For file
      if (files.some((f) => f.path === filePath)) {
        toast.error('File exists', 'A file with this name already exists');
        return;
      }
      createFile(filePath);
      openFile(filePath);
      toast.success('File created', `"${filePath.split('/').pop()}" has been created`);
    }

    setShowFileModal(false);
    setNewFileName('');
  };

  if (projectLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-1)',
        }}
        data-theme="dark"
      >
        <Stack spacing="md" align="center">
          <Spinner size="lg" />
          <Text style={{ color: 'var(--text-secondary)' }}>Loading project...</Text>
        </Stack>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-1)',
        }}
        data-theme="dark"
      >
        <Stack spacing="md" align="center">
          <Text size="md" weight="semibold">Project not found</Text>
          <Button variant="solid" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Stack>
      </div>
    );
  }

  return (
    <>
      {/* Override Sandpack styles to fill height and improve console */}
      <style>{`
        .sp-wrapper {
          height: 100% !important;
        }
        .sp-layout {
          height: 100% !important;
          border: none !important;
          border-radius: 0 !important;
        }
        .sp-preview-container {
          height: 100% !important;
        }
        .sp-preview-iframe {
          height: 100% !important;
        }
        .sp-preview-actions {
          display: none !important;
        }
        /* Console styling - cleaner look */
        .sp-console {
          background: #0d1117 !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
        .sp-console-item {
          background: transparent !important;
          border-bottom: 1px solid #21262d !important;
          padding: 6px 12px !important;
        }
        .sp-console-item:hover {
          background: rgba(255,255,255,0.03) !important;
        }
        .sp-console-item--log {
          color: #e6edf3 !important;
        }
        .sp-console-item--warn {
          background: rgba(210, 153, 34, 0.1) !important;
          color: #d29922 !important;
        }
        .sp-console-item--error {
          background: rgba(248, 81, 73, 0.1) !important;
          color: #f85149 !important;
        }
      `}</style>
      <div
        className="editor-page"
        data-theme="dark"
        style={{
          height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-1)',
      }}
    >
      {/* Header */}
      <header
        style={{
          height: '48px',
          padding: '0 12px',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {/* Left side - Logo & Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: '16px' }}>←</span>
            <span>Dashboard</span>
          </button>

          <div style={{ width: '1px', height: '20px', background: '#334155' }} />

          {/* Project name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 500 }}>
              {currentProject.name}
            </span>
            <span style={{
              fontSize: '11px',
              color: '#64748b',
              background: '#1e293b',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}>
              {currentProject.template}
            </span>
          </div>
        </div>

        {/* Right side - Status & Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Save Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: getSaveStatusColor(),
              }}
            />
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {getSaveStatusText()}
            </span>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || unsavedChanges.size === 0}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: unsavedChanges.size > 0 ? '#3b82f6' : '#334155',
              color: unsavedChanges.size > 0 ? 'white' : '#64748b',
              fontSize: '13px',
              fontWeight: 500,
              cursor: unsavedChanges.size > 0 ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* File Explorer Panel */}
        <div
          style={{
            width: '220px',
            minWidth: '220px',
            borderRight: '1px solid #374151',
            background: '#1e293b',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Files Section */}
          <div style={{ padding: '0.75rem', flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>FILES</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleCreateFile('file')}
                  title="New File"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '2px 6px',
                  }}
                >
                  📄
                </button>
                <button
                  onClick={() => handleCreateFile('folder')}
                  title="New Folder"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '2px 6px',
                  }}
                >
                  📁
                </button>
              </div>
            </div>
            {fileTree.length > 0 ? (
              <div>
                {fileTree.map(node => (
                  <FileTreeItem
                    key={node.path}
                    node={node}
                    depth={0}
                    activeFile={activeFile}
                    unsavedChanges={unsavedChanges}
                    expandedFolders={expandedFolders}
                    selectedFolder={selectedFolder}
                    onToggleFolder={toggleFolder}
                    onOpenFile={openFile}
                  />
                ))}
              </div>
            ) : (
              <div style={{ color: '#64748b', padding: '1rem', fontSize: '13px' }}>
                No files
              </div>
            )}
          </div>

          {/* Dependencies Section - only for React projects */}
          {currentProject?.template !== 'vanilla' && (
            <div style={{
              borderTop: '1px solid #374151',
              minHeight: '280px',
              maxHeight: '350px',
              overflow: 'visible',
              position: 'relative',
            }}>
              <DependencyPanel
                dependencies={dependencies}
                onAddDependency={addDependency}
                onRemoveDependency={removeDependency}
              />
            </div>
          )}
        </div>

        {/* Code Editor Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Open File Tabs */}
          <div
            style={{
              height: '40px',
              borderBottom: '1px solid #374151',
              background: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              overflow: 'auto',
            }}
          >
            {openFiles.map((filePath) => (
              <div
                key={filePath}
                onClick={() => setActiveFile(filePath)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRight: '1px solid #374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: activeFile === filePath ? '#0f172a' : 'transparent',
                  color: '#e2e8f0',
                  fontSize: '13px',
                }}
              >
                <span>{getFileIcon(filePath)}</span>
                <span>{filePath.split('/').pop()}</span>
                {unsavedChanges.has(filePath) && (
                  <span style={{ color: '#eab308', fontSize: '10px' }}>●</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(filePath);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '2px',
                    marginLeft: '4px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeFileData ? (
              <Editor
                height="100%"
                language={activeFileData.language}
                value={activeFileData.content}
                theme={settings.theme}
                onChange={(value) => {
                  if (value !== undefined && activeFile) {
                    updateFileContent(activeFile, value);
                  }
                }}
                options={{
                  fontSize: settings.fontSize,
                  tabSize: settings.tabSize,
                  wordWrap: settings.wordWrap,
                  minimap: { enabled: settings.minimap },
                  lineNumbers: settings.lineNumbers,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                }}
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                Select a file to edit
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div
          style={{
            width: '50%',
            minWidth: '400px',
            height: '100%',
            borderLeft: '1px solid #374151',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* VanillaPreview - ALWAYS mounted, hidden via CSS when not vanilla */}
          {/* Never unmount to prevent iframe reload */}
          <div style={{
            flex: 1,
            width: '100%',
            display: isVanilla ? 'flex' : 'none',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            <VanillaPreview files={files} />
          </div>

          {/* Sandpack for React projects */}
          <div style={{
            flex: 1,
            display: isVanilla ? 'none' : 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}>
            {files.length > 0 ? (
              <SandpackProvider
                key={currentProject?.id}
                template={getSandpackTemplate()}
                files={sandpackFiles}
                theme="dark"
                customSetup={{
                  dependencies: dependencies,
                }}
                options={{
                  autorun: true,
                  recompileMode: 'delayed',
                  recompileDelay: 300,
                }}
              >
                <SandpackLayout style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Preview area with custom toolbar */}
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ReactPreviewWrapper projectName={currentProject?.name || 'project'} />
                  </div>

                  {/* Collapsible Console */}
                  <div style={{
                    borderTop: '1px solid #374151',
                    background: '#0f172a',
                    flexShrink: 0,
                  }}>
                    {/* Console Header - clickable to toggle */}
                    <div
                      onClick={() => setShowConsole(!showConsole)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: showConsole ? '1px solid #374151' : 'none',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          {showConsole ? '▼' : '▶'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                          Console
                        </span>
                        <span style={{ fontSize: '11px', color: '#475569' }}>
                          (Use "Open Sandbox" for full DevTools)
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 6px',
                          display: showConsole ? 'block' : 'none',
                        }}
                        title="Clear console"
                      >
                        🗑
                      </button>
                    </div>

                    {/* Console Content */}
                    {showConsole && (
                      <div style={{ height: '180px', overflow: 'auto' }}>
                        <SandpackConsole />
                      </div>
                    )}
                  </div>
                </SandpackLayout>
              </SandpackProvider>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Loading preview...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Create Modal */}
      {showFileModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => {
            setShowFileModal(false);
            setNewFileName('');
          }}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem', color: '#f1f5f9', fontSize: '1.1rem' }}>
              {fileModalType === 'file' ? 'Create New File' : 'Create New Folder'}
            </h3>

            {/* Show selected folder context */}
            {selectedFolder && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: 'rgba(99, 102, 241, 0.15)',
                borderRadius: '6px',
                marginBottom: '0.75rem',
              }}>
                <span style={{ fontSize: '13px', color: '#a5b4fc' }}>
                  Creating in: <strong>{selectedFolder}/</strong>
                </span>
                <button
                  onClick={() => setSelectedFolder(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 6px',
                  }}
                  title="Create at root instead"
                >
                  ✕ Clear
                </button>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', color: '#94a3b8' }}>
                {fileModalType === 'file' ? 'File Name' : 'Folder Name'}
              </label>
              <input
                type="text"
                placeholder={fileModalType === 'file' ? 'e.g., helper.js' : 'e.g., components'}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFileModalSubmit();
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              {/* Preview full path */}
              {newFileName.trim() && (
                <div style={{ marginTop: '0.5rem', fontSize: '12px', color: '#64748b' }}>
                  Full path: <span style={{ color: '#94a3b8' }}>
                    {selectedFolder ? `${selectedFolder}/${newFileName.trim().replace(/^\//, '')}` : `/${newFileName.trim().replace(/^\//, '')}`}
                  </span>
                </div>
              )}
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>
              {selectedFolder
                ? 'Click a different folder to change location, or clear to create at root'
                : 'Click a folder first to create inside it, or enter a path with "/"'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowFileModal(false);
                  setNewFileName('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#818cf8',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFileModalSubmit}
                disabled={!newFileName.trim()}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: newFileName.trim() ? '#6366f1' : '#4b5563',
                  color: 'white',
                  fontSize: '14px',
                  cursor: newFileName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
