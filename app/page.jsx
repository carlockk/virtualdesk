'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorksShowcase from '@/components/WorksShowcase';
import IconRenderer from '@/components/IconRenderer';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Zap, ShieldCheck, Star } from 'lucide-react';
import { DEFAULT_HERO } from '@/lib/hero-defaults';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

function normalizeHeroState(raw) {
  const base = raw && typeof raw === 'object' ? raw : {};
  const slides =
    Array.isArray(base.slides) && base.slides.length ? base.slides : DEFAULT_HERO.slides;
  const buttons =
    Array.isArray(base.buttons) && base.buttons.length ? base.buttons : DEFAULT_HERO.buttons;

  return {
    ...DEFAULT_HERO,
    ...base,
    title: {
      ...DEFAULT_HERO.title,
      ...(base.title || {}),
    },
    subtitle: {
      ...DEFAULT_HERO.subtitle,
      ...(base.subtitle || {}),
    },
    heroImage: typeof base.heroImage === 'string' ? base.heroImage : DEFAULT_HERO.heroImage,
    slides,
    buttons,
  };
}

export default function HomePage() {
  const [hero, setHero] = useState(() => normalizeHeroState());
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/hero', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Error al cargar hero'))))
      .then((data) => {
        if (!active) return;
        if (data?.hero) {
          setHero(normalizeHeroState(data.hero));
        }
      })
      .catch(() => {
        if (active) {
          setHero(normalizeHeroState());
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const heroSlides = useMemo(() => {
    const source =
      Array.isArray(hero.slides) && hero.slides.length ? hero.slides : DEFAULT_HERO.slides;
    return source
      .map((slide, index) => ({
        id: slide.id || `slide-${index}`,
        imageUrl: slide.imageUrl || '',
      }))
      .filter((slide) => slide.imageUrl);
  }, [hero.slides]);

  const heroButtons = useMemo(() => {
    const source =
      Array.isArray(hero.buttons) && hero.buttons.length ? hero.buttons : DEFAULT_HERO.buttons;
    return source
      .filter((button) => button.visible !== false && button.label && button.href)
      .map((button, index) => ({
        ...button,
        id: button.id || `button-${index}`,
        label: button.label.trim(),
        href: button.href.trim(),
        icon: button.icon || '',
      }));
  }, [hero.buttons]);

  const sliderActive = hero.visible !== false && heroSlides.length > 0;
  const heroHeight = Math.min(Math.max(hero.height ?? DEFAULT_HERO.height, 40), 120);
  const heroTitle = hero.title?.text?.trim() || DEFAULT_HERO.title.text;
  const heroTitleVisible = hero.title?.visible !== false;
  const heroSubtitle = hero.subtitle?.text?.trim() || DEFAULT_HERO.subtitle.text;
  const heroSubtitleVisible = hero.subtitle?.visible !== false;
  const heroBackgroundImage = !sliderActive
    ? hero.heroImage?.trim() || heroSlides[0]?.imageUrl || DEFAULT_HERO.heroImage
    : null;

  useEffect(() => {
    setCurrentSlide(0);
  }, [sliderActive, heroSlides.length]);

  useEffect(() => {
    if (!sliderActive || heroSlides.length <= 1) return undefined;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sliderActive, heroSlides.length]);

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      {/* === SLIDER === */}
      <section
        className="relative w-full overflow-hidden -mt-10 md:-mt-14"
        style={{ height: `${heroHeight}vh` }}
      >
        {sliderActive
          ? heroSlides.map((slide, idx) => (
              <img
                key={slide.id || `slide-${idx}`}
                src={slide.imageUrl}
                alt={heroTitle ? `${heroTitle} - fondo ${idx + 1}` : `slide-${idx}`}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                  idx === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            ))
          : heroBackgroundImage
          ? (
              <img
                src={heroBackgroundImage}
                alt={heroTitle ? `${heroTitle} - fondo principal` : 'hero-background'}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
            )
          : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-600 to-indigo-900" />
            )}

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 px-4 text-center">
          {heroTitleVisible ? (
            <h2 className="mb-4 text-5xl font-extrabold text-white drop-shadow-lg md:text-6xl">{heroTitle}</h2>
          ) : null}
          {heroSubtitleVisible ? (
            <p className="mb-8 max-w-2xl text-lg text-white/90 md:text-xl">{heroSubtitle}</p>
          ) : null}

          {heroButtons.length > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              {heroButtons.map((button, index) => (
                <Link
                  key={button.id || `${button.href}-${index}`}
                  href={button.href}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white px-8 py-4 text-lg font-semibold text-indigo-700 shadow-lg transition hover:bg-white/90 active:scale-[0.99] md:text-xl"
                >
                  {button.icon ? <IconRenderer name={button.icon} size={22} /> : null}
                  {button.label}
                </Link>
              ))}
            </div>
          ) : null}
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

      <WorksShowcase />

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Preparando chat...</div>}>
        <ChatWidget />
      </Suspense>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de página...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
