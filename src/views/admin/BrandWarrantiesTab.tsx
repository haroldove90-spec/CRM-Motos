import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { BrandWarranty } from '../../types/crm';
import {
  Tag,
  Building,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  Package,
} from 'lucide-react';

export const BrandWarrantiesTab: React.FC = () => {
  const {
    brandWarranties,
    addBrandWarranty,
    updateBrandWarranty,
    orders,
  } = useCRM();

  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Warranty Claim Form
  const [newBrand, setNewBrand] = useState<BrandWarranty['brand']>('Vento');
  const [newExternalFolio, setNewExternalFolio] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newVin, setNewVin] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newLaborAmount, setNewLaborAmount] = useState<number>(0);
  const [newPartsAmount, setNewPartsAmount] = useState<number>(0);
  const [newPayer, setNewPayer] = useState<'marca' | 'cliente' | 'compartido'>('marca');
  const [newNotes, setNewNotes] = useState('');

  // Productivity and Revenue by Brand
  const brandStats: Record<string, { count: number; laborRevenue: number; partsRevenue: number; warrantiesClaimed: number; warrantiesCollected: number }> = {};

  orders.forEach((o) => {
    const brand = o.motorcycleInfo?.brand || (o as any).motorcycleBrand || 'Otra';
    if (!brandStats[brand]) {
      brandStats[brand] = { count: 0, laborRevenue: 0, partsRevenue: 0, warrantiesClaimed: 0, warrantiesCollected: 0 };
    }
    brandStats[brand].count += 1;
    (o.items || []).forEach((item) => {
      if (item.approvedByClient) {
        if (item.type === 'mano_de_obra') {
          brandStats[brand].laborRevenue += item.totalPrice;
        } else {
          brandStats[brand].partsRevenue += item.totalPrice;
        }
      }
    });
  });

  // Sumar reclamos de garantías por marca
  brandWarranties.forEach((w) => {
    const b = w.brand;
    if (!brandStats[b]) {
      brandStats[b] = { count: 0, laborRevenue: 0, partsRevenue: 0, warrantiesClaimed: 0, warrantiesCollected: 0 };
    }
    brandStats[b].warrantiesClaimed += w.totalToRecover;
    if (w.paymentStatus === 'cobrada') {
      brandStats[b].warrantiesCollected += w.totalToRecover;
    }
  });

  const handleCreateWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newExternalFolio.trim()) return;

    const totalToRec = Number(newLaborAmount) + Number(newPartsAmount);

    addBrandWarranty({
      brand: newBrand,
      externalBrandFolio: newExternalFolio.trim(),
      clientName: newClientName.trim(),
      clientPhone: newClientPhone.trim(),
      motorcycleModel: newModel.trim(),
      vin: newVin.trim().toUpperCase(),
      claimDate: new Date().toISOString().split('T')[0],
      issueDescription: newIssue.trim(),
      evidencePhotos: [],
      partsRequested: [],
      laborAmountToRecover: Number(newLaborAmount),
      partsAmountToRecover: Number(newPartsAmount),
      totalToRecover: totalToRec,
      payerResponsible: newPayer,
      brandResponseStatus: 'en_revision',
      paymentStatus: 'pendiente',
      notes: newNotes.trim() || undefined,
    });

    setNewExternalFolio('');
    setNewClientName('');
    setNewClientPhone('');
    setNewModel('');
    setNewVin('');
    setNewIssue('');
    setNewLaborAmount(0);
    setNewPartsAmount(0);
    setShowAddModal(false);
  };

  const filteredWarranties = brandWarranties.filter((w) => {
    if (brandFilter === 'all') return true;
    return w.brand === brandFilter;
  });

  const totalWarrantiesPending = brandWarranties
    .filter((w) => w.paymentStatus !== 'cobrada')
    .reduce((acc, w) => acc + w.totalToRecover, 0);

  const totalWarrantiesCollected = brandWarranties
    .filter((w) => w.paymentStatus === 'cobrada')
    .reduce((acc, w) => acc + w.totalToRecover, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#DD040F]/10 text-[#DD040F]">
            Garantías Oficiales B2B & Convenios
          </span>
          <h2 className="text-xl font-black text-[#010101] tracking-tight mt-1">
            Marcas, Garantías Oficiales & Cobros a Plantas
          </h2>
          <p className="text-xs text-neutral-500">
            Expedientes de reclamos de garantía (Vento, Dinamo, Italika, etc.), piezas enviadas por planta y facturas por cobrar.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#DD040F] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm shadow-[#DD040F]/30"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Reclamo de Garantía</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Por Cobrar a Marcas (Plantas)
          </span>
          <p className="text-2xl font-black text-rose-600 font-mono">
            ${totalWarrantiesPending.toLocaleString('es-MX')}
          </p>
          <span className="text-[10px] text-neutral-400">Reclamos autorizados o en trámite B2B</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Recuperado de Marcas
          </span>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            ${totalWarrantiesCollected.toLocaleString('es-MX')}
          </p>
          <span className="text-[10px] text-neutral-400">Facturas liquidadas por las armadoras</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
            Marcas con Convenio
          </span>
          <p className="text-2xl font-black text-[#010101] font-mono">
            Vento, Dinamo, Italika, Bajaj
          </p>
          <span className="text-[10px] text-neutral-400">Centros de servicio autorizado</span>
        </div>
      </div>

      {/* Productividad y Ganancias por Marca */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#DD040F]" />
            <h3 className="font-extrabold text-sm text-[#010101]">
              Productividad y Facturación del Taller por Marca de Motocicleta
            </h3>
          </div>
          <span className="text-xs text-neutral-500">Volumen atendido vs Rentabilidad</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Marca de Motocicleta</th>
                <th className="py-3 px-4 text-center">Unidades Atendidas</th>
                <th className="py-3 px-4 text-right">Ingresos Mano de Obra</th>
                <th className="py-3 px-4 text-right">Venta de Refacciones</th>
                <th className="py-3 px-4 text-right">Garantías Reclamadas</th>
                <th className="py-3 px-4 text-right font-black text-[#010101]">Total Generado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {Object.entries(brandStats).map(([brandName, stats]) => {
                const totalBrand = stats.laborRevenue + stats.partsRevenue + stats.warrantiesClaimed;
                return (
                  <tr key={brandName} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3 px-4 font-bold text-[#010101] flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#DD040F]" />
                      <span>{brandName}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-neutral-800">
                      {stats.count} motos
                    </td>
                    <td className="py-3 px-4 text-right font-mono">${stats.laborRevenue.toLocaleString('es-MX')}</td>
                    <td className="py-3 px-4 text-right font-mono">${stats.partsRevenue.toLocaleString('es-MX')}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700 font-bold">
                      ${stats.warrantiesClaimed.toLocaleString('es-MX')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-[#010101]">
                      ${totalBrand.toLocaleString('es-MX')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expedientes de Garantías */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#DD040F]" />
            <h3 className="font-extrabold text-sm text-[#010101]">
              Expedientes de Reclamos de Garantía a Marcas
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 font-medium outline-none focus:ring-1 focus:ring-[#DD040F]"
            >
              <option value="all">Todas las marcas</option>
              <option value="Vento">Vento</option>
              <option value="Dinamo">Dinamo</option>
              <option value="Italika">Italika</option>
              <option value="Bajaj">Bajaj</option>
              <option value="Yamaha">Yamaha</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3 px-4">Marca / Folio Planta</th>
                <th className="py-3 px-4">Cliente / Moto</th>
                <th className="py-3 px-4">Falla Dictaminada</th>
                <th className="py-3 px-4 text-right">Mano Obra ($)</th>
                <th className="py-3 px-4 text-right">Piezas ($)</th>
                <th className="py-3 px-4 text-right font-bold">Total a Cobrar</th>
                <th className="py-3 px-4 text-center">Dictamen Marca</th>
                <th className="py-3 px-4 text-center">Cobro Marca</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredWarranties.map((w) => (
                <tr key={w.id} className="hover:bg-neutral-50/80 transition">
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-neutral-900 text-white">
                      {w.brand}
                    </span>
                    <p className="font-mono font-bold text-[#DD040F] text-[11px] mt-1">
                      {w.externalBrandFolio}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-[#010101]">{w.clientName}</p>
                    <span className="text-[10px] text-neutral-500">{w.motorcycleModel} • VIN: {w.vin || 'S/VIN'}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-neutral-600 line-clamp-2">
                    {w.issueDescription}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">${w.laborAmountToRecover.toLocaleString('es-MX')}</td>
                  <td className="py-3 px-4 text-right font-mono">${w.partsAmountToRecover.toLocaleString('es-MX')}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                    ${w.totalToRecover.toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        w.brandResponseStatus === 'autorizada'
                          ? 'bg-emerald-50 text-emerald-700'
                          : w.brandResponseStatus === 'en_revision'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {w.brandResponseStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        w.paymentStatus === 'cobrada'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {w.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {w.paymentStatus !== 'cobrada' && (
                      <button
                        onClick={() => {
                          updateBrandWarranty(w.id, {
                            paymentStatus: 'cobrada',
                            brandPaidDate: new Date().toISOString().split('T')[0],
                          });
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition"
                      >
                        Marcar Cobrada
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO RECLAMO DE GARANTÍA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-neutral-200 max-h-[90vh] flex flex-col">
            <div className="bg-[#010101] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-black text-sm">Registrar Reclamo de Garantía a Marca</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateWarranty} className="p-5 space-y-3 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Marca *</label>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value as any)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                  >
                    <option value="Vento">Vento</option>
                    <option value="Dinamo">Dinamo</option>
                    <option value="Italika">Italika</option>
                    <option value="Bajaj">Bajaj</option>
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Folio Externo / Ticket Planta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: VT-GAR-2026-981"
                    value={newExternalFolio}
                    onChange={(e) => setNewExternalFolio(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Modelo de Moto</label>
                  <input
                    type="text"
                    placeholder="Ej: Nitrox 250 T3"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">VIN / Serie del Chasis</label>
                  <input
                    type="text"
                    placeholder="3VTC..."
                    value={newVin}
                    onChange={(e) => setNewVin(e.target.value.toUpperCase())}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Dictamen / Falla Reportada a la Marca *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Descripción técnica del defecto de fábrica..."
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Mano de Obra a Cobrar ($ MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newLaborAmount || ''}
                    onChange={(e) => setNewLaborAmount(parseFloat(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Refacciones a Cobrar ($ MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPartsAmount || ''}
                    onChange={(e) => setNewPartsAmount(parseFloat(e.target.value))}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 font-mono font-bold outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#DD040F] text-white rounded-xl font-bold hover:bg-red-700"
                >
                  Registrar Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
