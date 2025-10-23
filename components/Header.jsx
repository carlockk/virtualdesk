'use client';
import { Briefcase, Home, Mail, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useAuthPanel } from './AuthPanelProvider';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';

const DEFAULT_BRAND = { name: 'VirtualDesk', logoUrl: '/virt.jpg' };

export default function Header() {
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { show: openAuthPanel } = useAuthPanel();
  const isAdmin = user?.role === 'admin';
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setUser(data.user || null))
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    const handler = (event) => {
      const updatedUser = event?.detail?.user;
      if (updatedUser) {
        setUser(updatedUser);
        return;
      }
      fetch('/api/auth/me', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => setUser(data.user || null))
        .catch(() => {});
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('virtualdesk:user-updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('virtualdesk:user-updated', handler);
      }
    };
  }, []);

  // Detecta scroll para activar transparencia/blur solo después de mover la página
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setScrolled(y > 8); // umbral pequeño para activar estado "scrolled"
    };
    onScroll(); // estado inicial
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMobileOpen(false);
    location.href = '/';
  };

  const closeMobile = () => setMobileOpen(false);
  const triggerAuth = (mode) => {
    openAuthPanel(mode);
    closeMobile();
  };

  const isSuperSeed = useMemo(
    () => (user?.email ? user.email.toLowerCase() === SUPER_ADMIN_EMAIL : false),
    [user?.email],
  );

  const navLinks = (
    <>
      <Link href="/" className="px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
        <Home className="inline mr-2" size={18} />
        Inicio
      </Link>
      <Link href="/services" className="px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
        <Briefcase className="inline mr-2" size={18} />
        Servicios
      </Link>
      <Link href="/contact" className="px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
        <Mail className="inline mr-2" size={18} />
        Contacto
      </Link>
      <Link href="/orders" className="px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
        Mis pedidos
      </Link>
      {user && !isAdmin && (
        <Link href="/messages" className="px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
          Mis mensajes
        </Link>
      )}
      {isAdmin && (
        <Link
          href="/admin"
          className="px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700"
          onClick={closeMobile}
        >
          Panel admin
        </Link>
      )}
      {user ? (
        <>
          <Link
            href="/profile"
            className="px-3 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
            onClick={closeMobile}
          >
            Ver perfil
          </Link>
          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm">{user.name}</span>
          <button onClick={logout} className="px-3 py-2 rounded-lg border text-gray-600 hover:bg-gray-50">
            Salir
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="px-3 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
            onClick={() => triggerAuth('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => triggerAuth('register')}
          >
            Crear cuenta
          </button>
        </>
      )}
    </>
  );

  return (
    <header
      className={[
        'sticky top-0 z-40 overflow-visible transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-white/70'
          : 'bg-white shadow-none', // SÓLIDO arriba para que el slider no se vea debajo
      ].join(' ')}
    >
      {user && (
        <div className="bg-indigo-700/95 text-white text-[10px] leading-4 py-1 text-center font-medium tracking-wide">
          <span>{`Bienvenido${user.name ? ` ${user.name}` : ''}`}</span>
          {isSuperSeed && (
            <span className="ml-3 inline-flex items-center gap-2">
              <Link
                href="/admin/messages"
                className="underline underline-offset-2 decoration-white/60 hover:text-indigo-100 transition"
              >
                Centro admin
              </Link>
              <Link
                href="/admin/bootstrap"
                className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 transition"
              >
                Crear super admin
              </Link>
            </span>
          )}
        </div>
      )}
      {/* Barra superior: pb-0 para que el hero pegue justo al borde inferior del header */}
      <div className="container pt-1 md:pt-2 pb-0 flex justify-between items-start md:items-center relative">
        {/* LOGO con margen en mobile para que no quede pegado a la izquierda */}
        <Link
          href="/"
          className="relative flex items-start mx-3 sm:mx-0 shrink-0"
          onClick={closeMobile}
        >
          <div className="relative w-20 h-20 md:w-28 md:h-28 -mb-6 md:-mb-8 translate-y-2 md:translate-y-3 rounded-full border-4 border-white shadow-2xl overflow-hidden ring-4 ring-indigo-50 z-[70]">
            <Image
              src={brand.logoUrl || DEFAULT_BRAND.logoUrl}
              alt={brand.name || 'Marca'}
              fill
              sizes="112px"
              className="object-cover"
              priority
            />
          </div>
          <span className="sr-only">{brand.name || DEFAULT_BRAND.name}</span>
        </Link>

        <nav className="hidden md:flex gap-2 items-center">{navLinks}</nav>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg border text-gray-600 hover:bg-indigo-50 bg-white/90"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Alternar menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MENÚ MÓVIL: lista sin marcadores + padding top para despegar del logo */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white shadow-xl relative z-[60]">
          <div className="container pt-12 sm:pt-8 pb-4">
            <ul className="list-none m-0 p-0 space-y-2">
              <li>
                <Link href="/" className="block px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
                  <Home className="inline mr-2" size={18} />
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/services" className="block px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
                  <Briefcase className="inline mr-2" size={18} />
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="/contact" className="block px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
                  <Mail className="inline mr-2" size={18} />
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/orders" className="block px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
                  Mis pedidos
                </Link>
              </li>

              {user && !isAdmin && (
                <li>
                  <Link href="/messages" className="block px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700" onClick={closeMobile}>
                    Mis mensajes
                  </Link>
                </li>
              )}

              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    className="block px-4 py-2 rounded-lg hover:bg-indigo-50 text-gray-700"
                    onClick={closeMobile}
                  >
                    Panel admin
                  </Link>
                </li>
              )}

              <li className="pt-1">
                {user ? (
                  <div className="flex flex-col gap-2 px-1">
                    <Link
                      href="/profile"
                      className="w-full px-3 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-center"
                      onClick={closeMobile}
                    >
                      Ver perfil
                    </Link>
                    <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
                      <span className="font-medium truncate">{user.name}</span>
                    </div>
                    <button onClick={logout} className="px-3 py-2 rounded-lg border text-gray-600 hover:bg-gray-50">
                      Salir
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-1">
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
                      onClick={() => triggerAuth('login')}
                    >
                      Ingresar
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={() => triggerAuth('register')}
                    >
                      Crear cuenta
                    </button>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}



