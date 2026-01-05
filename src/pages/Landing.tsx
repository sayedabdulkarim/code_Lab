import { useNavigate } from 'react-router-dom';
import { Button, Card, Text, Badge, Stack, Group, Grid, Container } from 'ui_zenkit';
import { useAuthStore } from '../store';

const features = [
  {
    title: 'Live Preview',
    description: 'See your changes instantly with real-time preview powered by Sandpack',
    icon: '⚡',
  },
  {
    title: 'Multiple Templates',
    description: 'Start with React, Vue, Angular, Svelte, or vanilla JavaScript',
    icon: '📦',
  },
  {
    title: 'Monaco Editor',
    description: 'Full-featured code editor with IntelliSense and syntax highlighting',
    icon: '✨',
  },
  {
    title: 'Cloud Storage',
    description: 'Save your projects to the cloud and access them anywhere',
    icon: '☁️',
  },
  {
    title: 'Share & Fork',
    description: 'Share your projects publicly and fork others for inspiration',
    icon: '🔗',
  },
  {
    title: 'Dark Mode',
    description: 'Easy on the eyes with a beautiful dark theme by default',
    icon: '🌙',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="landing" data-theme="dark">
      {/* Hero Section */}
      <header className="landing-header">
        <Container size="xl">
          <Group justify="apart" align="center" style={{ padding: '1rem 0' }}>
            <Text size="md" weight="bold" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>
              CodeLab
            </Text>
            <Group gap="md">
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

      {/* Hero Content */}
      <section className="hero" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <Container size="lg">
          <Badge color="primary" size="lg" style={{ marginBottom: '1rem' }}>
            Browser-based IDE
          </Badge>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Code, Preview, and Share
            <br />
            <span style={{ color: 'var(--primary)' }}>Right in Your Browser</span>
          </h1>
          <Text
            size="md"
            style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}
          >
            Build and prototype web applications instantly. No setup required.
            Just open your browser and start coding.
          </Text>
          <Group justify="center" gap="md">
            <Button
              variant="solid"
              colorScheme="primary"
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
            >
              Start Coding Now
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/explore')}>
              Explore Projects
            </Button>
          </Group>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features" style={{ padding: '4rem 0', background: 'var(--surface-2)' }}>
        <Container size="xl">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '3rem' }}>
            Everything You Need to Build
          </h2>
          <Grid columns={3} gap={4}>
            {features.map((feature) => (
              <Card key={feature.title} variant="outlined" size="lg">
                <Stack spacing="sm">
                  <span style={{ fontSize: '2rem' }}>{feature.icon}</span>
                  <Text size="md" weight="semibold">
                    {feature.title}
                  </Text>
                  <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                    {feature.description}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <Container size="md">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Ready to Start Building?
          </h2>
          <Text
            size="md"
            style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}
          >
            Join thousands of developers who use CodeLab to prototype and share their ideas.
          </Text>
          <Button
            variant="solid"
            colorScheme="primary"
            size="lg"
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
          >
            Create Your First Project
          </Button>
        </Container>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem 0', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Container>
          <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
            Built with ZenKit UI
          </Text>
        </Container>
      </footer>
    </div>
  );
}
