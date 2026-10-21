import React, { useState, useEffect } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { UserRole } from './types/crm';
import { RoleSelector } from './components/RoleSelector';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomBar } from './components/BottomBar';
import { AdminDashboard } from './views/admin/AdminDashboard';
import { ReceptionView } from './views/reception/ReceptionView';
import { MechanicView } from './views/mechanic/MechanicView';
import { WarehouseView } from './views/warehouse/WarehouseView';
import { ClientPortalView } from './views/client/ClientPortalView';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

const ROLE_DEFAULT_MODULE: Record<UserRole, string> = {
  admin: 'dashboard',
  reception: 'kanban',
  mechanic: 'my_jobs',
  warehouse: 'catalog',
  client: 'status',
};

const MainApp: React.FC = () => {
  const { role, setRole } = useCRM();
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const isOnline = useOnlineStatus();

  // Whenever the active role changes, reset to that role's primary module
  useEffect(() => {
    if (role) {
      setActiveModule(ROLE_DEFAULT_MODULE[role] || 'dashboard');
    }
  }, [role]);

  // If no role is selected, show the clean initial role selector
  if (!role) {
    return (
      <RoleSelector
        onSelectRole={(selected) => {
          setRole(selected);
          setActiveModule(ROLE_DEFAULT_MODULE[selected]);
        }}
      />
    );
  }

  // Render view corresponding to active role
  const renderRoleView = () => {
    switch (role) {
      case 'admin':
        return (
          <AdminDashboard
            activeModule={activeModule}
            onSelectModule={(mod) => setActiveModule(mod)}
          />
        );
      case 'reception':
        return (
          <ReceptionView
            activeModule={activeModule}
            onSelectModule={(mod) => setActiveModule(mod)}
          />
        );
      case 'mechanic':
        return (
          <MechanicView
            activeModule={activeModule}
            onSelectModule={(mod) => setActiveModule(mod)}
          />
        );
      case 'warehouse':
        return (
          <WarehouseView
            activeModule={activeModule}
            onSelectModule={(mod) => setActiveModule(mod)}
          />
        );
      case 'client':
        return (
          <ClientPortalView
            activeModule={activeModule}
            onSelectModule={(mod) => setActiveModule(mod)}
          />
        );
      default:
        return (
          <ReceptionView
            activeModule={activeModule}
            onSelectModule={(mod) => setActiveModule(mod)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Offline Toast if network drops */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>Modo Sin Conexión — Los datos se sincronizarán localmente en tu dispositivo.</span>
        </div>
      )}

      {/* Unified Institutional Header */}
      <Header currentRole={role} />

      {/* Main Workspace with Desktop Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          currentRole={role}
          activeModule={activeModule}
          onSelectModule={(mod) => setActiveModule(mod)}
          onLogout={() => setRole(null)}
        />

        {/* Dynamic Center Work Area with responsive margins */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-28 md:pb-12 max-w-7xl mx-auto w-full transition-all">
          {renderRoleView()}
        </main>
      </div>

      {/* Mobile & Tablet Fixed Bottom Navigation Bar */}
      <BottomBar
        currentRole={role}
        activeModule={activeModule}
        onSelectModule={(mod) => setActiveModule(mod)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CRMProvider>
      <MainApp />
    </CRMProvider>
  );
}
