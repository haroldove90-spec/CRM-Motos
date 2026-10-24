import React from 'react';
import { UserRole } from '../types/crm';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  BarChart3,
  Settings,
  ClipboardPlus,
  Bike,
  Receipt,
  Wrench,
  Clock,
  PackageCheck,
  CheckCircle2,
  Package,
  AlertTriangle,
  ArrowDownToLine,
  Smartphone,
  BookOpen,
  MessageCircle,
  LogOut,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
}

interface SidebarProps {
  currentRole: UserRole;
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  onLogout: () => void;
}

export const getNavItemsForRole = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'admin':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'kanban', label: 'Tablero OS', icon: KanbanSquare },
        { id: 'staff', label: 'Personal & Comisiones', icon: Users },
        { id: 'profeco', label: 'Contratos PROFECO', icon: ShieldCheck },
        { id: 'reports', label: 'Reportes & Métricas', icon: BarChart3 },
        { id: 'settings', label: 'Ajustes & Supabase', icon: Settings },
      ];
    case 'reception':
      return [
        { id: 'checkin', label: 'Recepción (Check-in)', icon: ClipboardPlus },
        { id: 'historial', label: 'Historial Check-in', icon: Calendar },
        { id: 'profeco', label: 'Contrato PROFECO', icon: ShieldCheck },
        { id: 'kanban', label: 'Órdenes Activas', icon: KanbanSquare },
        { id: 'customers', label: 'Clientes CRM', icon: Users },
        { id: 'motorcycles', label: 'Motos', icon: Bike },
        { id: 'billing', label: 'Cotización & Cobro', icon: Receipt },
      ];
    case 'mechanic':
      return [
        { id: 'my_jobs', label: 'Trabajos Asignados', icon: Wrench },
        { id: 'stopwatch', label: 'Control de Horas', icon: Clock },
        { id: 'parts_req', label: 'Pedir Refacciones', icon: PackageCheck },
        { id: 'quality', label: 'Pruebas & Calidad', icon: CheckCircle2 },
      ];
    case 'warehouse':
      return [
        { id: 'catalog', label: 'Catálogo de Repuestos', icon: Package },
        { id: 'requests', label: 'Surtir a Mecánicos', icon: PackageCheck },
        { id: 'low_stock', label: 'Alertas Bajo Stock', icon: AlertTriangle },
        { id: 'entries', label: 'Entrada de Piezas', icon: ArrowDownToLine },
      ];
    case 'client':
      return [
        { id: 'status', label: 'Estatus en Vivo', icon: Smartphone },
        { id: 'quote', label: 'Aprobar Cotización', icon: Receipt },
        { id: 'carnet', label: 'Carnet de Servicio', icon: BookOpen },
        { id: 'contact', label: 'Soporte & Garantía', icon: MessageCircle },
      ];
    default:
      return [];
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeModule,
  onSelectModule,
  onLogout,
}) => {
  const items = getNavItemsForRole(currentRole);

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#010101] border-r border-[#AAA8A9]/20 text-[#AAA8A9] shrink-0 min-h-[calc(100vh-53px)] select-none">
      {/* Role Title Bar */}
      <div className="px-5 py-4 border-b border-[#AAA8A9]/20">
        <span className="text-[10px] font-bold tracking-widest uppercase text-[#AAA8A9]">
          Módulos de Trabajo
        </span>
        <h2 className="text-sm font-extrabold text-white mt-0.5">
          {currentRole === 'admin' && 'Administración & KPIs'}
          {currentRole === 'reception' && 'Recepción & Asesoría'}
          {currentRole === 'mechanic' && 'Taller & Mecánicos'}
          {currentRole === 'warehouse' && 'Almacén & Refacciones'}
          {currentRole === 'client' && 'Portal de Clientes'}
        </h2>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-[#DD040F] text-white shadow-md shadow-[#DD040F]/30'
                  : 'text-[#AAA8A9] hover:bg-[#141414] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#AAA8A9]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#181818] text-[#AAA8A9]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Session Footer */}
      <div className="p-3 border-t border-[#AAA8A9]/20">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#AAA8A9] hover:text-[#DD040F] hover:bg-[#141414] transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cambiar de Rol</span>
        </button>
      </div>
    </aside>
  );
};
