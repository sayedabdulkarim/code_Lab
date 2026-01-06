import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Text,
  Stack,
  Group,
  Badge,
  Alert,
  Avatar,
  Empty,
  Skeleton,
} from 'ui_zenkit';
import { useAuthStore, useProjectsStore } from '../store';
import { getTemplateList } from '../utils/templates';
import type { ProjectTemplate } from '../types';

const templates = getTemplateList();

type NavSection = 'recent' | 'all' | 'settings';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { projects, loading, error, fetchUserProjects, createProject, deleteProject, clearError } =
    useProjectsStore();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>('react');
  const [creating, setCreating] = useState(false);
  const [activeNav, setActiveNav] = useState<NavSection>('all');

  useEffect(() => {
    if (user) {
      fetchUserProjects(user.uid);
    }
  }, [user, fetchUserProjects]);

  const handleCreateProject = async () => {
    if (!user || !newProjectName.trim()) return;

    setCreating(true);
    try {
      const projectId = await createProject(
        user.uid,
        newProjectName.trim(),
        newProjectDescription.trim(),
        selectedTemplate
      );
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      navigate(`/editor/${projectId}`);
    } catch {
      // Error handled by store
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject(projectId);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Filter projects based on active nav
  const getFilteredProjects = () => {
    if (activeNav === 'recent') {
      // Show last 5 updated projects
      return [...projects]
        .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
        .slice(0, 5);
    }
    return projects;
  };

  const filteredProjects = getFilteredProjects();

  return (
    <div data-theme="dark" style={{ minHeight: '100vh', background: 'var(--surface-1)' }}>
      {/* Header */}
      <header style={{
        height: '56px',
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem'
      }}>
        <Text size="md" weight="bold" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>
          CodeLab
        </Text>
        <Group gap="md" align="center">
          <Button
            variant="solid"
            colorScheme="primary"
            size="sm"
            onClick={() => setShowNewProjectModal(true)}
          >
            + New Project
          </Button>
          <Group gap="sm" align="center">
            <Avatar
              {...(user?.photoURL ? { src: user.photoURL } : {})}
              fallback={user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              size="sm"
            />
            <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
              {user?.displayName || user?.email}
            </Text>
          </Group>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
        </Group>
      </header>

      <div style={{ display: 'flex', paddingTop: '56px', minHeight: '100vh' }}>
        {/* Sidebar Navigation */}
        <aside style={{
          width: '250px',
          background: 'var(--surface-2)',
          borderRight: '1px solid var(--border)',
          position: 'fixed',
          top: '56px',
          left: 0,
          bottom: 0,
          overflow: 'auto',
          zIndex: 40
        }}>
          <div style={{ padding: '1rem' }}>
            <Text size="sm" weight="semibold" style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Navigation
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => setActiveNav('recent')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: activeNav === 'recent' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeNav === 'recent' ? '#818cf8' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                <span>🕐</span> Recent
              </button>
              <button
                onClick={() => setActiveNav('all')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: activeNav === 'all' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeNav === 'all' ? '#818cf8' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                <span>📁</span> All Projects
              </button>
              <button
                onClick={() => setActiveNav('settings')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: activeNav === 'settings' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeNav === 'settings' ? '#818cf8' : '#e2e8f0',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                <span>⚙️</span> Settings
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ marginLeft: '250px', flex: 1, padding: '1.5rem' }}>
          {activeNav === 'settings' ? (
            <Stack spacing="lg">
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                  Settings
                </h1>
                <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                  Manage your account settings
                </Text>
              </div>
              <Card variant="outlined" size="lg">
                <Stack spacing="md">
                  <Group justify="apart" align="center">
                    <div>
                      <Text weight="medium">Account</Text>
                      <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                        {user?.email}
                      </Text>
                    </div>
                    <Button variant="outline" colorScheme="danger" onClick={handleLogout}>
                      Sign Out
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          ) : (
            <Stack spacing="lg">
              {/* Page Header */}
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                  {activeNav === 'recent' ? 'Recent Projects' : 'All Projects'}
                </h1>
                <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                  {activeNav === 'recent'
                    ? 'Your recently updated projects'
                    : 'Manage and create your code projects'}
                </Text>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert status="danger" closable onClose={clearError}>
                  <div style={{ wordBreak: 'break-word', overflow: 'hidden' }}>
                    {error}
                  </div>
                </Alert>
              )}

              {/* Projects Grid */}
              {loading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 'calc(100vh - 200px)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 280px)',
                    gap: '1rem'
                  }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} variant="outlined" size="md">
                        <Stack spacing="sm">
                          <Group justify="apart" align="start">
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="rounded" width={60} height={20} />
                          </Group>
                          <Skeleton variant="text" lines={2} />
                          <Group justify="apart" align="center">
                            <Skeleton variant="text" width="40%" />
                            <Skeleton variant="rounded" width={50} height={28} />
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 'calc(100vh - 200px)'
                }}>
                  <Empty
                    title="No projects yet"
                    description="Create your first project to get started"
                  >
                    <Button
                      variant="solid"
                      colorScheme="primary"
                      onClick={() => setShowNewProjectModal(true)}
                    >
                      Create Project
                    </Button>
                  </Empty>
                </div>
              ) : (
                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
                maxWidth: '1200px',
              }}>
                {filteredProjects.map((project) => {
                  const templateColors: Record<string, { bg: string; icon: string; color: string }> = {
                    react: { bg: 'linear-gradient(135deg, #1a365d 0%, #2563eb 100%)', icon: '⚛️', color: '#61dafb' },
                    'react-ts': { bg: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)', icon: '⚛️', color: '#3178c6' },
                    vanilla: { bg: 'linear-gradient(135deg, #422006 0%, #d97706 100%)', icon: '🟨', color: '#f7df1e' },
                  };
                  const templateStyle = templateColors[project.template] || templateColors.vanilla;

                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/editor/${project.id}`)}
                      style={{
                        background: '#1e293b',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid #334155',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
                        e.currentTarget.style.borderColor = '#475569';
                        const actions = e.currentTarget.querySelector('.card-actions') as HTMLElement;
                        if (actions) actions.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = '#334155';
                        const actions = e.currentTarget.querySelector('.card-actions') as HTMLElement;
                        if (actions) actions.style.opacity = '0';
                      }}
                    >
                      {/* Preview Thumbnail */}
                      <div style={{
                        height: '140px',
                        background: templateStyle.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}>
                        <span style={{ fontSize: '48px', opacity: 0.9 }}>{templateStyle.icon}</span>
                        {/* Template Badge */}
                        <span style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(0,0,0,0.4)',
                          color: templateStyle.color,
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          backdropFilter: 'blur(4px)',
                        }}>
                          {project.template}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div style={{ padding: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <h3 style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#f1f5f9',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {project.name}
                          </h3>
                          <p style={{
                            margin: '4px 0 0',
                            fontSize: '13px',
                            color: '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {project.description || 'No description'}
                          </p>
                        </div>

                        {/* Footer */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '12px',
                          borderTop: '1px solid #334155',
                        }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {project.updatedAt?.toLocaleDateString() || 'Recently'}
                          </span>
                          <div
                            className="card-actions"
                            style={{ opacity: 0, transition: 'opacity 0.15s' }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: 'none',
                                color: '#f87171',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </Stack>
          )}
        </main>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
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
          onClick={() => setShowNewProjectModal(false)}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f1f5f9' }}>Create New Project</h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', color: '#94a3b8' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="My Awesome Project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
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

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', color: '#94a3b8' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="A brief description of your project"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
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

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', color: '#94a3b8' }}>
                  Template
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {templates.map((template) => {
                    const iconMap: Record<string, string> = {
                      javascript: '🟨',
                      react: '⚛️',
                    };
                    const isSelected = selectedTemplate === template.id;
                    return (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #818cf8' : '1px solid #374151',
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>{iconMap[template.icon] || '📄'}</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0' }}>
                              {template.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                              {template.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setShowNewProjectModal(false)}
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
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creating}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: newProjectName.trim() ? '#6366f1' : '#4b5563',
                    color: 'white',
                    fontSize: '14px',
                    cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
