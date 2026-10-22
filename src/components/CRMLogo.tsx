import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export const CRMLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => {
  const logoUrl = 'https://appdesignproyectos.com/qromotoslogo.png';
  const iconUrl = 'https://appdesignproyectos.com/qromotosicono.png';

  const sizeClasses = {
    sm: variant === 'icon' ? 'h-7 w-auto max-w-[28px]' : 'h-8 sm:h-9 w-auto max-h-9 object-contain',
    md: variant === 'icon' ? 'h-9 w-auto max-w-[36px]' : 'h-10 sm:h-12 w-auto max-h-12 object-contain',
    lg: variant === 'icon' ? 'h-14 w-auto max-w-[56px]' : 'h-16 sm:h-20 w-auto max-h-20 object-contain',
    xl: variant === 'icon' ? 'h-24 w-auto max-w-[96px]' : 'h-24 sm:h-32 w-auto max-h-32 object-contain',
  };

  const src = variant === 'icon' ? iconUrl : logoUrl;

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={src}
        alt="QROMOTOS"
        className={`${sizeClasses[size]} transition-all duration-200 drop-shadow-xs`}
        loading="eager"
      />
    </div>
  );
};
