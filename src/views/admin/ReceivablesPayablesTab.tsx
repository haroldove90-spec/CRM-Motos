import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building2,
  Users,
  Plus,
  Calendar,
  CheckCircle,
  Phone,
  FileText,
  Search,
  Download,
  CreditCard,
  Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReceivablesPayablesTab: React.FC = () => {
  const {
    orders,
    suppliers,
    supplierInvoices,
    registerSupplierPayment,
    addSupplier,
    addSupplierInvoice,
    registerPayment,
  } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState<'receivables' | 'payables' | 'suppliers'>('receivables');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    rfc: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    category: 'Refacciones Originales',
    creditDays: 30,
    creditLimit: 50000,
    currentBalance: 0,
  });

  // New Invoice Form
  const [newInvoice, setNewInvoice] = useState({
    supplierId: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    totalAmount: 0,
    notes: '',
  });

  // Calculations for Cuentas por Cobrar (Clientes)
  const clientDebtors = orders
    .map(order => {
      const paid = (order.deposit || 0) + (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const pending = Math.max(0, order.total - paid);
      return {
        ...order,
        paidAmount: paid,
        pendingBalance: pending,
      };
    })
    .filter(order => order.pendingBalance > 0 && order.status !== 'entregado');

  const totalReceivables = clientDebtors.reduce((sum, o) => sum + o.pendingBalance, 0);

  // Calculations for Cuentas por Pagar (Proveedores)
  const pendingInvoices = supplierInvoices.filter(inv => inv.status !== 'pagada');
  const totalPayables = pendingInvoices.reduce((sum, inv) => sum + inv.pendingAmount, 0);
  const overdueInvoices = pendingInvoices.filter(inv => new Date(inv.dueDate) < new Date());

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    addSupplier({
      ...newSupplier,
      balance: newSupplier.currentBalance,
    });
    setShowSupplierModal(false);
    setNewSupplier({
      name: '',
      rfc: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      category: 'Refacciones Originales',
      creditDays: 30,
      creditLimit: 50000,
      currentBalance: 0,
    });
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === newInvoice.supplierId);
    if (!sup || newInvoice.totalAmount <= 0) return;

    addSupplierInvoice({
      supplierId: sup.id,
      supplierName: sup.name,
      invoiceNumber: newInvoice.invoiceNumber || `FAC-${Date.now().toString().slice(-4)}`,
      date: newInvoice.date,
      dueDate: newInvoice.dueDate,
      totalAmount: Number(newInvoice.totalAmount),
      paidAmount: 0,
      pendingAmount: Number(newInvoice.totalAmount),
      status: 'pendiente',
      notes: newInvoice.notes,
    });

    setShowInvoiceModal(false);
    setNewInvoice({
      supplierId: '',
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      totalAmount: 0,
      notes: '',
    });
  };

  const handlePaySupplierInvoice = () => {
    if (!selectedInvoice || paymentAmount <= 0) return;
    registerSupplierPayment(selectedInvoice.id, paymentAmount);
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentAmount(0);
  };

  // Export PDF Report
  const exportPDFReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('QROMOTOS - REPORTE DE CUENTAS POR COBRAR Y POR PAGAR', 14, 18);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')} | Generado por Administración`, 14, 25);

    // Summary box
    doc.setFillColor(243, 244, 246);
    doc.rect(14, 30, 182, 20, 'F');
    doc.setFontSize(11);
    doc.text(`Total por Cobrar (Clientes): $${totalReceivables.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 20, 38);
    doc.text(`Total por Pagar (Proveedores): $${totalPayables.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 20, 45);

    // Receivables Table
    doc.setFontSize(13);
    doc.text('1. Cuentas por Cobrar a Clientes (Taller)', 14, 58);
    autoTable(doc, {
      startY: 62,
      head: [['Folio', 'Cliente', 'Teléfono', 'Vehículo', 'Total', 'Abonado', 'Saldo Pendiente']],
      body: clientDebtors.map(o => [
        o.id,
        o.customerName,
        o.customerPhone,
        `${o.motorcycleInfo.brand} ${o.motorcycleInfo.model}`,
        `$${o.total.toFixed(2)}`,
        `$${o.paidAmount.toFixed(2)}`,
        `$${o.pendingBalance.toFixed(2)}`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 120;

    // Payables Table
    doc.setFontSize(13);
    doc.text('2. Cuentas por Pagar a Proveedores', 14, finalY + 12);
    autoTable(doc, {
      startY: finalY + 16,
      head: [['Factura', 'Proveedor', 'Fecha', 'Vencimiento', 'Total', 'Pagado', 'Saldo Pendiente', 'Estatus']],
      body: supplierInvoices.map(inv => [
        inv.invoiceNumber,
        inv.supplierName,
        inv.date,
        inv.dueDate,
        `$${inv.totalAmount.toFixed(2)}`,
        `$${inv.paidAmount.toFixed(2)}`,
        `$${inv.pendingAmount.toFixed(2)}`,
        inv.status.toUpperCase(),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [185, 28, 28] },
    });

    doc.save(`Qromotos_Cuentas_Cobrar_Pagar_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header and KPI Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Cuentas por Cobrar y por Pagar
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Control de saldos pendientes de clientes y compromisos de pago con proveedores de refacciones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPDFReport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Descargar Reporte PDF
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-700 tracking-wider">Cuentas por Cobrar</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${totalReceivables.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">{clientDebtors.length} clientes con saldo pendiente</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-rose-700 tracking-wider">Cuentas por Pagar</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${totalPayables.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">{pendingInvoices.length} facturas de proveedores por liquidar</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-amber-700 tracking-wider">Facturas Vencidas</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{overdueInvoices.length}</p>
          <p className="text-xs text-gray-500 mt-1">Requieren atención prioritaria de tesorería</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-blue-700 tracking-wider">Proveedores Registrados</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{suppliers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Líneas de crédito activas</p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveSubTab('receivables')}
          className={`py-3 px-4 font-medium text-sm border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'receivables'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Cobranza a Clientes (Taller) ({clientDebtors.length})
        </button>
        <button
          onClick={() => setActiveSubTab('payables')}
          className={`py-3 px-4 font-medium text-sm border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'payables'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Facturas de Proveedores ({supplierInvoices.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`py-3 px-4 font-medium text-sm border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'suppliers'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Catálogo de Proveedores ({suppliers.length})
        </button>
      </div>

      {/* Tab 1: Clientes con Saldos Pendientes (Cobranza) */}
      {activeSubTab === 'receivables' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Clientes con Adeudos Activos</h3>
            <div className="text-sm text-gray-500">
              Total acumulado pendiente:{' '}
              <span className="font-bold text-gray-900">
                ${totalReceivables.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Orden / Folio</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Motocicleta</th>
                  <th className="py-3 px-4">Estatus</th>
                  <th className="py-3 px-4 text-right">Costo Total</th>
                  <th className="py-3 px-4 text-right">Abonado</th>
                  <th className="py-3 px-4 text-right text-rose-700">Saldo Pendiente</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No hay clientes con saldos pendientes por cobrar en este momento.
                    </td>
                  </tr>
                ) : (
                  clientDebtors.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">{order.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {order.customerPhone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800">
                          {order.motorcycleInfo.brand} {order.motorcycleInfo.model}
                        </span>
                        <div className="text-xs text-gray-400">{order.motorcycleInfo.plate || 'Sin placas'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">${order.total.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-medium">${order.paidAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        ${order.pendingBalance.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={`https://wa.me/52${order.customerPhone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                            order.customerName
                          )},%20te%20saludamos%20de%20QROMOTOS.%20Te%20recordamos%20que%20tu%20orden%20${order.id}%20tiene%20un%20saldo%20pendiente%20de%20$${order.pendingBalance.toFixed(
                            2
                          )}.%20¡Quedamos%20a%20tus%20órdenes!`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition"
                        >
                          <Phone className="w-3 h-3" />
                          Cobrar por WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Facturas de Proveedores (Cuentas por Pagar) */}
      {activeSubTab === 'payables' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Control de Facturas por Pagar a Proveedores</h3>
              <p className="text-xs text-gray-500">Registra y programa pagos parciales o totales de compras de refacciones.</p>
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Nueva Factura de Proveedor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Factura</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Fecha Vencimiento</th>
                  <th className="py-3 px-4 text-right">Importe Total</th>
                  <th className="py-3 px-4 text-right">Liquidado</th>
                  <th className="py-3 px-4 text-right text-rose-700">Por Pagar</th>
                  <th className="py-3 px-4 text-center">Estatus</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supplierInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      No hay facturas registradas.
                    </td>
                  </tr>
                ) : (
                  supplierInvoices.map(invoice => {
                    const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'pagada';
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-mono font-medium text-gray-900">{invoice.invoiceNumber}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{invoice.supplierName}</td>
                        <td className="py-3 px-4">{invoice.date}</td>
                        <td className="py-3 px-4">
                          <span className={isOverdue ? 'text-rose-600 font-semibold flex items-center gap-1' : ''}>
                            {invoice.dueDate}
                            {isOverdue && <AlertCircle className="w-3.5 h-3.5 inline text-rose-600" />}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">${invoice.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">${invoice.paidAmount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">${invoice.pendingAmount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              invoice.status === 'pagada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : invoice.status === 'parcial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {invoice.status !== 'pagada' ? (
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setPaymentAmount(invoice.pendingAmount);
                                setShowPaymentModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md transition"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Registrar Abono
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Completado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Catálogo de Proveedores */}
      {activeSubTab === 'suppliers' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Directorio de Proveedores y Líneas de Crédito</h3>
              <p className="text-xs text-gray-500">Administra los proveedores de partes originales, mayoreo y consumibles.</p>
            </div>
            <button
              onClick={() => setShowSupplierModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map(sup => (
              <div key={sup.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{sup.name}</h4>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {sup.category || 'Refacciones'}
                    </span>
                  </div>
                  <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">{sup.rfc || 'Sin RFC'}</span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contacto:</span>
                    <span className="font-medium text-gray-800">{sup.contactName || sup.contactPerson || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Teléfono:</span>
                    <span className="font-medium text-gray-800">{sup.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Días de crédito:</span>
                    <span className="font-medium text-gray-800">{sup.creditDays} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Límite de crédito:</span>
                    <span className="font-medium text-gray-800">${(sup.creditLimit || 0).toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Saldo actual adeudado:</span>
                    <span className="font-bold text-rose-600">${(sup.currentBalance || sup.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Registrar Proveedor */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Nuevo Proveedor</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Razón Social / Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Ej. Mayoreo Italika Bajío"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">RFC</label>
                  <input
                    type="text"
                    value={newSupplier.rfc}
                    onChange={e => setNewSupplier({ ...newSupplier, rfc: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                    placeholder="XAXX010101000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Días de Crédito</label>
                  <input
                    type="number"
                    value={newSupplier.creditDays}
                    onChange={e => setNewSupplier({ ...newSupplier, creditDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contacto</label>
                  <input
                    type="text"
                    value={newSupplier.contactName}
                    onChange={e => setNewSupplier({ ...newSupplier, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Ej. Ing. Roberto Sánchez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="442-123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Límite de Crédito ($ MXN)</label>
                <input
                  type="number"
                  value={newSupplier.creditLimit}
                  onChange={e => setNewSupplier({ ...newSupplier, creditLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nueva Factura */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Factura por Pagar</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proveedor *</label>
                <select
                  required
                  value={newInvoice.supplierId}
                  onChange={e => setNewInvoice({ ...newInvoice, supplierId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Seleccione proveedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.creditDays} días)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Folio / Número de Factura</label>
                <input
                  type="text"
                  required
                  value={newInvoice.invoiceNumber}
                  onChange={e => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="FAC-9842"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Emisión</label>
                  <input
                    type="date"
                    required
                    value={newInvoice.date}
                    onChange={e => setNewInvoice({ ...newInvoice, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    required
                    value={newInvoice.dueDate}
                    onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Monto Total de la Factura ($ MXN) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newInvoice.totalAmount || ''}
                  onChange={e => setNewInvoice({ ...newInvoice, totalAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notas / Concepto</label>
                <input
                  type="text"
                  value={newInvoice.notes}
                  onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Lote de balatas, bujías y kits de arrastre"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700"
                >
                  Guardar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Abono a Proveedor */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Registrar Pago a Proveedor</h3>
            <p className="text-xs text-gray-500 mb-4">
              Factura: <span className="font-mono font-bold text-gray-800">{selectedInvoice.invoiceNumber}</span> ({selectedInvoice.supplierName})
            </p>

            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Total Factura:</span>
                <span className="font-semibold">${selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Saldo Pendiente:</span>
                <span className="font-bold text-rose-600">${selectedInvoice.pendingAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Monto a Liquidar / Abonar ($ MXN)</label>
              <input
                type="number"
                step="0.01"
                max={selectedInvoice.pendingAmount}
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-bold text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePaySupplierInvoice}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
