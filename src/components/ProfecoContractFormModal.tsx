import React, { useState, useRef } from 'react';
import { ProfecoContract, ServiceOrder } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import { X, ShieldCheck, Sparkles, FileText, Check, PenTool, RotateCcw } from 'lucide-react';

interface ProfecoContractFormModalProps {
  existingContract?: ProfecoContract | null;
  onClose: () => void;
  onSaved: (contract: ProfecoContract) => void;
}

export const ProfecoContractFormModal: React.FC<ProfecoContractFormModalProps> = ({
  existingContract,
  onClose,
  onSaved,
}) => {
  const { settings, orders, addProfecoContract, updateProfecoContract } = useCRM();

  // Selected order for pre-filling
  const [selectedOrderId, setSelectedOrderId] = useState<string>(existingContract?.orderId || '');

  // Form state initialized with existing contract or defaults from settings
  const [date, setDate] = useState<string>(
    existingContract?.date || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<ProfecoContract['status']>(
    existingContract?.status || 'firmado'
  );

  // Workshop / Provider
  const [providerName, setProviderName] = useState(
    existingContract?.providerName || settings.legalName || settings.workshopName
  );
  const [providerRepresentative, setProviderRepresentative] = useState(
    existingContract?.providerRepresentative || settings.profecoRepresentative || 'Ing. Carlos Mendoza Silva'
  );
  const [providerRfc, setProviderRfc] = useState(
    existingContract?.providerRfc || settings.taxId
  );
  const [providerAddress, setProviderAddress] = useState(
    existingContract?.providerAddress || settings.address
  );
  const [providerPhone, setProviderPhone] = useState(
    existingContract?.providerPhone || settings.phone
  );
  const [providerEmail, setProviderEmail] = useState(
    existingContract?.providerEmail || settings.email
  );
  const [profecoRegistrationNumber, setProfecoRegistrationNumber] = useState(
    existingContract?.profecoRegistrationNumber || settings.profecoRegistrationNumber || 'PFC-REP-4892/2026'
  );
  const [profecoRegistrationDate, setProfecoRegistrationDate] = useState(
    existingContract?.profecoRegistrationDate || settings.profecoRegistrationDate || '15/01/2026'
  );
  const [scheduleAttention, setScheduleAttention] = useState(
    existingContract?.scheduleAttention || settings.profecoScheduleAttention || 'Lunes a Viernes 08:30 a 19:00 hrs, Sábados 09:00 a 14:00 hrs'
  );

  // Customer
  const [customerName, setCustomerName] = useState(existingContract?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(existingContract?.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(existingContract?.customerEmail || '');
  const [customerAddress, setCustomerAddress] = useState(existingContract?.customerAddress || '');
  const [customerRfc, setCustomerRfc] = useState(existingContract?.customerRfc || '');

  // Motorcycle
  const [motorcycleBrand, setMotorcycleBrand] = useState(existingContract?.motorcycleBrand || '');
  const [motorcycleModel, setMotorcycleModel] = useState(existingContract?.motorcycleModel || '');
  const [motorcycleYear, setMotorcycleYear] = useState<number | string>(existingContract?.motorcycleYear || 2024);
  const [motorcyclePlate, setMotorcyclePlate] = useState(existingContract?.motorcyclePlate || '');
  const [motorcycleVin, setMotorcycleVin] = useState(existingContract?.motorcycleVin || '');
  const [motorcycleColor, setMotorcycleColor] = useState(existingContract?.motorcycleColor || '');
  const [motorcycleMileage, setMotorcycleMileage] = useState<number | string>(existingContract?.motorcycleMileage || 0);

  // Service & Economics
  const [serviceDescription, setServiceDescription] = useState(
    existingContract?.serviceDescription || 'Mantenimiento y reparación según presupuesto carátula.'
  );
  const [agreedBudget, setAgreedBudget] = useState<number>(existingContract?.agreedBudget || 0);
  const [deposit, setDeposit] = useState<number>(existingContract?.deposit || 0);
  const [deliveryDate, setDeliveryDate] = useState(
    existingContract?.deliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [warrantyDays, setWarrantyDays] = useState(
    existingContract?.warrantyDays || settings.profecoDefaultWarrantyDays || 90
  );
  const [testRadiusKm, setTestRadiusKm] = useState(
    existingContract?.testRadiusKm || settings.profecoDefaultTestRadiusKm || 5
  );
  const [penaltyPercent, setPenaltyPercent] = useState(
    existingContract?.penaltyPercent || settings.profecoDefaultPenaltyPercent || 15
  );
  const [storageWaitHours, setStorageWaitHours] = useState(
    existingContract?.storageWaitHours || 48
  );
  const [cancellationDays, setCancellationDays] = useState(
    existingContract?.cancellationDays || settings.profecoDefaultCancellationDays || 5
  );
  const [notes, setNotes] = useState(existingContract?.notes || '');

  // Signature
  const [consumerSignature, setConsumerSignature] = useState(existingContract?.consumerSignature || '');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Auto-calculate pending balance
  const pendingBalance = Math.max(0, agreedBudget - deposit);

  // Auto-populate when selecting an existing order
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setCustomerName(order.customerName);
    setCustomerPhone(order.customerPhone);
    setCustomerEmail(order.customerEmail || '');
    setMotorcycleBrand(order.motorcycleInfo.brand);
    setMotorcycleModel(order.motorcycleInfo.model);
    setMotorcycleYear(order.motorcycleInfo.year);
    setMotorcyclePlate(order.motorcycleInfo.plate);
    setMotorcycleVin(order.motorcycleInfo.vin);
    setMotorcycleColor(order.motorcycleInfo.color);
    setMotorcycleMileage(order.checkIn?.mileage || 0);

    const descriptions = order.items.map((it) => it.description).join(', ');
    setServiceDescription(descriptions || order.reasonForVisit || 'Servicio integral');
    setAgreedBudget(order.total || 0);
    setDeposit(order.deposit || 0);

    if (order.checkIn?.customerSignature && !consumerSignature) {
      setConsumerSignature(order.checkIn.customerSignature);
    }
  };

  // Canvas signature helpers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#010101';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setConsumerSignature(canvas.toDataURL('image/png'));
    }
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setConsumerSignature('');
  };

  const handleQuickDigitalSignature = () => {
    const sig = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><path d="M10 25 Q 40 5, 80 25 T 150 20" stroke="black" stroke-width="2.5" fill="none"/></svg>`;
    setConsumerSignature(sig);
  };

  // Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor indica el nombre y teléfono del cliente.');
      return;
    }

    const payload: Omit<ProfecoContract, 'id' | 'createdAt' | 'updatedAt'> = {
      contractNumber: existingContract?.contractNumber || '',
      orderId: selectedOrderId || undefined,
      date,
      status,
      providerName,
      providerRepresentative,
      providerRfc,
      providerAddress,
      providerPhone,
      providerEmail,
      profecoRegistrationNumber,
      profecoRegistrationDate,
      scheduleAttention,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerRfc,
      motorcycleBrand,
      motorcycleModel,
      motorcycleYear,
      motorcyclePlate,
      motorcycleVin,
      motorcycleColor,
      motorcycleMileage,
      serviceDescription,
      agreedBudget,
      deposit,
      pendingBalance,
      deliveryDate,
      warrantyDays,
      testRadiusKm,
      penaltyPercent,
      storageWaitHours,
      cancellationDays,
      notes,
      consumerSignature,
      providerSignature: existingContract?.providerSignature || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><path d="M10 20 Q 30 10, 50 30 T 100 15" stroke="darkred" stroke-width="2" fill="none"/></svg>',
    };

    if (existingContract) {
      updateProfecoContract(existingContract.id, payload);
      onSaved({
        ...existingContract,
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const created = addProfecoContract(payload);
      onSaved(created);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-neutral-300 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-[#010101] text-white p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#DD040F] rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg text-white tracking-wide">
                {existingContract ? 'Editar Contrato PROFECO' : 'Nuevo Contrato de Adhesión PROFECO'}
              </h2>
              <p className="text-xs text-neutral-400">
                Apegado a la NOM-174-SCFI-2007 • Tamaño Carta 1 Hoja con Cláusulas 1 a 20 Oficiales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Quick Pre-fill Selector */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#DD040F]" />
              <div>
                <span className="font-black text-xs text-[#010101] block">Pre-llenar datos desde Orden de Servicio</span>
                <span className="text-[11px] text-neutral-500">Selecciona una orden activa para auto-rellenar cliente, moto, conceptos y anticipo</span>
              </div>
            </div>
            <select
              value={selectedOrderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="bg-white border border-neutral-300 rounded-lg text-xs font-semibold px-3 py-2 text-[#010101] focus:ring-2 focus:ring-[#DD040F] focus:outline-none min-w-[260px]"
            >
              <option value="">-- Seleccionar Orden de Servicio --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} — {o.customerName} ({o.motorcycleInfo.brand} {o.motorcycleInfo.model}) - ${o.total}
                </option>
              ))}
            </select>
          </div>

          {/* Section 1: Institutional & Contract Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-neutral-100 p-3.5 rounded-xl border border-neutral-200 text-xs">
            <div>
              <label className="font-bold text-neutral-700 block mb-1">Fecha de Celebración</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 block mb-1">Estatus del Contrato</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProfecoContract['status'])}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-bold"
              >
                <option value="firmado">Firmado de Conformidad</option>
                <option value="borrador">Borrador / Pendiente de Firma</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-neutral-700 block mb-1">No. Registro PROFECO</label>
              <input
                type="text"
                value={profecoRegistrationNumber}
                onChange={(e) => setProfecoRegistrationNumber(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 block mb-1">Fecha Reg. PROFECO</label>
              <input
                type="text"
                value={profecoRegistrationDate}
                onChange={(e) => setProfecoRegistrationDate(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          {/* Section 2: El Consumidor (Cliente) */}
          <div>
            <h3 className="text-xs font-black uppercase text-[#DD040F] tracking-wider mb-2 flex items-center gap-1.5">
              <span>II. Datos del Consumidor</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="font-bold text-neutral-700 block mb-1">Nombre Completo del Cliente *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Juan Pérez González"
                  required
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej. +52 442 123 4567"
                  required
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">RFC del Cliente (Opcional)</label>
                <input
                  type="text"
                  value={customerRfc}
                  onChange={(e) => setCustomerRfc(e.target.value)}
                  placeholder="PEGA880101-XXX"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Domicilio del Cliente</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Calle, Número, Colonia, Ciudad"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Datos de la Motocicleta */}
          <div>
            <h3 className="text-xs font-black uppercase text-[#DD040F] tracking-wider mb-2 flex items-center gap-1.5">
              <span>III. Datos de la Motocicleta</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-neutral-700 block mb-1">Marca</label>
                <input
                  type="text"
                  value={motorcycleBrand}
                  onChange={(e) => setMotorcycleBrand(e.target.value)}
                  placeholder="Ej. Yamaha"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold text-neutral-700 block mb-1">Modelo</label>
                <input
                  type="text"
                  value={motorcycleModel}
                  onChange={(e) => setMotorcycleModel(e.target.value)}
                  placeholder="Ej. MT-03 ABS"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Año</label>
                <input
                  type="number"
                  value={motorcycleYear}
                  onChange={(e) => setMotorcycleYear(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Placas</label>
                <input
                  type="text"
                  value={motorcyclePlate}
                  onChange={(e) => setMotorcyclePlate(e.target.value)}
                  placeholder="QRO-123"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 uppercase font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Km Entrada</label>
                <input
                  type="number"
                  value={motorcycleMileage}
                  onChange={(e) => setMotorcycleMileage(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="font-bold text-neutral-700 block mb-1">VIN / Número de Serie</label>
                <input
                  type="text"
                  value={motorcycleVin}
                  onChange={(e) => setMotorcycleVin(e.target.value)}
                  placeholder="17 dígitos"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 uppercase font-mono"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="font-bold text-neutral-700 block mb-1">Color de la Unidad</label>
                <input
                  type="text"
                  value={motorcycleColor}
                  onChange={(e) => setMotorcycleColor(e.target.value)}
                  placeholder="Ej. Azul Racing con Negro"
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Presupuesto & Condiciones Económicas */}
          <div>
            <h3 className="text-xs font-black uppercase text-[#DD040F] tracking-wider mb-2 flex items-center gap-1.5">
              <span>IV. Presupuesto, Anticipo y Cláusulas Operativas</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mb-3">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Presupuesto Total ($ MXN) *</label>
                <input
                  type="number"
                  value={agreedBudget}
                  onChange={(e) => setAgreedBudget(Number(e.target.value))}
                  required
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono font-bold text-base text-[#010101]"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Anticipo al Celebrar ($)</label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-mono font-bold text-base text-green-700"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Saldo a Liquidar ($)</label>
                <input
                  type="number"
                  readOnly
                  value={pendingBalance}
                  className="w-full bg-neutral-100 border border-neutral-300 rounded-lg p-2 font-mono font-bold text-base text-[#DD040F]"
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Fecha Compromiso Entrega</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <div>
                <label className="font-bold text-neutral-600 block text-[10px]">Garantía (Cláusula 7)</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={warrantyDays}
                    onChange={(e) => setWarrantyDays(Number(e.target.value))}
                    className="w-16 bg-white border border-neutral-300 rounded p-1 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-500">días</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-neutral-600 block text-[10px]">Radio Pruebas (Cláusula 8)</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={testRadiusKm}
                    onChange={(e) => setTestRadiusKm(Number(e.target.value))}
                    className="w-16 bg-white border border-neutral-300 rounded p-1 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-500">km</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-neutral-600 block text-[10px]">Pena Incumpl. (Cláusula 11)</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={penaltyPercent}
                    onChange={(e) => setPenaltyPercent(Number(e.target.value))}
                    className="w-16 bg-white border border-neutral-300 rounded p-1 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-500">%</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-neutral-600 block text-[10px]">Almacenaje (Cláusula 12)</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={storageWaitHours}
                    onChange={(e) => setStorageWaitHours(Number(e.target.value))}
                    className="w-16 bg-white border border-neutral-300 rounded p-1 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-500">hrs</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-neutral-600 block text-[10px]">Cancelación (Cláusula 17)</label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={cancellationDays}
                    onChange={(e) => setCancellationDays(Number(e.target.value))}
                    className="w-16 bg-white border border-neutral-300 rounded p-1 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-500">días hab.</span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="font-bold text-neutral-700 block mb-1 text-xs">Descripción del Servicio Autorizado</label>
              <textarea
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={2}
                placeholder="Servicio mayor, cambio de aceite sintético, bujías, balanceo y revisión de frenos..."
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs"
              />
            </div>

            <div className="mt-2">
              <label className="font-bold text-neutral-700 block mb-1 text-xs">Observaciones / Resguardo de Accesorios</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Se deja casco y juego de llaves en resguardo..."
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          {/* Section 5: Firma Digital de Conformidad */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-300">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase text-[#010101] tracking-wider flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-[#DD040F]" />
                <span>Firma Digital del Consumidor (Acepto de Conformidad)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickDigitalSignature}
                  className="text-[11px] font-bold text-neutral-700 hover:text-black bg-neutral-200 hover:bg-neutral-300 px-2.5 py-1 rounded transition"
                >
                  Firma Rápida Electrónica
                </button>
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="text-[11px] font-bold text-[#DD040F] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              </div>
            </div>

            <div className="border border-neutral-300 rounded-lg bg-white overflow-hidden flex flex-col items-center justify-center p-2">
              {consumerSignature && !isDrawing ? (
                <div className="h-24 flex items-center justify-center">
                  <img src={consumerSignature} alt="Firma registrada" className="max-h-20 object-contain" />
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={100}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="w-full max-w-[400px] h-[100px] border border-dashed border-neutral-300 rounded cursor-crosshair bg-white"
                />
              )}
              <span className="text-[10px] text-neutral-400 mt-1">Dibuja la firma del cliente arriba con el ratón o dedo</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#DD040F] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{existingContract ? 'Actualizar Contrato' : 'Guardar y Generar Contrato PROFECO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
