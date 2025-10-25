'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, Loader2 } from 'lucide-react';

const PAGE_SIZE = 8;

function normalizeOrder(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function sortWorks(works) {
  return [...works].sort((a, b) => {
    const orderDiff = normalizeOrder(a.order) - normalizeOrder(b.order);
    if (orderDiff !== 0) return orderDiff;
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}

export default function WorksPage() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams?.get('page') || '1');
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/works', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'No se pudo cargar la lista de trabajos.');
        }
        if (active) {
          setWorks(Array.isArray(data.works) ? data.works : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Error al cargar los trabajos.');
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

  const sortedWorks = useMemo(() => sortWorks(works), [works]);
  const totalPages = Math.max(1, Math.ceil(sortedWorks.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = sortedWorks.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [safePage]);

  const changePage = (page) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    router.push(`${pathname}?${params.toString()}`.replace(/\?$/, ''), { scroll: false });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const buttons = [];
    for (let page = 1; page <= totalPages; page += 1) {
      buttons.push(
        <button
          key={page}
          type="button"
          onClick={() => changePage(page)}
          className={`min-w-[2.5rem] rounded-md border px-3 py-1 text-sm font-medium transition ${
            page === safePage
              ? 'border-indigo-500 bg-indigo-500 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
          }`}
        >
          {page}
        </button>,
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => changePage(Math.max(1, safePage - 1))}
          className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
          disabled={safePage === 1}
        >
          Anterior
        </button>
        {buttons}
        <button
          type="button"
          onClick={() => changePage(Math.min(totalPages, safePage + 1))}
          className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
          disabled={safePage === totalPages}
        >
          Siguiente
        </button>
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container flex-1 py-12">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Todos los trabajos</h1>
            <p className="text-sm text-slate-600">
              Explora los proyectos que hemos construido. Los mas recientes aparecen primero.
            </p>
          </header>

          {error && (
            <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Cargando trabajos...
            </div>
          ) : sortedWorks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center text-slate-500">
              Aun no hay trabajos publicados. Vuelve pronto.
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((work) => (
                  <article
                    key={work.id}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    {work.imageUrl ? (
                      <img
                        src={work.imageUrl}
                        alt={work.title}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-500">
                        Sin imagen
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{work.title}</h2>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-4">{work.description}</p>
                      </div>
                      {work.projectUrl && (
                        <a
                          href={work.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Ver proyecto
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <nav aria-label="Paginacion" className="mt-8">
                {renderPagination()}
              </nav>
            </>
          )}

          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
            >
              Volver al inicio
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
