import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
} from '@codesandbox/sandpack-react';
import {
  Button,
  Text,
  Group,
  Stack,
  Spinner,
  Badge,
  Splitter,
  SplitterPanel,
} from 'ui_zenkit';
import { useProjectsStore, useEditorStore } from '../store';

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
    setFiles,
    setActiveFile,
    openFile,
    closeFile,
    updateFileContent,
    markSaved,
    reset,
  } = useEditorStore();

  const [showConsole, setShowConsole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch project on mount
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
    return () => reset();
  }, [projectId, fetchProject, reset]);

  // Set files when project loads
  useEffect(() => {
    if (currentProject?.files) {
      setFiles(currentProject.files);
      // Open first file by default
      if (currentProject.files.length > 0 && !activeFile) {
        setActiveFile(currentProject.files[0].path);
      }
    }
  }, [currentProject, setFiles, setActiveFile, activeFile]);

  // Update save status based on unsaved changes
  useEffect(() => {
    if (unsavedChanges.size > 0) {
      setSaveStatus('unsaved');
    }
  }, [unsavedChanges]);

  // Auto-save with debounce
  useEffect(() => {
    if (unsavedChanges.size > 0 && projectId) {
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
  }, [unsavedChanges, files, projectId]);

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
      await updateProject(projectId, { files });
      // Mark all files as saved
      unsavedChanges.forEach((path) => markSaved(path));
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  }, [projectId, files, unsavedChanges, updateProject, markSaved, saving]);

  const activeFileData = files.find((f) => f.path === activeFile);

  // Convert files to Sandpack format
  const sandpackFiles = files.reduce(
    (acc, file) => {
      acc[file.path] = { code: file.content };
      return acc;
    },
    {} as Record<string, { code: string }>
  );

  // Determine Sandpack template based on project template
  const getSandpackTemplate = () => {
    switch (currentProject?.template) {
      case 'react':
      case 'react-ts':
        return 'react';
      case 'vue':
        return 'vue';
      case 'vanilla':
      case 'vanilla-ts':
        return 'vanilla';
      default:
        return 'react';
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

      {/* Main Editor Layout with Splitter */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Splitter orientation="horizontal" defaultSizes={[20, 40, 40]} gutterSize={4}>
          {/* File Explorer Panel */}
          <SplitterPanel minSize={150}>
            <div
              style={{
                height: '100%',
                borderRight: '1px solid var(--border)',
                background: 'var(--surface-2)',
                overflow: 'auto',
              }}
            >
              <div style={{ padding: '0.75rem' }}>
                <Text size="sm" weight="medium" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  FILES
                </Text>
                <Stack spacing="xs">
                  {files.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => openFile(file.path)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: activeFile === file.path ? 'var(--primary-alpha)' : 'transparent',
                        color: activeFile === file.path ? 'var(--primary)' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span>{getFileIcon(file.path)}</span>
                      <Text size="sm" style={{ flex: 1 }}>
                        {file.path.split('/').pop()}
                      </Text>
                      {unsavedChanges.has(file.path) && (
                        <span style={{ color: 'var(--warning)' }}>●</span>
                      )}
                    </div>
                  ))}
                </Stack>
              </div>
            </div>
          </SplitterPanel>

          {/* Code Editor Panel */}
          <SplitterPanel minSize={300}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Open File Tabs */}
              <div
                style={{
                  height: '40px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
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
                      borderRight: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: activeFile === filePath ? 'var(--surface-1)' : 'transparent',
                    }}
                  >
                    <span>{getFileIcon(filePath)}</span>
                    <Text size="sm">{filePath.split('/').pop()}</Text>
                    {unsavedChanges.has(filePath) && (
                      <span style={{ color: 'var(--warning)', fontSize: '10px' }}>●</span>
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
                        color: 'var(--text-secondary)',
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
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Text>Select a file to edit</Text>
                  </div>
                )}
              </div>
            </div>
          </SplitterPanel>

          {/* Preview Panel */}
          <SplitterPanel minSize={300}>
            <div
              style={{
                height: '100%',
                borderLeft: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <SandpackProvider
                template={getSandpackTemplate()}
                files={sandpackFiles}
                theme="dark"
                options={{
                  autorun: true,
                  recompileMode: 'delayed',
                  recompileDelay: 500,
                }}
              >
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <SandpackPreview
                    showNavigator={false}
                    showRefreshButton
                    style={{ height: showConsole ? '60%' : '100%' }}
                  />
                  {showConsole && (
                    <div style={{ height: '40%', borderTop: '1px solid var(--border)' }}>
                      <SandpackConsole />
                    </div>
                  )}
                </div>
              </SandpackProvider>
            </div>
          </SplitterPanel>
        </Splitter>
      </div>
    </div>
  );
}
