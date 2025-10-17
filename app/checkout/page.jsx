'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SERVICES } from '@/data/services';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const formatCurrencyCLP = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return number.toLocaleString('es-CL');
};

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const serviceId = params.get('serviceId');
  const service = useMemo(() => SERVICES.find(s => s.id === serviceId), [serviceId]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Prefill from last guest
    const last = JSON.parse(localStorage.getItem('guestInfo') || '{}');
    setForm({ name: last.name || '', email: last.email || '' });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.name,
          clientEmail: form.email,
          items: [{ serviceId: service.id, serviceName: service.name, quantity: 1, unitPrice: service.price }]
        })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.message || 'Error');
      // store as guest order too
      const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
      guestOrders.unshift({ when: new Date().toISOString(), ...data, service, name: form.name, email: form.email });
      localStorage.setItem('guestOrders', JSON.stringify(guestOrders));
      localStorage.setItem('guestInfo', JSON.stringify(form));
      router.push('/orders');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setStatus(null);
    }
  };

  if (!service) return (
    <main className="flex-1 flex flex-col">
      <Header />
      <section className="container py-12"><p>Servicio no encontrado.</p></section>
      <Footer />
    </main>
  );

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Header />
      </Suspense>
      <section className="container py-12">
        <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-8 shadow-sm">
          <h2 className="text-3xl font-bold mb-1">Confirmar interés</h2>
          <p className="text-gray-600 mb-6">Completa tus datos para registrar tu solicitud.</p>

          <div className="mb-6 p-4 border rounded-xl bg-indigo-50">
            <div className="font-semibold text-indigo-700">{service.name}</div>
            <div className="text-sm text-gray-700">{service.description}</div>
            <div className="mt-1 font-bold text-gray-900">${formatCurrencyCLP(service?.price)}</div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input className="w-full mt-1 p-3 border rounded-lg bg-white" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correo</label>
              <input type="email" className="w-full mt-1 p-3 border rounded-lg bg-white" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
            </div>
            <button className="w-full bg-indigo-600 text-white rounded-xl py-3 hover:bg-indigo-700" disabled={status==='loading'}>
              {status==='loading' ? 'Guardando...' : 'Confirmar interés'}
            </button>
            {status && status!=='loading' && <p className="text-red-600 text-sm">{status}</p>}
          </form>
        </div>
      </section>
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
