import React from 'react';
import { logger } from '../../lib/logger';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold text-red-700 mb-2">Something went wrong.</h1>
          <p className="text-sm text-gray-600">
            Please refresh the page. If the problem persists, contact support.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
