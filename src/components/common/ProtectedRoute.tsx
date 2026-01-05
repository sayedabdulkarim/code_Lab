import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Stack, Text } from 'ui_zenkit';
import { useAuthStore } from '../../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
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
          <Text style={{ color: 'var(--text-secondary)' }}>Loading...</Text>
        </Stack>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
