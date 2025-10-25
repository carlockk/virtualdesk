'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Suspense } from 'react';

const WARRANTY_ITEMS = [
  {
    title: 'Correcciones incluidas',
    content:
      'Todo desarrollo nuevo incluye un periodo de garantia para corregir errores derivados del codigo entregado. Durante este periodo ajustamos incidentes sin costo adicional.',
  },
  {
    title: 'Soporte evolutivo',
    content:
      'Si necesitas nuevas funcionalidades, mejoras o integraciones adicionales, ofrecemos planes de soporte evolutivo y bolsas de horas a medida.',
  },
  {
    title: 'Monitoreo y mantenimientos',
    content:
      'Podemos monitorear tus aplicativos, aplicar parches de seguridad y mantener infraestructura cloud para asegurar la continuidad del negocio.',
  },
];

export default function SoportePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container flex-1 py-12">
        <div className="mx-auto max-w-4xl space-y-10">
          <header className="space-y-4 text-center">
            <h1 className="text-4xl font-bold text-slate-900">Garantias y soporte</h1>
            <p className="text-sm text-slate-600">
              Cuidamos tus aplicaciones despues del lanzamiento con planes flexibles de garantia, soporte y mantenimiento.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            {WARRANTY_ITEMS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-3 text-sm text-slate-600">{item.content}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 text-sm text-indigo-800">
            <h3 className="text-base font-semibold">Equipo de soporte VirtualDesk</h3>
            <p className="mt-2 leading-relaxed">
              Trabajamos con herramientas de monitoreo, tableros Kanban y canales dedicados para que puedas reportar
              incidentes o nuevas ideas. Nuestro objetivo es mantener tus soluciones estables y evolucionar junto a tu
              negocio.
            </p>
            <p className="mt-4">
              Escríbenos a{' '}
              <a href="mailto:soporte@virtualdesk.cl" className="font-medium underline">
                soporte@virtualdesk.cl
              </a>{' '}
              o agenda una llamada para revisar el plan que mejor se adapte a tu empresa.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
            >
              Contactar soporte
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
            >
              Ver servicios
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de pagina...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
