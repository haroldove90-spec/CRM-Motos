import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { InventoryItem } from '../../types/crm';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface WarehouseViewProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  activeModule = 'catalog',
  onSelectModule,
}) => {
  const {
    inventory,
    orders,
    addInventoryItem,
    adjustInventoryStock,
    dispenseInventoryItem,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // New Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [partNum, setPartNum] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Motul');
  const [category, setCategory] = useState<InventoryItem['category']>('aceites_fluidos');
  const [compatibles, setCompatibles] = useState('');
  const [costPrice, setCostPrice] = useState(200);
  const [salePrice, setSalePrice] = useState(350);
  const [stock, setStock] = useState(10);
  const [minStock, setMinStock] = useState(5);
  const [location, setLocation] = useState('Estante A-1');

  // Supplier Reception Form State
  const [entryPartId, setEntryPartId] = useState('');
  const [entryQty, setEntryQty] = useState<number>(5);
  const [entrySupplier, setEntrySupplier] = useState('Distribuidora Motopartes S.A.');
  const [entryInvoiceRef, setEntryInvoiceRef] = useState('FAC-84920');

  // Pending parts requested in active orders
  const pendingRequests: {
    orderId: string;
    orderNumber: number;
    customerName: string;
    bikeModel: string;
    itemId: string;
    description: string;
    partNumber?: string;
    quantity: number;
    unitPrice: number;
  }[] = [];

  orders.forEach((o) => {
    if (['en_reparacion', 'en_diagnostico', 'esperando_refaccion'].includes(o.status)) {
      o.items.forEach((it) => {
        if (it.type === 'repuesto' && it.approvedByClient && !it.isDispensed) {
          pendingRequests.push({
            orderId: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            bikeModel: `${o.motorcycleInfo.brand} ${o.motorcycleInfo.model}`,
            itemId: it.id,
            description: it.description,
            partNumber: it.partNumber,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          });
        }
      });
    }
  });

  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock);

  const filteredInventory = inventory.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.partNumber.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.compatibleModels.some((m) => m.toLowerCase().includes(q))
    );
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !partNum) return;
    addInventoryItem({
      partNumber: partNum.toUpperCase(),
      name,
      brand,
      category,
      compatibleModels: compatibles.split(',').map((s) => s.trim()).filter(Boolean),
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      stock: Number(stock),
      minStock: Number(minStock),
      location,
    });
    setPartNum('');
    setName('');
    setCompatibles('');
    setShowAddModal(false);
  };

  const handleRegisterEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryPartId || entryQty <= 0) return;
    adjustInventoryStock(entryPartId, entryQty);
    alert(`¡Se ingresaron ${entryQty} unidades al inventario correctamente!`);
    setEntryQty(5);
  };

  return (
    <div className="space-y-6">
      {/* Submodule navigation */}
      <div className="flex border-b border-neutral-200 bg-white px-4 rounded-xl gap-2 overflow-x-auto text-xs font-bold shadow-2xs">
        <button
          onClick={() => handleTabChange('catalog')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'catalog' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Catálogo & Stock ({inventory.length})
        </button>
        <button
          onClick={() => handleTabChange('requests')}
          className={`py-3 px-3 border-b-2 transition relative ${
            subTab === 'requests' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Surtir a Mecánicos
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#DD040F] text-white text-[10px]">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('low_stock')}
          className={`py-3 px-3 border-b-2 transition relative ${
            subTab === 'low_stock' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Alertas de Reabastecimiento
          {lowStockItems.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#010101] text-white text-[10px]">
              {lowStockItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('entries')}
          className={`py-3 px-3 border-b-2 transition ${
            subTab === 'entries' ? 'border-[#DD040F] text-[#DD040F]' : 'border-transparent text-neutral-500'
          }`}
        >
          Entrada de Mercancía
        </button>
      </div>

      {/* SUBTAB: CATALOG */}
      {subTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Buscar repuesto, N° de parte o modelo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 pl-9 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] placeholder:text-neutral-400 focus:outline-hidden focus:border-[#DD040F]"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-[#010101] focus:outline-hidden"
              >
                <option value="all">Todas las Categorías</option>
                <option value="aceites_fluidos">Aceites & Fluidos</option>
                <option value="frenos">Frenos (Balatas & Pastillas)</option>
                <option value="motor">Motor & Embrague</option>
                <option value="transmision">Transmisión & Cadena</option>
                <option value="electricidad">Electricidad & Bujías</option>
                <option value="filtros">Filtros</option>
                <option value="neumaticos">Neumáticos</option>
                <option value="accesorios">Accesorios</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Repuesto</span>
            </button>
          </div>

          {showAddModal && (
            <form onSubmit={handleCreateItem} className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-[#010101]">Dar de Alta Refacción en Catálogo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Número de Parte *</label>
                  <input
                    type="text"
                    required
                    value={partNum}
                    onChange={(e) => setPartNum(e.target.value)}
                    placeholder="Ej. HIF-HF204"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs font-mono font-bold text-[#010101]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Nombre / Descripción *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Filtro de Aceite Hiflofiltro Racing"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  >
                    <option value="aceites_fluidos">Aceites & Fluidos</option>
                    <option value="frenos">Frenos</option>
                    <option value="motor">Motor</option>
                    <option value="transmision">Transmisión</option>
                    <option value="electricidad">Electricidad</option>
                    <option value="filtros">Filtros</option>
                    <option value="neumaticos">Neumáticos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Precio Compra ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs font-mono text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs font-mono font-bold text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs font-mono text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    min={1}
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs font-mono text-[#010101]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Ubicación Estantería</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Estante B-2"
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Modelos Compatibles (Separar por comas)</label>
                  <input
                    type="text"
                    value={compatibles}
                    onChange={(e) => setCompatibles(e.target.value)}
                    placeholder="Yamaha MT-07, Honda CB650R, Universal 4T..."
                    className="w-full p-2 bg-[#F8F9FA] border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#010101] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-neutral-800"
                >
                  Registrar en Inventario
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] border-b border-neutral-200 font-bold text-neutral-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Número de Parte & Repuesto</th>
                  <th className="p-3">Marca / Categoría</th>
                  <th className="p-3">Compatibilidad</th>
                  <th className="p-3 text-right">P. Compra</th>
                  <th className="p-3 text-right">P. Venta</th>
                  <th className="p-3 text-center">Stock Actual</th>
                  <th className="p-3 text-center">Ajuste Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredInventory.map((item) => {
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50">
                      <td className="p-3">
                        <span className="font-mono text-[10px] font-bold text-[#DD040F] block">{item.partNumber}</span>
                        <strong className="text-[#010101] text-xs block">{item.name}</strong>
                        {item.location && <span className="text-[10px] text-neutral-400">Ub: {item.location}</span>}
                      </td>
                      <td className="p-3 text-neutral-600">
                        <span className="font-semibold block">{item.brand}</span>
                        <span className="text-[10px] text-neutral-400 capitalize">{item.category.replace('_', ' ')}</span>
                      </td>
                      <td className="p-3 text-[11px] text-neutral-500 max-w-xs">
                        {item.compatibleModels.slice(0, 3).join(', ')}
                        {item.compatibleModels.length > 3 && ` +${item.compatibleModels.length - 3}`}
                      </td>
                      <td className="p-3 text-right font-mono text-neutral-500">${item.costPrice}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#010101]">${item.salePrice}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                            isLow ? 'bg-[#DD040F]/15 text-[#DD040F] border border-[#DD040F]/30' : 'bg-[#010101] text-white'
                          }`}
                        >
                          {item.stock} pzas
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => adjustInventoryStock(item.id, -1)}
                            className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 font-bold text-[#010101] text-xs flex items-center justify-center cursor-pointer"
                            title="Restar 1 pza"
                          >
                            -
                          </button>
                          <button
                            onClick={() => adjustInventoryStock(item.id, 1)}
                            className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 font-bold text-[#010101] text-xs flex items-center justify-center cursor-pointer"
                            title="Sumar 1 pza"
                          >
                            +
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

      {/* SUBTAB: REQUESTS FROM TECHNICIANS */}
      {subTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <h3 className="font-extrabold text-sm text-[#010101]">
              Solicitudes de Refacciones Pendientes de Entrega
            </h3>
            <p className="text-xs text-neutral-500">
              Al dar "Aprobar y Surtir", el inventario se descuenta automáticamente en tiempo real.
            </p>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-[#010101] mx-auto mb-2" />
              <p className="font-bold text-[#010101]">Todas las órdenes están al día</p>
              <p>No hay solicitudes pendientes de surtir por mecánicos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-100 text-[#010101]">
                        {req.orderId}
                      </span>
                      <span className="font-extrabold text-sm text-[#010101]">{req.bikeModel}</span>
                      <span className="text-xs text-neutral-500">({req.customerName})</span>
                    </div>
                    <p className="font-bold text-xs text-[#DD040F]">
                      {req.description} {req.partNumber && `[NP: ${req.partNumber}]`}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Cantidad requerida: <strong className="text-[#010101] font-mono">{req.quantity} pza(s)</strong> • Precio venta: ${req.unitPrice}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const res = dispenseInventoryItem(req.orderId, req.itemId);
                      if (!res.success) alert(res.error);
                      else alert('¡Pieza surtida y stock descontado exitosamente!');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DD040F] hover:bg-[#b5030c] text-white font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar y Surtir Pieza</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: LOW STOCK ALERTS */}
      {subTab === 'low_stock' && (
        <div className="space-y-4">
          <div className="bg-[#010101] p-4 rounded-2xl border border-neutral-800 text-white shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#DD040F]" />
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  Alertas de Stock Mínimo ({lowStockItems.length})
                </h3>
                <p className="text-xs text-[#AAA8A9]">Insumos críticos que requieren pedido urgente al proveedor</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {lowStockItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-neutral-300 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#DD040F]">{item.partNumber}</span>
                    <h4 className="font-black text-sm text-[#010101]">{item.name}</h4>
                    <p className="text-xs text-neutral-500">{item.brand} • {item.location}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#DD040F]/10 text-[#DD040F] border border-[#DD040F]/30">
                    Stock: {item.stock} / Min: {item.minStock}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                  <span className="text-neutral-500">Sugerido pedir: {item.minStock * 2 - item.stock} pzas</span>
                  <button
                    onClick={() => adjustInventoryStock(item.id, 5)}
                    className="px-2.5 py-1 bg-[#010101] text-white rounded-lg text-[11px] font-bold hover:bg-neutral-800 transition cursor-pointer"
                  >
                    + Recibir 5 pzas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB: ENTRIES / RECEPCION DE MERCANCIA */}
      {subTab === 'entries' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-[#010101]">Recepción & Entrada de Mercancía de Proveedores</h3>
              <p className="text-xs text-neutral-500">
                Registra compras de refacciones para alimentar existencias y actualizar precios de costo.
              </p>
            </div>

            <form onSubmit={handleRegisterEntry} className="bg-[#F8F9FA] p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Refacción a Reabastecer *</label>
                  <select
                    value={entryPartId}
                    onChange={(e) => setEntryPartId(e.target.value)}
                    required
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-[#010101]"
                  >
                    <option value="">-- Seleccionar de catálogo --</option>
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} [{inv.partNumber}] — Stock Actual: {inv.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Cantidad a Ingresar *</label>
                  <input
                    type="number"
                    min={1}
                    value={entryQty}
                    onChange={(e) => setEntryQty(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono font-bold text-[#010101]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Factura / Remisión</label>
                  <input
                    type="text"
                    value={entryInvoiceRef}
                    onChange={(e) => setEntryInvoiceRef(e.target.value)}
                    placeholder="FAC-1002"
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Proveedor / Distribuidor</label>
                  <input
                    type="text"
                    value={entrySupplier}
                    onChange={(e) => setEntrySupplier(e.target.value)}
                    placeholder="Distribuidor Autorizado Motul / Brembo / NGK"
                    className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs text-[#010101]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                  >
                    + Registrar Entrada
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
