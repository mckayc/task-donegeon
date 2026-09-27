import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from '../user-interface/Button';
import { bugLogger } from '../../utils/bugLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isChunkError?: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorMsg = error?.message || error?.toString?.() || '';
    const isChunkError =
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Importing a module script failed') ||
      errorMsg.includes('error loading dynamically imported module') ||
      error?.name === 'ChunkLoadError';

    return { hasError: true, error, isChunkError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);

    const errorMsg = error?.message || error?.toString?.() || '';
    const isChunkError =
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Importing a module script failed') ||
      errorMsg.includes('error loading dynamically imported module') ||
      error?.name === 'ChunkLoadError';

    // If it's a chunk mismatch from a new deployment, auto-reload once to fetch latest code
    if (isChunkError) {
      const hasAutoReloaded = window.sessionStorage.getItem('chunk_error_autoreloaded');
      if (!hasAutoReloaded) {
        window.sessionStorage.setItem('chunk_error_autoreloaded', 'true');
        if ('caches' in window) {
          caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
        }
        window.location.reload();
        return;
      }
    }

    if (bugLogger.isRecording()) {
      bugLogger.add({
        type: 'ACTION',
        message: `CRASH: ${error.toString()}\nComponent Stack:\n${errorInfo.componentStack}`
      });
    }
  }

  private handleReload = async () => {
    try {
      window.sessionStorage.removeItem('chunk_retry_refresh');
      window.sessionStorage.removeItem('chunk_error_autoreloaded');
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
    } catch (e) {
      console.warn('Error clearing caches on reload:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isChunk = this.state.isChunkError;

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-200 p-4">
            <div className="max-w-xl w-full bg-stone-850 border border-stone-700/80 rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                <div className="text-5xl mb-4">{isChunk ? '✨ 🏰' : '⚔️'}</div>
                <h1 className="text-3xl font-medieval text-amber-300">
                    {isChunk ? 'New Update Available!' : 'A Dragon Broke the Bridge!'}
                </h1>
                <p className="text-stone-300 mt-4 leading-relaxed">
                    {isChunk
                        ? 'A new version of Task Donegeon was just deployed to the server. Click below to load the latest version.'
                        : "Something went wrong, and the page couldn't be loaded. Our apologies for the inconvenience."}
                </p>
                <p className="text-stone-400 mt-2 text-sm">
                    {isChunk ? 'Updating will clear stale caches and sync the newest features.' : 'Reloading the page usually fixes this.'}
                </p>

                {this.state.error && (
                    <details className="mt-4 text-left bg-stone-900/70 p-3 rounded-lg border border-stone-800">
                        <summary className="cursor-pointer text-stone-400 text-xs">Technical Details</summary>
                        <pre className="mt-2 text-[11px] text-amber-400 font-mono whitespace-pre-wrap overflow-x-auto">
                            {this.state.error.toString()}
                        </pre>
                    </details>
                )}

                <div className="mt-8">
                    <Button onClick={this.handleReload} variant={isChunk ? 'default' : 'destructive'} className="px-6 py-2.5 font-bold">
                        {isChunk ? 'Update & Refresh App' : 'Reload Page'}
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
