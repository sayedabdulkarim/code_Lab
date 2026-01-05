import { Component, type ReactNode } from 'react';
import { Button, Stack, Text } from 'ui_zenkit';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
          }}
        >
          <Stack spacing="md" align="center">
            <Text size="md" weight="semibold" style={{ color: 'var(--danger)' }}>
              Something went wrong
            </Text>
            <Text size="sm" style={{ color: 'var(--text-secondary)', maxWidth: '400px', textAlign: 'center' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button variant="solid" colorScheme="primary" onClick={this.handleReset}>
              Try Again
            </Button>
          </Stack>
        </div>
      );
    }

    return this.props.children;
  }
}
