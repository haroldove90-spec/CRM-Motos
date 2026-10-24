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
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react';
import { TicketModal } from './TicketModal';
import { WhatsAppModal } from './WhatsAppModal';
import { HojaDeServicioPDFModal } from './HojaDeServicioPDFModal';
import { EditOrderModal } from './EditOrderModal';
import { OrderDetailModal } from './OrderDetailModal';

interface KanbanProps {
  onSelectOrder?: (order: ServiceOrder) => void;
  mechanicFilterId?: string; // If filtered for a specific mechanic
}

interface ColumnConfig {
  id: OrderStatus;
  title: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'pendiente', title: 'Pendiente', dotColor: 'bg-[#AAA8A9]' },
  { id: 'en_diagnostico', title: 'En Diagnóstico', dotColor: 'bg-[#010101]' },
  { id: 'esperando_aprobacion', title: 'Esperando Aprobación', dotColor: 'bg-[#DD040F]' },
  { id: 'en_reparacion', title: 'En Reparación', dotColor: 'bg-[#DD040F]' },
  { id: 'listo_entrega', title: 'Listo para Entrega', dotColor: 'bg-[#010101]' },
  { id: 'entregado', title: 'Entregado', dotColor: 'bg-[#AAA8A9]' },
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
  const { orders, updateOrderStatus, deleteServiceOrder } = useCRM();
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<ServiceOrder | null>(null);
  const [selectedWhatsAppOrder, setSelectedWhatsAppOrder] = useState<ServiceOrder | null>(null);
  const [selectedPdfOrder, setSelectedPdfOrder] = useState<ServiceOrder | null>(null);
  const [selectedEditOrder, setSelectedEditOrder] = useState<ServiceOrder | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
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
            className="w-full px-3.5 py-2 pl-9 bg-white border border-[#AAA8A9]/40 rounded-xl text-xs sm:text-sm text-[#010101] placeholder:text-[#AAA8A9] focus:outline-hidden focus:border-[#DD040F] shadow-xs"
          />
          <Bike className="w-4 h-4 text-[#AAA8A9] absolute left-3 top-2.5" />
        </div>
        <div className="text-xs text-[#010101] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DD040F] animate-pulse" />
          <span className="font-semibold">Tablero dinámico de estados • {filteredOrders.length} órdenes registradas</span>
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
              className="bg-[#F1F2F3] rounded-2xl p-3 border border-[#AAA8A9]/30 flex flex-col min-w-[260px] sm:min-w-0"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-bold text-xs uppercase tracking-wide text-[#010101] truncate">
                    {col.title}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#010101] text-xs font-bold shadow-xs border border-[#AAA8A9]/30">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5">
                {colOrders.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-[#AAA8A9]/40 rounded-xl text-[#AAA8A9] text-xs">
                    Sin órdenes aquí
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const balance = Math.max(0, order.total - (order.deposit || 0));
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl p-3.5 shadow-xs border border-[#AAA8A9]/30 hover:border-[#DD040F] transition-all space-y-2.5 group"
                      >
                        {/* Order ID & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white bg-[#010101] px-2 py-0.5 rounded-md">
                            {order.id}
                          </span>
                          <div className="flex items-center gap-1">
                            {order.priority === 'urgente' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#DD040F] text-white">
                                Urgente
                              </span>
                            )}
                            {order.isTimerRunning && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#010101] text-white border border-[#DD040F]">
                                <Clock className="w-3 h-3 text-[#DD040F] animate-spin" /> En Curso
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Motorcycle Badge */}
                        <div className="flex items-start gap-2 text-xs">
                          <Bike className="w-4 h-4 text-[#DD040F] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-extrabold text-[#010101] leading-tight">
                              {order.motorcycleInfo.brand} {order.motorcycleInfo.model}
                            </p>
                            <p className="text-[11px] text-[#010101]/70 font-mono">
                              Placa: <strong className="text-[#010101]">{order.motorcycleInfo.plate}</strong> • {order.motorcycleInfo.displacement}
                            </p>
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="flex items-center gap-1.5 text-xs text-[#010101] bg-[#F8F9FA] p-1.5 rounded-lg border border-[#AAA8A9]/30">
                          <User className="w-3.5 h-3.5 text-[#AAA8A9] shrink-0" />
                          <span className="truncate font-medium">{order.customerName}</span>
                        </div>

                        {/* Reason / Work */}
                        <p className="text-[11px] text-[#010101]/80 line-clamp-2 italic">
                          "{order.reasonForVisit}"
                        </p>

                        {/* Assigned Mechanic */}
                        {order.assignedMechanicName && (
                          <div className="flex items-center gap-1 text-[11px] text-[#010101]/70">
                            <Wrench className="w-3 h-3 text-[#AAA8A9]" />
                            <span className="truncate">Técnico: {order.assignedMechanicName.split(' ')[0]}</span>
                          </div>
                        )}

                        {/* Financial Mini Summary */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#AAA8A9]/20 text-xs">
                          <div>
                            <span className="text-[10px] text-[#AAA8A9] block leading-tight font-medium">Total</span>
                            <span className="font-bold text-[#010101] font-mono">${order.total.toLocaleString()}</span>
                          </div>
                          {balance > 0 ? (
                            <div className="text-right">
                              <span className="text-[10px] text-[#AAA8A9] block leading-tight font-medium">Saldo</span>
                              <span className="font-bold text-[#DD040F] font-mono">${balance.toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="text-right">
                              <span className="px-1.5 py-0.5 bg-[#010101] text-white text-[10px] font-bold rounded">
                                Liquidado
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quick Action Buttons Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#AAA8A9]/20 gap-1">
                          <div className="flex items-center flex-wrap gap-1">
                            <button
                              onClick={() => {
                                if (onSelectOrder) {
                                  onSelectOrder(order);
                                } else {
                                  setViewingOrderId(order.id);
                                }
                              }}
                              title="Ver detalles completos de la orden"
                              className="p-1.5 rounded-lg bg-[#F1F2F3] hover:bg-[#010101] hover:text-white text-[#010101] transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedPdfOrder(order)}
                              title="Exportar Hoja Oficial de Servicio en PDF"
                              className="p-1.5 rounded-lg bg-[#DD040F]/10 hover:bg-[#DD040F] hover:text-white text-[#DD040F] transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedEditOrder(order)}
                              title="Editar orden, vehículo y datos"
                              className="p-1.5 rounded-lg bg-[#F1F2F3] hover:bg-[#010101] hover:text-white text-[#010101] transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Confirmas eliminar la orden ${order.id} de ${order.customerName}? Esta acción no se puede deshacer.`)) {
                                  deleteServiceOrder(order.id);
                                }
                              }}
                              title="Eliminar orden"
                              className="p-1.5 rounded-lg bg-[#F1F2F3] hover:bg-[#DD040F] hover:text-white text-neutral-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedTicketOrder(order)}
                              title="Imprimir ticket / comprobante"
                              className="p-1.5 rounded-lg bg-[#F1F2F3] hover:bg-[#010101] hover:text-white text-[#010101] transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedWhatsAppOrder(order)}
                              title="Enviar notificación WhatsApp"
                              className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#DD040F] text-white transition cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Move Forward / Backward */}
                          <div className="flex items-center gap-1 shrink-0">
                            {colIndex > 0 && (
                              <button
                                onClick={() => handleMoveOrder(order.id, order.status, 'backward')}
                                title="Mover a estado anterior"
                                className="p-1 rounded-md bg-[#F1F2F3] hover:bg-[#AAA8A9] text-[#010101] transition cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {colIndex < ORDER_FLOW.length - 1 && (
                              <button
                                onClick={() => handleMoveOrder(order.id, order.status, 'forward')}
                                title="Avanzar al siguiente estado"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#DD040F] hover:bg-[#b5030c] text-white font-bold text-[10px] transition shadow-xs cursor-pointer"
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

      {/* PDF Hoja de Servicio Modal */}
      {selectedPdfOrder && (
        <HojaDeServicioPDFModal order={selectedPdfOrder} onClose={() => setSelectedPdfOrder(null)} />
      )}

      {/* Edit Order Modal */}
      {selectedEditOrder && (
        <EditOrderModal order={selectedEditOrder} onClose={() => setSelectedEditOrder(null)} />
      )}

      {/* Order Detail Modal */}
      {viewingOrderId && (
        <OrderDetailModal orderId={viewingOrderId} onClose={() => setViewingOrderId(null)} />
      )}
    </div>
  );
};
