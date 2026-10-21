import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const CRMLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-9 h-9', text: 'text-lg', sub: 'text-[10px]' },
    lg: { box: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Moto + Wrench Vector Emblem */}
      <div
        className={`${currentSize.box} rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-black p-1.5 shadow-md shadow-orange-500/10 border border-slate-700/60 flex items-center justify-center shrink-0 relative overflow-hidden group`}
      >
        {/* Ambient Orange Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-amber-500 opacity-20 blur-xs group-hover:opacity-40 transition" />
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 text-white"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Wheels */}
          <circle cx="25" cy="65" r="14" stroke="#f97316" strokeWidth="5" fill="#0f172a" />
          <circle cx="75" cy="65" r="14" stroke="#f97316" strokeWidth="5" fill="#0f172a" />
          <circle cx="25" cy="65" r="4" fill="#f97316" />
          <circle cx="75" cy="65" r="4" fill="#f97316" />

          {/* Frame & Engine */}
          <path d="M25 65 L48 56 L62 46 L75 65" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 55 L58 55 L54 67 L38 67 Z" fill="#475569" />

          {/* Aerodynamic Tank & Fairing */}
          <path
            d="M36 50 C44 42 54 41 64 45 L72 52 L64 56 L48 56 Z"
            fill="#ea580c"
          />

          {/* Handlebar & Windscreen */}
          <path d="M60 44 L66 34 L73 40" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Wrench Cross Badge Top Center */}
          <circle cx="50" cy="24" r="12" fill="#0f172a" stroke="#f97316" strokeWidth="2" />
          <path
            d="M46 20 L54 28 M54 20 L46 28"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black tracking-tight ${currentSize.text} text-slate-900 flex items-center gap-1`}>
            <span>CRM</span>
            <span className="text-orange-600">MOTOS</span>
          </div>
          <span className={`font-bold tracking-widest text-slate-500 uppercase ${currentSize.sub}`}>
            TALLER PRO
          </span>
        </div>
      )}
    </div>
  );
};
