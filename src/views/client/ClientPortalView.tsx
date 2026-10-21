import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { ServiceOrder } from '../../types/crm';
import {
  Bike,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Receipt,
  MessageCircle,
  Phone,
  Star,
  ShieldCheck,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface ClientPortalViewProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  activeModule = 'status',
  onSelectModule,
}) => {
  const { orders, motorcycles, settings, toggleItemApproval, submitSatisfactionRating } = useCRM();
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

  // Search by plate, order ID or phone
  const [searchTerm, setSearchTerm] = useState('84K-DF-3'); // Pre-fill with a sample bike for instant demo
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Search logic
  const matchedOrder = orders.find((o) => {
    if (!searchTerm.trim()) return false;
    const q = searchTerm.trim().toLowerCase();
    return (
      o.id.toLowerCase() === q ||
      o.motorcycleInfo.plate.toLowerCase() === q ||
      o.customerPhone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''))
    );
  }) || orders[0]; // fallback to first order so portal is never blank

  // All orders for this motorcycle/customer for the digital maintenance carnet
  const carnetOrders = matchedOrder
    ? orders.filter(
        (o) =>
          o.motorcycleInfo.plate.toLowerCase() === matchedOrder.motorcycleInfo.plate.toLowerCase() ||
          o.customerId === matchedOrder.customerId
      )
    : [];

  const STEPS: { status: ServiceOrder['status']; label: string; desc: string }[] = [
    { status: 'pendiente', label: '1. Check-in', desc: 'Ingreso al taller' },
    { status: 'en_diagnostico', label: '2. Diagnóstico', desc: 'Revisión mecánica' },
    { status: 'esperando_aprobacion', label: '3. Presupuesto', desc: 'Validación de costos' },
    { status: 'en_reparacion', label: '4. En Reparación', desc: 'Manos a la obra' },
    { status: 'pruebas_calidad', label: '5. Calidad & Lavado', desc: 'Prueba de ruta' },
    { status: 'listo_entrega', label: '6. ¡Listo para Entrega!', desc: 'Pasa a recoger tu moto' },
  ];

  const getStepIndex = (status: ServiceOrder['status']) => {
    if (status === 'entregado') return 6;
    if (status === 'listo_entrega') return 5;
    if (status === 'pruebas_calidad') return 4;
    if (status === 'en_reparacion' || status === 'esperando_refaccion') return 3;
    if (status === 'esperando_aprobacion') return 2;
    if (status === 'en_diagnostico') return 1;
    return 0;
  };

  const currentStepIdx = matchedOrder ? getStepIndex(matchedOrder.status) : 0;

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedOrder) return;
    submitSatisfactionRating(matchedOrder.id, ratingStars, ratingComment);
    setRatingSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Portal Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-orange-500 font-extrabold text-xs uppercase tracking-widest block">
              Portal del Cliente • Transparencia Total
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              Seguimiento de tu Motocicleta en Vivo
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {settings.workshopName} • Consulta avance, autoriza cotizaciones y accede a tu carnet de mantenimiento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contactar Asesor</span>
            </a>
          </div>
        </div>

        {/* Quick Search Plate Input */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Ingresa tu placa (ej: 84K-DF-3) o N° de Orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs sm:text-sm font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>
      </div>

      {/* Client Subtabs Bar */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl gap-2 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => handleTabChange('status')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'status' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Estatus en Vivo
        </button>
        <button
          onClick={() => handleTabChange('quote')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'quote' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Aprobar Cotización
        </button>
        <button
          onClick={() => handleTabChange('carnet')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'carnet' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Carnet de Servicio
        </button>
        <button
          onClick={() => handleTabChange('contact')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'contact' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Contacto & Taller
        </button>
      </div>

      {matchedOrder ? (
        <div className="space-y-6">
          {/* Motorcycle & Order Summary Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {matchedOrder.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {matchedOrder.motorcycleInfo.brand} {matchedOrder.motorcycleInfo.model}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Placa: <strong className="text-slate-900">{matchedOrder.motorcycleInfo.plate}</strong> • Odómetro: {matchedOrder.checkIn.mileage.toLocaleString()} km
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Actual</span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-200 uppercase mt-0.5">
                {matchedOrder.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
              Progreso del Servicio en Taller
            </h4>

            {/* Stepper Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {STEPS.map((step, idx) => {
                const isCompleted = currentStepIdx > idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div
                    key={step.status}
                    className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                      isCompleted
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                        : isCurrent
                        ? 'bg-orange-50 border-orange-400 shadow-xs ring-2 ring-orange-500/20'
                        : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-orange-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className="font-extrabold text-xs text-slate-900">{step.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Quote Approval Section (Fase 3) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Desglose del Presupuesto & Aprobación en Línea
                </h4>
                <p className="text-xs text-slate-500">
                  Puedes autorizar o rechazar trabajos y refacciones desde tu teléfono.
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block font-sans">Total Aprobado</span>
                <span className="text-lg font-black text-orange-600">${matchedOrder.total.toLocaleString()} MXN</span>
              </div>
            </div>

            <div className="space-y-2">
              {matchedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition ${
                    item.approvedByClient
                      ? 'bg-white border-slate-200'
                      : 'bg-red-50/40 border-red-200 text-slate-400'
                  }`}
                >
                  <div className="space-y-0.5 max-w-md">
                    <p className={`font-bold text-xs ${item.approvedByClient ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="capitalize">{item.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Cant: {item.quantity}</span>
                      <span>•</span>
                      <span className="font-mono">${item.unitPrice} c/u</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      ${item.totalPrice.toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleItemApproval(matchedOrder.id, item.id, !item.approvedByClient)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        item.approvedByClient
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {item.approvedByClient ? '✓ Autorizado' : '✕ Rechazado'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Balance */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500">Anticipos abonados: </span>
                <strong className="font-mono text-emerald-700">${(matchedOrder.deposit || 0).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-500">Saldo a liquidar al retirar: </span>
                <strong className="font-mono text-slate-900 font-bold text-sm">
                  ${Math.max(0, matchedOrder.total - (matchedOrder.deposit || 0)).toLocaleString()} MXN
                </strong>
              </div>
            </div>
          </div>

          {/* Digital Maintenance Book (Carnet Digital) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
              <BookOpen className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Carnet de Mantenimiento Digital
                </h4>
                <p className="text-xs text-slate-500">
                  Historial garantizado de servicios para tu moto {matchedOrder.motorcycleInfo.model}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {carnetOrders.map((ord) => (
                <div key={ord.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{ord.id}</span>
                    <span className="text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">"{ord.reasonForVisit}"</p>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    <span>KM: {ord.checkIn.mileage.toLocaleString()} km</span>
                    <span className="font-mono font-bold text-slate-900">${ord.total.toLocaleString()} MXN</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Satisfaction Rating Section (Fase 7) */}
          {matchedOrder.status === 'entregado' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Fase 7: Encuesta de Satisfacción Post-Venta
                  </h4>
                  <p className="text-xs text-slate-500">¿Cómo has sentido tu motocicleta?</p>
                </div>
              </div>

              {ratingSubmitted || matchedOrder.satisfactionRating ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          s <= (matchedOrder.satisfactionRating?.stars || ratingStars)
                            ? 'fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="font-bold text-xs text-emerald-900">¡Muchas gracias por calificar nuestro servicio!</p>
                  <p className="text-[11px] text-emerald-700">Tu retroalimentación nos ayuda a ser el mejor taller de motos.</p>
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingStars(star)}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= ratingStars ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{ratingStars} de 5 Estrellas</span>
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Escribe tus comentarios sobre el servicio recibido..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                  >
                    Enviar Calificación
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Contact & Workshop Info Section */}
          {subTab === 'contact' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3 border-slate-100">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Información del Taller & Políticas de Garantía
                  </h4>
                  <p className="text-xs text-slate-500">{settings.workshopName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block">Canales de Contacto Directo:</span>
                  <p className="text-slate-600"><strong>Dirección:</strong> {settings.address}</p>
                  <p className="text-slate-600"><strong>Teléfono:</strong> {settings.phone}</p>
                  <p className="text-slate-600"><strong>WhatsApp Oficial:</strong> {settings.whatsapp}</p>
                  <p className="text-slate-600"><strong>Email:</strong> {settings.email}</p>
                  <div className="pt-2 flex gap-2">
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Enviar WhatsApp
                    </a>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block">Términos de Garantía:</span>
                  <p className="text-slate-600 leading-relaxed">{settings.warrantyPolicy}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    Presenta tu comprobante digital o físico en cualquier momento para hacer válida tu garantía.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-400">
          <Bike className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-700 text-sm">No se encontró una orden activa con esa búsqueda</p>
          <p className="text-xs text-slate-400 mt-1">Verifica tu número de placa o comunícate con recepción.</p>
        </div>
      )}
    </div>
  );
};
