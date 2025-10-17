'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';

export default function BootstrapAdminPage() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState({ loading: true, message: '', error: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setStatus((prev) => ({ ...prev, loading: true, error: '', message: '' }));
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setUser(data.user || null);
        setStatus((prev) => ({ ...prev, loading: false }));
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus({ loading: false, error: 'No se pudo obtener la sesión.', message: '' });
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePromote = async () => {
    setSubmitting(true);
    setStatus({ loading: false, error: '', message: '' });
    try {
      const res = await fetch('/api/admin/bootstrap', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setStatus({
          loading: false,
          error: data?.message || 'No se pudo asignar el rol.',
          message: '',
        });
      } else {
        setStatus({
          loading: false,
          error: '',
          message: data?.message || 'Rol de administrador otorgado.',
        });
        // Vuelve a cargar al usuario para reflejar el nuevo rol.
        const me = await fetch('/api/auth/me', { cache: 'no-store' })
          .then((resMe) => resMe.json())
          .catch(() => ({ user: null }));
        setUser(me.user || null);
      }
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message || 'Error inesperado.',
        message: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const emailMatch = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
  const alreadyAdmin = user?.role === 'admin';

  let content;
  if (status.loading) {
    content = <p className="text-gray-600">Cargando...</p>;
  } else if (!user) {
    content = (
      <div className="space-y-3">
        <p className="text-gray-700">Necesitas iniciar sesión para continuar.</p>
        <p className="text-xs text-gray-500">
          Usa el botón “Ingresar” en el sitio y vuelve a cargar esta página.
        </p>
      </div>
    );
  } else if (!emailMatch) {
    content = (
      <div className="space-y-3">
        <p className="text-gray-700">
          Tu correo (<span className="font-semibold">{user.email}</span>) no tiene acceso a este
          asistente.
        </p>
        <p className="text-xs text-gray-500">
          Inicia sesión con <code>{SUPER_ADMIN_EMAIL}</code> para crear el rol de super administrador.
        </p>
      </div>
    );
  } else if (alreadyAdmin) {
    content = (
      <div className="space-y-3">
        <p className="text-gray-700 font-medium">Ya tienes rol de administrador.</p>
        <p className="text-xs text-gray-500">Puedes entrar al centro desde /admin/messages.</p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-4">
        <p className="text-gray-700">
          Estás autenticado con <span className="font-semibold">{user.email}</span>.
        </p>
        <p className="text-gray-600 text-sm">
          Presiona el botón para convertir esta cuenta en administradora y acceder al centro de
          mensajes.
        </p>
        <button
          onClick={handlePromote}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? 'Creando rol...' : 'Crear super admin'}
        </button>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <section className="container flex-1 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Crear super administrador</h1>
          <p className="text-sm text-gray-600 mb-6">
            Usa esta pantalla solo la primera vez para asignarte el rol de administrador. Solo está
            disponible para la cuenta autorizada.
          </p>
          {status.error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {status.error}
            </div>
          )}
          {status.message && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              {status.message}
            </div>
          )}
          {content}
        </div>
      </section>
      <Footer />
    </main>
  );
}
