import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { CheckInWizard } from '../../components/CheckInWizard';
import { KanbanBoard } from '../../components/KanbanBoard';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { HojaDeServicioPDFModal } from '../../components/HojaDeServicioPDFModal';
import { EditOrderModal } from '../../components/EditOrderModal';
import { ProfecoContractPDFModal } from '../../components/ProfecoContractPDFModal';
import { ProfecoContractFormModal } from '../../components/ProfecoContractFormModal';
import { ServiceOrder, Customer, Motorcycle, ProfecoContract } from '../../types/crm';
import {
  Plus,
  Search,
  Mail,
  Receipt,
  MessageCircle,
  FileText,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Bike,
  User,
  Clock,
  Download,
  ShieldCheck,
  Printer,
  Sparkles,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';
import { TicketModal } from '../../components/TicketModal';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { CounterPOSAndCashCutTab } from './CounterPOSAndCashCutTab';
import { DeliveryAlertsTab } from './DeliveryAlertsTab';

interface ReceptionViewProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const ReceptionView: React.FC<ReceptionViewProps> = ({
  activeModule = 'checkin',
  onSelectModule,
}) => {
  const {
    customers,
    motorcycles,
    orders,
    profecoContracts,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateMotorcycle,
    deleteMotorcycle,
    deleteServiceOrder,
    deleteProfecoContract,
  } = useCRM();

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

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [pdfOrder, setPdfOrder] = useState<ServiceOrder | null>(null);
  const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null);
  const [ticketOrder, setTicketOrder] = useState<ServiceOrder | null>(null);
  const [whatsAppOrder, setWhatsAppOrder] = useState<ServiceOrder | null>(null);

  // PROFECO Modals & Filters
  const [viewingProfecoContract, setViewingProfecoContract] = useState<ProfecoContract | null>(null);
  const [editingProfecoContract, setEditingProfecoContract] = useState<ProfecoContract | null>(null);
  const [isCreatingProfecoContract, setIsCreatingProfecoContract] = useState(false);
  const [profecoSearch, setProfecoSearch] = useState('');
  const [profecoStatusFilter, setProfecoStatusFilter] = useState('all');

  // Search & Filter in Historial
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  // Customer search & add modal
  const [clientSearch, setClientSearch] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Motorcycle Edit modal
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(null);
  const [editMotoBrand, setEditMotoBrand] = useState('');
  const [editMotoModel, setEditMotoModel] = useState('');
  const [editMotoYear, setEditMotoYear] = useState(2024);
  const [editMotoPlate, setEditMotoPlate] = useState('');
  const [editMotoVin, setEditMotoVin] = useState('');
  const [editMotoMileage, setEditMotoMileage] = useState(0);

  // Filtered orders for Historial
  const filteredOrders = orders.filter((o) => {
    if (historyStatusFilter !== 'all' && o.status !== historyStatusFilter) return false;
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      (o.orderNumber && o.orderNumber.toString().includes(q)) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.motorcycleInfo.brand.toLowerCase().includes(q) ||
      o.motorcycleInfo.model.toLowerCase().includes(q) ||
      o.motorcycleInfo.plate.toLowerCase().includes(q)
    );
  });

  // Filtered PROFECO contracts
  const filteredProfecoContracts = profecoContracts.filter((c) => {
    if (profecoStatusFilter !== 'all' && c.status !== profecoStatusFilter) return false;
    if (!profecoSearch.trim()) return true;
    const q = profecoSearch.toLowerCase();
    return (
      c.contractNumber.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.customerPhone.includes(q) ||
      c.motorcycleBrand.toLowerCase().includes(q) ||
      c.motorcycleModel.toLowerCase().includes(q) ||
      c.motorcyclePlate.toLowerCase().includes(q) ||
      (c.orderId && c.orderId.toLowerCase().includes(q))
    );
  });

  const handleDeleteProfecoContract = (id: string, folio: string) => {
    if (window.confirm(`¿Confirmas que deseas eliminar el Contrato PROFECO con Folio ${folio}? Esta acción no se puede deshacer.`)) {
      deleteProfecoContract(id);
    }
  };

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

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    updateCustomer(editingCustomer.id, {
      fullName: newCustName,
      phone: newCustPhone,
      whatsapp: newCustPhone,
      email: newCustEmail,
      address: newCustAddress,
    });
    setEditingCustomer(null);
  };

  const handleUpdateMotorcycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMotorcycle) return;
    updateMotorcycle(editingMotorcycle.id, {
      brand: editMotoBrand,
      model: editMotoModel,
      year: Number(editMotoYear),
      plate: editMotoPlate.toUpperCase(),
      vin: editMotoVin.toUpperCase(),
      currentMileage: Number(editMotoMileage),
    });
    setEditingMotorcycle(null);
  };

  const handleDeleteOrder = (orderId: string, folio: string | number) => {
    if (window.confirm(`¿Estás seguro de eliminar el registro de la orden ${folio}? Esta acción no se puede deshacer.`)) {
      deleteServiceOrder(orderId);
    }
  };

  const handleDeleteCustomer = (customerId: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${name} y sus motocicletas vinculadas?`)) {
      deleteCustomer(customerId);
    }
  };

  const handleDeleteMotorcycle = (motoId: string, model: string, plate: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la motocicleta ${model} (${plate})?`)) {
      deleteMotorcycle(motoId);
    }
  };

  return (
    <div className="space-y-6">

      {/* SUBTAB POS & CORTE DE CAJA */}
      {subTab === 'pos' && <CounterPOSAndCashCutTab />}

      {/* SUBTAB ENTREGAS & ALERTAS */}
      {subTab === 'alerts' && (
        <DeliveryAlertsTab
          onViewOrder={(order) => setSelectedOrder(order)}
          onContactClient={(order) => setWhatsAppOrder(order)}
        />
      )}

      {/* SUBTAB 1: NUEVA RECEPCIÓN (CHECKIN CON HOJA OFICIAL) */}
      {subTab === 'checkin' && (
        <CheckInWizard
          onOrderCreated={(order) => {
            setPdfOrder(order);
          }}
        />
      )}

      {/* SUBTAB 2: HISTORIAL DE REGISTROS / CHECKIN (NUEVO MÓDULO SOLICITADO) */}
      {subTab === 'historial' && (
        <div className="space-y-4">
          {/* Header & Filters */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-300 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-base text-[#010101]">
                Historial de Registros & Hojas de Servicio (Check-in)
              </h3>
              <p className="text-xs text-neutral-500">
                Consulta, visualiza en formato oficial, edita datos, elimina registros o exporta en PDF con un clic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative w-64 sm:w-72">
                <input
                  type="text"
                  placeholder="Buscar folio, cliente, placa o modelo..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full px-3 py-2 pl-9 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>

              {/* Status select */}
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="p-2 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs font-bold text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
              >
                <option value="all">Todos los Estados</option>
                <option value="pendiente">1. Pendiente de Asignación</option>
                <option value="en_diagnostico">2. En Diagnóstico</option>
                <option value="esperando_aprobacion">3. Esperando Aprobación</option>
                <option value="en_reparacion">4. En Reparación</option>
                <option value="pruebas_calidad">5. Pruebas y Calidad</option>
                <option value="listo_entrega">6. Listo para Entrega</option>
                <option value="entregado">7. Finalizado y Entregado</option>
              </select>

              <button
                onClick={() => setSubTab('checkin')}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Check-in</span>
              </button>
            </div>
          </div>

          {/* Historial Table */}
          <div className="bg-white rounded-2xl border border-neutral-300 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#010101] text-white font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3 text-center w-24">Folio OS</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Motocicleta</th>
                    <th className="p-3 text-center">KM / Gas</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center w-52">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((ord) => {
                      const dateObj = new Date(ord.createdAt);
                      const formattedDate = dateObj.toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });

                      return (
                        <tr key={ord.id} className="hover:bg-neutral-50 transition">
                          {/* Folio */}
                          <td className="p-3 text-center font-mono font-black text-sm text-[#DD040F]">
                            #{ord.orderNumber || ord.id.replace(/[^0-9]/g, '')}
                          </td>

                          {/* Fecha */}
                          <td className="p-3 text-neutral-600 font-mono text-[11px]">
                            {formattedDate}
                          </td>

                          {/* Cliente */}
                          <td className="p-3">
                            <strong className="text-[#010101] block">{ord.customerName}</strong>
                            <span className="text-[10px] text-neutral-500 font-mono">{ord.customerPhone}</span>
                          </td>

                          {/* Motocicleta */}
                          <td className="p-3">
                            <span className="font-bold text-[#010101] block">
                              {ord.motorcycleInfo.brand} {ord.motorcycleInfo.model} ({ord.motorcycleInfo.year})
                            </span>
                            <span className="font-mono text-[10px] text-neutral-500">
                              Placa: <strong className="text-[#010101]">{ord.motorcycleInfo.plate}</strong>
                            </span>
                          </td>

                          {/* KM / Gas */}
                          <td className="p-3 text-center font-mono text-[11px]">
                            <div>{ord.checkIn.mileage.toLocaleString()} km</div>
                            <span className="text-[10px] text-[#DD040F] font-bold">
                              Gas: {ord.checkIn.fuelLevel}%
                            </span>
                          </td>

                          {/* Total */}
                          <td className="p-3 text-right font-mono font-black text-[#010101]">
                            ${ord.total.toLocaleString()}
                          </td>

                          {/* Estado */}
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#010101] text-white uppercase">
                              {ord.status.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Acciones: Ver, Hoja PDF, Editar, Borrar */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Exportar / Ver Hoja de Servicio PDF Oficial */}
                              <button
                                onClick={() => setPdfOrder(ord)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-[#DD040F] hover:bg-[#b5030c] text-white rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
                                title="Ver / Descargar Hoja de Servicio Oficial en PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>

                              {/* Ver detalle general */}
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="p-1.5 bg-[#010101] text-white rounded-lg text-xs hover:bg-neutral-800 transition cursor-pointer"
                                title="Ver diagnóstico, tiempos y cobro"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Editar registro */}
                              <button
                                onClick={() => setEditOrder(ord)}
                                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#010101] rounded-lg text-xs transition cursor-pointer"
                                title="Editar datos del registro"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Borrar registro */}
                              <button
                                onClick={() => handleDeleteOrder(ord.id, ord.orderNumber || ord.id)}
                                className="p-1.5 bg-neutral-100 hover:bg-[#DD040F]/10 text-neutral-500 hover:text-[#DD040F] rounded-lg text-xs transition cursor-pointer"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-neutral-400">
                        No se encontraron registros de Check-in con el filtro seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: CONTRATOS PROFECO (NUEVO MÓDULO SOLICITADO) */}
      {subTab === 'profeco' && (
        <div className="space-y-4">
          {/* Header & Actions */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-300 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#DD040F]" />
                <h3 className="font-black text-base text-[#010101]">
                  Contratos de Adhesión PROFECO (NOM-174-SCFI-2007)
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Genera, edita, firma y exporta en formato legal tamaño carta (1 hoja) con las 20 cláusulas y declaraciones oficiales.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative w-60 sm:w-72">
                <input
                  type="text"
                  placeholder="Buscar por cliente, folio, placa, VIN..."
                  value={profecoSearch}
                  onChange={(e) => setProfecoSearch(e.target.value)}
                  className="w-full px-3 py-1.5 pl-8 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-[#010101] placeholder:text-neutral-400 focus:outline-hidden focus:border-[#DD040F]"
                />
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
              </div>

              {/* Status filter */}
              <select
                value={profecoStatusFilter}
                onChange={(e) => setProfecoStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-[#010101] focus:outline-hidden focus:border-[#DD040F]"
              >
                <option value="all">Todos los estatus</option>
                <option value="firmado">Firmados</option>
                <option value="borrador">Borradores</option>
                <option value="cancelado">Cancelados</option>
              </select>

              {/* Create new contract button */}
              <button
                onClick={() => {
                  setEditingProfecoContract(null);
                  setIsCreatingProfecoContract(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Contrato PROFECO</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Total Contratos</span>
              <p className="text-xl font-black text-[#010101] font-mono mt-0.5">{profecoContracts.length}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Firmados de Conformidad</span>
              <p className="text-xl font-black text-green-700 font-mono mt-0.5">
                {profecoContracts.filter((c) => c.status === 'firmado').length}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Garantía Legal Vigente</span>
              <p className="text-xl font-black text-[#DD040F] font-mono mt-0.5">90 Días</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Formato Aprobado</span>
              <p className="text-xs font-black text-[#010101] mt-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>Carta 1 Hoja (PROFECO)</span>
              </p>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                    <th className="py-3 px-4">Folio / Reg. PROFECO</th>
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Consumidor (Cliente)</th>
                    <th className="py-3 px-3">Motocicleta</th>
                    <th className="py-3 px-3">Presupuesto & Anticipo</th>
                    <th className="py-3 px-3">Estatus</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {filteredProfecoContracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#DD040F]" />
                        <p className="text-sm font-bold text-neutral-600">No se encontraron contratos PROFECO</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          Genera un nuevo contrato o pre-llénalo directamente desde una orden activa de servicio.
                        </p>
                        <button
                          onClick={() => {
                            setEditingProfecoContract(null);
                            setIsCreatingProfecoContract(true);
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DD040F] text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Crear Primer Contrato</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProfecoContracts.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50/70 transition">
                        {/* Folio */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#DD040F] shrink-0" />
                            <div>
                              <span className="font-mono font-black text-[#010101] text-xs block">
                                {c.contractNumber}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                Reg: {c.profecoRegistrationNumber}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="py-3 px-3 text-neutral-700 text-xs whitespace-nowrap">
                          {c.date}
                        </td>

                        {/* Consumidor */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#010101]">{c.customerName}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{c.customerPhone}</div>
                        </td>

                        {/* Motocicleta */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#010101]">
                            {c.motorcycleBrand} {c.motorcycleModel} ({c.motorcycleYear})
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            Placa: <strong className="text-neutral-700">{c.motorcyclePlate || 'S/P'}</strong> • {c.motorcycleColor || 'N/E'}
                          </div>
                        </td>

                        {/* Presupuesto */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-[#010101]">
                            ${c.agreedBudget.toLocaleString('es-MX')}
                          </div>
                          <div className="text-[10px] text-green-700 font-mono">
                            Anticipo: ${c.deposit.toLocaleString('es-MX')}
                          </div>
                        </td>

                        {/* Estatus */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              c.status === 'firmado'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : c.status === 'borrador'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Ver / Imprimir Carta */}
                            <button
                              onClick={() => setViewingProfecoContract(c)}
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-[#010101] hover:text-white text-neutral-700 transition"
                              title="Ver Contrato Carta e Imprimir"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Descargar PDF Carta */}
                            <button
                              onClick={() => setViewingProfecoContract(c)}
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-[#DD040F] hover:text-white text-[#DD040F] transition"
                              title="Descargar PDF en Hoja Tamaño Carta"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Editar Contrato */}
                            <button
                              onClick={() => setEditingProfecoContract(c)}
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
                              title="Editar datos del contrato"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Borrar */}
                            <button
                              onClick={() => handleDeleteProfecoContract(c.id, c.contractNumber)}
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-100 hover:text-red-700 text-neutral-400 transition"
                              title="Eliminar contrato"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: KANBAN BOARD */}
      {subTab === 'kanban' && (
        <KanbanBoard onSelectOrder={(order) => setSelectedOrder(order)} />
      )}

      {/* SUBTAB 4: CUSTOMERS CRM (CON VER, EDITAR, BORRAR) */}
      {subTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full px-3.5 py-2 pl-9 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm text-[#010101] placeholder:text-neutral-400 focus:outline-hidden focus:border-[#DD040F]"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            </div>

            <button
              onClick={() => {
                setEditingCustomer(null);
                setNewCustName('');
                setNewCustPhone('');
                setNewCustEmail('');
                setNewCustAddress('');
                setShowAddCustomer(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Cliente</span>
            </button>
          </div>

          {/* Add or Edit Customer Form */}
          {(showAddCustomer || editingCustomer) && (
            <form onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer} className="p-5 rounded-2xl bg-white border border-neutral-300 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-[#010101]">
                {editingCustomer ? `Editar Cliente: ${editingCustomer.fullName}` : 'Registro Rápido de Cliente'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(false);
                    setEditingCustomer(null);
                  }}
                  className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#010101] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-neutral-800"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Guardar Cliente'}
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
                <div key={c.id} className="bg-white p-4 rounded-2xl border border-neutral-300 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#010101]">{c.fullName}</h4>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[#010101] text-[10px] font-bold">
                        {custMotos.length} Moto(s)
                      </span>
                      <button
                        onClick={() => {
                          setEditingCustomer(c);
                          setNewCustName(c.fullName);
                          setNewCustPhone(c.phone);
                          setNewCustEmail(c.email || '');
                          setNewCustAddress(c.address || '');
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-[#010101]"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(c.id, c.fullName)}
                        className="p-1 rounded text-neutral-400 hover:text-[#DD040F]"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

                  {/* Orders stats & action */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                    <span>{custOrders.length} Órdenes registradas</span>
                    <button
                      onClick={() => setSubTab('checkin')}
                      className="font-bold text-[#DD040F] hover:underline"
                    >
                      + Nueva Hoja OS
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 5: MOTORCYCLES (CON EDITAR Y BORRAR) */}
      {subTab === 'motorcycles' && (
        <div className="space-y-4">
          {editingMotorcycle && (
            <form onSubmit={handleUpdateMotorcycle} className="p-5 rounded-2xl bg-white border border-neutral-300 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-[#010101]">
                Editar Motocicleta: {editingMotorcycle.brand} {editingMotorcycle.model}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={editMotoBrand}
                    onChange={(e) => setEditMotoBrand(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Modelo</label>
                  <input
                    type="text"
                    required
                    value={editMotoModel}
                    onChange={(e) => setEditMotoModel(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Año</label>
                  <input
                    type="number"
                    value={editMotoYear}
                    onChange={(e) => setEditMotoYear(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Placa</label>
                  <input
                    type="text"
                    value={editMotoPlate}
                    onChange={(e) => setEditMotoPlate(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Serie (VIN)</label>
                  <input
                    type="text"
                    value={editMotoVin}
                    onChange={(e) => setEditMotoVin(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Kilometraje</label>
                  <input
                    type="number"
                    value={editMotoMileage}
                    onChange={(e) => setEditMotoMileage(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMotorcycle(null)}
                  className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#010101] text-white rounded-lg text-xs font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {motorcycles.map((m) => {
              const owner = customers.find((c) => c.id === m.customerId);
              const mOrders = orders.filter((o) => o.motorcycleId === m.id);
              return (
                <div key={m.id} className="bg-white p-4 rounded-2xl border border-neutral-300 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#DD040F] block">
                        {m.brand}
                      </span>
                      <h4 className="font-black text-base text-[#010101]">{m.model}</h4>
                      <p className="text-xs text-neutral-500 font-mono">Año: {m.year} • {m.displacement}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2.5 py-1 bg-[#010101] text-white font-mono font-bold text-xs rounded-lg">
                        {m.plate}
                      </span>
                      <button
                        onClick={() => {
                          setEditingMotorcycle(m);
                          setEditMotoBrand(m.brand);
                          setEditMotoModel(m.model);
                          setEditMotoYear(m.year);
                          setEditMotoPlate(m.plate);
                          setEditMotoVin(m.vin);
                          setEditMotoMileage(m.currentMileage);
                        }}
                        className="p-1 text-neutral-400 hover:text-[#010101]"
                        title="Editar moto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMotorcycle(m.id, m.model, m.plate)}
                        className="p-1 text-neutral-400 hover:text-[#DD040F]"
                        title="Eliminar moto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
        </div>
      )}

      {/* SUBTAB 6: BILLING & COTIZACIONES (CON VER, HOJA PDF, COBRAR, EDITAR, BORRAR) */}
      {subTab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-300 shadow-2xs flex flex-wrap items-center justify-between gap-4">
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

          <div className="bg-white rounded-2xl border border-neutral-300 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#010101] text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Folio OS</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Motocicleta</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Abonado</th>
                  <th className="p-3 text-right">Saldo Pendiente</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center w-52">Acciones</th>
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
                          {/* Cobrar */}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-2 py-1 bg-[#010101] text-white rounded-lg text-[10px] font-bold hover:bg-neutral-800 transition cursor-pointer"
                            title="Gestionar orden y cobrar"
                          >
                            Cobrar
                          </button>
                          {/* Hoja Oficial PDF */}
                          <button
                            onClick={() => setPdfOrder(ord)}
                            className="px-2 py-1 bg-[#DD040F] text-white rounded-lg text-[10px] font-bold hover:bg-[#b5030c] transition cursor-pointer"
                            title="Hoja de Servicio Oficial en PDF"
                          >
                            PDF
                          </button>
                          {/* Ticket */}
                          <button
                            onClick={() => setTicketOrder(ord)}
                            className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#010101] transition"
                            title="Imprimir ticket térmico"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          {/* WhatsApp */}
                          <button
                            onClick={() => setWhatsAppOrder(ord)}
                            className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#DD040F] transition"
                            title="Enviar por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          {/* Editar */}
                          <button
                            onClick={() => setEditOrder(ord)}
                            className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
                            title="Editar orden"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Borrar */}
                          <button
                            onClick={() => handleDeleteOrder(ord.id, ord.orderNumber || ord.id)}
                            className="p-1 rounded-lg bg-neutral-100 hover:text-[#DD040F] text-neutral-400 transition"
                            title="Eliminar orden"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODALS */}
      {/* 1. Official Hoja de Servicio PDF Modal */}
      {pdfOrder && (
        <HojaDeServicioPDFModal
          order={pdfOrder}
          onClose={() => setPdfOrder(null)}
        />
      )}

      {/* 2. Order Detail / Checkout Modal */}
      {selectedOrder && (
        <OrderDetailModal
          orderId={selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* 3. Edit Order Modal */}
      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
        />
      )}

      {/* 4. Ticket Modal */}
      {ticketOrder && (
        <TicketModal order={ticketOrder} onClose={() => setTicketOrder(null)} />
      )}

      {/* 5. WhatsApp Modal */}
      {whatsAppOrder && (
        <WhatsAppModal
          order={whatsAppOrder}
          onClose={() => setWhatsAppOrder(null)}
          defaultType={whatsAppOrder.status === 'listo_entrega' ? 'ready' : whatsAppOrder.status === 'esperando_aprobacion' ? 'quote' : 'checkin'}
        />
      )}

      {/* 6. PROFECO Legal Contract Letter PDF Modal */}
      {viewingProfecoContract && (
        <ProfecoContractPDFModal
          contract={viewingProfecoContract}
          onClose={() => setViewingProfecoContract(null)}
        />
      )}

      {/* 7. PROFECO Contract Form Modal (Create or Edit) */}
      {(isCreatingProfecoContract || editingProfecoContract) && (
        <ProfecoContractFormModal
          existingContract={editingProfecoContract}
          onClose={() => {
            setIsCreatingProfecoContract(false);
            setEditingProfecoContract(null);
          }}
          onSaved={(savedContract) => {
            setIsCreatingProfecoContract(false);
            setEditingProfecoContract(null);
            setViewingProfecoContract(savedContract);
          }}
        />
      )}
    </div>
  );
};
