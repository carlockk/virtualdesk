'use client';

import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container py-12 space-y-6">
        <div>
          <h2 className="text-4xl font-bold">Catalogo de servicios</h2>
          <p className="text-gray-600 mt-2">
            Selecciona el servicio que te interese. Puedes ver un resumen pasando el mouse por el titulo (en movil, tocalo para mas informacion).
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-500">
            Cargando servicios...
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-500">
            No hay servicios publicados por ahora.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} onSelect={onSelect} />
            ))}
          </div>
        )}

        <div className="text-center">
          <Link href="/portfolio" className="btn-outline">
            Ver trabajos realizados
          </Link>
        </div>
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
