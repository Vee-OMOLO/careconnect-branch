import { Component } from 'react';

// Error boundaries still have to be class components in React 19.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('CareConnect crashed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <span className="text-4xl" aria-hidden="true">🩹</span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            The screen failed to load. Reloading usually clears it.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-100 p-3 text-left text-xs text-slate-600">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-xl bg-teal-600 py-3 font-medium text-white"
          >
            Reload CareConnect
          </button>
        </div>
      </div>
    );
  }
}
