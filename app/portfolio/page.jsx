'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense } from 'react';

const items = [
  { title: 'Ecommerce Moda', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop', url: 'https://www.google.com' },
  { title: 'SaaS de Gestión', img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop', url: 'https://www.google.com' },
  { title: 'App Móvil Delivery', img: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=800&auto=format&fit=crop', url: 'https://www.google.com' },
  { title: 'Dashboard BI', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop', url: 'https://www.google.com' },
];

export default function PortfolioPage() {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container py-12">
        <h2 className="text-4xl font-bold mb-6">Portafolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((w, idx)=>(
            <a key={idx} href={w.url} target="_blank" rel="noreferrer" className="block card overflow-hidden hover:shadow-md">
              <img src={w.img} alt={w.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="font-semibold">{w.title}</div>
                <div className="text-sm text-gray-600">Ver sitio</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de página...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
