import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { CheckInWizard } from '../../components/CheckInWizard';
import { KanbanBoard } from '../../components/KanbanBoard';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { ServiceOrder } from '../../types/crm';
import {
  Plus,
  Search,
  Mail,
  Receipt,
  MessageCircle,
} from 'lucide-react';
import { TicketModal } from '../../components/TicketModal';
import { WhatsAppModal } from '../../components/WhatsAppModal';

interface ReceptionViewProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const ReceptionView: React.FC<ReceptionViewProps> = ({
  activeModule = 'kanban',
  onSelectModule,
}) => {
  const { customers, motorcycles, orders, addCustomer } = useCRM();
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

  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [ticketOrder, setTicketOrder] = useState<ServiceOrder | null>(null);
  const [whatsAppOrder, setWhatsAppOrder] = useState<ServiceOrder | null>(null);

  // Customer search & add modal
  const [clientSearch, setClientSearch] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    addCustomer({
      fullName: newCustName,
      phone: newCustPhone,
      whatsapp: newCustPhone,
      email: newCustEmail,
      address: newCustAddress,
    });
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustAddress('');
    setShowAddCustomer(false);
  };

  return (
    <div className="space-y-6">
      {/* Submodule Bar */}
      <div className="flex border-b border-neutral-200 bg-white px-4 rounded-xl gap-2 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => handleTabChange('kanban')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'kanban' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Órdenes en Taller (Kanban)
        </button>
        <button
          onClick={() => handleTabChange('checkin')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'checkin' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Nueva Recepción (Check-in)
        </button>
        <button
          onClick={() => handleTabChange('customers')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'customers' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Directorio de Clientes ({customers.length})
        </button>
        <button
          onClick={() => handleTabChange('motorcycles')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'motorcycles' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Parque de Motocicletas ({motorcycles.length})
        </button>
        <button
          onClick={() => handleTabChange('billing')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'billing' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Cotización & Cobro
        </button>
      </div>

      {/* SUBTAB: KANBAN */}
      {subTab === 'kanban' && (
        <KanbanBoard onSelectOrder={(order) => setSelectedOrder(order)} />
      )}

      {/* SUBTAB: CHECK-IN */}
      {subTab === 'checkin' && (
        <CheckInWizard
          onOrderCreated={(order) => {
            setSelectedOrder(order);
          }}
        />
      )}

      {/* SUBTAB: CUSTOMERS CRM */}
      {subTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full px-3.5 py-2 pl-9 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] placeholder:text-neutral-400 focus:outline-hidden focus:border-[#DD040F]"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>

            <button
              onClick={() => setShowAddCustomer(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Cliente</span>
            </button>
          </div>

          {showAddCustomer && (
            <form onSubmit={handleCreateCustomer} className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-[#010101]">Registro Rápido de Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#010101] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-neutral-800"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          )}

          {/* Customers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCustomers.map((c) => {
              const custMotos = motorcycles.filter((m) => m.customerId === c.id);
              const custOrders = orders.filter((o) => o.customerId === c.id);
              return (
                <div key={c.id} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#010101]">{c.fullName}</h4>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">{c.phone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[#010101] text-[10px] font-bold">
                      {custMotos.length} Moto(s)
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-neutral-600">
                    {c.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.address && (
                      <p className="text-[11px] text-neutral-400 truncate">{c.address}</p>
                    )}
                  </div>

                  {/* Motorcycles tag */}
                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap gap-1.5">
                    {custMotos.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 bg-[#010101] text-white rounded text-[10px] font-bold font-mono"
                      >
                        {m.brand} {m.model} ({m.plate})
                      </span>
                    ))}
                  </div>

                  {/* Orders stats */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                    <span>{custOrders.length} Órdenes en historial</span>
                    <button
                      onClick={() => setSubTab('checkin')}
                      className="font-bold text-[#DD040F] hover:underline"
                    >
                      + Nueva OS
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB: MOTORCYCLES */}
      {subTab === 'motorcycles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {motorcycles.map((m) => {
            const owner = customers.find((c) => c.id === m.customerId);
            const mOrders = orders.filter((o) => o.motorcycleId === m.id);
            return (
              <div key={m.id} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#DD040F] block">
                      {m.brand}
                    </span>
                    <h4 className="font-black text-base text-[#010101]">{m.model}</h4>
                    <p className="text-xs text-neutral-500 font-mono">Año: {m.year} • {m.displacement}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-[#010101] text-white font-mono font-bold text-xs rounded-lg">
                    {m.plate}
                  </span>
                </div>

                <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-neutral-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Propietario:</span>
                    <strong className="text-[#010101]">{owner?.fullName || 'Registrado'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Kilometraje:</span>
                    <strong className="text-[#010101] font-mono">{m.currentMileage.toLocaleString()} km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">VIN:</span>
                    <span className="text-neutral-600 font-mono text-[10px]">{m.vin}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                  <span className="text-neutral-500 font-medium">{mOrders.length} servicios realizados</span>
                  <button
                    onClick={() => setSubTab('checkin')}
                    className="px-2.5 py-1 bg-[#DD040F] text-white text-[11px] font-bold rounded-lg hover:bg-[#b5030c] transition"
                  >
                    Ingresar a Taller
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB: BILLING & COTIZACIONES */}
      {subTab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-[#010101]">Control de Cotizaciones & Facturación</h3>
              <p className="text-xs text-neutral-500">Gestión de presupuestos, cobro de anticipos, liquidaciones e impresión de tickets.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200 text-xs text-right">
                <span className="text-[10px] uppercase font-bold text-[#DD040F] block">Saldos por Cobrar</span>
                <span className="font-black text-sm font-mono text-[#010101]">
                  ${orders.reduce((acc, o) => acc + Math.max(0, o.total - (o.deposit || 0)), 0).toLocaleString()} MXN
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] border-b border-neutral-200 font-bold text-neutral-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Folio OS</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Motocicleta</th>
                  <th className="p-3 text-right">Total Presupuestado</th>
                  <th className="p-3 text-right">Abonado / Anticipo</th>
                  <th className="p-3 text-right">Saldo Pendiente</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((ord) => {
                  const balance = Math.max(0, ord.total - (ord.deposit || 0));
                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-mono font-bold text-[#010101]">{ord.id}</td>
                      <td className="p-3">
                        <strong className="text-[#010101] block">{ord.customerName}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">{ord.customerPhone}</span>
                      </td>
                      <td className="p-3 text-neutral-600 font-medium">
                        {ord.motorcycleInfo.brand} {ord.motorcycleInfo.model}
                        <span className="block font-mono text-[10px] text-neutral-400">{ord.motorcycleInfo.plate}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#010101]">${ord.total.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-[#010101]">${(ord.deposit || 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        {balance > 0 ? (
                          <span className="text-[#DD040F]">${balance.toLocaleString()}</span>
                        ) : (
                          <span className="text-neutral-500">Liquidado</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#010101] text-white uppercase">
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-2 py-1 bg-[#010101] text-white rounded-lg text-[10px] font-bold hover:bg-neutral-800 transition"
                            title="Gestionar orden y cobrar"
                          >
                            Cobrar
                          </button>
                          <button
                            onClick={() => setTicketOrder(ord)}
                            className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#010101] transition"
                            title="Imprimir ticket"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setWhatsAppOrder(ord)}
                            className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#DD040F] transition"
                            title="Enviar por WhatsApp"
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
      )}

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal
          orderId={selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {ticketOrder && (
        <TicketModal order={ticketOrder} onClose={() => setTicketOrder(null)} />
      )}

      {whatsAppOrder && (
        <WhatsAppModal
          order={whatsAppOrder}
          onClose={() => setWhatsAppOrder(null)}
          defaultType={whatsAppOrder.status === 'listo_entrega' ? 'ready' : whatsAppOrder.status === 'esperando_aprobacion' ? 'quote' : 'checkin'}
        />
      )}
    </div>
  );
};
