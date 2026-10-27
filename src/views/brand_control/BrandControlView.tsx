import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  BrandControlKey,
  BrandVentoRecord,
  BrandDinamoRecord,
  BrandMBRecord,
  BrandBDSRecord,
  BrandVelociRecord,
  BrandCarabelaRecord,
} from '../../types/crm';
import {
  Tag,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  Bike,
  ShieldAlert,
  Building,
  CheckCircle,
  AlertCircle,
  Hash,
  DollarSign,
  Calendar,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface BrandConfig {
  key: BrandControlKey;
  name: string;
  tabBg: string;
  tabText: string;
  activeBorder: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

const BRANDS: BrandConfig[] = [
  {
    key: 'vento',
    name: 'Vento',
    tabBg: 'bg-red-600 text-white hover:bg-red-700',
    tabText: 'text-white',
    activeBorder: 'border-red-600',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    badgeText: 'text-red-700',
    description: 'Control de VIN, Tickets, Activaciones, Ventonet y Facturación Vento',
  },
  {
    key: 'dinamo',
    name: 'Dinamo',
    tabBg: 'bg-neutral-900 text-white hover:bg-neutral-800',
    tabText: 'text-white',
    activeBorder: 'border-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-800',
    description: 'Control de Chasis, Agencias, Gestores, Prepago y Cobranza Dinamo',
  },
  {
    key: 'mb',
    name: 'MB',
    tabBg: 'bg-purple-700 text-white hover:bg-purple-800',
    tabText: 'text-white',
    activeBorder: 'border-purple-600',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'text-purple-700',
    description: 'Control de Tiendas, Folio de Cobro, Armado y Garantías MB Motos',
  },
  {
    key: 'bds',
    name: 'BDS',
    tabBg: 'bg-amber-600 text-white hover:bg-amber-700',
    tabText: 'text-white',
    activeBorder: 'border-amber-600',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeText: 'text-amber-800',
    description: 'Control de Modelos, Facturas y Cobro por Unidad BDS Motos',
  },
  {
    key: 'veloci',
    name: 'VELOCI',
    tabBg: 'bg-yellow-400 text-neutral-900 hover:bg-yellow-500 font-bold',
    tabText: 'text-neutral-900',
    activeBorder: 'border-yellow-500',
    badgeBg: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    badgeText: 'text-yellow-900',
    description: 'Control de VIN, Armado, Activación, Garantía y Cobranza Veloci',
  },
  {
    key: 'carabela',
    name: 'CARABELA',
    tabBg: 'bg-emerald-800 text-white hover:bg-emerald-900',
    tabText: 'text-white',
    activeBorder: 'border-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-800',
    description: 'Control Oficial de Garantías, Armado y Cobro Carabela',
  },
];

interface BrandControlViewProps {
  activeModule?: string;
  onSelectModule?: (mod: string) => void;
}

export const BrandControlView: React.FC<BrandControlViewProps> = ({
  activeModule = 'vento',
  onSelectModule,
}) => {
  const {
    brandControlData,
    addBrandControlRecord,
    updateBrandControlRecord,
    deleteBrandControlRecord,
  } = useCRM();

  const [activeBrand, setActiveBrand] = useState<BrandControlKey>(() => {
    if (activeModule && ['vento', 'dinamo', 'mb', 'bds', 'veloci', 'carabela'].includes(activeModule)) {
      return activeModule as BrandControlKey;
    }
    return 'vento';
  });

  useEffect(() => {
    if (activeModule && ['vento', 'dinamo', 'mb', 'bds', 'veloci', 'carabela'].includes(activeModule)) {
      setActiveBrand(activeModule as BrandControlKey);
    }
  }, [activeModule]);

  const handleBrandChange = (brandKey: BrandControlKey) => {
    setActiveBrand(brandKey);
    if (onSelectModule) {
      onSelectModule(brandKey);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);
  const [editRecord, setEditRecord] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  const currentBrandConfig = BRANDS.find((b) => b.key === activeBrand) || BRANDS[0];
  const records: any[] = (brandControlData[activeBrand] || []) as any[];

  // Filtered records
  const filteredRecords: any[] = records.filter((r: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.vin && r.vin.toLowerCase().includes(term)) ||
      (r.chasis && r.chasis.toLowerCase().includes(term)) ||
      (r.modelo && r.modelo.toLowerCase().includes(term)) ||
      (r.ticket && r.ticket.toLowerCase().includes(term)) ||
      (r.tienda && r.tienda.toLowerCase().includes(term)) ||
      (r.agencia && r.agencia.toLowerCase().includes(term)) ||
      (r.estados && r.estados.toLowerCase().includes(term)) ||
      (r.estado && r.estado.toLowerCase().includes(term))
    );
  });

  // Open add modal initialized for current brand
  const handleOpenAddModal = () => {
    const today = new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    if (activeBrand === 'vento') {
      setFormData({
        vin: '',
        ticket: '',
        modelo: 'REPTILE 200',
        fecha: today,
        armado: false,
        activado: true,
        cotizacion: '',
        garantia: '',
        tienda: 'MAVI MOMPANI',
        ventonet: 'SI',
        facturado: 'NO',
        pagado: 'NO',
        estados: 'AUT. PENDIENTE',
      });
    } else if (activeBrand === 'dinamo') {
      setFormData({
        chasis: '',
        modelo: 'HEAVYMAX',
        fecha: today,
        agencia: 'AGENCIA QUERÉTARO',
        armado: false,
        activado: false,
        garantia: true,
        servicioPrepagado: false,
        gestor: 'Lic. Morales',
        facturado: 'SI',
        cantidad: 900,
        numeroFactura: '',
        cobrado: 'NO',
      });
    } else if (activeBrand === 'mb') {
      setFormData({
        vin: '',
        fecha: today,
        modelo: 'HORNET 250',
        tienda: 'MB MOTOS QUERÉTARO',
        armado: true,
        activado: true,
        garantia: false,
        estado: 'AUTORIZADO',
        folioPCobro: '',
        facturado: 'NO',
        pagado: 'NO',
      });
    } else if (activeBrand === 'bds') {
      setFormData({
        vin: '',
        modelo: 'CASTORO',
        fecha: today,
        armado: false,
        activado: true,
        garantia: true,
        facturado: 'SI',
        cantidad: 1500,
        numeroDeFactura: '',
        cobrado: 'NO',
      });
    } else if (activeBrand === 'veloci') {
      setFormData({
        vin: '',
        fecha: today,
        armado: true,
        activado: true,
        garantia: false,
        facturado: 'NO',
        cobrado: 'NO',
        modelo: 'RAZZER 250',
      });
    } else if (activeBrand === 'carabela') {
      setFormData({
        vin: '',
        fecha: today,
        armado: true,
        activado: false,
        garantia: true,
        facturado: 'NO',
        cobrado: 'NO',
        modelo: 'MILESTONE 150',
      });
    }
    setShowAddModal(true);
  };

  const handleOpenEditModal = (rec: any) => {
    setEditRecord(rec);
    setFormData({ ...rec });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addBrandControlRecord(activeBrand, formData);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    updateBrandControlRecord(activeBrand, editRecord.id, formData);
    setEditRecord(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro del historial de la marca?')) {
      deleteBrandControlRecord(activeBrand, id);
    }
  };

  // EXCEL EXPORT (matching exactly the user images)
  const handleExportToExcel = () => {
    let rowsToExport: any[] = [];

    if (activeBrand === 'vento') {
      rowsToExport = filteredRecords.map((r: any) => ({
        VIN: r.vin || '',
        TICKET: r.ticket || '',
        MODELO: r.modelo || '',
        FECHA: r.fecha || '',
        ARMADO: r.armado ? 'X' : '',
        ACTIVADO: r.activado ? 'X' : '',
        COTIZACION: r.cotizacion || '',
        GARANTIA: r.garantia || '',
        TIENDA: r.tienda || '',
        VENTONET: r.ventonet || 'NO',
        FACTURADO: r.facturado || 'NO',
        PAGADO: r.pagado || 'NO',
        ESTADOS: r.estados || '',
      }));
    } else if (activeBrand === 'dinamo') {
      rowsToExport = filteredRecords.map((r: any) => ({
        CHASIS: r.chasis || '',
        MODELO: r.modelo || '',
        FECHA: r.fecha || '',
        AGENCIA: r.agencia || '',
        ARMADO: r.armado ? 'X' : '',
        ACTIVADO: r.activado ? 'X' : '',
        GARANTIA: r.garantia ? 'X' : '',
        'SERVICIO PREPAGADO': r.servicioPrepagado ? 'X' : '',
        GESTOR: r.gestor || '',
        FACTURADO: r.facturado || 'NO',
        CANTIDAD: r.cantidad ? `$${Number(r.cantidad).toFixed(2)}` : '',
        'NUMERO FACTURA': r.numeroFactura || '',
        COBRADO: r.cobrado || 'NO',
      }));
    } else if (activeBrand === 'mb') {
      rowsToExport = filteredRecords.map((r: any) => ({
        VIN: r.vin || '',
        FECHA: r.fecha || '',
        MODELO: r.modelo || '',
        TIENDA: r.tienda || '',
        ARMADO: r.armado ? 'X' : '',
        ACTIVADO: r.activado ? 'X' : '',
        GARANTIA: r.garantia ? 'X' : '',
        ESTADO: r.estado || '',
        'FOLIO P COBRO': r.folioPCobro || '',
        FACTURADO: r.facturado || 'NO',
        PAGADO: r.pagado || 'NO',
      }));
    } else if (activeBrand === 'bds') {
      rowsToExport = filteredRecords.map((r: any) => ({
        VIN: r.vin || '',
        MODELO: r.modelo || '',
        FECHA: r.fecha || '',
        ARMADO: r.armado ? 'X' : '',
        ACTIVADO: r.activado ? 'X' : '',
        GARANTIA: r.garantia ? 'X' : '',
        FACTURADO: r.facturado || 'NO',
        CANTIDAD: r.cantidad ? `$${Number(r.cantidad).toFixed(2)}` : '',
        'NUMERO DE FACTURA': r.numeroDeFactura || '',
        COBRADO: r.cobrado || 'NO',
      }));
    } else if (activeBrand === 'veloci') {
      rowsToExport = filteredRecords.map((r: any) => ({
        VIN: r.vin || '',
        FECHA: r.fecha || '',
        ARMADO: r.armado ? 'X' : '',
        ACTIVADO: r.activado ? 'X' : '',
        GARANTIA: r.garantia ? 'X' : '',
        FACTURADO: r.facturado || 'NO',
        COBRADO: r.cobrado || 'NO',
      }));
    } else if (activeBrand === 'carabela') {
      rowsToExport = filteredRecords.map((r: any) => ({
        VIN: r.vin || '',
        FECHA: r.fecha || '',
        ARMADO: r.armado ? 'X' : '',
        ACTIVADO: r.activado ? 'X' : '',
        GARANTIA: r.garantia ? 'X' : '',
        FACTURADO: r.facturado || 'NO',
        COBRADO: r.cobrado || 'NO',
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeBrand.toUpperCase());
    XLSX.writeFile(
      wb,
      `Control_Marcas_${activeBrand.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#DD040F]/10 text-[#DD040F] rounded-xl">
              <Tag className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-[#010101]">
              Control de Marcas Oficiales (Taller Técnico)
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Gestión y seguimiento de armado, activación, garantías, facturación y cobro por cada marca comercial.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar en Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#010101] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Registro ({currentBrandConfig.name})</span>
          </button>
        </div>
      </div>


      {/* Active Brand Information & Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase ${currentBrandConfig.tabBg}`}
            >
              {currentBrandConfig.name}
            </span>
            <span className="text-xs text-neutral-500">
              Historial de Registros ({filteredRecords.length} mostrados)
            </span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por VIN, Modelo, Folio, Tienda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
            />
          </div>
        </div>

        {/* TABLE COMPONENT DEDICATED TO CURRENT BRAND */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          {activeBrand === 'vento' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#010101] text-white font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3">VIN</th>
                  <th className="py-2.5 px-3">TICKET</th>
                  <th className="py-2.5 px-3">MODELO</th>
                  <th className="py-2.5 px-3">FECHA</th>
                  <th className="py-2.5 px-2 text-center">ARMADO</th>
                  <th className="py-2.5 px-2 text-center">ACTIVADO</th>
                  <th className="py-2.5 px-2 text-center">COTIZACION</th>
                  <th className="py-2.5 px-2 text-center">GARANTIA</th>
                  <th className="py-2.5 px-3">TIENDA</th>
                  <th className="py-2.5 px-2 text-center">VENTONET</th>
                  <th className="py-2.5 px-2 text-center">FACTURADO</th>
                  <th className="py-2.5 px-2 text-center">PAGADO</th>
                  <th className="py-2.5 px-3">ESTADOS</th>
                  <th className="py-2.5 px-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white font-mono">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-neutral-400 font-sans">
                      No hay registros capturados para Vento con este criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition">
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{r.vin}</td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.ticket}</td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">{r.modelo}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{r.fecha}</td>
                      <td className="py-2.5 px-2 text-center font-black text-neutral-800">
                        {r.armado ? 'X' : ''}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black text-neutral-800">
                        {r.activado ? 'X' : ''}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-neutral-600">
                        {r.cotizacion || ''}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-neutral-600">
                        {r.garantia || ''}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.tienda}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`font-black ${
                            r.ventonet === 'SI' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {r.ventonet}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`font-black ${
                            r.facturado === 'SI' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {r.facturado}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`font-black ${
                            r.pagado === 'SI' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {r.pagado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.estados === 'CERRADO' || r.estados === 'PAGO APROBADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.estados === 'RECHAZADO'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.estados}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setViewRecord(r)}
                            title="Ver detalle"
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            title="Editar"
                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            title="Eliminar"
                            className="p-1 hover:bg-red-50 rounded text-red-600"
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
          )}

          {activeBrand === 'dinamo' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#010101] text-white font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3">CHASIS</th>
                  <th className="py-2.5 px-3">MODELO</th>
                  <th className="py-2.5 px-3">FECHA</th>
                  <th className="py-2.5 px-3">AGENCIA</th>
                  <th className="py-2.5 px-2 text-center">ARMADO</th>
                  <th className="py-2.5 px-2 text-center">ACTIVADO</th>
                  <th className="py-2.5 px-2 text-center">GARANTIA</th>
                  <th className="py-2.5 px-2 text-center">SERVICIO PREPAGADO</th>
                  <th className="py-2.5 px-3">GESTOR</th>
                  <th className="py-2.5 px-2 text-center">FACTURADO</th>
                  <th className="py-2.5 px-3 text-right">CANTIDAD</th>
                  <th className="py-2.5 px-3">NUMERO FACTURA</th>
                  <th className="py-2.5 px-2 text-center">COBRADO</th>
                  <th className="py-2.5 px-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white font-mono">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-neutral-400 font-sans">
                      No hay registros capturados para Dinamo con este criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition">
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{r.chasis}</td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">{r.modelo}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{r.fecha}</td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.agencia || '-'}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.armado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.activado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black text-emerald-700">
                        {r.garantia ? 'X' : ''}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black">
                        {r.servicioPrepagado ? 'X' : ''}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.gestor || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.facturado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.facturado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-neutral-900">
                        ${Number(r.cantidad || 0).toLocaleString('es-MX')}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.numeroFactura || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.cobrado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.cobrado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setViewRecord(r)}
                            title="Ver detalle"
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            title="Editar"
                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            title="Eliminar"
                            className="p-1 hover:bg-red-50 rounded text-red-600"
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
          )}

          {activeBrand === 'mb' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#010101] text-white font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3">VIN</th>
                  <th className="py-2.5 px-3">FECHA</th>
                  <th className="py-2.5 px-3">MODELO</th>
                  <th className="py-2.5 px-3">TIENDA</th>
                  <th className="py-2.5 px-2 text-center">ARMADO</th>
                  <th className="py-2.5 px-2 text-center">ACTIVADO</th>
                  <th className="py-2.5 px-2 text-center">GARANTIA</th>
                  <th className="py-2.5 px-3">ESTADO</th>
                  <th className="py-2.5 px-3">FOLIO P COBRO</th>
                  <th className="py-2.5 px-2 text-center">FACTURADO</th>
                  <th className="py-2.5 px-2 text-center">PAGADO</th>
                  <th className="py-2.5 px-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white font-mono">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-neutral-400 font-sans">
                      No hay registros capturados para MB Motos.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition">
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{r.vin}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{r.fecha}</td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">{r.modelo}</td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.tienda}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.armado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.activado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.garantia ? 'X' : ''}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                          {r.estado || 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-800">
                        {r.folioPCobro || '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.facturado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.facturado}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.pagado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.pagado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setViewRecord(r)}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
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
          )}

          {activeBrand === 'bds' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#010101] text-white font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3">VIN</th>
                  <th className="py-2.5 px-3">MODELO</th>
                  <th className="py-2.5 px-3">FECHA</th>
                  <th className="py-2.5 px-2 text-center">ARMADO</th>
                  <th className="py-2.5 px-2 text-center">ACTIVADO</th>
                  <th className="py-2.5 px-2 text-center">GARANTIA</th>
                  <th className="py-2.5 px-2 text-center">FACTURADO</th>
                  <th className="py-2.5 px-3 text-right">CANTIDAD</th>
                  <th className="py-2.5 px-3">NUMERO DE FACTURA</th>
                  <th className="py-2.5 px-2 text-center">COBRADO</th>
                  <th className="py-2.5 px-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white font-mono">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-neutral-400 font-sans">
                      No hay registros capturados para BDS.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition">
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{r.vin}</td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">{r.modelo}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{r.fecha}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.armado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.activado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.garantia ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">
                        <span className={r.facturado === 'SI' || r.facturado === 'X' ? 'text-emerald-600' : 'text-red-600'}>
                          {r.facturado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-neutral-900">
                        ${Number(r.cantidad || 0).toLocaleString('es-MX')}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.numeroDeFactura || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.cobrado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.cobrado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setViewRecord(r)}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
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
          )}

          {activeBrand === 'veloci' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#010101] text-white font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3">VIN</th>
                  <th className="py-2.5 px-3">FECHA</th>
                  <th className="py-2.5 px-3">MODELO</th>
                  <th className="py-2.5 px-2 text-center">ARMADO</th>
                  <th className="py-2.5 px-2 text-center">ACTIVADO</th>
                  <th className="py-2.5 px-2 text-center">GARANTIA</th>
                  <th className="py-2.5 px-2 text-center">FACTURADO</th>
                  <th className="py-2.5 px-2 text-center">COBRADO</th>
                  <th className="py-2.5 px-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white font-mono">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-neutral-400 font-sans">
                      No hay registros capturados para VELOCI.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition">
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{r.vin}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{r.fecha}</td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">{r.modelo || 'N/A'}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.armado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.activado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.garantia ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.facturado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.facturado}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.cobrado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.cobrado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setViewRecord(r)}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
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
          )}

          {activeBrand === 'carabela' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#010101] text-white font-mono font-bold">
                <tr>
                  <th className="py-2.5 px-3">VIN</th>
                  <th className="py-2.5 px-3">FECHA</th>
                  <th className="py-2.5 px-3">MODELO</th>
                  <th className="py-2.5 px-2 text-center">ARMADO</th>
                  <th className="py-2.5 px-2 text-center">ACTIVADO</th>
                  <th className="py-2.5 px-2 text-center">GARANTIA</th>
                  <th className="py-2.5 px-2 text-center">FACTURADO</th>
                  <th className="py-2.5 px-2 text-center">COBRADO</th>
                  <th className="py-2.5 px-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white font-mono">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-neutral-400 font-sans">
                      No hay registros capturados para CARABELA.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r: any) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition">
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{r.vin}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{r.fecha}</td>
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">{r.modelo || 'N/A'}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.armado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.activado ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center font-black">{r.garantia ? 'X' : ''}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.facturado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.facturado}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={r.cobrado === 'SI' ? 'text-emerald-600 font-black' : 'text-red-600 font-black'}>
                          {r.cobrado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setViewRecord(r)}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-600"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
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
          )}
        </div>
      </div>

      {/* MODAL: NUEVO REGISTRO / EDITAR REGISTRO */}
      {(showAddModal || editRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-neutral-200">
            <div className={`px-5 py-4 text-white flex items-center justify-between ${currentBrandConfig.tabBg}`}>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <h3 className="font-black text-sm">
                  {showAddModal ? `Nuevo Registro: ${currentBrandConfig.name}` : `Editar Registro: ${currentBrandConfig.name}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditRecord(null);
                }}
                className="text-white/80 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {/* VENTO FORM */}
              {activeBrand === 'vento' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">VIN / Chasis *</label>
                      <input
                        type="text"
                        required
                        value={formData.vin || ''}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                        placeholder="3MUNAFBC7N005694"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">TICKET *</label>
                      <input
                        type="text"
                        required
                        value={formData.ticket || ''}
                        onChange={(e) => setFormData({ ...formData, ticket: e.target.value })}
                        placeholder="2001523545"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">MODELO</label>
                      <input
                        type="text"
                        value={formData.modelo || ''}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        placeholder="REPTILE 200, YUMA 250, DAKAR 330"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FECHA</label>
                      <input
                        type="text"
                        value={formData.fecha || ''}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        placeholder="19/10/2026"
                        className="w-full border border-neutral-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.armado}
                        onChange={(e) => setFormData({ ...formData, armado: e.target.checked })}
                        className="accent-red-600 w-4 h-4"
                      />
                      <span>ARMADO (X)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.activado}
                        onChange={(e) => setFormData({ ...formData, activado: e.target.checked })}
                        className="accent-red-600 w-4 h-4"
                      />
                      <span>ACTIVADO (X)</span>
                    </label>
                    <div>
                      <label className="block text-[10px] text-neutral-500 font-bold">COTIZACION</label>
                      <input
                        type="text"
                        value={formData.cotizacion || ''}
                        onChange={(e) => setFormData({ ...formData, cotizacion: e.target.value })}
                        placeholder="? o X"
                        className="w-full border border-neutral-300 rounded p-1 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 font-bold">GARANTIA</label>
                      <input
                        type="text"
                        value={formData.garantia || ''}
                        onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                        placeholder="? o X"
                        className="w-full border border-neutral-300 rounded p-1 text-center font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">TIENDA / SUCURSAL</label>
                    <input
                      type="text"
                      value={formData.tienda || ''}
                      onChange={(e) => setFormData({ ...formData, tienda: e.target.value })}
                      placeholder="MAVI MOMPANI, MAVI CORREGIDORA, 108 QUERETARO"
                      className="w-full border border-neutral-300 rounded-lg p-2"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">VENTONET</label>
                      <select
                        value={formData.ventonet || 'NO'}
                        onChange={(e) => setFormData({ ...formData, ventonet: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FACTURADO</label>
                      <select
                        value={formData.facturado || 'NO'}
                        onChange={(e) => setFormData({ ...formData, facturado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">PAGADO</label>
                      <select
                        value={formData.pagado || 'NO'}
                        onChange={(e) => setFormData({ ...formData, pagado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">ESTADOS</label>
                      <select
                        value={formData.estados || 'AUT. PENDIENTE'}
                        onChange={(e) => setFormData({ ...formData, estados: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-bold"
                      >
                        <option value="AUT. PENDIENTE">AUT. PENDIENTE</option>
                        <option value="CERRADO">CERRADO</option>
                        <option value="PAGO APROBADO">PAGO APROBADO</option>
                        <option value="REVISION DE DAÑOS">REVISION DE DAÑOS</option>
                        <option value="RECHAZADO">RECHAZADO</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* DINAMO FORM */}
              {activeBrand === 'dinamo' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">CHASIS (VIN) *</label>
                      <input
                        type="text"
                        required
                        value={formData.chasis || ''}
                        onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                        placeholder="3CUM2AHX9VX000181"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">MODELO</label>
                      <input
                        type="text"
                        value={formData.modelo || ''}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        placeholder="HEAVYMAX"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FECHA</label>
                      <input
                        type="text"
                        value={formData.fecha || ''}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        placeholder="13/10/2026"
                        className="w-full border border-neutral-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">AGENCIA</label>
                      <input
                        type="text"
                        value={formData.agencia || ''}
                        onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                        placeholder="AGENCIA QUERÉTARO"
                        className="w-full border border-neutral-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.armado}
                        onChange={(e) => setFormData({ ...formData, armado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>ARMADO</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.activado}
                        onChange={(e) => setFormData({ ...formData, activado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>ACTIVADO</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.garantia}
                        onChange={(e) => setFormData({ ...formData, garantia: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>GARANTIA</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.servicioPrepagado}
                        onChange={(e) => setFormData({ ...formData, servicioPrepagado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>PREPAGADO</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">GESTOR</label>
                      <input
                        type="text"
                        value={formData.gestor || ''}
                        onChange={(e) => setFormData({ ...formData, gestor: e.target.value })}
                        placeholder="Lic. Morales"
                        className="w-full border border-neutral-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">CANTIDAD ($ MXN)</label>
                      <input
                        type="number"
                        value={formData.cantidad || 0}
                        onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                        placeholder="900"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">NUMERO FACTURA</label>
                      <input
                        type="text"
                        value={formData.numeroFactura || ''}
                        onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
                        placeholder="FAC-DNM-881"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FACTURADO</label>
                      <select
                        value={formData.facturado || 'NO'}
                        onChange={(e) => setFormData({ ...formData, facturado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">COBRADO</label>
                      <select
                        value={formData.cobrado || 'NO'}
                        onChange={(e) => setFormData({ ...formData, cobrado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* MB FORM */}
              {activeBrand === 'mb' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">VIN / Chasis *</label>
                      <input
                        type="text"
                        required
                        value={formData.vin || ''}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                        placeholder="3MB2026X991823"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FECHA</label>
                      <input
                        type="text"
                        value={formData.fecha || ''}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        placeholder="15/10/2026"
                        className="w-full border border-neutral-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">MODELO</label>
                      <input
                        type="text"
                        value={formData.modelo || ''}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        placeholder="HORNET 250"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">TIENDA</label>
                      <input
                        type="text"
                        value={formData.tienda || ''}
                        onChange={(e) => setFormData({ ...formData, tienda: e.target.value })}
                        placeholder="MB MOTOS QUERÉTARO"
                        className="w-full border border-neutral-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.armado}
                        onChange={(e) => setFormData({ ...formData, armado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>ARMADO (X)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.activado}
                        onChange={(e) => setFormData({ ...formData, activado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>ACTIVADO (X)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.garantia}
                        onChange={(e) => setFormData({ ...formData, garantia: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>GARANTIA (X)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">ESTADO</label>
                      <input
                        type="text"
                        value={formData.estado || ''}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        placeholder="AUTORIZADO / PENDIENTE / CERRADO"
                        className="w-full border border-neutral-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FOLIO P COBRO</label>
                      <input
                        type="text"
                        value={formData.folioPCobro || ''}
                        onChange={(e) => setFormData({ ...formData, folioPCobro: e.target.value })}
                        placeholder="MB-COB-094"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FACTURADO</label>
                      <select
                        value={formData.facturado || 'NO'}
                        onChange={(e) => setFormData({ ...formData, facturado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">PAGADO</label>
                      <select
                        value={formData.pagado || 'NO'}
                        onChange={(e) => setFormData({ ...formData, pagado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* BDS FORM */}
              {activeBrand === 'bds' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">VIN / Chasis *</label>
                      <input
                        type="text"
                        required
                        value={formData.vin || ''}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                        placeholder="3BDS8827361524"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">MODELO</label>
                      <input
                        type="text"
                        value={formData.modelo || ''}
                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        placeholder="CASTORO"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">FECHA</label>
                    <input
                      type="text"
                      value={formData.fecha || ''}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      placeholder="16/10/2026"
                      className="w-full border border-neutral-300 rounded-lg p-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.armado}
                        onChange={(e) => setFormData({ ...formData, armado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>ARMADO (X)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.activado}
                        onChange={(e) => setFormData({ ...formData, activado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>ACTIVADO (X)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.garantia}
                        onChange={(e) => setFormData({ ...formData, garantia: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>GARANTIA (X)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">CANTIDAD ($ MXN)</label>
                      <input
                        type="number"
                        value={formData.cantidad || 0}
                        onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                        placeholder="1500"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">NUMERO DE FACTURA</label>
                      <input
                        type="text"
                        value={formData.numeroDeFactura || ''}
                        onChange={(e) => setFormData({ ...formData, numeroDeFactura: e.target.value })}
                        placeholder="125"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FACTURADO</label>
                      <select
                        value={formData.facturado || 'SI'}
                        onChange={(e) => setFormData({ ...formData, facturado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                        <option value="X">X</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">COBRADO</label>
                    <select
                      value={formData.cobrado || 'NO'}
                      onChange={(e) => setFormData({ ...formData, cobrado: e.target.value })}
                      className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                    >
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </div>
                </>
              )}

              {/* VELOCI & CARABELA FORMS */}
              {(activeBrand === 'veloci' || activeBrand === 'carabela') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">VIN / Chasis *</label>
                      <input
                        type="text"
                        required
                        value={formData.vin || ''}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                        placeholder="VIN de la unidad"
                        className="w-full border border-neutral-300 rounded-lg p-2 font-mono font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FECHA</label>
                      <input
                        type="text"
                        value={formData.fecha || ''}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        placeholder="DD/MM/AAAA"
                        className="w-full border border-neutral-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">MODELO (Opcional)</label>
                    <input
                      type="text"
                      value={formData.modelo || ''}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      placeholder="Modelo de la motocicleta"
                      className="w-full border border-neutral-300 rounded-lg p-2 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.armado}
                        onChange={(e) => setFormData({ ...formData, armado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>ARMADO</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.activado}
                        onChange={(e) => setFormData({ ...formData, activado: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>ACTIVADO</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-neutral-700">
                      <input
                        type="checkbox"
                        checked={!!formData.garantia}
                        onChange={(e) => setFormData({ ...formData, garantia: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>GARANTIA</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">FACTURADO</label>
                      <select
                        value={formData.facturado || 'NO'}
                        onChange={(e) => setFormData({ ...formData, facturado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">COBRADO</label>
                      <select
                        value={formData.cobrado || 'NO'}
                        onChange={(e) => setFormData({ ...formData, cobrado: e.target.value })}
                        className="w-full border border-neutral-300 rounded-lg p-2 font-black"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditRecord(null);
                  }}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 font-bold rounded-xl hover:bg-neutral-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-bold rounded-xl shadow-xs transition cursor-pointer ${currentBrandConfig.tabBg}`}
                >
                  {showAddModal ? 'Guardar Registro' : 'Actualizar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-200">
            <div className={`px-5 py-4 text-white flex items-center justify-between ${currentBrandConfig.tabBg}`}>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <h3 className="font-black text-sm">
                  Detalle del Registro ({currentBrandConfig.name})
                </h3>
              </div>
              <button
                onClick={() => setViewRecord(null)}
                className="text-white/80 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                  <span className="text-neutral-500 font-bold">VIN / CHASIS:</span>
                  <span className="font-mono font-black text-neutral-900">{viewRecord.vin || viewRecord.chasis}</span>
                </div>
                {viewRecord.ticket && (
                  <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                    <span className="text-neutral-500 font-bold">TICKET:</span>
                    <span className="font-mono font-bold text-neutral-800">{viewRecord.ticket}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                  <span className="text-neutral-500 font-bold">MODELO:</span>
                  <span className="font-bold text-neutral-800">{viewRecord.modelo || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                  <span className="text-neutral-500 font-bold">FECHA:</span>
                  <span className="font-mono text-neutral-700">{viewRecord.fecha}</span>
                </div>
                {(viewRecord.tienda || viewRecord.agencia) && (
                  <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                    <span className="text-neutral-500 font-bold">TIENDA / AGENCIA:</span>
                    <span className="font-bold text-neutral-800">{viewRecord.tienda || viewRecord.agencia}</span>
                  </div>
                )}
                {viewRecord.gestor && (
                  <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                    <span className="text-neutral-500 font-bold">GESTOR:</span>
                    <span className="font-bold text-neutral-800">{viewRecord.gestor}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                  <span className="text-neutral-500 font-bold">ARMADO / ACTIVADO:</span>
                  <span className="font-bold text-neutral-800">
                    Armado: {viewRecord.armado ? 'SÍ' : 'NO'} | Activado: {viewRecord.activado ? 'SÍ' : 'NO'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                  <span className="text-neutral-500 font-bold">GARANTÍA:</span>
                  <span className="font-bold text-neutral-800">
                    {typeof viewRecord.garantia === 'boolean'
                      ? viewRecord.garantia ? 'SÍ' : 'NO'
                      : viewRecord.garantia || 'NO'}
                  </span>
                </div>
                {viewRecord.cantidad !== undefined && (
                  <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                    <span className="text-neutral-500 font-bold">CANTIDAD / IMPORTE:</span>
                    <span className="font-mono font-black text-neutral-900">
                      ${Number(viewRecord.cantidad).toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                )}
                {(viewRecord.numeroFactura || viewRecord.numeroDeFactura) && (
                  <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                    <span className="text-neutral-500 font-bold">NO. FACTURA:</span>
                    <span className="font-mono font-bold text-neutral-800">
                      {viewRecord.numeroFactura || viewRecord.numeroDeFactura}
                    </span>
                  </div>
                )}
                {viewRecord.ventonet && (
                  <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                    <span className="text-neutral-500 font-bold">VENTONET:</span>
                    <span className={`font-black ${viewRecord.ventonet === 'SI' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {viewRecord.ventonet}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                  <span className="text-neutral-500 font-bold">FACTURADO:</span>
                  <span className={`font-black ${viewRecord.facturado === 'SI' || viewRecord.facturado === 'X' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {viewRecord.facturado}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-neutral-200">
                  <span className="text-neutral-500 font-bold">COBRADO / PAGADO:</span>
                  <span className={`font-black ${viewRecord.cobrado === 'SI' || viewRecord.pagado === 'SI' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {viewRecord.cobrado || viewRecord.pagado}
                  </span>
                </div>
                {(viewRecord.estados || viewRecord.estado) && (
                  <div className="flex justify-between pt-1">
                    <span className="text-neutral-500 font-bold">ESTADO OFICIAL:</span>
                    <span className="font-bold text-neutral-900 px-2 py-0.5 bg-neutral-200 rounded">
                      {viewRecord.estados || viewRecord.estado}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewRecord(null)}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold cursor-pointer hover:bg-neutral-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const BrandControlTab = BrandControlView;
