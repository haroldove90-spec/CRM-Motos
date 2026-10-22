import React, { useState } from 'react';
import { ServiceOrder } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import { MessageCircle, Copy, Check, Send, X } from 'lucide-react';

interface WhatsAppModalProps {
  order: ServiceOrder;
  onClose: () => void;
  defaultType?: 'checkin' | 'quote' | 'ready' | 'survey' | 'reminder';
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  order,
  onClose,
  defaultType = 'ready',
}) => {
  const { settings } = useCRM();
  const [templateType, setTemplateType] = useState<string>(defaultType);
  const [copied, setCopied] = useState(false);

  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');

  const templates: Record<string, { label: string; text: string }> = {
    checkin: {
      label: '1. Recepción (Check-in)',
      text: `¡Hola ${order.customerName}! 🏍️\nEn *${settings.workshopName}* hemos recibido tu moto *${order.motorcycleInfo.brand} ${order.motorcycleInfo.model}* (Placa: ${order.motorcycleInfo.plate}).\n\n📌 *Orden de Servicio:* ${order.id}\n🔧 *Motivo:* ${order.reasonForVisit}\n⛽ *Combustible:* ${order.checkIn.fuelLevel}%\n📏 *Kilometraje:* ${order.checkIn.mileage} km\n\nNuestro equipo técnico está iniciando el diagnóstico. Te notificaremos en cuanto tengamos el presupuesto listo.`,
    },
    quote: {
      label: '2. Cotización para Aprobación',
      text: `¡Hola ${order.customerName}! 📋\nTenemos listo el diagnóstico y presupuesto para tu motocicleta *${order.motorcycleInfo.brand} ${order.motorcycleInfo.model}* (Orden *${order.id}*).\n\n💰 *Total Estimado:* $${order.total.toLocaleString()} MXN\n\nPuedes revisar el desglose de piezas y mano de obra, y aprobar o rechazar trabajos desde nuestro portal:\n👉 ${window.location.origin}\n\nO confírmanos respondiendo este mensaje para que iniciemos las reparaciones.`,
    },
    ready: {
      label: '3. Moto Lista para Entrega',
      text: `¡Buenas noticias ${order.customerName}! 🎉🏍️\nTu motocicleta *${order.motorcycleInfo.brand} ${order.motorcycleInfo.model}* (Placa: ${order.motorcycleInfo.plate}) ya está lista, inspeccionada y lavada para su entrega en *${settings.workshopName}*.\n\n📄 *Orden:* ${order.id}\n💵 *Saldo a liquidar:* $${Math.max(0, order.total - (order.deposit || 0)).toLocaleString()} MXN\n📍 *Ubicación:* ${settings.address}\n\n¡Te esperamos para la entrega y prueba final!`,
    },
    survey: {
      label: '4. Encuesta de Satisfacción',
      text: `Hola ${order.customerName} 👋\nHace unos días retiraste tu *${order.motorcycleInfo.brand} ${order.motorcycleInfo.model}* de nuestro taller. ¿Cómo has sentido el desempeño de tu moto?\n\nTu opinión es muy valiosa para nosotros. ¿Cómo calificarías nuestro servicio del 1 al 5 ⭐?\n\n¡Gracias por confiar en *${settings.workshopName}*!`,
    },
    reminder: {
      label: '5. Recordatorio Preventivo',
      text: `Hola ${order.customerName}! ⚙️\nHan pasado 4 meses desde tu último servicio de ${order.motorcycleInfo.brand} ${order.motorcycleInfo.model} en *${settings.workshopName}*.\n\nPara mantener el rendimiento y la seguridad del motor y frenos, te recomendamos agendar tu próximo cambio de fluidos y revisión general.\n\n¿Deseas que te reservemos turno esta semana?`,
    },
  };

  const currentMessage = templates[templateType]?.text || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(currentMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#010101] text-white border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#DD040F]" />
            <h3 className="font-bold text-sm">Notificación WhatsApp al Cliente</h3>
          </div>
          <button onClick={onClose} className="text-[#AAA8A9] hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Target Customer */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-xs">
            <div>
              <span className="text-neutral-500 block font-medium">Destinatario</span>
              <strong className="text-[#010101] text-sm">{order.customerName}</strong>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 block font-medium">WhatsApp</span>
              <strong className="text-[#DD040F] font-mono text-sm">{order.customerPhone}</strong>
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-[#010101] mb-1.5 uppercase tracking-wide">
              Seleccionar Plantilla
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(templates).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setTemplateType(key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition border ${
                    templateType === key
                      ? 'bg-[#010101] text-white border-[#010101] shadow-xs'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-xs font-bold text-[#010101] mb-1.5 uppercase tracking-wide">
              Mensaje Listo para Enviar
            </label>
            <textarea
              rows={7}
              readOnly
              value={currentMessage}
              className="w-full p-3 rounded-xl bg-[#F8F9FA] border border-neutral-200 text-xs font-mono text-[#010101] leading-relaxed focus:outline-hidden resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-[#010101] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#DD040F]" /> : <Copy className="w-3.5 h-3.5 text-[#AAA8A9]" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#DD040F] hover:bg-[#b5030c] text-white shadow-md shadow-[#DD040F]/20 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Abrir WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
