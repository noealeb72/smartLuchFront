import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Aquí podrías enviar el error a un servicio de logging
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
          <div className="text-center p-5">
            <h1 className="display-1 text-danger">⚠️</h1>
            <h2 className="mb-4">Algo salió mal</h2>
            <p className="text-muted mb-4">
              Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button className="btn btn-primary" onClick={this.handleReset}>
                Volver al inicio
              </button>
              <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
                Recargar página
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-start" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <summary className="cursor-pointer">Detalles del error (solo en desarrollo)</summary>
                <pre className="bg-light p-3 mt-2 rounded" style={{ fontSize: '12px', overflow: 'auto' }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

