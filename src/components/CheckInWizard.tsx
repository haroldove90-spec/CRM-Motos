import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import {
  Customer,
  Motorcycle,
  FuelLevel,
  DamageReport,
  ServiceOrder,
} from '../types/crm';
import {
  User,
  Bike,
  Fuel,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Plus,
  Trash2,
  Printer,
  MessageCircle,
} from 'lucide-react';
import { TicketModal } from './TicketModal';
import { WhatsAppModal } from './WhatsAppModal';

interface CheckInWizardProps {
  onOrderCreated?: (order: ServiceOrder) => void;
}

const DAMAGE_ZONES: { id: DamageReport['zone']; label: string }[] = [
  { id: 'frente', label: 'Frente / Faro / Cúpula' },
  { id: 'manubrio', label: 'Manubrio / Espejos / Manetas' },
  { id: 'tanque', label: 'Tanque de Gasolina' },
  { id: 'carenado_izq', label: 'Carenado / Tapa Izquierda' },
  { id: 'carenado_der', label: 'Carenado / Tapa Derecha' },
  { id: 'escape', label: 'Escape / Mofle' },
  { id: 'rueda_del', label: 'Rueda / Suspensión Delantera' },
  { id: 'rueda_tras', label: 'Rueda / Suspensión Trasera' },
  { id: 'asiento_colin', label: 'Asiento / Colín / Stop' },
];

const ACCESSORY_OPTIONS = [
  'Casco',
  'Llave de baúl / maletero',
  'Portaequipaje / Top Case',
  'Candado de disco con alarma',
  'Soporte para celular',
  'Documentos de la moto',
  'Impermeable',
];

