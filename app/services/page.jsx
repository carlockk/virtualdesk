'use client';

import { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('cards');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/services', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'No se pudo cargar el catalogo de servicios.');
        }
        if (active) {
          setServices(Array.isArray(data.services) ? data.services : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Error inesperado al cargar los servicios.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const onSelect = (service) => {
    if (!service?.id) return;
    router.push(`/checkout?serviceId=${service.id}`);
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-500">
          Cargando servicios...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      );
    }

    if (services.length === 0) {
      return (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-500">
          No hay servicios publicados por ahora.
        </div>
      );
    }

    if (view === 'table') {
      return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Imagen</th>
                <th className="px-4 py-3 text-left font-medium">Servicio</th>
                <th className="px-4 py-3 text-left font-medium">Descripcion</th>
                <th className="px-4 py-3 text-left font-medium">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="px-4 py-3">
                    <div className="h-12 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                          Sin imagen
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    <span title={service.description || service.summary || service.title}>
                      {service.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{service.summary || service.description}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onSelect(service)}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Me interesa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} onSelect={onSelect} />
        ))}
      </div>
    );
  }, [loading, error, services, view]);

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container py-12 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-bold">Catalogo de servicios</h2>
            <p className="text-gray-600 mt-2">
              Selecciona el servicio que te interese. Puedes ver un resumen pasando el mouse por el titulo (en movil, tocalo para mas informacion).
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setView('cards')}
              className={clsx(
                'min-w-[100px] rounded-lg px-4 py-2 text-sm font-medium transition',
                view === 'cards' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              Vista cards
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={clsx(
                'min-w-[100px] rounded-lg px-4 py-2 text-sm font-medium transition',
                view === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              Vista tabla
            </button>
          </div>
        </div>

        {content}
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Preparando chat...</div>}>
        <ChatWidget />
      </Suspense>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de pagina...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
