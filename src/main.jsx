import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

/**
 * Limpia entradas corruptas de localStorage de sesiones previas
 * envolviendo cada JSON.parse en un bloque try / catch.
 */
function sanitizeLocalStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      const raw = window.localStorage.getItem(k);
      if (raw && (raw.startsWith('{') || raw.startsWith('['))) {
        try {
          JSON.parse(raw);
        } catch {
          keysToRemove.push(k);
        }
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Si el navegador bloquea el acceso a localStorage, continuar de forma segura
  }
}

sanitizeLocalStorage();

/**
 * ErrorBoundary de nivel superior: captura errores de renderizado y ciclo de vida,
 * mostrando error.message, error.stack y un botón para "Reiniciar estado".
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: 0,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset() {
    try {
      window.localStorage?.clear();
      window.sessionStorage?.clear();
    } catch {
      // Ignorar si el almacenamiento está restringido
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: prev.resetCount + 1,
    }));
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const message = error?.message || String(error || 'Error desconocido en tiempo de ejecución');
      const stack = error?.stack || errorInfo?.componentStack || 'Sin traza de pila disponible.';

      return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex items-center justify-center p-6 font-sans">
          <div className="max-w-3xl w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  Diagnóstico de Error en Tiempo de Ejecución
                </span>
                <h1 className="mt-2 text-xl md:text-2xl font-bold text-slate-900">
                  Se produjo un problema al renderizar la aplicación
                </h1>
              </div>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 transition cursor-pointer shrink-0"
              >
                Reiniciar estado
              </button>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mensaje (error.message):
              </h2>
              <pre className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono whitespace-pre-wrap break-words">
                {message}
              </pre>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Traza de pila (error.stack):
              </h2>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-80 whitespace-pre-wrap break-words">
                {stack}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.resetCount}>{this.props.children}</React.Fragment>;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
