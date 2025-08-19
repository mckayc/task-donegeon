import React, { Component, ErrorInfo, ReactNode } from 'react';
import { bugLogger } from '../../utils/bugLogger';
import Button from '../user-interface/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    bugLogger.add({
      type: 'STATE_CHANGE', // Using STATE_CHANGE as a proxy for a crash/error
      message: `React component crashed: ${error.message}`,
      element: {
          tag: 'ErrorBoundary',
          text: errorInfo.componentStack
      }
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-200 p-4">
            <div className="text-center max-w-lg">
                <h1 className="text-4xl font-medieval text-red-500 mb-4">Something went wrong.</h1>
                <p className="mb-6">An unexpected error occurred, and the application cannot continue. Please try refreshing the page. If the problem persists, this error has been logged for the developers.</p>
                <details className="text-left bg-stone-800 p-4 rounded-lg mb-6">
                    <summary className="cursor-pointer font-semibold">Error Details</summary>
                    <pre className="mt-2 text-xs text-stone-400 whitespace-pre-wrap">
                        {this.state.error?.toString()}
                        {this.state.error?.stack}
                    </pre>
                </details>
                <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
