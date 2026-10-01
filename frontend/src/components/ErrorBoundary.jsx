import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { fallo: null };

  static getDerivedStateFromError(fallo) {
    return { fallo };
  }

  componentDidCatch(fallo, informacion) {
    console.error('Fallo no controlado en la interfaz', fallo, informacion.componentStack);
  }

  reintentar = () => {
    this.setState({ fallo: null });
  };

  render() {
    if (!this.state.fallo) return this.props.children;

    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <div className="surface-pad w-full max-w-md text-center">
          <p className="text-sm font-semibold text-slate-900">
            La pantalla no se pudo mostrar
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Ocurrio un problema inesperado al dibujar esta vista. Tus datos no se han
            perdido: vuelve a intentarlo o recarga la pagina.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" className="btn-primary" onClick={this.reintentar}>
              Reintentar
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => window.location.reload()}
            >
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
