import React, { useState } from 'react';
import { Download, Smartphone, Share2, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'hero' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDirectGuide, setShowDirectGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
        <Check className="w-3.5 h-3.5" /> App Instalada
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
        title="Instalar CRM Motos en este dispositivo (Android, iOS o PC)"
        className={`inline-flex items-center gap-2 font-medium transition active:scale-95 cursor-pointer ${
          variant === 'header'
            ? 'px-3 py-1.5 rounded-lg text-xs md:text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-500/20'
            : 'px-4 py-2.5 rounded-xl text-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md'
        }`}
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>Instalar App</span>
      </button>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Instalar en iPhone o iPad</h3>
                <p className="text-xs text-slate-500">Agrega CRM Motos a tu pantalla de inicio</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold shrink-0 mt-0.5">1</span>
                <span>Toca el botón <strong className="text-slate-900 flex-inline items-center"><Share2 className="w-3.5 h-3.5 inline mx-1" /> Compartir</strong> en la barra inferior de Safari.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>Desliza hacia abajo y selecciona <strong>"Agregar a inicio"</strong> (Add to Home Screen).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>Presiona <strong>"Agregar"</strong> en la esquina superior derecha.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Generic Browser Guide */}
      {showDirectGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Instalar CRM Motos</h3>
                <p className="text-xs text-slate-500">PWA multiplataforma</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Para instalar la app directamente en Chrome, Edge o tu navegador móvil, haz clic en el icono de instalación <strong>(+)</strong> en la barra de direcciones o en el menú de opciones (tres puntos) y elige <strong>"Instalar CRM Motos"</strong>.
            </p>
            <button
              onClick={() => setShowDirectGuide(false)}
              className="w-full py-2.5 rounded-xl bg-orange-600 text-white font-medium text-sm hover:bg-orange-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
