import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Input,
  Card,
  Text,
  Stack,
  Divider,
  Alert,
  Container,
  FormItem,
} from 'ui_zenkit';
import { useAuthStore } from '../store';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, loading, error, clearError } = useAuthStore();

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
        <Card variant="elevated" size="lg" style={{ padding: '2rem' }}>
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

            <Button
              variant="outline"
              fullWidth
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                background: '#fff',
                color: '#333',
                border: '1px solid #ddd',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </span>
            </Button>

            <Text size="sm" align="center" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
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
