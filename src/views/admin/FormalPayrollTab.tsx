import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { PayrollRecord, StaffUser } from '../../types/crm';
import {
  Building2,
  Users,
  DollarSign,
  Plus,
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  CreditCard,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const FormalPayrollTab: React.FC = () => {
  const {
    staff,
    payrollRecords,
    addPayrollRecord,
    updatePayrollRecord,
    settings,
  } = useCRM();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // New Payroll Form
  const [period, setPeriod] = useState(`Semana ${Math.ceil(new Date().getDate() / 7)} - ${new Date().toLocaleString('es-MX', { month: 'long' })}`);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [commissions, setCommissions] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('transferencia');

  // Pre-fill salary when choosing staff in modal
  const handleSelectStaffForPayroll = (stId: string) => {
    setSelectedStaffId(stId);
    const member = staff.find((s) => s.id === stId);
    if (member) {
      setBaseSalary(member.baseSalary || 3500);
    }
  };

  const handleCreatePayrollRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const member = staff.find((s) => s.id === selectedStaffId);
    if (!member) return;

    const net = baseSalary + commissions + bonus - deductions;

    addPayrollRecord({
      staffId: member.id,
      staffName: member.fullName,
      role: member.specialty || member.role,
      period,
      baseSalary: Number(baseSalary),
      commissionsEarned: Number(commissions),
      bonus: Number(bonus),
      deductions: Number(deductions),
      netPay: Math.max(0, net),
      status: 'pagado',
      paidAt: new Date().toISOString().split('T')[0],
      paymentMethod,
    });

    setCommissions(0);
    setBonus(0);
    setDeductions(0);
    setShowGenerateModal(false);
  };

  // Exportar recibo individual de nómina para contadora y firma del empleado
  const exportPayrollReceiptPDF = (pay: PayrollRecord) => {
    const doc = new jsPDF();
    const member = staff.find((s) => s.id === pay.staffId);

    // Encabezado
    doc.setFillColor(1, 1, 1);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO FORMAL DE NÓMINA Y COMPENSACIONES', 14, 12);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.legalName} • RFC: ${settings.taxId} • ${settings.workshopName}`, 14, 19);

    // Datos del Trabajador
    doc.setTextColor(1, 1, 1);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL TRABAJADOR / PRESTADOR DE SERVICIOS', 14, 34);

    autoTable(doc, {
      startY: 37,
      theme: 'grid',
      body: [
        ['Nombre del Empleado:', pay.staffName, 'Puesto / Especialidad:', pay.role],
        ['No. Seguridad Social (IMSS):', member?.nssIMSS || 'En trámite', 'CURP:', member?.curp || 'S/CURP'],
        ['Frecuencia de Pago:', member?.payrollFrequency?.toUpperCase() || 'QUINCENAL', 'Periodo Nómina:', pay.period],
        ['Método de Dispersión:', pay.paymentMethod?.toUpperCase() || 'TRANSFERENCIA', 'Cuenta / CLABE:', member?.bankAccount || 'Efectivo'],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [50, 50, 50] },
    });

    const startYPercep = (doc as any).lastAutoTable?.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE DE PERCEPCIONES Y DEDUCCIONES', 14, startYPercep);

    autoTable(doc, {
      startY: startYPercep + 4,
      head: [['Concepto', 'Tipo', 'Monto ($ MXN)']],
      body: [
        ['Sueldo Base del Periodo', 'Percepción', `$${pay.baseSalary.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
        ['Comisiones por Órdenes de Taller / Ventas', 'Percepción', `$${pay.commissionsEarned.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
        ['Bonos por Productividad / Puntualidad', 'Percepción', `$${pay.bonus.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
        ['Retención IMSS / Cuota Obrera / Deducciones', 'Deducción', `-$${pay.deductions.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
        ['TOTAL NETO A PAGAR EN DISPERSIÓN', 'NETO RECIBIDO', `$${pay.netPay.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
      ],
      headStyles: { fillColor: [221, 4, 15], textColor: 255 },
      styles: { fontSize: 8.5 },
    });

    const sigY = (doc as any).lastAutoTable?.finalY + 30;
    doc.setFontSize(8);
    doc.text('Recibí de conformidad el importe total neto especificado en el presente comprobante.', 14, sigY);

    // Firmas
    doc.line(14, sigY + 22, 90, sigY + 22);
    doc.text('Firma del Trabajador', 35, sigY + 27);
    doc.text(`NSS: ${member?.nssIMSS || ''}`, 35, sigY + 31);

    doc.line(120, sigY + 22, 196, sigY + 22);
    doc.text('Autorizado por Administración / Contabilidad', 125, sigY + 27);
    doc.text('QROMOTOS Taller Especializado', 135, sigY + 31);

    doc.save(`Recibo_Nomina_${pay.staffName.replace(/\s+/g, '_')}_${pay.period.replace(/\s+/g, '_')}.pdf`);
  };

  const totalPayrollDispersed = payrollRecords.reduce((acc, p) => acc + p.netPay, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
            Módulo RRHH & Nómina Contable
          </span>
          <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
            Nómina Formal, Sueldos e IMSS
          </h2>
          <p className="text-xs text-neutral-500">
            Administración de plantilla laboral con sueldos base, seguro social, comisiones ganadas y recibos contables.
          </p>
        </div>

        <button
          onClick={() => {
            handleSelectStaffForPayroll(staff[0]?.id || '');
            setShowGenerateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#DD040F] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm shadow-[#DD040F]/30"
        >
          <Plus className="w-4 h-4" />
          <span>Generar Pago de Nómina</span>
        </button>
      </div>

      {/* Padrón Formal de Empleados */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#DD040F]" />
            <h3 className="font-extrabold text-sm text-[#010101]">
              Padrón Formal de Empleados Registrados ante IMSS
            </h3>
          </div>
          <span className="text-xs font-bold text-neutral-500">{staff.length} colaboradores activos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Puesto / Rol</th>
                <th className="py-3 px-4">NSS (IMSS)</th>
                <th className="py-3 px-4">CURP</th>
                <th className="py-3 px-4">Frecuencia</th>
                <th className="py-3 px-4 text-right">Sueldo Base</th>
                <th className="py-3 px-4 text-right">% Comisión</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-neutral-50/80 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#010101]">{member.fullName}</p>
                    <span className="text-[10px] text-neutral-400">{member.bankAccount || 'Pago en efectivo'}</span>
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                      {member.role === 'mechanic' ? 'Mecánico de Taller' : member.role === 'reception' ? 'Recepción / Caja' : member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-neutral-700 font-semibold">
                    {member.nssIMSS || 'En registro IMSS'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                    {member.curp || 'S/CURP'}
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-neutral-600">
                    {member.payrollFrequency || 'Quincenal'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#010101]">
                    ${(member.baseSalary || 0).toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#DD040F] font-bold">
                    {member.commissionPercentage}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        handleSelectStaffForPayroll(member.id);
                        setShowGenerateModal(true);
                      }}
                      className="px-2.5 py-1 bg-neutral-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition"
                    >
                      Pagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Pagos y Recibos Emitidos */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#DD040F]" />
            <h3 className="font-extrabold text-sm text-[#010101]">
              Historial de Recibos de Nómina y Dispersiones
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-800">
            Total Dispersado: ${totalPayrollDispersed.toLocaleString('es-MX')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Periodo</th>
                <th className="py-3 px-4">Empleado</th>
                <th className="py-3 px-4">Puesto</th>
                <th className="py-3 px-4 text-right">Sueldo Base</th>
                <th className="py-3 px-4 text-right">Comisiones</th>
                <th className="py-3 px-4 text-right">Bonos</th>
                <th className="py-3 px-4 text-right">Deducciones IMSS</th>
                <th className="py-3 px-4 text-right font-black text-emerald-700">Neto Pagado</th>
                <th className="py-3 px-4 text-center">Comprobante PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payrollRecords.map((pay) => (
                <tr key={pay.id} className="hover:bg-neutral-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-neutral-900 whitespace-nowrap">
                    {pay.period}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#010101]">{pay.staffName}</td>
                  <td className="py-3 px-4 text-neutral-500">{pay.role}</td>
                  <td className="py-3 px-4 text-right font-mono">${pay.baseSalary.toLocaleString('es-MX')}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#DD040F] font-semibold">
                    ${pay.commissionsEarned.toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-neutral-600">
                    ${pay.bonus.toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600">
                    -${pay.deductions.toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                    ${pay.netPay.toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => exportPayrollReceiptPDF(pay)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[10px] font-bold transition"
                    >
                      <Download className="w-3 h-3 text-[#DD040F]" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GENERAR PAGO DE NÓMINA */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-200">
            <div className="bg-[#010101] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-black text-sm">Generar Recibo de Nómina</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreatePayrollRecord} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Colaborador / Empleado *</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => handleSelectStaffForPayroll(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Periodo de Pago *</label>
                <input
                  type="text"
                  required
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ej: Semana 43 (19 al 25 Octubre) o Quincena 20"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Sueldo Base ($ MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baseSalary || ''}
                    onChange={(e) => setBaseSalary(parseFloat(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Comisiones Ganadas ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={commissions || ''}
                    onChange={(e) => setCommissions(parseFloat(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Bonos / Puntualidad ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bonus || ''}
                    onChange={(e) => setBonus(parseFloat(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Deducciones IMSS / Retenciones ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductions || ''}
                    onChange={(e) => setDeductions(parseFloat(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold text-rose-600 outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Forma de Dispersión</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                >
                  <option value="transferencia">Transferencia Electrónica SPEI</option>
                  <option value="efectivo">Efectivo en Sobre</option>
                </select>
              </div>

              {/* Total preview */}
              <div className="bg-neutral-50 p-3 rounded-xl flex items-center justify-between border border-neutral-200">
                <span className="font-bold text-neutral-700">Neto a Pagar:</span>
                <span className="font-mono text-base font-black text-emerald-700">
                  ${Math.max(0, (baseSalary || 0) + (commissions || 0) + (bonus || 0) - (deductions || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DD040F] text-white rounded-xl font-bold hover:bg-red-700"
                >
                  Guardar y Emitir Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
