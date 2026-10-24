import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { StaffUser, ServiceOrder, ProfecoContract } from '../../types/crm';
import {
  Wrench,
  DollarSign,
  Bike,
  TrendingUp,
  Plus,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  Percent,
  Eye,
  Edit2,
  FileText,
  Download,
  X,
  Printer,
  Calendar,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { KanbanBoard } from '../../components/KanbanBoard';
import { HojaDeServicioPDFModal } from '../../components/HojaDeServicioPDFModal';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { EditOrderModal } from '../../components/EditOrderModal';
import { ProfecoContractPDFModal } from '../../components/ProfecoContractPDFModal';
import { ProfecoContractFormModal } from '../../components/ProfecoContractFormModal';

interface AdminDashboardProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeModule = 'dashboard',
  onSelectModule,
}) => {
  const {
    kpis,
    orders,
    staff,
    settings,
    profecoContracts,
    addStaff,
    updateStaff,
    deleteStaff,
    deleteServiceOrder,
    deleteProfecoContract,
    updateSettings,
    testSupabaseConnection,
    clearSupabaseRecords,
    clearAllSampleData,
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

  // New staff form state
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffUser['role']>('mechanic');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffCommission, setNewStaffCommission] = useState(15);
  const [newStaffSpecialty, setNewStaffSpecialty] = useState('');

  // Settings form state
  const [workshopName, setWorkshopName] = useState(settings.workshopName);
  const [legalName, setLegalName] = useState(settings.legalName);
  const [taxId, setTaxId] = useState(settings.taxId);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [laborRate, setLaborRate] = useState(settings.standardLaborHourRate);
  const [warranty, setWarranty] = useState(settings.warrantyPolicy);

  // PROFECO Settings Form State (Personalización de plantilla para Admin)
  const [profecoRegNum, setProfecoRegNum] = useState(settings.profecoRegistrationNumber || 'PFC-REP-4892/2026');
  const [profecoRegDate, setProfecoRegDate] = useState(settings.profecoRegistrationDate || '15/01/2026');
  const [profecoRep, setProfecoRep] = useState(settings.profecoRepresentative || 'Ing. Carlos Mendoza Silva');
  const [profecoSchedule, setProfecoSchedule] = useState(settings.profecoScheduleAttention || 'Lunes a Viernes 08:30 a 19:00 hrs, Sábados 09:00 a 14:00 hrs');
  const [profecoWarrantyDays, setProfecoWarrantyDays] = useState(settings.profecoDefaultWarrantyDays || 90);
  const [profecoPenalty, setProfecoPenalty] = useState(settings.profecoDefaultPenaltyPercent || 15);
  const [profecoTestRadius, setProfecoTestRadius] = useState(settings.profecoDefaultTestRadiusKm || 5);
  const [profecoCancelDays, setProfecoCancelDays] = useState(settings.profecoDefaultCancellationDays || 5);
  const [profecoSettingsSaved, setProfecoSettingsSaved] = useState(false);

  // PROFECO Modals & Filters
  const [viewingProfecoContract, setViewingProfecoContract] = useState<ProfecoContract | null>(null);
  const [editingProfecoContract, setEditingProfecoContract] = useState<ProfecoContract | null>(null);
  const [isCreatingProfecoContract, setIsCreatingProfecoContract] = useState(false);
  const [profecoSearch, setProfecoSearch] = useState('');
  const [profecoStatusFilter, setProfecoStatusFilter] = useState('all');

  // Supabase state
  const [sbUrl, setSbUrl] = useState(settings.supabaseUrl || '');
  const [sbKey, setSbKey] = useState(settings.supabaseAnonKey || '');
  const [sbTestResult, setSbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sbLoading, setSbLoading] = useState(false);

  // Modals and detail states
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffUser | null>(null);
  const [pdfOrder, setPdfOrder] = useState<ServiceOrder | null>(null);
  const [viewOrder, setViewOrder] = useState<ServiceOrder | null>(null);
  const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null);
  const [orderSearch, setOrderSearch] = useState('');

  // Staff edit form
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffRole, setEditStaffRole] = useState<StaffUser['role']>('mechanic');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffCommission, setEditStaffCommission] = useState(15);
  const [editStaffSpecialty, setEditStaffSpecialty] = useState('');

  const openEditStaff = (m: StaffUser) => {
    setEditingStaff(m);
    setEditStaffName(m.fullName);
    setEditStaffRole(m.role);
    setEditStaffPhone(m.phone);
    setEditStaffEmail(m.email || '');
    setEditStaffCommission(m.commissionPercentage);
    setEditStaffSpecialty(m.specialty || '');
  };

  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    updateStaff(editingStaff.id, {
      fullName: editStaffName,
      role: editStaffRole,
      phone: editStaffPhone,
      email: editStaffEmail,
      commissionPercentage: Number(editStaffCommission),
      specialty: editStaffSpecialty,
    });
    setEditingStaff(null);
  };

  // Commission Calculations for Staff
  const staffCommissions = staff.map((member) => {
    let laborEarned = 0;
    let completedOrders = 0;

    orders.forEach((o) => {
      if (o.assignedMechanicId === member.id && o.status === 'entregado') {
        completedOrders++;
        o.items.forEach((it) => {
          if (it.type === 'mano_de_obra' && it.approvedByClient) {
            laborEarned += it.totalPrice;
          }
        });
      }
    });

    const commissionPay = (laborEarned * member.commissionPercentage) / 100;
    return {
      ...member,
      completedOrders: completedOrders + (member.jobsCompleted || 0),
      laborEarned,
      commissionPay,
    };
  });

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPhone) return;
    addStaff({
      fullName: newStaffName,
      role: newStaffRole,
      phone: newStaffPhone,
      email: newStaffEmail,
      active: true,
      commissionPercentage: Number(newStaffCommission),
      specialty: newStaffSpecialty,
    });
    setNewStaffName('');
    setNewStaffPhone('');
    setNewStaffEmail('');
    setNewStaffSpecialty('');
    setShowAddStaff(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      workshopName,
      legalName,
      taxId,
      address,
      phone,
      whatsapp,
      standardLaborHourRate: Number(laborRate),
      warrantyPolicy: warranty,
      supabaseUrl: sbUrl,
      supabaseAnonKey: sbKey,
      profecoRegistrationNumber: profecoRegNum,
      profecoRegistrationDate: profecoRegDate,
      profecoRepresentative: profecoRep,
      profecoScheduleAttention: profecoSchedule,
      profecoDefaultWarrantyDays: Number(profecoWarrantyDays),
      profecoDefaultPenaltyPercent: Number(profecoPenalty),
      profecoDefaultTestRadiusKm: Number(profecoTestRadius),
      profecoDefaultCancellationDays: Number(profecoCancelDays),
    });
    alert('Ajustes del taller y plantilla PROFECO guardados exitosamente.');
  };

  const handleTestSupabase = async () => {
    setSbLoading(true);
    updateSettings({ supabaseUrl: sbUrl, supabaseAnonKey: sbKey });
    const res = await testSupabaseConnection();
    setSbTestResult(res);
    setSbLoading(false);
  };

  const handleClearSupabase = async () => {
    if (window.confirm('¿Confirmas vaciar los registros remotos en Supabase y reiniciar los datos locales?')) {
      const res = await clearSupabaseRecords();
      clearAllSampleData();
      alert(res.message);
    }
  };

  // Top services analysis
  const serviceCounts: Record<string, number> = {};
  orders.forEach((o) => {
    o.items.forEach((it) => {
      const name = it.description.split(':')[0].trim();
      serviceCounts[name] = (serviceCounts[name] || 0) + it.quantity;
    });
  });
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Filtered PROFECO contracts for Admin
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
    if (window.confirm(`¿Confirmas eliminar el Contrato PROFECO con Folio ${folio}?`)) {
      deleteProfecoContract(id);
    }
  };

  const handleSaveProfecoSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      profecoRegistrationNumber: profecoRegNum,
      profecoRegistrationDate: profecoRegDate,
      profecoRepresentative: profecoRep,
      profecoScheduleAttention: profecoSchedule,
      profecoDefaultWarrantyDays: profecoWarrantyDays,
      profecoDefaultPenaltyPercent: profecoPenalty,
      profecoDefaultTestRadiusKm: profecoTestRadius,
      profecoDefaultCancellationDays: profecoCancelDays,
    });
    setProfecoSettingsSaved(true);
    setTimeout(() => setProfecoSettingsSaved(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Submodule Navigation */}
      <div className="flex border-b border-neutral-200 bg-white px-4 rounded-xl gap-2 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'dashboard' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Visión General & KPIs
        </button>
        <button
          onClick={() => handleTabChange('kanban')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'kanban' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Tablero OS en Vivo
        </button>
        <button
          onClick={() => handleTabChange('staff')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'staff' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Personal & Comisiones
        </button>
        <button
          onClick={() => handleTabChange('profeco')}
          className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
            subTab === 'profeco' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Contratos PROFECO ({profecoContracts.length})</span>
        </button>
        <button
          onClick={() => handleTabChange('reports')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'reports' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Reportes & Rentabilidad
        </button>
        <button
          onClick={() => handleTabChange('settings')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'settings' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Ajustes Taller & Supabase
        </button>
      </div>

      {/* SUBTAB: DASHBOARD / KPIS */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Reparaciones Activas</span>
                <Wrench className="w-4 h-4 text-[#DD040F]" />
              </div>
              <p className="text-2xl font-black text-[#010101] font-mono">{kpis.activeRepairs}</p>
              <span className="text-[10px] text-[#010101] font-semibold">En proceso en taller</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos del Día</span>
                <DollarSign className="w-4 h-4 text-[#010101]" />
              </div>
              <p className="text-2xl font-black text-[#010101] font-mono">${kpis.todayRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-neutral-500 font-medium">Cobrado en caja</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos del Mes</span>
                <TrendingUp className="w-4 h-4 text-[#DD040F]" />
              </div>
              <p className="text-2xl font-black text-[#010101] font-mono">${kpis.monthRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-neutral-500 font-semibold">Total acumulado</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Motos Entregadas</span>
                <Bike className="w-4 h-4 text-[#010101]" />
              </div>
              <p className="text-2xl font-black text-[#010101] font-mono">{kpis.deliveredThisMonth}</p>
              <span className="text-[10px] text-neutral-500 font-medium">Servicios concluidos</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ticket Promedio</span>
                <Percent className="w-4 h-4 text-[#DD040F]" />
              </div>
              <p className="text-2xl font-black text-[#010101] font-mono">${kpis.averageTicket.toLocaleString()}</p>
              <span className="text-[10px] text-neutral-500 font-medium">Por servicio moto</span>
            </div>
          </div>

          {/* Graphical Charts & Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Chart */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-neutral-100">
                <div>
                  <h3 className="font-extrabold text-sm text-[#010101]">Rendimiento e Ingresos Semanales</h3>
                  <p className="text-xs text-neutral-500">Mano de obra vs Venta de Repuestos</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#DD040F] inline-block" /> Mano de Obra</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#010101] inline-block" /> Refacciones</span>
                </div>
              </div>

              {/* Chart Visual */}
              <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
                {[
                  { day: 'Lun', labor: 3200, parts: 4500 },
                  { day: 'Mar', labor: 4800, parts: 6100 },
                  { day: 'Mié', labor: 5400, parts: 5800 },
                  { day: 'Jue', labor: 4100, parts: 7200 },
                  { day: 'Vie', labor: 6800, parts: 9400 },
                  { day: 'Sáb', labor: 8900, parts: 11200 },
                  { day: 'Hoy', labor: 4500, parts: 6200 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full max-w-[36px] flex flex-col items-center gap-1">
                      {/* Bar for Parts */}
                      <div
                        style={{ height: `${(item.parts / 12000) * 110}px` }}
                        className="w-full bg-[#010101] rounded-t-md hover:bg-neutral-800 transition"
                        title={`Refacciones: $${item.parts}`}
                      />
                      {/* Bar for Labor */}
                      <div
                        style={{ height: `${(item.labor / 12000) * 110}px` }}
                        className="w-full bg-[#DD040F] rounded-t-md hover:bg-[#b5030c] transition"
                        title={`Mano de obra: $${item.labor}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-neutral-500">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Requested Services */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <div className="border-b pb-3 border-neutral-100">
                <h3 className="font-extrabold text-sm text-[#010101]">Servicios Más Solicitados</h3>
                <p className="text-xs text-neutral-500">Mayor demanda en taller</p>
              </div>

              <div className="space-y-3">
                {topServices.map(([servName, count], idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#010101] truncate max-w-[180px]">{servName}</span>
                      <span className="font-bold font-mono text-[#DD040F]">{count} veces</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-[#DD040F] rounded-full"
                        style={{ width: `${Math.min(100, (count / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: KANBAN IN ADMIN */}
      {subTab === 'kanban' && <KanbanBoard />}

      {/* SUBTAB: STAFF & COMMISSIONS */}
      {subTab === 'staff' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-[#010101]">Gestión de Personal & Comisiones</h3>
              <p className="text-xs text-neutral-500">Mecánicos, Recepción y Asignación de Comisiones</p>
            </div>
            <button
              onClick={() => setShowAddStaff(!showAddStaff)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddStaff ? 'Cerrar Formulario' : 'Nuevo Integrante'}</span>
            </button>
          </div>

          {showAddStaff && (
            <form onSubmit={handleSaveStaff} className="p-4 rounded-xl bg-white border border-neutral-200 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#010101]">Registrar Usuario de Personal</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Ej. Martín Becerra"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Rol en Taller</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs font-bold text-[#010101]"
                  >
                    <option value="mechanic">Mecánico / Técnico</option>
                    <option value="reception">Recepción / Asesor</option>
                    <option value="warehouse">Almacén / Refacciones</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">% Comisión por Mano de Obra</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newStaffCommission}
                    onChange={(e) => setNewStaffCommission(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs font-mono text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Teléfono WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="+52 55..."
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="martin@qromotos.com"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Especialidad Técnica</label>
                  <input
                    type="text"
                    value={newStaffSpecialty}
                    onChange={(e) => setNewStaffSpecialty(e.target.value)}
                    placeholder="Ej. Motores 4T, Frenos ABS"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#010101] hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Guardar Integrante
                </button>
              </div>
            </form>
          )}

          {/* Staff Table with Commissions */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] border-b border-neutral-200 font-bold text-neutral-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3 text-center">Rol</th>
                  <th className="p-3">Especialidad / Contacto</th>
                  <th className="p-3 text-center">% Comisión</th>
                  <th className="p-3 text-right">Comisión Generada</th>
                  <th className="p-3 text-center">Trabajos</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staffCommissions.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-bold text-[#010101]">{m.fullName}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#010101] text-white uppercase">
                        {m.role}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-600">
                      <p>{m.specialty || 'General'}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">{m.phone}</p>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[#010101]">{m.commissionPercentage}%</td>
                    <td className="p-3 text-right font-mono font-bold text-[#010101]">
                      ${m.commissionPay.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-mono font-semibold">{m.completedOrders}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingStaff(m)}
                          className="p-1.5 bg-[#010101] text-white rounded-lg text-xs hover:bg-neutral-800 transition cursor-pointer"
                          title="Ver perfil de integrante"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditStaff(m)}
                          className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#010101] rounded-lg text-xs transition cursor-pointer"
                          title="Editar integrante y comisiones"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Confirmas eliminar a ${m.fullName}?`)) {
                              deleteStaff(m.id);
                            }
                          }}
                          className="p-1.5 bg-neutral-100 hover:bg-[#DD040F]/15 text-neutral-400 hover:text-[#DD040F] rounded-lg text-xs transition cursor-pointer"
                          title="Eliminar de personal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: REPORTS & STATS */}
      {subTab === 'reports' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-[#010101]">Histórico de Ventas: Repuestos vs Mano de Obra</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-neutral-200">
                <span className="text-xs text-neutral-500 block">Total Mano de Obra</span>
                <p className="text-xl font-bold font-mono text-[#010101] mt-1">
                  $
                  {orders
                    .flatMap((o) => o.items)
                    .filter((it) => it.type === 'mano_de_obra' && it.approvedByClient)
                    .reduce((a, b) => a + b.totalPrice, 0)
                    .toLocaleString()}{' '}
                  MXN
                </p>
              </div>
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-neutral-200">
                <span className="text-xs text-neutral-500 block">Total Venta de Refacciones</span>
                <p className="text-xl font-bold font-mono text-[#010101] mt-1">
                  $
                  {orders
                    .flatMap((o) => o.items)
                    .filter((it) => it.type === 'repuesto' && it.approvedByClient)
                    .reduce((a, b) => a + b.totalPrice, 0)
                    .toLocaleString()}{' '}
                  MXN
                </p>
              </div>
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-neutral-200">
                <span className="text-xs text-neutral-500 block">Horas Totales Trabajadas</span>
                <p className="text-xl font-bold font-mono text-[#DD040F] mt-1">
                  {(
                    orders.reduce((acc, o) => acc + (o.totalWorkedSeconds || 0), 0) / 3600
                  ).toFixed(1)}{' '}
                  horas
                </p>
              </div>
            </div>
          </div>

          {/* Historial General de Órdenes con Acciones y Exportación PDF */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#010101]">Registro & Auditoría de Órdenes de Servicio</h3>
                <p className="text-xs text-neutral-500">Consulta, edición, eliminación y exportación en PDF de cada orden</p>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar orden, cliente o placa..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full px-3 py-1.5 pl-8 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs text-[#010101] placeholder:text-neutral-400 focus:outline-hidden focus:border-[#DD040F]"
                />
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#010101] text-white font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 text-center">Folio</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Motocicleta</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center w-40">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orders
                    .filter((o) => {
                      if (!orderSearch.trim()) return true;
                      const q = orderSearch.toLowerCase();
                      return (
                        o.id.toLowerCase().includes(q) ||
                        (o.orderNumber && o.orderNumber.toString().includes(q)) ||
                        o.customerName.toLowerCase().includes(q) ||
                        o.motorcycleInfo.plate.toLowerCase().includes(q) ||
                        o.motorcycleInfo.model.toLowerCase().includes(q)
                      );
                    })
                    .map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-50 transition">
                        <td className="p-3 text-center font-mono font-black text-sm text-[#DD040F]">
                          #{ord.orderNumber || ord.id.replace(/[^0-9]/g, '')}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-neutral-500">
                          {new Date(ord.createdAt).toLocaleDateString('es-MX')}
                        </td>
                        <td className="p-3">
                          <strong className="text-[#010101] block">{ord.customerName}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">{ord.customerPhone}</span>
                        </td>
                        <td className="p-3">
                          <strong className="text-[#010101] block">
                            {ord.motorcycleInfo.brand} {ord.motorcycleInfo.model}
                          </strong>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Placa: {ord.motorcycleInfo.plate}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#010101]">
                          ${ord.total.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#010101] text-white uppercase">
                            {ord.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setPdfOrder(ord)}
                              className="flex items-center gap-1 px-2 py-1 bg-[#DD040F] hover:bg-[#b5030c] text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
                              title="Exportar Hoja Oficial de Servicio en PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => setViewOrder(ord)}
                              className="p-1.5 bg-[#010101] text-white rounded-lg text-xs hover:bg-neutral-800 transition cursor-pointer"
                              title="Ver detalles de orden"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditOrder(ord)}
                              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#010101] rounded-lg text-xs transition cursor-pointer"
                              title="Editar orden"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Confirmas eliminar la orden ${ord.id} de ${ord.customerName}?`)) {
                                  deleteServiceOrder(ord.id);
                                }
                              }}
                              className="p-1.5 bg-neutral-100 hover:bg-[#DD040F]/15 text-neutral-400 hover:text-[#DD040F] rounded-lg text-xs transition cursor-pointer"
                              title="Eliminar orden"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: CONTRATOS PROFECO & PERSONALIZACIÓN (ROL ADMIN) */}
      {subTab === 'profeco' && (
        <div className="space-y-6">
          {/* Header & Quick Actions */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-300 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#DD040F]" />
                <h3 className="font-black text-base text-[#010101]">
                  Gestión y Personalización de Contratos PROFECO
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Personaliza la plantilla legal oficial del taller, define parámetros de adhesión y administra los contratos emitidos a clientes en hoja carta oficial (1 hoja).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingProfecoContract(null);
                  setIsCreatingProfecoContract(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generar Nuevo Contrato</span>
              </button>
            </div>
          </div>

          {/* Section 1: Template Customization Form */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-300 shadow-2xs space-y-4">
            <div className="border-b pb-3 border-neutral-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-black text-sm text-[#010101] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#DD040F]" />
                  <span>Personalización de Plantilla de Adhesión (NOM-174-SCFI-2007)</span>
                </h4>
                <p className="text-xs text-neutral-500">
                  Estos valores se aplican automáticamente a la carátula y cláusulas de cada nuevo contrato generado.
                </p>
              </div>

              {profecoSettingsSaved && (
                <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span>¡Plantilla guardada correctamente!</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfecoSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-[#010101] mb-1">No. Registro Oficial PROFECO</label>
                  <input
                    type="text"
                    value={profecoRegNum}
                    onChange={(e) => setProfecoRegNum(e.target.value)}
                    placeholder="PFC-REP-4892/2026"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs font-mono font-bold text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#010101] mb-1">Fecha de Registro PROFECO</label>
                  <input
                    type="text"
                    value={profecoRegDate}
                    onChange={(e) => setProfecoRegDate(e.target.value)}
                    placeholder="15/01/2026"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs font-mono text-[#010101]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-[#010101] mb-1">Representante Legal (Declarante I)</label>
                  <input
                    type="text"
                    value={profecoRep}
                    onChange={(e) => setProfecoRep(e.target.value)}
                    placeholder="Nombre completo del representante legal"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs text-[#010101]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold text-[#010101] mb-1">Horario de Atención para Aclaraciones</label>
                  <input
                    type="text"
                    value={profecoSchedule}
                    onChange={(e) => setProfecoSchedule(e.target.value)}
                    placeholder="Lun-Vie 8:30 a 19:00 hrs, Sáb 9:00 a 14:00 hrs"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#010101] mb-1">Garantía (Cláusula 7)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={profecoWarrantyDays}
                      onChange={(e) => setProfecoWarrantyDays(Number(e.target.value))}
                      className="w-20 p-2 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs font-mono font-bold text-[#010101]"
                    />
                    <span className="text-neutral-500 font-bold">días</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-[#010101] mb-1">Pena Incumpl. (Cláusula 11)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={profecoPenalty}
                      onChange={(e) => setProfecoPenalty(Number(e.target.value))}
                      className="w-20 p-2 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs font-mono font-bold text-[#010101]"
                    />
                    <span className="text-neutral-500 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-[#010101] mb-1">Radio Pruebas (Cláusula 8)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={profecoTestRadius}
                      onChange={(e) => setProfecoTestRadius(Number(e.target.value))}
                      className="w-20 p-2 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs font-mono font-bold text-[#010101]"
                    />
                    <span className="text-neutral-500 font-bold">km</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#010101] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span>Guardar Parámetros de Plantilla PROFECO</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Global Contracts History Table */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-300 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-neutral-100">
              <div>
                <h4 className="font-black text-sm text-[#010101]">
                  Historial de Contratos PROFECO Emitidos ({profecoContracts.length})
                </h4>
                <p className="text-xs text-neutral-500">
                  Supervisa, consulta carátulas oficiales en formato Carta, edita o exporta en PDF con un clic.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Buscar contrato, cliente, placa..."
                    value={profecoSearch}
                    onChange={(e) => setProfecoSearch(e.target.value)}
                    className="w-full px-3 py-1.5 pl-8 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-[#010101] focus:outline-hidden focus:border-[#DD040F]"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                </div>

                <select
                  value={profecoStatusFilter}
                  onChange={(e) => setProfecoStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-[#010101]"
                >
                  <option value="all">Todos los estatus</option>
                  <option value="firmado">Firmados</option>
                  <option value="borrador">Borradores</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#010101] text-white font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Folio Contrato</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Consumidor</th>
                    <th className="p-3">Motocicleta</th>
                    <th className="p-3">Presupuesto</th>
                    <th className="p-3 text-center">Estatus</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-medium">
                  {filteredProfecoContracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-400">
                        No hay contratos PROFECO que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredProfecoContracts.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50 transition">
                        <td className="p-3">
                          <span className="font-mono font-black text-[#DD040F] block">{c.contractNumber}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">Reg: {c.profecoRegistrationNumber}</span>
                        </td>
                        <td className="p-3 font-mono text-neutral-600 text-xs whitespace-nowrap">{c.date}</td>
                        <td className="p-3">
                          <span className="font-bold text-[#010101] block">{c.customerName}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">{c.customerPhone}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-[#010101] block">
                            {c.motorcycleBrand} {c.motorcycleModel} ({c.motorcycleYear})
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">Placa: {c.motorcyclePlate || 'S/P'}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-[#010101] block">${c.agreedBudget.toLocaleString('es-MX')}</span>
                          <span className="text-[10px] text-green-700 font-mono">Anticipo: ${c.deposit.toLocaleString('es-MX')}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              c.status === 'firmado'
                                ? 'bg-green-100 text-green-800'
                                : c.status === 'borrador'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Ver / Imprimir Carta */}
                            <button
                              onClick={() => setViewingProfecoContract(c)}
                              className="p-1.5 bg-[#010101] text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                              title="Ver Contrato Carta e Imprimir"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {/* Descargar PDF */}
                            <button
                              onClick={() => setViewingProfecoContract(c)}
                              className="p-1.5 bg-neutral-100 hover:bg-[#DD040F] hover:text-white text-[#DD040F] rounded-lg transition cursor-pointer"
                              title="Descargar PDF en Hoja Tamaño Carta"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {/* Editar */}
                            <button
                              onClick={() => setEditingProfecoContract(c)}
                              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#010101] rounded-lg transition cursor-pointer"
                              title="Editar contrato"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Borrar */}
                            <button
                              onClick={() => handleDeleteProfecoContract(c.id, c.contractNumber)}
                              className="p-1.5 bg-neutral-100 hover:bg-red-100 hover:text-red-700 text-neutral-400 rounded-lg transition cursor-pointer"
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

      {/* SUBTAB: SETTINGS & SUPABASE */}
      {subTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="border-b pb-3 border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#010101]">Configuración Institucional del Taller</h3>
                <p className="text-xs text-neutral-500">Datos fiscales, tarifas de mano de obra y términos</p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Guardar Ajustes
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#010101] mb-1">Nombre Comercial del Taller</label>
                <input
                  type="text"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#010101] mb-1">Razón Social / Legal</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#010101] mb-1">RFC / Tax ID</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs font-mono text-[#010101]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#010101] mb-1">Dirección del Taller</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#010101] mb-1">Tarifa Base Mano de Obra ($/hr)</label>
                <input
                  type="number"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs font-mono font-bold text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#010101] mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#010101] mb-1">WhatsApp Notificaciones</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs text-[#010101]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#010101] mb-1">Políticas de Garantía del Taller</label>
              <textarea
                rows={2}
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs text-[#010101]"
              />
            </div>
          </form>

          {/* Supabase Integration & Database Controls */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="border-b pb-3 border-neutral-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#DD040F]" />
              <div>
                <h3 className="font-extrabold text-base text-[#010101]">Conexión a Base de Datos Supabase</h3>
                <p className="text-xs text-neutral-500">
                  Configura tu endpoint para persistencia en nube y borrado remoto de tablas cuando lo requieras.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#010101] mb-1">SUPABASE_URL</label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs font-mono text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#010101] mb-1">SUPABASE_ANON_KEY</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs font-mono text-[#010101]"
                />
              </div>
            </div>

            {sbTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  sbTestResult.success ? 'bg-neutral-100 border-neutral-400 text-[#010101]' : 'bg-[#DD040F]/10 border-[#DD040F]/40 text-[#DD040F]'
                }`}
              >
                {sbTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-[#010101]" /> : <AlertCircle className="w-4 h-4 shrink-0 text-[#DD040F]" />}
                <span>{sbTestResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={sbLoading}
                className="px-4 py-2 bg-[#010101] hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {sbLoading ? 'Probando...' : 'Probar Conexión Supabase'}
              </button>

              <button
                type="button"
                onClick={handleClearSupabase}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#DD040F] border border-neutral-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Vaciar Registros en Supabase & Local
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Integrante */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/85 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#010101] text-white">
              <h3 className="font-bold text-sm text-white">Perfil de Personal</h3>
              <button
                onClick={() => setViewingStaff(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Nombre:</span>
                  <strong className="text-[#010101] text-sm">{viewingStaff.fullName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Rol Asignado:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#010101] text-white uppercase">
                    {viewingStaff.role}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Teléfono WhatsApp:</span>
                  <span className="font-mono text-[#010101]">{viewingStaff.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Correo:</span>
                  <span className="font-mono text-[#010101]">{viewingStaff.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Especialidad:</span>
                  <span className="font-semibold text-[#010101]">{viewingStaff.specialty || 'General'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">% Comisión M.O.:</span>
                  <span className="font-mono font-black text-sm text-[#DD040F]">{viewingStaff.commissionPercentage}%</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const st = viewingStaff;
                    setViewingStaff(null);
                    openEditStaff(st);
                  }}
                  className="px-4 py-2 bg-[#010101] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Integrante</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Integrante */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/85 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#010101] text-white">
              <h3 className="font-bold text-sm text-white">Editar Integrante de Personal</h3>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditStaff} className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editStaffName}
                    onChange={(e) => setEditStaffName(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Rol</label>
                  <select
                    value={editStaffRole}
                    onChange={(e) => setEditStaffRole(e.target.value as any)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-bold text-[#010101]"
                  >
                    <option value="mechanic">Mecánico / Técnico</option>
                    <option value="reception">Recepción / Asesor</option>
                    <option value="warehouse">Almacén / Refacciones</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">% Comisión</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editStaffCommission}
                    onChange={(e) => setEditStaffCommission(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-mono font-bold text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Teléfono WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={editStaffPhone}
                    onChange={(e) => setEditStaffPhone(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editStaffEmail}
                    onChange={(e) => setEditStaffEmail(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Especialidad</label>
                  <input
                    type="text"
                    value={editStaffSpecialty}
                    onChange={(e) => setEditStaffSpecialty(e.target.value)}
                    placeholder="Mantenimiento 4T, Frenos ABS..."
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Hoja de Servicio Modal */}
      {pdfOrder && (
        <HojaDeServicioPDFModal order={pdfOrder} onClose={() => setPdfOrder(null)} />
      )}

      {/* Order Detail Modal */}
      {viewOrder && (
        <OrderDetailModal orderId={viewOrder.id} onClose={() => setViewOrder(null)} />
      )}

      {/* Edit Order Modal */}
      {editOrder && (
        <EditOrderModal order={editOrder} onClose={() => setEditOrder(null)} />
      )}

      {/* PROFECO Legal Contract Letter PDF Modal */}
      {viewingProfecoContract && (
        <ProfecoContractPDFModal
          contract={viewingProfecoContract}
          onClose={() => setViewingProfecoContract(null)}
        />
      )}

      {/* PROFECO Contract Form Modal (Create or Edit) */}
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
