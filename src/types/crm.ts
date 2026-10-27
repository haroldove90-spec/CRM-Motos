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
  notes?: string;
  estimatedTotal?: number;
  // Requerimientos 24-OCT: Marcas, garantías, imprevistos y entregas
  serviceType?: 'particular' | 'mantenimiento_marca' | 'garantia_marca';
  brandWarrantyFolio?: string;
  isWarrantyReentry?: boolean;
  promisedDeliveryDate?: string;
  additionalFindings?: {
    id: string;
    description: string;
    estimatedCost: number;
    status?: 'pendiente' | 'aprobada' | 'rechazada';
    reportedBy: string;
    createdAt?: string;
    reportedAt?: string;
    approvedByClient?: boolean;
  }[];
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
  cost?: number;
  price?: number;
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
  // Nómina formal, IMSS y sueldos reales (para contadora)
  baseSalary?: number;
  nssIMSS?: string;
  payrollFrequency?: 'semanal' | 'quincenal' | 'mensual';
  bankAccount?: string;
  curp?: string;
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

// 1. Gastos y Egresos Operativos
export interface Expense {
  id: string;
  concept: string; // e.g. Renta local Matriz, CFE / Luz, Insumos de limpieza, Herramienta especial
  category:
    | 'renta'
    | 'servicios'
    | 'servicios_luz_agua'
    | 'nomina'
    | 'nomina_imss'
    | 'insumos'
    | 'consumibles_taller'
    | 'herramientas'
    | 'mantenimiento_instalaciones'
    | 'publicidad'
    | 'impuestos'
    | 'otro';
  amount: number;
  date: string;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  invoiceOrTicket?: string;
  invoiceNumber?: string;
  taxDeductible?: boolean;
  notes?: string;
  registeredBy?: string;
}

// 2. Proveedores y Cuentas por Pagar
export interface Supplier {
  id: string;
  name: string;
  rfc?: string;
  contactName?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  category?: string;
  creditDays: number;
  creditLimit?: number;
  currentBalance: number;
  balance?: number; // Saldo pendiente
}

export interface SupplierInvoice {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'pendiente' | 'parcial' | 'pagada';
  items?: { description: string; quantity: number; unitCost: number; total: number }[];
  notes?: string;
}

// 3. Nómina Formal y Recibos (para Contadora)
export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  period: string; // e.g. "Semana 43 - Octubre 2026"
  baseSalary: number;
  commissionsEarned: number;
  bonus: number;
  deductions: number; // IMSS, préstamos, retenciones
  netPay: number;
  status: 'borrador' | 'pagado';
  paidAt?: string;
  paymentMethod?: 'efectivo' | 'transferencia';
}

// 4. Corte Diario de Caja (Arqueo)
export interface CashCut {
  id: string;
  date: string; // YYYY-MM-DD
  openedAt: string;
  closedAt?: string;
  initialCash: number; // Fondo inicial
  totalCashSales: number;
  totalCardSales: number;
  totalTransferSales: number;
  totalCashExpenses: number; // Retiros o compras menores
  expectedCashInDrawer: number;
  actualCashInDrawer: number;
  difference: number;
  status: 'abierta' | 'cerrada';
  notes?: string;
  closedBy?: string;
}

