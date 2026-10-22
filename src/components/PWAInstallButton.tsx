import React, { useState } from 'react';
import { Download, Smartphone, Share2, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'hero' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDirectGuide, setShowDirectGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-[#141414] rounded-full border border-[#AAA8A9]/50">
        <Check className="w-3.5 h-3.5 text-[#DD040F]" /> App Instalada
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowDirectGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Instalar QROMOTOS en este dispositivo"
        className={`inline-flex items-center gap-2 font-bold transition active:scale-95 cursor-pointer ${
          variant === 'header'
            ? 'px-3 py-1.5 rounded-xl text-xs md:text-sm bg-[#DD040F] hover:bg-[#b5030c] text-white shadow-sm shadow-[#DD040F]/30'
            : 'px-4 py-2.5 rounded-xl text-sm bg-[#DD040F] hover:bg-[#b5030c] text-white font-bold shadow-md shadow-[#DD040F]/30'
        }`}
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Instalar App</span>
      </button>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#010101] text-white p-6 shadow-2xl border border-[#AAA8A9]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#DD040F] flex items-center justify-center text-[#DD040F]">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Instalar en iPhone o iPad</h3>
                <p className="text-xs text-[#AAA8A9]">Agrega QROMOTOS a tu pantalla de inicio</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-[#AAA8A9] bg-[#141414] p-3.5 rounded-xl border border-[#AAA8A9]/20">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#DD040F] text-white text-xs font-bold shrink-0 mt-0.5">1</span>
                <span>Toca el botón <strong className="text-white flex-inline items-center"><Share2 className="w-3.5 h-3.5 inline mx-1 text-white" /> Compartir</strong> en la barra inferior de Safari.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#DD040F] text-white text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>Desliza hacia abajo y selecciona <strong className="text-white">"Agregar a inicio"</strong> (Add to Home Screen).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#DD040F] text-white text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>Presiona <strong className="text-white">"Agregar"</strong> en la esquina superior derecha.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#DD040F] text-white font-bold text-sm hover:bg-[#b5030c] transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Generic Browser Guide */}
      {showDirectGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#010101] text-white p-6 shadow-2xl border border-[#AAA8A9]/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#DD040F] flex items-center justify-center text-[#DD040F]">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Instalar QROMOTOS</h3>
                <p className="text-xs text-[#AAA8A9]">PWA multiplataforma</p>
              </div>
            </div>
            <p className="text-sm text-[#AAA8A9] mb-4">
              Para instalar la app directamente en Chrome, Edge o tu navegador móvil, haz clic en el icono de instalación <strong>(+)</strong> en la barra de direcciones o en el menú de opciones (tres puntos) y elige <strong>"Instalar QROMOTOS"</strong>.
            </p>
            <button
              onClick={() => setShowDirectGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#DD040F] text-white font-bold text-sm hover:bg-[#b5030c] transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
