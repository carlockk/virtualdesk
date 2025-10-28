import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageSliderSection from '@/components/PageSliderSection';
import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import { dbConnect } from '@/lib/mongodb';
import Page from '@/models/Page';
import { serializePage } from '@/lib/pages-admin';

export const dynamic = 'force-dynamic';

const sortSections = (sections = []) =>
  (Array.isArray(sections) ? sections : [])
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));

function CardsSection({ section, variant = 'default' }) {
  if (!section || !Array.isArray(section.items) || section.items.length === 0) return null;
  const isHero = variant === 'hero';
  const containerClasses = isHero
    ? 'rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100 backdrop-blur-sm'
    : 'rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm';
  const headingClasses = isHero ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900';
  const descriptionClasses = isHero ? 'text-sm text-slate-100/80' : 'text-sm text-slate-600';
  const gridClasses = 'mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3';
  const cardClasses = isHero
    ? 'flex h-full flex-col rounded-xl border border-white/20 bg-white/10 p-4 text-slate-100 transition hover:bg-white/20'
    : 'flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm transition hover:-translate-y-1 hover:shadow-lg';
  const titleClasses = isHero ? 'text-base font-semibold text-white' : 'text-base font-semibold text-slate-900';
  const bodyClasses = isHero ? 'text-sm text-slate-100/80' : 'text-sm text-slate-600';
  const linkClasses = isHero
    ? 'mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-100 hover:text-white'
    : 'mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700';

  return (
    <section className={containerClasses}>
      {(section.title || section.description) && (
        <header className="space-y-2">
          {section.title ? <h2 className={headingClasses}>{section.title}</h2> : null}
          {section.description ? <p className={descriptionClasses}>{section.description}</p> : null}
        </header>
      )}
      <div className={gridClasses}>
        {section.items.map((item) => (
          <article key={item.id} className={cardClasses}>
            {item.imageUrl ? (
              <div className="mb-4 overflow-hidden rounded-lg">
                <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col">
              <h3 className={titleClasses}>{item.title}</h3>
              {item.description ? <p className={`${bodyClasses} mt-2`}>{item.description}</p> : null}
              {item.linkUrl ? (
                <a href={item.linkUrl} className={linkClasses} target="_blank" rel="noreferrer">
                  {item.linkLabel || 'Ver mas'}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

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

  const sortedSections = sortSections(page.sections);
  const heroSections = sortedSections.filter((section) => section.position === 'belowTitle');
  const mainSections = sortedSections.filter((section) => section.position === 'main');
  const afterSections = sortedSections.filter((section) => section.position === 'afterContent');

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
          {heroSections.map((section) => (
            <div key={section.id} className="mt-10">
              {section.type === 'slider' ? (
                <PageSliderSection section={section} variant="hero" />
              ) : (
                <CardsSection section={section} variant="hero" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex-1 bg-slate-50 py-12">
        <div className="mx-auto w-full max-w-4xl space-y-6 px-4">
          {updatedLabel ? (
            <p className="text-xs text-slate-500">Actualizado el {updatedLabel}</p>
          ) : null}

          {mainSections.map((section) => (
            section.type === 'slider' ? (
              <PageSliderSection key={section.id} section={section} />
            ) : (
              <CardsSection key={section.id} section={section} />
            )
          ))}

          <article
            className="space-y-4 text-slate-700 [&>h2]:mt-6 [&>h2]:text-3xl [&>h2]:font-semibold [&>h2]:text-slate-900 [&>h3]:mt-4 [&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:text-slate-900 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:text-indigo-600 [&>a]:underline"
            dangerouslySetInnerHTML={{
              __html: page.content?.trim()
                ? page.content
                : '<p>Pronto agregaremos contenido para esta pagina.</p>',
            }}
          />

          {afterSections.map((section) => (
            section.type === 'slider' ? (
              <PageSliderSection key={section.id} section={section} />
            ) : (
              <CardsSection key={section.id} section={section} />
            )
          ))}
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-slate-500">Cargando pie de pagina...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
