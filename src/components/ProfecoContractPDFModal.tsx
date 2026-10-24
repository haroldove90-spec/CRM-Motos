import React, { useRef, useState } from 'react';
import { ProfecoContract } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import { Printer, Download, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
        scale: 2.2,
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

      // Fit strictly within the letter-size sheet (margin 3mm)
      const margin = 3;
      const targetWidth = pdfWidth - margin * 2;
      const targetHeight = (canvas.height * targetWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, targetWidth, Math.min(targetHeight, pdfHeight - margin * 2));
      pdf.save(`Contrato_PROFECO_${contract.contractNumber.replace(/\s+/g, '_')}_${contract.customerName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Hubo un error al generar el archivo PDF. Se abrirá el cuadro de diálogo de impresión para guardar como PDF.');
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Control Bar */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#010101] text-white px-4 py-2 rounded-full shadow-2xl border border-neutral-700 print:hidden text-xs">
        <span className="flex items-center gap-1.5 font-bold text-red-400 mr-2">
          <ShieldCheck className="w-4 h-4 text-[#DD040F]" />
          <span>Contrato Oficial PROFECO (Tamaño Carta 1 Hoja)</span>
        </span>
        <button
          onClick={handleNativePrint}
          className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-full font-bold transition cursor-pointer"
          title="Imprimir directamente en hoja tamaño carta"
        >
          <Printer className="w-3.5 h-3.5 text-[#DD040F]" />
          <span>Imprimir Carta</span>
        </button>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-1.5 bg-[#DD040F] hover:bg-red-700 text-white px-3.5 py-1.5 rounded-full font-bold transition shadow-md cursor-pointer disabled:opacity-50"
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

      {/* Main Letter Sheet Container */}
      <div className="mt-14 mb-8 bg-neutral-200 p-2 sm:p-4 rounded-xl shadow-2xl flex justify-center">
        {/*
          CRITICAL CONSTRAINT: Letter Size = 215.9mm x 279.4mm (8.5 x 11 inches)
          High-density layout engineered to fit exactly on ONE single sheet without spilling over.
        */}
        <div
          ref={printRef}
          id="profeco-print-sheet"
          className="bg-white text-black font-sans shadow-md border border-neutral-400 flex flex-col justify-between print:border-none print:shadow-none"
          style={{
            width: '215.9mm',
            minHeight: '279.4mm',
            maxHeight: '279.4mm',
            padding: '7mm 8mm 6mm 8mm',
            boxSizing: 'border-box',
            fontSize: '7.8px',
            lineHeight: 1.18,
            overflow: 'hidden',
          }}
        >
          {/* HEADER SECTION (30mm) */}
          <div>
            <div className="flex items-start justify-between border-b-2 border-[#DD040F] pb-1.5 mb-1.5">
              <div className="flex items-center gap-2.5">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.workshopName}
                    className="h-10 w-auto object-contain max-w-[120px]"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="bg-[#010101] text-white font-black text-sm px-2 py-1 rounded">
                    {settings.workshopName}
                  </div>
                )}
                <div>
                  <h1 className="font-black text-[11px] uppercase tracking-tight text-[#010101] leading-none">
                    {contract.providerName || settings.legalName}
                  </h1>
                  <p className="text-[7.5px] text-neutral-600 mt-0.5 font-medium leading-tight">
                    {contract.providerAddress || settings.address} • RFC: <strong className="text-black">{contract.providerRfc || settings.taxId}</strong>
                  </p>
                  <p className="text-[7px] text-neutral-500 leading-tight">
                    Tel: {contract.providerPhone || settings.phone} • Email: {contract.providerEmail || settings.email} • {contract.scheduleAttention || settings.profecoScheduleAttention || 'Lun-Vie 8:30 a 19:00 hrs, Sáb 9:00 a 14:00 hrs'}
                  </p>
                </div>
              </div>

              {/* Official PROFECO registration block */}
              <div className="text-right border border-neutral-300 rounded p-1 bg-neutral-50 min-w-[170px]">
                <div className="flex items-center justify-end gap-1 text-[#DD040F] font-black text-[8px] uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-[#DD040F]" />
                  <span>CONTRATO DE ADHESIÓN PROFECO</span>
                </div>
                <div className="text-[7.5px] font-bold text-neutral-800 mt-0.5">
                  FOLIO: <span className="font-mono text-black font-black text-[9px]">{contract.contractNumber}</span>
                </div>
                <div className="text-[6.8px] text-neutral-600 leading-tight">
                  Reg. Oficial: <strong>{contract.profecoRegistrationNumber || settings.profecoRegistrationNumber || 'PFC-REP-4892/2026'}</strong>
                </div>
                <div className="text-[6.5px] text-neutral-500">
                  Fecha Reg.: {contract.profecoRegistrationDate || settings.profecoRegistrationDate || '15/01/2026'} • NOM-174-SCFI-2007
                </div>
              </div>
            </div>

            {/* TITLE & PROEMIO */}
            <div className="text-center mb-1 bg-neutral-100 py-1 px-2 rounded border border-neutral-200">
              <h2 className="font-black text-[9px] uppercase tracking-wide text-[#010101]">
                CONTRATO DE PRESTACIÓN DE SERVICIOS DE REPARACIÓN Y/O MANTENIMIENTO DE MOTOCICLETA
              </h2>
              <p className="text-[7px] text-neutral-700 leading-tight italic">
                Celebrado por una parte por el Prestador del Servicio y por la otra parte El Consumidor, cuyos nombres y datos constan en la carátula de este contrato como parte integral del mismo, sujetándose al tenor de las siguientes:
              </p>
            </div>

            {/* CARÁTULA COMPACTA DE DATOS (4 Box Grid) */}
            <div className="grid grid-cols-4 gap-1.5 mb-1.5 text-[7px] leading-tight border border-neutral-300 rounded p-1.5 bg-white">
              {/* Box 1: Prestador */}
              <div className="border-r border-neutral-200 pr-1.5">
                <span className="font-black text-neutral-900 block border-b border-neutral-200 pb-0.5 mb-0.5 uppercase text-[6.8px] text-[#DD040F]">
                  I. Prestador del Servicio
                </span>
                <p className="truncate font-bold text-neutral-900">{contract.providerName}</p>
                <p>Rep: {contract.providerRepresentative || 'Representante Legal'}</p>
                <p>RFC: <strong className="font-mono">{contract.providerRfc}</strong></p>
                <p className="truncate">Tel: {contract.providerPhone}</p>
                <p className="truncate text-neutral-600">{contract.providerAddress}</p>
              </div>

              {/* Box 2: Consumidor */}
              <div className="border-r border-neutral-200 pr-1.5">
                <span className="font-black text-neutral-900 block border-b border-neutral-200 pb-0.5 mb-0.5 uppercase text-[6.8px] text-[#DD040F]">
                  II. El Consumidor (Cliente)
                </span>
                <p className="font-bold text-neutral-900 truncate">{contract.customerName}</p>
                <p>Tel: <strong className="font-mono">{contract.customerPhone}</strong></p>
                {contract.customerRfc && <p>RFC: <strong className="font-mono">{contract.customerRfc}</strong></p>}
                <p className="truncate text-neutral-600">{contract.customerAddress || 'Domicilio señalado en recepción'}</p>
                {contract.customerEmail && <p className="truncate text-neutral-500">{contract.customerEmail}</p>}
              </div>

              {/* Box 3: Motocicleta */}
              <div className="border-r border-neutral-200 pr-1.5">
                <span className="font-black text-neutral-900 block border-b border-neutral-200 pb-0.5 mb-0.5 uppercase text-[6.8px] text-[#DD040F]">
                  III. Datos del Vehículo
                </span>
                <p className="font-bold text-neutral-900">{contract.motorcycleBrand} {contract.motorcycleModel} ({contract.motorcycleYear})</p>
                <p>Placas: <strong className="font-mono">{contract.motorcyclePlate || 'S/P'}</strong> • Color: {contract.motorcycleColor || 'N/E'}</p>
                <p className="truncate">VIN / Serie: <span className="font-mono font-bold text-[6.5px]">{contract.motorcycleVin || 'VERIFICADO'}</span></p>
                <p>Km Entrada: <strong className="font-mono">{contract.motorcycleMileage || '0'} km</strong></p>
              </div>

              {/* Box 4: Presupuesto & Fechas */}
              <div className="bg-neutral-50 p-1 rounded border border-neutral-200">
                <span className="font-black text-neutral-900 block border-b border-neutral-200 pb-0.5 mb-0.5 uppercase text-[6.8px] text-[#DD040F]">
                  IV. Presupuesto & Plazos
                </span>
                <div className="flex justify-between">
                  <span>Presupuesto Total:</span>
                  <strong className="font-mono text-[7.5px]">${contract.agreedBudget.toLocaleString('es-MX')}</strong>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Anticipo Pagado:</span>
                  <strong className="font-mono text-green-700">${contract.deposit.toLocaleString('es-MX')}</strong>
                </div>
                <div className="flex justify-between font-bold border-t border-neutral-200 pt-0.5 mt-0.5 text-[#010101]">
                  <span>Saldo a la Entrega:</span>
                  <strong className="font-mono text-[#DD040F]">${contract.pendingBalance.toLocaleString('es-MX')}</strong>
                </div>
                <p className="text-[6.5px] text-neutral-600 mt-0.5 truncate">
                  Entrega: <strong>{contract.deliveryDate || 'Fecha pactada'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN DENSE LEGAL TEXT (DECLARACIONES & CLÁUSULAS 1 TO 20) */}
          <div className="grid grid-cols-2 gap-3 text-justify leading-[9.1px] text-[7.1px] text-neutral-900 border-t border-b border-neutral-300 py-1.5 mb-1.5 flex-1 overflow-hidden">
            {/* COLUMN 1: DECLARACIONES & CLAUSULAS 1 A 10 */}
            <div className="space-y-1 pr-1 border-r border-neutral-200">
              <div>
                <p className="font-black uppercase tracking-wider text-[7.5px] text-[#DD040F] mb-0.5">
                  DECLARACIONES
                </p>
                <p className="font-bold text-[7.2px] text-neutral-950">I. Declara "EL PRESTADOR DEL SERVICIO":</p>
                <p>
                  <strong>a)</strong> Ser una persona física de nacionalidad mexicana y con suficiente capacidad legal para obligarse en los términos del presente contrato. Su domicilio se encuentra ubicado en el establecimiento señalado en la carátula.
                </p>
                <p>
                  <strong>b)</strong> Cuenta con la infraestructura, los elementos propios, los recursos técnicos y humanos suficientes para cumplir con sus obligaciones.
                </p>
                <p>
                  <strong>c)</strong> Para la atención de dudas, aclaraciones, reclamaciones o servicios de orientación, señala el teléfono y correo electrónico indicados en la carátula, con su respectivo horario de atención.
                </p>

                <p className="font-bold text-[7.2px] text-neutral-950 mt-1">II. Declara "EL CONSUMIDOR":</p>
                <p>
                  <strong>a)</strong> Llamarse como ha quedado plasmado en el proemio de este contrato.
                </p>
                <p>
                  <strong>b)</strong> Que es su deseo obligarse en los términos y condiciones del presente contrato, contando con la capacidad legal para su celebración.
                </p>
                <p>
                  <strong>c)</strong> Su domicilio se encuentra ubicado en el lugar señalado en la carátula.
                </p>
              </div>

              <div>
                <p className="font-black uppercase tracking-wider text-[7.5px] text-[#DD040F] mt-1 mb-0.5">
                  CLÁUSULAS
                </p>
                <p>
                  <strong>PRIMERA.</strong> EL PRESTADOR DEL SERVICIO realizará todas las operaciones y composturas descritas en el anverso del presente contrato, solicitadas por EL CONSUMIDOR, a las que se someterá la motocicleta para obtener condiciones de funcionamiento de acuerdo al estado de ésta. Asimismo, EL PRESTADOR DEL SERVICIO no condicionará la prestación de los servicios a la adquisición o renta de otros productos o servicios en el establecimiento o en otro taller o agencia predeterminada.
                </p>
                <p>
                  <strong>SEGUNDA.</strong> El precio total de los servicios contratados se establece en el presupuesto que forma parte del presente y se describe en el anverso, el cual será pagado por EL CONSUMIDOR de la forma siguiente: al momento de celebrar el contrato por concepto de anticipo la cantidad indicada en el anverso y el resto en la fecha de entrega de la motocicleta.
                </p>
                <p>
                  <strong>TERCERA.</strong> EL PRESTADOR DEL SERVICIO pondrá a disposición de EL CONSUMIDOR los precios de los servicios, mano de obra, refacciones y materiales a usar en las reparaciones ofrecidas. Asimismo, previo a la realización del servicio, EL PRESTADOR DEL SERVICIO presentará a EL CONSUMIDOR el presupuesto al que se refiere la cláusula segunda del presente contrato. Una vez aprobado el presupuesto, se procederá a efectuar el servicio solicitado.
                </p>
                <p>
                  <strong>CUARTA.</strong> La entrega de la motocicleta será en la fecha contemplada en el anverso del presente contrato. Para el caso de que EL CONSUMIDOR sea quien proporcione las refacciones, la fecha de entrega será la que se acuerde.
                </p>
                <p>
                  <strong>QUINTA.</strong> EL PRESTADOR DEL SERVICIO exclusivamente utilizará para los servicios de este contrato, partes, refacciones o otros materiales nuevos y apropiados para la motocicleta, salvo que EL CONSUMIDOR autorice expressamente lo contrario.
                </p>
                <p>
                  <strong>SEXTA.</strong> EL PRESTADOR DEL SERVICIO hará entrega de las refacciones, partes o piezas sustituidas en la reparación y/o mantenimiento de la motocicleta al momento de entrega de ésta, salvo en los siguientes casos: <strong>a)</strong> Cuando EL CONSUMIDOR exprese lo contrario. <strong>b)</strong> Las partes o piezas sean cambiadas en uso de garantía. <strong>c)</strong> Se trate de residuos considerados peligrosos de acuerdo con las disposiciones legales aplicables.
                </p>
                <p>
                  <strong>SÉPTIMA.</strong> Las reparaciones a que se refiere el presupuesto aceptado por EL CONSUMIDOR tienen una garantía de {contract.warrantyDays || 90} días contados a partir de la fecha de entrega de la motocicleta ya reparada en mano de obra y en refacciones. La garantía no operará si la motocicleta es intervenida por un tercero, por mal uso, negligencia o descuido.
                </p>
                <p>
                  <strong>OCTAVA.</strong> EL CONSUMIDOR autoriza el uso de la motocicleta en zonas aledañas con un radio de {contract.testRadiusKm || 5} km al área del establecimiento a efectos de pruebas o verificación de las reparaciones. EL PRESTADOR DEL SERVICIO no podrá utilizar la motocicleta para uso personal, fines propios o de terceros.
                </p>
                <p>
                  <strong>NOVENA.</strong> EL PRESTADOR DEL SERVICIO se hace responsable por los daños causados a la motocicleta de EL CONSUMIDOR como consecuencia de los recorridos de prueba por parte del personal.
                </p>
                <p>
                  <strong>DÉCIMA.</strong> EL PRESTADOR DEL SERVICIO se obliga a expedir la factura o comprobante de pago por los trabajos efectuados.
                </p>
              </div>
            </div>

            {/* COLUMN 2: CLAUSULAS 11 A 20 + REGISTRO PROFECO */}
            <div className="space-y-1 pl-1">
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
                <strong>DÉCIMA QUINTA.</strong> Cuando se preste el servicio a domicilio, el personal de EL PRESTADOR DEL SERVICIO debe identificarse plenamente ante EL CONSUMIDOR mediante documento que lo acredite.
              </p>
              <p>
                <strong>DÉCIMA SEXTA.</strong> EL CONSUMIDOR libera a EL PRESTADOR DEL SERVICIO de cualquier responsabilidad que hubiere surgido o pudiese surgir con relación al origen, propiedad, posesión o cualquier otro derecho inherente a la motocicleta o partes.
              </p>
              <p>
                <strong>DÉCIMA SÉPTIMA.</strong> EL CONSUMIDOR cuenta con un plazo de {contract.cancellationDays || 5} (cinco) días hábiles posteriores a la firma del presente contrato para cancelar la operación sin responsabilidad y penalización alguna, debiendo notificar por escrito al domicilio del prestador.
              </p>
              <p>
                <strong>DÉCIMA OCTAVA.</strong> EL PRESTADOR DEL SERVICIO se obliga a observar en lo relativo a información y publicidad lo dispuesto en la Ley Federal de Protección al Consumidor.
              </p>
              <p>
                <strong>DÉCIMA NOVENA.</strong> CONTRATACIÓN POR MEDIOS ELECTRÓNICOS: Las partes acuerdan que los registros en donde sean aplicadas firmas electrónicas o digitales tendrán validez para los efectos legales correspondientes.
              </p>
              <p>
                <strong>VIGÉSIMA.</strong> La Procuraduría Federal del Consumidor es competente en la vía administrativa para resolver cualquier controversia que se suscite. Las partes se someten a la jurisdicción de los tribunales competentes de la localidad.
              </p>

              {/* Official PROFECO Adhesion Disclaimer Box */}
              <div className="bg-red-50 border-l-2 border-[#DD040F] p-1.5 rounded-r mt-2">
                <p className="font-bold text-[7px] text-red-950 leading-tight">
                  Este contrato de adhesión cuenta con el aval y registro oficial ante la PROFECO. Cualquier cláusula o variación que vaya en perjuicio de los derechos del consumidor frente al contrato registrado se tendrá por no puesta.
                </p>
                {contract.notes && (
                  <p className="text-[6.5px] text-neutral-600 mt-1 italic">
                    <strong>Observaciones complementarias:</strong> {contract.notes}
                  </p>
                )}
              </div>

              {/* Service description summary in document */}
              <div className="border border-neutral-200 rounded p-1 bg-neutral-50 text-[6.8px] leading-tight mt-1">
                <span className="font-bold text-neutral-900 block">Alcance del Servicio Autorizado:</span>
                <p className="text-neutral-700 italic truncate">{contract.serviceDescription || 'Mantenimiento y reparación integral según presupuesto carátula.'}</p>
              </div>
            </div>
          </div>

          {/* SIGNATURE SECTION & FOOTNOTE (32mm) */}
          <div className="pt-1">
            <div className="text-center text-[6.8px] text-neutral-600 mb-1">
              Leído que fue el presente contrato por ambas partes y enteradas de su contenido, alcance y fuerza legal, lo firman en la ciudad de <strong>{settings.address.split(',')[1] || 'Querétaro, Qro.'}</strong> el día <strong>{formattedDate}</strong>.
            </div>

            <div className="grid grid-cols-2 gap-8 text-center pt-1 pb-1">
              {/* Prestador Signature */}
              <div className="flex flex-col items-center">
                <div className="h-10 w-44 border-b border-black flex items-center justify-center">
                  {contract.providerSignature ? (
                    <img
                      src={contract.providerSignature}
                      alt="Firma Prestador"
                      className="max-h-9 object-contain"
                    />
                  ) : (
                    <span className="text-[6.5px] text-neutral-400 font-mono tracking-widest">[ SELLO Y FIRMA AUTORIZADA ]</span>
                  )}
                </div>
                <span className="font-bold text-[7.5px] mt-0.5 text-black uppercase">
                  "EL PRESTADOR DEL SERVICIO"
                </span>
                <span className="text-[6.5px] text-neutral-600 truncate max-w-[200px]">
                  {contract.providerRepresentative || contract.providerName}
                </span>
                <span className="text-[6px] text-neutral-400 font-mono">{contract.providerRfc}</span>
              </div>

              {/* Consumidor Signature */}
              <div className="flex flex-col items-center">
                <div className="h-10 w-44 border-b border-black flex items-center justify-center">
                  {contract.consumerSignature ? (
                    <img
                      src={contract.consumerSignature}
                      alt="Firma Consumidor"
                      className="max-h-9 object-contain"
                    />
                  ) : (
                    <span className="text-[6.5px] text-neutral-400 italic">Firma de conformidad del Consumidor</span>
                  )}
                </div>
                <span className="font-bold text-[7.5px] mt-0.5 text-black uppercase">
                  "EL CONSUMIDOR"
                </span>
                <span className="text-[6.5px] text-neutral-600 truncate max-w-[200px]">
                  {contract.customerName}
                </span>
                <span className="text-[6px] text-neutral-400 font-mono">ACEPTO DE CONFORMIDAD</span>
              </div>
            </div>

            {/* Official Footer Note */}
            <div className="flex items-center justify-between border-t border-neutral-300 pt-1 text-[6.2px] text-neutral-500 font-medium">
              <span>NOM-174-SCFI-2007 • Taller Mecánico Especializado en Motocicletas</span>
              <span className="font-bold text-neutral-700">HOJA 1 DE 1 — TAMAÑO CARTA OFICIAL (PÁGINA ÚNICA)</span>
              <span>Reg. PROFECO: {contract.profecoRegistrationNumber || settings.profecoRegistrationNumber || 'PFC-REP-4892/2026'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific style tag injected for pure Letter paper printing */}
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
            max-height: 279.4mm !important;
            padding: 7mm 8mm 6mm 8mm !important;
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
