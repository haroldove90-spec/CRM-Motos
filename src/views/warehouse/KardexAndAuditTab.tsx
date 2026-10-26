import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  History,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

interface KardexAndAuditProps {
  mode: 'kardex' | 'division' | 'audit';
}

export const KardexAndAuditTab: React.FC<KardexAndAuditProps> = ({ mode }) => {
  const {
    inventory,
    inventoryMovements,
    orders,
    counterSales,
    adjustInventoryStock,
    recordInventoryMovement,
  } = useCRM();

  const [searchKardex, setSearchKardex] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Audit state: Map itemId -> countedStock
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    inventory.forEach((item) => {
      init[item.id] = item.stock;
    });
    return init;
  });

  const [appliedAudit, setAppliedAudit] = useState(false);

  // Business division calculations:
  // 1. Refacciones vendidas a través de reparaciones de taller
  let workshopPartsTotal = 0;
  let workshopPartsCount = 0;
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (item.type === 'repuesto' && item.approvedByClient) {
        workshopPartsTotal += item.totalPrice;
        workshopPartsCount += item.quantity;
      }
    });
  });

  // 2. Refacciones vendidas directamente en mostrador
  let counterPartsTotal = 0;
  let counterPartsCount = 0;
  counterSales.forEach((s) => {
    counterPartsTotal += s.total;
    s.items.forEach((it) => {
      counterPartsCount += it.quantity;
    });
  });

  const handleApplyAuditAdjustments = () => {
    if (!window.confirm('¿Confirmas ajustar el stock del sistema al conteo físico verificado?')) return;

    inventory.forEach((item) => {
      const counted = counts[item.id] !== undefined ? counts[item.id] : item.stock;
      const diff = counted - item.stock;
      if (diff !== 0) {
        adjustInventoryStock(item.id, diff);
        recordInventoryMovement({
          itemId: item.id,
          partNumber: item.partNumber,
          itemName: item.name,
          type: 'ajuste_conteo',
          quantity: Math.abs(diff),
          previousStock: item.stock,
          newStock: counted,
          reference: 'Auditoría Conteo Físico',
          user: 'Roberto Gómez (Almacén)',
        });
      }
    });

    setAppliedAudit(true);
    setTimeout(() => setAppliedAudit(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* --- MODO 1: KARDEX DE MOVIMIENTOS --- */}
      {mode === 'kardex' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
                Trazabilidad de Inventario
              </span>
              <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
                Kardex de Entradas & Salidas de Almacén
              </h2>
              <p className="text-xs text-neutral-500">
                Bitácora cronológica de cada pieza que ingresa por compra o egresa hacia el taller o mostrador.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50 font-medium outline-none focus:ring-1 focus:ring-[#DD040F]"
              >
                <option value="all">Todos los movimientos</option>
                <option value="entrada_compra">Entradas por Compra</option>
                <option value="salida_taller">Salidas a Taller</option>
                <option value="salida_mostrador">Salidas a Mostrador</option>
                <option value="ajuste_conteo">Ajustes de Conteo</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#010101]">
                Historial de Movimientos Registrados ({inventoryMovements.length})
              </h3>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar pieza, código, folio..."
                  value={searchKardex}
                  onChange={(e) => setSearchKardex(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Código / Pieza</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-center">Stock Previo</th>
                    <th className="py-3 px-4 text-center">Nuevo Stock</th>
                    <th className="py-3 px-4">Referencia / Folio</th>
                    <th className="py-3 px-4">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {inventoryMovements
                    .filter((m) => {
                      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
                      if (!searchKardex) return true;
                      const q = searchKardex.toLowerCase();
                      return (
                        m.itemName.toLowerCase().includes(q) ||
                        m.partNumber.toLowerCase().includes(q) ||
                        (m.reference && m.reference.toLowerCase().includes(q))
                      );
                    })
                    .map((mov) => {
                      const isPositive = mov.type === 'entrada_compra' || mov.newStock > mov.previousStock;
                      return (
                        <tr key={mov.id} className="hover:bg-neutral-50/80 transition">
                          <td className="py-3 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(mov.date).toLocaleString('es-MX')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-[#DD040F] block">{mov.partNumber}</span>
                            <span className="text-neutral-800 font-semibold">{mov.itemName}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                isPositive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              {mov.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-black text-sm">
                            {isPositive ? `+${mov.quantity}` : `-${mov.quantity}`}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-neutral-500">
                            {mov.previousStock}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-neutral-900">
                            {mov.newStock}
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-600 text-[11px]">
                            {mov.reference || 'S/Ref'}
                          </td>
                          <td className="py-3 px-4 text-neutral-600 font-medium">
                            {mov.user}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODO 2: DIVISIÓN DE NEGOCIO (TALLER VS REFACCIONARIA) --- */}
      {mode === 'division' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
              Separación de Unidades de Negocio
            </span>
            <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
              División de Refacciones: Taller vs Ventas de Mostrador
            </h2>
            <p className="text-xs text-neutral-500">
              Identifica con precisión cuánto le compra el taller mecánico al área de refacciones por reparaciones propias vs la venta directa a clientes externos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                Unidad 1: Suministros a Taller
              </span>
              <p className="text-2xl font-black text-[#DD040F] font-mono">
                ${workshopPartsTotal.toLocaleString('es-MX')} MXN
              </p>
              <span className="text-xs text-neutral-600 font-semibold block">
                {workshopPartsCount} piezas instaladas en órdenes de servicio
              </span>
              <p className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-100">
                Monto que el área de taller le abona/paga a la refaccionaria.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                Unidad 2: Venta Directa Mostrador
              </span>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                ${counterPartsTotal.toLocaleString('es-MX')} MXN
              </p>
              <span className="text-xs text-neutral-600 font-semibold block">
                {counterPartsCount} productos vendidos al público en general
              </span>
              <p className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-100">
                Aceites, cascos, bujías y lubricantes cobrados al paso.
              </p>
            </div>

            <div className="bg-neutral-900 text-white p-5 rounded-2xl shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Facturación Refacciones
              </span>
              <p className="text-3xl font-black font-mono text-emerald-400">
                ${(workshopPartsTotal + counterPartsTotal).toLocaleString('es-MX')} MXN
              </p>
              <span className="text-xs text-neutral-300 block">
                {workshopPartsCount + counterPartsCount} piezas totales desplazadas
              </span>
              <p className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-800">
                Volumen consolidado del área de repuestos QROMOTOS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- MODO 3: CONTEO FÍSICO VS SISTEMA (AUDITORÍA) --- */}
      {mode === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
                Auditoría Física & Control de Mermas
              </span>
              <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
                Conteo Físico vs Stock Registrado en Sistema
              </h2>
              <p className="text-xs text-neutral-500">
                Captura las existencias reales contadas en anaquel para detectar discrepancias, faltantes o excedentes.
              </p>
            </div>

            <button
              onClick={handleApplyAuditAdjustments}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplicar Ajustes al Inventario</span>
            </button>
          </div>

          {appliedAudit && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Ajustes de inventario aplicados y registrados en el Kardex exitosamente!</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#010101]">
                Cédula de Auditoría de Existencias Físicas
              </h3>
              <span className="text-xs text-neutral-500">{inventory.length} referencias en catálogo</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descripción de la Refacción</th>
                    <th className="py-3 px-4">Ubicación</th>
                    <th className="py-3 px-4 text-center">Stock Sistema</th>
                    <th className="py-3 px-4 text-center font-bold text-neutral-900">Conteo Físico Real</th>
                    <th className="py-3 px-4 text-center font-bold">Diferencia</th>
                    <th className="py-3 px-4 text-right">Costo Unit.</th>
                    <th className="py-3 px-4 text-right font-black">Impacto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {inventory.map((item) => {
                    const counted = counts[item.id] !== undefined ? counts[item.id] : item.stock;
                    const diff = counted - item.stock;
                    const unitCost = item.costPrice || (item as any).cost || 0;
                    const impact = diff * unitCost;

                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#DD040F]">{item.partNumber}</td>
                        <td className="py-3 px-4 font-semibold text-[#010101]">{item.name}</td>
                        <td className="py-3 px-4 text-neutral-500">{item.location || 'Anaquel General'}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-neutral-700">
                          {item.stock}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={counted}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setCounts((prev) => ({ ...prev, [item.id]: val }));
                            }}
                            className="w-20 border border-neutral-300 rounded-lg p-1 text-center font-mono font-bold text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                          />
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black">
                          {diff === 0 ? (
                            <span className="text-neutral-400">0</span>
                          ) : diff > 0 ? (
                            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">
                              +{diff} Sobrante
                            </span>
                          ) : (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">
                              {diff} Faltante
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-500">
                          ${unitCost.toLocaleString('es-MX')}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-black ${
                            impact === 0 ? 'text-neutral-400' : impact > 0 ? 'text-blue-700' : 'text-rose-600'
                          }`}
                        >
                          ${impact.toLocaleString('es-MX')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
