import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary
 * 捕獲子元件中的 JavaScript 錯誤，防止整個應用崩潰
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-surface-900 rounded-xl p-6 border border-red-500/50">
            <div className="text-center">
              <span className="text-4xl mb-4 block">⚠️</span>
              <h1 className="text-xl font-bold text-red-400 mb-2">
                發生錯誤
              </h1>
              <p className="text-surface-400 text-sm mb-4">
                應用程式發生意外錯誤，請重新載入頁面。
              </p>
              {this.state.error && (
                <details className="text-left mb-4">
                  <summary className="text-xs text-surface-500 cursor-pointer hover:text-surface-300">
                    錯誤詳情
                  </summary>
                  <pre className="mt-2 p-2 bg-surface-800 rounded text-xs text-red-300 overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-surface-700 text-surface-200 rounded-lg hover:bg-surface-600 transition-colors text-sm"
                >
                  重試
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors text-sm"
                >
                  重新載入
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
