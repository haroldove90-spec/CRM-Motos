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
  Tag,
  Search,
  List,
  KanbanSquare,
  Phone,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { KanbanBoard } from '../../components/KanbanBoard';
import { HojaDeServicioPDFModal } from '../../components/HojaDeServicioPDFModal';
import { EditOrderModal } from '../../components/EditOrderModal';
import { AdditionalFindingsAndReentriesTab } from './AdditionalFindingsAndReentriesTab';
import { BrandControlTab } from './BrandControlTab';

interface MechanicViewProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const MechanicView: React.FC<MechanicViewProps> = ({
  activeModule = 'my_jobs',
  onSelectModule,
}) => {
  const {
    orders,
    staff,
    inventory,
    toggleOrderTimer,
    addItemToOrder,
    deleteServiceOrder,
    updateOrderStatus,
  } = useCRM();
  const mechanics = staff.filter((s) => s.role === 'mechanic');
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>(mechanics[0]?.id || '');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [pdfOrder, setPdfOrder] = useState<ServiceOrder | null>(null);
  const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null);
  const [subTab, setSubTab] = useState<string>(activeModule);

  // Horizontal table controls for assigned jobs
  const [jobsViewMode, setJobsViewMode] = useState<'table' | 'kanban'>('table');
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatusFilter, setJobsStatusFilter] = useState('all');

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

  // Filtered jobs for horizontal list
  const filteredJobs = assignedOrders.filter((o) => {
    if (jobsStatusFilter !== 'all' && o.status !== jobsStatusFilter) return false;
    if (!jobsSearch.trim()) return true;
    const q = jobsSearch.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      (o.orderNumber && o.orderNumber.toString().includes(q)) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.motorcycleInfo.brand.toLowerCase().includes(q) ||
      o.motorcycleInfo.model.toLowerCase().includes(q) ||
      (o.motorcycleInfo.plate && o.motorcycleInfo.plate.toLowerCase().includes(q))
    );
  });

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

      {/* SUBTAB 1: TRABAJOS ASIGNADOS (HISTORIAL / REGISTROS EN FORMATO HORIZONTAL) */}
      {subTab === 'my_jobs' && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-[#010101] flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#DD040F]" />
                <span>Trabajos Asignados en Taller (Lista Horizontal)</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Control y seguimiento horizontal de órdenes de trabajo, cronómetros de diagnóstico y cambio de etapas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative w-60 sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar orden, cliente, moto, placa..."
                  value={jobsSearch}
                  onChange={(e) => setJobsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={jobsStatusFilter}
                onChange={(e) => setJobsStatusFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 outline-none"
              >
                <option value="all">Todos los Estados ({assignedOrders.length})</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_diagnostico">En Diagnóstico</option>
                <option value="esperando_aprobacion">Esperando Aprobación</option>
                <option value="en_reparacion">En Reparación</option>
                <option value="esperando_refaccion">Falta Refacción</option>
                <option value="pruebas_calidad">Pruebas y Calidad</option>
                <option value="listo_entrega">Listo para Entrega</option>
                <option value="entregado">Entregado</option>
              </select>

              {/* View Switcher: Horizontal List vs Columns */}
              <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setJobsViewMode('table')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    jobsViewMode === 'table'
                      ? 'bg-white text-[#010101] shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Vista Horizontal en Tabla"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJobsViewMode('kanban')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    jobsViewMode === 'kanban'
                      ? 'bg-white text-[#010101] shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Vista en Columnas"
                >
                  <KanbanSquare className="w-3.5 h-3.5" />
                  <span>Columnas</span>
                </button>
              </div>
            </div>
          </div>

          {jobsViewMode === 'kanban' ? (
            <KanbanBoard
              mechanicFilterId={selectedMechanicId || undefined}
              onSelectOrder={(order) => setSelectedOrder(order)}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#010101] text-white font-mono font-bold">
                    <tr>
                      <th className="py-3 px-4">FOLIO</th>
                      <th className="py-3 px-4">MOTOCICLETA</th>
                      <th className="py-3 px-4">CLIENTE</th>
                      <th className="py-3 px-4">MOTIVO / DIAGNÓSTICO</th>
                      <th className="py-3 px-3 text-center">ESTADO ACTUAL</th>
                      <th className="py-3 px-3 text-center">CRONÓMETRO</th>
                      <th className="py-3 px-4 text-right">TOTAL / SALDO</th>
                      <th className="py-3 px-4 text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-neutral-400">
                          No se encontraron órdenes asignadas con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((order) => {
                        const paid = (order.deposit || 0) + (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
                        const pendingBalance = Math.max(0, order.total - paid);
                        const liveSeconds =
                          (order.totalWorkedSeconds || 0) +
                          (order.isTimerRunning && order.timerStartedAt
                            ? Math.floor((Date.now() - order.timerStartedAt) / 1000)
                            : 0);

                        return (
                          <tr key={order.id} className="hover:bg-neutral-50/80 transition">
                            {/* Folio */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-[#010101]">
                                  {order.id}
                                </span>
                                {order.priority === 'urgente' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 uppercase animate-pulse">
                                    Urgente
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                                #{order.orderNumber}
                              </span>
                            </td>

                            {/* Moto */}
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-[#010101] text-xs">
                                {order.motorcycleInfo.brand} {order.motorcycleInfo.model}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5">
                                <span className="px-1.5 py-0.2 bg-amber-50 text-amber-900 border border-amber-200 rounded font-mono font-bold">
                                  {order.motorcycleInfo.plate || 'Sin Placa'}
                                </span>
                                <span>• {order.motorcycleInfo.year} • {order.motorcycleInfo.displacement}</span>
                              </div>
                            </td>

                            {/* Cliente */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-neutral-900">{order.customerName}</div>
                              <a
                                href={`https://wa.me/52${order.customerPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 mt-0.5 font-mono"
                              >
                                {order.customerPhone}
                              </a>
                            </td>

                            {/* Motivo */}
                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-medium text-neutral-800 line-clamp-1">{order.reasonForVisit}</p>
                              {order.diagnosticNotes && (
                                <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5 italic">
                                  Diag: {order.diagnosticNotes}
                                </p>
                              )}
                            </td>

                            {/* Estado con selector rápido */}
                            <td className="py-3 px-3 text-center">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-none outline-none cursor-pointer ${
                                  order.status === 'entregado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.status === 'listo_entrega'
                                    ? 'bg-blue-100 text-blue-800'
                                    : order.status === 'en_reparacion'
                                    ? 'bg-purple-100 text-purple-800'
                                    : order.status === 'en_diagnostico'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-neutral-100 text-neutral-800'
                                }`}
                              >
                                <option value="pendiente">1. Pendiente</option>
                                <option value="en_diagnostico">2. En Diagnóstico</option>
                                <option value="esperando_aprobacion">3. Esperando Aprobación</option>
                                <option value="en_reparacion">4. En Reparación</option>
                                <option value="esperando_refaccion">4b. Falta Refacción</option>
                                <option value="pruebas_calidad">5. Pruebas / Calidad</option>
                                <option value="listo_entrega">6. Listo para Entrega</option>
                                <option value="entregado">7. Entregado</option>
                              </select>
                            </td>

                            {/* Cronómetro */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => toggleOrderTimer(order.id, activeMechanic.id, activeMechanic.fullName)}
                                  className={`p-1 rounded-md transition cursor-pointer ${
                                    order.isTimerRunning
                                      ? 'bg-rose-600 text-white animate-pulse'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  }`}
                                  title={order.isTimerRunning ? 'Pausar cronómetro' : 'Iniciar cronómetro'}
                                >
                                  {order.isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                </button>
                                <span className={`font-mono text-xs font-black ${order.isTimerRunning ? 'text-[#DD040F]' : 'text-neutral-800'}`}>
                                  {formatTimer(liveSeconds)}
                                </span>
                              </div>
                            </td>

                            {/* Total / Saldo */}
                            <td className="py-3 px-4 text-right">
                              <div className="font-mono font-black text-neutral-900">${order.total.toFixed(2)}</div>
                              <div className={`font-mono text-[10px] font-bold ${pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {pendingBalance > 0 ? `Saldo: $${pendingBalance.toFixed(2)}` : '✓ Liquidado'}
                              </div>
                            </td>

                            {/* Acciones */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 cursor-pointer"
                                  title="Ver Ficha Completa"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPdfOrder(order)}
                                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-[#DD040F] cursor-pointer"
                                  title="Exportar Hoja Oficial PDF"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditOrder(order)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 cursor-pointer"
                                  title="Editar Registro"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar la orden ${order.id}?`)) {
                                      deleteServiceOrder(order.id);
                                    }
                                  }}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer"
                                  title="Eliminar Orden"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
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

      {/* SUBTAB: CONTROL DE MARCAS (VENTO, DINAMO, MB, BDS, VELOCI, CARABELA) */}
      {subTab === 'brand_control' && (
        <BrandControlTab />
      )}

      {/* SUBTAB: TRABAJOS ADICIONALES / IMPREVISTOS */}
      {subTab === 'findings' && (
        <AdditionalFindingsAndReentriesTab
          mode="findings"
          onViewOrder={(order) => setSelectedOrder(order)}
        />
      )}

      {/* SUBTAB: GARANTÍAS & REINGRESOS */}
      {subTab === 'reentries' && (
        <AdditionalFindingsAndReentriesTab
          mode="reentries"
          onViewOrder={(order) => setSelectedOrder(order)}
        />
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
