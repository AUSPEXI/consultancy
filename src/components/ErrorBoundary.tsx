import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let errorDetails = null;

      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.operationType) {
            // Check if it's actually a permission error
            if (parsedError.error && parsedError.error.toLowerCase().includes('permission')) {
              errorMessage = "A database permission error occurred.";
            } else if (parsedError.error && parsedError.error.toLowerCase().includes('offline')) {
              errorMessage = "A database connection error occurred (client is offline).";
            } else if (parsedError.error && parsedError.error.toLowerCase().includes('api key')) {
              errorMessage = "An API key is missing. Please check your settings.";
            } else {
              errorMessage = "A database error occurred: " + parsedError.error;
            }
            errorDetails = parsedError;
          } else {
            errorMessage = this.state.error.message;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6 text-rose-500">
              <div className="p-3 bg-rose-500/10 rounded-lg">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            </div>
            
            <p className="text-zinc-400 mb-6">
              {errorMessage}
            </p>

            {errorDetails && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-6 overflow-x-auto">
                <pre className="text-xs text-zinc-500 font-mono">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
