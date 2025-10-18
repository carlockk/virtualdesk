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

const EMPTY_FORM = {
  name: '',
  email: '',
  personType: 'natural',
  phone: '',
  address: '',
  rut: '',
  businessName: '',
};

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const serviceId = params.get('serviceId');
  const service = useMemo(() => SERVICES.find(s => s.id === serviceId), [serviceId]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const isLogged = Boolean(currentUser?.id || currentUser?._id);
  const profileExtras = {
    personType: form.personType,
    phone: form.phone,
    address: form.address,
    rut: form.rut,
    businessName: form.businessName,
  };
  const hasProfileExtras =
    isLogged &&
    ((profileExtras.personType && profileExtras.personType !== 'natural') ||
      profileExtras.phone ||
      profileExtras.address ||
      profileExtras.rut ||
      profileExtras.businessName);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setCurrentUser(data.user || null);
        setAuthChecked(true);
      })
      .catch(() => {
        if (!active) return;
        setCurrentUser(null);
        setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (currentUser) {
      setForm({
        ...EMPTY_FORM,
        name: currentUser.name || '',
        email: currentUser.email || '',
        personType: currentUser.personType || 'natural',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        rut: currentUser.rut || '',
        businessName: currentUser.businessName || '',
      });
      return;
    }
    if (typeof window !== 'undefined') {
      const last = JSON.parse(localStorage.getItem('guestInfo') || '{}');
      setForm({
        ...EMPTY_FORM,
        ...last,
        name: last.name || '',
        email: last.email || '',
        personType: last.personType || 'natural',
      });
    }
  }, [authChecked, currentUser]);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      if (!service) throw new Error('Servicio no encontrado');
      const contact = {
        personType:
          form.personType && (form.personType === 'empresa' || form.personType === 'natural')
            ? form.personType
            : 'natural',
      };
      if (form.phone) contact.phone = form.phone;
      if (form.address) contact.address = form.address;
      if (form.rut) contact.rut = form.rut;
      if (form.businessName) contact.businessName = form.businessName;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.name,
          clientEmail: form.email,
          items: [{
            serviceId: service.id,
            serviceName: service.name,
            quantity: 1,
            unitPrice: Number.isFinite(Number(service.price)) ? Number(service.price) : 0,
          }],
          contact,
        })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.message || 'Error');
      if (!isLogged && typeof window !== 'undefined') {
        const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
        guestOrders.unshift({
          when: new Date().toISOString(),
          order: data.order,
          service,
          name: form.name,
          email: form.email,
          contact,
        });
        localStorage.setItem('guestOrders', JSON.stringify(guestOrders));
        localStorage.setItem('guestInfo', JSON.stringify({
          name: form.name,
          email: form.email,
        }));
      }
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
          <h2 className="text-3xl font-bold mb-1">Confirmar interes</h2>
          <p className="text-gray-600 mb-6">Completa tus datos para registrar tu solicitud.</p>

          <div className="mb-6 p-4 border rounded-xl bg-indigo-50">
            <div className="font-semibold text-indigo-700">{service.name}</div>
            <div className="text-sm text-gray-700">{service.description}</div>
            {Number.isFinite(Number(service?.price)) && (
              <div className="mt-1 font-bold text-gray-900">
                ${formatCurrencyCLP(service?.price)}
              </div>
            )}
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
            {hasProfileExtras && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-gray-700">
                <div className="mb-2 font-semibold text-indigo-700">Datos adicionales de tu perfil</div>
                {profileExtras.personType && profileExtras.personType !== 'natural' && (
                  <div>Tipo: {profileExtras.personType === 'empresa' ? 'Empresa' : profileExtras.personType}</div>
                )}
                {profileExtras.phone && <div>Telefono: {profileExtras.phone}</div>}
                {profileExtras.rut && <div>RUT: {profileExtras.rut}</div>}
                {profileExtras.businessName && <div>Razon social: {profileExtras.businessName}</div>}
                {profileExtras.address && <div>Direccion: {profileExtras.address}</div>}
                <div className="mt-3 text-xs text-gray-500">
                  Actualiza esta informacion en <a href="/profile" className="text-indigo-600 underline">Mi perfil</a>.
                </div>
              </div>
            )}
            <button className="w-full bg-indigo-600 text-white rounded-xl py-3 hover:bg-indigo-700" disabled={status==='loading'}>
              {status==='loading' ? 'Guardando...' : 'Confirmar interes'}
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

