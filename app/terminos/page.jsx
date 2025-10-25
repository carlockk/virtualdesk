'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense } from 'react';

const TERMS = [
  {
    title: '1. Alcance del servicio',
    content:
      'VirtualDesk presta servicios de consultoria, desarrollo de software a medida, integraciones y mantenimiento. Cada proyecto se realiza de acuerdo con la propuesta comercial y alcance acordado con el cliente.',
  },
  {
    title: '2. Propiedad intelectual',
    content:
      'El codigo y entregables desarrollados para un proyecto se transfieren al cliente una vez cancelados los pagos correspondientes, salvo que en la propuesta se indique lo contrario. VirtualDesk puede reutilizar componentes genericos y librerias propias.',
  },
  {
    title: '3. Confidencialidad',
    content:
      'Ambas partes se comprometen a proteger la informacion sensible compartida durante el proyecto. No divulgaremos datos del cliente ni de sus usuarios sin autorizacion expresa.',
  },
  {
    title: '4. Pagos',
    content:
      'Los pagos se realizan segun los hitos acordados. En caso de retrasos en el pago, VirtualDesk puede pausar el trabajo hasta regularizar la situacion. No se liberan credenciales ni entregables finales sin el pago correspondiente.',
  },
  {
    title: '5. Garantias y soporte',
    content:
      'Cada proyecto incluye un periodo de garantia acordado en la propuesta para corregir errores derivados del desarrollo. Cambios fuera de alcance o nuevas funcionalidades se cotizan por separado.',
  },
  {
    title: '6. Uso del sitio web',
    content:
      'Los contenidos de este sitio (textos, imagenes, marcas) pertenecen a VirtualDesk. Puedes compartirlos citando la fuente, pero no se permite su reproduccion comercial sin permiso.',
  },
  {
    title: '7. Modificaciones',
    content:
      'VirtualDesk puede actualizar estos terminos en cualquier momento. La version vigente siempre estara disponible en este apartado y se aplicara a nuevas contrataciones.',
  },
];

export default function TerminosPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container flex-1 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <header className="space-y-4 text-center">
            <h1 className="text-4xl font-bold text-slate-900">Terminos y condiciones</h1>
            <p className="text-sm text-slate-600">
              Estas condiciones regulan la prestacion de servicios de software y el uso del sitio web de VirtualDesk.
            </p>
          </header>

          <div className="space-y-6">
            {TERMS.map((term) => (
              <article key={term.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{term.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{term.content}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Si tienes preguntas sobre estos terminos o necesitas un contrato personalizado, escríbenos a
            soporte@virtualdesk.cl.
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de pagina...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
