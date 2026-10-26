import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  ShoppingCart,
  DollarSign,
  Plus,
  Trash2,
  Printer,
  Receipt,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Unlock,
  Package,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const CounterPOSAndCashCutTab: React.FC = () => {
  const {
    inventory,
    counterSales,
    createCounterSale,
    cashCuts,
    openCashCut,
    closeCashCut,
    settings,
  } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'cash_cut'>('pos');

  // --- POS STATE ---
  const [cart, setCart] = useState<{ inventoryItemId: string; partNumber: string; description: string; quantity: number; unitPrice: number; total: number }[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(inventory[0]?.id || '');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('Venta General / Mostrador');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');

  // --- CASH CUT STATE ---
  const todayStr = new Date().toISOString().split('T')[0];
  const activeCut = cashCuts.find((c) => c.status === 'abierta');

  const [initialFund, setInitialFund] = useState<number>(1500);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCashInDrawer, setActualCashInDrawer] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [cashierName, setCashierName] = useState('Valeria Ramos');

  // Add item to cart
  const handleAddToCart = () => {
    const item = inventory.find((i) => i.id === selectedInventoryId);
    if (!item) return;

    const unitPrice = item.salePrice || (item as any).price || 0;
    const existingIndex = cart.findIndex((c) => c.inventoryItemId === item.id);
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += itemQuantity;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          inventoryItemId: item.id,
          partNumber: item.partNumber,
          description: item.name,
          quantity: itemQuantity,
          unitPrice: unitPrice,
          total: itemQuantity * unitPrice,
        },
      ]);
    }
    setItemQuantity(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const sale = createCounterSale({
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Cliente Mostrador',
      customerPhone: customerPhone.trim() || undefined,
      items: cart,
      subtotal: cartTotal,
      tax: 0,
      total: cartTotal,
      paymentMethod,
      attendedBy: cashierName,
    });

    // Imprimir ticket automáticamente
    printReceipt(sale);

    setCart([]);
    setCustomerName('Venta General / Mostrador');
    setCustomerPhone('');
  };

  const printReceipt = (sale: any) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 180], // Formato Ticket térmico 80mm
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('QROMOTOS', 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.legalName, 40, 15, { align: 'center' });
    doc.text(`RFC: ${settings.taxId}`, 40, 19, { align: 'center' });
    doc.text(settings.phone, 40, 23, { align: 'center' });
    doc.line(5, 26, 75, 26);

    doc.setFont('helvetica', 'bold');
    doc.text(`FOLIO: ${sale.folio}`, 5, 31);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date(sale.date).toLocaleString('es-MX')}`, 5, 36);
    doc.text(`Cliente: ${sale.customerName}`, 5, 41);
    doc.text(`Pago: ${sale.paymentMethod.toUpperCase()}`, 5, 46);
    doc.line(5, 49, 75, 49);

    let y = 54;
    doc.setFont('helvetica', 'bold');
    doc.text('CANT  DESCRIPCIÓN          TOTAL', 5, y);
    doc.setFont('helvetica', 'normal');
    y += 5;

    sale.items.forEach((item: any) => {
      doc.text(`${item.quantity}x ${item.description.substring(0, 18)}  $${item.total}`, 5, y);
      y += 5;
    });

    doc.line(5, y, 75, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`TOTAL: $${sale.total.toLocaleString('es-MX')} MXN`, 5, y);
    y += 8;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('¡Gracias por su compra en Qromotos!', 40, y, { align: 'center' });
    doc.text('Garantía directa en mostrador con ticket', 40, y + 4, { align: 'center' });

    doc.save(`Ticket_${sale.folio}.pdf`);
  };

  const handleOpenDrawer = () => {
    openCashCut(Number(initialFund), todayStr);
  };

  const handleConfirmCloseCut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCut) return;
    closeCashCut(activeCut.id, Number(actualCashInDrawer), cashierName, closeNotes);
    setShowCloseModal(false);
    setActualCashInDrawer(0);
    setCloseNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
            Módulo Ventas & Arqueo Diario
          </span>
          <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
            Punto de Venta Mostrador & Corte Diario de Caja
          </h2>
          <p className="text-xs text-neutral-500">
            Ventas rápidas de mostrador (refacciones y consumibles) y cuadre diario de caja con arqueo por forma de pago.
          </p>
        </div>

        {/* Subtab Toggle */}
        <div className="flex bg-neutral-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('pos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              activeSubTab === 'pos'
                ? 'bg-white text-[#DD040F] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Punto de Venta Mostrador</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cash_cut')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition ${
              activeSubTab === 'cash_cut'
                ? 'bg-white text-[#DD040F] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Corte de Caja Diario {activeCut ? '(Abierta)' : '(Cerrada)'}</span>
          </button>
        </div>
      </div>

      {/* --- SECCIÓN 1: PUNTO DE VENTA MOSTRADOR --- */}
      {activeSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Selección de Refacciones */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-[#010101] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#DD040F]" />
              <span>Seleccionar Refacción o Accesorio de Inventario</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                  Producto de Almacén *
                </label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => setSelectedInventoryId(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id} disabled={item.stock <= 0}>
                      {item.partNumber} - {item.name} | Stock: {item.stock} | ${(item.salePrice || (item as any).price || 0).toLocaleString('es-MX')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  className="w-full border border-neutral-300 rounded-lg p-2 text-xs font-mono font-bold text-center outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-black transition flex items-center gap-1.5 h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* Carrito de Compra */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden mt-4">
              <div className="bg-neutral-50 px-4 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex justify-between">
                <span>Piezas Seleccionadas ({cart.length})</span>
                <span>Subtotal</span>
              </div>
              {cart.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  El carrito está vacío. Agrega refacciones para procesar la venta de mostrador.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                  {cart.map((cItem, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-neutral-50/50">
                      <div>
                        <p className="font-bold text-[#010101]">{cItem.description}</p>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {cItem.partNumber} • {cItem.quantity} x ${cItem.unitPrice.toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-neutral-900">
                          ${cItem.total.toLocaleString('es-MX')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="text-neutral-400 hover:text-[#DD040F] transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho: Cobro & Cliente */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-[#010101] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Detalles del Cobro & Ticket</span>
            </h3>

            <form onSubmit={handleCompleteSale} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Teléfono WhatsApp (Opcional)</label>
                <input
                  type="text"
                  placeholder="442-000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Forma de Pago *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`py-2 px-1 rounded-lg text-center font-bold text-[11px] border transition ${
                      paymentMethod === 'efectivo'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`py-2 px-1 rounded-lg text-center font-bold text-[11px] border transition ${
                      paymentMethod === 'tarjeta'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    Tarjeta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`py-2 px-1 rounded-lg text-center font-bold text-[11px] border transition ${
                      paymentMethod === 'transferencia'
                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    SPEI
                  </button>
                </div>
              </div>

              {/* Total Display */}
              <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                  Total a Cobrar
                </span>
                <p className="text-3xl font-black font-mono text-emerald-400">
                  ${cartTotal.toLocaleString('es-MX')} MXN
                </p>
                <span className="text-[10px] text-neutral-400 block">
                  {cart.reduce((s, i) => s + i.quantity, 0)} artículos en mostrador
                </span>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full py-3 bg-[#DD040F] text-white rounded-xl font-extrabold text-xs hover:bg-red-700 transition shadow-sm shadow-[#DD040F]/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cobrar & Generar Ticket PDF</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- SECCIÓN 2: CORTE DIARIO DE CAJA & ARQUEO --- */}
      {activeSubTab === 'cash_cut' && (
        <div className="space-y-6">
          {/* Estado de Caja de Hoy */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    activeCut ? 'bg-emerald-600' : 'bg-neutral-400'
                  }`}
                >
                  {activeCut ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#010101]">
                    Caja del Día: {todayStr}
                  </h3>
                  <span className="text-xs text-neutral-500">
                    Estatus: {activeCut ? 'ABIERTA Y EN OPERACIÓN' : 'CERRADA'}
                  </span>
                </div>
              </div>

              <div>
                {!activeCut ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Fondo Inicial ($)"
                      value={initialFund}
                      onChange={(e) => setInitialFund(parseFloat(e.target.value) || 0)}
                      className="w-32 border border-neutral-300 rounded-lg p-2 text-xs font-mono font-bold text-center outline-none"
                    />
                    <button
                      onClick={handleOpenDrawer}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                    >
                      Abrir Caja del Día
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="px-4 py-2 bg-[#DD040F] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                  >
                    Realizar Corte & Arqueo de Cierre
                  </button>
                )}
              </div>
            </div>

            {/* Métricas de Caja Abierta */}
            {activeCut && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4">
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Fondo Inicial</span>
                  <p className="text-base font-black font-mono text-[#010101] mt-0.5">
                    ${activeCut.initialCash.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Ventas Efectivo</span>
                  <p className="text-base font-black font-mono text-emerald-700 mt-0.5">
                    ${activeCut.totalCashSales.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Ventas Tarjeta</span>
                  <p className="text-base font-black font-mono text-blue-700 mt-0.5">
                    ${activeCut.totalCardSales.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase block">Transferencias SPEI</span>
                  <p className="text-base font-black font-mono text-purple-700 mt-0.5">
                    ${activeCut.totalTransferSales.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="bg-neutral-900 text-white p-3 rounded-xl">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Efectivo Esperado</span>
                  <p className="text-base font-black font-mono text-emerald-400 mt-0.5">
                    ${(activeCut.initialCash + activeCut.totalCashSales - activeCut.totalCashExpenses).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Historial de Cortes de Caja */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100">
              <h3 className="font-extrabold text-sm text-[#010101]">
                Historial de Cortes de Caja y Arqueos Realizados
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-right">Fondo Inicial</th>
                    <th className="py-3 px-4 text-right">Efectivo Cobrado</th>
                    <th className="py-3 px-4 text-right">Tarjetas</th>
                    <th className="py-3 px-4 text-right">SPEI</th>
                    <th className="py-3 px-4 text-right font-bold">Esperado en Cajón</th>
                    <th className="py-3 px-4 text-right font-black">Arqueo Real</th>
                    <th className="py-3 px-4 text-center">Diferencia</th>
                    <th className="py-3 px-4 text-center">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cashCuts.map((cut) => (
                    <tr key={cut.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-neutral-900">{cut.date}</td>
                      <td className="py-3 px-4 text-right font-mono">${cut.initialCash.toLocaleString('es-MX')}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">${cut.totalCashSales.toLocaleString('es-MX')}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700">${cut.totalCardSales.toLocaleString('es-MX')}</td>
                      <td className="py-3 px-4 text-right font-mono text-purple-700">${cut.totalTransferSales.toLocaleString('es-MX')}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">${cut.expectedCashInDrawer.toLocaleString('es-MX')}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-neutral-900">${cut.actualCashInDrawer.toLocaleString('es-MX')}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {cut.difference === 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">Cuadrado $0</span>
                        ) : cut.difference > 0 ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">Sobrante +${cut.difference}</span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">Faltante -${Math.abs(cut.difference)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cut.status === 'cerrada' ? 'bg-neutral-100 text-neutral-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {cut.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CIERRE DE CAJA Y ARQUEO */}
      {showCloseModal && activeCut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-200">
            <div className="bg-[#010101] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-black text-sm">Cierre de Caja & Arqueo Físico</h3>
              <button onClick={() => setShowCloseModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleConfirmCloseCut} className="p-5 space-y-4 text-xs">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1">
                <span className="text-neutral-500">Efectivo Calculado por Sistema:</span>
                <p className="text-xl font-black font-mono text-[#010101]">
                  ${(activeCut.initialCash + activeCut.totalCashSales - activeCut.totalCashExpenses).toLocaleString('es-MX')} MXN
                </p>
                <p className="text-[10px] text-neutral-400">
                  (Fondo: ${activeCut.initialCash} + Ventas: ${activeCut.totalCashSales} - Gastos: ${activeCut.totalCashExpenses})
                </p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Efectivo Físico Contado en Cajón ($ MXN) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Monto total de billetes y monedas"
                  value={actualCashInDrawer || ''}
                  onChange={(e) => setActualCashInDrawer(parseFloat(e.target.value))}
                  className="w-full border border-neutral-300 rounded-lg p-2.5 font-mono font-bold text-base outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Responsable del Cierre</label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Observaciones / Notas del Arqueo</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre retiros, billetes o novedades..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DD040F] text-white rounded-xl font-bold hover:bg-red-700"
                >
                  Confirmar Cierre de Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
