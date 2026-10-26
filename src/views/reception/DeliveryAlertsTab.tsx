import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ServiceOrder } from '../../types/crm';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bike,
  Calendar,
  MessageCircle,
  FileText,
  DollarSign,
  Phone,
} from 'lucide-react';

interface DeliveryAlertsTabProps {
  onViewOrder: (order: ServiceOrder) => void;
  onContactClient: (order: ServiceOrder) => void;
}

export const DeliveryAlertsTab: React.FC<DeliveryAlertsTabProps> = ({
  onViewOrder,
  onContactClient,
}) => {
  const { orders } = useCRM();

  const [filterType, setFilterType] = useState<'all' | 'delayed' | 'storage' | 'pending_auth'>('all');

  const now = new Date().getTime();

  // 1. Entregas atrasadas (fecha prometida menor a hoy y no entregada)
  const delayedOrders = orders.filter((o) => {
    if (o.status === 'entregado') return false;
    if (!o.promisedDeliveryDate) return false;
    const pDate = new Date(o.promisedDeliveryDate).getTime();
    return pDate < now;
  });

  // 2. Motocicletas listas pendientes de recoger con más de 48 horas (Almacenaje PROFECO)
  const readyOver48hOrders = orders.filter((o) => {
    if (o.status !== 'listo_entrega') return false;
    const updated = new Date(o.updatedAt || o.createdAt).getTime();
    const hoursWaiting = (now - updated) / (1000 * 60 * 60);
    return hoursWaiting >= 48;
  });

  // 3. Presupuestos pendientes de autorización
  const pendingAuthOrders = orders.filter((o) => o.status === 'esperando_aprobacion');

  // 4. Conteo general
  const totalReceived = orders.length;
  const totalDelivered = orders.filter((o) => o.status === 'entregado').length;
  const totalActive = orders.filter((o) => o.status !== 'entregado').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
            Monitoreo Operativo & Alertas
          </span>
          <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
            Entregas Comprometidas, Semáforo de Retrasos & Almacenaje
          </h2>
          <p className="text-xs text-neutral-500">
            Control de tiempos de entrega, presupuestos por autorizar y motos listas con &gt;48 hrs (Cláusula 12ª PROFECO).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'all' ? 'bg-white text-[#DD040F] shadow-xs' : 'text-neutral-500'
            }`}
          >
            Todas ({orders.length})
          </button>
          <button
            onClick={() => setFilterType('delayed')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterType === 'delayed' ? 'bg-white text-rose-600 shadow-xs' : 'text-neutral-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
            <span>Atrasadas ({delayedOrders.length})</span>
          </button>
          <button
            onClick={() => setFilterType('storage')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterType === 'storage' ? 'bg-white text-amber-600 shadow-xs' : 'text-neutral-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
            <span>Almacenaje &gt;48h ({readyOver48hOrders.length})</span>
          </button>
          <button
            onClick={() => setFilterType('pending_auth')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterType === 'pending_auth' ? 'bg-white text-blue-600 shadow-xs' : 'text-neutral-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <span>X Autorizar ({pendingAuthOrders.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Motos Recibidas
          </span>
          <p className="text-2xl font-black text-[#010101] font-mono">{totalReceived}</p>
          <span className="text-[10px] text-neutral-400">Total histórico en sistema</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Motos Entregadas
          </span>
          <p className="text-2xl font-black text-emerald-700 font-mono">{totalDelivered}</p>
          <span className="text-[10px] text-neutral-400">Servicios liquidados</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Órdenes Activas
          </span>
          <p className="text-2xl font-black text-[#DD040F] font-mono">{totalActive}</p>
          <span className="text-[10px] text-neutral-400">En patio / banco de trabajo</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Almacenaje Pendiente
          </span>
          <p className="text-2xl font-black text-amber-600 font-mono">{readyOver48hOrders.length}</p>
          <span className="text-[10px] text-neutral-400">Listas con &gt;48 hrs sin recoger</span>
        </div>
      </div>

      {/* Alerta Destacada: Motos con >48 horas en Listo para Entrega */}
      {readyOver48hOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900">
              Aviso PROFECO: Motocicletas Terminadas con más de 48 horas sin retiro
            </h4>
            <p className="text-amber-800 mt-0.5">
              Conforme a la cláusula décima segunda del Contrato de Adhesión PROFECO 5126-2025, si la unidad no es recogida dentro de las 48 horas posteriores a la notificación, aplica cuota de almacenaje por día de resguardo.
            </p>
          </div>
        </div>
      )}

      {/* Lista de Órdenes y Estatus de Semáforo */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#010101]">
            Tablero de Compromiso de Entrega & Estatus
          </h3>
          <span className="text-xs text-neutral-400">Actualizado en tiempo real</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Orden / Folio</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Motocicleta</th>
                <th className="py-3 px-4">Tipo Servicio</th>
                <th className="py-3 px-4">Fecha Prometida</th>
                <th className="py-3 px-4 text-center">Semáforo</th>
                <th className="py-3 px-4 text-center">Estatus</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders
                .filter((o) => {
                  if (filterType === 'delayed') {
                    if (o.status === 'entregado' || !o.promisedDeliveryDate) return false;
                    return new Date(o.promisedDeliveryDate).getTime() < now;
                  }
                  if (filterType === 'storage') {
                    if (o.status !== 'listo_entrega') return false;
                    const hours = (now - new Date(o.updatedAt || o.createdAt).getTime()) / 3600000;
                    return hours >= 48;
                  }
                  if (filterType === 'pending_auth') {
                    return o.status === 'esperando_aprobacion';
                  }
                  return true;
                })
                .map((order) => {
                  const isDelivered = order.status === 'entregado';
                  const isDelayed = !isDelivered && order.promisedDeliveryDate && new Date(order.promisedDeliveryDate).getTime() < now;
                  const isReadyOver48 = order.status === 'listo_entrega' && (now - new Date(order.updatedAt || order.createdAt).getTime()) / 3600000 >= 48;

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#010101]">{order.customerName}</p>
                        <span className="text-[10px] text-neutral-400">{order.customerPhone}</span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {order.motorcycleInfo?.brand || (order as any).motorcycleBrand || 'Moto'} {order.motorcycleInfo?.model || (order as any).motorcycleModel || ''}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 capitalize">
                          {order.serviceType ? order.serviceType.replace(/_/g, ' ') : 'Particular'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-700">
                        {order.promisedDeliveryDate ? order.promisedDeliveryDate.split('T')[0] : 'Por definir'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isDelivered ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Entregada
                          </span>
                        ) : isDelayed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 animate-pulse">
                            Atrasada
                          </span>
                        ) : isReadyOver48 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                            Cobro Almacén
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                            En Tiempo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-800 uppercase">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewOrder(order)}
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition"
                            title="Ver Orden"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onContactClient(order)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                            title="Contactar WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
