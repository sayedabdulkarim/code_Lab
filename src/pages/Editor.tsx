import { useEffect, useState } from 'react';
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
} from 'ui_zenkit';
import { useProjectsStore, useEditorStore } from '../store';

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject, loading: projectLoading } = useProjectsStore();
  const {
    activeFile,
    openFiles,
    files,
    settings,
    setFiles,
    setActiveFile,
    openFile,
    closeFile,
    updateFileContent,
    reset,
  } = useEditorStore();

  const [showConsole, setShowConsole] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await updateProject(projectId, { files });
    } finally {
      setSaving(false);
    }
  };

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
          >
            Save
          </Button>
        </Group>
      </header>

      {/* Main Editor Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* File Explorer */}
        <aside
          style={{
            width: 'var(--app-sidebar-width, 250px)',
            borderRight: '1px solid var(--border)',
            background: 'var(--surface-2)',
            overflow: 'auto',
            flexShrink: 0,
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
                  }}
                >
                  <Text size="sm">{file.path}</Text>
                </div>
              ))}
            </Stack>
          </div>
        </aside>

        {/* Editor + Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                <Text size="sm">{filePath.split('/').pop()}</Text>
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
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Editor + Preview Panes */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Code Editor */}
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

            {/* Preview Panel */}
            <div
              style={{
                width: '50%',
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
          </div>
        </div>
      </div>
    </div>
  );
}
