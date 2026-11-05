import React, { useState, useMemo, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { InventoryItem } from '../../types/crm';
import {
  Package,
  Plus,
  Search,
  Upload,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  DollarSign,
  Boxes,
  Eye,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingDown,
  Info,
  RefreshCw,
  CheckSquare,
  Square,
  CornerDownRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AdminInventoryTab: React.FC = () => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    deleteInventoryItemsBulk,
    adjustInventoryStock,
    importInventoryBulk,
    clearInventory,
    settings,
  } = useCRM();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');
  const [sortBy, setSortBy] = useState<'partNumber' | 'name' | 'stockAsc' | 'stockDesc' | 'priceAsc' | 'priceDesc' | 'totalDesc'>('name');

  // Pagination state (default: 20 products per page as requested)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Selection & Bulk Actions state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [quickAdjustItem, setQuickAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);

  // Form state for adding/editing product
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    salePrice: 0,
    costPrice: 0,
    stock: 1,
    minStock: 5,
    category: 'General',
    department: 'Refacciones',
    location: 'Almacén Principal',
    brand: 'Universal',
    unit: 'PZA',
  });

  // Import file processing state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'upsert' | 'replace' | 'append'>('upsert');
  const [parsedPreview, setParsedPreview] = useState<Omit<InventoryItem, 'id'>[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; updated: number; total: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SQL Copy feedback
  const [copiedSql, setCopiedSql] = useState(false);

  // SQL Script for Supabase / PostgreSQL
  const sqlScript = `-- ====================================================================
-- ESQUEMA DE BASE DE DATOS PARA INVENTARIO Y CATÁLOGO DE REFACCIONES
-- SISTEMA QROMOTOS CRM - SUPABASE / POSTGRESQL
-- ====================================================================

-- 1. Crear tabla de Inventario
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) UNIQUE NOT NULL,                  -- Clave / SKU / Código
    descripcion TEXT NOT NULL,                           -- Descripción o nombre del repuesto
    precio_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,-- Precio U. de venta
    existencias NUMERIC(10, 2) NOT NULL DEFAULT 0.00,    -- Exis (Stock actual)
    valor_total NUMERIC(14, 2) GENERATED ALWAYS AS (precio_unitario * existencias) STORED, -- Total calculado
    departamento VARCHAR(100) DEFAULT 'Refacciones',      -- Departamento
    categoria VARCHAR(100) DEFAULT 'General',             -- Categoría
    precio_costo NUMERIC(12, 2) DEFAULT 0.00,             -- Precio de costo (opcional)
    stock_minimo NUMERIC(10, 2) DEFAULT 5.00,             -- Stock mínimo para alertas
    ubicacion VARCHAR(100) DEFAULT 'Almacén Principal',   -- Ubicación física en estante
    marca VARCHAR(100) DEFAULT 'Universal',               -- Marca de moto o pieza
    unidad VARCHAR(50) DEFAULT 'PZA',                     -- Unidad de medida (PZA, LITRO, etc.)
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices de alto rendimiento para búsquedas instantáneas
CREATE INDEX IF NOT EXISTS idx_inventory_clave ON inventory(clave);
CREATE INDEX IF NOT EXISTS idx_inventory_categoria ON inventory(categoria);
CREATE INDEX IF NOT EXISTS idx_inventory_existencias ON inventory(existencias);
CREATE INDEX IF NOT EXISTS idx_inventory_descripcion ON inventory USING gin(to_tsvector('spanish', descripcion));

-- 3. Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_inventory_timestamp ON inventory;
CREATE TRIGGER trg_update_inventory_timestamp
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_inventory_timestamp();

-- 4. Políticas de Seguridad (Row Level Security) para Supabase
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura general a usuarios autenticados y anon" 
ON inventory FOR SELECT USING (true);

CREATE POLICY "Permitir inserción y actualización a usuarios autenticados y anon" 
ON inventory FOR ALL USING (true) WITH CHECK (true);`;

  // Filtered categories from current inventory
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    inventory.forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats).sort();
  }, [inventory]);

  // KPIs
  const stats = useMemo(() => {
    let totalStock = 0;
    let totalValue = 0;
    let outOfStock = 0;
    let lowStock = 0;

    inventory.forEach((i) => {
      const stock = Number(i.stock) || 0;
      const price = Number(i.salePrice) || 0;
      const min = Number(i.minStock) || 5;

      totalStock += stock;
      totalValue += price * stock;
      if (stock <= 0) outOfStock++;
      else if (stock <= min) lowStock++;
    });

    return {
      totalItems: inventory.length,
      totalStock,
      totalValue,
      outOfStock,
      lowStock,
    };
  }, [inventory]);

  // Filtering & Sorting
  const filteredInventory = useMemo(() => {
    return inventory
      .filter((item) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchClave = (item.partNumber || '').toLowerCase().includes(q);
          const matchName = (item.name || '').toLowerCase().includes(q);
          const matchBrand = (item.brand || '').toLowerCase().includes(q);
          const matchLocation = (item.location || '').toLowerCase().includes(q);
          if (!matchClave && !matchName && !matchBrand && !matchLocation) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Stock filter
        const stock = Number(item.stock) || 0;
        const min = Number(item.minStock) || 5;
        if (stockFilter === 'in_stock' && stock <= 0) return false;
        if (stockFilter === 'out_of_stock' && stock > 0) return false;
        if (stockFilter === 'low_stock' && (stock <= 0 || stock > min)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'partNumber') return (a.partNumber || '').localeCompare(b.partNumber || '');
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'stockAsc') return (a.stock || 0) - (b.stock || 0);
        if (sortBy === 'stockDesc') return (b.stock || 0) - (a.stock || 0);
        if (sortBy === 'priceAsc') return (a.salePrice || 0) - (b.salePrice || 0);
        if (sortBy === 'priceDesc') return (b.salePrice || 0) - (a.salePrice || 0);
        if (sortBy === 'totalDesc') {
          const valA = (a.salePrice || 0) * (a.stock || 0);
          const valB = (b.salePrice || 0) * (b.stock || 0);
          return valB - valA;
        }
        return 0;
      });
  }, [inventory, searchTerm, selectedCategory, stockFilter, sortBy]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / itemsPerPage));

  // Current page items (in groups of 20 by default)
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(start, start + itemsPerPage);
  }, [filteredInventory, currentPage, itemsPerPage]);

  // Range indicators (e.g. 1 to 20 of 4,443)
  const rangeStart = filteredInventory.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, filteredInventory.length);

  // Jump to page handlers
  const handleJumpToPage = (targetPage: number) => {
    const valid = Math.max(1, Math.min(totalPages, targetPage));
    setCurrentPage(valid);
    setJumpPageInput('');
  };

  const handleJumpInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p)) {
      handleJumpToPage(p);
    }
  };

  // Reset to page 1 when filter/search changes
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  const handleStockFilterChange = (val: typeof stockFilter) => {
    setStockFilter(val);
    setCurrentPage(1);
  };

  // Selection handlers
  const isAllOnPageSelected = useMemo(() => {
    if (paginatedInventory.length === 0) return false;
    return paginatedInventory.every((item) => selectedIds.has(item.id));
  }, [paginatedInventory, selectedIds]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredInventory.length === 0) return false;
    return filteredInventory.length === selectedIds.size && filteredInventory.every((item) => selectedIds.has(item.id));
  }, [filteredInventory, selectedIds]);

  const handleToggleSelectAllOnPage = () => {
    const next = new Set(selectedIds);
    if (isAllOnPageSelected) {
      // Deselect all on current page
      paginatedInventory.forEach((item) => next.delete(item.id));
    } else {
      // Select all on current page
      paginatedInventory.forEach((item) => next.add(item.id));
    }
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set<string>();
    filteredInventory.forEach((item) => next.add(item.id));
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Execute Batch Deletion
  const handleConfirmBatchDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    deleteInventoryItemsBulk(idsToDelete);
    setSelectedIds(new Set());
    setShowBatchDeleteModal(false);

    // Adjust page if current page became empty
    const remainingAfter = filteredInventory.length - idsToDelete.length;
    const newTotalPages = Math.max(1, Math.ceil(remainingAfter / itemsPerPage));
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  };

  // Export selected items
  const handleExportSelected = () => {
    const itemsToExport = filteredInventory.filter((i) => selectedIds.has(i.id));
    if (itemsToExport.length === 0) return;

    const rows = itemsToExport.map((item) => ({
      Clave: item.partNumber,
      Descripción: item.name,
      Categoría: item.category || 'General',
      Departamento: item.department || 'Refacciones',
      'Precio Unitario ($)': item.salePrice,
      'Existencias (Stock)': item.stock,
      'Valor Total ($)': (item.salePrice || 0) * (item.stock || 0),
      Ubicación: item.location || 'Almacén Principal',
      Marca: item.brand || 'Universal',
      'Stock Mínimo': item.minStock || 5,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seleccionados');
    XLSX.writeFile(workbook, `Productos_Seleccionados_${itemsToExport.length}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper to parse currency numbers
  const parseCurrency = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const str = String(val)
      .replace(/[$ ]/g, '')
      .replace(/,/g, '')
      .trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  // Helper to parse stock count
  const parseStock = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const clean = String(val).replace(/,/g, '').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Handle file selection and parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setImportError(null);
    setImportResult(null);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) {
          throw new Error('No se pudo leer el archivo seleccionado.');
        }

        const workbook = XLSX.read(buffer, {
          type: 'array',
          raw: true,
          codepage: 65001,
        });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('El archivo está vacío.');
        }

        let headerRowIdx = -1;
        let colClave = -1;
        let colDesc = -1;
        let colPrice = -1;
        let colStock = -1;

        for (let r = 0; r < Math.min(10, rawRows.length); r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;

          row.forEach((cellVal: any, colIdx: number) => {
            const cell = String(cellVal || '').toLowerCase().trim();
            if (cell.includes('clave') || cell.includes('sku') || cell.includes('código') || cell.includes('codigo') || cell.includes('ref')) {
              colClave = colIdx;
              headerRowIdx = r;
            }
            if (cell.includes('descrip') || cell.includes('nombre') || cell.includes('concepto') || cell.includes('producto')) {
              colDesc = colIdx;
              headerRowIdx = r;
            }
            if (cell.includes('precio u') || cell.includes('precio') || cell.includes('p. unitario') || cell.includes('p.venta')) {
              colPrice = colIdx;
            }
            if (cell.includes('exis') || cell.includes('stock') || cell.includes('cant') || cell.includes('unidades')) {
              colStock = colIdx;
            }
          });

          if (colClave !== -1 && colDesc !== -1) {
            headerRowIdx = r;
            break;
          }
        }

        if (colClave === -1) colClave = 0;
        if (colDesc === -1) colDesc = 1;
        if (colPrice === -1) colPrice = rawRows[0].length >= 3 ? rawRows[0].length - 3 : 2;
        if (colStock === -1) colStock = rawRows[0].length >= 2 ? rawRows[0].length - 2 : 3;

        const startIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
        const parsedItems: Omit<InventoryItem, 'id'>[] = [];

        for (let i = startIdx; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!Array.isArray(row) || row.length === 0) continue;

          const clave = String(row[colClave] || '').trim();
          const desc = String(row[colDesc] || '').trim();

          if (!clave && !desc) continue;
          if (clave.toLowerCase() === 'clave' || desc.toLowerCase() === 'descripción') continue;
          if (clave.toLowerCase().includes('reporte de inventario')) continue;

          let price = parseCurrency(row[colPrice]);
          let stock = parseStock(row[colStock]);

          if (price === 0 && stock === 0) {
            for (let c = 2; c < row.length; c++) {
              const cell = String(row[c] || '').trim();
              if (cell.startsWith('$') || cell.includes('.')) {
                if (price === 0) price = parseCurrency(cell);
                else if (stock === 0) stock = parseStock(cell);
              }
            }
          }

          const descUpper = desc.toUpperCase();
          let autoCat = 'General';
          if (descUpper.includes('ACEITE') || descUpper.includes('LUBRICANTE') || descUpper.includes('LIQUIDO')) autoCat = 'Aceites y Fluidos';
          else if (descUpper.includes('BALATA') || descUpper.includes('FRENO') || descUpper.includes('DISCO') || descUpper.includes('CALIPER') || descUpper.includes('BOMBA')) autoCat = 'Frenos';
          else if (descUpper.includes('PISTON') || descUpper.includes('CILINDRO') || descUpper.includes('VALVULA') || descUpper.includes('BIELA') || descUpper.includes('CARBURADOR') || descUpper.includes('MOTOR')) autoCat = 'Motor';
          else if (descUpper.includes('TRANSMISION') || descUpper.includes('ENGRANE') || descUpper.includes('CLUTCH') || descUpper.includes('EMBRAGUE') || descUpper.includes('CADENA') || descUpper.includes('SPROCK')) autoCat = 'Transmisión';
          else if (descUpper.includes('BATERIA') || descUpper.includes('FOCO') || descUpper.includes('FARO') || descUpper.includes('ESTATOR') || descUpper.includes('CDI') || descUpper.includes('BOBINA') || descUpper.includes('SWITCH')) autoCat = 'Electricidad';
          else if (descUpper.includes('LLANTA') || descUpper.includes('CAMARA') || descUpper.includes('RIN')) autoCat = 'Neumáticos';
          else if (descUpper.includes('AMORTIGUADOR') || descUpper.includes('BARRA') || descUpper.includes('YUGO') || descUpper.includes('HORQUILLA')) autoCat = 'Suspensión y Chasis';
          else if (descUpper.includes('FILTRO')) autoCat = 'Filtros';

          let autoBrand = 'Universal';
          if (descUpper.includes('VENTO') || clave.startsWith('V-')) autoBrand = 'Vento';
          else if (descUpper.includes('ITALIKA')) autoBrand = 'Italika';
          else if (descUpper.includes('DINAMO') || clave.startsWith('D-')) autoBrand = 'Dinamo';
          else if (descUpper.includes('YAMAHA')) autoBrand = 'Yamaha';
          else if (descUpper.includes('HONDA')) autoBrand = 'Honda';
          else if (descUpper.includes('BAJAJ') || descUpper.includes('PULSAR')) autoBrand = 'Bajaj';
          else if (descUpper.includes('SUZUKI')) autoBrand = 'Suzuki';
          else if (descUpper.includes('VELOCI')) autoBrand = 'Veloci';
          else if (descUpper.includes('CARABELA')) autoBrand = 'Carabela';

          parsedItems.push({
            partNumber: clave || `SKU-${i + 1}`,
            name: desc || 'Sin descripción',
            salePrice: price,
            costPrice: 0,
            stock: stock,
            totalValue: price * stock,
            category: autoCat,
            department: 'Refacciones',
            brand: autoBrand,
            minStock: 5,
            location: 'Almacén Principal',
            unit: 'PZA',
            compatibleModels: [],
          });
        }

        if (parsedItems.length === 0) {
          throw new Error('No se encontraron filas de productos válidas en el archivo.');
        }

        setParsedPreview(parsedItems);
        setIsParsing(false);
      } catch (err: any) {
        console.error('Error al analizar archivo:', err);
        setImportError(err.message || 'Error al procesar el archivo. Verifica el formato.');
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setImportError('Error de lectura en el navegador.');
      setIsParsing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (parsedPreview.length === 0) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const res = await importInventoryBulk(parsedPreview, importMode);
      setImportResult(res);
      setIsImporting(false);
      setSelectedIds(new Set());
    } catch (err: any) {
      setImportError(err.message || 'Error al guardar los productos en la base de datos.');
      setIsImporting(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportToExcel = () => {
    if (inventory.length === 0) {
      alert('No hay productos en el inventario para exportar.');
      return;
    }

    const rows = filteredInventory.map((item) => ({
      Clave: item.partNumber,
      Descripción: item.name,
      Categoría: item.category || 'General',
      Departamento: item.department || 'Refacciones',
      'Precio Unitario ($)': item.salePrice,
      'Existencias (Stock)': item.stock,
      'Valor Total ($)': (item.salePrice || 0) * (item.stock || 0),
      Ubicación: item.location || 'Almacén Principal',
      Marca: item.brand || 'Universal',
      'Stock Mínimo': item.minStock || 5,
      Unidad: item.unit || 'PZA',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    const maxCols = [15, 45, 18, 16, 16, 16, 16, 18, 16, 14, 10];
    worksheet['!cols'] = maxCols.map((w) => ({ wch: w }));

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Inventario_QROMOTOS_${dateStr}.xlsx`);
  };

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setFormData({
      partNumber: '',
      name: '',
      salePrice: 0,
      costPrice: 0,
      stock: 1,
      minStock: 5,
      category: 'General',
      department: 'Refacciones',
      location: 'Almacén Principal',
      brand: 'Universal',
      unit: 'PZA',
    });
    setShowAddModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      partNumber: item.partNumber || '',
      name: item.name || '',
      salePrice: item.salePrice || 0,
      costPrice: item.costPrice || 0,
      stock: item.stock || 0,
      minStock: item.minStock || 5,
      category: item.category || 'General',
      department: item.department || 'Refacciones',
      location: item.location || 'Almacén Principal',
      brand: item.brand || 'Universal',
      unit: item.unit || 'PZA',
    });
  };

  // Submit Add Product Form
  const handleSaveAddProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.partNumber.trim()) {
      alert('La Clave / SKU es obligatoria.');
      return;
    }
    if (!formData.name.trim()) {
      alert('La descripción del producto es obligatoria.');
      return;
    }

    const exists = inventory.some(
      (i) => i.partNumber.trim().toUpperCase() === formData.partNumber.trim().toUpperCase()
    );
    if (exists) {
      if (!confirm(`La clave "${formData.partNumber}" ya existe en el inventario. ¿Deseas agregarla de todos modos?`)) {
        return;
      }
    }

    addInventoryItem({
      partNumber: formData.partNumber.trim(),
      name: formData.name.trim(),
      salePrice: Number(formData.salePrice) || 0,
      costPrice: Number(formData.costPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 5,
      category: formData.category,
      department: formData.department,
      location: formData.location,
      brand: formData.brand,
      unit: formData.unit,
      compatibleModels: [],
    });

    setShowAddModal(false);
  };

  // Submit Edit Product Form
  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateInventoryItem(editingItem.id, {
      partNumber: formData.partNumber.trim(),
      name: formData.name.trim(),
      salePrice: Number(formData.salePrice) || 0,
      costPrice: Number(formData.costPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 5,
      category: formData.category,
      department: formData.department,
      location: formData.location,
      brand: formData.brand,
      unit: formData.unit,
      totalValue: (Number(formData.salePrice) || 0) * (Number(formData.stock) || 0),
    });

    setEditingItem(null);
  };

  // Execute quick stock adjustment
  const handleApplyQuickStock = () => {
    if (!quickAdjustItem) return;
    adjustInventoryStock(quickAdjustItem.id, adjustDelta);
    setQuickAdjustItem(null);
  };

  // Delete product confirmation
  const handleDeleteProduct = (item: InventoryItem) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${item.partNumber} - ${item.name}"?`)) {
      deleteInventoryItem(item.id);
      if (selectedIds.has(item.id)) {
        const next = new Set(selectedIds);
        next.delete(item.id);
        setSelectedIds(next);
      }
    }
  };

  // Copy SQL script
  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-[#DD040F]/10 text-[#DD040F] rounded-xl">
              <Package className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#010101] tracking-tight">
                Control y Catálogo de Inventario (Rol Admin)
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Visualización en bloques de 20 productos, selección individual o total, borrado masivo y exportación.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Ver script SQL para crear la tabla en Supabase / PostgreSQL"
          >
            <Database className="w-4 h-4 text-neutral-600" />
            <span>Ver Script SQL</span>
          </button>

          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar en Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => {
              setShowImportModal(true);
              setImportFile(null);
              setParsedPreview([]);
              setImportResult(null);
              setImportError(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Archivo</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#DD040F] hover:bg-[#b0030c] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Dar de Alta Producto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total Artículos (SKUs)</span>
            <Boxes className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-[#010101] mt-1.5">
            {stats.totalItems.toLocaleString('es-MX')}
          </div>
          <span className="text-[11px] text-neutral-400">Códigos únicos registrados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Unidades en Existencia</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1.5">
            {stats.totalStock.toLocaleString('es-MX', { maximumFractionDigits: 1 })}
          </div>
          <span className="text-[11px] text-neutral-400">Piezas físicas en taller</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Valor del Inventario</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1.5">
            ${stats.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-neutral-400">Total calculado Precio × Stock</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Agotados / Negativos</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 mt-1.5">
            {stats.outOfStock}
          </div>
          <span className="text-[11px] text-red-500/80 font-medium">Stock ≤ 0 piezas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Por Reabastecer</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1.5">
            {stats.lowStock}
          </div>
          <span className="text-[11px] text-amber-600/80 font-medium">Bajo stock mínimo</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por Clave / SKU, Descripción, Marca o Ubicación..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#DD040F] focus:border-[#DD040F]"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-transparent border-none outline-none font-medium text-neutral-700 cursor-pointer text-xs"
              >
                <option value="all">Todas las Categorías ({inventory.length})</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock State Filter */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => handleStockFilterChange('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  stockFilter === 'all'
                    ? 'bg-white text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => handleStockFilterChange('in_stock')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  stockFilter === 'in_stock'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Con Stock
              </button>
              <button
                onClick={() => handleStockFilterChange('out_of_stock')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  stockFilter === 'out_of_stock'
                    ? 'bg-white text-red-700 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Agotados
              </button>
              <button
                onClick={() => handleStockFilterChange('low_stock')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  stockFilter === 'low_stock'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Bajo Mínimo
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none outline-none font-medium text-neutral-700 cursor-pointer text-xs"
              >
                <option value="name">Descripción (A-Z)</option>
                <option value="partNumber">Clave / SKU (A-Z)</option>
                <option value="stockDesc">Mayor Existencia</option>
                <option value="stockAsc">Menor Existencia</option>
                <option value="priceDesc">Mayor Precio Venta</option>
                <option value="priceAsc">Menor Precio Venta</option>
                <option value="totalDesc">Mayor Valor Total</option>
              </select>
            </div>
          </div>
        </div>

        {/* Counter & Per-page configuration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-500 pt-1 border-t border-neutral-100">
          <div>
            Mostrando productos del <span className="font-bold text-neutral-900">{rangeStart}</span> al{' '}
            <span className="font-bold text-neutral-900">{rangeEnd}</span> de un total de{' '}
            <span className="font-bold text-neutral-900">{filteredInventory.length.toLocaleString()}</span>
            {searchTerm && ` (filtrados por "${searchTerm}")`}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Productos por bloque:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-0.5 text-xs font-bold text-neutral-800 outline-none cursor-pointer"
              >
                <option value={20}>20 productos (Por defecto)</option>
                <option value={50}>50 productos</option>
                <option value={100}>100 productos</option>
                <option value={200}>200 productos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SELECTION BAR / ACCIONES MASIVAS                             */}
      {/* ============================================================ */}
      {selectedIds.size > 0 && (
        <div className="bg-neutral-900 text-white p-3.5 rounded-2xl shadow-lg border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#DD040F] text-white rounded-lg">
              <CheckSquare className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-white">
                {selectedIds.size.toLocaleString('es-MX')} {selectedIds.size === 1 ? 'producto seleccionado' : 'productos seleccionados'}
              </span>
              <span className="text-[11px] text-neutral-400 ml-2">
                (de {filteredInventory.length.toLocaleString('es-MX')} productos visibles)
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {!isAllFilteredSelected && (
              <button
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Seleccionar todos ({filteredInventory.length.toLocaleString()})
              </button>
            )}

            <button
              onClick={handleExportSelected}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar ({selectedIds.size})</span>
            </button>

            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-[#DD040F] hover:bg-[#b0030c] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar Seleccionados ({selectedIds.size})</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition"
              title="Deseleccionar todos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Inventory Horizontal Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-neutral-900 text-white text-[11px] font-bold tracking-wider uppercase">
                {/* Selection Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAllOnPage}
                    className="p-1 hover:bg-neutral-800 rounded transition cursor-pointer inline-flex items-center justify-center text-white"
                    title={isAllOnPageSelected ? 'Deseleccionar página actual' : 'Seleccionar los 20 de esta página'}
                  >
                    {isAllOnPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#DD040F]" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Clave / SKU</th>
                <th className="py-3 px-4">Descripción del Producto</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Precio U.</th>
                <th className="py-3 px-3 text-center">Exis (Stock)</th>
                <th className="py-3 px-3 text-right">Valor Total</th>
                <th className="py-3 px-3">Ubicación</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {paginatedInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <p className="font-semibold text-neutral-700 text-sm">No se encontraron productos</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {inventory.length === 0
                        ? 'El catálogo de inventario está vacío. Usa el botón "Importar Archivo" para subir tu base de datos o "+ Dar de Alta Producto".'
                        : 'Prueba cambiando los términos de búsqueda o filtros.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item) => {
                  const stockNum = Number(item.stock) || 0;
                  const priceNum = Number(item.salePrice) || 0;
                  const totalVal = priceNum * stockNum;
                  const isOutOfStock = stockNum <= 0;
                  const isLowStock = stockNum > 0 && stockNum <= (item.minStock || 5);
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-red-50/60 hover:bg-red-50/90' : 'hover:bg-neutral-50/80'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelectOne(item.id)}
                          className="p-1 rounded hover:bg-neutral-200/50 transition cursor-pointer text-neutral-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#DD040F]" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>
                      </td>

                      {/* Clave / SKU */}
                      <td className="py-2.5 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${isSelected ? 'bg-red-100 text-[#DD040F]' : 'bg-neutral-100'}`}>
                          {item.partNumber}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td className="py-2.5 px-4 font-semibold text-neutral-800 max-w-md">
                        <div className="line-clamp-2" title={item.name}>
                          {item.name}
                        </div>
                        {item.brand && item.brand !== 'Universal' && (
                          <span className="inline-block text-[10px] text-neutral-400 mt-0.5">
                            Marca: {item.brand}
                          </span>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-full text-[10px] font-medium">
                          {item.category || 'General'}
                        </span>
                      </td>

                      {/* Precio Unitario */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-900 whitespace-nowrap">
                        ${priceNum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Existencias (Stock) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-full text-xs font-black ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {stockNum.toLocaleString('es-MX', { maximumFractionDigits: 1 })}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                        ${totalVal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Ubicación */}
                      <td className="py-2.5 px-3 text-neutral-500 text-[11px] whitespace-nowrap">
                        {item.location || 'Almacén'}
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick stock adjustment button */}
                          <button
                            onClick={() => {
                              setQuickAdjustItem(item);
                              setAdjustDelta(1);
                            }}
                            title="Ajuste rápido de existencias"
                            className="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded-lg transition cursor-pointer"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          {/* View details */}
                          <button
                            onClick={() => setViewingItem(item)}
                            title="Ver detalle del producto"
                            className="p-1.5 hover:bg-neutral-100 text-blue-600 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit product */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Editar producto"
                            className="p-1.5 hover:bg-neutral-100 text-amber-600 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete product */}
                          <button
                            onClick={() => handleDeleteProduct(item)}
                            title="Eliminar este producto"
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================ */}
        {/* ENHANCED PAGINATION BAR WITH "SALTAR PÁGINA"                 */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
          {/* Status info */}
          <div className="flex items-center gap-2">
            <span>
              Página <strong className="text-neutral-900 font-black">{currentPage}</strong> de{' '}
              <strong className="text-neutral-900 font-black">{totalPages.toLocaleString()}</strong>
            </span>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-500">
              Viendo {rangeStart}–{rangeEnd} de {filteredInventory.length.toLocaleString()} productos
            </span>
          </div>

          {/* Page Jump Form */}
          <form onSubmit={handleJumpInputSubmit} className="flex items-center gap-1.5">
            <span className="text-neutral-600 font-medium">Saltar a página:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder={String(currentPage)}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              className="w-16 px-2 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold text-center outline-none focus:ring-1 focus:ring-[#DD040F]"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <span>Ir</span>
              <CornerDownRight className="w-3 h-3" />
            </button>
          </form>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            {/* Primera página */}
            <button
              disabled={currentPage === 1}
              onClick={() => handleJumpToPage(1)}
              className="p-1.5 bg-white border border-neutral-200 rounded-lg font-medium text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 transition shadow-2xs cursor-pointer"
              title="Ir a primera página (Pág. 1)"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* 20 Anteriores */}
            <button
              disabled={currentPage === 1}
              onClick={() => handleJumpToPage(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg font-bold text-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 transition shadow-2xs cursor-pointer"
              title="Ver los 20 anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>20 Anteriores</span>
            </button>

            {/* Quick page pills */}
            <div className="hidden sm:flex items-center gap-1 px-1">
              {currentPage > 2 && (
                <button
                  onClick={() => handleJumpToPage(1)}
                  className="w-7 h-7 rounded-lg bg-white border border-neutral-200 font-mono text-[11px] font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  1
                </button>
              )}
              {currentPage > 3 && <span className="text-neutral-400">...</span>}
              {currentPage > 1 && (
                <button
                  onClick={() => handleJumpToPage(currentPage - 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-neutral-200 font-mono text-[11px] font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  {currentPage - 1}
                </button>
              )}
              <span className="w-7 h-7 rounded-lg bg-[#DD040F] text-white font-mono text-[11px] font-black flex items-center justify-center shadow-xs">
                {currentPage}
              </span>
              {currentPage < totalPages && (
                <button
                  onClick={() => handleJumpToPage(currentPage + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-neutral-200 font-mono text-[11px] font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  {currentPage + 1}
                </button>
              )}
              {currentPage < totalPages - 2 && <span className="text-neutral-400">...</span>}
              {currentPage < totalPages - 1 && (
                <button
                  onClick={() => handleJumpToPage(totalPages)}
                  className="w-7 h-7 rounded-lg bg-white border border-neutral-200 font-mono text-[11px] font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  {totalPages}
                </button>
              )}
            </div>

            {/* 20 Siguientes */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handleJumpToPage(currentPage + 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg font-bold text-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 transition shadow-2xs cursor-pointer"
              title="Ver los siguientes 20 productos"
            >
              <span>20 Siguientes</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Última página */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handleJumpToPage(totalPages)}
              className="p-1.5 bg-white border border-neutral-200 rounded-lg font-medium text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 transition shadow-2xs cursor-pointer"
              title={`Ir a última página (Pág. ${totalPages})`}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: CONFIRMACIÓN DE BORRADO MASIVO                        */}
      {/* ============================================================ */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-black text-lg text-neutral-900">
                  ¿Borrar {selectedIds.size} {selectedIds.size === 1 ? 'producto' : 'productos'}?
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Esta acción eliminará de forma permanente los artículos seleccionados del catálogo y de la base de datos.
                </p>
              </div>
            </div>

            {/* Sample of items to delete */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 max-h-40 overflow-y-auto space-y-1 text-xs">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Artículos seleccionados para eliminar:
              </span>
              {filteredInventory
                .filter((item) => selectedIds.has(item.id))
                .slice(0, 5)
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-neutral-700">
                    <span className="font-mono font-bold text-red-700 text-[11px]">{item.partNumber}</span>
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              {selectedIds.size > 5 && (
                <p className="text-[11px] text-neutral-400 italic pt-1">
                  ... y {selectedIds.size - 5} productos adicionales.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#DD040F] hover:bg-[#b0030c] text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Borrar ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: IMPORT EXCEL / CSV WITH LIVE PREVIEW & SAVE        */}
      {/* ============================================================ */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-neutral-900">
                    Importar Base de Datos de Inventario
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Soporta archivos Excel (.xlsx, .xls) y CSV estructurados como tu reporte.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50/80 transition rounded-2xl p-6 text-center cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <p className="font-bold text-sm text-neutral-800">
                Haz clic para seleccionar tu archivo o arrástralo aquí
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Formatos soportados: <span className="font-semibold text-neutral-700">.csv, .xlsx, .xls</span> (Reporte de Inventario con columnas Clave, Descripción, Precio U., Exis, Total)
              </p>
              {importFile && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-semibold text-blue-700 shadow-2xs">
                  <span>📄 {importFile.name}</span>
                  <span className="text-[10px] text-neutral-400">({(importFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {isParsing && (
              <div className="flex items-center justify-center gap-2 p-4 text-xs font-bold text-blue-700">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analizando columnas y registros del archivo...</span>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Mode selection & Preview */}
            {parsedPreview.length > 0 && !importResult && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div>
                    <span className="text-xs font-bold text-neutral-800">
                      Total de productos válidos detectados:
                    </span>{' '}
                    <span className="text-sm font-black text-blue-600">
                      {parsedPreview.length.toLocaleString('es-MX')} registros
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-600 font-medium">Modo de guardado:</span>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as any)}
                      className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-800 outline-none"
                    >
                      <option value="upsert">Actualizar y Agregar (Upsert recomendado)</option>
                      <option value="replace">Reemplazar inventario completo</option>
                      <option value="append">Agregar todos sin verificar duplicados</option>
                    </select>
                  </div>
                </div>

                {/* Preview Table */}
                <div>
                  <div className="text-xs font-bold text-neutral-600 mb-1.5 flex items-center justify-between">
                    <span>Vista previa de los primeros 5 productos:</span>
                    <span className="text-[11px] text-neutral-400">Mapeo automático de columnas verificado</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-neutral-200">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-neutral-100 text-neutral-700 font-bold">
                        <tr>
                          <th className="py-2 px-3">Clave</th>
                          <th className="py-2 px-3">Descripción</th>
                          <th className="py-2 px-3 text-right">Precio U.</th>
                          <th className="py-2 px-3 text-center">Exis</th>
                          <th className="py-2 px-3 text-right">Total</th>
                          <th className="py-2 px-3">Categoría Asignada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {parsedPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50">
                            <td className="py-1.5 px-3 font-mono font-bold text-neutral-900">{row.partNumber}</td>
                            <td className="py-1.5 px-3 max-w-xs truncate">{row.name}</td>
                            <td className="py-1.5 px-3 text-right font-mono">${row.salePrice.toFixed(2)}</td>
                            <td className="py-1.5 px-3 text-center font-bold">{row.stock}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold">${(row.salePrice * row.stock).toFixed(2)}</td>
                            <td className="py-1.5 px-3 text-neutral-500">{row.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleExecuteImport}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Guardando {parsedPreview.length} registros en base de datos...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar e Importar ({parsedPreview.length} productos)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success Results Banner */}
            {importResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>¡Importación completada y guardada exitosamente!</span>
                </div>
                <div className="text-xs text-emerald-900 space-y-1">
                  <p>• Productos nuevos agregados: <span className="font-bold">{importResult.added}</span></p>
                  <p>• Productos actualizados (precios y existencias): <span className="font-bold">{importResult.updated}</span></p>
                  <p>• Total actual en base de datos: <span className="font-bold">{importResult.total} productos</span></p>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                  >
                    Cerrar y Ver Inventario
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: FORMULARIO "DAR DE ALTA UN PRODUCTO" / REGISTRO      */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#DD040F]/10 text-[#DD040F] rounded-xl">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-neutral-900">
                    Dar de Alta Producto en el Catálogo
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Registra un nuevo repuesto o insumo en la base de datos oficial.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Clave / SKU / Código *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. V-GANC-3526, R-ABRA-0001"
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Marca o Compatibilidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Vento, Italika, Bajaj, Universal"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Descripción del Producto *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ej. 2 GANCHOS PARA SOPORTE DE MOTOR WORKMAN 150, URBAN 3.0, RYDER 3.0"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#DD040F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Motor">Motor</option>
                    <option value="Transmisión">Transmisión</option>
                    <option value="Frenos">Frenos</option>
                    <option value="Aceites y Fluidos">Aceites y Fluidos</option>
                    <option value="Electricidad">Electricidad</option>
                    <option value="Suspensión y Chasis">Suspensión y Chasis</option>
                    <option value="Neumáticos">Neumáticos</option>
                    <option value="Filtros">Filtros</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Precio Venta (Unitario) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-neutral-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-6 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Existencias Iniciales *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold text-center outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Valor Total Calculado
                  </label>
                  <div className="py-1.5 px-3 bg-neutral-200/70 border border-neutral-300 rounded-lg text-xs font-mono font-black text-neutral-800 text-right">
                    ${((formData.salePrice || 0) * (formData.stock || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Precio Costo (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-neutral-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-6 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Stock Mínimo Alerta
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-center outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Ubicación Almacén
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Estante A-1"
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#DD040F] hover:bg-[#b0030c] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: EDITAR PRODUCTO                                    */}
      {/* ============================================================ */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-neutral-900">
                    Editar Producto ({editingItem.partNumber})
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Modifica precios, existencias o detalles del catálogo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Clave / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Marca / Compatibilidad
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Ubicación Almacén
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Precio Unitario ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Existencias (Stock) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold text-center outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Valor Total
                  </label>
                  <div className="py-1.5 px-3 bg-neutral-200/70 border border-neutral-300 rounded-lg text-xs font-mono font-black text-neutral-800 text-right">
                    ${((formData.salePrice || 0) * (formData.stock || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Actualizar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: AJUSTE RÁPIDO DE STOCK (+ / -)                      */}
      {/* ============================================================ */}
      {quickAdjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-neutral-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
              <h3 className="font-black text-sm text-neutral-900">
                Ajuste de Stock Rápido
              </h3>
              <button
                onClick={() => setQuickAdjustItem(null)}
                className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-neutral-600">
              <p className="font-mono font-bold text-neutral-900">{quickAdjustItem.partNumber}</p>
              <p className="line-clamp-2 mt-0.5">{quickAdjustItem.name}</p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Stock Actual:</span>
              <span className="text-base font-black text-neutral-900">{quickAdjustItem.stock}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Cantidad a sumar o restar:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjustDelta((d) => d - 1)}
                  className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-black text-lg transition cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                  className="flex-1 py-2 text-center bg-white border border-neutral-300 rounded-xl font-mono font-bold text-sm outline-none"
                />
                <button
                  onClick={() => setAdjustDelta((d) => d + 1)}
                  className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-black text-lg transition cursor-pointer"
                >
                  +
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5 text-center">
                Nuevo stock estimado: <span className="font-bold text-neutral-900">{Math.max(0, quickAdjustItem.stock + adjustDelta)}</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickAdjustItem(null)}
                className="px-3.5 py-1.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyQuickStock}
                className="px-4 py-1.5 bg-[#DD040F] hover:bg-[#b0030c] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: VER DETALLE DEL PRODUCTO                            */}
      {/* ============================================================ */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Package className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-neutral-900">
                    Ficha Técnica del Repuesto
                  </h3>
                  <span className="font-mono text-xs text-neutral-500">{viewingItem.partNumber}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-neutral-500 uppercase text-[10px]">Descripción:</span>
                <p className="text-neutral-900 font-semibold text-sm mt-0.5">{viewingItem.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <span className="text-neutral-500">Precio de Venta:</span>
                  <p className="font-mono font-bold text-neutral-900 text-sm">
                    ${(viewingItem.salePrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Existencias en Almacén:</span>
                  <p className="font-mono font-bold text-neutral-900 text-sm">
                    {viewingItem.stock} unidades
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Valor Total en Stock:</span>
                  <p className="font-mono font-black text-emerald-700 text-sm">
                    ${((viewingItem.salePrice || 0) * (viewingItem.stock || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Categoría:</span>
                  <p className="font-semibold text-neutral-800">{viewingItem.category || 'General'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Ubicación:</span>
                  <p className="font-semibold text-neutral-800">{viewingItem.location || 'Almacén Principal'}</p>
                </div>
                <div>
                  <span className="text-neutral-500">Marca / Compatibilidad:</span>
                  <p className="font-semibold text-neutral-800">{viewingItem.brand || 'Universal'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => {
                  const it = viewingItem;
                  setViewingItem(null);
                  handleOpenEditModal(it);
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Editar Información
              </button>
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: SCRIPT SQL PARA SUPABASE / POSTGRESQL               */}
      {/* ============================================================ */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-neutral-900 text-white rounded-xl">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-neutral-900">
                    Script SQL para Base de Datos
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Copia y ejecuta este script en el editor SQL de Supabase o PostgreSQL.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={handleCopySql}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer z-10"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>

              <pre className="bg-neutral-950 text-neutral-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[50vh] leading-relaxed border border-neutral-800">
                {sqlScript}
              </pre>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Instrucciones de configuración:</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  1. Abre tu panel de Supabase y ve a la sección <strong>SQL Editor</strong>.
                  <br />
                  2. Pega y presiona <strong>Run</strong>. Creará la tabla <code>inventory</code> con sus índices y permisos RLS.
                  <br />
                  3. En el sistema, ve a <strong>Ajustes & Supabase</strong> para conectar la URL y Anon Key y tener respaldo en la nube.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
