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
  ContextMenu,
  Modal,
  Input,
  FormItem,
} from 'ui_zenkit';
import type { ContextMenuItem, TreeNode } from 'ui_zenkit';
import { useProjectsStore, useEditorStore, useToastStore } from '../store';
import { DependencyPanel } from '../components/DependencyPanel';

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
    deleteFile,
    renameFile,
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

  // File modal state
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileModalMode, setFileModalMode] = useState<'create' | 'rename'>('create');
  const [newFileName, setNewFileName] = useState('');
  const [fileToRename, setFileToRename] = useState<string | null>(null);

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

  // Convert flat files to tree structure
  const buildFileTree = useCallback((): TreeNode[] => {
    const tree: TreeNode[] = [];
    const pathMap = new Map<string, TreeNode>();

    // Sort files to ensure folders appear before their contents
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    sortedFiles.forEach((file) => {
      const parts = file.path.split('/').filter(Boolean);
      let currentPath = '';

      parts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isFile = index === parts.length - 1;

        if (!pathMap.has(currentPath)) {
          const node: TreeNode = {
            key: currentPath,
            title: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{isFile ? getFileIcon(currentPath) : '📁'}</span>
                <span>{part}</span>
                {isFile && unsavedChanges.has(file.path) && (
                  <span style={{ color: 'var(--warning)', fontSize: '10px' }}>●</span>
                )}
              </span>
            ),
            isLeaf: isFile,
            children: isFile ? undefined : [],
          };
          pathMap.set(currentPath, node);

          if (parentPath && pathMap.has(parentPath)) {
            pathMap.get(parentPath)!.children!.push(node);
          } else if (!parentPath) {
            tree.push(node);
          }
        }
      });
    });

    return tree;
  }, [files, unsavedChanges]);

  // File operations
  const handleCreateFile = () => {
    setFileModalMode('create');
    setNewFileName('');
    setShowFileModal(true);
  };

  const handleRenameFileStart = (path: string) => {
    setFileModalMode('rename');
    setFileToRename(path);
    setNewFileName(path.split('/').pop() || '');
    setShowFileModal(true);
  };

  const handleDeleteFile = (path: string) => {
    if (window.confirm(`Are you sure you want to delete "${path.split('/').pop()}"?`)) {
      deleteFile(path);
      toast.success('File deleted', `"${path.split('/').pop()}" has been deleted`);
    }
  };

  const handleFileModalSubmit = () => {
    if (!newFileName.trim()) return;

    if (fileModalMode === 'create') {
      // Determine path based on folder structure
      const filePath = newFileName.startsWith('/') ? newFileName.slice(1) : newFileName;
      if (files.some((f) => f.path === filePath)) {
        toast.error('File exists', 'A file with this name already exists');
        return;
      }
      createFile(filePath);
      openFile(filePath);
      toast.success('File created', `"${filePath}" has been created`);
    } else if (fileModalMode === 'rename' && fileToRename) {
      const parts = fileToRename.split('/');
      parts[parts.length - 1] = newFileName.trim();
      const newPath = parts.join('/');
      if (files.some((f) => f.path === newPath && f.path !== fileToRename)) {
        toast.error('File exists', 'A file with this name already exists');
        return;
      }
      renameFile(fileToRename, newPath);
      toast.success('File renamed', `File renamed to "${newFileName.trim()}"`);
    }

    setShowFileModal(false);
    setNewFileName('');
    setFileToRename(null);
  };

  // Context menu items for files
  const getContextMenuItems = (path: string, isFolder: boolean): ContextMenuItem[] => {
    if (isFolder) {
      return [
        {
          key: 'new-file',
          label: 'New File',
          onSelect: () => {
            setFileModalMode('create');
            setNewFileName(`${path}/`);
            setShowFileModal(true);
          },
        },
      ];
    }

    return [
      {
        key: 'rename',
        label: 'Rename',
        shortcut: 'F2',
        onSelect: () => handleRenameFileStart(path),
      },
      {
        key: 'delete',
        label: 'Delete',
        danger: true,
        onSelect: () => handleDeleteFile(path),
      },
    ];
  };

  const fileTree = buildFileTree();

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
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Files Section */}
              <div style={{ padding: '0.75rem', flex: 1, minHeight: 0, overflow: 'auto' }}>
                <Group justify="apart" align="center" style={{ marginBottom: '0.5rem' }}>
                  <Text size="sm" weight="medium" style={{ color: 'var(--text-secondary)' }}>
                    FILES
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateFile}
                    style={{ padding: '2px 6px', minWidth: 'auto' }}
                  >
                    +
                  </Button>
                </Group>
                {fileTree.length > 0 ? (
                  <div className="file-tree-wrapper">
                    {files.map((file) => {
                      const isActive = activeFile === file.path;
                      return (
                        <ContextMenu
                          key={file.path}
                          items={getContextMenuItems(file.path, false)}
                        >
                          <div
                            onClick={() => openFile(file.path)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              background: isActive ? 'var(--primary-alpha)' : 'transparent',
                              color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '2px',
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
                        </ContextMenu>
                      );
                    })}
                  </div>
                ) : (
                  <Text size="sm" style={{ color: 'var(--text-secondary)', padding: '1rem' }}>
                    No files
                  </Text>
                )}
              </div>

              {/* Dependencies Section */}
              <div style={{ borderTop: '1px solid var(--border)', maxHeight: '40%', overflow: 'auto' }}>
                <DependencyPanel
                  dependencies={dependencies}
                  onAddDependency={addDependency}
                  onRemoveDependency={removeDependency}
                />
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
                customSetup={{
                  dependencies: dependencies,
                }}
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

      {/* File Create/Rename Modal */}
      <Modal
        isOpen={showFileModal}
        onClose={() => {
          setShowFileModal(false);
          setNewFileName('');
          setFileToRename(null);
        }}
        title={fileModalMode === 'create' ? 'Create New File' : 'Rename File'}
        size="sm"
      >
        <Stack spacing="md">
          <FormItem label={fileModalMode === 'create' ? 'File Path' : 'New Name'}>
            <Input
              placeholder={fileModalMode === 'create' ? 'e.g., components/Button.tsx' : 'New file name'}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFileModalSubmit();
              }}
              autoFocus
            />
          </FormItem>
          {fileModalMode === 'create' && (
            <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
              Use "/" to create files in folders (e.g., "src/utils/helpers.ts")
            </Text>
          )}
          <Group justify="right" gap="md">
            <Button variant="ghost" onClick={() => setShowFileModal(false)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorScheme="primary"
              onClick={handleFileModalSubmit}
              disabled={!newFileName.trim()}
            >
              {fileModalMode === 'create' ? 'Create' : 'Rename'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
