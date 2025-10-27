import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import { dbConnect } from '@/lib/mongodb';
import Page from '@/models/Page';
import { serializePage } from '@/lib/pages-admin';

export const dynamic = 'force-dynamic';

const getPageBySlug = cache(async (slug) => {
  if (!slug) return null;
  await dbConnect();
  const doc = await Page.findOne({ slug, status: 'published' }).lean();
  if (!doc) return null;
  return serializePage(doc);
});

export async function generateMetadata({ params }) {
  const slug = params?.slug;
  const page = await getPageBySlug(slug);
  if (!page) {
    return {
      title: 'Pagina no encontrada | VirtualDesk',
      description: 'La pagina solicitada no existe o fue retirada.',
    };
  }

  return {
    title: `${page.title} | VirtualDesk`,
    description: page.summary || `Contenido actualizado de ${page.title}.`,
  };
}

export default async function DynamicPage({ params }) {
  const slug = params?.slug;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const updatedAt = page.updatedAt ? new Date(page.updatedAt) : null;
  const updatedLabel =
    updatedAt && Number.isFinite(updatedAt.getTime())
      ? updatedAt.toLocaleString('es-CL')
      : null;

  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="p-4 text-center text-slate-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="relative overflow-hidden bg-slate-950 text-slate-100">
        {page.heroImage ? (
          <>
            <img
              src={page.heroImage}
              alt={page.title}
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-slate-950/70" />
          </>
        ) : null}
        <div className="relative mx-auto w-full max-w-5xl px-4 py-16">
          <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
          {page.summary ? <p className="mt-4 max-w-3xl text-slate-300">{page.summary}</p> : null}
        </div>
      </section>

      <section className="flex-1 bg-slate-50 py-12">
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4">
          {updatedLabel ? (
            <p className="text-xs text-slate-500">Actualizado el {updatedLabel}</p>
          ) : null}
          <article
            className="space-y-4 text-slate-700 [&>h2]:mt-6 [&>h2]:text-3xl [&>h2]:font-semibold [&>h2]:text-slate-900 [&>h3]:mt-4 [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:text-slate-900 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:text-indigo-600 [&>a]:underline"
            dangerouslySetInnerHTML={{
              __html: page.content?.trim()
                ? page.content
                : '<p>Pronto agregaremos contenido para esta pagina.</p>',
            }}
          />
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-slate-500">Cargando pie de pagina...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
