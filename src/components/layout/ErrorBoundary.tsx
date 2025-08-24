import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from 'components/user-interface/Button';

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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-200 p-4">
            <div className="max-w-xl w-full bg-stone-800 border border-red-700/60 rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                <div className="text-5xl mb-4">⚔️</div>
                <h1 className="text-3xl font-medieval text-red-400">A Dragon Broke the Bridge!</h1>
                <p className="text-stone-300 mt-4">
                    Something went wrong, and the page couldn't be loaded. Our apologies for the inconvenience.
                </p>
                <p className="text-stone-400 mt-2 text-sm">
                    Reloading the page usually fixes this.
                </p>
                {this.state.error && (
                    <details className="mt-4 text-left bg-stone-900/50 p-3 rounded-lg">
                        <summary className="cursor-pointer text-stone-400">Error Details</summary>
                        <pre className="mt-2 text-xs text-red-300 whitespace-pre-wrap">
                            {this.state.error.toString()}
                        </pre>
                    </details>
                )}

                <div className="mt-8">
                    <Button onClick={this.handleReload} variant="destructive">
                        Reload Page
                    </Button>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;