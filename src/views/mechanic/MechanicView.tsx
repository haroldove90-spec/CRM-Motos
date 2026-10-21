import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ServiceOrder } from '../../types/crm';
import {
  Wrench,
  Clock,
  Play,
  Pause,
  Package,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  Bike,
  Plus,
  Send,
} from 'lucide-react';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { KanbanBoard } from '../../components/KanbanBoard';

interface MechanicViewProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const MechanicView: React.FC<MechanicViewProps> = ({
  activeModule = 'my_jobs',
  onSelectModule,
}) => {
  const { orders, staff, inventory, toggleOrderTimer, updateOrderStatus, addItemToOrder, updateQualityChecklist } = useCRM();
  const mechanics = staff.filter((s) => s.role === 'mechanic');
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>(mechanics[0]?.id || '');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
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
      isDispensed: false, // In request state to warehouse
    });

    setReqCustomDesc('');
    setReqInvId('');
    setReqQty(1);
    alert('¡Solicitud enviada al almacén con éxito!');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Mechanic Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Técnico en Turno
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="font-extrabold text-sm sm:text-base text-slate-900 bg-transparent border-none p-0 focus:outline-hidden cursor-pointer"
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
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            {assignedOrders.length} Motos Asignadas
          </span>
        </div>
      </div>

      {/* Submodule tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl gap-2 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => handleTabChange('my_jobs')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'my_jobs' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Tablero Kanban Asignado
        </button>
        <button
          onClick={() => handleTabChange('stopwatch')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'stopwatch' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Control de Horas & Cronómetros
        </button>
        <button
          onClick={() => handleTabChange('parts_req')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'parts_req' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Pedir Refacciones al Almacén
        </button>
        <button
          onClick={() => handleTabChange('quality')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'quality' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="font-extrabold text-sm text-slate-900">
              Control de Horas & Cronómetro de Mano de Obra en Vivo
            </h3>
            <p className="text-xs text-slate-500">
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
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 hover:border-blue-400 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {order.id}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 mt-1">
                        {order.motorcycleInfo.brand} {order.motorcycleInfo.model}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Placa: <strong>{order.motorcycleInfo.plate}</strong> • Cliente: {order.customerName}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 uppercase">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-500 block mb-0.5">Motivo / Falla reportada:</span>
                    <p className="font-semibold text-slate-800">"{order.reasonForVisit}"</p>
                  </div>

                  {/* Stopwatch & Action Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold text-sm bg-slate-100 px-3 py-1.5 rounded-xl text-slate-900 flex items-center gap-1.5">
                        <Clock className={`w-4 h-4 ${order.isTimerRunning ? 'text-emerald-600 animate-spin' : 'text-slate-400'}`} />
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
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Diagnóstico</span>
                    </button>
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Solicitud de Refacciones al Almacén</h3>
              <p className="text-xs text-slate-500">
                Pide piezas o consumibles directamente para que el almacenista las prepare y descuente del inventario.
              </p>
            </div>

            <form onSubmit={handleSendPartRequest} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Motocicleta / Orden *</label>
                <select
                  value={reqOrderId}
                  onChange={(e) => setReqOrderId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                >
                  {assignedOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} • {o.motorcycleInfo.brand} {o.motorcycleInfo.model} ({o.motorcycleInfo.plate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Seleccionar del Catálogo</label>
                <select
                  value={reqInvId}
                  onChange={(e) => setReqInvId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
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
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Descripción Manual</label>
                  <input
                    type="text"
                    value={reqCustomDesc}
                    onChange={(e) => setReqCustomDesc(e.target.value)}
                    placeholder="Ej. Balero rueda delantera 6202"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={reqQty}
                  onChange={(e) => setReqQty(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="font-extrabold text-base text-slate-900">
              Control de Calidad, Inspección de Salida & Lavado
            </h3>
            <p className="text-xs text-slate-500">
              Asegura que todos los pernos tengan el torque adecuado y la prueba de ruta esté aprobada antes de entregar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedOrders.map((ord) => (
              <div key={ord.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-800">{ord.id}</span>
                    <h4 className="font-black text-sm text-slate-900">{ord.motorcycleInfo.brand} {ord.motorcycleInfo.model}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.washedAndCleaned ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                    {ord.washedAndCleaned ? '🚿 Lavada' : 'Sin Lavar'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {(ord.qualityChecklist || []).map((chk) => (
                    <div key={chk.key} className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-700">{chk.label}</span>
                      <span className={`font-bold ${chk.checked ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {chk.checked ? '✓ OK' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedOrder(ord)}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
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
    </div>
  );
};
