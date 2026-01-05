import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Input,
  Card,
  Text,
  Stack,
  Group,
  Divider,
  Alert,
  Container,
  FormItem,
} from 'ui_zenkit';
import { useAuthStore } from '../store';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, loginWithGithub, loading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
      navigate('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div
      className="auth-page"
      data-theme="dark"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-1)',
      }}
    >
      <Container size="sm">
        <Card variant="elevated" size="lg">
          <Stack spacing="lg">
            <div style={{ textAlign: 'center' }}>
              <Text
                size="md"
                weight="bold"
                style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.5rem' }}
              >
                CodeLab
              </Text>
              <Text size="md" weight="semibold">
                Create an account
              </Text>
              <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                Start building amazing projects
              </Text>
            </div>

            {(error || validationError) && (
              <Alert
                status="danger"
                closable
                onClose={() => {
                  clearError();
                  setValidationError('');
                }}
              >
                {error || validationError}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing="md">
                <FormItem label="Name">
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </FormItem>
                <FormItem label="Email">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FormItem>
                <FormItem label="Password">
                  <Input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FormItem>
                <FormItem label="Confirm Password">
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </FormItem>
                <Button
                  type="submit"
                  variant="solid"
                  colorScheme="primary"
                  fullWidth
                  loading={loading}
                >
                  Create Account
                </Button>
              </Stack>
            </form>

            <Divider>
              <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                or sign up with
              </Text>
            </Divider>

            <Group gap="md">
              <Button
                variant="outline"
                fullWidth
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                Google
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={handleGithubLogin}
                disabled={loading}
              >
                GitHub
              </Button>
            </Group>

            <Text size="sm" align="center" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary)' }}>
                Sign in
              </Link>
            </Text>
          </Stack>
        </Card>

        <Text
          size="sm"
          align="center"
          style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}
        >
          <Link to="/" style={{ color: 'var(--text-secondary)' }}>
            ← Back to home
          </Link>
        </Text>
      </Container>
    </div>
  );
}
