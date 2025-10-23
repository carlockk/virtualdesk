'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Printer, Trash2, X } from 'lucide-react';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const formatCurrencyCLP = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return number.toLocaleString('es-CL');
};

const enrichContact = (data) => ({
  personType: data?.personType || 'natural',
  phone: data?.phone || '',
  address: data?.address || '',
  rut: data?.rut || '',
  businessName: data?.businessName || '',
});

const computeTotal = (items = []) =>
  items.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
    0,
  );

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/orders?limit=200', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || 'No se pudieron cargar los pedidos.');
        }
        if (!active) return;
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Error al cargar pedidos.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handlePrint = (order) => {
    if (typeof window === 'undefined' || !order) return;
    const printableItems = Array.isArray(order.items) ? order.items : [];
    const total = computeTotal(printableItems);
    const contact = enrichContact(order.contact || {});

    const itemsRows = printableItems
      .map(
        (item) =>
          `<tr>
            <td>${item.serviceName || ''}</td>
            <td style="text-align:right;">${formatCurrencyCLP(
              (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
            )}</td>
          </tr>`,
      )
      .join('');

    const contactRows = [
      contact.personType && contact.personType !== 'natural'
        ? `<div><strong>Tipo:</strong> ${contact.personType === 'empresa' ? 'Empresa' : contact.personType}</div>`
        : '',
      contact.phone ? `<div><strong>Telefono:</strong> ${contact.phone}</div>` : '',
      contact.rut ? `<div><strong>RUT:</strong> ${contact.rut}</div>` : '',
      contact.businessName ? `<div><strong>Razon social:</strong> ${contact.businessName}</div>` : '',
      contact.address ? `<div><strong>Direccion:</strong> ${contact.address}</div>` : '',
    ].join('');

    const html = `
      <html>
        <head>
          <title>Pedido ${order._id || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 14px; }
            th { background-color: #f3f4f6; text-align: left; }
            .meta { margin-top: 12px; font-size: 14px; }
            .total { margin-top: 16px; font-weight: bold; font-size: 16px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>Pedido ${order._id || ''}</h1>
          <div class="meta">
            <div><strong>Fecha:</strong> ${formatDateTime(order.createdAt)}</div>
            <div><strong>Cliente:</strong> ${order.clientName || ''} - ${order.clientEmail || ''}</div>
            ${contactRows}
          </div>
          <table>
            <thead>
              <tr><th>Servicio</th><th style="text-align:right;">Subtotal</th></tr>
            </thead>
            <tbody>
              ${itemsRows || '<tr><td colspan="2">Sin items</td></tr>'}
            </tbody>
          </table>
          ${total > 0 ? `<div class="total">Total: $${formatCurrencyCLP(total)}</div>` : ''}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const ordersWithTotals = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        contact: enrichContact(order.contact),
        total: computeTotal(order.items),
      })),
    [orders],
  );

  const handleDelete = async (order) => {
    if (!order?._id) return;
    const confirmed = window.confirm(`Seguro que deseas eliminar el pedido ${order._id}?`);
    if (!confirmed) return;

    try {
      setDeletingId(order._id);
      setError('');
      const res = await fetch(`/api/orders/${order._id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo eliminar el pedido.');
      }
      setOrders((prev) => prev.filter((item) => item._id !== order._id));
      setSelected((prev) => (prev?._id === order._id ? null : prev));
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el pedido.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pedidos</h1>
          <p className="text-sm text-slate-600">Gestiona los pedidos realizados por los clientes.</p>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Cargando pedidos...
        </div>
      ) : ordersWithTotals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500">
          No hay pedidos registrados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Contacto</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordersWithTotals.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{order._id}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-medium">{order.clientName}</div>
                    <div className="text-xs text-slate-500">{order.clientEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.contact.phone ? <div>Tel: {order.contact.phone}</div> : <div>—</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {order.total > 0 ? `$${formatCurrencyCLP(order.total)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} /> Ver datos
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrint(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Printer size={14} /> Imprimir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        disabled={deletingId === order._id}
                      >
                        {deletingId === order._id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Eliminando...
                          </>
                        ) : (
                          <>
                            <Trash2 size={14} /> Eliminar
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pedido {selected._id}</h2>
                <p className="text-xs text-slate-500">{formatDateTime(selected.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div><strong>Cliente:</strong> {selected.clientName}</div>
              <div><strong>Email:</strong> {selected.clientEmail}</div>
              {selected.contact.personType !== 'natural' && (
                <div><strong>Tipo:</strong> {selected.contact.personType === 'empresa' ? 'Empresa' : selected.contact.personType}</div>
              )}
              {selected.contact.phone && <div><strong>Telefono:</strong> {selected.contact.phone}</div>}
              {selected.contact.rut && <div><strong>RUT:</strong> {selected.contact.rut}</div>}
              {selected.contact.businessName && <div><strong>Razon social:</strong> {selected.contact.businessName}</div>}
              {selected.contact.address && <div><strong>Direccion:</strong> {selected.contact.address}</div>}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-800">Servicios</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {selected.items?.map((item, idx) => {
                  const subtotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
                  return (
                    <li key={idx} className="flex justify-between">
                      <span>{item.serviceName}</span>
                      <span>{subtotal > 0 ? `$${formatCurrencyCLP(subtotal)}` : ''}</span>
                    </li>
                  );
                })}
              </ul>
              {selected.total > 0 && (
                <div className="mt-3 text-right text-sm font-semibold text-slate-800">
                  Total: ${formatCurrencyCLP(selected.total)}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handlePrint(selected)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Printer size={16} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

