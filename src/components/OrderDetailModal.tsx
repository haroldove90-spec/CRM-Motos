import React, { useState, useEffect } from 'react';
import { ServiceOrder, ServiceItem, PaymentRecord } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import {
  X,
  Clock,
  Play,
  Pause,
  Printer,
  MessageCircle,
  Package,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  DollarSign,
  Fuel,
  Camera,
  Share2,
} from 'lucide-react';
import { TicketModal } from './TicketModal';
import { WhatsAppModal } from './WhatsAppModal';

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose }) => {
  const {
    orders,
    inventory,
    staff,
    settings,
    updateServiceOrder,
    updateOrderStatus,
    addItemToOrder,
    removeOrderItem,
    toggleItemApproval,
    dispenseInventoryItem,
    toggleOrderTimer,
    registerPayment,
    updateQualityChecklist,
    completeOrderCheckout,
  } = useCRM();

  const order = orders.find((o) => o.id === orderId);

  // Local tabs: 'overview', 'diagnostic', 'items', 'timer', 'quality', 'payment'
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostic' | 'items' | 'timer' | 'quality' | 'payment'>('overview');

  // Item form state
  const [newItemType, setNewItemType] = useState<'mano_de_obra' | 'repuesto'>('mano_de_obra');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPartNum, setNewItemPartNum] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(settings.standardLaborHourRate);

  // Diagnostic form state
  const [diagNotes, setDiagNotes] = useState(order?.diagnosticNotes || '');
  const [diagPhotoInput, setDiagPhotoInput] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [payRef, setPayRef] = useState('');

  // Checkout Signature & Notes
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [signedName, setSignedName] = useState('');

  // Sub-modals
  const [showTicket, setShowTicket] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // Real-time tick for live timer
  const [, setTick] = useState(0);
  useEffect(() => {
    let interval: any;
    if (order?.isTimerRunning) {
      interval = setInterval(() => setTick((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [order?.isTimerRunning]);

  if (!order) return null;

  // Calculate live elapsed seconds if timer is currently running
  const liveElapsedSeconds = (order.totalWorkedSeconds || 0) +
    (order.isTimerRunning && order.timerStartedAt ? Math.floor((Date.now() - order.timerStartedAt) / 1000) : 0);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const balanceDue = Math.max(0, order.total - (order.deposit || 0));

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc) return;
    addItemToOrder(order.id, {
      description: newItemDesc,
      type: newItemType,
      partNumber: newItemPartNum || undefined,
      quantity: Number(newItemQty),
      unitPrice: Number(newItemPrice),
      totalPrice: Number(newItemQty) * Number(newItemPrice),
      approvedByClient: true,
      isDispensed: newItemType === 'mano_de_obra',
    });
    setNewItemDesc('');
    setNewItemPartNum('');
    setNewItemQty(1);
    setNewItemPrice(newItemType === 'mano_de_obra' ? settings.standardLaborHourRate : 300);
  };

  const handleSelectInventoryPart = (invId: string) => {
    const part = inventory.find((p) => p.id === invId);
    if (!part) return;
    setNewItemType('repuesto');
    setNewItemDesc(part.name);
    setNewItemPartNum(part.partNumber);
    setNewItemPrice(part.salePrice);
  };

  const handleSaveDiagnostic = () => {
    updateServiceOrder(order.id, { diagnosticNotes: diagNotes });
    alert('Diagnóstico técnico guardado con éxito.');
  };

  const handleAddDiagnosticPhoto = () => {
    if (!diagPhotoInput) return;
    const currentPhotos = order.diagnosticPhotos || [];
    updateServiceOrder(order.id, { diagnosticPhotos: [...currentPhotos, diagPhotoInput] });
    setDiagPhotoInput('');
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    registerPayment(order.id, {
      amount: Number(payAmount),
      method: payMethod,
      date: new Date().toISOString(),
      reference: payRef || undefined,
      invoiceNumber: `REC-${Date.now().toString().slice(-4)}`,
    });
    setPayAmount(0);
    setPayRef('');
  };

  const handleToggleQualityItem = (key: string) => {
    const updated = (order.qualityChecklist || []).map((item) =>
      item.key === key ? { ...item, checked: !item.checked, verifiedBy: order.assignedMechanicName || 'Técnico' } : item
    );
    updateQualityChecklist(order.id, updated, order.washedAndCleaned);
  };

  const handleToggleWashed = () => {
    updateQualityChecklist(order.id, order.qualityChecklist || [], !order.washedAndCleaned);
  };

  const handleCompleteCheckout = () => {
    if (balanceDue > 0) {
      if (!window.confirm(`Aún existe un saldo pendiente de $${balanceDue.toLocaleString()} MXN. ¿Deseas entregar el vehículo de todos modos?`)) {
        return;
      }
    }
    const signature = signedName ? `Firma Digital de: ${signedName}` : 'Conformidad de entrega registrada';
    completeOrderCheckout(order.id, signature, checkoutNotes || 'Entrega completada satisfactoriamente.');
    alert('¡Orden finalizada y entregada con éxito! Se programó el recordatorio de mantenimiento.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-600 text-white shadow-xs">
              {order.id}
            </span>
            <div>
              <h2 className="font-black text-base sm:text-lg text-white leading-tight">
                {order.motorcycleInfo.brand} {order.motorcycleInfo.model} ({order.motorcycleInfo.year})
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Placa: <strong className="text-white">{order.motorcycleInfo.plate}</strong> • Cliente: {order.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTicket(true)}
              title="Imprimir ticket"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5 text-orange-400" />
              <span>Ticket</span>
            </button>
            <button
              onClick={() => setShowWhatsApp(true)}
              title="Notificar por WhatsApp"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Phase Progression Bar */}
        <div className="bg-slate-100 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Estado Actual:</span>
            <select
              value={order.status}
              onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
              className="bg-white border border-slate-300 font-bold rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden focus:border-orange-500"
            >
              <option value="pendiente">1. Pendiente de Asignación</option>
              <option value="en_diagnostico">2. En Diagnóstico</option>
              <option value="esperando_aprobacion">3. Esperando Aprobación Cliente</option>
              <option value="en_reparacion">4. En Reparación</option>
              <option value="esperando_refaccion">4.1 Esperando Refacción</option>
              <option value="pruebas_calidad">5. Pruebas y Calidad</option>
              <option value="listo_entrega">6. Listo para Entrega</option>
              <option value="entregado">7. Finalizado y Entregado</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Stopwatch Indicator */}
            <div className="flex items-center gap-1.5 font-mono font-bold text-xs bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-800">
              <Clock className={`w-3.5 h-3.5 ${order.isTimerRunning ? 'text-emerald-600 animate-spin' : 'text-slate-400'}`} />
              <span>{formatTimer(liveElapsedSeconds)}</span>
              <button
                type="button"
                onClick={() =>
                  toggleOrderTimer(
                    order.id,
                    order.assignedMechanicId || 'tech-1',
                    order.assignedMechanicName || 'Mecánico'
                  )
                }
                className={`ml-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                  order.isTimerRunning ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {order.isTimerRunning ? 'Pausar' : 'Iniciar'}
              </button>
            </div>

            <div className="font-bold text-slate-900 font-mono">
              Total: <span className="text-orange-600">${order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 gap-1 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Resumen & Check-in
          </button>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`py-3 px-3.5 border-b-2 transition ${
              activeTab === 'diagnostic'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Diagnóstico & Evidencias
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`py-3 px-3.5 border-b-2 transition ${
              activeTab === 'items'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Piezas & Mano de Obra ({order.items.length})
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`py-3 px-3.5 border-b-2 transition ${
              activeTab === 'quality'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Control de Calidad & Lavado
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`py-3 px-3.5 border-b-2 transition ${
              activeTab === 'payment'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Cobro & Entrega (Saldo: ${balanceDue.toLocaleString()})
          </button>
        </div>

        {/* Tab Contents Scrollable */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: OVERVIEW & CHECKIN */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reason & Vehicle Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                    Motivo de Ingreso
                  </h4>
                  <p className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
                    "{order.reasonForVisit}"
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">KM Ingreso:</span>
                      <strong className="text-slate-800 font-mono">{order.checkIn.mileage.toLocaleString()} km</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tanque Combustible:</span>
                      <strong className="text-orange-600">{order.checkIn.fuelLevel}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Técnico Asignado:</span>
                      <strong className="text-slate-800">{order.assignedMechanicName || 'Sin Asignar'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Prioridad:</span>
                      <strong className="capitalize text-slate-800">{order.priority}</strong>
                    </div>
                  </div>
                </div>

                {/* Custody Accessories & Damages */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                    Accesorios Dejados en Custodia
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {order.checkIn.accessoriesLeft.length > 0 ? (
                      order.checkIn.accessoriesLeft.map((acc, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                          ✓ {acc}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Sin accesorios registrados</span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 pt-2 border-t border-slate-200">
                    Daños Previos Registrados ({order.checkIn.damages.length})
                  </h4>
                  {order.checkIn.damages.length > 0 ? (
                    <div className="space-y-1 text-xs">
                      {order.checkIn.damages.map((d, i) => (
                        <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                          <span className="font-bold text-slate-800 capitalize">{d.zone.replace('_', ' ')}</span>
                          <span className="text-slate-600">{d.notes} ({d.type})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Vehículo sin daños visuales previos</span>
                  )}
                </div>
              </div>

              {/* Check-in Photos */}
              {order.checkIn.photos.length > 0 && (
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 mb-2">
                    Fotografías del Check-in Inicial
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {order.checkIn.photos.map((p, i) => (
                      <div key={i} className="rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-2xs">
                        <img src={p} alt="Checkin" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIAGNOSTIC & EVIDENCES */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                    Fase 2: Notas de Diagnóstico Mecánico
                  </h4>
                  <button
                    onClick={handleSaveDiagnostic}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition"
                  >
                    Guardar Diagnóstico
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={diagNotes}
                  onChange={(e) => setDiagNotes(e.target.value)}
                  placeholder="Escribe el diagnóstico técnico detallado, fallas encontradas y justificación de cambios de repuestos para el cliente..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              {/* Photos of damaged parts */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                  Evidencia Fotográfica de Piezas Dañadas (Para justificar cambios al cliente)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="URL de foto o imagen de pieza dañada..."
                    value={diagPhotoInput}
                    onChange={(e) => setDiagPhotoInput(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDiagnosticPhoto}
                    className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                  >
                    Agregar Foto
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {(order.diagnosticPhotos || []).map((photoUrl, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden aspect-video border border-slate-200 bg-white shadow-2xs">
                      <img src={photoUrl} alt="Pieza dañada" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ITEMS, PARTS & LABOR */}
          {activeTab === 'items' && (
            <div className="space-y-5">
              {/* Add Item Form */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                    Agregar Concepto al Presupuesto / Hoja de Trabajo
                  </h4>
                  {inventory.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-semibold">Cargar de Almacén:</span>
                      <select
                        onChange={(e) => handleSelectInventoryPart(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="">-- Seleccionar Refacción --</option>
                        {inventory.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} (Stock: {inv.stock}) - ${inv.salePrice}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <div className="sm:col-span-1">
                    <select
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="mano_de_obra">Mano de Obra</option>
                      <option value="repuesto">Refacción / Insumo</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Descripción del trabajo o pieza..."
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      placeholder="N° Parte (opcional)"
                      value={newItemPartNum}
                      onChange={(e) => setNewItemPartNum(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1 flex gap-1">
                    <input
                      type="number"
                      min={1}
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      title="Cantidad"
                    />
                    <input
                      type="number"
                      min={0}
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      title="Precio Unitario"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Concepto</th>
                      <th className="p-3 text-center">Tipo</th>
                      <th className="p-3 text-center">Cant.</th>
                      <th className="p-3 text-right">P. Unit</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Aprobado Cliente</th>
                      <th className="p-3 text-center">Almacén (Surtido)</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <tr key={item.id} className={!item.approvedByClient ? 'bg-red-50/30 text-slate-400' : ''}>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{item.description}</p>
                          {item.partNumber && (
                            <span className="font-mono text-[10px] text-slate-400">NP: {item.partNumber}</span>
                          )}
                        </td>
                        <td className="p-3 text-center capitalize text-slate-500 font-semibold">
                          {item.type.replace('_', ' ')}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">${item.unitPrice.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">${item.totalPrice.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleItemApproval(order.id, item.id, !item.approvedByClient)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                              item.approvedByClient
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {item.approvedByClient ? '✓ Autorizado' : '✕ No Autorizado'}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          {item.type === 'repuesto' ? (
                            item.isDispensed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Surtido
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = dispenseInventoryItem(order.id, item.id);
                                  if (!res.success) alert(res.error);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 hover:bg-orange-200 transition cursor-pointer"
                              >
                                Surtir Almacén
                              </button>
                            )
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeOrderItem(order.id, item.id)}
                            className="text-slate-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="w-64 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal autorizados:</span>
                    <span className="font-mono font-semibold">${order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IVA ({settings.taxPercentage}%):</span>
                    <span className="font-mono font-semibold">${order.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Presupuestado:</span>
                    <span className="font-mono text-orange-600">${order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUALITY CONTROL & WASHING */}
          {activeTab === 'quality' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                      Fase 5: Inspección de Calidad y Prueba de Ruta
                    </h4>
                    <p className="text-xs text-slate-500">Verifica que la moto sea 100% segura para el cliente</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {(order.qualityChecklist || []).map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleToggleQualityItem(item.key)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        item.checked
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 ${item.checked ? 'text-emerald-600' : 'text-slate-300'}`} />
                        <span className="font-semibold text-xs">{item.label}</span>
                      </div>
                      {item.checked && (
                        <span className="text-[10px] font-mono text-emerald-700">
                          Verificado por {item.verifiedBy || 'Técnico'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Wash and detailing */}
                <div className="pt-3 border-t border-slate-200">
                  <div
                    onClick={handleToggleWashed}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      order.washedAndCleaned
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🚿</span>
                      <div>
                        <p className="font-bold text-xs">Lavado y Limpieza de Entrega</p>
                        <p className="text-[11px] text-slate-500">Motocicleta limpia y con abrillantador para presentación impecable</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${order.washedAndCleaned ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {order.washedAndCleaned ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                {/* Advance to Ready for delivery */}
                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(order.id, 'listo_entrega')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Control de Calidad y Pasar a "Listo para Entrega"</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENT, CHECKOUT & DELIVERY */}
          {activeTab === 'payment' && (
            <div className="space-y-5">
              {/* Balances */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cotizado</span>
                  <p className="text-xl font-extrabold text-slate-900 font-mono">${order.total.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Pagado / Anticipos</span>
                  <p className="text-xl font-extrabold text-emerald-800 font-mono">${(order.deposit || 0).toLocaleString()}</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${balanceDue > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${balanceDue > 0 ? 'text-red-600' : 'text-slate-400'}`}>Saldo Pendiente</span>
                  <p className={`text-xl font-extrabold font-mono ${balanceDue > 0 ? 'text-red-600' : 'text-slate-900'}`}>${balanceDue.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment Registration Form */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                  Registrar Cobro (Efectivo, Tarjeta o Transferencia)
                </h4>
                <form onSubmit={handleRegisterPayment} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Monto a Cobrar ($)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={balanceDue > 0 ? balanceDue : undefined}
                      value={payAmount || ''}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      placeholder={`Saldo: $${balanceDue}`}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Forma de Pago</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta (Terminal TPV)</option>
                      <option value="transferencia">Transferencia SPEI / Banco</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Referencia / Folio</label>
                    <input
                      type="text"
                      placeholder="Ej: BBVA-40912 o TPV-88"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      Registrar Cobro
                    </button>
                  </div>
                </form>

                {/* Payment History */}
                {order.payments && order.payments.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Historial de Cobros:</span>
                    <div className="space-y-1">
                      {order.payments.map((p) => (
                        <div key={p.id} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between text-xs">
                          <span className="font-semibold text-slate-800 capitalize">{p.method} ({p.invoiceNumber})</span>
                          <span className="text-slate-500 font-mono">{new Date(p.date).toLocaleDateString()}</span>
                          <span className="font-mono font-bold text-emerald-700">${p.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Signature and Checkout */}
              {order.status !== 'entregado' && (
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-400">
                    Fase 6: Entrega Final de la Motocicleta
                  </h4>
                  <p className="text-xs text-slate-300">
                    Inspección de salida junto al cliente, firma digital de conformidad y programación de recordatorio de servicio.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre de quien retira *</label>
                      <input
                        type="text"
                        placeholder={order.customerName}
                        value={signedName}
                        onChange={(e) => setSignedName(e.target.value)}
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Notas de Entrega</label>
                      <input
                        type="text"
                        placeholder="Ej. Se entregaron piezas reemplazadas y casco"
                        value={checkoutNotes}
                        onChange={(e) => setCheckoutNotes(e.target.value)}
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCompleteCheckout}
                      className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold transition shadow-lg shadow-orange-600/30"
                    >
                      Completar Entrega y Cerrar Orden
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showTicket && <TicketModal order={order} onClose={() => setShowTicket(false)} />}
      {showWhatsApp && <WhatsAppModal order={order} onClose={() => setShowWhatsApp(false)} defaultType="ready" />}
    </div>
  );
};
