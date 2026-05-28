import React from 'react';
import { getStoredUser } from './auth/AuthContext';
import { logActivity } from './utils/logger';

const sanitizeErrorText = (value) => {
  const text = String(value || 'Unknown error');
  return text
    .replace(/\b\d{16}\b/g, '[NIK]')
    .replace(/\b\d{10,16}\b/g, '[ID]')
    .slice(0, 240);
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    const actor = getStoredUser();
    const roleText = Array.isArray(actor?.roles) ? actor.roles.join(',') : actor?.role || 'unknown';
    const route = typeof window !== 'undefined' ? window.location.pathname : 'unknown-route';
    const message = sanitizeErrorText(error?.message || error);

    logActivity(
      `Global error route=${route} role=${roleText || 'unknown'} message=${message} time=${new Date().toISOString()}`,
      'Global Error Boundary'
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6 font-sans">
          <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mb-4 text-6xl">!</div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-rose-600">Aplikasi Bermasalah</h1>
            <p className="font-medium text-slate-600">
              Terjadi kesalahan teknis pada halaman ini. Silakan muat ulang halaman atau kembali ke Dashboard.
            </p>

            <div className="max-h-40 overflow-auto rounded-xl bg-slate-100 p-4 text-left font-mono text-xs text-slate-500">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-blue-700"
              >
                Muat Ulang
              </button>
              <a
                href="/dashboard"
                className="rounded-xl bg-slate-200 px-6 py-3 font-bold text-slate-800 shadow-md transition-all hover:bg-slate-300"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
