import React, { useRef, useState } from 'react';
import { ProfecoContract } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import { Printer, Download, X, ShieldCheck, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ProfecoContractPDFModalProps {
  contract: ProfecoContract;
  onClose: () => void;
}

export const ProfecoContractPDFModal: React.FC<ProfecoContractPDFModalProps> = ({ contract, onClose }) => {
  const { settings } = useCRM();
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.95);

  // Formatted date
  const contractDateObj = new Date(contract.date + 'T12:00:00');
  const formattedDate = !isNaN(contractDateObj.getTime())
    ? contractDateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : contract.date;

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(printRef.current, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter', // 215.9 x 279.4 mm
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Full bleed Carta
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Contrato_PROFECO_${contract.contractNumber.replace(/\s+/g, '_')}_${contract.customerName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Hubo un error al generar el archivo PDF. Se abrirá la vista de impresión para guardar como PDF.');
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const regNum = contract.profecoRegistrationNumber || settings.profecoRegistrationNumber || '5126-2025';
  const regDate = contract.profecoRegistrationDate || settings.profecoRegistrationDate || '25 de septiembre de 2025';
  const repName = contract.providerRepresentative || contract.providerName || settings.legalName || 'Luis Horacio Aguilar Pliego';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-hidden">
      {/* Top Fixed Control Bar - Never overlaps the sheet */}
      <header className="w-full bg-[#010101] text-white px-4 py-2.5 flex items-center justify-between border-b border-neutral-800 shadow-xl shrink-0 print:hidden z-50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#DD040F] rounded-lg">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xs sm:text-sm text-white tracking-wide">
                Contrato Oficial PROFECO (Hoja Tamaño Carta Completa)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold border border-neutral-700">
                {contract.contractNumber}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 hidden sm:block">
              Aprobado y registrado ante la Procuraduría Federal del Consumidor (PROFECO) • NOM-174-SCFI-2007
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded-full px-2 py-1 text-xs text-neutral-300 mr-2">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.65, prev - 0.1))}
              className="p-1 hover:text-white transition"
              title="Reducir vista"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-10 text-center font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(1.3, prev + 0.1))}
              className="p-1 hover:text-white transition"
              title="Aumentar vista"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(0.95)}
              className="p-1 hover:text-[#DD040F] transition"
              title="Restablecer tamaño normal"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleNativePrint}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white px-3.5 py-1.5 rounded-full font-bold text-xs transition border border-neutral-700 shadow-xs cursor-pointer"
            title="Imprimir directamente en hoja tamaño carta"
          >
            <Printer className="w-3.5 h-3.5 text-[#DD040F]" />
            <span className="hidden sm:inline">Imprimir Carta</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-[#DD040F] hover:bg-red-700 text-white px-4 py-1.5 rounded-full font-bold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
            title="Descargar en PDF tamaño carta"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition ml-1 cursor-pointer"
            title="Cerrar vista previa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Scrollable Viewport with letter sheet centered */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-auto p-4 sm:p-6 flex justify-center items-start">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="pb-12"
        >
          {/*
            OFFICIAL LETTER SHEET (215.9mm x 279.4mm)
            Spans the full printable area of Carta paper (8.5 x 11 inches) exactly like the physical sample!
          */}
          <div
            ref={printRef}
            id="profeco-print-sheet"
            className="bg-white text-black font-sans shadow-2xl border border-neutral-300 flex flex-col justify-between print:border-none print:shadow-none select-text"
            style={{
              width: '215.9mm',
              height: '279.4mm',
              minHeight: '279.4mm',
              maxHeight: '279.4mm',
              padding: '6.5mm 8mm 6.5mm 8mm',
              boxSizing: 'border-box',
              fontSize: '6.5px',
              lineHeight: 1.25,
            }}
          >
            {/* 1. INSTITUTIONAL HEADER (Matching QROMOTOS Physical Format) */}
            <div>
              <div className="flex items-start justify-between border-b-2 border-[#DD040F] pb-1.5 mb-1.5">
                <div className="flex items-center gap-2.5">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="QROMOTOS"
                      className="h-11 w-auto object-contain max-w-[125px]"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="bg-[#010101] text-white font-black text-xs px-2.5 py-1 rounded">
                      QROMOTOS
                    </div>
                  )}
                  <div>
                    <h1 className="font-black text-[12px] tracking-tight text-[#010101] uppercase leading-none">
                      QROMOTOS
                    </h1>
                    <div className="text-[7.5px] font-black text-[#DD040F] uppercase tracking-wider leading-none mt-0.5">
                      REFACCIONES Y ACCESORIOS PARA MOTOCICLETAS
                    </div>
                    <div className="text-[8px] font-extrabold text-[#010101] mt-0.5 leading-tight">
                      {repName} • RFC: <span className="font-mono">{contract.providerRfc || settings.taxId || 'AUPL650426864'}</span>
                    </div>
                    <div className="text-[6.5px] text-neutral-600 leading-tight">
                      Matriz: Av. Const. Ote. #17 Col. San Francisquito, C.P. 76058, Qro. • Sucursal: Av. de la Luz #344A, Col. Satélite, Qro.
                    </div>
                    <div className="text-[6.5px] text-neutral-600 leading-tight">
                      Constituyentes: (442) 224 9069 • Av. De la Luz: (442) 736 1361 • qromotos@gmail.com
                    </div>
                  </div>
                </div>

                {/* PROFECO Registration Box */}
                <div className="text-right border border-neutral-400 rounded p-1.5 bg-neutral-50 min-w-[185px]">
                  <div className="flex items-center justify-end gap-1 text-[#DD040F] font-black text-[8px] uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#DD040F]" />
                    <span>CONTRATO DE ADHESIÓN PROFECO</span>
                  </div>
                  <div className="text-[8px] font-bold text-neutral-900 mt-0.5">
                    FOLIO: <span className="font-mono text-black font-black text-[10px]">{contract.contractNumber}</span>
                  </div>
                  <div className="text-[6.8px] text-neutral-700 leading-tight">
                    Registro Oficial PROFECO: <strong className="font-mono">{regNum}</strong>
                  </div>
                  <div className="text-[6.4px] text-neutral-600 leading-tight">
                    Fecha de Registro: {regDate}
                  </div>
                  <div className="text-[6.2px] text-neutral-500 font-mono mt-0.5">
                    NOM-174-SCFI-2007
                  </div>
                </div>
              </div>

              {/* 2. CARÁTULA COMPACTA DE DATOS (4 Box Grid - Client, Vehicle, Economics) */}
              <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-[6.6px] leading-[1.2] border border-neutral-300 rounded p-1.5 bg-neutral-50/60">
                {/* Prestador */}
                <div className="border-r border-neutral-300 pr-1.5">
                  <span className="font-black text-[#DD040F] block border-b border-neutral-200 pb-0.5 mb-0.5 uppercase text-[6.5px]">
                    I. Prestador del Servicio
                  </span>
                  <p className="font-extrabold text-[#010101] truncate">{repName}</p>
                  <p className="truncate">RFC: <strong className="font-mono">{contract.providerRfc || 'AUPL650426864'}</strong></p>
                  <p className="truncate">Tel: {contract.providerPhone || '(442) 224 9069'}</p>
                  <p className="truncate text-neutral-600">Horario: {contract.scheduleAttention || 'L-V 10:00 a 18:00, S 10:00 a 14:00'}</p>
                </div>

                {/* Consumidor */}
                <div className="border-r border-neutral-300 pr-1.5">
                  <span className="font-black text-[#DD040F] block border-b border-neutral-200 pb-0.5 mb-0.5 uppercase text-[6.5px]">
                    II. El Consumidor (Cliente)
                  </span>
                  <p className="font-extrabold text-[#010101] truncate">{contract.customerName}</p>
                  <p className="truncate">Tel: <strong className="font-mono">{contract.customerPhone}</strong></p>
                  <p className="truncate text-neutral-600">{contract.customerAddress || 'Domicilio señalado en recepción'}</p>
                  {contract.customerRfc && <p className="truncate font-mono">RFC: {contract.customerRfc}</p>}
                </div>

                {/* Motocicleta */}
                <div className="border-r border-neutral-300 pr-1.5">
                  <span className="font-black text-[#DD040F] block border-b border-neutral-200 pb-0.5 mb-0.5 uppercase text-[6.5px]">
                    III. Motocicleta / Unidad
                  </span>
                  <p className="font-extrabold text-[#010101] truncate">{contract.motorcycleBrand} {contract.motorcycleModel} ({contract.motorcycleYear})</p>
                  <p className="truncate">Placas: <strong className="font-mono">{contract.motorcyclePlate || 'S/P'}</strong> • Color: {contract.motorcycleColor || 'N/E'}</p>
                  <p className="truncate font-mono">VIN: <span className="font-bold">{contract.motorcycleVin || 'VERIFICADO'}</span></p>
                  <p className="truncate font-mono">Km: {contract.motorcycleMileage || '0'} km</p>
                </div>

                {/* Presupuesto */}
                <div className="bg-white p-1 rounded border border-neutral-200">
                  <span className="font-black text-[#DD040F] block border-b border-neutral-200 pb-0.5 mb-0.5 uppercase text-[6.5px]">
                    IV. Presupuesto & Plazos
                  </span>
                  <div className="flex justify-between">
                    <span>Total Presupuesto:</span>
                    <strong className="font-mono text-[7px] text-[#010101]">${contract.agreedBudget.toLocaleString('es-MX')}</strong>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Anticipo:</span>
                    <strong className="font-mono text-green-700">${contract.deposit.toLocaleString('es-MX')}</strong>
                  </div>
                  <div className="flex justify-between font-bold border-t border-neutral-200 pt-0.5 mt-0.5 text-[#010101]">
                    <span>Saldo Entrega:</span>
                    <strong className="font-mono text-[#DD040F]">${contract.pendingBalance.toLocaleString('es-MX')}</strong>
                  </div>
                  <p className="text-[6px] text-neutral-500 mt-0.5 truncate">
                    Compromiso: <strong>{contract.deliveryDate || 'Fecha pactada'}</strong>
                  </p>
                </div>
              </div>

              {/* 3. PROEMIO OFICIAL (Verbatim from Physical Sample) */}
              <div className="text-justify mb-1.5 px-2 py-1 bg-neutral-100/90 rounded border border-neutral-200 text-[6.4px] leading-[1.25]">
                <p className="font-bold text-[#010101]">
                  CONTRATO DE PRESTACIÓN DE SERVICIOS DE REPARACIÓN Y/O MANTENIMIENTO DE MOTOCICLETA, QUE CELEBRAN POR UNA PARTE <span className="uppercase text-[#DD040F]">{repName}</span>, COMO "EL PRESTADOR DEL SERVICIO" Y POR LA OTRA PARTE <span className="uppercase text-[#DD040F]">{contract.customerName}</span> COMO "EL CONSUMIDOR", CUYOS NOMBRES Y DATOS CONSTAN EN LA CARÁTULA DE ESTE CONTRATO COMO PARTE INTEGRAL DEL MISMO, SUJETÁNDOSE AL TENOR DE LAS SIGUIENTES:
                </p>
              </div>
            </div>

            {/* 4. TWO-COLUMN DENSE LEGAL BODY (DECLARACIONES & CLAUSULAS 1 TO 20) */}
            <div className="grid grid-cols-2 gap-3 text-justify leading-[8.2px] text-[6.3px] text-neutral-900 border-t border-b border-neutral-300 py-1.5 mb-1.5 flex-1 overflow-hidden">
              {/* COLUMN 1: DECLARACIONES & CLAUSULAS PRIMERA A OCTAVA */}
              <div className="space-y-1 pr-1.5 border-r border-neutral-200">
                <div>
                  <p className="font-black uppercase tracking-wider text-[7px] text-[#DD040F] mb-0.5">
                    DECLARACIONES
                  </p>
                  <p className="font-extrabold text-[6.6px] text-black">I. Declara "EL PRESTADOR DEL SERVICIO":</p>
                  <p>
                    <strong>a)</strong> Es una persona física de nacionalidad mexicana y con suficiente capacidad legal para obligarse en los términos del presente Contrato.
                  </p>
                  <p>
                    <strong>b)</strong> Su domicilio se encuentra ubicado en el establecimiento señalado en la carátula de este contrato, el cual señala como domicilio convencional para todos los efectos legales.
                  </p>
                  <p>
                    <strong>c)</strong> Se encuentra inscrita en el Registro Federal de Contribuyentes con la clave indicada en la carátula del presente contrato.
                  </p>
                  <p>
                    <strong>d)</strong> Cuenta con la infraestructura, los elementos propios, los recursos técnicos y humanos suficientes para cumplir con sus obligaciones conforme a lo establecido en el presente Contrato.
                  </p>
                  <p>
                    <strong>e)</strong> Cumple con las licencias, permisos, avisos, certificados y autorizaciones previstas en las disposiciones legales y normas vigentes que correspondan.
                  </p>
                  <p>
                    <strong>f)</strong> Para la atención de dudas, aclaraciones, reclamaciones o servicios de orientación, señala el teléfono y correo electrónico indicados en la carátula, con su respectivo horario de atención.
                  </p>
                  <p>
                    <strong>g)</strong> Indica a EL CONSUMIDOR el costo total del servicio objeto del presente Contrato.
                  </p>

                  <p className="font-extrabold text-[6.6px] text-black mt-1">II. Declara "EL CONSUMIDOR":</p>
                  <p>
                    <strong>a)</strong> Llamarse como ha quedado plasmado en el proemio y carátula de este contrato.
                  </p>
                  <p>
                    <strong>b)</strong> Que es su deseo obligarse en los términos y condiciones del presente contrato, contando con la capacidad legal para su celebración.
                  </p>
                  <p>
                    <strong>c)</strong> Su domicilio se encuentra ubicado en el lugar señalado en la carátula del presente contrato.
                  </p>
                  <p>
                    <strong>d)</strong> Se encuentra inscrito en el Registro Federal de Contribuyentes con la clave manifestada en la carátula.
                  </p>
                  <p className="italic text-[6px] text-neutral-600 mt-0.5">
                    En virtud de las Declaraciones anteriores, "Las partes" convienen en obligarse conforme a las siguientes:
                  </p>
                </div>

                <div>
                  <p className="font-black uppercase tracking-wider text-[7px] text-[#DD040F] mt-1 mb-0.5">
                    CLÁUSULAS
                  </p>
                  <p>
                    <strong>PRIMERA.</strong> EL PRESTADOR DEL SERVICIO realizará todas las operaciones y composturas descritas en el anverso del presente contrato, solicitadas por EL CONSUMIDOR, a las que se someterá la motocicleta para obtener condiciones de funcionamiento de acuerdo al estado de ésta. Asimismo, EL PRESTADOR DEL SERVICIO no condicionará la prestación de los servicios a la adquisición o renta de otros productos o servicios en el establecimiento o en otro taller o agencia predeterminada.
                  </p>
                  <p>
                    <strong>SEGUNDA.</strong> El precio total de los servicios contratados se establece en el presupuesto que forma parte del presente y se describe en el anverso, el cual será pagado por EL CONSUMIDOR de la forma siguiente: al momento de celebrar el contrato por concepto de anticipo la cantidad indicada en el anverso y el resto en la fecha de entrega de la motocicleta. Todo pago efectuado por EL CONSUMIDOR deberá realizarse en el establecimiento del PRESTADOR DEL SERVICIO, al contado y en moneda nacional o cualquier moneda extranjera aceptada por el PRESTADOR DEL SERVICIO.
                  </p>
                  <p>
                    <strong>TERCERA.</strong> EL PRESTADOR DEL SERVICIO pondrá a disposición de EL CONSUMIDOR los precios de los servicios, mano de obra, refacciones y materiales a usar en las reparaciones ofrecidas. Asimismo, previo a la realización del servicio, EL PRESTADOR DEL SERVICIO presentará a EL CONSUMIDOR el presupuesto al que se refiere la cláusula segunda del presente contrato. Una vez aprobado el presupuesto, se procederá a efectuar el servicio solicitado. Si durante la reparación surgieren costos no previsibles, deberán ser autorizados por escrito por EL CONSUMIDOR.
                  </p>
                  <p>
                    <strong>CUARTA.</strong> La entrega de la motocicleta será en la fecha contemplada en el anverso del presente contrato. Para el caso de que EL CONSUMIDOR sea quien proporcione las refacciones, la fecha de entrega será la que se acuerde.
                  </p>
                  <p>
                    <strong>QUINTA.</strong> EL PRESTADOR DEL SERVICIO exclusivamente utilizará para los servicios de este contrato, partes, refacciones u otros materiales nuevos y apropiados para la motocicleta, salvo que EL CONSUMIDOR autorice expresamente lo contrario.
                  </p>
                  <p>
                    <strong>SEXTA.</strong> EL PRESTADOR DEL SERVICIO hará entrega de las refacciones, partes o piezas sustituidas en la reparación y/o mantenimiento de la motocicleta al momento de entrega de ésta, salvo en los siguientes casos: <strong>a)</strong> Cuando EL CONSUMIDOR exprese lo contrario. <strong>b)</strong> Las partes o piezas sean cambiadas en uso de garantía. <strong>c)</strong> Se trate de residuos considerados peligrosos de acuerdo con las disposiciones legales aplicables.
                  </p>
                  <p>
                    <strong>SÉPTIMA.</strong> Las reparaciones a que se refiere el presupuesto aceptado por EL CONSUMIDOR tienen una garantía de {contract.warrantyDays || 90} días contados a partir de la fecha de entrega de la motocicleta ya reparada en mano de obra y en refacciones. La garantía no operará si la motocicleta es intervenida por un tercero, por mal uso, negligencia o descuido. Las reclamaciones por garantía se harán en el establecimiento del PRESTADOR DEL SERVICIO.
                  </p>
                  <p>
                    <strong>OCTAVA.</strong> EL CONSUMIDOR autoriza el uso de la motocicleta en zonas aledañas con un radio de {contract.testRadiusKm || 5} km al área del establecimiento a efectos de pruebas o verificación de las reparaciones. EL PRESTADOR DEL SERVICIO no podrá utilizar la motocicleta para uso personal, fines propios o de terceros.
                  </p>
                </div>
              </div>

              {/* COLUMN 2: CLAUSULAS NOVENA A VIGESIMA + REGISTRO PROFECO */}
              <div className="space-y-1 pl-1">
                <p>
                  <strong>NOVENA.</strong> EL PRESTADOR DEL SERVICIO se hace responsable por los daños causados a la motocicleta de EL CONSUMIDOR como consecuencia de los recorridos de prueba por parte del personal de EL PRESTADOR DEL SERVICIO. El riesgo en un recorrido de prueba es por cuenta de EL CONSUMIDOR cuando él mismo solicite que sea él o un representante suyo quien guíe la motocicleta. El PRESTADOR DEL SERVICIO se hace responsable por descomposturas, daños o pérdidas imputables a él o sus empleados.
                </p>
                <p>
                  <strong>DÉCIMA.</strong> EL PRESTADOR DEL SERVICIO se obliga a expedir la factura o comprobante de pago por los trabajos efectuados, en la que se especificarán los precios por mano de obra, refacciones, materiales y accesorios empleados, conforme a la Ley Federal de Protección al Consumidor.
                </p>
                <p>
                  <strong>DÉCIMA PRIMERA.</strong> Se establece como pena convencional por el incumplimiento de cualquiera de las partes a las obligaciones contraídas el {contract.penaltyPercent || 15}% del precio total de la operación.
                </p>
                <p>
                  <strong>DÉCIMA SEGUNDA.</strong> En caso de que la motocicleta no sea recogida por EL CONSUMIDOR en un plazo de {contract.storageWaitHours || 48} horas a partir de la fecha señalada para la entrega, pagará por concepto de depósito un salario mínimo vigente en el lugar de celebración por cada 24 horas que transcurran.
                </p>
                <p>
                  <strong>DÉCIMA TERCERA.</strong> EL CONSUMIDOR puede desistirse en cualquier momento de la contratación del servicio de reparación y/o mantenimiento de la motocicleta, en cuyo caso deberá cubrir el precio contratado del importe de los trabajos realizados hasta el retiro de la motocicleta.
                </p>
                <p>
                  <strong>DÉCIMA CUARTA.</strong> EL PRESTADOR DEL SERVICIO es responsable ante EL CONSUMIDOR por el incumplimiento de los servicios contratados, aun cuando subcontrate con terceros dicha prestación.
                </p>
                <p>
                  <strong>DÉCIMA QUINTA.</strong> Cuando se preste el servicio a domicilio, el personal de EL PRESTADOR DEL SERVICIO debe identificarse plenamente ante EL CONSUMIDOR mediante documento que lo acredite. En caso de costo adicional, éste se indicará en el anverso.
                </p>
                <p>
                  <strong>DÉCIMA SEXTA.</strong> EL CONSUMIDOR libera a EL PRESTADOR DEL SERVICIO de cualquier responsabilidad que hubiere surgido o pudiese surgir con relación al origen, propiedad, posesión o cualquier otro derecho inherente a la motocicleta o partes.
                </p>
                <p>
                  <strong>DÉCIMA SÉPTIMA.</strong> EL CONSUMIDOR cuenta con un plazo de {contract.cancellationDays || 5} (cinco) días hábiles posteriores a la firma del presente contrato para cancelar la operación sin responsabilidad y penalización alguna, debiendo notificar por escrito al domicilio del prestador, reintegrándose las cantidades entregadas en un plazo de 5 días naturales.
                </p>
                <p>
                  <strong>DÉCIMA OCTAVA.</strong> EL PRESTADOR DEL SERVICIO se obliga a observar en lo relativo a información y publicidad lo dispuesto en la Ley Federal de Protección al Consumidor.
                </p>
                <p>
                  <strong>DÉCIMA NOVENA. CONTRATACIÓN POR MEDIOS ELECTRÓNICOS.</strong> Las partes acuerdan que en lugar de una firma original autógrafa, este contrato, consentimientos o aprobaciones podrán ser firmados por medio del uso de firmas electrónicas, digitales o biométricas conforme a la legislación mercantil y a la NOM-151-SCFI-2016, teniendo plena validez para los efectos legales correspondientes.
                </p>
                <p>
                  <strong>VIGÉSIMA.</strong> La Procuraduría Federal del Consumidor es competente en la vía administrativa para resolver cualquier controversia que se suscite sobre la interpretación o cumplimiento del presente contrato. Sin perjuicio de lo anterior, las partes se someten a la jurisdicción de los tribunales competentes de la localidad.
                </p>

                {/* Recuadro Oficial de Aprobación PROFECO (Verbatim) */}
                <div className="bg-red-50/90 border border-[#DD040F] p-1.5 rounded mt-1.5 shadow-2xs">
                  <p className="font-extrabold text-[6.5px] text-red-950 leading-tight">
                    Este contrato fue aprobado y registrado por la Procuraduría Federal del Consumidor bajo el número <strong>{regNum}</strong> de fecha <strong>{regDate}</strong>. Cualquier variación del presente contrato en perjuicio de EL CONSUMIDOR, frente al contrato de adhesión registrado, se tendrá por no puesta.
                  </p>
                  {contract.notes && (
                    <p className="text-[6px] text-neutral-700 mt-0.5 italic border-t border-red-200 pt-0.5">
                      <strong>Observaciones:</strong> {contract.notes}
                    </p>
                  )}
                </div>

                {/* Alcance del Servicio */}
                <div className="border border-neutral-300 rounded p-1 bg-white text-[6.2px] leading-tight mt-1">
                  <span className="font-bold text-[#010101] block">Alcance del Servicio Autorizado:</span>
                  <p className="text-neutral-700 italic truncate">{contract.serviceDescription || 'Mantenimiento y reparación integral según presupuesto carátula.'}</p>
                </div>
              </div>
            </div>

            {/* 5. FIRMAS Y CIERRE LEGAL (Fits cleanly at bottom of Carta) */}
            <div>
              <div className="text-center text-[6.4px] text-neutral-700 mb-1">
                Leído que fue por las partes el contenido del presente contrato y sabedoras de su alcance legal, lo firman por duplicado en la Ciudad de <strong>Querétaro, Qro.</strong> el día <strong>{formattedDate}</strong>.
              </div>

              <div className="grid grid-cols-2 gap-8 text-center pt-1 pb-1">
                {/* Prestador Signature */}
                <div className="flex flex-col items-center">
                  <div className="h-10 w-48 border-b-2 border-black flex items-center justify-center">
                    {contract.providerSignature ? (
                      <img
                        src={contract.providerSignature}
                        alt="Firma Prestador"
                        className="max-h-9 object-contain"
                      />
                    ) : (
                      <span className="text-[6.5px] text-neutral-500 font-mono tracking-wider">[ SELLO Y FIRMA AUTORIZADA ]</span>
                    )}
                  </div>
                  <span className="font-black text-[7.2px] mt-0.5 text-black uppercase">
                    "EL PRESTADOR DEL SERVICIO"
                  </span>
                  <span className="text-[6.5px] text-neutral-700 font-bold truncate max-w-[220px]">
                    {repName}
                  </span>
                  <span className="text-[6px] text-neutral-500 font-mono">RFC: {contract.providerRfc || 'AUPL650426864'}</span>
                </div>

                {/* Consumidor Signature */}
                <div className="flex flex-col items-center">
                  <div className="h-10 w-48 border-b-2 border-black flex items-center justify-center">
                    {contract.consumerSignature ? (
                      <img
                        src={contract.consumerSignature}
                        alt="Firma Consumidor"
                        className="max-h-9 object-contain"
                      />
                    ) : (
                      <span className="text-[6.5px] text-neutral-400 italic font-mono">[ FIRMA DE CONFORMIDAD ]</span>
                    )}
                  </div>
                  <span className="font-black text-[7.2px] mt-0.5 text-black uppercase">
                    "EL CONSUMIDOR"
                  </span>
                  <span className="text-[6.5px] text-neutral-700 font-bold truncate max-w-[220px]">
                    {contract.customerName}
                  </span>
                  <span className="text-[6px] text-neutral-500 font-mono">ACEPTO DE CONFORMIDAD</span>
                </div>
              </div>

              {/* Official Document Footer */}
              <div className="flex items-center justify-between border-t border-neutral-300 pt-0.5 text-[6px] text-neutral-500 font-medium">
                <span>NOM-174-SCFI-2007 • Prácticas comerciales en talleres de reparación y mantenimiento de motocicletas</span>
                <span className="font-black text-black">HOJA 1 DE 1 — TAMAÑO CARTA OFICIAL (PÁGINA ÚNICA)</span>
                <span>Registro PROFECO: <strong>{regNum}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pure Letter Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #profeco-print-sheet, #profeco-print-sheet * {
            visibility: visible;
          }
          #profeco-print-sheet {
            position: fixed;
            left: 0;
            top: 0;
            width: 215.9mm !important;
            height: 279.4mm !important;
            min-height: 279.4mm !important;
            max-height: 279.4mm !important;
            padding: 6.5mm 8mm 6.5mm 8mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: letter portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};
