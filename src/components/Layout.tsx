import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Scale, DollarSign, Activity, Settings, ChevronLeft, Menu, LogOut, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children, user, onLogout }: { children: React.ReactNode, user: any, onLogout: () => void }) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const navigate = useNavigate();

  const isAllowed = (menuId: string) => {
    if (!user) return false;
    // Gestores can see everything by default, or you can enforce strict menus
    // Let's enforce strict menus if allowed_menus exists, otherwise default for role
    if (!user.allowed_menus) return user.role === 'Gestor';
    return user.allowed_menus.split(',').includes(menuId);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-bg-main text-deep-navy font-sans selection:bg-primary/30 overflow-hidden">
      {/* Sidebar - Precision Brand Strip */}
      <aside className={cn(
        "bg-sidebar border-r border-white/5 flex flex-col py-8 z-30 shadow-2xl transition-all duration-300 no-print",
        isExpanded ? "w-64 px-6 items-start" : "w-20 px-4 items-center"
      )}>
        <div className={cn(
          "mb-12 relative group cursor-pointer flex items-center gap-3 w-full",
          !isExpanded && "justify-center"
        )}>
          <div className="w-10 h-10 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center font-black text-xl text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:scale-105 group-hover:rotate-3 shadow-lg shrink-0">
            GG
          </div>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white font-black tracking-tight"
            >
              Gente & <span className="text-primary">Gestão</span>
            </motion.span>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-sidebar border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all shadow-xl z-50",
              isExpanded && "-right-4"
            )}
          >
            {isExpanded ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-4 w-full">
          {isAllowed('inicio') && <SideNavItem to="/" icon={<LayoutDashboard size={20} />} label="Início" isExpanded={isExpanded} />}
          {isAllowed('financeiro') && <SideNavItem to="/discounts" icon={<DollarSign size={20} />} label="Financeiro" isExpanded={isExpanded} />}
          {isAllowed('juridico') && <SideNavItem to="/lawsuits" icon={<Scale size={20} />} label="Jurídico" isExpanded={isExpanded} />}
          {isAllowed('gestao') && <SideNavItem to="/hiring" icon={<Users size={20} />} label="Gestão" isExpanded={isExpanded} />}
          {isAllowed('recibos') && <SideNavItem to="/receipts" icon={<Printer size={20} />} label="Recibos" isExpanded={isExpanded} />}
        </nav>

        <div className={cn(
          "mt-auto flex flex-col gap-6 w-full px-2",
          !isExpanded && "items-center"
        )}>
          {isAllowed('configuracoes') && (
            <NavLink
              to="/configuration"
              className={({ isActive }) => cn(
                "transition-colors flex items-center gap-4 px-2 py-2 rounded-lg w-full",
                !isExpanded && "justify-center",
                isActive ? "text-primary bg-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Settings size={20} />
              {isExpanded && <span className="text-[10px] font-bold uppercase tracking-widest">Configurações</span>}
            </NavLink>
          )}

          <div className={cn(
            "flex items-center gap-3 w-full p-2 bg-white/5 rounded-xl border border-white/5 relative group/profile",
            !isExpanded && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </div>
            {isExpanded && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold text-white truncate">{user?.name}</span>
                <span className="text-[8px] font-medium text-white/40 uppercase tracking-widest">{user?.role}</span>
              </div>
            )}
          </div>

          {/* Botão Sair */}
          <button
            id="logout-btn"
            onClick={handleLogoutClick}
            title="Sair do sistema"
            className={cn(
              "flex items-center gap-3 w-full rounded-xl font-bold transition ease-in-out duration-150",
              "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600",
              "text-white shadow-lg shadow-rose-500/20",
              isExpanded ? "px-4 py-2.5 justify-start" : "h-11 justify-center"
            )}
          >
            <LogOut size={16} className="shrink-0" />
            {isExpanded && <span className="text-xs uppercase tracking-widest">Sair</span>}
          </button>

        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Gente & Gestão Header */}


        {/* Content with Reveal Animation */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.01, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Subtle brand background */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-primary) 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }} />
        </main>
      </div>
    </div>
  );
}

function SideNavItem({ to, icon, label, isExpanded }: { to: string; icon: React.ReactNode; label: string; isExpanded: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative flex items-center transition-all duration-300 group rounded-xl",
          isExpanded ? "w-full px-4 py-3 gap-4" : "w-12 h-12 justify-center",
          isActive ? "text-white bg-primary shadow-lg shadow-primary/20" : "text-white/40 hover:text-white hover:bg-white/5"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="z-10 shrink-0">{icon}</div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Tooltip (Only when collapsed) */}
          {!isExpanded && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-deep-navy border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 rounded-lg shadow-xl">
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-deep-navy rotate-45 border-l border-b border-white/10" />
              {label}
            </div>
          )}

          {isActive && isExpanded && (
            <motion.div
              layoutId="active-indicator"
              className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}
