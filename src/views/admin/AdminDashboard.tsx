import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { StaffUser } from '../../types/crm';
import {
  Wrench,
  DollarSign,
  Bike,
  Clock,
  TrendingUp,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Database,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Percent,
} from 'lucide-react';
import { KanbanBoard } from '../../components/KanbanBoard';

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
    inventory,
    addStaff,
    updateStaff,
    deleteStaff,
    updateSettings,
    testSupabaseConnection,
    clearSupabaseRecords,
    clearAllSampleData,
    restoreSampleData,
    isSampleDataCleared,
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

  // Supabase state
  const [sbUrl, setSbUrl] = useState(settings.supabaseUrl || '');
  const [sbKey, setSbKey] = useState(settings.supabaseAnonKey || '');
  const [sbTestResult, setSbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sbLoading, setSbLoading] = useState(false);

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
    });
    alert('Ajustes del taller guardados exitosamente.');
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

  return (
    <div className="space-y-6">
      {/* Submodule Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl gap-2 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'dashboard' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Visión General & KPIs
        </button>
        <button
          onClick={() => handleTabChange('kanban')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'kanban' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Tablero OS en Vivo
        </button>
        <button
          onClick={() => handleTabChange('staff')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'staff' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Personal & Comisiones
        </button>
        <button
          onClick={() => handleTabChange('reports')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'reports' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
          }`}
        >
          Reportes & Rentabilidad
        </button>
        <button
          onClick={() => handleTabChange('settings')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'settings' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Reparaciones Activas</span>
                <Wrench className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{kpis.activeRepairs}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">En proceso en taller</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos del Día</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">${kpis.todayRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-medium">Cobrado en caja</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos del Mes</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">${kpis.monthRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">+18% vs mes anterior</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Motos Entregadas</span>
                <Bike className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{kpis.deliveredThisMonth}</p>
              <span className="text-[10px] text-purple-600 font-medium">Servicios concluidos</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ticket Promedio</span>
                <Percent className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">${kpis.averageTicket.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-medium">Por servicio moto</span>
            </div>
          </div>

          {/* Graphical Charts & Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Chart (SVG) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Rendimiento e Ingresos Semanales</h3>
                  <p className="text-xs text-slate-500">Mano de obra vs Venta de Repuestos</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-600 inline-block" /> Mano de Obra</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-800 inline-block" /> Refacciones</span>
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
                        className="w-full bg-slate-800 rounded-t-md hover:bg-slate-700 transition"
                        title={`Refacciones: $${item.parts}`}
                      />
                      {/* Bar for Labor */}
                      <div
                        style={{ height: `${(item.labor / 12000) * 110}px` }}
                        className="w-full bg-orange-600 rounded-t-md hover:bg-orange-500 transition"
                        title={`Mano de obra: $${item.labor}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Requested Services */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="border-b pb-3 border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-900">Servicios Más Solicitados</h3>
                <p className="text-xs text-slate-500">Mayor demanda en taller</p>
              </div>

              <div className="space-y-3">
                {topServices.map(([servName, count], idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[180px]">{servName}</span>
                      <span className="font-bold font-mono text-orange-600">{count} veces</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
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
              <h3 className="font-extrabold text-lg text-slate-900">Gestión de Personal & Comisiones</h3>
              <p className="text-xs text-slate-500">Mecánicos, Recepción y Asignación de Comisiones</p>
            </div>
            <button
              onClick={() => setShowAddStaff(!showAddStaff)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddStaff ? 'Cerrar Formulario' : 'Nuevo Integrante'}</span>
            </button>
          </div>

          {showAddStaff && (
            <form onSubmit={handleSaveStaff} className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Registrar Usuario de Personal</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Ej. Martín Becerra"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rol en Taller</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="mechanic">Mecánico / Técnico</option>
                    <option value="reception">Recepción / Asesor</option>
                    <option value="warehouse">Almacén / Refacciones</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">% Comisión por Mano de Obra</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newStaffCommission}
                    onChange={(e) => setNewStaffCommission(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Teléfono WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="+52 55..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="martin@crmmotos.com"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Especialidad Técnica</label>
                  <input
                    type="text"
                    value={newStaffSpecialty}
                    onChange={(e) => setNewStaffSpecialty(e.target.value)}
                    placeholder="Ej. Motores 4T, Frenos ABS"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                >
                  Guardar Integrante
                </button>
              </div>
            </form>
          )}

          {/* Staff Table with Commissions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
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
              <tbody className="divide-y divide-slate-100">
                {staffCommissions.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{m.fullName}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                        {m.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      <p>{m.specialty || 'General'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{m.phone}</p>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{m.commissionPercentage}%</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ${m.commissionPay.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-mono font-semibold">{m.completedOrders}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteStaff(m.id)}
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
        </div>
      )}

      {/* SUBTAB: REPORTS & STATS */}
      {subTab === 'reports' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Histórico de Ventas: Repuestos vs Mano de Obra</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Total Mano de Obra</span>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  $
                  {orders
                    .flatMap((o) => o.items)
                    .filter((it) => it.type === 'mano_de_obra' && it.approvedByClient)
                    .reduce((a, b) => a + b.totalPrice, 0)
                    .toLocaleString()}{' '}
                  MXN
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Total Venta de Refacciones</span>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  $
                  {orders
                    .flatMap((o) => o.items)
                    .filter((it) => it.type === 'repuesto' && it.approvedByClient)
                    .reduce((a, b) => a + b.totalPrice, 0)
                    .toLocaleString()}{' '}
                  MXN
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Horas Totales Trabajadas</span>
                <p className="text-xl font-bold font-mono text-orange-600 mt-1">
                  {(
                    orders.reduce((acc, o) => acc + (o.totalWorkedSeconds || 0), 0) / 3600
                  ).toFixed(1)}{' '}
                  horas
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: SETTINGS & SUPABASE */}
      {subTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Configuración Institucional del Taller</h3>
                <p className="text-xs text-slate-500">Datos fiscales, tarifas de mano de obra y términos</p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Guardar Ajustes
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial del Taller</label>
                <input
                  type="text"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Razón Social / Legal</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">RFC / Tax ID</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección del Taller</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tarifa Base Mano de Obra ($/hr)</label>
                <input
                  type="number"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Notificaciones</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Políticas de Garantía del Taller</label>
              <textarea
                rows={2}
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </form>

          {/* Supabase Integration & Database Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b pb-3 border-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Conexión a Base de Datos Supabase</h3>
                <p className="text-xs text-slate-500">
                  Configura tu endpoint para persistencia en nube y borrado remoto de tablas cuando lo requieras.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SUPABASE_URL</label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SUPABASE_ANON_KEY</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {sbTestResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  sbTestResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
                }`}
              >
                {sbTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{sbTestResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={sbLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
              >
                {sbLoading ? 'Probando...' : 'Probar Conexión Supabase'}
              </button>

              <button
                type="button"
                onClick={handleClearSupabase}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-xl transition border border-red-300"
              >
                Vaciar Registros en Supabase & Local
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
