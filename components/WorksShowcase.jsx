'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

const FEATURED_COUNT = 4;

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

export default function WorksShowcase() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/works', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'No se pudo cargar el portafolio.');
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
  const featuredWorks = useMemo(() => sortedWorks.slice(0, FEATURED_COUNT), [sortedWorks]);

  return (
    <section className="bg-slate-50 py-12">
      <div className="space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Portafolio
          </span>
          <h3 className="text-3xl font-bold text-slate-900">Trabajos realizados</h3>
          <p className="text-sm text-slate-600">
            Algunos de los proyectos que hemos desarrollado para nuestros clientes.
          </p>
        </div>

        {error && (
          <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Cargando portafolio...
          </div>
        ) : featuredWorks.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500">
            Aun no hay trabajos registrados. Vuelve pronto.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredWorks.map((work) => (
              <article
                key={work.id}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {work.imageUrl ? (
                  <img
                    src={work.imageUrl}
                    alt={work.title}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-500">
                    Sin imagen
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <span className="sr-only">
                      Orden {Number.isFinite(Number(work.order)) ? work.order : 0}
                    </span>
                    <h4 className="text-lg font-semibold text-slate-900">{work.title}</h4>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{work.description}</p>
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
        )}

        <div className="flex justify-center">
          <Link
            href="/works"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
          >
            Ver mas trabajos
          </Link>
        </div>
      </div>
    </section>
  );
}
