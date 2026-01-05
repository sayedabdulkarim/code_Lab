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
  Container,
  Spinner,
} from 'ui_zenkit';
import { useAuthStore, useProjectsStore } from '../store';

export default function Explore() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, loading, fetchPublicProjects, forkProject } = useProjectsStore();
  const [search, setSearch] = useState('');
  const [forking, setForking] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicProjects(50);
  }, [fetchPublicProjects]);

  const handleFork = async (projectId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setForking(projectId);
    try {
      const newProjectId = await forkProject(projectId, user.uid);
      navigate(`/editor/${newProjectId}`);
    } catch {
      // Error handled by store
    } finally {
      setForking(null);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="explore" data-theme="dark" style={{ minHeight: '100vh' }}>
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
            <Text
              size="md"
              weight="bold"
              style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '1.25rem' }}
              onClick={() => navigate('/')}
            >
              CodeLab
            </Text>
            <Group gap="md" align="center">
              {user ? (
                <Button variant="solid" colorScheme="primary" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button variant="solid" colorScheme="primary" onClick={() => navigate('/signup')}>
                    Get Started
                  </Button>
                </>
              )}
            </Group>
          </Group>
        </Container>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem 0' }}>
        <Container size="xl">
          <Stack spacing="xl">
            {/* Page Header */}
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
                Explore Projects
              </h1>
              <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                Discover and fork public projects from the community
              </Text>
            </div>

            {/* Search */}
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: '400px' }}
            />

            {/* Projects Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <Spinner size="lg" />
                <Text style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                  Loading projects...
                </Text>
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card variant="outlined" size="lg">
                <Stack spacing="md" align="center">
                  <span style={{ fontSize: '3rem' }}>🔍</span>
                  <Text size="md" weight="semibold">
                    No projects found
                  </Text>
                  <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                    {search
                      ? 'Try a different search term'
                      : 'Be the first to create a public project!'}
                  </Text>
                </Stack>
              </Card>
            ) : (
              <Grid columns={3} gap={4}>
                {filteredProjects.map((project) => (
                  <Card key={project.id} variant="outlined" size="md">
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
                        <Group gap="sm">
                          <Text size="sm" style={{ color: 'var(--text-tertiary)' }}>
                            ⭐ {project.stars || 0}
                          </Text>
                          <Text size="sm" style={{ color: 'var(--text-tertiary)' }}>
                            👁 {project.views || 0}
                          </Text>
                        </Group>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFork(project.id)}
                          loading={forking === project.id}
                        >
                          Fork
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
    </div>
  );
}
