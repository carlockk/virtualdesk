'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

function getItemsPerView(width) {
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 1;
}

export default function WorksShowcase() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemsPerView, setItemsPerView] = useState(() =>
    typeof window === 'undefined' ? 1 : getItemsPerView(window.innerWidth),
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView(window.innerWidth));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const slides = useMemo(() => {
    if (!itemsPerView || itemsPerView <= 0) return [];
    const total = works.length;
    if (total === 0) return [];
    if (total <= itemsPerView) return [{ start: 0, window: works }];

    const windows = [];
    for (let start = 0; start < total; start += 1) {
      const window = [];
      for (let offset = 0; offset < itemsPerView; offset += 1) {
        window.push(works[(start + offset) % total]);
      }
      windows.push({ start, window });
    }
    return windows;
  }, [works, itemsPerView]);

  useEffect(() => {
    if (slides.length === 0) return;
    if (index >= slides.length) {
      setIndex(0);
    }
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const handlePrev = useCallback(() => {
    if (slides.length <= 1) return;
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleNext = useCallback(() => {
    if (slides.length <= 1) return;
    setIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  return (
    <section className="bg-slate-50 py-12">
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
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
        ) : works.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500">
            Aun no hay trabajos registrados. Vuelve pronto.
          </div>
        ) : (
          <div
            className="relative -mx-4 sm:-mx-6 lg:-mx-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="overflow-hidden border border-slate-200 bg-white ">
              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${index * 100}%)`, width: `${slides.length * 100}%` }}
              >
                {slides.map(({ start, window: chunk }, slideIndex) => (
                  <div
                    key={start}
                    className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4"
                    style={{ minWidth: '100%' }}
                  >
                    {chunk.map((work, idx) => (
                      <article
                        key={`${work.id}-${start}-${idx}`}
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
                            <h4 className="mt-2 text-lg font-semibold text-slate-900">{work.title}</h4>
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
                ))}
              </div>
            </div>

            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow hover:text-indigo-600 md:inline-flex"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow hover:text-indigo-600 md:inline-flex"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {slides.map((_, dotIndex) => (
                    <button
                      key={dotIndex}
                      type="button"
                      onClick={() => setIndex(dotIndex)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        index === dotIndex ? 'bg-indigo-600' : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Ir al slide ${dotIndex + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


