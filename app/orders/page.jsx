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
                  return (
                    <li key={o._id} className="border rounded-xl p-4">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">#{o._id}</span>
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
                        {o.items.map((it, idx) => (
                          <li key={idx}>{it.serviceName} - ${formatCurrencyCLP(it.unitPrice * it.quantity)}</li>
                        ))}
                      </ul>
                      <div className="mt-2 font-semibold">
                        Total: ${formatCurrencyCLP(o.items.reduce((s, it)=>s + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

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
                      serviceName: g.service.name,
                      quantity: 1,
                      unitPrice: Number(g.service.price) || 0,
                    }]
                  : [];
                const total = items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0);
                return (
                  <li key={i} className="border rounded-xl p-4">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">{g.service?.name || items[0]?.serviceName || 'Servicio'}</span>
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
                        {items.map((it, idx) => (
                          <li key={idx}>{it.serviceName} - ${formatCurrencyCLP(it.unitPrice * it.quantity)}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 font-semibold">Total: ${formatCurrencyCLP(total)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}


