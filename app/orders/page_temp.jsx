'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect, useState, Suspense } from 'react';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
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

const hasContactData = (contact) =>
  Boolean(
    contact.phone ||
      contact.address ||
      contact.rut ||
      contact.businessName ||
      (contact.personType && contact.personType !== 'natural'),
  );

const computeTotal = (items = []) =>
  items.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
    0,
  );

const isOrderNew = (dateValue) => {
  if (!dateValue) return false;
  const created = new Date(dateValue).getTime();
  if (Number.isNaN(created)) return false;
  const diff = Date.now() - created;
  return diff <= 24 * 60 * 60 * 1000; // 24 horas
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [guest, setGuest] = useState([]);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d=>{
      if (d.user) setIsLogged(true);
    }).catch(()=>{});

    fetch('/api/orders?me=1').then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      if (Array.isArray(data.orders)) setOrders(data.orders);
    }).catch(()=>{});

    const g = JSON.parse(localStorage.getItem('guestOrders') || '[]');
    setGuest(g);
  }, []);

  const Card = ({title, children}) => (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      {children}
    </div>
  );

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
      contact.phone ? `<div><strong>Teléfono:</strong> ${contact.phone}</div>` : '',
      contact.rut ? `<div><strong>RUT:</strong> ${contact.rut}</div>` : '',
      contact.businessName ? `<div><strong>Razón social:</strong> ${contact.businessName}</div>` : '',
      contact.address ? `<div><strong>Dirección:</strong> ${contact.address}</div>` : '',
    ].join('');

    const html = `
      <html>
        <head>
          <title>Pedido ${order.id || ''}</title>
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
          <h1>Pedido ${order.id || ''}</h1>
          <div class="meta">
            <div><strong>Fecha:</strong> ${formatDateTime(order.createdAt)}</div>
            <div><strong>Cliente:</strong> ${order.clientName || ''} - ${order.clientEmail || ''}</div>
            ${contactRows}
          </div>
          <table>
            <thead>
              <tr>
                <th>Servicio</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
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

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Header />
      </Suspense>

      <section className="container py-12 space-y-8">
        <h2 className="text-3xl font-bold">Mis pedidos</h2>

        {isLogged && (
          <Card title="Pedidos de mi cuenta">
            {orders.length === 0 ? <p className="text-gray-600">No tienes pedidos aun.</p> : (
              <ul className="space-y-4">
                {orders.map(o => {
                  const contact = enrichContact(o.contact);
                  const total = computeTotal(o.items);
                  const newOrder = isOrderNew(o.createdAt);
                  return (
                    <li key={o._id} className="border rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold flex items-center gap-2">
                          #{o._id}
                          {newOrder && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              Nuevo
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-gray-500">{formatDateTime(o?.createdAt)}</span>
                      </div>
                      <div className="text-sm text-gray-700">{o.clientName} - {o.clientEmail}</div>
                      {hasContactData(contact) && (
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {contact.personType !== 'natural' && (
                            <div>Tipo: {contact.personType === 'empresa' ? 'Empresa' : contact.personType}</div>
                          )}
                          {contact.phone && <div>Telefono: {contact.phone}</div>}
                          {contact.rut && <div>RUT: {contact.rut}</div>}
                          {contact.businessName && <div>Razon social: {contact.businessName}</div>}
                          {contact.address && <div>Direccion: {contact.address}</div>}
                        </div>
                      )}
                      <ul className="mt-2 text-sm list-disc pl-5">
                        {o.items.map((it, idx) => {
                          const subtotal = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
                          return (
                            <li key={idx}>
                              {it.serviceName}
                              {subtotal > 0 ? ` - $${formatCurrencyCLP(subtotal)}` : ''}
                            </li>
                          );
                        })}
                      </ul>
                      {total > 0 && (
                        <div className="mt-2 font-semibold">
                          Total: ${formatCurrencyCLP(total)}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handlePrint({
                              id: o._id,
                              createdAt: o.createdAt,
                              clientName: o.clientName,
                              clientEmail: o.clientEmail,
                              contact: o.contact,
                              items: o.items,
                            })
                          }
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Imprimir
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

        {!isLogged && (
          <Card title="Pedidos guardados en este dispositivo (invitado)">
            {guest.length === 0 ? <p className="text-gray-600">No hay pedidos locales.</p> : (
              <ul className="space-y-4">
                {guest.map((g,i)=>{
                  const contact = enrichContact(g.contact);
                  const items = Array.isArray(g.order?.items) && g.order.items.length
                    ? g.order.items
                    : g.service
                    ? [{
                        serviceId: g.service.id,
                        serviceName: g.service.title || g.service.name,
                        quantity: 1,
                        unitPrice: Number(g.service.price) || 0,
                      }]
                    : [];
                  const total = computeTotal(items);
                  const newOrder = isOrderNew(g.when);
                  return (
                    <li key={i} className="border rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold flex items-center gap-2">
                          {g.service?.title || g.service?.name || items[0]?.serviceName || 'Servicio'}
                          {newOrder && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              Nuevo
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-gray-500">{formatDateTime(g?.when)}</span>
                      </div>
                      <div className="text-sm text-gray-700">{g.name} - {g.email}</div>
                      {hasContactData(contact) && (
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {contact.personType !== 'natural' && (
                            <div>Tipo: {contact.personType === 'empresa' ? 'Empresa' : contact.personType}</div>
                          )}
                          {contact.phone && <div>Telefono: {contact.phone}</div>}
                          {contact.rut && <div>RUT: {contact.rut}</div>}
                          {contact.businessName && <div>Razon social: {contact.businessName}</div>}
                          {contact.address && <div>Direccion: {contact.address}</div>}
                        </div>
                      )}
                      {g.service?.description && <div className="mt-2 text-sm">{g.service.description}</div>}
                      {items.length > 0 && (
                      <ul className="mt-2 text-sm list-disc pl-5">
                        {items.map((it, idx) => {
                          const subtotal = (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0);
                          return (
                            <li key={idx}>
                              {it.serviceName}
                              {subtotal > 0 ? ` - $${formatCurrencyCLP(subtotal)}` : ''}
                            </li>
                          );
                        })}
                      </ul>
                      )}
                      {total > 0 && (
                        <div className="mt-2 font-semibold">Total: ${formatCurrencyCLP(total)}</div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handlePrint({
                              id: items[0]?.serviceId || g.when,
                              createdAt: g.when,
                              clientName: g.name,
                              clientEmail: g.email,
                              contact: g.contact,
                              items,
                            })
                          }
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Imprimir
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}


