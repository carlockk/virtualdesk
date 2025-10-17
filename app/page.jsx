'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Briefcase, Mail, Zap, ShieldCheck, Star } from 'lucide-react';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

const slides = [
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1920&auto=format&fit=crop',
];

export default function HomePage() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      {/* === SLIDER === */}
      <section className="relative w-full h-[80vh] overflow-hidden -mt-10 md:-mt-14">
        {slides.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`slide-${idx}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === i ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-4">
            Soluciones Integrales de Software
          </h2>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
            Transformamos ideas en productos digitales escalables y robustos.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-lg md:text-xl font-semibold
                         bg-white text-indigo-700 border border-white shadow-lg hover:bg-white/90 active:scale-[0.99]"
            >
              <Briefcase size={22} />
              Explorar servicios
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-lg md:text-xl font-semibold
                         bg-white text-indigo-700 border border-white shadow-lg hover:bg-white/90 active:scale-[0.99]"
            >
              <Mail size={22} />
              Contacto
            </Link>
          </div>
        </div>
      </section>

      {/* === SECCIÓN ESTADÍSTICAS Y POR QUÉ ELEGIR === */}
      <section className="bg-white py-20 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div>
              <div className="text-4xl font-extrabold text-indigo-600 mb-1">50+</div>
              <p className="text-gray-600">Proyectos Entregados</p>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-indigo-600 mb-1">15+</div>
              <p className="text-gray-600">Clientes Satisfechos</p>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-indigo-600 mb-1">3</div>
              <p className="text-gray-600">Años de Experiencia</p>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-indigo-600 mb-1">24/7</div>
              <p className="text-gray-600">Soporte Disponible</p>
            </div>
          </div>

          {/* Título y descripción */}
          <h3 className="text-4xl font-bold mb-4">¿Por Qué Elegir VirtualDesk?</h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
            Combinamos experiencia técnica con creatividad para ofrecer soluciones que superan expectativas.
          </p>

          {/* Tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white shadow-md rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl mb-4 mx-auto">
                <Zap size={28} />
              </div>
              <h4 className="text-xl font-semibold mb-2">Desarrollo Rápido</h4>
              <p className="text-gray-600">
                Utilizamos metodologías ágiles para entregar productos funcionales en tiempo récord sin
                comprometer la calidad.
              </p>
            </div>

            <div className="bg-white shadow-md rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 text-green-600 flex items-center justify-center rounded-xl mb-4 mx-auto">
                <ShieldCheck size={28} />
              </div>
              <h4 className="text-xl font-semibold mb-2">Calidad Garantizada</h4>
              <p className="text-gray-600">
                Implementamos rigurosos procesos de testing y control de calidad para garantizar productos
                estables y seguros.
              </p>
            </div>

            <div className="bg-white shadow-md rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 flex items-center justify-center rounded-xl mb-4 mx-auto">
                <Star size={28} />
              </div>
              <h4 className="text-xl font-semibold mb-2">Soporte Continuo</h4>
              <p className="text-gray-600">
                Ofrecemos soporte técnico continuo y mantenimiento preventivo para asegurar el óptimo
                funcionamiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === TRABAJOS REALIZADOS === */}
      <section className="container py-12">
        <h3 className="text-3xl font-bold mb-6">Trabajos realizados</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Proyecto A', img: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop' },
            { title: 'Proyecto B', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop' },
            { title: 'Proyecto C', img: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=800&auto=format&fit=crop' },
          ].map((w, idx) => (
            <a
              key={idx}
              href="https://www.google.com"
              target="_blank"
              rel="noreferrer"
              className="block card overflow-hidden hover:shadow-md"
            >
              <img src={w.img} alt={w.title} className="w-full h-44 object-cover" />
              <div className="p-4">
                <div className="font-semibold">{w.title}</div>
                <div className="text-sm text-gray-600">Ver sitio</div>
              </div>
            </a>
          ))}
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
