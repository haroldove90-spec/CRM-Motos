import React from 'react';
import { UserRole } from '../types/crm';
import { ShieldCheck, UserCheck, Wrench, Package, User, Trash2, RefreshCw, Tag } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useCRM } from '../context/CRMContext';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
  const { isSampleDataCleared, clearAllSampleData, restoreSampleData } = useCRM();

  const roles = [
    {
      id: 'admin' as UserRole,
      title: 'Administrador',
      subtitle: 'Dueño del Taller',
      icon: ShieldCheck,
      badge: 'Control Total',
    },
    {
      id: 'reception' as UserRole,
      title: 'Recepción',
      subtitle: 'Asesor de Servicio',
      icon: UserCheck,
      badge: 'Atención & Check-in',
    },
    {
      id: 'brand_control' as UserRole,
      title: 'Control de Marcas',
      subtitle: '6 Marcas B2B',
      icon: Tag,
      badge: 'Vento, Dinamo, MB...',
    },
    {
      id: 'mechanic' as UserRole,
      title: 'Mecánico',
      subtitle: 'Técnico Especialista',
      icon: Wrench,
      badge: 'Diagnóstico & Taller',
    },
    {
      id: 'warehouse' as UserRole,
      title: 'Almacén',
      subtitle: 'Refacciones & Stock',
      icon: Package,
      badge: 'Inventario',
    },
    {
      id: 'client' as UserRole,
      title: 'Portal Cliente',
      subtitle: 'Seguimiento en Vivo',
      icon: User,
      badge: 'Estatus Moto',
    },
  ];

  return (
    <div className="min-h-screen bg-[#010101] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Subtle Red Accent Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#DD040F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#DD040F]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header - Official Logo directly without encapsulation */}
      <div className="flex items-center justify-between z-10 w-full max-w-6xl mx-auto">
        <div className="flex items-center">
          <img
            src="https://appdesignproyectos.com/qromotoslogo.png"
            alt="QROMOTOS"
            className="h-14 sm:h-20 w-auto object-contain transition-transform hover:scale-105 duration-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="header" />
        </div>
      </div>

      {/* Center Role Cards Grid: 2 columns mobile / 3 columns tablet / 6 columns desktop */}
      <div className="w-full max-w-6xl mx-auto my-auto py-8 z-10">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#AAA8A9] block">
            Bienvenido a QROMOTOS
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Selecciona tu Perfil de Acceso
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => onSelectRole(r.id)}
                className="group relative flex flex-col items-center justify-center p-5 sm:p-7 rounded-2xl bg-[#010101] border border-[#AAA8A9]/30 hover:border-[#DD040F] hover:shadow-2xl hover:shadow-[#DD040F]/20 transition-all duration-200 cursor-pointer text-center active:scale-95"
              >
                {/* Moto Role Icon with #DD040F Accent */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#141414] border border-[#AAA8A9]/40 group-hover:border-[#DD040F] flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform text-[#DD040F]">
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 group-hover:text-white transition-colors" />
                </div>

                {/* Only Name & Subtitle as requested */}
                <span className="font-extrabold text-base sm:text-lg text-white group-hover:text-[#DD040F] transition">
                  {r.title}
                </span>
                <span className="text-xs text-[#AAA8A9] mt-0.5 font-medium">
                  {r.subtitle}
                </span>

                <div className="mt-3 px-2.5 py-0.5 rounded-full bg-[#181818] border border-[#AAA8A9]/30 text-[11px] font-semibold text-[#AAA8A9] group-hover:bg-[#DD040F] group-hover:text-white group-hover:border-[#DD040F] transition">
                  {r.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Utility Footer for Data Management */}
      <div className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#AAA8A9]/20 text-xs text-[#AAA8A9] z-10">
        <div className="flex items-center gap-2">
          <img
            src="https://appdesignproyectos.com/qromotosicono.png"
            alt="QROMOTOS Icon"
            className="w-5 h-5 object-contain"
          />
          <span>QROMOTOS CRM • Sistema de Gestión de Taller</span>
        </div>
        <div className="flex items-center gap-3">
          {isSampleDataCleared ? (
            <button
              onClick={restoreSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#202020] text-white transition border border-[#AAA8A9]/40 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#AAA8A9]" /> Restaurar datos de prueba
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas vaciar los datos de prueba? Esta acción preparará el sistema para ingresar información real de tu taller.')) {
                  clearAllSampleData();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#180506] hover:bg-[#DD040F] text-[#DD040F] hover:text-white transition border border-[#DD040F]/40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Borrar datos de muestra
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
