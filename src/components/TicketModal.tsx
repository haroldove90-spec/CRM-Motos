import React from 'react';
import { ServiceOrder } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import { Printer, X, Share2, CheckCircle2 } from 'lucide-react';
import { CRMLogo } from './CRMLogo';

interface TicketModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ order, onClose }) => {
  const { settings } = useCRM();

  const handlePrint = () => {
    window.print();
  };

  const balanceDue = Math.max(0, order.total - (order.deposit || 0));

  const shareText = `*COMPROBANTE ORDEN ${order.id}*\n*Taller:* ${settings.workshopName}\n*Cliente:* ${order.customerName}\n*Moto:* ${order.motorcycleInfo.brand} ${order.motorcycleInfo.model} (${order.motorcycleInfo.plate})\n*Estado:* ${order.status.toUpperCase()}\n*Total:* $${order.total.toLocaleString()} MXN\n*Saldo:* $${balanceDue.toLocaleString()} MXN\n\nVer seguimiento en vivo de tu moto aquí: ${window.location.origin}`;

  const handleWhatsApp = () => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#AAA8A9]/30 overflow-hidden my-auto">
        {/* Modal Top Bar (hidden when printing) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-[#010101] text-white border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Comprobante de Orden de Servicio</span>
            <span className="px-2 py-0.5 rounded-full bg-[#DD040F]/20 text-[#DD040F] font-mono text-xs font-bold">
              {order.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#010101] hover:bg-[#1f1f1f] border border-[#AAA8A9]/40 text-white text-xs font-semibold transition"
            >
              <Share2 className="w-3.5 h-3.5 text-[#DD040F]" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#AAA8A9] hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 text-[#010101] text-xs sm:text-sm font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4 border-neutral-200">
            <div>
              <CRMLogo size="sm" />
              <h2 className="font-extrabold text-base text-[#010101] mt-1">{settings.workshopName}</h2>
              <p className="text-neutral-500 text-xs">{settings.legalName}</p>
              <p className="text-neutral-500 text-xs">RFC/Tax: {settings.taxId}</p>
              <p className="text-neutral-500 text-xs">{settings.address}</p>
              <p className="text-neutral-500 text-xs">Tel: {settings.phone} • WA: {settings.whatsapp}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#010101] text-white font-mono font-bold text-sm rounded-lg">
                ORDEN {order.id}
              </span>
              <p className="text-xs text-neutral-500 mt-1.5">
                Fecha: {new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs font-bold text-[#DD040F] mt-0.5">
                ESTADO: {order.status.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>

          {/* Customer & Motorcycle Data Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-neutral-200">
            <div className="bg-[#F8F9FA] p-3 rounded-xl border border-neutral-200">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[#AAA8A9] block mb-1">
                Datos del Cliente
              </span>
              <p className="font-bold text-[#010101]">{order.customerName}</p>
              <p className="text-neutral-600">Tel: {order.customerPhone}</p>
              {order.customerEmail && <p className="text-neutral-600 text-xs">{order.customerEmail}</p>}
            </div>

            <div className="bg-[#F8F9FA] p-3 rounded-xl border border-neutral-200">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[#AAA8A9] block mb-1">
                Vehículo Registrado
              </span>
              <p className="font-bold text-[#010101]">
                {order.motorcycleInfo.brand} {order.motorcycleInfo.model} ({order.motorcycleInfo.year})
              </p>
              <p className="text-neutral-600 font-mono text-xs">
                Placa: <strong className="text-[#010101]">{order.motorcycleInfo.plate}</strong> • Cilindraje: {order.motorcycleInfo.displacement}
              </p>
              <p className="text-neutral-600 text-xs">
                KM de Ingreso: <strong className="text-[#010101]">{order.checkIn.mileage.toLocaleString()} km</strong>
              </p>
            </div>
          </div>

          {/* Motivo de ingreso y check-in visual */}
          <div className="py-3 border-b border-neutral-200 space-y-1.5">
            <div>
              <span className="font-bold text-neutral-700">Motivo de Visita: </span>
              <span className="text-neutral-900">{order.reasonForVisit}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-700">Tanque Gasolina: </span>
                <span>{order.checkIn.fuelLevel}%</span>
              </div>
              {order.checkIn.accessoriesLeft.length > 0 && (
                <div>
                  <span className="font-semibold text-neutral-700">Accesorios en custodia: </span>
                  <span>{order.checkIn.accessoriesLeft.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="py-1.5">Descripción / Concepto</th>
                  <th className="py-1.5 text-center">Tipo</th>
                  <th className="py-1.5 text-center">Cant</th>
                  <th className="py-1.5 text-right">P. Unit</th>
                  <th className="py-1.5 text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {order.items.map((item) => (
                  <tr key={item.id} className={!item.approvedByClient ? 'opacity-40 italic' : ''}>
                    <td className="py-2 pr-2">
                      <div className="font-semibold text-[#010101]">{item.description}</div>
                      {item.partNumber && (
                        <span className="font-mono text-[10px] text-neutral-400">NP: {item.partNumber}</span>
                      )}
                      {!item.approvedByClient && (
                        <span className="ml-2 text-[10px] text-[#DD040F] font-semibold">(No autorizado)</span>
                      )}
                    </td>
                    <td className="py-2 text-center text-[11px] text-neutral-500 capitalize">
                      {item.type.replace('_', ' ')}
                    </td>
                    <td className="py-2 text-center font-mono">{item.quantity}</td>
                    <td className="py-2 text-right font-mono">${item.unitPrice.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono font-semibold">${item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end pt-2 border-t border-neutral-200">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">${order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>IVA ({settings.taxPercentage}%):</span>
                <span className="font-mono font-medium">${order.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#010101] font-bold text-sm pt-1 border-t border-neutral-200">
                <span>Total Cotizado:</span>
                <span className="font-mono text-[#DD040F]">${order.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-700 font-medium">
                <span>Anticipo / Pagos:</span>
                <span className="font-mono">-${(order.deposit || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#010101] font-extrabold text-sm pt-1 border-t-2 border-[#010101]">
                <span>Saldo Pendiente:</span>
                <span className="font-mono text-[#DD040F]">${balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Warranty & Policies */}
          <div className="mt-6 p-3 bg-[#F8F9FA] rounded-xl border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed">
            <div className="flex items-center gap-1 font-bold text-[#010101] mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#DD040F]" />
              <span>Garantía y Políticas de Servicio</span>
            </div>
            <p>{settings.warrantyPolicy}</p>
          </div>

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-neutral-200 text-center">
            <div>
              <div className="border-b border-neutral-400 h-10 w-48 mx-auto" />
              <p className="text-[11px] font-bold text-[#010101] mt-1">Firma Asesor / Mecánico</p>
              <p className="text-[10px] text-neutral-500">Taller QROMOTOS</p>
            </div>
            <div>
              <div className="border-b border-neutral-400 h-10 w-48 mx-auto flex items-center justify-center">
                {order.checkoutSignature && (
                  <span className="text-[10px] text-[#010101] font-bold font-mono">Firma Digital Registrada</span>
                )}
              </div>
              <p className="text-[11px] font-bold text-[#010101] mt-1">Firma del Cliente</p>
              <p className="text-[10px] text-neutral-500">Conformidad de Recepción / Entrega</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
