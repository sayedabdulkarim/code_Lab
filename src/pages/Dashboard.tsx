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
  Container,
  Spinner,
  Alert,
  FormItem,
} from 'ui_zenkit';
import { useAuthStore, useProjectsStore } from '../store';
import { getTemplateList } from '../utils/templates';
import type { ProjectTemplate } from '../types';

const templates = getTemplateList();

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { projects, loading, error, fetchUserProjects, createProject, deleteProject } =
    useProjectsStore();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate>('react');
  const [creating, setCreating] = useState(false);

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

  return (
    <div className="dashboard" data-theme="dark" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          padding: '1rem 0',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        <Container size="xl">
          <Group justify="apart" align="center">
            <Text size="md" weight="bold" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>
              CodeLab
            </Text>
            <Group gap="md" align="center">
              <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                {user?.displayName || user?.email}
              </Text>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </Group>
          </Group>
        </Container>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem 0' }}>
        <Container size="xl">
          <Stack spacing="xl">
            {/* Page Header */}
            <Group justify="apart" align="center">
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                  My Projects
                </h1>
                <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                  Manage and create your code projects
                </Text>
              </div>
              <Button
                variant="solid"
                colorScheme="primary"
                onClick={() => setShowNewProjectModal(true)}
              >
                + New Project
              </Button>
            </Group>

            {/* Error Alert */}
            {error && (
              <Alert status="danger">
                {error}
              </Alert>
            )}

            {/* Projects Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <Spinner size="lg" />
                <Text style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                  Loading projects...
                </Text>
              </div>
            ) : projects.length === 0 ? (
              <Card variant="outlined" size="lg">
                <Stack spacing="md" align="center">
                  <span style={{ fontSize: '3rem' }}>📁</span>
                  <Text size="md" weight="semibold">
                    No projects yet
                  </Text>
                  <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                    Create your first project to get started
                  </Text>
                  <Button
                    variant="solid"
                    colorScheme="primary"
                    onClick={() => setShowNewProjectModal(true)}
                  >
                    Create Project
                  </Button>
                </Stack>
              </Card>
            ) : (
              <Grid columns={3} gap={4}>
                {projects.map((project) => (
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
              </Grid>
            )}
          </Stack>
        </Container>
      </main>

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
