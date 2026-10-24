import React, { useRef, useState } from 'react';
import { ServiceOrder } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import { Printer, Download, X, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HojaDeServicioPDFModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const HojaDeServicioPDFModal: React.FC<HojaDeServicioPDFModalProps> = ({ order, onClose }) => {
  const { settings } = useCRM();
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Default inventory items if not explicitly set
  const inventory = order.checkIn.motoInventory || {
    espejos: 'si',
    asiento: 'si',
    faroDelantero: 'si',
    luzFaroTrasero: 'si',
    direccionales: 'si',
    cubiertasCompletas: 'si',
    taponGasolina: 'si',
    tacometros: 'si',
    pedales: 'si',
    parabrisas: 'no',
    claxon: 'si',
  };

  // Default service activities if not explicitly set
  const activities = order.checkIn.serviceActivities || {
    ajusteFrenos: true,
    ajusteLubricacionCadena: true,
    revisionNiveles: true,
    carburacion: false,
    cambioAceiteMotor: true,
    cambioBujia: false,
    lubricacionAjusteChicotes: true,
    revisionPunterias: false,
    revisionLimpiezaSedazoAceite: true,
    revisionLimpiezaFiltroAire: true,
    ajusteTornilleria: true,
    verificacionElectrica: true,
  };

  const INVENTORY_ROWS = [
    { key: 'espejos', label: 'ESPEJOS' },
    { key: 'asiento', label: 'ASIENTO' },
    { key: 'faroDelantero', label: 'FARO DELANTERO' },
    { key: 'luzFaroTrasero', label: 'LUZ DE FARO TRASERO' },
    { key: 'direccionales', label: 'DIRECCIONALES' },
    { key: 'cubiertasCompletas', label: 'CUBIERTAS COMPLETAS' },
    { key: 'taponGasolina', label: 'TAPÓN DE GASOLINA' },
    { key: 'tacometros', label: 'TACOMETROS' },
    { key: 'pedales', label: 'PEDALES' },
    { key: 'parabrisas', label: 'PARABRISAS' },
    { key: 'claxon', label: 'CLAXON' },
  ] as const;

  const SERVICE_ACTIVITY_ROWS = [
    { key: 'ajusteFrenos', label: 'Ajuste de frenos.' },
    { key: 'ajusteLubricacionCadena', label: 'Ajuste y lubricación de la cadena (solo algunos modelos).' },
    { key: 'revisionNiveles', label: 'Revisión de niveles (líquido de frenos, presión de llantas).' },
    { key: 'carburacion', label: 'Carburación.' },
    { key: 'cambioAceiteMotor', label: 'Cambio de aceite de motor.' },
    { key: 'cambioBujia', label: 'Cambio de bujía.' },
    { key: 'lubricacionAjusteChicotes', label: 'Lubricación y ajuste de chicotes.' },
    { key: 'revisionPunterias', label: 'Revisión de punterías.' },
    { key: 'revisionLimpiezaSedazoAceite', label: 'Revisión y limpieza del sedazo del aceite.' },
    { key: 'revisionLimpiezaFiltroAire', label: 'Revisión y limpieza del filtro de aire.' },
    { key: 'ajusteTornilleria', label: 'Ajuste de tornillería (tazas, ejes, estribos, barras, soportes de motor).' },
    { key: 'verificacionElectrica', label: 'Verificación eléctrica: régimen de carga batería, luces y claxon.' },
  ] as const;

  // Date formatting
  const orderDate = new Date(order.createdAt);
  const day = orderDate.getDate().toString().padStart(2, '0');
  const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
  const year = orderDate.getFullYear().toString();

  // Fuel level needle rotation: 0% = -45deg, 25% = -22.5deg, 50% = 0deg, 75% = 22.5deg, 100% = 45deg
  const fuelAngle = -45 + ((order.checkIn.fuelLevel || 50) / 100) * 90;

  // Export directly as PDF with jsPDF and html2canvas
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      pdf.save(`Hoja_de_Servicio_QROMOTOS_${order.id}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Hubo un error al generar el PDF. Abriendo vista de impresión...');
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  // Max 8 rows to match the physical printed sheet
  const displayItems = [...order.items];
  while (displayItems.length < 8) {
    displayItems.push({
      id: `placeholder-${displayItems.length}`,
      description: '',
      type: 'mano_de_obra',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      approvedByClient: true,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-[#010101] text-white border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm sm:text-base">Hoja de Servicio Oficial QROMOTOS</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#DD040F] text-white font-mono text-xs font-bold">
              {order.orderNumber || order.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>
            <button
              onClick={handleNativePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition border border-neutral-700 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#DD040F]" />
              <span>Imprimir Formato</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#AAA8A9] hover:text-white hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container with Sheet Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-neutral-100 flex justify-center">
          {/* Printable Sheet (exact duplicate of the uploaded physical form) */}
          <div
            id="hoja-servicio-oficial"
            ref={printRef}
            className="w-full max-w-[800px] bg-white p-6 sm:p-8 text-[#010101] font-sans border-2 border-black shadow-lg box-border select-text"
            style={{ minHeight: '1050px' }}
          >
            {/* 1. Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-3">
              {/* Logo on Left */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
                <img
                  src="https://appdesignproyectos.com/qromotoslogo.png"
                  alt="QROMOTOS Logo"
                  className="w-full h-full object-contain"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Center Company Information */}
              <div className="text-center flex-1 px-3">
                <h1 className="font-black text-xl sm:text-2xl tracking-[0.25em] text-[#010101]">
                  Q R O M O T O S
                </h1>
                <p className="font-extrabold text-xs sm:text-sm text-[#DD040F] uppercase tracking-wider mt-0.5">
                  Refacciones y Accesorios para Motocicletas
                </p>
                <h2 className="font-bold text-sm sm:text-base text-[#010101] mt-0.5">
                  Luis Horacio Aguilar Pliego
                </h2>
                <p className="text-[10px] sm:text-[11px] text-neutral-800 font-medium leading-tight mt-1">
                  Matriz: Av. Const. Ote. #17 Col. San Francisquito, C.P. 76058, Qro
                </p>
                <p className="text-[10px] sm:text-[11px] text-neutral-800 font-medium leading-tight">
                  Sucursal: Av. de la Luz #344A, Col. Satélite, C.P. 76110, Qro.
                </p>
              </div>

              {/* Right Phones & Service Order Box */}
              <div className="w-48 text-right shrink-0">
                <p className="text-[10px] font-bold text-[#010101]">
                  Constituyentes <strong className="text-xs">(442) 224 9069</strong>
                </p>
                <p className="text-[10px] font-bold text-[#010101] mt-0.5">
                  Av. De la Luz <strong className="text-xs">(442) 736 1361</strong>
                </p>

                <div className="mt-2 border-2 border-black rounded-xl overflow-hidden text-center">
                  <div className="bg-[#010101] text-white font-black text-xs sm:text-sm py-1 tracking-wider">
                    HOJA DE SERVICIO
                  </div>
                  <div className="py-2 bg-white font-mono font-black text-xl text-[#DD040F]">
                    {order.orderNumber || order.id.replace(/[^0-9]/g, '') || '1001'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Customer & Vehicle Box (Grid with borders) */}
            <div className="border-2 border-black border-t-0 text-xs">
              {/* Row 1: Nombre */}
              <div className="flex border-b border-black p-2 bg-neutral-50/50">
                <span className="font-extrabold w-20 text-[#010101]">Nombre:</span>
                <span className="font-bold text-sm text-[#010101] flex-1">{order.customerName}</span>
              </div>

              {/* Row 2: Tel & Marca */}
              <div className="grid grid-cols-2 border-b border-black">
                <div className="flex p-2 border-r border-black">
                  <span className="font-extrabold w-20 text-[#010101]">Tel:</span>
                  <span className="font-semibold text-[#010101] font-mono">{order.customerPhone}</span>
                </div>
                <div className="flex p-2">
                  <span className="font-extrabold w-20 text-[#010101]">Marca:</span>
                  <span className="font-bold text-[#010101]">{order.motorcycleInfo.brand}</span>
                </div>
              </div>

              {/* Row 3: Serie & Kilometraje & Modelo */}
              <div className="grid grid-cols-3">
                <div className="flex p-2 border-r border-black">
                  <span className="font-extrabold w-14 text-[#010101]">Serie:</span>
                  <span className="font-mono text-[11px] truncate">{order.motorcycleInfo.vin || 'S/N'}</span>
                </div>
                <div className="flex p-2 border-r border-black">
                  <span className="font-extrabold w-20 text-[#010101]">Kilometraje:</span>
                  <span className="font-mono font-bold">{order.checkIn.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex p-2">
                  <span className="font-extrabold w-16 text-[#010101]">Modelo:</span>
                  <span className="font-bold text-[#010101]">{order.motorcycleInfo.model} ({order.motorcycleInfo.year})</span>
                </div>
              </div>
            </div>

            {/* 3. Middle Section: Inventario de la Moto + Actividades del Servicio + Diagramas */}
            <div className="grid grid-cols-12 border-2 border-black border-t-0">
              {/* Left Column: Inventario de la Moto (Width: 4 cols) */}
              <div className="col-span-4 border-r-2 border-black p-2.5">
                <h3 className="font-black text-xs text-[#010101] uppercase tracking-tight text-center pb-1.5 border-b border-neutral-300">
                  INVENTARIO DE LA MOTO
                </h3>

                {/* Table headers: SI / NO / ROTO O DAÑADO */}
                <div className="flex items-center justify-between text-[9px] font-black text-neutral-600 pt-1 pb-0.5 px-0.5">
                  <span className="w-28 text-left">CONCEPTO</span>
                  <div className="flex gap-2 text-center w-24 justify-end">
                    <span className="w-4">SI</span>
                    <span className="w-4">NO</span>
                    <span className="w-8 text-[8px] leading-tight">ROTO</span>
                  </div>
                </div>

                <div className="divide-y divide-neutral-200 text-[10px]">
                  {INVENTORY_ROWS.map((row) => {
                    const val = inventory[row.key as keyof typeof inventory] || 'si';
                    return (
                      <div key={row.key} className="flex items-center justify-between py-1">
                        <span className="font-semibold text-[#010101] text-[10px] truncate max-w-[110px]">
                          {row.label}
                        </span>
                        <div className="flex gap-2 text-center w-24 justify-end items-center">
                          {/* SI circle */}
                          <div
                            className={`w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center ${
                              val === 'si' ? 'bg-[#010101] text-white' : 'bg-white'
                            }`}
                          >
                            {val === 'si' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          {/* NO circle */}
                          <div
                            className={`w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center ${
                              val === 'no' ? 'bg-[#010101] text-white' : 'bg-white'
                            }`}
                          >
                            {val === 'no' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          {/* ROTO circle */}
                          <div
                            className={`w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center ${
                              val === 'roto_danado' ? 'bg-[#DD040F] text-white border-[#DD040F]' : 'bg-white'
                            }`}
                          >
                            {val === 'roto_danado' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Actividades del Servicio + Diagramas (Width: 8 cols) */}
              <div className="col-span-8 flex flex-col justify-between p-2.5">
                {/* Header */}
                <div className="border border-black bg-neutral-100 py-1 text-center font-black text-xs text-[#010101] tracking-wider mb-2">
                  ACTIVIDADES DEL SERVICIO
                </div>

                {/* 2-column list of service checklist activities */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] leading-tight">
                  {SERVICE_ACTIVITY_ROWS.map((act) => {
                    const isChecked = !!activities[act.key as keyof typeof activities];
                    return (
                      <div key={act.key} className="flex items-start gap-1.5">
                        <div
                          className={`w-3.5 h-3.5 border border-black rounded-xs shrink-0 flex items-center justify-center mt-0.5 ${
                            isChecked ? 'bg-[#010101] text-white' : 'bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-[#010101] ${isChecked ? 'font-bold' : 'font-normal'}`}>
                          {act.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Diagrams Section: Motorcycle Silhouette + Fuel Gauge + Date */}
                <div className="mt-3 pt-2 border-t border-dashed border-neutral-400 flex items-center justify-between">
                  {/* Motorcycle Top-Down Diagram */}
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Diagrama de Daños / Inspección
                    </span>
                    <div className="relative w-40 h-20 flex items-center justify-center">
                      <svg viewBox="0 0 200 90" className="w-full h-full text-neutral-800">
                        {/* Motorcycle top-down silhouette */}
                        {/* Wheels */}
                        <ellipse cx="25" cy="45" rx="14" ry="7" fill="#010101" />
                        <ellipse cx="175" cy="45" rx="16" ry="9" fill="#010101" />
                        {/* Forks / Front */}
                        <path d="M 25 45 L 60 45" stroke="#010101" strokeWidth="6" />
                        {/* Handlebar */}
                        <path d="M 55 15 L 60 45 L 55 75" stroke="#010101" strokeWidth="4" strokeLinecap="round" />
                        {/* Mirrors */}
                        <circle cx="50" cy="12" r="3" fill="#DD040F" />
                        <circle cx="50" cy="78" r="3" fill="#DD040F" />
                        {/* Fuel Tank */}
                        <path d="M 65 30 Q 95 24 110 32 L 110 58 Q 95 66 65 60 Z" fill="#262626" />
                        {/* Seat */}
                        <path d="M 110 33 Q 135 32 155 36 L 155 54 Q 135 58 110 57 Z" fill="#010101" />
                        {/* Tail / Rear fender */}
                        <path d="M 155 38 L 180 43 L 180 47 L 155 52 Z" fill="#525252" />
                        {/* Exhaust pipe */}
                        <path d="M 100 62 L 165 64" stroke="#737373" strokeWidth="5" strokeLinecap="round" />
                      </svg>

                      {/* Overlaid damage points if registered */}
                      {(order.checkIn.diagramPoints || []).map((pt) => (
                        <div
                          key={pt.id}
                          style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-[#DD040F] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs"
                          title={pt.label}
                        >
                          !
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fuel Gauge (Medidor de Gasolina) */}
                  <div className="w-28 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                      Nivel Gasolina
                    </span>
                    <div className="relative w-20 h-12 flex items-center justify-center">
                      <svg viewBox="0 0 100 60" className="w-full h-full">
                        {/* Dial background arc */}
                        <path
                          d="M 15 50 A 40 40 0 0 1 85 50"
                          fill="none"
                          stroke="#e5e5e5"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        {/* Dial active arc */}
                        <path
                          d="M 15 50 A 40 40 0 0 1 85 50"
                          fill="none"
                          stroke="#010101"
                          strokeWidth="4"
                          strokeDasharray="110"
                          strokeDashoffset={110 - (110 * (order.checkIn.fuelLevel || 50)) / 100}
                        />
                        {/* Tick marks */}
                        <line x1="15" y1="50" x2="22" y2="47" stroke="#010101" strokeWidth="2" />
                        <line x1="50" y1="10" x2="50" y2="18" stroke="#010101" strokeWidth="2" />
                        <line x1="85" y1="50" x2="78" y2="47" stroke="#010101" strokeWidth="2" />
                        {/* E and F labels */}
                        <text x="10" y="58" fontSize="10" fontWeight="bold" fill="#DD040F">E</text>
                        <text x="83" y="58" fontSize="10" fontWeight="bold" fill="#010101">F</text>
                        {/* Needle */}
                        <g transform={`rotate(${fuelAngle} 50 50)`}>
                          <line x1="50" y1="50" x2="50" y2="15" stroke="#DD040F" strokeWidth="2.5" strokeLinecap="round" />
                          <circle cx="50" cy="50" r="4" fill="#010101" />
                        </g>
                      </svg>
                    </div>
                    <span className="text-[10px] font-mono font-black text-[#DD040F]">
                      {order.checkIn.fuelLevel || 50}%
                    </span>
                  </div>

                  {/* Date section */}
                  <div className="w-28 text-center text-xs">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Fecha Ingreso</span>
                    <div className="font-mono font-bold text-sm border-b border-black pb-0.5 inline-block px-2">
                      {day} / {month} / {year}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Observaciones */}
            <div className="border-2 border-black border-t-0 p-2.5">
              <span className="font-black text-xs text-[#010101] uppercase block mb-1">
                Observaciones:
              </span>
              <p className="text-xs text-neutral-800 font-medium min-h-[36px] leading-relaxed whitespace-pre-wrap">
                {order.checkIn.observations || order.reasonForVisit || 'Revisión y servicio preventivo general'}
              </p>
            </div>

            {/* 5. Conceptos / Repuestos & Mano de Obra Table */}
            <div className="border-2 border-black border-t-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#010101] text-white font-black text-[10px] uppercase">
                    <th className="py-1 px-2 border-r border-neutral-700 w-20 text-center">CLAVE</th>
                    <th className="py-1 px-2 border-r border-neutral-700 w-12 text-center">No.</th>
                    <th className="py-1 px-3 border-r border-neutral-700">CONCEPTO</th>
                    <th className="py-1 px-3 text-right w-28">IMPORTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black text-[11px]">
                  {displayItems.slice(0, 8).map((it, idx) => (
                    <tr key={it.id || idx} className="h-6">
                      <td className="px-2 py-0.5 border-r border-black font-mono text-center text-[10px]">
                        {it.clave || (it.description ? `SRV-${idx + 1}` : '')}
                      </td>
                      <td className="px-2 py-0.5 border-r border-black font-mono text-center text-[10px]">
                        {it.quantity > 0 ? it.quantity : (it.description ? 1 : '')}
                      </td>
                      <td className="px-3 py-0.5 border-r border-black font-medium">
                        {it.description}
                      </td>
                      <td className="px-3 py-0.5 text-right font-mono font-bold">
                        {it.totalPrice > 0 ? `$${it.totalPrice.toLocaleString()}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 6. Footer: Disclaimer + Totals */}
            <div className="border-2 border-black border-t-0 grid grid-cols-12">
              {/* Disclaimer Note */}
              <div className="col-span-8 p-2.5 border-r-2 border-black flex flex-col justify-center text-[8.5px] leading-tight text-neutral-800 font-semibold uppercase">
                <p className="font-black text-[#DD040F] mb-1">
                  NOTA: EN PARTES ELECTRICAS NO HAY GARANTIAS
                </p>
                <p>
                  LOS SERVICIOS, REPARACIONES Y/O MANTENIMIENTOS SOLICITADOS EN LA ORDEN DE TRABAJO ANTES MENCIONADA SE EJECUTARON EN SU TOTALIDAD Y A MI ENTERA SATISFACCIÓN.
                </p>
              </div>

              {/* Subtotal, IVA, Total */}
              <div className="col-span-4 p-2 text-xs divide-y divide-black flex flex-col justify-center">
                <div className="flex justify-between py-1">
                  <span className="font-bold text-[10px] text-neutral-600">SUBTOTAL</span>
                  <span className="font-mono font-bold">${order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-bold text-[10px] text-neutral-600">I.V.A ({settings.taxPercentage}%)</span>
                  <span className="font-mono font-bold">${order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 bg-neutral-100 px-1 font-black text-sm">
                  <span className="text-[#010101]">TOTAL</span>
                  <span className="font-mono text-[#DD040F]">${order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 7. Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-8 text-center text-[10px] font-bold">
              <div>
                <div className="border-b-2 border-black h-8 mx-auto w-4/5" />
                <span className="block mt-1 uppercase tracking-wider text-[#010101]">
                  CLIENTE ENTREGA
                </span>
                <span className="text-[9px] text-neutral-500 font-normal block font-mono">Firma al ingresar</span>
              </div>
              <div>
                <div className="border-b-2 border-black h-8 mx-auto w-4/5 flex items-center justify-center">
                  <span className="text-[9px] text-[#DD040F] font-bold tracking-wider">QROMOTOS TALLER</span>
                </div>
                <span className="block mt-1 uppercase tracking-wider text-[#010101]">
                  QRO MOTOS
                </span>
                <span className="text-[9px] text-neutral-500 font-normal block">Asesor de Servicio</span>
              </div>
              <div>
                <div className="border-b-2 border-black h-8 mx-auto w-4/5 flex items-center justify-center">
                  {order.checkoutSignature && (
                    <span className="text-[8px] font-mono text-[#010101] font-bold">Firma Registrada</span>
                  )}
                </div>
                <span className="block mt-1 uppercase tracking-wider text-[#010101]">
                  CLIENTE RECEPCIÓN
                </span>
                <span className="text-[9px] text-neutral-500 font-normal block font-mono">Conformidad de entrega</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
