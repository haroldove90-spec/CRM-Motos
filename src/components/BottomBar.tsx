import React from 'react';
import { UserRole } from '../types/crm';
import { getNavItemsForRole } from './Sidebar';

interface BottomBarProps {
  currentRole: UserRole;
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  currentRole,
  activeModule,
  onSelectModule,
}) => {
  const items = getNavItemsForRole(currentRole);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#010101]/95 backdrop-blur-md border-t border-[#AAA8A9]/20 px-2 py-1.5 shadow-2xl select-none pb-safe">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition min-w-[56px] ${
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
