'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import { SERVICES } from '@/data/services';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

export default function ServicesPage() {
  const router = useRouter();
  const onSelect = (service) => router.push(`/checkout?serviceId=${service.id}`);

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container py-12 space-y-6">
        <div>
          <h2 className="text-4xl font-bold">Catálogo de Servicios</h2>
          <p className="text-gray-600 mt-2">Selecciona el servicio que te interese. Puedes ver un resumen pasando el mouse por el título (en móvil, tócalo para más info).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map(s => (
            <ServiceCard key={s.id} service={s} onSelect={onSelect} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/portfolio" className="btn-outline">Ver trabajos realizados</Link>
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Preparando chat...</div>}>
        <ChatWidget />
      </Suspense>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de página...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
