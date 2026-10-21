import React from 'react';
import { UserRole } from '../types/crm';
import { CRMLogo } from './CRMLogo';
import { ShieldCheck, UserCheck, Wrench, Package, User, Trash2, RefreshCw } from 'lucide-react';
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
      color: 'from-slate-900 to-slate-800 text-orange-500 border-slate-700/50',
      badge: 'Control Total',
    },
    {
      id: 'reception' as UserRole,
      title: 'Recepción',
      subtitle: 'Asesor de Servicio',
      icon: UserCheck,
      color: 'from-orange-600 to-amber-600 text-white border-orange-500/40',
      badge: 'Atención & Check-in',
    },
    {
      id: 'mechanic' as UserRole,
      title: 'Mecánico',
      subtitle: 'Técnico Especialista',
      icon: Wrench,
      color: 'from-blue-600 to-cyan-600 text-white border-blue-500/40',
      badge: 'Diagnóstico & Taller',
    },
    {
      id: 'warehouse' as UserRole,
      title: 'Almacén',
      subtitle: 'Refacciones & Stock',
      icon: Package,
      color: 'from-emerald-600 to-teal-700 text-white border-emerald-500/40',
      badge: 'Inventario',
    },
    {
      id: 'client' as UserRole,
      title: 'Portal Cliente',
      subtitle: 'Seguimiento en Vivo',
      icon: User,
      color: 'from-purple-600 to-indigo-700 text-white border-purple-500/40',
      badge: 'Estatus Moto',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Motocross / Racing Geometric Highlights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Visual Anchor */}
      <div className="flex items-center justify-between z-10 w-full max-w-6xl mx-auto">
        <CRMLogo size="lg" className="[&_span]:text-white [&_span.text-orange-600]:text-orange-500" />
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="header" />
        </div>
      </div>

      {/* Center Role Cards Grid: 2 columns mobile / 4 to 5 columns desktop */}
      <div className="w-full max-w-6xl mx-auto my-auto py-8 z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => onSelectRole(r.id)}
                className="group relative flex flex-col items-center justify-center p-5 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-orange-500 hover:bg-slate-850 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer text-center active:scale-95"
              >
                {/* Glowing Moto Icon */}
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>

                {/* Only Name & Subtitle as requested */}
                <span className="font-extrabold text-base sm:text-lg text-white group-hover:text-orange-400 transition">
                  {r.title}
                </span>
                <span className="text-xs text-slate-400 mt-0.5 font-medium">
                  {r.subtitle}
                </span>

                <div className="mt-3 px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300 group-hover:bg-orange-500/20 group-hover:text-orange-300 transition">
                  {r.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Utility Footer for Data Management */}
      <div className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-900 text-xs text-slate-500 z-10">
        <div>
          <span>CRM Motos v2.4 • Sistema Profesional para Talleres de Motos</span>
        </div>
        <div className="flex items-center gap-3">
          {isSampleDataCleared ? (
            <button
              onClick={restoreSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restaurar datos de prueba
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas vaciar los datos de prueba? Esta acción preparará el sistema para ingresar información real de tu taller.')) {
                  clearAllSampleData();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition border border-red-900/40"
            >
              <Trash2 className="w-3.5 h-3.5" /> Borrar datos de muestra
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
