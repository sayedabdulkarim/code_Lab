import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Text,
  Stack,
  Group,
  Grid,
  Badge,
  Input,
  Modal,
  Alert,
  FormItem,
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
        zIndex: 100,
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
              src={user?.photoURL || undefined}
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
          overflow: 'auto'
        }}>
          <div style={{ padding: '1rem' }}>
            <Text size="sm" weight="semibold" style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Navigation
            </Text>
            <Stack spacing="xs">
              <div
                onClick={() => setActiveNav('recent')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: activeNav === 'recent' ? 'var(--primary-alpha)' : 'transparent',
                  color: activeNav === 'recent' ? 'var(--primary)' : 'var(--text-primary)'
                }}
              >
                <span>🕐</span> Recent
              </div>
              <div
                onClick={() => setActiveNav('all')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: activeNav === 'all' ? 'var(--primary-alpha)' : 'transparent',
                  color: activeNav === 'all' ? 'var(--primary)' : 'var(--text-primary)'
                }}
              >
                <span>📁</span> All Projects
              </div>
              <div
                onClick={() => setActiveNav('settings')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: activeNav === 'settings' ? 'var(--primary-alpha)' : 'transparent',
                  color: activeNav === 'settings' ? 'var(--primary)' : 'var(--text-primary)'
                }}
              >
                <span>⚙️</span> Settings
              </div>
            </Stack>
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
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 280px)',
                    gap: '1rem'
                  }}>
                  {filteredProjects.map((project) => (
                    <Card
                      key={project.id}
                      variant="outlined"
                      size="md"
                      hoverable
                      onClick={() => navigate(`/editor/${project.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Stack spacing="sm">
                        <Group justify="apart" align="start">
                          <Text size="md" weight="semibold" style={{ flex: 1 }}>
                            {project.name}
                          </Text>
                          <Badge size="sm" color="secondary">
                            {project.template}
                          </Badge>
                        </Group>
                        <Text
                          size="sm"
                          style={{
                            color: 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {project.description || 'No description'}
                        </Text>
                        <Group justify="apart" align="center">
                          <Text size="sm" style={{ color: 'var(--text-tertiary)' }}>
                            Updated {project.updatedAt?.toLocaleDateString() || 'recently'}
                          </Text>
                          <Button
                            variant="ghost"
                            size="sm"
                            colorScheme="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                          >
                            Delete
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                  </div>
                </div>
              )}
            </Stack>
          )}
        </main>
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title="Create New Project"
        size="md"
      >
        <Stack spacing="lg">
          <FormItem label="Project Name">
            <Input
              placeholder="My Awesome Project"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
          </FormItem>
          <FormItem label="Description">
            <Input
              placeholder="A brief description of your project"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
            />
          </FormItem>
          <div>
            <Text size="sm" weight="medium" style={{ marginBottom: '0.5rem' }}>
              Template
            </Text>
            <Grid columns={2} gap={2}>
              {templates.map((template) => (
                <Card
                  key={template.id}
                  variant={selectedTemplate === template.id ? 'filled' : 'outlined'}
                  size="sm"
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    cursor: 'pointer',
                    borderColor:
                      selectedTemplate === template.id ? 'var(--primary)' : undefined,
                  }}
                >
                  <Group gap="sm" align="center">
                    <span style={{ fontSize: '1.25rem' }}>{template.icon === 'react' ? '⚛️' : '📄'}</span>
                    <div>
                      <Text size="sm" weight="medium">
                        {template.name}
                      </Text>
                      <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                        {template.description}
                      </Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </Grid>
          </div>
          <Group justify="right" gap="md">
            <Button variant="ghost" onClick={() => setShowNewProjectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorScheme="primary"
              onClick={handleCreateProject}
              loading={creating}
              disabled={!newProjectName.trim()}
            >
              Create Project
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
