import React from 'react';

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
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center space-y-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-black text-rose-600 uppercase tracking-widest">Aplikasi Bermasalah</h1>
            <p className="text-slate-600 font-medium">Terjadi kesalahan teknis pada halaman ini. Silakan muat ulang halaman atau kembali ke Dashboard.</p>
            
            <div className="bg-slate-100 p-4 rounded-xl text-left overflow-auto max-h-40 text-xs text-slate-500 font-mono">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
              >
                🔄 Muat Ulang
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'} 
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-6 rounded-xl transition-all shadow-md"
              >
                🏠 Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
