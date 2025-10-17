'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useEffect, useState, Suspense } from 'react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [guest, setGuest] = useState([]);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d=>{
      if (d.user) setIsLogged(true);
    }).catch(()=>{});

    fetch('/api/orders?me=1').then(r=>r.json()).then(d=>{
      if (Array.isArray(d.orders)) setOrders(d.orders);
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
            {orders.length === 0 ? <p className="text-gray-600">No tienes pedidos aún.</p> : (
              <ul className="space-y-4">
                {orders.map(o => (
                  <li key={o._id} className="border rounded-xl p-4">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">#{o._id}</span>
                      <span className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-700">{o.clientName} — {o.clientEmail}</div>
                    <ul className="mt-2 text-sm list-disc pl-5">
                      {o.items.map((it, idx) => (
                        <li key={idx}>{it.serviceName} — ${ (it.unitPrice*it.quantity).toLocaleString('es-CL') }</li>
                      ))}
                    </ul>
                    <div className="mt-2 font-semibold">
                      Total: ${ o.items.reduce((s, it)=>s+it.unitPrice*it.quantity,0).toLocaleString('es-CL') }
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Card title="Pedidos guardados en este dispositivo (invitado)">
          {guest.length === 0 ? <p className="text-gray-600">No hay pedidos locales.</p> : (
            <ul className="space-y-4">
              {guest.map((g,i)=>(
                <li key={i} className="border rounded-xl p-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{g.service?.name}</span>
                    <span className="text-sm text-gray-500">{new Date(g.when).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-700">{g.name} — {g.email}</div>
                  <div className="mt-2 text-sm">{g.service?.description}</div>
                  <div className="mt-2 font-semibold">Precio: ${ (g.service?.price || 0).toLocaleString('es-CL') }</div>
                </li>
              ))}
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
