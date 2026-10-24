/**
 * Types and interfaces for CRM Motos - Sistema Integral de Gestión para Talleres
 */

export type UserRole = 'admin' | 'reception' | 'mechanic' | 'warehouse' | 'client';

export type OrderStatus =
  | 'pendiente'               // Fase 1: Check-in realizado, esperando asignación
  | 'en_diagnostico'          // Fase 2: Mecánico diagnosticando
  | 'esperando_aprobacion'    // Fase 3: Presupuesto armado, esperando visto bueno del cliente
  | 'en_reparacion'           // Fase 4: En ejecución de reparación
  | 'esperando_refaccion'     // Fase 4 sub: Pausado temporalmente por falta de repuestos
  | 'pruebas_calidad'         // Fase 5: Pruebas de ruta, control de calidad y lavado
  | 'listo_entrega'           // Fase 6: Terminado, esperando retiro y cobro
  | 'entregado';              // Fase 6-7: Cobrado, firmado y entregado

export type FuelLevel = 0 | 25 | 50 | 75 | 100;

export interface DamageReport {
  zone: 'frente' | 'manubrio' | 'tanque' | 'carenado_izq' | 'carenado_der' | 'escape' | 'rueda_del' | 'rueda_tras' | 'asiento_colin';
  type: 'rayón' | 'abolladura' | 'plástico_roto' | 'espejo_roto' | 'fuga' | 'otro';
  severity: 'leve' | 'moderado' | 'grave';
  notes: string;
}

export interface MotoInventoryItemState {
  espejos: 'si' | 'no' | 'roto_danado';
  asiento: 'si' | 'no' | 'roto_danado';
  faroDelantero: 'si' | 'no' | 'roto_danado';
  luzFaroTrasero: 'si' | 'no' | 'roto_danado';
  direccionales: 'si' | 'no' | 'roto_danado';
  cubiertasCompletas: 'si' | 'no' | 'roto_danado';
  taponGasolina: 'si' | 'no' | 'roto_danado';
  tacometros: 'si' | 'no' | 'roto_danado';
  pedales: 'si' | 'no' | 'roto_danado';
  parabrisas: 'si' | 'no' | 'roto_danado';
  claxon: 'si' | 'no' | 'roto_danado';
}

export interface ServiceActivitiesState {
  ajusteFrenos: boolean;
  ajusteLubricacionCadena: boolean;
  revisionNiveles: boolean;
  carburacion: boolean;
  cambioAceiteMotor: boolean;
  cambioBujia: boolean;
  lubricacionAjusteChicotes: boolean;
  revisionPunterias: boolean;
  revisionLimpiezaSedazoAceite: boolean;
  revisionLimpiezaFiltroAire: boolean;
  ajusteTornilleria: boolean;
  verificacionElectrica: boolean;
}

export interface DiagramPoint {
  id: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  label: string;
  notes?: string;
}

export interface CheckInVisual {
  fuelLevel: FuelLevel;
  mileage: number;
  damages: DamageReport[];
  accessoriesLeft: string[]; // e.g. Casco, Llave baúl, Portaequipaje, Candado de disco, Documentos
  photos: string[]; // URLs or base64 images
  customerSignature?: string;
  notes: string;
  // Official QROMOTOS Hoja de Servicio fields:
  motoInventory?: MotoInventoryItemState;
  serviceActivities?: ServiceActivitiesState;
  diagramPoints?: DiagramPoint[];
  entryDate?: string;
  observations?: string;
}

export interface ServiceItem {
  id: string;
  clave?: string;
  rowNumber?: number;
  description: string;
  type: 'mano_de_obra' | 'repuesto';
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  approvedByClient: boolean;
  isDispensed?: boolean; // Surtido por el almacén
}

export interface TimeLog {
  id: string;
  mechanicId: string;
  mechanicName: string;
  startTime: string; // ISO
  endTime?: string;  // ISO
  secondsElapsed: number;
  notes?: string;
}

export interface QualityCheckItem {
  key: string;
  label: string;
  checked: boolean;
  verifiedBy?: string;
}

export interface PaymentRecord {
  id: string;
  method: 'efectivo' | 'tarjeta' | 'transferencia';
  amount: number;
  date: string;
  reference?: string;
  invoiceNumber: string;
}

