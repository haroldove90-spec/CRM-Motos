import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { CustomerComplaint, ServiceOrder } from '../../types/crm';
import {
  HeartHandshake,
  MessageCircle,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Send,
  Sparkles,
  Gift,
  Clock,
  ShieldCheck,
  Phone,
} from 'lucide-react';

interface ComplaintsAndCampaignsProps {
  mode: 'complaints' | 'campaigns';
  matchedOrder?: ServiceOrder;
}

export const ComplaintsAndCampaignsTab: React.FC<ComplaintsAndCampaignsProps> = ({
  mode,
  matchedOrder,
}) => {
  const {
    complaints,
    addComplaint,
    resolveComplaint,
    settings,
  } = useCRM();

  // Complaint state
  const [complaintType, setComplaintType] = useState<CustomerComplaint['type']>('queja_calidad');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  // Resolution modal (Admin / Reception)
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const handleRegisterComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc.trim()) return;

    addComplaint({
      customerId: matchedOrder?.customerId || 'cust-portal',
      customerName: matchedOrder?.customerName || 'Cliente del Portal',
      customerPhone: matchedOrder?.customerPhone || '442-000-0000',
      orderId: matchedOrder?.id,
      type: complaintType,
      description: complaintDesc.trim(),
      status: 'abierta',
    });

    setComplaintDesc('');
    setComplaintSubmitted(true);
    setTimeout(() => setComplaintSubmitted(false), 4000);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !resolutionText.trim()) return;

    resolveComplaint(resolvingId, resolutionText.trim());
    setResolvingId(null);
    setResolutionText('');
  };

  // Campaigns list
  const campaigns = [
    {
      id: 'cmp-1',
      title: 'Recordatorio de Próximo Servicio Preventivo',
      type: 'recordatorio',
      description: 'Envío automático al cumplir 3,000 km o 3 meses del último servicio.',
      template: `¡Hola ${matchedOrder?.customerName || 'amigo motero'}! Te saluda el equipo de ${settings.workshopName}. Notamos que tu ${matchedOrder?.motorcycleInfo?.brand || (matchedOrder as any)?.motorcycleBrand || 'moto'} está próxima a su mantenimiento preventivo. Agenda tu cita y recibe una revisión de frenos y lubricación de cadena de cortesía. 🏍️`,
    },
    {
      id: 'cmp-2',
      title: 'Agradecimiento Post-Entrega & Encuesta',
      type: 'agradecimiento',
      description: 'Mensaje 24 hrs después de que el cliente retira su motocicleta del taller.',
      template: `¡Hola ${matchedOrder?.customerName || 'estimado cliente'}! Gracias por confiar en ${settings.workshopName}. ¿Cómo sentiste tu moto en el camino? Tu satisfacción es nuestra prioridad. Tu servicio cuenta con 90 días de garantía oficial PROFECO.`,
    },
    {
      id: 'cmp-3',
      title: 'Oferta Especial del Mes: Afinación Mayor con 15% OFF',
      type: 'oferta',
      description: 'Campaña comercial para reactivación de clientes con más de 6 meses sin visita.',
      template: `¡Aprovecha este mes en ${settings.workshopName}! 15% de descuento en Afinación Mayor (incluye bujía NGK, aceite sintético y sincronización). Válido al mostrar este mensaje.`,
    },
    {
      id: 'cmp-4',
      title: 'Felicitación de Cumpleaños + Regalo en Taller',
      type: 'cumpleanos',
      description: 'Contacto personalizado en la fecha de cumpleaños del cliente registrado.',
      template: `¡Feliz Cumpleaños ${matchedOrder?.customerName || 'motero'}! 🎂 Todo el equipo de ${settings.workshopName} te desea excelentes rutas. Pasa al taller durante este mes y te regalamos el lavado y detallado de tu motocicleta.`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* --- MODO 1: QUEJAS & SATISFACCIÓN --- */}
      {mode === 'complaints' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
              Atención Inmediata & Garantía de Calidad
            </span>
            <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
              Registro y Seguimiento de Quejas & Inconformidades
            </h2>
            <p className="text-xs text-neutral-500">
              Nos comprometemos a resolver cualquier inquietud sobre la calidad de la reparación, tiempos de entrega o atención.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulario para registrar queja */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-[#010101] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#DD040F]" />
                <span>Registrar Nueva Inconformidad</span>
              </h3>

              {complaintSubmitted && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tu reporte fue recibido. La dirección del taller se comunicará contigo de inmediato.</span>
                </div>
              )}

              <form onSubmit={handleRegisterComplaint} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Motivo / Tipo de Queja *</label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                  >
                    <option value="queja_calidad">Calidad del Trabajo / Falla Persistente</option>
                    <option value="demora">Demora en la Fecha de Entrega</option>
                    <option value="costo">Inconformidad con el Costo / Presupuesto</option>
                    <option value="atencion">Atención o Trato del Personal</option>
                    <option value="garantia">Solicitud de Garantía PROFECO 90 días</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Describe lo sucedido con detalle *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Cuéntanos el motivo de tu queja para resolverlo..."
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#DD040F] text-white rounded-xl font-bold text-xs hover:bg-red-700 transition shadow-sm shadow-[#DD040F]/30"
                >
                  Enviar Queja a Dirección
                </button>
              </form>
            </div>

            {/* Historial de quejas y resoluciones */}
            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-sm text-[#010101] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Seguimiento de Quejas Registradas ({complaints.length})</span>
              </h3>

              {complaints.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No hay quejas registradas actualmente.
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border space-y-2 text-xs ${
                        c.status === 'resuelta'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#010101] capitalize">
                          {c.type.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'resuelta'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-neutral-700">{c.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-200/50">
                        <span>Reportó: {c.customerName} ({c.customerPhone})</span>
                        <span>Fecha: {c.date}</span>
                      </div>

                      {c.resolutionNotes && (
                        <div className="bg-white p-2.5 rounded-lg border border-emerald-300 text-[11px] text-emerald-900 mt-2">
                          <span className="font-bold block">Resolución del Taller:</span>
                          {c.resolutionNotes}
                        </div>
                      )}

                      {c.status !== 'resuelta' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              setResolvingId(c.id);
                              setResolutionText('');
                            }}
                            className="px-3 py-1 bg-neutral-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition"
                          >
                            Resolver Queja
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Resolver Queja */}
          {resolvingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-200">
                <div className="bg-[#010101] px-5 py-4 text-white flex items-center justify-between">
                  <h3 className="font-black text-sm">Dictaminar Solución a Queja</h3>
                  <button onClick={() => setResolvingId(null)} className="text-neutral-400 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleConfirmResolve} className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Solución ofrecida al cliente (descuento, garantía, cortesía) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Ej: Se acordó aplicar garantía de 90 días con mano de obra sin costo y cortesía de lubricación..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResolvingId(null)}
                      className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                    >
                      Guardar Resolución
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODO 2: CAMPAÑAS COMERCIALES & CONTACTO AUTOMÁTICO --- */}
      {mode === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
              CRM de Fidelización & Marketing
            </span>
            <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
              Campañas Comerciales & Contacto Automático
            </h2>
            <p className="text-xs text-neutral-500">
              Plantillas de WhatsApp para saludos, ofertas del mes, agradecimiento por visita y recordatorios preventivos para aumentar la recurrencia de tus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-neutral-100 text-neutral-700">
                      {camp.type}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-[#DD040F]" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#010101]">{camp.title}</h4>
                  <p className="text-[11px] text-neutral-500 mt-1">{camp.description}</p>

                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 mt-3 text-neutral-800 text-xs font-mono">
                    "{camp.template}"
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <a
                    href={`https://wa.me/${matchedOrder?.customerPhone?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(camp.template)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar WhatsApp al Cliente</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
