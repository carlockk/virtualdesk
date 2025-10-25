'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense } from 'react';

const SECTIONS = [
  {
    title: '1. Introduccion',
    content:
      'En VirtualDesk ofrecemos servicios de desarrollo de software, integraciones y soporte tecnico para empresas y profesionales. Esta politica explica como recopilamos, utilizamos y protegemos la informacion relacionada con nuestros clientes, prospectos y visitantes del sitio.',
  },
  {
    title: '2. Informacion que recopilamos',
    content:
      'Podemos recopilar datos de contacto (nombre, correo, telefono), informacion de negocio (razon social, rubro) y datos tecnicos relacionados con los proyectos solicitados. Toda la informacion se obtiene de forma directa cuando completas formularios, agendas reuniones o solicitas soporte.',
  },
  {
    title: '3. Uso de la informacion',
    content:
      'Utilizamos los datos para responder consultas, preparar propuestas, ejecutar proyectos de software, mejorar nuestros servicios y ofrecer soporte. No vendemos ni compartimos tus datos con terceros, salvo proveedores estrictamente necesarios (hosting, correo transaccional) que tambien cumplen con estandares de seguridad.',
  },
  {
    title: '4. Almacenamiento y seguridad',
    content:
      'Los datos se almacenan en plataformas en la nube con medidas de seguridad de nivel empresarial (cifrado, control de acceso, monitoreo). Limitamos el acceso solo al equipo de VirtualDesk que necesita esa informacion para entregar los servicios.',
  },
  {
    title: '5. Derechos de los usuarios',
    content:
      'Puedes solicitar acceso, actualizacion o eliminacion de tus datos escribiendo a soporte@virtualdesk.cl. Atenderemos tu solicitud en un plazo razonable y te informaremos sobre el proceso.',
  },
  {
    title: '6. Actualizaciones',
    content:
      'Esta politica puede actualizarse con mejoras o cambios regulatorios. Publicaremos la nueva version en este mismo apartado indicando la fecha de modificacion.',
  },
];

export default function PoliticasPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container flex-1 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <header className="space-y-4 text-center">
            <h1 className="text-4xl font-bold text-slate-900">Politica de privacidad</h1>
            <p className="text-sm text-slate-600">
              Protegemos la informacion de nuestros clientes y tratamos los datos con enfoque profesional y responsable.
            </p>
          </header>

          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.content}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm text-indigo-700">
            Si tienes dudas sobre esta politica, escríbenos a soporte@virtualdesk.cl y estaremos felices de ayudarte.
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de pagina...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
