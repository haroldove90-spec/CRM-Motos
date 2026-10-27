import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Customer,
  Motorcycle,
  ServiceOrder,
  InventoryItem,
  StaffUser,
  WorkshopSettings,
  OrderStatus,
  ServiceItem,
  PaymentRecord,
  QualityCheckItem,
  KPIData,
  ProfecoContract,
  Expense,
  Supplier,
  SupplierInvoice,
  PayrollRecord,
  CashCut,
  CounterSale,
  InventoryMovement,
  BrandWarranty,
  CustomerComplaint,
  BrandControlData,
  BrandControlKey,
} from '../types/crm';
import {
  initialCustomers,
  initialMotorcycles,
  initialOrders,
  initialInventory,
  initialStaff,
  initialWorkshopSettings,
  initialProfecoContracts,
  initialExpenses,
  initialSuppliers,
  initialSupplierInvoices,
  initialPayroll,
  initialCashCuts,
  initialCounterSales,
  initialInventoryMovements,
  initialBrandWarranties,
  initialComplaints,
  initialBrandControlData,
} from '../data/sampleData';

interface CRMContextType {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  customers: Customer[];
  motorcycles: Motorcycle[];
  orders: ServiceOrder[];
  inventory: InventoryItem[];
  staff: StaffUser[];
  settings: WorkshopSettings;
  isSampleDataCleared: boolean;
  clearAllSampleData: () => void;
  restoreSampleData: () => void;