export const CheckInWizard: React.FC<CheckInWizardProps> = ({ onOrderCreated }) => {
  const { customers, motorcycles, staff, addCustomer, addMotorcycle, createServiceOrder } = useCRM();

  // Search & Selection State
  const [clientSearch, setClientSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedMotoId, setSelectedMotoId] = useState<string>('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewMoto, setIsNewMoto] = useState(false);

  // New Client Form
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // New Moto Form
  const [newMotoBrand, setNewMotoBrand] = useState('Yamaha');
  const [newMotoModel, setNewMotoModel] = useState('');
  const [newMotoYear, setNewMotoYear] = useState<number>(new Date().getFullYear());
  const [newMotoDisplacement, setNewMotoDisplacement] = useState('250cc');
  const [newMotoPlate, setNewMotoPlate] = useState('');
  const [newMotoVin, setNewMotoVin] = useState('');
  const [newMotoColor, setNewMotoColor] = useState('Negro');

  // Check-In Visual Details
  const [mileage, setMileage] = useState<number>(10000);
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>(50);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [priority, setPriority] = useState<'normal' | 'alta' | 'urgente'>('normal');
  const [assignedMechanicId, setAssignedMechanicId] = useState('');
  const [notes, setNotes] = useState('');

  // Damages
  const [damages, setDamages] = useState<DamageReport[]>([]);
  const [newDamageZone, setNewDamageZone] = useState<DamageReport['zone']>('carenado_der');
  const [newDamageType, setNewDamageType] = useState<DamageReport['type']>('rayón');
  const [newDamageSeverity, setNewDamageSeverity] = useState<DamageReport['severity']>('leve');
  const [newDamageNotes, setNewDamageNotes] = useState('');

  // Accessories Left
  const [accessoriesLeft, setAccessoriesLeft] = useState<string[]>(['Casco']);

  // Photos
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
  ]);

  // Modals after creation
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Filtered clients for quick search
  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch) ||
      c.whatsapp.includes(clientSearch)
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerMotorcycles = motorcycles.filter((m) => m.customerId === selectedCustomerId);
  const selectedMotorcycle = motorcycles.find((m) => m.id === selectedMotoId);

  const handleAddDamage = () => {
    if (!newDamageNotes && !newDamageZone) return;
    setDamages((prev) => [
      ...prev,
      {
        zone: newDamageZone,
        type: newDamageType,
        severity: newDamageSeverity,
        notes: newDamageNotes || 'Inspección de entrada',
      },
    ]);
    setNewDamageNotes('');
  };

  const handleRemoveDamage = (index: number) => {
    setDamages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAccessory = (item: string) => {
    setAccessoriesLeft((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCustomer: Customer;
    let finalMoto: Motorcycle;

    // 1. Process customer
    if (isNewClient || !selectedCustomer) {
      if (!newClientName || !newClientPhone) {
        alert('Por favor completa el nombre y teléfono del cliente.');
        return;
      }
      const created = addCustomer({
        fullName: newClientName,
        phone: newClientPhone,
        whatsapp: newClientPhone,
        email: newClientEmail,
      });
      finalCustomer = created.customer;
    } else {
      finalCustomer = selectedCustomer;
    }

    // 2. Process Motorcycle
    if (isNewMoto || !selectedMotorcycle) {
      if (!newMotoPlate || !newMotoModel) {
        alert('Por favor completa la placa y modelo de la motocicleta.');
        return;
      }
      const createdM = addMotorcycle(finalCustomer.id, {
        brand: newMotoBrand,
        model: newMotoModel,
        year: newMotoYear,
        displacement: newMotoDisplacement,
        plate: newMotoPlate.toUpperCase(),
        vin: newMotoVin.toUpperCase() || 'NO-REGISTRADO',
        color: newMotoColor,
        currentMileage: mileage,
      });
      finalMoto = createdM;
    } else {
      finalMoto = selectedMotorcycle;
    }

    if (!reasonForVisit.trim()) {
      alert('Por favor ingresa el motivo de la visita o servicio solicitado.');
      return;
    }

    const assignedStaff = staff.find((s) => s.id === assignedMechanicId);

    // Create Service Order
    const order = createServiceOrder({
      customerId: finalCustomer.id,
      customerName: finalCustomer.fullName,
      customerPhone: finalCustomer.phone,
      customerEmail: finalCustomer.email,
      motorcycleId: finalMoto.id,
      motorcycleInfo: {
        brand: finalMoto.brand,
        model: finalMoto.model,
        year: finalMoto.year,
        displacement: finalMoto.displacement,
        plate: finalMoto.plate,
        vin: finalMoto.vin,
        color: finalMoto.color,
      },
      reasonForVisit,
      priority,
      status: assignedMechanicId ? 'en_diagnostico' : 'pendiente',
      assignedMechanicId: assignedMechanicId || undefined,
      assignedMechanicName: assignedStaff?.fullName,
      checkIn: {
        fuelLevel,
        mileage,
        damages,
        accessoriesLeft,
        photos,
        notes,
      },
      items: [
        {
          id: `item-init-${Date.now()}`,
          description: `Revisión inicial y diagnóstico técnico: ${reasonForVisit}`,
          type: 'mano_de_obra',
          quantity: 1,
          unitPrice: 350,
          totalPrice: 350,
          approvedByClient: true,
        },
      ],
      subtotal: 350,
      tax: 56,
      total: 406,
      deposit: 0,
    });

    setCreatedOrder(order);
    if (onOrderCreated) {
      onOrderCreated(order);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#DD040F] block">
            Fase 1 • Recepción del Vehículo
          </span>
          <h2 className="text-xl font-black text-[#010101] mt-0.5">
            Nuevo Check-in de Motocicleta
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Registro ágil del cliente, vehículo e inventario de entrada visual con fotografías.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#010101] text-white">
            Paso 1 de 7
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmitCheckIn} className="space-y-6">
        {/* Step 1: Client Selection */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#010101] text-white flex items-center justify-center">
                <User className="w-4 h-4 text-[#DD040F]" />
              </div>
              <h3 className="font-bold text-sm text-[#010101]">1. Datos del Cliente</h3>
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
                <label className="block text-xs font-semibold text-neutral-600 mb-1">
                  Buscar por Nombre o Teléfono
                </label>
                <input
                  type="text"
                  placeholder="Ej: Alejandro Morales o 55 1234..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>

              {filteredCustomers.length > 0 && !selectedCustomerId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredCustomers.map((cust) => (
                    <button
                      type="button"
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        if (cust.motorcycleIds.length > 0) {
                          setSelectedMotoId(cust.motorcycleIds[0]);
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
                <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#DD040F]">Cliente Seleccionado</span>
                    <p className="font-extrabold text-sm text-[#010101]">{selectedCustomer.fullName}</p>
                    <p className="text-xs text-neutral-600 font-mono">{selectedCustomer.phone} • {selectedCustomer.email}</p>
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
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Santillán"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">WhatsApp / Celular *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +52 55 1234 5678"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="carlos@gmail.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Motorcycle Selection / Registration */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#010101] text-white flex items-center justify-center">
                <Bike className="w-4 h-4 text-[#AAA8A9]" />
              </div>
              <h3 className="font-bold text-sm text-[#010101]">2. Datos de la Motocicleta</h3>
            </div>
            {selectedCustomer && (
              <button
                type="button"
                onClick={() => setIsNewMoto(!isNewMoto)}
                className="text-xs font-bold text-[#DD040F] hover:underline cursor-pointer"
              >
                {isNewMoto ? '← Usar Moto Registrada' : '+ Agregar Nueva Moto'}
              </button>
            )}
          </div>

          {!isNewMoto && customerMotorcycles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customerMotorcycles.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMotoId(m.id);
                    setMileage(m.currentMileage);
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedMotoId === m.id
                      ? 'border-[#010101] bg-[#010101] text-white shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 text-[#010101]'
                  }`}
                >
                  <p className="font-extrabold text-sm">{m.brand} {m.model} ({m.year})</p>
                  <p className={`text-xs font-mono ${selectedMotoId === m.id ? 'text-[#AAA8A9]' : 'text-neutral-600'}`}>
                    Placa: <strong>{m.plate}</strong> • {m.displacement}
                  </p>
                  <p className={`text-[11px] mt-1 ${selectedMotoId === m.id ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    KM actual: {m.currentMileage.toLocaleString()} km
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Marca *</label>
                <select
                  value={newMotoBrand}
                  onChange={(e) => setNewMotoBrand(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                >
                  <option value="Yamaha">Yamaha</option>
                  <option value="Honda">Honda</option>
                  <option value="KTM">KTM</option>
                  <option value="Kawasaki">Kawasaki</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="Bajaj">Bajaj</option>
                  <option value="BMW">BMW Motorrad</option>
                  <option value="Italika">Italika</option>
                  <option value="Ducati">Ducati</option>
                  <option value="Triumph">Triumph</option>
                  <option value="Vento">Vento</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: MT-07 o Duke 390"
                  value={newMotoModel}
                  onChange={(e) => setNewMotoModel(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Año</label>
                <input
                  type="number"
                  value={newMotoYear}
                  onChange={(e) => setNewMotoYear(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Cilindraje</label>
                <input
                  type="text"
                  placeholder="Ej: 300cc"
                  value={newMotoDisplacement}
                  onChange={(e) => setNewMotoDisplacement(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Placa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 84K-DF-3"
                  value={newMotoPlate}
                  onChange={(e) => setNewMotoPlate(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Color</label>
                <input
                  type="text"
                  placeholder="Ej: Negro Mate"
                  value={newMotoColor}
                  onChange={(e) => setNewMotoColor(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-neutral-600 mb-1">Número de Serie / VIN</label>
                <input
                  type="text"
                  placeholder="Ej: JYARN53E8PA04..."
                  value={newMotoVin}
                  onChange={(e) => setNewMotoVin(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm font-mono uppercase text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Check-in Visual */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-5">
          <div className="border-b pb-3 border-neutral-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#010101] text-white flex items-center justify-center">
              <Fuel className="w-4 h-4 text-[#DD040F]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#010101]">3. Inspección Visual de Entrada (Check-in)</h3>
              <p className="text-xs text-neutral-500">Condición física al ingresar al taller</p>
            </div>
          </div>

          {/* Kilometraje y Gasolina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#010101] mb-1">
                Kilometraje del Odómetro *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  value={mileage}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#AAA8A9] font-bold">KM</span>
              </div>
            </div>

            {/* Fuel Level Selector */}
            <div>
              <label className="block text-xs font-bold text-[#010101] mb-1">
                Nivel de Gasolina en Tanque: <strong className="text-[#DD040F]">{fuelLevel}%</strong>
              </label>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {([0, 25, 50, 75, 100] as FuelLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFuelLevel(lvl)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      fuelLevel === lvl
                        ? 'bg-[#DD040F] text-white border-[#DD040F] shadow-xs'
                        : 'bg-[#F8F9FA] text-[#010101] border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {lvl}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Daños Previos */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wide text-[#010101] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DD040F]" />
                Registro de Daños Previos (Rayones, Golpes, Fugas)
              </span>
              <span className="text-[11px] text-neutral-400">Protección legal del taller</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <select
                  value={newDamageZone}
                  onChange={(e) => setNewDamageZone(e.target.value as DamageReport['zone'])}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs text-[#010101]"
                >
                  {DAMAGE_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>{z.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={newDamageType}
                  onChange={(e) => setNewDamageType(e.target.value as DamageReport['type'])}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs text-[#010101]"
                >
                  <option value="rayón">Rayón / Raspón</option>
                  <option value="abolladura">Abolladura / Golpe</option>
                  <option value="plástico_roto">Plástico Roto / Fisurado</option>
                  <option value="espejo_roto">Espejo / Maneta Dañada</option>
                  <option value="fuga">Fuga de Líquido</option>
                  <option value="otro">Otro Detalle</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Detalle específico (ej. Raspón de 5cm)"
                  value={newDamageNotes}
                  onChange={(e) => setNewDamageNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-xs text-[#010101]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddDamage}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#010101] hover:bg-[#1a1a1a] text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Daño</span>
              </button>
            </div>

            {/* Damage List */}
            {damages.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {damages.map((dmg, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-neutral-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#010101] capitalize">{dmg.zone.replace('_', ' ')}</span>
                      <span className="mx-1.5 text-neutral-300">•</span>
                      <span className="text-[#DD040F] font-semibold uppercase text-[10px]">{dmg.type}</span>
                      <span className="mx-1.5 text-neutral-300">•</span>
                      <span className="text-neutral-600">{dmg.notes}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDamage(idx)}
                      className="text-neutral-400 hover:text-[#DD040F]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accesorios Dejados en Custodia */}
          <div>
            <label className="block text-xs font-bold text-[#010101] mb-2">
              Accesorios Dejados por el Cliente
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCESSORY_OPTIONS.map((acc) => {
                const isSelected = accessoriesLeft.includes(acc);
                return (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => toggleAccessory(acc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-[#010101] text-white border-[#010101] shadow-2xs'
                        : 'bg-[#F8F9FA] text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {acc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fotografías del Estado Inicial */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#010101] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-neutral-500" />
                Fotografías de Entrada (Respaldo visual)
              </label>
              <label className="text-xs font-bold text-[#DD040F] hover:underline cursor-pointer">
                + Subir Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddPhoto}
                  className="hidden"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {photos.map((pUrl, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden aspect-video bg-neutral-100 border border-neutral-200 group">
                  <img src={pUrl} alt="Foto moto" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#010101]/80 text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4: Motivo de Ingreso & Asignación */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="border-b pb-3 border-neutral-100">
            <h3 className="font-bold text-sm text-[#010101]">4. Motivo de Ingreso & Asignación</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#010101] mb-1">
              Motivo de la Visita / Fallas Reportadas por el Cliente *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ej: Falla en encendido matutino + Servicio general de 15,000 km + Ruido en cadena"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              className="w-full p-3 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#010101] mb-1">
                Asignar a Mecánico (Opcional)
              </label>
              <select
                value={assignedMechanicId}
                onChange={(e) => setAssignedMechanicId(e.target.value)}
                className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
              >
                <option value="">-- Sin Asignar (Pendiente) --</option>
                {staff
                  .filter((s) => s.role === 'mechanic')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.specialty || 'Mecánico General'})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#010101] mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'normal' | 'alta' | 'urgente')}
                className="w-full p-2.5 bg-[#F8F9FA] border border-neutral-200 rounded-xl text-xs sm:text-sm text-[#010101] focus:border-[#DD040F] focus:outline-hidden"
              >
                <option value="normal">Normal (Tiempo estándar)</option>
                <option value="alta">Alta (Mismo día)</option>
                <option value="urgente">Urgente (Emergencia / Vehículo de trabajo)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#DD040F] hover:bg-[#b5030c] text-white font-extrabold text-sm shadow-lg shadow-[#DD040F]/30 transition cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Generar Orden de Servicio (OS)</span>
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#010101] text-[#DD040F] flex items-center justify-center mx-auto border border-[#DD040F]/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-[#010101]">
                {createdOrder.id}
              </span>
              <h3 className="text-lg font-black text-[#010101] mt-2">
                ¡Orden de Servicio Generada con Éxito!
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                La moto {createdOrder.motorcycleInfo.brand} {createdOrder.motorcycleInfo.model} de {createdOrder.customerName} ha ingresado al taller.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTicketModal(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#010101] text-xs font-bold transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#010101] hover:bg-[#1a1a1a] text-white text-xs font-bold transition border border-neutral-700"
              >
                <MessageCircle className="w-4 h-4 text-[#DD040F]" />
                <span>Enviar WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreatedOrder(null);
                setReasonForVisit('');
                setDamages([]);
              }}
              className="w-full py-2.5 rounded-xl bg-[#DD040F] text-white text-xs font-bold hover:bg-[#b5030c] transition cursor-pointer"
            >
              Completar y Regresar al Tablero
            </button>
          </div>
        </div>
      )}

      {showTicketModal && createdOrder && (
        <TicketModal order={createdOrder} onClose={() => setShowTicketModal(false)} />
      )}

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
