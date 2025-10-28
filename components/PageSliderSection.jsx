'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';

const AUTO_DELAY = 6000;

function normalizeSlides(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => ({
      id: item.id || `slide-${index}`,
      imageUrl: item.imageUrl || '',
      title: item.title || '',
      description: item.description || '',
      linkLabel: item.linkLabel || '',
      linkUrl: item.linkUrl || '',
    }))
    .filter((item) => item.imageUrl);
}

function SlideLink({ href, children, className, variant }) {
  if (!href) return null;
  const isInternal = href.startsWith('/');
  const sharedClasses =
    className ||
    (variant === 'hero'
      ? 'inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/20'
      : 'inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50');

  if (isInternal) {
    return (
      <Link href={href} className={sharedClasses}>
        {children}
        <ArrowUpRight size={14} />
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={sharedClasses}>
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}

export default function PageSliderSection({ section, variant = 'default' }) {
  const slides = useMemo(() => normalizeSlides(section?.items), [section?.items]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
  }, [section?.id, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    if (typeof window === 'undefined') return undefined;
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTO_DELAY);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const containerClasses =
    variant === 'hero'
      ? 'rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100 backdrop-blur-sm'
      : 'rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm';

  const headingClasses = variant === 'hero' ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-slate-900';
  const descriptionClasses = variant === 'hero' ? 'text-sm text-slate-100/80' : 'text-sm text-slate-600';
  const overlayClasses =
    variant === 'hero'
      ? 'absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent'
      : 'absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent';

  const goTo = (direction) => {
    if (slides.length <= 1) return;
    setCurrent((prev) => (prev + direction + slides.length) % slides.length);
  };

  return (
    <section className={containerClasses}>
      {(section?.title || section?.description) && (
        <header className="space-y-2">
          {section.title ? <h2 className={headingClasses}>{section.title}</h2> : null}
          {section.description ? <p className={descriptionClasses}>{section.description}</p> : null}
        </header>
      )}

      <div className={`relative mt-4 overflow-hidden rounded-xl ${variant === 'hero' ? 'border border-white/20' : 'border border-slate-200'}`}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`relative h-64 w-full transition-opacity duration-700 md:h-80 ${index === current ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <img src={slide.imageUrl} alt={slide.title || section?.title || `slide-${index + 1}`} className="h-full w-full object-cover" loading={index === current ? 'eager' : 'lazy'} />
            <div className={overlayClasses} />
            {(slide.title || slide.description || slide.linkUrl) && (
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                {slide.title ? (
                  <h3 className={variant === 'hero' ? 'text-lg font-semibold text-white' : 'text-lg font-semibold text-white'}>
                    {slide.title}
                  </h3>
                ) : null}
                {slide.description ? (
                  <p className="mt-2 text-sm text-white/90">{slide.description}</p>
                ) : null}
                {slide.linkUrl ? (
                  <div className="mt-3">
                    <SlideLink href={slide.linkUrl} variant={variant}>
                      {slide.linkLabel || 'Ver detalle'}
                    </SlideLink>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/30"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id || index}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`h-2.5 w-2.5 rounded-full transition ${current === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                  aria-label={`Ir a la diapositiva ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
