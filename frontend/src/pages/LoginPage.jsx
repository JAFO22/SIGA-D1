import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Field from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';
import Alerta from '../components/ui/Alerta.jsx';
import { IconAlert, IconTruck, IconChart } from '../components/icons.jsx';

const PUNTOS = [
  { icon: IconAlert, titulo: 'Riesgo de quiebre', texto: 'Días de cobertura y nivel de urgencia por producto.' },
  { icon: IconTruck, titulo: 'Confiabilidad de proveedor', texto: 'Cumplimiento histórico: lo entregado frente a lo pedido.' },
  { icon: IconChart, titulo: 'Panel de control', texto: 'Resumen ejecutivo con gráficas de inventario y actividad.' },
];

export default function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.desde || '/';

  const [form, setForm] = useState({ nombre: '', password: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(form.nombre.trim(), form.password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {}
      <div className="login-aurora relative hidden overflow-hidden lg:block">
        {}
        <div className="login-mesh" />
        {}
        <div className="login-grid" />

        {}
        <div className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-brand-500/8 blur-[80px]" />
        <div className="absolute bottom-[20%] right-[15%] h-56 w-56 rounded-full bg-blue-500/6 blur-[60px]" />

        <div className="relative flex h-full flex-col justify-between p-12">
          {}
          <div className="flex items-center gap-3 animate-fade-in-down">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-base font-bold text-white shadow-glow animate-pulse-brand">
              D1
            </span>
            <div>
              <p className="text-base font-semibold text-white tracking-tight">SIGA-D1</p>
              <p className="text-xs text-slate-400">Sistema de Inventario y Gestión de Abastecimiento</p>
            </div>
          </div>

          {}
          <div className="max-w-md">
            <h1 className="animate-slide-up text-4xl font-bold leading-[1.15] tracking-tight text-white">
              Una sola fuente
              <br />
              de datos.
              <br />
              <span className="text-gradient">Dos decisiones claras.</span>
            </h1>
            <p
              className="mt-5 animate-slide-up text-[15px] leading-relaxed text-slate-400"
              style={{ animationDelay: '100ms' }}
            >
              A partir de los movimientos de entrada y salida, SIGA&#8209;D1 anticipa el
              quiebre de inventario y mide la confiabilidad de cada proveedor para la
              tienda D1.
            </p>

            <div className="mt-10 space-y-5">
              {PUNTOS.map((p, i) => (
                <div
                  key={p.titulo}
                  className="flex gap-4 animate-slide-up"
                  style={{ animationDelay: `${200 + i * 100}ms` }}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-slate-300 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
                    <p.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{p.titulo}</p>
                    <p className="text-[13px] leading-snug text-slate-400">{p.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm animate-scale-in">
          {}
          <div className="mb-8 lg:hidden">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-lg font-bold text-white shadow-glow">
              D1
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesión</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Ingresa con tu usuario del sistema.
          </p>

          <form onSubmit={enviar} className="mt-7 space-y-4">
            {error && <Alerta tipo="error">{error}</Alerta>}

            <Field
              label="Usuario"
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              required
              autoFocus
              autoComplete="username"
              placeholder="admin"
            />
            <Field
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={cambiar}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <Button type="submit" cargando={enviando} className="w-full">
              {enviando ? 'Verificando…' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
