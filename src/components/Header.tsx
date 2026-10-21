import React from 'react';
import { UserRole } from '../types/crm';
import { CRMLogo } from './CRMLogo';
import { PWAInstallButton } from './PWAInstallButton';
import {
  LogOut,
  Trash2,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Wrench,
  Package,
  User,
  ChevronDown,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';

interface HeaderProps {
  currentRole: UserRole;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRole }) => {
  const { setRole, isSampleDataCleared, clearAllSampleData, restoreSampleData } = useCRM();

  const roleMeta: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: 'Administrador', icon: ShieldCheck, color: 'bg-slate-900 text-orange-400' },
    reception: { label: 'Recepción', icon: UserCheck, color: 'bg-orange-600 text-white' },
    mechanic: { label: 'Mecánico', icon: Wrench, color: 'bg-blue-600 text-white' },
    warehouse: { label: 'Almacén', icon: Package, color: 'bg-emerald-600 text-white' },
    client: { label: 'Portal Cliente', icon: User, color: 'bg-purple-600 text-white' },
  };

  const activeMeta = roleMeta[currentRole];
  const RoleIcon = activeMeta.icon;

  const handleClearSampleData = () => {
    if (
      window.confirm(
        '¿Confirmas borrar todos los datos de muestra del taller? La app guardará la preferencia para no volver a mostrarlos al recargar el navegador.'
      )
    ) {
      clearAllSampleData();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand / System Logo */}
        <div className="flex items-center gap-3">
          <CRMLogo size="sm" />
          <span className="hidden lg:inline-block h-5 w-px bg-slate-200" />
          <span className="hidden lg:inline-block text-xs font-semibold text-slate-500">
            Sistema Integral de Taller
          </span>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Role Selector / Badge with quick switch */}
          <div className="relative group">
            <button
              onClick={() => setRole(null)}
              title="Cambiar rol de usuario"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-xs font-semibold text-slate-800 border border-slate-200 cursor-pointer"
            >
              <span className={`w-5 h-5 rounded-md flex items-center justify-center ${activeMeta.color}`}>
                <RoleIcon className="w-3.5 h-3.5" />
              </span>
              <span className="hidden sm:inline">{activeMeta.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Clear Sample Data / Restore */}
          {isSampleDataCleared ? (
            <button
              onClick={restoreSampleData}
              title="Restaurar datos de muestra para pruebas"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Demo</span>
            </button>
          ) : (
            <button
              onClick={handleClearSampleData}
              title="Borrar datos de prueba del sistema"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200/80 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Borrar Muestra</span>
            </button>
          )}

          {/* Quick PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Logout / Switch Role Button */}
          <button
            onClick={() => setRole(null)}
            title="Cerrar sesión o cambiar de rol"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
