import React, { useState } from 'react';
import { ServiceOrder, OrderStatus } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import {
  Clock,
  User,
  Bike,
  ArrowRight,
  ArrowLeft,
  Printer,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Eye,
  Wrench,
} from 'lucide-react';
import { TicketModal } from './TicketModal';
import { WhatsAppModal } from './WhatsAppModal';

interface KanbanProps {
  onSelectOrder?: (order: ServiceOrder) => void;
  mechanicFilterId?: string; // If filtered for a specific mechanic
}

interface ColumnConfig {
  id: OrderStatus;
  title: string;
  badgeColor: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'pendiente', title: 'Pendiente', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', dotColor: 'bg-amber-500' },
  { id: 'en_diagnostico', title: 'En Diagnóstico', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300', dotColor: 'bg-blue-500' },
  { id: 'esperando_aprobacion', title: 'Esperando Aprobación', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300', dotColor: 'bg-purple-500' },
  { id: 'en_reparacion', title: 'En Reparación', badgeColor: 'bg-orange-100 text-orange-800 border-orange-300', dotColor: 'bg-orange-500' },
  { id: 'listo_entrega', title: 'Listo para Entrega', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', dotColor: 'bg-emerald-500' },
  { id: 'entregado', title: 'Entregado', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300', dotColor: 'bg-slate-600' },
];

const ORDER_FLOW: OrderStatus[] = [
  'pendiente',
  'en_diagnostico',
  'esperando_aprobacion',
  'en_reparacion',
  'listo_entrega',
  'entregado',
];

export const KanbanBoard: React.FC<KanbanProps> = ({ onSelectOrder, mechanicFilterId }) => {
  const { orders, updateOrderStatus } = useCRM();
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<ServiceOrder | null>(null);
  const [selectedWhatsAppOrder, setSelectedWhatsAppOrder] = useState<ServiceOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((o) => {
    if (mechanicFilterId && o.assignedMechanicId !== mechanicFilterId) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.motorcycleInfo.plate.toLowerCase().includes(query) ||
      o.motorcycleInfo.model.toLowerCase().includes(query) ||
      o.motorcycleInfo.brand.toLowerCase().includes(query)
    );
  });

  const handleMoveOrder = (orderId: string, currentStatus: OrderStatus, direction: 'forward' | 'backward') => {
    const currentIndex = ORDER_FLOW.indexOf(currentStatus);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < ORDER_FLOW.length) {
      updateOrderStatus(orderId, ORDER_FLOW[targetIndex]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Quick Search Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por placa, cliente u orden..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 pl-9 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          />
          <Bike className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Tablero dinámico de estados • {filteredOrders.length} órdenes registradas</span>
        </div>
      </div>

      {/* Responsive Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.id);
          const colIndex = ORDER_FLOW.indexOf(col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col min-w-[260px] sm:min-w-0"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-800 truncate">
                    {col.title}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-xs font-bold shadow-2xs border border-slate-200">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5">
                {colOrders.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    Sin órdenes aquí
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const balance = Math.max(0, order.total - (order.deposit || 0));
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl p-3.5 shadow-2xs border border-slate-200 hover:border-orange-400 transition-all space-y-2.5 group"
                      >
                        {/* Order ID & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {order.id}
                          </span>
                          <div className="flex items-center gap-1">
                            {order.priority === 'urgente' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                Urgente
                              </span>
                            )}
                            {order.isTimerRunning && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 animate-pulse">
                                <Clock className="w-3 h-3" /> En Cronómetro
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Motorcycle Badge */}
                        <div className="flex items-start gap-2 text-xs">
                          <Bike className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight">
                              {order.motorcycleInfo.brand} {order.motorcycleInfo.model}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Placa: <strong className="text-slate-800">{order.motorcycleInfo.plate}</strong> • {order.motorcycleInfo.displacement}
                            </p>
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{order.customerName}</span>
                        </div>

                        {/* Reason / Work */}
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                          "{order.reasonForVisit}"
                        </p>

                        {/* Assigned Mechanic */}
                        {order.assignedMechanicName && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Wrench className="w-3 h-3 text-slate-400" />
                            <span className="truncate">Técnico: {order.assignedMechanicName.split(' ')[0]}</span>
                          </div>
                        )}

                        {/* Financial Mini Summary */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block leading-tight">Total</span>
                            <span className="font-bold text-slate-900 font-mono">${order.total.toLocaleString()}</span>
                          </div>
                          {balance > 0 ? (
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block leading-tight">Saldo</span>
                              <span className="font-bold text-red-600 font-mono">${balance.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="text-right">
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                Liquidado
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quick Action Buttons Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1">
                          <div className="flex items-center gap-1">
                            {onSelectOrder && (
                              <button
                                onClick={() => onSelectOrder(order)}
                                title="Ver detalles y gestionar orden"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTicketOrder(order)}
                              title="Imprimir ticket / comprobante"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedWhatsAppOrder(order)}
                              title="Enviar notificación WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Move Forward / Backward */}
                          <div className="flex items-center gap-1">
                            {colIndex > 0 && (
                              <button
                                onClick={() => handleMoveOrder(order.id, order.status, 'backward')}
                                title="Mover a estado anterior"
                                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {colIndex < ORDER_FLOW.length - 1 && (
                              <button
                                onClick={() => handleMoveOrder(order.id, order.status, 'forward')}
                                title="Avanzar al siguiente estado"
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] transition shadow-xs"
                              >
                                <span>Avanzar</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Modal */}
      {selectedTicketOrder && (
        <TicketModal order={selectedTicketOrder} onClose={() => setSelectedTicketOrder(null)} />
      )}

      {/* WhatsApp Modal */}
      {selectedWhatsAppOrder && (
        <WhatsAppModal
          order={selectedWhatsAppOrder}
          onClose={() => setSelectedWhatsAppOrder(null)}
          defaultType={selectedWhatsAppOrder.status === 'listo_entrega' ? 'ready' : selectedWhatsAppOrder.status === 'esperando_aprobacion' ? 'quote' : 'checkin'}
        />
      )}
    </div>
  );
};
