import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Customer,
  Motorcycle,
  FuelLevel,
  ServiceOrder,
  MotoInventoryItemState,
  ServiceActivitiesState,
  DiagramPoint,
} from '../types/crm';
import {
  User,
  Bike,
  CheckCircle2,
  Plus,
  Trash2,
  Printer,
  Download,
  MessageCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { HojaDeServicioPDFModal } from './HojaDeServicioPDFModal';
import { TicketModal } from './TicketModal';
import { WhatsAppModal } from './WhatsAppModal';

interface CheckInWizardProps {
  onOrderCreated?: (order: ServiceOrder) => void;
}

const INVENTORY_KEYS: { key: keyof MotoInventoryItemState; label: string }[] = [
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
];

const SERVICE_ACTIVITIES_LIST: { key: keyof ServiceActivitiesState; label: string }[] = [
  { key: 'ajusteFrenos', label: 'Ajuste de frenos' },
  { key: 'ajusteLubricacionCadena', label: 'Ajuste y lubricación de cadena (según modelo)' },
  { key: 'revisionNiveles', label: 'Revisión de niveles (líquido frenos, presión llantas)' },
  { key: 'carburacion', label: 'Carburación' },
  { key: 'cambioAceiteMotor', label: 'Cambio de aceite de motor' },
  { key: 'cambioBujia', label: 'Cambio de bujía' },
  { key: 'lubricacionAjusteChicotes', label: 'Lubricación y ajuste de chicotes' },
  { key: 'revisionPunterias', label: 'Revisión de punterías' },
  { key: 'revisionLimpiezaSedazoAceite', label: 'Revisión y limpieza del sedazo del aceite' },
  { key: 'revisionLimpiezaFiltroAire', label: 'Revisión y limpieza del filtro de aire' },
  { key: 'ajusteTornilleria', label: 'Ajuste de tornillería (tazas, ejes, estribos, barras, soportes)' },
  { key: 'verificacionElectrica', label: 'Verificación eléctrica (carga de batería, luces, claxon)' },
];

export const CheckInWizard: React.FC<CheckInWizardProps> = ({ onOrderCreated }) => {
  const { customers, motorcycles, staff, addCustomer, addMotorcycle, createServiceOrder } = useCRM();

  // Mode: existing vs new client/bike
  const [clientSearch, setClientSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedMotoId, setSelectedMotoId] = useState<string>('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewMoto, setIsNewMoto] = useState(false);

  // Client Data Form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Motorcycle Data Form (Matching Hoja de Servicio)
  const [motoBrand, setMotoBrand] = useState('Yamaha');
  const [motoModel, setMotoModel] = useState('');
  const [motoYear, setMotoYear] = useState<number>(new Date().getFullYear());
  const [motoPlate, setMotoPlate] = useState('');
  const [motoVin, setMotoVin] = useState('');
  const [motoMileage, setMotoMileage] = useState<number>(12000);
  const [motoDisplacement, setMotoDisplacement] = useState('250cc');
  const [motoColor, setMotoColor] = useState('Negro');

  // Inventario de la Moto (SI, NO, ROTO O DAÑADO)
  const [motoInventory, setMotoInventory] = useState<MotoInventoryItemState>({
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
  });

  // Actividades del Servicio
  const [serviceActivities, setServiceActivities] = useState<ServiceActivitiesState>({
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
  });

  // Diagrams: Fuel Gauge & Damage Points on Motorcycle Diagram
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>(50);
  const [diagramPoints, setDiagramPoints] = useState<DiagramPoint[]>([]);
  const [newPointLabel, setNewPointLabel] = useState('Rayón en tanque');

  // Observations & Service Items (Conceptos)
  const [observations, setObservations] = useState('');
  const [assignedMechanicId, setAssignedMechanicId] = useState('');
  const [priority, setPriority] = useState<'normal' | 'alta' | 'urgente'>('normal');

  // Concept rows (matching CLAVE | No. | CONCEPTO | IMPORTE)
  const [concepts, setConcepts] = useState<
    { id: string; clave: string; no: number; concepto: string; importe: number }[]
  >([
    {
      id: 'c-1',
      clave: 'SRV-01',
      no: 1,
      concepto: 'Servicio Preventivo Integral & Afinación Mayor',
      importe: 650,
    },
    {
      id: 'c-2',
      clave: 'REF-02',
      no: 1,
      concepto: 'Aceite Sintético Motul 7100 4T 10W40 (1L)',
      importe: 320,
    },
  ]);

  const [newConceptClave, setNewConceptClave] = useState('SRV-03');
  const [newConceptQty, setNewConceptQty] = useState(1);
  const [newConceptDesc, setNewConceptDesc] = useState('');
  const [newConceptPrice, setNewConceptPrice] = useState(250);

  // Post-Creation Modals
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [showHojaPDFModal, setShowHojaPDFModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Filtered customer search
  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerMotorcycles = motorcycles.filter((m) => m.customerId === selectedCustomerId);

  // Handle inventory check change
  const handleInventoryChange = (key: keyof MotoInventoryItemState, val: 'si' | 'no' | 'roto_danado') => {
    setMotoInventory((prev) => ({ ...prev, [key]: val }));
  };

  // Handle service activity toggle
  const toggleActivity = (key: keyof ServiceActivitiesState) => {
    setServiceActivities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Add click damage point on motorcycle diagram
  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newPt: DiagramPoint = {
      id: `pt-${Date.now()}`,
      x,
      y,
      label: newPointLabel || 'Detalle visual',
    };
    setDiagramPoints((prev) => [...prev, newPt]);
  };

  const removeDiagramPoint = (id: string) => {
    setDiagramPoints((prev) => prev.filter((p) => p.id !== id));
  };

  // Add concept row
  const handleAddConcept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConceptDesc.trim()) return;
    setConcepts((prev) => [
      ...prev,
      {
        id: `concept-${Date.now()}`,
        clave: newConceptClave,
        no: Number(newConceptQty),
        concepto: newConceptDesc.trim(),
        importe: Number(newConceptPrice),
      },
    ]);
    setNewConceptDesc('');
    setNewConceptClave(`SRV-${concepts.length + 2}`);
  };

  const handleRemoveConcept = (id: string) => {
    setConcepts((prev) => prev.filter((c) => c.id !== id));
  };

  // Financial calculations
  const subtotal = concepts.reduce((acc, c) => acc + c.importe, 0);
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax;

  // Submit and create official Service Order
  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCustomer: Customer;
    let finalMoto: Motorcycle;

    // 1. Resolve Customer
    if (isNewClient || !selectedCustomer) {
      if (!clientName || !clientPhone) {
        alert('Por favor indica el nombre y teléfono del cliente.');
        return;
      }
      const created = addCustomer({
        fullName: clientName,
        phone: clientPhone,
        whatsapp: clientPhone,
        email: clientEmail,
      });
      finalCustomer = created.customer;
    } else {
      finalCustomer = selectedCustomer;
    }

    // 2. Resolve Motorcycle
    if (isNewMoto || !selectedMotoId) {
      if (!motoModel || !motoBrand) {
        alert('Por favor indica la marca y modelo de la motocicleta.');
        return;
      }
      const createdM = addMotorcycle(finalCustomer.id, {
        brand: motoBrand,
        model: motoModel,
        year: motoYear,
        displacement: motoDisplacement,
        plate: motoPlate.toUpperCase() || 'SIN-PLACA',
        vin: motoVin.toUpperCase() || 'NO-REGISTRADO',
        color: motoColor,
        currentMileage: motoMileage,
      });
      finalMoto = createdM;
    } else {
      const foundMoto = motorcycles.find((m) => m.id === selectedMotoId);
      finalMoto = foundMoto || {
        id: `moto-${Date.now()}`,
        customerId: finalCustomer.id,
        brand: motoBrand,
        model: motoModel,
        year: motoYear,
        displacement: motoDisplacement,
        plate: motoPlate,
        vin: motoVin,
        color: motoColor,
        currentMileage: motoMileage,
      };
    }

    const assignedStaff = staff.find((s) => s.id === assignedMechanicId);

    // 3. Build Service Items from concepts table
    const serviceItems = concepts.map((c, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      clave: c.clave,
      rowNumber: c.no,
      description: c.concepto,
      type: (c.concepto.toLowerCase().includes('aceite') || c.concepto.toLowerCase().includes('filtro') || c.concepto.toLowerCase().includes('bujía') || c.concepto.toLowerCase().includes('pastilla') ? 'repuesto' : 'mano_de_obra') as 'repuesto' | 'mano_de_obra',
      quantity: c.no,
      unitPrice: c.no > 0 ? c.importe / c.no : c.importe,
      totalPrice: c.importe,
      approvedByClient: true,
      isDispensed: false,
    }));

    // 4. Create Service Order with all official Hoja de Servicio fields
    const order = createServiceOrder({
      customerId: finalCustomer.id,
      customerName: finalCustomer.fullName,
      customerPhone: finalCustomer.phone,
      customerEmail: finalCustomer.email,
      motorcycleId: finalMoto.id,
      motorcycleInfo: {
        brand: finalMoto.brand || motoBrand,
        model: finalMoto.model || motoModel,
        year: finalMoto.year || motoYear,
        displacement: finalMoto.displacement || motoDisplacement,
        plate: finalMoto.plate || motoPlate,
        vin: finalMoto.vin || motoVin,
        color: finalMoto.color || motoColor,
      },
      reasonForVisit: observations || 'Mantenimiento Preventivo / Hoja de Servicio',
      priority,
      status: assignedMechanicId ? 'en_diagnostico' : 'pendiente',
      assignedMechanicId: assignedMechanicId || undefined,
      assignedMechanicName: assignedStaff?.fullName,
      checkIn: {
        fuelLevel,
        mileage: motoMileage,
        damages: diagramPoints.map((dp) => ({
          zone: 'carenado_der',
          type: 'rayón',
          severity: 'leve',
          notes: dp.label,
        })),
        accessoriesLeft: [],
        photos: [],
        notes: observations,
        // Official Sheet Data
        motoInventory,
        serviceActivities,
        diagramPoints,
        entryDate: new Date().toISOString(),
        observations,
      },
      items: serviceItems,
      subtotal,
      tax,
      total,
      deposit: 0,
    });

    setCreatedOrder(order);
    setShowHojaPDFModal(true);
    if (onOrderCreated) {
      onOrderCreated(order);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#010101] p-5 sm:p-6 rounded-3xl text-white border border-neutral-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DD040F]" />
            <span className="text-[#DD040F] font-black text-xs uppercase tracking-widest">
              Formato Oficial QROMOTOS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Hoja de Servicio & Check-in de Unidades
          </h2>
          <p className="text-xs text-[#AAA8A9] mt-0.5">
            Captura ágil del inventario de la moto, actividades del servicio, diagrama visual de daños y conceptos cotizados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="border border-neutral-700 bg-neutral-900 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-neutral-400 block font-bold uppercase tracking-wider">Folio Siguiente</span>
            <span className="text-lg font-mono font-black text-[#DD040F]"># 1001+</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitCheckIn} className="space-y-6">
        {/* SECCIÓN 1: DATOS DEL CLIENTE Y MOTOCICLETA */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-300 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#010101] text-white flex items-center justify-center">
                <User className="w-4 h-4 text-[#DD040F]" />
              </div>
              <h3 className="font-black text-sm text-[#010101] uppercase tracking-wide">
                1. Datos del Cliente & Unidad (Encabezado)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNewClient(!isNewClient);
                setSelectedCustomerId('');
              }}
              className="text-xs font-bold text-[#DD040F] hover:underline cursor-pointer"
            >
              {isNewClient ? '← Buscar Cliente Existente' : '+ Registrar Nuevo Cliente'}
            </button>
          </div>

          {!isNewClient ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Buscar Cliente por Nombre o Teléfono
                </label>
                <input
                  type="text"
                  placeholder="Ej: Alejandro Morales o 442 123..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>

              {filteredCustomers.length > 0 && !selectedCustomerId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
                  {filteredCustomers.map((cust) => (
                    <button
                      type="button"
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setClientName(cust.fullName);
                        setClientPhone(cust.phone);
                        setClientEmail(cust.email);
                        if (cust.motorcycleIds.length > 0) {
                          setSelectedMotoId(cust.motorcycleIds[0]);
                          const m = motorcycles.find((x) => x.id === cust.motorcycleIds[0]);
                          if (m) {
                            setMotoBrand(m.brand);
                            setMotoModel(m.model);
                            setMotoYear(m.year);
                            setMotoPlate(m.plate);
                            setMotoVin(m.vin);
                            setMotoMileage(m.currentMileage);
                          }
                        }
                      }}
                      className="p-3 text-left rounded-xl border border-neutral-200 hover:border-[#DD040F] bg-white transition cursor-pointer"
                    >
                      <p className="font-bold text-xs text-[#010101]">{cust.fullName}</p>
                      <p className="text-[11px] text-neutral-500 font-mono">Tel: {cust.phone}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedCustomer && (
                <div className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#DD040F]">Cliente Activo</span>
                    <p className="font-extrabold text-sm text-[#010101]">{selectedCustomer.fullName}</p>
                    <p className="text-xs text-neutral-600 font-mono">Tel: {selectedCustomer.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerId('')}
                    className="text-xs font-bold text-neutral-500 hover:text-[#DD040F]"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Carlos Pérez"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: (442) 234 5678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="cliente@correo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Motorcycle Fields matching sheet: Nombre | Tel | Marca | Serie | Kilometraje | Modelo */}
          <div className="pt-2 border-t border-neutral-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Marca *</label>
                <input
                  type="text"
                  required
                  placeholder="Yamaha / Honda / Suzuki..."
                  value={motoBrand}
                  onChange={(e) => setMotoBrand(e.target.value)}
                  className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-bold text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: FZ 2.0 / MT-07 / Pulsar 200"
                  value={motoModel}
                  onChange={(e) => setMotoModel(e.target.value)}
                  className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Número de Serie (VIN)</label>
                <input
                  type="text"
                  placeholder="Serie de chasis..."
                  value={motoVin}
                  onChange={(e) => setMotoVin(e.target.value)}
                  className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-mono uppercase text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Kilometraje *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={motoMileage}
                  onChange={(e) => setMotoMileage(Number(e.target.value))}
                  className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-mono font-bold text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Placa</label>
                <input
                  type="text"
                  placeholder="Ej: 84K-DF-3"
                  value={motoPlate}
                  onChange={(e) => setMotoPlate(e.target.value)}
                  className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs font-mono font-bold uppercase text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Año</label>
                <input
                  type="number"
                  value={motoYear}
                  onChange={(e) => setMotoYear(Number(e.target.value))}
                  className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Cilindraje</label>
                <input
                  type="text"
                  placeholder="Ej: 250cc"
                  value={motoDisplacement}
                  onChange={(e) => setMotoDisplacement(e.target.value)}
                  className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Color</label>
                <input
                  type="text"
                  placeholder="Ej: Rojo / Negro"
                  value={motoColor}
                  onChange={(e) => setMotoColor(e.target.value)}
                  className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: INVENTARIO DE LA MOTO & ACTIVIDADES DEL SERVICIO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: INVENTARIO DE LA MOTO (SI / NO / ROTO O DAÑADO) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-neutral-300 shadow-2xs space-y-3">
            <div className="border-b pb-2 border-neutral-200">
              <h3 className="font-black text-xs sm:text-sm text-[#010101] uppercase tracking-wide">
                INVENTARIO DE LA MOTO
              </h3>
              <p className="text-[11px] text-neutral-500">
                Marca el estado de cada componente al ingresar la motocicleta.
              </p>
            </div>

            {/* Headers: SI | NO | ROTO */}
            <div className="flex items-center justify-between text-[10px] font-black text-neutral-500 uppercase px-1 border-b border-neutral-100 pb-1">
              <span>Componente</span>
              <div className="flex gap-4 text-center w-32 justify-end pr-1">
                <span className="w-6 text-center">SI</span>
                <span className="w-6 text-center">NO</span>
                <span className="w-12 text-center text-[9px] text-[#DD040F]">ROTO</span>
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {INVENTORY_KEYS.map((item) => {
                const currentVal = motoInventory[item.key];
                return (
                  <div key={item.key} className="flex items-center justify-between py-1.5 hover:bg-neutral-50 px-1 rounded-md">
                    <span className="text-xs font-bold text-[#010101]">{item.label}</span>
                    <div className="flex gap-4 text-center w-32 justify-end items-center pr-1">
                      {/* SI */}
                      <label className="cursor-pointer w-6 flex justify-center">
                        <input
                          type="radio"
                          name={`inv-${item.key}`}
                          value="si"
                          checked={currentVal === 'si'}
                          onChange={() => handleInventoryChange(item.key, 'si')}
                          className="accent-[#010101] w-4 h-4 cursor-pointer"
                        />
                      </label>
                      {/* NO */}
                      <label className="cursor-pointer w-6 flex justify-center">
                        <input
                          type="radio"
                          name={`inv-${item.key}`}
                          value="no"
                          checked={currentVal === 'no'}
                          onChange={() => handleInventoryChange(item.key, 'no')}
                          className="accent-[#010101] w-4 h-4 cursor-pointer"
                        />
                      </label>
                      {/* ROTO O DAÑADO */}
                      <label className="cursor-pointer w-12 flex justify-center">
                        <input
                          type="radio"
                          name={`inv-${item.key}`}
                          value="roto_danado"
                          checked={currentVal === 'roto_danado'}
                          onChange={() => handleInventoryChange(item.key, 'roto_danado')}
                          className="accent-[#DD040F] w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: ACTIVIDADES DEL SERVICIO */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-neutral-300 shadow-2xs space-y-3">
            <div className="border-b pb-2 border-neutral-200">
              <h3 className="font-black text-xs sm:text-sm text-[#010101] uppercase tracking-wide">
                ACTIVIDADES DEL SERVICIO
              </h3>
              <p className="text-[11px] text-neutral-500">
                Checklist técnico oficial para la hoja de trabajo en taller.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {SERVICE_ACTIVITIES_LIST.map((act) => {
                const isChecked = serviceActivities[act.key];
                return (
                  <div
                    key={act.key}
                    onClick={() => toggleActivity(act.key)}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                      isChecked
                        ? 'bg-[#010101] border-[#010101] text-white'
                        : 'bg-white border-neutral-200 text-[#010101] hover:border-neutral-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked ? 'bg-[#DD040F] border-[#DD040F]' : 'border-neutral-400 bg-white'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="font-semibold text-xs leading-snug">{act.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: DIAGRAMAS (VISTA DE MOTO + MEDIDOR DE GASOLINA) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-300 shadow-2xs space-y-4">
          <div className="border-b pb-3 border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-[#010101] uppercase tracking-wide">
                3. Diagramas de Inspección & Nivel de Gasolina
              </h3>
              <p className="text-xs text-neutral-500">
                Haz clic sobre la motocicleta para marcar rayones o daños previos. Ajusta el dial de gasolina.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nombre del detalle (ej: Raspón)"
                value={newPointLabel}
                onChange={(e) => setNewPointLabel(e.target.value)}
                className="p-1.5 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Interactive Motorcycle Silhouette Diagram */}
            <div className="md:col-span-8 flex flex-col items-center">
              <span className="text-xs font-bold text-neutral-700 mb-2">
                Haz clic en el diagrama de la moto para colocar un punto de daño:
              </span>

              <div
                onClick={handleDiagramClick}
                className="relative w-full max-w-md h-48 bg-[#F8F9FA] border-2 border-dashed border-neutral-300 rounded-2xl p-4 flex items-center justify-center cursor-crosshair hover:border-[#DD040F] transition"
              >
                <svg viewBox="0 0 200 90" className="w-full h-full text-neutral-800">
                  <ellipse cx="25" cy="45" rx="14" ry="7" fill="#010101" />
                  <ellipse cx="175" cy="45" rx="16" ry="9" fill="#010101" />
                  <path d="M 25 45 L 60 45" stroke="#010101" strokeWidth="6" />
                  <path d="M 55 15 L 60 45 L 55 75" stroke="#010101" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="50" cy="12" r="3" fill="#DD040F" />
                  <circle cx="50" cy="78" r="3" fill="#DD040F" />
                  <path d="M 65 30 Q 95 24 110 32 L 110 58 Q 95 66 65 60 Z" fill="#262626" />
                  <path d="M 110 33 Q 135 32 155 36 L 155 54 Q 135 58 110 57 Z" fill="#010101" />
                  <path d="M 155 38 L 180 43 L 180 47 L 155 52 Z" fill="#525252" />
                  <path d="M 100 62 L 165 64" stroke="#737373" strokeWidth="5" strokeLinecap="round" />
                </svg>

                {/* Markers */}
                {diagramPoints.map((pt) => (
                  <div
                    key={pt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDiagramPoint(pt.id);
                    }}
                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                    className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-[#DD040F] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md cursor-pointer animate-bounce"
                    title={`Clic para borrar: ${pt.label}`}
                  >
                    !
                  </div>
                ))}
              </div>

              {diagramPoints.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {diagramPoints.map((pt, i) => (
                    <span
                      key={pt.id}
                      onClick={() => removeDiagramPoint(pt.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DD040F]/10 border border-[#DD040F]/30 text-xs font-bold text-[#DD040F] cursor-pointer"
                    >
                      Punto {i + 1}: {pt.label} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Fuel Level Dial */}
            <div className="md:col-span-4 flex flex-col items-center bg-[#F8F9FA] p-4 rounded-2xl border border-neutral-300">
              <span className="text-xs font-black uppercase tracking-wider text-[#010101] mb-2">
                Nivel de Gasolina en Tanque
              </span>

              {/* Dial visual */}
              <div className="relative w-36 h-20 flex items-center justify-center">
                <svg viewBox="0 0 100 60" className="w-full h-full">
                  <path
                    d="M 15 50 A 40 40 0 0 1 85 50"
                    fill="none"
                    stroke="#e5e5e5"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 15 50 A 40 40 0 0 1 85 50"
                    fill="none"
                    stroke="#010101"
                    strokeWidth="5"
                    strokeDasharray="110"
                    strokeDashoffset={110 - (110 * fuelLevel) / 100}
                  />
                  <line x1="15" y1="50" x2="22" y2="47" stroke="#010101" strokeWidth="2" />
                  <line x1="50" y1="10" x2="50" y2="18" stroke="#010101" strokeWidth="2" />
                  <line x1="85" y1="50" x2="78" y2="47" stroke="#010101" strokeWidth="2" />
                  <text x="10" y="58" fontSize="10" fontWeight="bold" fill="#DD040F">E</text>
                  <text x="83" y="58" fontSize="10" fontWeight="bold" fill="#010101">F</text>
                  {/* Needle */}
                  <g transform={`rotate(${-45 + (fuelLevel / 100) * 90} 50 50)`}>
                    <line x1="50" y1="50" x2="50" y2="15" stroke="#DD040F" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="4" fill="#010101" />
                  </g>
                </svg>
              </div>

              <div className="grid grid-cols-5 gap-1.5 w-full mt-3">
                {([0, 25, 50, 75, 100] as FuelLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFuelLevel(lvl)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                      fuelLevel === lvl
                        ? 'bg-[#DD040F] text-white border-[#DD040F] shadow-xs'
                        : 'bg-white text-[#010101] border-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    {lvl}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: OBSERVACIONES & ASIGNACIÓN */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-300 shadow-2xs space-y-4">
          <div className="border-b pb-3 border-neutral-200">
            <h3 className="font-black text-sm text-[#010101] uppercase tracking-wide">
              4. Observaciones & Motivo de Ingreso
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Observaciones del Asesor / Falla Reportada por el Cliente *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detalla fallas reportadas, síntomas del motor, ruidos extraños o requerimientos especiales..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Mecánico Asignado</label>
              <select
                value={assignedMechanicId}
                onChange={(e) => setAssignedMechanicId(e.target.value)}
                className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden font-bold"
              >
                <option value="">-- Sin Asignar (Pendiente) --</option>
                {staff
                  .filter((s) => s.role === 'mechanic')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.specialty || 'Técnico Especialista'})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Prioridad del Servicio</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-300 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
              >
                <option value="normal">Normal (Tiempo estándar de turno)</option>
                <option value="alta">Alta (Mismo día)</option>
                <option value="urgente">Urgente (Moto de trabajo / Entrega prioritaria)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: TABLA DE CONCEPTOS (CLAVE | No. | CONCEPTO | IMPORTE) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-300 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-neutral-200">
            <div>
              <h3 className="font-black text-sm text-[#010101] uppercase tracking-wide">
                5. Conceptos & Presupuesto Inicial (Hoja de Trabajo)
              </h3>
              <p className="text-xs text-neutral-500">Mano de obra, aceites y refacciones presupuestadas</p>
            </div>
          </div>

          {/* Quick add concept form */}
          <div className="p-3 bg-[#F8F9FA] rounded-xl border border-neutral-300 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">CLAVE</label>
              <input
                type="text"
                value={newConceptClave}
                onChange={(e) => setNewConceptClave(e.target.value)}
                placeholder="SRV-01"
                className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-[#010101]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">CANT (No.)</label>
              <input
                type="number"
                min={1}
                value={newConceptQty}
                onChange={(e) => setNewConceptQty(Number(e.target.value))}
                className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-[#010101]"
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">CONCEPTO</label>
              <input
                type="text"
                value={newConceptDesc}
                onChange={(e) => setNewConceptDesc(e.target.value)}
                placeholder="Ej: Cambio de pastillas delanteras"
                className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs text-[#010101]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">IMPORTE ($)</label>
              <input
                type="number"
                min={0}
                value={newConceptPrice}
                onChange={(e) => setNewConceptPrice(Number(e.target.value))}
                className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold text-[#010101]"
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="button"
                onClick={handleAddConcept}
                className="w-full py-2 bg-[#010101] hover:bg-neutral-800 text-white rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Concepts table */}
          <div className="border border-neutral-300 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#010101] text-white font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 text-center w-20">CLAVE</th>
                  <th className="p-2.5 text-center w-16">No.</th>
                  <th className="p-2.5">CONCEPTO</th>
                  <th className="p-2.5 text-right w-28">IMPORTE</th>
                  <th className="p-2.5 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {concepts.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="p-2.5 text-center font-mono font-bold text-neutral-700">{c.clave}</td>
                    <td className="p-2.5 text-center font-mono">{c.no}</td>
                    <td className="p-2.5 font-bold text-[#010101]">{c.concepto}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#010101]">${c.importe.toLocaleString()}</td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveConcept(c.id)}
                        className="text-neutral-400 hover:text-[#DD040F] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end p-4 bg-[#F8F9FA] rounded-xl border border-neutral-300 text-xs">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-neutral-600">
                <span>SUBTOTAL:</span>
                <span className="font-mono font-bold">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>I.V.A (16%):</span>
                <span className="font-mono font-bold">${tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#010101] font-black text-sm pt-1.5 border-t-2 border-black">
                <span>TOTAL:</span>
                <span className="font-mono text-[#DD040F]">${total.toLocaleString()} MXN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#DD040F] hover:bg-[#b5030c] text-white font-extrabold text-sm shadow-xl shadow-[#DD040F]/30 transition cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Generar Hoja de Servicio & Registrar Unidad</span>
          </button>
        </div>
      </form>

      {/* Success Modal / Action Bar */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/85 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-neutral-300 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#010101] text-[#DD040F] flex items-center justify-center mx-auto border-2 border-[#DD040F]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#010101] text-white">
                FOLIO: {createdOrder.orderNumber || createdOrder.id}
              </span>
              <h3 className="text-xl font-black text-[#010101] mt-2">
                ¡Unidad Registrada en Taller!
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {createdOrder.motorcycleInfo.brand} {createdOrder.motorcycleInfo.model} ingresó con éxito a QROMOTOS.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHojaPDFModal(true)}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#DD040F] hover:bg-[#b5030c] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Hoja Oficial PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTicketModal(true)}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#010101] text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Ticket Térmico</span>
              </button>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#010101] hover:bg-neutral-800 text-white text-xs font-bold transition border border-neutral-700 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#DD040F]" />
                <span>Enviar Notificación WhatsApp al Cliente</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreatedOrder(null);
                setObservations('');
                setDiagramPoints([]);
              }}
              className="w-full py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold hover:bg-neutral-200 transition cursor-pointer"
            >
              Completar y Regresar
            </button>
          </div>
        </div>
      )}

      {/* Official Form PDF Modal */}
      {showHojaPDFModal && createdOrder && (
        <HojaDeServicioPDFModal
          order={createdOrder}
          onClose={() => setShowHojaPDFModal(false)}
        />
      )}

      {/* Ticket Modal */}
      {showTicketModal && createdOrder && (
        <TicketModal order={createdOrder} onClose={() => setShowTicketModal(false)} />
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && createdOrder && (
        <WhatsAppModal
          order={createdOrder}
          onClose={() => setShowWhatsAppModal(false)}
          defaultType="checkin"
        />
      )}
    </div>
  );
};
