'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Facebook, Instagram, Chrome } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/services', label: 'Servicios' },
  { href: '/contact', label: 'Contacto' },
  { href: '/orders', label: 'Mis pedidos' },
  { href: '/messages', label: 'Mis mensajes' },
];

const LEGAL_LINKS = [
  { href: '/#politicas', label: 'Politica de privacidad' },
  { href: '/#terminos', label: 'Terminos y condiciones' },
  { href: '/contact', label: 'Garantias y soporte' },
];

const SOCIAL_LINKS = [
  { href: 'https://www.instagram.com/virtualdeskk', label: 'Instagram', external: true, icon: Instagram },
  { href: '#', label: 'Facebook', external: false, icon: Facebook },
  { href: '#', label: 'Google', external: false, icon: Chrome },
];

const DEFAULT_BRAND = {
  name: 'VirtualDesk',
  logoUrl: '/virt.jpg',
};

export default function Footer() {
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  useEffect(() => {
    let active = true;
    fetch('/api/brand', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Brand fetch failed'))))
      .then((data) => {
        if (!active) return;
        const fetched = data?.brand;
        if (fetched) {
          setBrand({
            name: fetched.name || DEFAULT_BRAND.name,
            logoUrl: fetched.logoUrl || DEFAULT_BRAND.logoUrl,
          });
        }
      })
      .catch(() => {
        if (active) {
          setBrand(DEFAULT_BRAND);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const initials = useMemo(() => {
    const source = brand.name || DEFAULT_BRAND.name;
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'VD';
  }, [brand.name]);

  return (
    <footer className="mt-auto bg-gray-950 text-gray-300">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr,1fr,1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-indigo-500/60 bg-indigo-500/10">
                {brand.logoUrl ? (
                  <Image src={brand.logoUrl} alt={brand.name || 'Marca'} fill className="object-cover" sizes="48px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-indigo-200">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{brand.name}</p>
                <p className="text-xs uppercase tracking-widest text-indigo-200/80">Soluciones digitales</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Creamos software a medida para personas y empresas. Integramos tecnologia, diseno y soporte continuo para
              que tu negocio avance sin fricciones.
            </p>
            <div className="space-y-2 text-sm">
            <p className="text-white font-semibold uppercase tracking-wide text-xs">Contacto directo</p>
            <p className="text-gray-400">+569 5601 5863</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200/90">Navegacion</p>
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-400 transition hover:text-white hover:underline hover:underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4" id="quienes-somos">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-200/90">Nosotros</p>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                Somos un equipo multidisciplinario con experiencia en automatizacion, desarrollo web y operaciones
                cloud. Podemos acompanarte desde la ideacion hasta la mantencion de tu plataforma.
              </p>
            </div>
            <div>
              <p id="politicas" className="text-sm font-semibold uppercase tracking-wide text-indigo-200/90">
                Politicas
              </p>
              <div id="terminos" className="mt-3 flex flex-col gap-2 text-sm">
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-400 transition hover:text-white hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center gap-2 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">Siguenos</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {SOCIAL_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-300 transition hover:border-indigo-300 hover:text-white"
                >
                  <Icon size={18} />
                  <span className="sr-only">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} {brand.name || DEFAULT_BRAND.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
