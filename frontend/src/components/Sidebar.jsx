import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../lib/constantes.js';
import {
  IconDashboard,
  IconAlert,
  IconMovements,
  IconCatalog,
  IconTruck,
  IconUsers,
} from './icons.jsx';

export const NAV = [
  { to: '/dashboard', label: 'Panel general', icon: IconDashboard, roles: [ROLES.ADMINISTRADOR] },
  { to: '/alertas', label: 'Riesgo de quiebre', icon: IconAlert, roles: [ROLES.ADMINISTRADOR, ROLES.EMPLEADO] },
  { to: '/movimientos', label: 'Movimientos', icon: IconMovements, roles: [ROLES.ADMINISTRADOR, ROLES.EMPLEADO] },
  { to: '/catalogo', label: 'Catálogo', icon: IconCatalog, roles: [ROLES.ADMINISTRADOR] },
  { to: '/confiabilidad', label: 'Confiabilidad', icon: IconTruck, roles: [ROLES.ADMINISTRADOR] },
  { to: '/usuarios', label: 'Usuarios', icon: IconUsers, roles: [ROLES.ADMINISTRADOR] },
];

export default function Sidebar() {
  const { usuario } = useAuth();
  const items = NAV.filter((e) => e.roles.includes(usuario.rol));

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col sticky top-0 bg-ink-900 md:flex">
      {}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-glow">
          D1
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white tracking-tight">SIGA&#8288;-&#8288;D1</p>
          <p className="text-[11px] text-slate-500">Tienda D1</p>
        </div>
      </div>

      {}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((e) => (
          <NavLink
            key={e.to}
            to={e.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-500 shadow-glow" />
                )}
                <e.icon className="relative z-10 h-[18px] w-[18px]" />
                <span className="relative z-10">{e.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {}
      <div className="border-t border-white/[0.06] px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Tienda D1</p>
      </div>
    </aside>
  );
}
