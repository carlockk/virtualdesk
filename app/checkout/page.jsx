'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

  const [service, setService] = useState(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;
    if (!serviceId) {
      setService(null);
      setServiceLoading(false);
      setServiceError('Servicio no encontrado.');
      return () => {
        active = false;
      };
    }

    const loadService = async () => {
      try {
        setServiceLoading(true);
        setServiceError('');
        const res = await fetch('/api/services', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'No se pudo cargar el catalogo.');
        }
        if (!active) return;
        const list = Array.isArray(data.services) ? data.services : [];
        const match = list.find((item) => String(item.id) === String(serviceId));
        if (match) {
          setService(match);
        } else {
          setService(null);
          setServiceError('Servicio no encontrado.');
        }
      } catch (err) {
        if (!active) return;
        setService(null);
        setServiceError(err.message || 'Error al cargar el servicio.');
      } finally {
        if (active) setServiceLoading(false);
      }
    };

    loadService();
    return () => {
      active = false;
    };
  }, [serviceId]);

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

  const submit = async (event) => {
    event.preventDefault();
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
          items: [
            {
              serviceId: service.id,
              serviceName: service.title || service.name,
              quantity: 1,
              unitPrice: Number.isFinite(Number(service?.price)) ? Number(service.price) : 0,
            },
          ],
          contact,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Error al registrar la solicitud.');

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
        localStorage.setItem(
          'guestInfo',
          JSON.stringify({
            name: form.name,
            email: form.email,
          }),
        );
      }
      router.push('/orders');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setStatus(null);
    }
  };

  const serviceInfo = useMemo(() => {
    if (!service) return null;
    return {
      title: service.title || service.name,
      description: service.summary || service.description,
      price: service.price,
    };
  }, [service]);

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Header />
      </Suspense>
      <section className="container py-12">
        {serviceLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-500">
            Cargando informacion del servicio...
          </div>
        ) : !serviceInfo ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-12 text-center text-red-700">
            {serviceError || 'Servicio no disponible.'}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold mb-1">Confirmar interes</h2>
            <p className="text-gray-600 mb-6">Completa tus datos para registrar tu solicitud.</p>

            <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="font-semibold text-indigo-700">{serviceInfo.title}</div>
              <div className="text-sm text-gray-700">{serviceInfo.description}</div>
              {Number.isFinite(Number(serviceInfo.price)) && Number(serviceInfo.price) > 0 && (
                <div className="mt-1 font-bold text-gray-900">
                  ${formatCurrencyCLP(serviceInfo.price)}
                </div>
              )}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  className="w-full mt-1 rounded-lg border border-gray-200 bg-white p-3"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Correo</label>
                <input
                  type="email"
                  className="w-full mt-1 rounded-lg border border-gray-200 bg-white p-3"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </div>

              {hasProfileExtras && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-gray-700">
                  <div className="mb-2 font-semibold text-indigo-700">
                    Datos adicionales de tu perfil
                  </div>
                  {profileExtras.personType && profileExtras.personType !== 'natural' && (
                    <div>Tipo: {profileExtras.personType === 'empresa' ? 'Empresa' : profileExtras.personType}</div>
                  )}
                  {profileExtras.phone && <div>Telefono: {profileExtras.phone}</div>}
                  {profileExtras.rut && <div>RUT: {profileExtras.rut}</div>}
                  {profileExtras.businessName && <div>Razon social: {profileExtras.businessName}</div>}
                  {profileExtras.address && <div>Direccion: {profileExtras.address}</div>}
                  <div className="mt-3 text-xs text-gray-500">
                    Actualiza esta informacion en{' '}
                    <a href="/profile" className="text-indigo-600 underline">
                      Mi perfil
                    </a>
                    .
                  </div>
                </div>
              )}

              <button
                className="w-full rounded-xl bg-indigo-600 py-3 text-white hover:bg-indigo-700"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Guardando...' : 'Confirmar interes'}
              </button>
              {status && status !== 'loading' && (
                <p className="text-sm text-red-600">{status}</p>
              )}
            </form>
          </div>
        )}
      </section>
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
