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

  const roleMeta: Record<UserRole, { label: string; icon: React.ElementType }> = {
    admin: { label: 'Administrador', icon: ShieldCheck },
    reception: { label: 'Recepción', icon: UserCheck },
    mechanic: { label: 'Mecánico', icon: Wrench },
    warehouse: { label: 'Almacén', icon: Package },
    client: { label: 'Portal Cliente', icon: User },
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
    <header className="sticky top-0 z-40 bg-[#010101] text-white border-b border-[#AAA8A9]/30 px-3 sm:px-6 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand / System Logo without encapsulation */}
        <div className="flex items-center gap-3">
          <CRMLogo size="md" />
          <span className="hidden lg:inline-block h-5 w-px bg-[#AAA8A9]/30" />
          <span className="hidden lg:inline-block text-xs font-semibold text-[#AAA8A9]">
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
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#141414] hover:bg-[#202020] transition text-xs font-semibold text-white border border-[#AAA8A9]/40 cursor-pointer"
            >
              <span className="w-5 h-5 rounded-md flex items-center justify-center bg-[#DD040F] text-white">
                <RoleIcon className="w-3.5 h-3.5" />
              </span>
              <span className="hidden sm:inline">{activeMeta.label}</span>
              <ChevronDown className="w-3 h-3 text-[#AAA8A9]" />
            </button>
          </div>

          {/* Clear Sample Data / Restore */}
          {isSampleDataCleared ? (
            <button
              onClick={restoreSampleData}
              title="Restaurar datos de muestra para pruebas"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white hover:text-white bg-[#141414] hover:bg-[#202020] rounded-lg border border-[#AAA8A9]/40 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#AAA8A9]" />
              <span>Demo</span>
            </button>
          ) : (
            <button
              onClick={handleClearSampleData}
              title="Borrar datos de prueba del sistema"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#DD040F] hover:text-white bg-[#1a0506] hover:bg-[#DD040F] rounded-lg border border-[#DD040F]/40 transition cursor-pointer"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#AAA8A9] hover:text-white hover:bg-[#181818] transition border border-transparent hover:border-[#AAA8A9]/30 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#AAA8A9]" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