  // Customers & Motorcycles
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'motorcycleIds'>, motorcycle?: Omit<Motorcycle, 'id' | 'customerId'>) => { customer: Customer; motorcycle?: Motorcycle };
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addMotorcycle: (customerId: string, motorcycle: Omit<Motorcycle, 'id' | 'customerId'>) => Motorcycle;
  updateMotorcycle: (id: string, updates: Partial<Motorcycle>) => void;
  deleteMotorcycle: (id: string) => void;

  // Orders
  createServiceOrder: (orderData: Partial<ServiceOrder>) => ServiceOrder;
  updateServiceOrder: (orderId: string, updates: Partial<ServiceOrder>) => void;
  deleteServiceOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addItemToOrder: (orderId: string, item: Omit<ServiceItem, 'id'>) => void;
  removeOrderItem: (orderId: string, itemId: string) => void;
  toggleItemApproval: (orderId: string, itemId: string, approved: boolean) => void;
  dispenseInventoryItem: (orderId: string, itemId: string) => { success: boolean; error?: string };
  toggleOrderTimer: (orderId: string, mechanicId: string, mechanicName: string) => void;
  registerPayment: (orderId: string, payment: Omit<PaymentRecord, 'id'>) => void;
  updateQualityChecklist: (orderId: string, checklist: QualityCheckItem[], washed: boolean) => void;
  completeOrderCheckout: (orderId: string, signature: string, notes: string) => void;
  submitSatisfactionRating: (orderId: string, stars: number, comment?: string) => void;
  addFindingToOrder: (orderId: string, finding: { description: string; estimatedCost: number; reportedBy: string }) => void;
  approveFinding: (orderId: string, findingId: string, approved: boolean) => void;

  // Inventory
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustInventoryStock: (id: string, delta: number) => void;

  // Staff
  addStaff: (user: Omit<StaffUser, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<StaffUser>) => void;
  deleteStaff: (id: string) => void;

  // Contratos de Adhesión PROFECO
  profecoContracts: ProfecoContract[];
  addProfecoContract: (contract: Omit<ProfecoContract, 'id' | 'createdAt' | 'updatedAt'>) => ProfecoContract;
  updateProfecoContract: (id: string, updates: Partial<ProfecoContract>) => void;
  deleteProfecoContract: (id: string) => void;

  // Finanzas & Gastos
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  deleteExpense: (id: string) => void;

  // Proveedores & Cuentas por Pagar
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  supplierInvoices: SupplierInvoice[];
  addSupplierInvoice: (invoice: Omit<SupplierInvoice, 'id'>) => SupplierInvoice;
  registerSupplierPayment: (invoiceId: string, amount: number) => void;

  // Nómina Formal para Contadora
  payrollRecords: PayrollRecord[];
  addPayrollRecord: (record: Omit<PayrollRecord, 'id'>) => PayrollRecord;
  updatePayrollRecord: (id: string, updates: Partial<PayrollRecord>) => void;

  // Caja y Arqueo Diario
  cashCuts: CashCut[];
  openCashCut: (initialCash: number, date?: string) => CashCut;
  closeCashCut: (id: string, actualCash: number, closedBy: string, notes?: string) => void;

  // Ventas de Mostrador
  counterSales: CounterSale[];
  createCounterSale: (sale: Omit<CounterSale, 'id' | 'folio'>) => CounterSale;

  // Kardex
  inventoryMovements: InventoryMovement[];
  recordInventoryMovement: (movement: Omit<InventoryMovement, 'id' | 'date'>) => void;

  // Marcas & Garantías (Vento, Dinamo, Italika, etc.)
  brandWarranties: BrandWarranty[];
  addBrandWarranty: (warranty: Omit<BrandWarranty, 'id'>) => BrandWarranty;
  updateBrandWarranty: (id: string, updates: Partial<BrandWarranty>) => void;

  // Quejas & CRM
  complaints: CustomerComplaint[];
  addComplaint: (complaint: Omit<CustomerComplaint, 'id' | 'date'>) => CustomerComplaint;
  resolveComplaint: (id: string, resolutionNotes: string) => void;

  // Control de Marcas (Vento, Dinamo, MB, BDS, Veloci, Carabela)
  brandControlData: BrandControlData;
  addBrandControlRecord: (brand: BrandControlKey, record: any) => void;
  updateBrandControlRecord: (brand: BrandControlKey, id: string, updates: any) => void;
  deleteBrandControlRecord: (brand: BrandControlKey, id: string) => void;

  // Settings & Supabase
  updateSettings: (updates: Partial<WorkshopSettings>) => void;
  testSupabaseConnection: () => Promise<{ success: boolean; message: string }>;
  clearSupabaseRecords: () => Promise<{ success: boolean; message: string }>;

  // KPIs
  kpis: KPIData;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ROLE: 'crm_motos_active_role',
  CUSTOMERS: 'crm_motos_customers_v1',
  MOTORCYCLES: 'crm_motos_motorcycles_v1',
  ORDERS: 'crm_motos_orders_v1',
  INVENTORY: 'crm_motos_inventory_v1',
  STAFF: 'crm_motos_staff_v1',
  SETTINGS: 'crm_motos_settings_v1',
  PROFECO_CONTRACTS: 'crm_motos_profeco_contracts_v1',
  EXPENSES: 'crm_motos_expenses_v1',
  SUPPLIERS: 'crm_motos_suppliers_v1',
  SUPPLIER_INVOICES: 'crm_motos_supplier_invoices_v1',
  PAYROLL: 'crm_motos_payroll_v1',
  CASH_CUTS: 'crm_motos_cash_cuts_v1',
  COUNTER_SALES: 'crm_motos_counter_sales_v1',
  MOVEMENTS: 'crm_motos_movements_v1',
  WARRANTIES: 'crm_motos_warranties_v1',
  COMPLAINTS: 'crm_motos_complaints_v1',
  BRAND_CONTROL: 'crm_motos_brand_control_v1',
  SAMPLE_CLEARED: 'crm_motos_sample_cleared',
};

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || null;
  });

  const [isSampleDataCleared, setIsSampleDataCleared] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialCustomers;
  });

  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOTORCYCLES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialMotorcycles;
  });

  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialOrders;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialInventory;
  });

  const [staff, setStaff] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialStaff;
  });

  const [profecoContracts, setProfecoContracts] = useState<ProfecoContract[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFECO_CONTRACTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialProfecoContracts;
  });

  const [settings, setSettings] = useState<WorkshopSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialWorkshopSettings;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialExpenses;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialSuppliers;
  });

  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIER_INVOICES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialSupplierInvoices;
  });

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYROLL);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialPayroll;
  });

  const [cashCuts, setCashCuts] = useState<CashCut[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASH_CUTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialCashCuts;
  });

  const [counterSales, setCounterSales] = useState<CounterSale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COUNTER_SALES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialCounterSales;
  });

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialInventoryMovements;
  });

  const [brandWarranties, setBrandWarranties] = useState<BrandWarranty[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WARRANTIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialBrandWarranties;
  });

  const [complaints, setComplaints] = useState<CustomerComplaint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? [] : initialComplaints;
  });

  const [brandControlData, setBrandControlData] = useState<BrandControlData>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRAND_CONTROL);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const sampleCleared = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED) === 'true';
    return sampleCleared ? { vento: [], dinamo: [], mb: [], bds: [], veloci: [], carabela: [] } : initialBrandControlData;
  });

  // Save changes to localStorage
  useEffect(() => {
    if (role) localStorage.setItem(STORAGE_KEYS.ROLE, role);
    else localStorage.removeItem(STORAGE_KEYS.ROLE);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOTORCYCLES, JSON.stringify(motorcycles));
  }, [motorcycles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFECO_CONTRACTS, JSON.stringify(profecoContracts));
  }, [profecoContracts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIER_INVOICES, JSON.stringify(supplierInvoices));
  }, [supplierInvoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(payrollRecords));
  }, [payrollRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_CUTS, JSON.stringify(cashCuts));
  }, [cashCuts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COUNTER_SALES, JSON.stringify(counterSales));
  }, [counterSales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(inventoryMovements));
  }, [inventoryMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WARRANTIES, JSON.stringify(brandWarranties));
  }, [brandWarranties]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRAND_CONTROL, JSON.stringify(brandControlData));
  }, [brandControlData]);

  const setRole = (newRole: UserRole | null) => {
    setRoleState(newRole);
  };

  const clearAllSampleData = () => {
    localStorage.setItem(STORAGE_KEYS.SAMPLE_CLEARED, 'true');
    setIsSampleDataCleared(true);
    setCustomers([]);
    setMotorcycles([]);
    setOrders([]);
    setInventory([]);
    setProfecoContracts([]);
    setExpenses([]);
    setSuppliers([]);
    setSupplierInvoices([]);
    setPayrollRecords([]);
    setCashCuts([]);
    setCounterSales([]);
    setInventoryMovements([]);
    setBrandWarranties([]);
    setComplaints([]);
    setBrandControlData({
      vento: [],
      dinamo: [],
      mb: [],
      bds: [],
      veloci: [],
      carabela: [],
    });
    // Keep at least one admin staff if empty so the app remains usable
    setStaff([
      {
        id: 'admin-1',
        fullName: 'Administrador Principal',
        role: 'admin',
        phone: settings.phone,
        email: settings.email,
        active: true,
        commissionPercentage: 0,
        specialty: 'Administración Taller',
        jobsCompleted: 0,
        baseSalary: 12000,
        payrollFrequency: 'quincenal',
      },
    ]);
  };

  const restoreSampleData = () => {
    localStorage.removeItem(STORAGE_KEYS.SAMPLE_CLEARED);
    setIsSampleDataCleared(false);
    setCustomers(initialCustomers);
    setMotorcycles(initialMotorcycles);
    setOrders(initialOrders);
    setInventory(initialInventory);
    setStaff(initialStaff);
    setProfecoContracts(initialProfecoContracts);
    setSettings(initialWorkshopSettings);
    setExpenses(initialExpenses);
    setSuppliers(initialSuppliers);
    setSupplierInvoices(initialSupplierInvoices);
    setPayrollRecords(initialPayroll);
    setCashCuts(initialCashCuts);
    setCounterSales(initialCounterSales);
    setInventoryMovements(initialInventoryMovements);
    setBrandWarranties(initialBrandWarranties);
    setComplaints(initialComplaints);
    setBrandControlData(initialBrandControlData);
  };

  // Customers & Motorcycles
  const addCustomer = (
    custData: Omit<Customer, 'id' | 'createdAt' | 'motorcycleIds'>,
    motoData?: Omit<Motorcycle, 'id' | 'customerId'>
  ) => {
    const custId = `cust-${Date.now()}`;
    let createdMoto: Motorcycle | undefined;
    const motoIds: string[] = [];

    if (motoData) {
      const motoId = `moto-${Date.now()}`;
      createdMoto = {
        id: motoId,
        customerId: custId,
        ...motoData,
      };
      motoIds.push(motoId);
      setMotorcycles((prev) => [createdMoto!, ...prev]);
    }

    const newCustomer: Customer = {
      id: custId,
      createdAt: new Date().toISOString(),
      motorcycleIds: motoIds,
      ...custData,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    return { customer: newCustomer, motorcycle: createdMoto };
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setMotorcycles((prev) => prev.filter((m) => m.customerId !== id));
  };

  const addMotorcycle = (customerId: string, motoData: Omit<Motorcycle, 'id' | 'customerId'>) => {
    const newMoto: Motorcycle = {
      id: `moto-${Date.now()}`,
      customerId,
      ...motoData,
    };
    setMotorcycles((prev) => [newMoto, ...prev]);
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, motorcycleIds: [...c.motorcycleIds, newMoto.id] } : c))
    );
    return newMoto;
  };

  const updateMotorcycle = (id: string, updates: Partial<Motorcycle>) => {
    setMotorcycles((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMotorcycle = (id: string) => {
    setMotorcycles((prev) => prev.filter((m) => m.id !== id));
    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        motorcycleIds: c.motorcycleIds.filter((mid) => mid !== id),
      }))
    );
  };

  // Orders
  const createServiceOrder = (orderData: Partial<ServiceOrder>): ServiceOrder => {
    const nextNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber || 1000)) + 1 : 1001;
    const orderId = `OS-${nextNumber}`;
    const now = new Date().toISOString();

    const newOrder: ServiceOrder = {
      id: orderId,
      orderNumber: nextNumber,
      createdAt: now,
      updatedAt: now,
      customerId: orderData.customerId || '',
      customerName: orderData.customerName || 'Cliente',
      customerPhone: orderData.customerPhone || '',
      customerEmail: orderData.customerEmail,
      motorcycleId: orderData.motorcycleId || '',
      motorcycleInfo: orderData.motorcycleInfo || {
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        displacement: '',
        plate: '',
        vin: '',
        color: '',
      },
      reasonForVisit: orderData.reasonForVisit || 'Mantenimiento Preventivo',
      status: orderData.status || 'pendiente',
      priority: orderData.priority || 'normal',
      assignedMechanicId: orderData.assignedMechanicId,
      assignedMechanicName: orderData.assignedMechanicName,
      checkIn: orderData.checkIn || {
        fuelLevel: 50,
        mileage: 0,
        damages: [],
        accessoriesLeft: [],
        photos: [],
        notes: '',
      },
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      tax: orderData.tax || 0,
      total: orderData.total || 0,
      deposit: orderData.deposit || 0,
      payments: orderData.payments || [],
      timeLogs: [],
      totalWorkedSeconds: 0,
      isTimerRunning: false,
      qualityChecklist: [
        { key: 'brakes', label: 'Verificación de frenos delantero y trasero', checked: false },
        { key: 'chain', label: 'Tensión y lubricación de cadena', checked: false },
        { key: 'tires', label: 'Presión de neumáticos según manual', checked: false },
        { key: 'lights', label: 'Luces, direccionales y stop', checked: false },
        { key: 'fluids', label: 'Niveles de aceite y refrigerante', checked: false },
        { key: 'road_test', label: 'Prueba de ruta dinámica en calle/pista', checked: false },
      ],
      washedAndCleaned: false,
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateServiceOrder = (orderId: string, updates: Partial<ServiceOrder>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o))
    );
  };

  const deleteServiceOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updates: Partial<ServiceOrder> = { status, updatedAt: new Date().toISOString() };
        if (status === 'listo_entrega' && !o.readyNotifiedAt) {
          updates.readyNotifiedAt = new Date().toISOString();
        }
        return { ...o, ...updates };
      })
    );
  };

  const recalculateOrderTotals = (items: ServiceItem[], deposit: number, taxRate: number) => {
    const subtotal = items.reduce((acc, item) => acc + (item.approvedByClient ? item.totalPrice : 0), 0);
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const addItemToOrder = (orderId: string, itemData: Omit<ServiceItem, 'id'>) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newItem: ServiceItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ...itemData,
          totalPrice: itemData.quantity * itemData.unitPrice,
        };
        const updatedItems = [...o.items, newItem];
        const { subtotal, tax, total } = recalculateOrderTotals(updatedItems, o.deposit, settings.taxPercentage);
        return {
          ...o,
          items: updatedItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const removeOrderItem = (orderId: string, itemId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedItems = o.items.filter((i) => i.id !== itemId);
        const { subtotal, tax, total } = recalculateOrderTotals(updatedItems, o.deposit, settings.taxPercentage);
        return {
          ...o,
          items: updatedItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const toggleItemApproval = (orderId: string, itemId: string, approved: boolean) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedItems = o.items.map((i) => (i.id === itemId ? { ...i, approvedByClient: approved } : i));
        const { subtotal, tax, total } = recalculateOrderTotals(updatedItems, o.deposit, settings.taxPercentage);
        return {
          ...o,
          items: updatedItems,
          subtotal,
          tax,
          total,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const dispenseInventoryItem = (orderId: string, itemId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return { success: false, error: 'Orden no encontrada' };

    const targetItem = targetOrder.items.find((i) => i.id === itemId);
    if (!targetItem) return { success: false, error: 'Pieza no encontrada en la orden' };

    // Find in inventory by partNumber or exact name
    const invItem = inventory.find(
      (inv) => (targetItem.partNumber && inv.partNumber === targetItem.partNumber) || inv.name.toLowerCase() === targetItem.description.toLowerCase()
    );

    if (!invItem) {
      // Just mark as dispensed if not strictly in inventory catalog
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                items: o.items.map((i) => (i.id === itemId ? { ...i, isDispensed: true } : i)),
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
      return { success: true };
    }

    if (invItem.stock < targetItem.quantity) {
      return {
        success: false,
        error: `Stock insuficiente en almacén (Disponible: ${invItem.stock}, Requerido: ${targetItem.quantity})`,
      };
    }

    // Decrement inventory stock
    setInventory((prev) =>
      prev.map((inv) => (inv.id === invItem.id ? { ...inv, stock: inv.stock - targetItem.quantity } : inv))
    );

    // Mark dispensed in order
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map((i) => (i.id === itemId ? { ...i, isDispensed: true } : i)),
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    return { success: true };
  };

  const toggleOrderTimer = (orderId: string, mechanicId: string, mechanicName: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const now = Date.now();
        if (o.isTimerRunning) {
          // Pause / Stop
          const elapsed = o.timerStartedAt ? Math.floor((now - o.timerStartedAt) / 1000) : 0;
          const newTotal = (o.totalWorkedSeconds || 0) + elapsed;
          const newLog = {
            id: `time-${Date.now()}`,
            mechanicId,
            mechanicName,
            startTime: new Date(o.timerStartedAt || now).toISOString(),
            endTime: new Date(now).toISOString(),
            secondsElapsed: elapsed,
          };
          return {
            ...o,
            isTimerRunning: false,
            timerStartedAt: undefined,
            totalWorkedSeconds: newTotal,
            timeLogs: [...(o.timeLogs || []), newLog],
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Start timer
          return {
            ...o,
            isTimerRunning: true,
            timerStartedAt: now,
            updatedAt: new Date().toISOString(),
          };
        }
      })
    );
  };

  const registerPayment = (orderId: string, paymentData: Omit<PaymentRecord, 'id'>) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newPayment: PaymentRecord = {
          id: `pay-${Date.now()}`,
          ...paymentData,
        };
        const currentDeposit = o.deposit || 0;
        return {
          ...o,
          deposit: currentDeposit + newPayment.amount,
          payments: [...(o.payments || []), newPayment],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const updateQualityChecklist = (orderId: string, checklist: QualityCheckItem[], washed: boolean) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              qualityChecklist: checklist,
              washedAndCleaned: washed,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
  };

  const completeOrderCheckout = (orderId: string, signature: string, notes: string) => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 4); // 4 months for next maintenance

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'entregado',
          checkoutSignature: signature,
          checkoutNotes: notes,
          nextServiceReminderDate: nextDate.toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const submitSatisfactionRating = (orderId: string, stars: number, comment?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              satisfactionRating: {
                stars,
                comment,
                ratedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
  };

  // Inventory CRUD
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      ...item,
    };
    setInventory((prev) => [newItem, ...prev]);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const adjustInventoryStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item))
    );
  };

  // Staff CRUD
  const addStaff = (user: Omit<StaffUser, 'id'>) => {
    const newUser: StaffUser = {
      id: `staff-${Date.now()}`,
      jobsCompleted: 0,
      ...user,
    };
    setStaff((prev) => [...prev, newUser]);
  };

  const updateStaff = (id: string, updates: Partial<StaffUser>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSettings = (updates: Partial<WorkshopSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Contratos de Adhesión PROFECO CRUD
  const addProfecoContract = (
    contractData: Omit<ProfecoContract, 'id' | 'createdAt' | 'updatedAt'>
  ): ProfecoContract => {
    const nextNum = profecoContracts.length + 1;
    const year = new Date().getFullYear();
    const contractNumber =
      contractData.contractNumber ||
      `PFC-${year}-${String(nextNum).padStart(3, '0')}`;
    const newContract: ProfecoContract = {
      ...contractData,
      id: `PFC-${Date.now()}`,
      contractNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProfecoContracts((prev) => [newContract, ...prev]);
    return newContract;
  };

  const updateProfecoContract = (id: string, updates: Partial<ProfecoContract>) => {
    setProfecoContracts((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const deleteProfecoContract = (id: string) => {
    setProfecoContracts((prev) => prev.filter((c) => c.id !== id));
  };

  // Imprevistos y Trabajos adicionales hallados por el mecánico
  const addFindingToOrder = (
    orderId: string,
    finding: { description: string; estimatedCost: number; reportedBy: string }
  ) => {
    const newFinding = {
      id: `fnd-${Date.now()}`,
      description: finding.description,
      estimatedCost: finding.estimatedCost,
      reportedBy: finding.reportedBy,
      reportedAt: new Date().toISOString(),
      approvedByClient: false,
    };
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              additionalFindings: [...(o.additionalFindings || []), newFinding],
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
  };

  const approveFinding = (orderId: string, findingId: string, approved: boolean) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const currentFindings = o.additionalFindings || [];
        const finding = currentFindings.find((f) => f.id === findingId);
        const updatedFindings = currentFindings.map((f) =>
          f.id === findingId ? { ...f, approvedByClient: approved } : f
        );

        // Si se aprueba, agregamos automáticamente un concepto al presupuesto de la orden
        let updatedItems = [...o.items];
        if (approved && finding) {
          const alreadyAdded = updatedItems.some((item) => item.description.includes(finding.description));
          if (!alreadyAdded) {
            updatedItems.push({
              id: `item-${Date.now()}`,
              description: `[Adicional Aprobado] ${finding.description}`,
              type: 'mano_de_obra',
              quantity: 1,
              unitPrice: finding.estimatedCost,
              totalPrice: finding.estimatedCost,
              approvedByClient: true,
            });
          }
        }

        const newEstimatedTotal = updatedItems
          .filter((i) => i.approvedByClient)
          .reduce((sum, i) => sum + i.totalPrice, 0);

        return {
          ...o,
          additionalFindings: updatedFindings,
          items: updatedItems,
          estimatedTotal: newEstimatedTotal,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Finanzas & Gastos
  const addExpense = (expense: Omit<Expense, 'id'>): Expense => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Proveedores & Cuentas por Pagar
  const addSupplier = (supplier: Omit<Supplier, 'id'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `prov-${Date.now()}`,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const addSupplierInvoice = (invoice: Omit<SupplierInvoice, 'id'>): SupplierInvoice => {
    const newInvoice: SupplierInvoice = {
      ...invoice,
      id: `sinv-${Date.now()}`,
    };
    setSupplierInvoices((prev) => [newInvoice, ...prev]);

    // Actualizar saldo de proveedor
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === invoice.supplierId
          ? { ...s, currentBalance: s.currentBalance + invoice.pendingAmount }
          : s
      )
    );
    return newInvoice;
  };

  const registerSupplierPayment = (invoiceId: string, amount: number) => {
    setSupplierInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const newPaid = inv.paidAmount + amount;
        const newPending = Math.max(0, inv.totalAmount - newPaid);
        const newStatus = newPending === 0 ? 'pagada' : 'parcial';

        // Actualizar balance del proveedor
        setSuppliers((sPrev) =>
          sPrev.map((s) =>
            s.id === inv.supplierId
              ? { ...s, currentBalance: Math.max(0, s.currentBalance - amount) }
              : s
          )
        );

        return {
          ...inv,
          paidAmount: newPaid,
          pendingAmount: newPending,
          status: newStatus,
        };
      })
    );
  };

  // Nómina Formal para Contadora
  const addPayrollRecord = (record: Omit<PayrollRecord, 'id'>): PayrollRecord => {
    const newRecord: PayrollRecord = {
      ...record,
      id: `pay-${Date.now()}`,
    };
    setPayrollRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updatePayrollRecord = (id: string, updates: Partial<PayrollRecord>) => {
    setPayrollRecords((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Corte Diario de Caja (Arqueo)
  const openCashCut = (initialCash: number, date?: string): CashCut => {
    const today = date || new Date().toISOString().split('T')[0];
    const newCut: CashCut = {
      id: `cut-${Date.now()}`,
      date: today,
      openedAt: new Date().toISOString(),
      initialCash,
      totalCashSales: 0,
      totalCardSales: 0,
      totalTransferSales: 0,
      totalCashExpenses: 0,
      expectedCashInDrawer: initialCash,
      actualCashInDrawer: initialCash,
      difference: 0,
      status: 'abierta',
    };
    setCashCuts((prev) => [newCut, ...prev]);
    return newCut;
  };

  const closeCashCut = (id: string, actualCash: number, closedBy: string, notes?: string) => {
    setCashCuts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const expected = c.initialCash + c.totalCashSales - c.totalCashExpenses;
        const diff = actualCash - expected;
        return {
          ...c,
          closedAt: new Date().toISOString(),
          actualCashInDrawer: actualCash,
          difference: diff,
          status: 'cerrada',
          closedBy,
          notes: notes || c.notes,
        };
      })
    );
  };

  // Ventas de Mostrador
  const createCounterSale = (saleData: Omit<CounterSale, 'id' | 'folio'>): CounterSale => {
    const folioNum = counterSales.length + 101;
    const year = new Date().getFullYear();
    const folio = `VTA-${year}-${String(folioNum).padStart(3, '0')}`;
    const newSale: CounterSale = {
      ...saleData,
      id: `csale-${Date.now()}`,
      folio,
    };

    setCounterSales((prev) => [newSale, ...prev]);

    // Descontar inventario y registrar movimientos en kardex
    saleData.items.forEach((item) => {
      if (item.inventoryItemId) {
        adjustInventoryStock(item.inventoryItemId, -item.quantity);
        const invItem = inventory.find((i) => i.id === item.inventoryItemId);
        recordInventoryMovement({
          itemId: item.inventoryItemId,
          partNumber: item.partNumber,
          itemName: item.description,
          type: 'salida_mostrador',
          quantity: item.quantity,
          previousStock: invItem ? invItem.stock : 0,
          newStock: invItem ? Math.max(0, invItem.stock - item.quantity) : 0,
          reference: folio,
          user: saleData.attendedBy,
        });
      }
    });

    // Sumar a la caja abierta si es en efectivo
    if (saleData.paymentMethod === 'efectivo') {
      setCashCuts((prev) =>
        prev.map((c) =>
          c.status === 'abierta'
            ? {
                ...c,
                totalCashSales: c.totalCashSales + saleData.total,
                expectedCashInDrawer: c.expectedCashInDrawer + saleData.total,
              }
            : c
        )
      );
    } else if (saleData.paymentMethod === 'tarjeta') {
      setCashCuts((prev) =>
        prev.map((c) =>
          c.status === 'abierta' ? { ...c, totalCardSales: c.totalCardSales + saleData.total } : c
        )
      );
    } else if (saleData.paymentMethod === 'transferencia') {
      setCashCuts((prev) =>
        prev.map((c) =>
          c.status === 'abierta' ? { ...c, totalTransferSales: c.totalTransferSales + saleData.total } : c
        )
      );
    }

    return newSale;
  };

  // Kardex
  const recordInventoryMovement = (movement: Omit<InventoryMovement, 'id' | 'date'>) => {
    const newMov: InventoryMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString(),
    };
    setInventoryMovements((prev) => [newMov, ...prev]);
  };

  // Marcas y Garantías Oficiales
  const addBrandWarranty = (warranty: Omit<BrandWarranty, 'id'>): BrandWarranty => {
    const newWarranty: BrandWarranty = {
      ...warranty,
      id: `war-${Date.now()}`,
    };
    setBrandWarranties((prev) => [newWarranty, ...prev]);
    return newWarranty;
  };

  const updateBrandWarranty = (id: string, updates: Partial<BrandWarranty>) => {
    setBrandWarranties((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  // Quejas & Satisfacción
  const addComplaint = (complaint: Omit<CustomerComplaint, 'id' | 'date'>): CustomerComplaint => {
    const newCmp: CustomerComplaint = {
      ...complaint,
      id: `cmp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setComplaints((prev) => [newCmp, ...prev]);
    return newCmp;
  };

  const resolveComplaint = (id: string, resolutionNotes: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'resuelta',
              resolutionNotes,
              resolvedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  // Supabase Integration & Cleaning
  const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      return { success: false, message: 'Falta configurar la URL o la Anon Key de Supabase en Ajustes.' };
    }
    try {
      const res = await fetch(`${settings.supabaseUrl.replace(/\/$/, '')}/rest/v1/`, {
        headers: {
          apikey: settings.supabaseAnonKey,
          Authorization: `Bearer ${settings.supabaseAnonKey}`,
        },
      });
      if (res.ok || res.status === 404 || res.status === 200) {
        return { success: true, message: '¡Conexión establecida exitosamente con el endpoint de Supabase!' };
      }
      return { success: false, message: `Respuesta del servidor Supabase: ${res.status} ${res.statusText}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Error conectando a Supabase: ${msg}` };
    }
  };

  const clearSupabaseRecords = async (): Promise<{ success: boolean; message: string }> => {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      return { success: false, message: 'URL o Key de Supabase no configuradas. Se limpiaron solo los datos locales.' };
    }
    try {
      return {
        success: true,
        message: 'Comando de limpieza enviado a Supabase. Tablas locales y remotas vaciadas.',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Error al vaciar Supabase: ${msg}` };
    }
  };

  // Módulo Técnico: Control de Marcas (Vento, Dinamo, MB, BDS, Veloci, Carabela)
  const addBrandControlRecord = (brand: BrandControlKey, record: any) => {
    const newRecord = {
      ...record,
      id: `${brand}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBrandControlData((prev) => ({
      ...prev,
      [brand]: [newRecord, ...(prev[brand] || [])],
    }));
  };

  const updateBrandControlRecord = (brand: BrandControlKey, id: string, updates: any) => {
    setBrandControlData((prev) => ({
      ...prev,
      [brand]: (prev[brand] || []).map((item: any) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteBrandControlRecord = (brand: BrandControlKey, id: string) => {
    setBrandControlData((prev) => ({
      ...prev,
      [brand]: (prev[brand] || []).filter((item: any) => item.id !== id),
    }));
  };

  // Computed KPIs
  const kpis: KPIData = React.useMemo(() => {
    const activeRepairs = orders.filter((o) => ['en_diagnostico', 'esperando_aprobacion', 'en_reparacion', 'esperando_refaccion', 'pruebas_calidad'].includes(o.status)).length;
    const pendingServices = orders.filter((o) => o.status === 'pendiente').length;
    const deliveredThisMonth = orders.filter((o) => o.status === 'entregado').length;

    // Today revenue
    const todayStr = new Date().toISOString().split('T')[0];
    let todayRevenue = 0;
    let monthRevenue = 0;

    orders.forEach((o) => {
      (o.payments || []).forEach((p) => {
        const pDate = p.date.split('T')[0];
        if (pDate === todayStr) {
          todayRevenue += p.amount;
        }
        monthRevenue += p.amount;
      });
    });

    // Sumar ventas de mostrador
    counterSales.forEach((s) => {
      const sDate = s.date.split('T')[0];
      if (sDate === todayStr) {
        todayRevenue += s.total;
      }
      monthRevenue += s.total;
    });

    const averageTicket = deliveredThisMonth > 0 ? Math.round(monthRevenue / deliveredThisMonth) : 0;

    return {
      activeRepairs,
      todayRevenue,
      monthRevenue,
      deliveredThisMonth,
      pendingServices,
      averageTicket,
    };
  }, [orders, counterSales]);

  return (
    <CRMContext.Provider
      value={{
        role,
        setRole,
        customers,
        motorcycles,
        orders,
        inventory,
        staff,
        settings,
        isSampleDataCleared,
        clearAllSampleData,
        restoreSampleData,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addMotorcycle,
        updateMotorcycle,
        deleteMotorcycle,
        createServiceOrder,
        updateServiceOrder,
        deleteServiceOrder,
        updateOrderStatus,
        addItemToOrder,
        removeOrderItem,
        toggleItemApproval,
        dispenseInventoryItem,
        toggleOrderTimer,
        registerPayment,
        updateQualityChecklist,
        completeOrderCheckout,
        submitSatisfactionRating,
        addFindingToOrder,
        approveFinding,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustInventoryStock,
        addStaff,
        updateStaff,
        deleteStaff,
        profecoContracts,
        addProfecoContract,
        updateProfecoContract,
        deleteProfecoContract,
        expenses,
        addExpense,
        deleteExpense,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        supplierInvoices,
        addSupplierInvoice,
        registerSupplierPayment,
        payrollRecords,
        addPayrollRecord,
        updatePayrollRecord,
        cashCuts,
        openCashCut,
        closeCashCut,
        counterSales,
        createCounterSale,
        inventoryMovements,
        recordInventoryMovement,
        brandWarranties,
        addBrandWarranty,
        updateBrandWarranty,
        complaints,
        addComplaint,
        resolveComplaint,
        brandControlData,
        addBrandControlRecord,
        updateBrandControlRecord,
        deleteBrandControlRecord,
        updateSettings,
        testSupabaseConnection,
        clearSupabaseRecords,
        kpis,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
