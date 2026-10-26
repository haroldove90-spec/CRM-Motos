import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Expense } from '../../types/crm';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  Receipt,
  FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const FinancesExpensesTab: React.FC = () => {
  const {
    orders,
    counterSales,
    expenses,
    addExpense,
    deleteExpense,
    settings,
  } = useCRM();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New expense form
  const [newConcept, setNewConcept] = useState('');
  const [newCategory, setNewCategory] = useState<Expense['category']>('consumibles_taller');
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('transferencia');
  const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
  const [newTaxDeductible, setNewTaxDeductible] = useState(true);
  const [newNotes, setNewNotes] = useState('');

  // Calculations
  // 1. Taller: Mano de obra vs refacciones
  let workshopLaborSales = 0;
  let workshopPartsSales = 0;
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (item.approvedByClient) {
        if (item.type === 'mano_de_obra') {
          workshopLaborSales += item.totalPrice;
        } else {
          workshopPartsSales += item.totalPrice;
        }
      }
    });
  });

  // 2. Mostrador (refacciones y accesorios al público)
  const counterPartsSales = counterSales.reduce((acc, s) => acc + s.total, 0);

  // Totales de ingresos
  const totalPartsSales = workshopPartsSales + counterPartsSales;
  const totalGrossIncome = workshopLaborSales + totalPartsSales;

  // Total cobrado real
  let totalCollected = 0;
  orders.forEach((o) => {
    (o.payments || []).forEach((p) => {
      totalCollected += p.amount;
    });
  });
  totalCollected += counterPartsSales;

  // Gastos
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const deductibleExpenses = expenses.filter((e) => e.taxDeductible).reduce((acc, e) => acc + e.amount, 0);
  const nonDeductibleExpenses = totalExpenses - deductibleExpenses;

  // Utilidad estimada operativa
  const netOperatingProfit = totalGrossIncome - totalExpenses;

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'deductible') return e.taxDeductible;
    if (categoryFilter === 'non_deductible') return !e.taxDeductible;
    return e.category === categoryFilter;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcept.trim() || newAmount <= 0) return;

    addExpense({
      date: new Date().toISOString().split('T')[0],
      concept: newConcept.trim(),
      category: newCategory,
      amount: Number(newAmount),
      paymentMethod: newPaymentMethod,
      invoiceNumber: newInvoiceNumber.trim() || undefined,
      taxDeductible: newTaxDeductible,
      registeredBy: 'Administración QROMOTOS',
      notes: newNotes.trim() || undefined,
    });

    setNewConcept('');
    setNewAmount(0);
    setNewInvoiceNumber('');
    setNewNotes('');
    setShowAddModal(false);
  };

  // Exportar reporte mensual para la contadora y el SAT
  const exportSATReportPDF = () => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [221, 4, 15]; // #DD040F

    // Header
    doc.setFillColor(1, 1, 1);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE MENSUAL DE INGRESOS, GASTOS Y STATUS FISCAL', 14, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.legalName} • RFC: ${settings.taxId} • ${settings.workshopName}`, 14, 21);

    // Resumen Ejecutivo
    doc.setTextColor(1, 1, 1);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Resumen de Operación Contable (Taller + Mostrador)', 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [['Rubro Fiscal / Contable', 'Monto en Moneda Nacional ($ MXN)', 'Observaciones']],
      body: [
        ['Ventas de Mano de Obra (Taller)', `$${workshopLaborSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Servicios mecánicos facturables'],
        ['Ventas de Refacciones en Taller', `$${workshopPartsSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Piezas instaladas en reparaciones'],
        ['Ventas Mostrador al Público', `$${counterPartsSales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Venta rápida de mostrador y accesorios'],
        ['TOTAL INGRESOS BRUTOS', `$${totalGrossIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Total facturable / cobrado'],
        ['Gastos Operativos Deducibles (SAT)', `$${deductibleExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Con CFDI / Factura fiscal'],
        ['Gastos No Deducibles (Caja Chica)', `$${nonDeductibleExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Sin comprobante fiscal'],
        ['TOTAL EGRESOS Y GASTOS', `$${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Total de egresos registrados'],
        ['UTILIDAD OPERATIVA PRE-IMPUESTOS', `$${netOperatingProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Base gravable estimada'],
      ],
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 8.5 },
    });

    // Desglose de Gastos
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.text('2. Relación Detallada de Egresos y Gastos por Concepto', 14, finalY + 12);

    const expenseRows = expenses.map((e) => [
      e.date,
      e.concept,
      e.category.toUpperCase().replace(/_/g, ' '),
      e.taxDeductible ? 'Deducible (CFDI)' : 'No Deducible',
      e.invoiceNumber || 'S/F',
      e.paymentMethod.toUpperCase(),
      `$${e.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: finalY + 16,
      head: [['Fecha', 'Concepto', 'Categoría', 'Deducibilidad', 'Factura', 'Pago', 'Importe']],
      body: expenseRows,
      headStyles: { fillColor: [50, 50, 50], textColor: 255 },
      styles: { fontSize: 7.5 },
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-MX')} • Sistema Integral QROMOTOS • Documento de uso contable para la Contadora y Declaración SAT`,
        14,
        290
      );
    }

    doc.save(`QROMOTOS_Resumen_Financiero_SAT_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
              Módulo Contable & Fiscal
            </span>
            <span className="text-xs text-neutral-400 font-mono">RFC: {settings.taxId}</span>
          </div>
          <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
            Finanzas, Gastos Operativos & Estatus SAT
          </h2>
          <p className="text-xs text-neutral-500">
            Control integral de ventas (taller vs refacciones), gastos por concepto y reportería para la contadora.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportSATReportPDF}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-black transition shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#DD040F]" />
            <span>Exportar PDF Contadora & SAT</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#DD040F] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm shadow-[#DD040F]/30"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Resumen de ventas, cobros y gastos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Ventas Taller (Mano de obra) */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mano de Obra (Taller)</span>
            <DollarSign className="w-4 h-4 text-[#DD040F]" />
          </div>
          <p className="text-2xl font-black text-[#010101] font-mono">
            ${workshopLaborSales.toLocaleString('es-MX')}
          </p>
          <span className="text-[10px] text-neutral-500 font-medium">Reparaciones de taller</span>
        </div>

        {/* Ventas Refacciones (Taller + Mostrador) */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Venta de Refacciones</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#010101] font-mono">
            ${totalPartsSales.toLocaleString('es-MX')}
          </p>
          <span className="text-[10px] text-neutral-500 font-medium">
            Taller (${workshopPartsSales.toLocaleString()}) + Mostrador (${counterPartsSales.toLocaleString()})
          </span>
        </div>

        {/* Total Gastos */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gastos Operativos</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">
            ${totalExpenses.toLocaleString('es-MX')}
          </p>
          <span className="text-[10px] text-neutral-500 font-medium">
            Deducibles: ${deductibleExpenses.toLocaleString()} • No ded: ${nonDeductibleExpenses.toLocaleString()}
          </span>
        </div>

        {/* Utilidad Operativa Neta */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Utilidad Operativa</span>
            <Building className="w-4 h-4 text-[#010101]" />
          </div>
          <p className={`text-2xl font-black font-mono ${netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            ${netOperatingProfit.toLocaleString('es-MX')}
          </p>
          <span className="text-[10px] text-neutral-500 font-medium">Margen bruto antes de ISR</span>
        </div>
      </div>

      {/* Tabla y Filtros de Gastos */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#DD040F]" />
            <h3 className="font-extrabold text-sm text-[#010101]">Bitácora de Gastos por Concepto</h3>
            <span className="text-xs text-neutral-400">({filteredExpenses.length} registros)</span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 font-medium focus:ring-1 focus:ring-[#DD040F] outline-none"
            >
              <option value="all">Todas las categorías</option>
              <option value="deductible">Solo deducibles SAT (con CFDI)</option>
              <option value="non_deductible">No deducibles (Caja chica)</option>
              <option value="renta">Renta</option>
              <option value="servicios_luz_agua">Luz / Agua / Servicios</option>
              <option value="nomina_imss">Nómina / IMSS</option>
              <option value="herramientas">Herramientas</option>
              <option value="consumibles_taller">Consumibles Taller</option>
              <option value="mantenimiento_instalaciones">Mantenimiento</option>
              <option value="otro">Otros</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Concepto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Fiscal SAT</th>
                <th className="py-3 px-4">Forma de Pago</th>
                <th className="py-3 px-4 text-right">Importe</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-neutral-50/80 transition">
                  <td className="py-3 px-4 text-neutral-600 font-mono text-[11px] whitespace-nowrap">
                    {expense.date}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#010101]">{expense.concept}</p>
                    {expense.notes && <p className="text-[10px] text-neutral-400">{expense.notes}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700 capitalize">
                      {expense.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {expense.taxDeductible ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Deducible ({expense.invoiceNumber || 'CFDI'})
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-medium bg-neutral-100 px-2 py-0.5 rounded-full">
                        No deducible
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 capitalize text-neutral-600">
                    {expense.paymentMethod}
                  </td>
                  <td className="py-3 px-4 text-right font-black font-mono text-neutral-900">
                    ${expense.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar gasto "${expense.concept}"?`)) {
                          deleteExpense(expense.id);
                        }
                      }}
                      className="p-1 text-neutral-400 hover:text-[#DD040F] transition"
                      title="Eliminar gasto"
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

      {/* Modal Registrar Gasto */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-200">
            <div className="bg-[#010101] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#DD040F]" />
                <h3 className="font-black text-sm">Registrar Gasto Operativo</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Concepto o Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de recibo de luz CFE o Compra de desengrasante"
                  value={newConcept}
                  onChange={(e) => setNewConcept(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#DD040F] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Categoría *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Expense['category'])}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#DD040F] outline-none"
                  >
                    <option value="renta">Renta Local</option>
                    <option value="servicios_luz_agua">Servicios (Luz/Agua)</option>
                    <option value="nomina_imss">Nómina e IMSS</option>
                    <option value="herramientas">Herramientas</option>
                    <option value="consumibles_taller">Consumibles Taller</option>
                    <option value="mantenimiento_instalaciones">Mantenimiento</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Importe ($ MXN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newAmount || ''}
                    onChange={(e) => setNewAmount(parseFloat(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-[#DD040F] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Forma de Pago</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#DD040F] outline-none"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="tarjeta">Tarjeta Débito/Crédito</option>
                    <option value="efectivo">Efectivo / Caja Chica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Folio / Factura CFDI</label>
                  <input
                    type="text"
                    placeholder="Ej: FAC-9821 o S/F"
                    value={newInvoiceNumber}
                    onChange={(e) => setNewInvoiceNumber(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#DD040F] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="taxDeduct"
                  checked={newTaxDeductible}
                  onChange={(e) => setNewTaxDeductible(e.target.checked)}
                  className="w-4 h-4 text-[#DD040F] rounded border-neutral-300 focus:ring-[#DD040F]"
                />
                <label htmlFor="taxDeduct" className="text-neutral-700 font-semibold cursor-pointer">
                  Gasto con factura y deducible ante el SAT (CFDI oficial)
                </label>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales para la contadora..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#DD040F] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DD040F] text-white rounded-xl hover:bg-red-700 font-bold shadow-sm shadow-[#DD040F]/30"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
