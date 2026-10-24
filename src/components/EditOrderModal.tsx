import React, { useState } from 'react';
import { ServiceOrder } from '../types/crm';
import { useCRM } from '../context/CRMContext';
import { X, Save, Trash2, Plus } from 'lucide-react';

interface EditOrderModalProps {
  order: ServiceOrder;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose }) => {
  const { updateServiceOrder } = useCRM();

  const [customerName, setCustomerName] = useState(order.customerName);
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
  const [customerEmail, setCustomerEmail] = useState(order.customerEmail || '');

  const [brand, setBrand] = useState(order.motorcycleInfo.brand);
  const [model, setModel] = useState(order.motorcycleInfo.model);
  const [year, setYear] = useState(order.motorcycleInfo.year);
  const [plate, setPlate] = useState(order.motorcycleInfo.plate);
  const [vin, setVin] = useState(order.motorcycleInfo.vin);
  const [mileage, setMileage] = useState(order.checkIn.mileage);
  const [fuelLevel, setFuelLevel] = useState(order.checkIn.fuelLevel);

  const [reasonForVisit, setReasonForVisit] = useState(order.reasonForVisit);
  const [status, setStatus] = useState(order.status);
  const [priority, setPriority] = useState(order.priority);
  const [items, setItems] = useState(order.items);

  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(350);

  const handleAddItem = () => {
    if (!newItemDesc.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `it-${Date.now()}`,
        description: newItemDesc.trim(),
        type: 'mano_de_obra',
        quantity: 1,
        unitPrice: Number(newItemPrice),
        totalPrice: Number(newItemPrice),
        approvedByClient: true,
      },
    ]);
    setNewItemDesc('');
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = items.reduce((acc, it) => acc + (it.approvedByClient ? it.totalPrice : 0), 0);
    const tax = Math.round(subtotal * 0.16);
    const total = subtotal + tax;

    updateServiceOrder(order.id, {
      customerName,
      customerPhone,
      customerEmail,
      motorcycleInfo: {
        ...order.motorcycleInfo,
        brand,
        model,
        year: Number(year),
        plate,
        vin,
      },
      checkIn: {
        ...order.checkIn,
        mileage: Number(mileage),
        fuelLevel: fuelLevel as any,
        observations: reasonForVisit,
      },
      reasonForVisit,
      status,
      priority,
      items,
      subtotal,
      tax,
      total,
    });

    alert('¡Registro actualizado exitosamente!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/85 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-300 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#010101] text-white border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm">Editar Registro de Orden / Check-in</span>
            <span className="px-2 py-0.5 rounded-full bg-[#DD040F] text-white font-mono text-xs font-bold">
              {order.orderNumber || order.id}
            </span>
          </div>
          <button onClick={onClose} className="text-[#AAA8A9] hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Client Details */}
          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-neutral-200 space-y-2">
            <span className="font-bold text-[#010101] uppercase text-[11px] block">Datos del Cliente</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-neutral-500 mb-0.5">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-bold text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-0.5">Teléfono</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-0.5">Correo</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-[#010101]"
                />
              </div>
            </div>
          </div>

          {/* Motorcycle Details */}
          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-neutral-200 space-y-2">
            <span className="font-bold text-[#010101] uppercase text-[11px] block">Datos de la Motocicleta</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-neutral-500 mb-0.5">Marca</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-bold text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-0.5">Modelo</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-bold text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-0.5">Año</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-0.5">Placa</label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-bold uppercase text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-0.5">Serie (VIN)</label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono text-[#010101]"
                />
              </div>
              <div>
                <label className="block text-neutral-500 mb-0.5">Kilometraje</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-neutral-300 rounded-lg font-mono font-bold text-[#010101]"
                />
              </div>
            </div>
          </div>

          {/* Status & Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-neutral-600 font-bold mb-1">Estado de la Orden</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg font-bold text-[#010101]"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_diagnostico">En Diagnóstico</option>
                <option value="esperando_aprobacion">Esperando Aprobación</option>
                <option value="en_reparacion">En Reparación</option>
                <option value="esperando_refaccion">Esperando Refacción</option>
                <option value="pruebas_calidad">Pruebas de Calidad</option>
                <option value="listo_entrega">Listo para Entrega</option>
                <option value="entregado">Finalizado y Entregado</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-[#010101]"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-600 font-bold mb-1">Tanque Gasolina ({fuelLevel}%)</label>
              <select
                value={fuelLevel}
                onChange={(e) => setFuelLevel(Number(e.target.value) as any)}
                className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-[#010101]"
              >
                <option value={0}>0% (Vacío)</option>
                <option value={25}>25% (1/4)</option>
                <option value={50}>50% (1/2)</option>
                <option value={75}>75% (3/4)</option>
                <option value={100}>100% (Lleno)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-neutral-600 font-bold mb-1">Motivo de Visita / Observaciones</label>
            <textarea
              rows={2}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              className="w-full p-2 bg-[#F8F9FA] border border-neutral-300 rounded-lg text-[#010101]"
            />
          </div>

          {/* Items / Conceptos */}
          <div className="bg-[#F8F9FA] p-3 rounded-xl border border-neutral-200 space-y-2">
            <span className="font-bold text-[#010101] uppercase text-[11px] block">Conceptos Registrados</span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200">
                  <span className="font-semibold text-[#010101]">{it.description}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">${it.totalPrice}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="text-neutral-400 hover:text-[#DD040F]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Agregar nuevo concepto..."
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="flex-1 p-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
              />
              <input
                type="number"
                min={0}
                placeholder="Precio"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(Number(e.target.value))}
                className="w-20 p-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-[#010101] text-white rounded-lg text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-[#DD040F] hover:bg-[#b5030c] text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
