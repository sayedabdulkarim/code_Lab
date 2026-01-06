import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
  SandpackLayout,
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
    var __instanceId__ = Math.random().toString(36).slice(2, 6);

    console.log('[IFRAME ' + __instanceId__ + '] Shell loaded - sending ready');

    // Signal parent when ready
    window.parent.postMessage({ type: 'ready' }, '*');

    // Listen for updates from parent
    window.addEventListener('message', function(e) {
      if (!e.data || e.data.type !== 'update') return;

      console.log('[IFRAME ' + __instanceId__ + '] Received update:', {
        hasHtml: !!e.data.html,
        hasCss: !!e.data.css,
        hasJs: !!e.data.js,
        jsChanged: e.data.js !== __lastJs__
      });

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
        console.log('[IFRAME ' + __instanceId__ + '] Executing JS');
        try {
          // Wrap in IIFE to create fresh scope (avoids const/let redeclaration errors)
          var wrappedCode = '(function() {\\n' + e.data.js + '\\n})();';
          var fn = new Function(wrappedCode);
          fn();
        } catch(err) {
          console.error('[IFRAME ' + __instanceId__ + '] JS Error:', err.message);
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
  const componentIdRef = useRef(Math.random().toString(36).slice(2, 6));

  console.log('[PARENT ' + componentIdRef.current + '] Component render, isReady:', isReady, 'initialized:', initializedRef.current);

  // Set srcdoc only ONCE on mount (not through React render)
  useEffect(() => {
    console.log('[PARENT ' + componentIdRef.current + '] Mount effect, initialized:', initializedRef.current);
    if (iframeRef.current && !initializedRef.current) {
      initializedRef.current = true;
      console.log('[PARENT ' + componentIdRef.current + '] Setting srcdoc for first time');
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
        console.log('[PARENT ' + componentIdRef.current + '] Received ready from iframe');
        setIsReady(true);
        // Send initial content when iframe is ready
        const iframe = iframeRef.current;
        if (iframe?.contentWindow) {
          const { html, css, js } = getContents();
          console.log('[PARENT ' + componentIdRef.current + '] Sending initial update');
          iframe.contentWindow.postMessage({ type: 'update', html, css, js }, '*');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [getContents]);

  // Send updates to iframe when files change (NOT on initial render)
  useEffect(() => {
    console.log('[PARENT ' + componentIdRef.current + '] Files effect, isReady:', isReady);
    if (!isReady) return;

    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    // Debounce updates
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const { html, css, js } = getContents();
      console.log('[PARENT ' + componentIdRef.current + '] Sending debounced update');

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

  // Fetch project on mount
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
    return () => reset();
  }, [projectId, fetchProject, reset]);

  // Set files and dependencies when project loads
  useEffect(() => {
    if (currentProject?.files) {
      setFiles(currentProject.files);
      // Open first file by default
      if (currentProject.files.length > 0 && !activeFile) {
        setActiveFile(currentProject.files[0].path);
      }
    }
    if (currentProject?.dependencies) {
      setDependencies(currentProject.dependencies);
    }
  }, [currentProject, setFiles, setActiveFile, setDependencies, activeFile]);

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

  // Convert files to Sandpack format
  const sandpackFiles = files.reduce(
    (acc, file) => {
      // Ensure path starts with / for Sandpack
      const path = file.path.startsWith('/') ? file.path : `/${file.path}`;
      acc[path] = { code: file.content };
      return acc;
    },
    {} as Record<string, { code: string }>
  );

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

    // Ensure path starts with /
    let filePath = newFileName.trim();
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath;
    }

    if (fileModalType === 'folder') {
      // For folder, add a .gitkeep file to represent the folder
      const gitkeepPath = filePath.endsWith('/') ? filePath + '.gitkeep' : filePath + '/.gitkeep';
      if (files.some((f) => f.path === gitkeepPath)) {
        toast.error('Folder exists', 'A folder with this name already exists');
        return;
      }
      createFile(gitkeepPath, '');
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
          height: 'var(--app-header-height, 56px)',
          padding: '0 1rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Group gap="md" align="center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            ← Back
          </Button>
          <Text size="md" weight="semibold">
            {currentProject.name}
          </Text>
          <Badge size="sm" color="secondary">
            {currentProject.template}
          </Badge>
          {/* Save Status Indicator */}
          <Group gap="xs" align="center">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: getSaveStatusColor(),
              }}
            />
            <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
              {getSaveStatusText()}
            </Text>
          </Group>
        </Group>
        <Group gap="sm">
          <Button variant="ghost" size="sm" onClick={() => setShowConsole(!showConsole)}>
            Console
          </Button>
          <Button
            variant="solid"
            colorScheme="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={unsavedChanges.size === 0}
          >
            Save
          </Button>
        </Group>
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
            {files.length > 0 ? (
              <div>
                {files.map((file) => {
                  const isActive = activeFile === file.path;
                  return (
                    <div
                      key={file.path}
                      onClick={() => openFile(file.path)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: isActive ? '#818cf8' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '2px',
                        fontSize: '13px',
                      }}
                    >
                      <span>{getFileIcon(file.path)}</span>
                      <span style={{ flex: 1 }}>{file.path.split('/').pop()}</span>
                      {unsavedChanges.has(file.path) && (
                        <span style={{ color: '#eab308' }}>●</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#64748b', padding: '1rem', fontSize: '13px' }}>
                No files
              </div>
            )}
          </div>

          {/* Dependencies Section - only for React projects */}
          {currentProject?.template !== 'vanilla' && (
            <div style={{ borderTop: '1px solid #374151', minHeight: '200px', overflow: 'auto' }}>
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
            width: '40%',
            minWidth: '300px',
            borderLeft: '1px solid #374151',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
{/* VanillaPreview - ALWAYS mounted, hidden via CSS when not vanilla */}
          {/* Never unmount to prevent iframe reload */}
          <div style={{
            height: '100%',
            width: '100%',
            display: isVanilla ? 'flex' : 'none',
            flexDirection: 'column'
          }}>
            <VanillaPreview files={files} />
          </div>

          {/* Sandpack for React projects */}
          {!isVanilla && files.length > 0 && (
            <SandpackProvider
              key={currentProject?.id}
              template={getSandpackTemplate()}
              files={sandpackFiles}
              theme="dark"
              options={{
                autorun: true,
                recompileMode: 'delayed',
                recompileDelay: 500,
              }}
            >
              <SandpackLayout style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <SandpackPreview
                  showNavigator
                  showRefreshButton
                  style={{ flex: 1, minHeight: 0 }}
                />
                {showConsole && (
                  <div style={{ height: '200px', borderTop: '1px solid #374151', flexShrink: 0 }}>
                    <SandpackConsole />
                  </div>
                )}
              </SandpackLayout>
            </SandpackProvider>
          )}

          {!isVanilla && files.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              Loading preview...
            </div>
          )}
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', color: '#94a3b8' }}>
                {fileModalType === 'file' ? 'File Path' : 'Folder Path'}
              </label>
              <input
                type="text"
                placeholder={fileModalType === 'file' ? 'e.g., utils/helper.js' : 'e.g., components'}
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
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>
              {fileModalType === 'file'
                ? 'Use "/" to create nested files (e.g., "src/utils/helpers.ts")'
                : 'Use "/" to create nested folders (e.g., "src/components/ui")'}
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
  );
}
