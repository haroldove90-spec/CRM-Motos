import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ServiceOrder } from '../../types/crm';
import {
  AlertTriangle,
  ShieldCheck,
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  User,
  Bike,
  Sparkles,
} from 'lucide-react';

interface AdditionalFindingsProps {
  mode: 'findings' | 'reentries';
  onViewOrder: (order: ServiceOrder) => void;
}

export const AdditionalFindingsAndReentriesTab: React.FC<AdditionalFindingsProps> = ({
  mode,
  onViewOrder,
}) => {
  const { orders, addFindingToOrder, approveFinding, staff } = useCRM();

  // New finding state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [findingDesc, setFindingDesc] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [reporterName, setReporterName] = useState('Miguel "Micky" Torres');

  const handleCreateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !findingDesc.trim() || estimatedCost <= 0) return;

    addFindingToOrder(selectedOrderId, {
      description: findingDesc.trim(),
      estimatedCost: Number(estimatedCost),
      reportedBy: reporterName,
    });

    setFindingDesc('');
    setEstimatedCost(0);
    setShowAddModal(false);
  };

  // Re-entries: Orders marked as warranty re-entry or with past service in <90 days
  const warrantyReentryOrders = orders.filter((o) => o.isWarrantyReentry || o.notes?.toLowerCase().includes('garant') || o.notes?.toLowerCase().includes('reingreso'));

  // Commissionable Extraordinary Sales by Mechanic
  let totalMechanicExtraSales = 0;
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (item.type === 'repuesto' && item.approvedByClient) {
        totalMechanicExtraSales += item.totalPrice;
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* --- MODO 1: TRABAJOS ADICIONALES E IMPREVISTOS HALLADOS AL DESARMAR --- */}
      {mode === 'findings' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-700">
                Imprevistos al Desarmar & Cotizaciones Extra
              </span>
              <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
                Reporte de Trabajos Adicionales & Refacciones Extra
              </h2>
              <p className="text-xs text-neutral-500">
                Si al desarmar encuentras piezas desgastadas, fugas u holguras imprevistas, repórtalas aquí con costo estimado para autorización del cliente.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#DD040F] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm shadow-[#DD040F]/30"
            >
              <Plus className="w-4 h-4" />
              <span>Reportar Trabajo Adicional</span>
            </button>
          </div>

          {/* Listado de Imprevistos por Orden */}
          <div className="space-y-4">
            {orders.map((order) => {
              const findings = order.additionalFindings || [];
              if (findings.length === 0) return null;

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-[#010101] text-sm">
                        {order.orderNumber}
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="font-bold text-neutral-700 text-xs">
                        {order.motorcycleInfo?.brand || (order as any).motorcycleBrand || 'Moto'} {order.motorcycleInfo?.model || (order as any).motorcycleModel || ''} ({order.customerName})
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      {findings.length} imprevisto(s) reportado(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {findings.map((f) => (
                      <div
                        key={f.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 text-xs ${
                          f.approvedByClient
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-neutral-800">
                              Costo Estimado: ${f.estimatedCost.toLocaleString('es-MX')} MXN
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                f.approvedByClient
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-600 text-white'
                              }`}
                            >
                              {f.approvedByClient ? 'Autorizado x Cliente' : 'Esperando Autorización'}
                            </span>
                          </div>
                          <p className="font-semibold text-neutral-900 mt-1">{f.description}</p>
                          <span className="text-[10px] text-neutral-500 block mt-1">
                            Reportó: {f.reportedBy} • {new Date(f.reportedAt || f.createdAt || Date.now()).toLocaleDateString('es-MX')}
                          </span>
                        </div>

                        {!f.approvedByClient && (
                          <div className="pt-2 border-t border-amber-200/60 flex justify-end">
                            <button
                              onClick={() => approveFinding(order.id, f.id, true)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition"
                            >
                              Autorizar y Sumar al Presupuesto
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- MODO 2: GARANTÍAS, REINGRESOS Y COMISIONES EXTRAORDINARIAS --- */}
      {mode === 'reentries' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
              Control de Calidad & Comisión Extraordinaria
            </span>
            <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
              Reingresos por Garantía & Refacciones Extraordinarias
            </h2>
            <p className="text-xs text-neutral-500">
              Monitoreo de unidades que regresaron por la misma falla y refacciones sugeridas por el mecánico para comisión.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Refacciones Recomendadas por Mecánicos (Comisión)
              </span>
              <p className="text-2xl font-black text-[#010101] font-mono">
                ${totalMechanicExtraSales.toLocaleString('es-MX')} MXN
              </p>
              <span className="text-[10px] text-neutral-400">
                Ventas de mostrador y refacciones adicionales generadas en taller
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Reingresos por Misma Falla (Garantía)
              </span>
              <p className="text-2xl font-black text-rose-600 font-mono">
                {warrantyReentryOrders.length} unidades
              </p>
              <span className="text-[10px] text-neutral-400">
                Unidades reingresadas dentro del periodo de 90 días PROFECO
              </span>
            </div>
          </div>

          {/* Listado de Reingresos */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#010101]">
                Bitácora de Trabajos que Regresaron por Garantía
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Orden</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Motocicleta</th>
                    <th className="py-3 px-4">Mecánico Asignado</th>
                    <th className="py-3 px-4">Motivo de Reingreso</th>
                    <th className="py-3 px-4 text-center">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {warrantyReentryOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#010101]">{order.customerName}</td>
                      <td className="py-3 px-4 text-neutral-600">
                        {order.motorcycleInfo?.brand || (order as any).motorcycleBrand || 'Moto'} {order.motorcycleInfo?.model || (order as any).motorcycleModel || ''}
                      </td>
                      <td className="py-3 px-4 text-neutral-700 font-semibold">
                        {order.assignedMechanicName || 'Sin asignar'}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-neutral-600 line-clamp-1">
                        {order.notes || order.diagnosticNotes || 'Revisión por garantía de servicio previo'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 uppercase">
                          Garantía 90 Días
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR IMPREVISTO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-200">
            <div className="bg-[#010101] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-black text-sm">Reportar Imprevisto / Trabajo Adicional</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateFinding} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Orden de Trabajo *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName} ({o.motorcycleInfo?.brand || (o as any).motorcycleBrand || 'Moto'} {o.motorcycleInfo?.model || (o as any).motorcycleModel || ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Descripción del Desgaste / Daño Hallado *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Al retirar la tapa de punterías se detectó desgaste excesivo en balancines y árbol de levas..."
                  value={findingDesc}
                  onChange={(e) => setFindingDesc(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Costo Estimado Adicional ($ MXN) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="Monto adicional de mano de obra y refacción"
                  value={estimatedCost || ''}
                  onChange={(e) => setEstimatedCost(parseFloat(e.target.value))}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold text-sm outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Mecánico que Reporta</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DD040F] text-white rounded-xl font-bold hover:bg-red-700"
                >
                  Enviar a Recepción y Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
