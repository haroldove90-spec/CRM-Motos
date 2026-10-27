import React from 'react';
import { UserRole } from '../types/crm';
import { getNavItemsForRole } from './Sidebar';
import { Tag } from 'lucide-react';

interface BottomBarProps {
  currentRole: UserRole;
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
}

const BRAND_STYLES: Record<string, { activeBg: string; text: string; activeRing: string; label: string }> = {
  vento: { activeBg: 'bg-red-600', text: 'text-white', activeRing: 'ring-2 ring-red-500/60 shadow-lg shadow-red-600/30', label: 'Vento' },
  dinamo: { activeBg: 'bg-emerald-600', text: 'text-white', activeRing: 'ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-600/30', label: 'Dinamo' },
  mb: { activeBg: 'bg-purple-700', text: 'text-white', activeRing: 'ring-2 ring-purple-500/60 shadow-lg shadow-purple-600/30', label: 'MB' },
  bds: { activeBg: 'bg-amber-600', text: 'text-white', activeRing: 'ring-2 ring-amber-500/60 shadow-lg shadow-amber-600/30', label: 'BDS' },
  veloci: { activeBg: 'bg-yellow-400', text: 'text-neutral-900', activeRing: 'ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-500/30', label: 'Veloci' },
  carabela: { activeBg: 'bg-emerald-900', text: 'text-white', activeRing: 'ring-2 ring-emerald-700/60 shadow-lg shadow-emerald-900/30', label: 'Carabela' },
};

export const BottomBar: React.FC<BottomBarProps> = ({
  currentRole,
  activeModule,
  onSelectModule,
}) => {
  const items = getNavItemsForRole(currentRole);

  // Dedicated bottom bar for Moto Brands Control on mobile & tablet
  if (currentRole === 'brand_control') {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#010101]/95 backdrop-blur-md border-t border-[#AAA8A9]/20 px-2 py-2 shadow-2xl select-none pb-safe">
        <div className="flex items-center justify-between sm:justify-center gap-1.5 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
          {items.map((item) => {
            const isActive = activeModule === item.id;
            const style = BRAND_STYLES[item.id] || {
              activeBg: 'bg-[#DD040F]',
              text: 'text-white',
              activeRing: 'ring-2 ring-[#DD040F]/50',
              label: item.label,
            };

            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`flex-1 min-w-[54px] sm:min-w-[70px] py-2 px-1 rounded-xl transition flex flex-col items-center justify-center cursor-pointer ${
                  isActive
                    ? `${style.activeBg} ${style.text} ${style.activeRing} font-black scale-102`
                    : 'bg-[#141414] text-[#AAA8A9] hover:text-white hover:bg-[#202020] border border-neutral-800'
                }`}
                title={item.label}
              >
                <div className="flex items-center gap-1">
                  <Tag className={`w-3 h-3 ${isActive ? (item.id === 'veloci' ? 'text-neutral-900' : 'text-white') : 'text-neutral-500'}`} />
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-tight">
                    {style.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Standard bottom bar for all other roles on mobile and tablet
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#010101]/95 backdrop-blur-md border-t border-[#AAA8A9]/20 px-2 py-1.5 shadow-2xl select-none pb-safe">
      <div className="flex items-center justify-around max-w-xl mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition min-w-[56px] cursor-pointer ${
                isActive
                  ? 'text-[#DD040F] font-bold'
                  : 'text-[#AAA8A9] hover:text-white font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition ${
                  isActive ? 'bg-[#DD040F] text-white shadow-sm shadow-[#DD040F]/40' : 'text-[#AAA8A9]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[68px]">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
