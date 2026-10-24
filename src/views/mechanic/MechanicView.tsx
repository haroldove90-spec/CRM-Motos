import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ServiceOrder } from '../../types/crm';
import {
  Wrench,
  Clock,
  Play,
  Pause,
  Eye,
  Send,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { KanbanBoard } from '../../components/KanbanBoard';
import { HojaDeServicioPDFModal } from '../../components/HojaDeServicioPDFModal';
import { EditOrderModal } from '../../components/EditOrderModal';

interface MechanicViewProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const MechanicView: React.FC<MechanicViewProps> = ({
  activeModule = 'my_jobs',
  onSelectModule,
}) => {
  const { orders, staff, inventory, toggleOrderTimer, addItemToOrder, deleteServiceOrder } = useCRM();
  const mechanics = staff.filter((s) => s.role === 'mechanic');
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>(mechanics[0]?.id || '');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [pdfOrder, setPdfOrder] = useState<ServiceOrder | null>(null);
  const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null);
  const [subTab, setSubTab] = useState<string>(activeModule);

  useEffect(() => {
    if (activeModule) {
      setSubTab(activeModule);
    }
  }, [activeModule]);

  const handleTabChange = (tabId: string) => {
    setSubTab(tabId);
    if (onSelectModule) onSelectModule(tabId);
  };

  const activeMechanic = staff.find((s) => s.id === selectedMechanicId) || mechanics[0];

  // Assigned orders
  const assignedOrders = orders.filter(
    (o) => !selectedMechanicId || o.assignedMechanicId === selectedMechanicId
  );

  // Quick part request state
  const [reqOrderId, setReqOrderId] = useState<string>(assignedOrders[0]?.id || '');
  const [reqInvId, setReqInvId] = useState<string>('');
  const [reqCustomDesc, setReqCustomDesc] = useState<string>('');
  const [reqQty, setReqQty] = useState<number>(1);

  // Live timer tick
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendPartRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqOrderId) {
      alert('Selecciona una orden de trabajo');
      return;
    }
    const invItem = inventory.find((i) => i.id === reqInvId);
    const desc = invItem ? invItem.name : reqCustomDesc;
    const partNum = invItem ? invItem.partNumber : undefined;
    const price = invItem ? invItem.salePrice : 0;

    if (!desc) {
      alert('Ingresa la refacción solicitada');
      return;
    }

    addItemToOrder(reqOrderId, {
      description: desc,
      type: 'repuesto',
      partNumber: partNum,
      quantity: Number(reqQty),
      unitPrice: price,
      totalPrice: price * Number(reqQty),
      approvedByClient: true,
      isDispensed: false,
    });

    setReqCustomDesc('');
    setReqInvId('');
    setReqQty(1);
    alert('¡Solicitud enviada al almacén con éxito!');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Mechanic Selector */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#010101] text-white flex items-center justify-center">
            <Wrench className="w-5 h-5 text-[#DD040F]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Técnico en Turno
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="font-extrabold text-sm sm:text-base text-[#010101] bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
              >
                <option value="">-- Ver Todas las Motos del Taller --</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.specialty || 'Técnico Especialista'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#010101] text-white text-xs font-bold">
            {assignedOrders.length} Motos Asignadas
          </span>
        </div>
      </div>

      {/* Submodule tabs */}
      <div className="flex border-b border-neutral-200 bg-white px-4 rounded-xl gap-2 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => handleTabChange('my_jobs')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'my_jobs' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Tablero Kanban Asignado
        </button>
        <button
          onClick={() => handleTabChange('stopwatch')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'stopwatch' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Control de Horas & Cronómetros
        </button>
        <button
          onClick={() => handleTabChange('parts_req')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'parts_req' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Pedir Refacciones al Almacén
        </button>
        <button
          onClick={() => handleTabChange('quality')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'quality' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Pruebas de Ruta & Calidad
        </button>
      </div>

      {/* SUBTAB 1: MY JOBS (KANBAN) */}
      {subTab === 'my_jobs' && (
        <KanbanBoard
          mechanicFilterId={selectedMechanicId || undefined}
          onSelectOrder={(order) => setSelectedOrder(order)}
        />
      )}

      {/* SUBTAB 2: STOPWATCH & TIME LOGS */}
      {subTab === 'stopwatch' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <h3 className="font-extrabold text-sm text-[#010101]">
              Control de Horas & Cronómetro de Mano de Obra en Vivo
            </h3>
            <p className="text-xs text-neutral-500">
              Registra los tiempos dedicados a cada motocicleta para garantizar comisiones justas y facturación exacta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedOrders.map((order) => {
              const liveSeconds =
                (order.totalWorkedSeconds || 0) +
                (order.isTimerRunning && order.timerStartedAt
                  ? Math.floor((Date.now() - order.timerStartedAt) / 1000)
                  : 0);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs space-y-4 hover:border-[#010101] transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-neutral-100 text-[#010101]">
                        {order.id}
                      </span>
                      <h3 className="font-extrabold text-base text-[#010101] mt-1">
                        {order.motorcycleInfo.brand} {order.motorcycleInfo.model}
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono">
                        Placa: <strong>{order.motorcycleInfo.plate}</strong> • Cliente: {order.customerName}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#010101] text-white uppercase">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8F9FA] rounded-xl border border-neutral-100 text-xs">
                    <span className="font-bold text-neutral-500 block mb-0.5">Motivo / Falla reportada:</span>
                    <p className="font-semibold text-[#010101]">"{order.reasonForVisit}"</p>
                  </div>

                  {/* Stopwatch & Action Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold text-sm bg-neutral-100 px-3 py-1.5 rounded-xl text-[#010101] flex items-center gap-1.5">
                        <Clock className={`w-4 h-4 ${order.isTimerRunning ? 'text-[#DD040F] animate-spin' : 'text-neutral-400'}`} />
                        <span>{formatTimer(liveSeconds)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          toggleOrderTimer(
                            order.id,
                            activeMechanic?.id || 'm-1',
                            activeMechanic?.fullName || 'Mecánico'
                          )
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                          order.isTimerRunning
                            ? 'bg-[#DD040F] hover:bg-[#b5030c] text-white'
                            : 'bg-[#010101] hover:bg-neutral-800 text-white'
                        }`}
                      >
                        {order.isTimerRunning ? (
                          <>
                            <Pause className="w-3.5 h-3.5" /> Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Iniciar
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setPdfOrder(order)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#DD040F] hover:bg-[#b5030c] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        title="Ver / Exportar Hoja de Servicio Oficial en PDF"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#010101] text-xs font-bold transition cursor-pointer"
                        title="Ver diagnóstico y detalles"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#DD040F]" />
                        <span>Ver</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditOrder(order)}
                        className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#010101] text-xs transition cursor-pointer"
                        title="Editar orden"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Confirmas eliminar la orden ${order.id} de ${order.customerName}?`)) {
                            deleteServiceOrder(order.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-neutral-100 hover:bg-[#DD040F]/15 text-neutral-400 hover:text-[#DD040F] text-xs transition cursor-pointer"
                        title="Eliminar orden"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PARTS REQUEST */}
      {subTab === 'parts_req' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-[#010101]">Solicitud de Refacciones al Almacén</h3>
              <p className="text-xs text-neutral-500">
                Pide piezas o consumibles directamente para que el almacenista las prepare y descuente del inventario.
              </p>
            </div>

            <form onSubmit={handleSendPartRequest} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#F8F9FA] p-4 rounded-xl border border-neutral-200">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Motocicleta / Orden *</label>
                <select
                  value={reqOrderId}
                  onChange={(e) => setReqOrderId(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-[#010101]"
                >
                  {assignedOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} • {o.motorcycleInfo.brand} {o.motorcycleInfo.model} ({o.motorcycleInfo.plate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Seleccionar del Catálogo</label>
                <select
                  value={reqInvId}
                  onChange={(e) => setReqInvId(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs text-[#010101]"
                >
                  <option value="">-- O escribir personalizada --</option>
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.stock})
                    </option>
                  ))}
                </select>
              </div>

              {!reqInvId && (
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Descripción Manual</label>
                  <input
                    type="text"
                    value={reqCustomDesc}
                    onChange={(e) => setReqCustomDesc(e.target.value)}
                    placeholder="Ej. Balero rueda delantera 6202"
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={reqQty}
                  onChange={(e) => setReqQty(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono font-bold text-[#010101]"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#DD040F] hover:bg-[#b5030c] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Pedido a Almacén</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 4: QUALITY CHECK & ROAD TEST */}
      {subTab === 'quality' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <h3 className="font-extrabold text-base text-[#010101]">
              Control de Calidad, Inspección de Salida & Lavado
            </h3>
            <p className="text-xs text-neutral-500">
              Asegura que todos los pernos tengan el torque adecuado y la prueba de ruta esté aprobada antes de entregar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedOrders.map((ord) => (
              <div key={ord.id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#010101]">{ord.id}</span>
                    <h4 className="font-black text-sm text-[#010101]">{ord.motorcycleInfo.brand} {ord.motorcycleInfo.model}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.washedAndCleaned ? 'bg-[#010101] text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                    {ord.washedAndCleaned ? '🚿 Lavada' : 'Sin Lavar'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {(ord.qualityChecklist || []).map((chk) => (
                    <div key={chk.key} className="flex items-center justify-between p-1.5 rounded bg-[#F8F9FA] border border-neutral-100">
                      <span className="text-neutral-700">{chk.label}</span>
                      <span className={`font-bold ${chk.checked ? 'text-[#010101]' : 'text-neutral-400'}`}>
                        {chk.checked ? '✓ OK' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="px-3 py-1.5 bg-[#010101] text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Abrir Hoja de Calidad
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          orderId={selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* PDF Hoja de Servicio Modal */}
      {pdfOrder && (
        <HojaDeServicioPDFModal order={pdfOrder} onClose={() => setPdfOrder(null)} />
      )}

      {/* Edit Order Modal */}
      {editOrder && (
        <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} />
      )}
    </div>
  );
};
