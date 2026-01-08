import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Text,
  Stack,
  Group,
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
  const { projects, loading, error, fetchUserProjects, createProject, deleteProject, updateProject, clearError } =
    useProjectsStore();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>('react');
  const [creating, setCreating] = useState(false);
  const [activeNav, setActiveNav] = useState<NavSection>('all');
  const [renameModal, setRenameModal] = useState<{ projectId: string; currentName: string } | null>(null);
  const [newName, setNewName] = useState('');

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

  const handleRename = async () => {
    if (!renameModal || !newName.trim()) return;

    // Check if name already exists (excluding current project)
    const nameExists = projects.some(
      p => p.id !== renameModal.projectId && p.name.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameExists) {
      alert('A project with this name already exists. Please choose a different name.');
      return;
    }

    try {
      await updateProject(renameModal.projectId, { name: newName.trim() });
      setRenameModal(null);
      setNewName('');
    } catch (error) {
      console.error('Failed to rename project:', error);
    }
  };

  const openRenameModal = (projectId: string, currentName: string) => {
    setRenameModal({ projectId, currentName });
    setNewName(currentName);
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
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem'
      }}>
        {/* Left - Logo & Credit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🧪</span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}>
              CodeLab
            </span>
          </div>
          <div style={{ width: '1px', height: '20px', background: '#334155' }} />
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Made with <span style={{ color: '#ef4444' }}>❤️</span> by <span style={{ color: '#94a3b8', fontWeight: 500 }}>Sayed Abdul Karim</span>
          </span>
        </div>

        {/* Right - Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setShowNewProjectModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#6366f1',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#4f46e5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#6366f1')}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            New Project
          </button>

          <div style={{ width: '1px', height: '24px', background: '#334155' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                referrerPolicy="no-referrer"
                alt="avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <Avatar
                fallback={user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                size="sm"
              />
            )}
            <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#475569';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            Sign Out
          </button>
        </div>
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 120px)',
              textAlign: 'center'
            }}>
              {/* Avatar */}
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  referrerPolicy="no-referrer"
                  alt="avatar"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #6366f1',
                    marginBottom: '1.5rem'
                  }}
                />
              ) : (
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '1.5rem'
                }}>
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}

              {/* Name */}
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {user?.displayName || 'User'}
              </div>

              {/* Email */}
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {user?.email}
              </div>

              {/* Member since */}
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2rem' }}>
                Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>

              {/* Sign Out */}
              <Button variant="outline" colorScheme="danger" onClick={handleLogout} style={{ marginBottom: '3rem' }}>
                Sign Out
              </Button>

              {/* Footer Info */}
              <div style={{ color: '#64748b', fontSize: '13px' }}>
                <div style={{ marginBottom: '0.5rem' }}>Version 1.0.0</div>
                <div>Made with ❤️ by Sayed Abdul Karim</div>
              </div>
            </div>
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
                <div style={{ marginTop: '1.5rem' }}>
                {/* Group projects by template - order: vanilla, react, react-ts */}
                {(['vanilla', 'react', 'react-ts'] as const).map(templateType => {
                  const templateProjects = filteredProjects.filter(p => p.template === templateType);
                  if (templateProjects.length === 0) return null;

                  const sectionInfo: Record<string, { title: string; icon: string; color: string }> = {
                    'vanilla': { title: 'Vanilla JS', icon: '🟨', color: '#f7df1e' },
                    'react': { title: 'React', icon: '⚛️', color: '#61dafb' },
                    'react-ts': { title: 'React TypeScript', icon: '⚛️', color: '#3178c6' },
                  };
                  const section = sectionInfo[templateType];

                  return (
                    <div key={templateType} style={{ marginBottom: '2rem' }}>
                      {/* Section Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #334155',
                      }}>
                        <span style={{ fontSize: '18px' }}>{section.icon}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: section.color }}>
                          {section.title}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          ({templateProjects.length})
                        </span>
                      </div>

                      {/* Projects Row */}
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                      }}>
                        {templateProjects.map((project) => (
                          <div
                            key={project.id}
                            onClick={() => navigate(`/editor/${project.id}`)}
                            style={{
                              minWidth: '240px',
                              maxWidth: '240px',
                              background: '#1e293b',
                              borderRadius: '8px',
                              padding: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              border: '1px solid #334155',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#263348';
                              e.currentTarget.style.borderColor = '#475569';
                              const actions = e.currentTarget.querySelector('.card-actions') as HTMLElement;
                              if (actions) actions.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#1e293b';
                              e.currentTarget.style.borderColor = '#334155';
                              const actions = e.currentTarget.querySelector('.card-actions') as HTMLElement;
                              if (actions) actions.style.opacity = '0';
                            }}
                          >
                            {/* Icon */}
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: templateType === 'vanilla'
                                ? 'linear-gradient(135deg, #422006 0%, #d97706 100%)'
                                : 'linear-gradient(135deg, #1a365d 0%, #2563eb 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <span style={{ fontSize: '20px' }}>{section.icon}</span>
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#f1f5f9',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {project.name}
                              </h3>
                              <p style={{
                                margin: '2px 0 0',
                                fontSize: '11px',
                                color: '#64748b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {project.updatedAt?.toLocaleDateString() || 'Recently'}
                              </p>
                            </div>

                            {/* Action buttons */}
                            <div
                              className="card-actions"
                              style={{
                                opacity: 0,
                                transition: 'opacity 0.15s',
                                flexShrink: 0,
                                display: 'flex',
                                gap: '4px',
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRenameModal(project.id, project.name);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#64748b',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                                title="Rename project"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProject(project.id);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#64748b',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                                title="Delete project"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
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

      {/* Rename Project Modal */}
      {renameModal && (
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
            setRenameModal(null);
            setNewName('');
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
              Rename Project
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '14px', color: '#94a3b8' }}>
                Project Name
              </label>
              <input
                type="text"
                placeholder="Enter new name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
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
              {newName.trim() && projects.some(p => p.id !== renameModal.projectId && p.name.toLowerCase() === newName.trim().toLowerCase()) && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: '#f87171' }}>
                  A project with this name already exists
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setRenameModal(null);
                  setNewName('');
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
                onClick={handleRename}
                disabled={!newName.trim() || newName.trim() === renameModal.currentName || projects.some(p => p.id !== renameModal.projectId && p.name.toLowerCase() === newName.trim().toLowerCase())}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: newName.trim() && newName.trim() !== renameModal.currentName ? '#6366f1' : '#4b5563',
                  color: 'white',
                  fontSize: '14px',
                  cursor: newName.trim() && newName.trim() !== renameModal.currentName ? 'pointer' : 'not-allowed',
                }}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