export interface ServiceOrder {
  id: string;               // e.g. "OS-2026-104"
  orderNumber: number;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  motorcycleId: string;
  motorcycleInfo: {
    brand: string;
    model: string;
    year: number;
    displacement: string; // e.g. "250cc"
    plate: string;
    vin: string;
    color: string;
  };
  reasonForVisit: string;
  status: OrderStatus;
  priority: 'normal' | 'alta' | 'urgente';
  assignedMechanicId?: string;
  assignedMechanicName?: string;
  checkIn: CheckInVisual;
  items: ServiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  deposit: number; // Anticipo
  payments: PaymentRecord[];
  timeLogs: TimeLog[];
  totalWorkedSeconds: number;
  isTimerRunning?: boolean;
  timerStartedAt?: number; // timestamp
  diagnosticNotes?: string;
  diagnosticPhotos?: string[];
  qualityChecklist: QualityCheckItem[];
  washedAndCleaned: boolean;
  readyNotifiedAt?: string;
  checkoutSignature?: string;
  checkoutNotes?: string;
  satisfactionRating?: {
    stars: number; // 1 to 5
    comment?: string;
    ratedAt: string;
  };
  nextServiceReminderDate?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address?: string;
  taxId?: string; // RFC o Cédula fiscal
  createdAt: string;
  motorcycleIds: string[];
}

export interface Motorcycle {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  year: number;
  displacement: string;
  plate: string;
  vin: string;
  color: string;
  currentMileage: number;
  lastServiceDate?: string;
}

export interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  brand: string;
  category: 'aceites_fluidos' | 'frenos' | 'motor' | 'transmision' | 'electricidad' | 'neumaticos' | 'filtros' | 'accesorios';
  compatibleModels: string[]; // e.g. ["Yamaha MT-03", "Yamaha R3", "Italika 250Z"]
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  location?: string; // e.g. "Estante B-3"
}

export interface StaffUser {
  id: string;
  fullName: string;
  role: 'admin' | 'reception' | 'mechanic' | 'warehouse';
  phone: string;
  email: string;
  active: boolean;
  commissionPercentage: number; // e.g. 15% sobre mano de obra
  specialty?: string; // e.g. "Motores 4T y Diagnóstico Eléctrico"
  jobsCompleted?: number;
}

export interface WorkshopSettings {
  workshopName: string;
  legalName: string;
  taxId: string; // RFC o CIF
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  logoUrl: string;
  currencySymbol: string;
  taxPercentage: number; // e.g. 16%
  standardLaborHourRate: number;
  warrantyPolicy: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  // Ajustes de Contrato de Adhesión PROFECO
  profecoRegistrationNumber?: string;
  profecoRegistrationDate?: string;
  profecoRepresentative?: string;
  profecoScheduleAttention?: string;
  profecoDefaultWarrantyDays?: number;
  profecoDefaultPenaltyPercent?: number;
  profecoDefaultTestRadiusKm?: number;
  profecoDefaultCancellationDays?: number;
}

export interface KPIData {
  activeRepairs: number;
  todayRevenue: number;
  monthRevenue: number;
  deliveredThisMonth: number;
  pendingServices: number;
  averageTicket: number;
}

export interface ProfecoContract {
  id: string;                      // e.g. "PFC-2026-001"
  contractNumber: string;          // e.g. "PFC-2026-001"
  orderId?: string;                // ID de orden de servicio ligada
  date: string;                    // YYYY-MM-DD
  status: 'firmado' | 'borrador' | 'cancelado';
  // I. Prestador del Servicio
  providerName: string;
  providerRepresentative: string;
  providerRfc: string;
  providerAddress: string;
  providerPhone: string;
  providerEmail: string;
  profecoRegistrationNumber: string;
  profecoRegistrationDate: string;
  scheduleAttention: string;
  // II. El Consumidor
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerRfc?: string;
  // Motocicleta
  motorcycleBrand: string;
  motorcycleModel: string;
  motorcycleYear: number | string;
  motorcyclePlate: string;
  motorcycleVin: string;
  motorcycleColor: string;
  motorcycleMileage: number | string;
  // Presupuesto y Condiciones
  serviceDescription: string;
  agreedBudget: number;            // Presupuesto total con IVA
  deposit: number;                 // Anticipo pagado
  pendingBalance: number;          // Saldo al retirar
  deliveryDate: string;            // Fecha estimada / compromiso
  warrantyDays: number;            // Default 90 días (Cláusula 7)
  testRadiusKm: number;            // Default 5 km (Cláusula 8)
  penaltyPercent: number;          // Default 15% (Cláusula 11)
  storageWaitHours: number;        // Default 48 hrs (Cláusula 12)
  cancellationDays: number;        // Default 5 días (Cláusula 17)
  notes?: string;
  // Firmas
  consumerSignature?: string;
  providerSignature?: string;
  createdAt: string;
  updatedAt: string;
}
