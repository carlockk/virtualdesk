'use client';

import { useEffect, useState, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuthPanel } from '@/components/AuthPanelProvider';

const INITIAL_FORM = {
  name: '',
  email: '',
  personType: 'natural',
  phone: '',
  address: '',
  rut: '',
  businessName: '',
};

export default function ProfilePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ loading: true, saving: false, message: '', error: '' });
  const { show } = useAuthPanel();

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.user) {
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
            personType: data.user.personType || 'natural',
            phone: data.user.phone || '',
            address: data.user.address || '',
            rut: data.user.rut || '',
            businessName: data.user.businessName || '',
          });
          setStatus({ loading: false, saving: false, message: '', error: '' });
        } else {
          setStatus({
            loading: false,
            saving: false,
            message: '',
            error: 'Necesitas iniciar sesión para ver tu perfil.',
          });
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus({
          loading: false,
          saving: false,
          message: '',
          error: 'No se pudo cargar tu perfil. Intenta nuevamente.',
        });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status.saving) return;
    setStatus((prev) => ({ ...prev, saving: true, message: '', error: '' }));

    try {
      const payload = {
        name: form.name,
        personType: form.personType,
        phone: form.phone,
        address: form.address,
        rut: form.rut,
        businessName: form.businessName,
      };

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setStatus({
          loading: false,
          saving: false,
          message: '',
          error: data?.message || 'No se pudo guardar la información.',
        });
        return;
      }

      const user = data.user;
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        personType: user.personType || prev.personType,
        phone: user.phone || '',
        address: user.address || '',
        rut: user.rut || '',
        businessName: user.businessName || '',
      }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('virtualdesk:user-updated', { detail: { user } }));
      }
      setStatus({
        loading: false,
        saving: false,
        message: 'Perfil actualizado correctamente.',
        error: '',
      });
    } catch (err) {
      setStatus({
        loading: false,
        saving: false,
        message: '',
        error: err.message || 'Error inesperado al guardar.',
      });
    }
  };

  const renderContent = () => {
    if (status.loading) {
      return <p className="text-gray-600">Cargando perfil...</p>;
    }

    if (status.error && !form.email) {
      return (
        <div className="space-y-4">
          <p className="text-gray-700">{status.error}</p>
          <button
            onClick={() => show('login')}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            Iniciar sesión
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.name}
            onChange={handleChange('name')}
            required
            minLength={2}
            maxLength={80}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            value={form.email}
            disabled
          />
          <p className="mt-1 text-xs text-gray-500">Este correo está asociado a tu cuenta y no puede modificarse.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de persona</label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.personType}
            onChange={handleChange('personType')}
          >
            <option value="natural">Persona natural</option>
            <option value="empresa">Empresa</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="+56 9 1234 5678"
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">RUT</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={form.rut}
              onChange={handleChange('rut')}
              placeholder="11.111.111-1"
              maxLength={30}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Razón social (si aplica)</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.businessName}
            onChange={handleChange('businessName')}
            placeholder="VirtualDesk SpA"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.address}
            onChange={handleChange('address')}
            rows={3}
            placeholder="Calle, número, comuna, ciudad"
            maxLength={200}
          />
          <p className="mt-1 text-xs text-gray-500">Estos datos son opcionales, pero nos ayudan a preparar propuestas a medida.</p>
        </div>

        {status.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{status.error}</div>
        )}
        {status.message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{status.message}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status.saving}
          >
            {status.saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container flex-1 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-gray-900">Mi perfil</h1>
          <p className="mt-2 text-sm text-gray-500">
            Completa tu información para que podamos contactarte y preparar propuestas personalizadas. Ningún campo es obligatorio.
          </p>

          <div className="mt-8">{renderContent()}</div>
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de página...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
