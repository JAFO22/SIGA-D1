import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../lib/constantes.js';
import { iniciales } from '../lib/format.js';
import { IconLogout } from './icons.jsx';
import Sidebar, { NAV } from './Sidebar.jsx';

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();

  const items = NAV.filter((e) => e.roles.includes(usuario.rol));
  const actual = items.find((e) => location.pathname.startsWith(e.to));

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              D1
            </span>
          </div>

          <h2 className="text-sm font-semibold text-slate-900">{actual?.label ?? 'SIGA-D1'}</h2>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-slate-800">{usuario.nombre}</p>
              <p className="text-[11px] text-slate-400">
                {usuario.rol === ROLES.ADMINISTRADOR ? 'Administrador' : 'Empleado'}
              </p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-ink-800 to-ink-950 text-xs font-semibold text-white ring-2 ring-white shadow-sm">
              {iniciales(usuario.nombre)}
            </div>
            <button
              type="button"
              onClick={cerrarSesion}
              title="Cerrar sesión"
              className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700 hover:shadow-sm"
            >
              <IconLogout className="h-4 w-4" />
            </button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          {items.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive ? 'bg-ink-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                }`
              }
            >
              <e.icon className="h-4 w-4" />
              {e.label}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