// 5. Ventas Rápidas de Mostrador (Punto de Venta Refacciones)
export interface CounterSale {
  id: string;
  folio: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: {
    inventoryItemId?: string;
    partNumber: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia';
  attendedBy: string;
  discount?: number;
}

// 6. Kardex / Movimientos de Almacén
export interface InventoryMovement {
  id: string;
  date: string;
  itemId: string;
  partNumber: string;
  itemName: string;
  type: 'entrada_compra' | 'salida_taller' | 'salida_mostrador' | 'ajuste_conteo' | 'devolucion' | 'merma';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string; // OS-101, Fac-502, etc.
  cost?: number;
  user: string;
}

// 7. Auditoría y Conteo Físico
export interface PhysicalCountItem {
  itemId: string;
  partNumber: string;
  name: string;
  systemStock: number;
  countedStock: number;
  difference: number;
  unitCost: number;
  differenceValue: number;
}

// 8. Marcas y Garantías Oficiales (Vento, Dinamo, etc.)
export interface BrandWarranty {
  id: string;
  brand: 'Vento' | 'Dinamo' | 'Italika' | 'Bajaj' | 'Honda' | 'Yamaha' | 'Otra';
  externalBrandFolio: string; // Folio de reclamo de la agencia
  orderId?: string;
  clientName: string;
  clientPhone: string;
  motorcycleModel: string;
  vin: string;
  claimDate: string;
  issueDescription: string;
  evidencePhotos: string[];
  partsRequested: { description: string; partNumber?: string; status: 'solicitada' | 'recibida' | 'instalada' }[];
  laborAmountToRecover: number;
  partsAmountToRecover: number;
  totalToRecover: number;
  payerResponsible: 'marca' | 'cliente' | 'compartido';
  brandResponseStatus: 'en_revision' | 'autorizada' | 'rechazada' | 'pagada';
  paymentStatus: 'pendiente' | 'facturada' | 'cobrada';
  brandInvoiceNumber?: string;
  brandPaidDate?: string;
  notes?: string;
}

// 9. Quejas y Satisfacción del Cliente (CRM)
export interface CustomerComplaint {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderId?: string;
  type: 'queja_calidad' | 'demora' | 'costo' | 'atencion' | 'garantia';
  description: string;
  status: 'abierta' | 'en_proceso' | 'resuelta';
  resolutionNotes?: string;
  resolvedAt?: string;
}

// 10. Módulo Técnico: Control de Marcas (Vento, Dinamo, MB, BDS, Veloci, Carabela)
export type BrandControlKey = 'vento' | 'dinamo' | 'mb' | 'bds' | 'veloci' | 'carabela';

export interface BrandVentoRecord {
  id: string;
  vin: string;
  ticket: string;
  modelo: string;
  fecha: string;
  armado: boolean;
  activado: boolean;
  cotizacion: string;
  garantia: string;
  tienda: string;
  ventonet: 'SI' | 'NO';
  facturado: 'SI' | 'NO';
  pagado: 'SI' | 'NO';
  estados: 'AUT. PENDIENTE' | 'CERRADO' | 'PAGO APROBADO' | 'REVISION DE DAÑOS' | 'RECHAZADO' | string;
  createdAt?: string;
}

export interface BrandDinamoRecord {
  id: string;
  chasis: string;
  modelo: string;
  fecha: string;
  agencia: string;
  armado: boolean;
  activado: boolean;
  garantia: boolean;
  servicioPrepagado: boolean | string;
  gestor: string;
  facturado: 'SI' | 'NO';
  cantidad: number;
  numeroFactura: string;
  cobrado: 'SI' | 'NO';
  createdAt?: string;
}

export interface BrandMBRecord {
  id: string;
  vin: string;
  fecha: string;
  modelo: string;
  tienda: string;
  armado: boolean;
  activado: boolean;
  garantia: boolean;
  estado: string;
  folioPCobro: string;
  facturado: 'SI' | 'NO';
  pagado: 'SI' | 'NO';
  createdAt?: string;
}

export interface BrandBDSRecord {
  id: string;
  vin: string;
  modelo: string;
  fecha: string;
  armado: boolean;
  activado: boolean;
  garantia: boolean;
  facturado: 'SI' | 'NO' | 'X';
  cantidad: number;
  numeroDeFactura: string;
  cobrado: 'SI' | 'NO';
  createdAt?: string;
}

export interface BrandVelociRecord {
  id: string;
  vin: string;
  fecha: string;
  armado: boolean;
  activado: boolean;
  garantia: boolean;
  facturado: 'SI' | 'NO';
  cobrado: 'SI' | 'NO';
  modelo?: string;
  createdAt?: string;
}

export interface BrandCarabelaRecord {
  id: string;
  vin: string;
  fecha: string;
  armado: boolean;
  activado: boolean;
  garantia: boolean;
  facturado: 'SI' | 'NO';
  cobrado: 'SI' | 'NO';
  modelo?: string;
  createdAt?: string;
}

export interface BrandControlData {
  vento: BrandVentoRecord[];
  dinamo: BrandDinamoRecord[];
  mb: BrandMBRecord[];
  bds: BrandBDSRecord[];
  veloci: BrandVelociRecord[];
  carabela: BrandCarabelaRecord[];
}
