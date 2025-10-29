'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuthPanel } from './AuthPanelProvider';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Menu as MenuIcon,
  X,
  ChevronDown,
  ChevronRight,
  Home,
  Briefcase,
  Mail,
  Phone,
  Grid2x2,
  ClipboardList,
  MessageCircle,
  User,
  Settings,
  LayoutDashboard,
  Layers,
  Globe,
  Rocket,
  ShieldCheck,
  Star,
  ShoppingBag,
  Monitor,
  Code2,
  BookOpen,
  Heart,
} from 'lucide-react';

const DEFAULT_BRAND = { name: 'VirtualDesk', logoUrl: '/virt.jpg' };

const FALLBACK_MENUS = [
  { id: 'home', name: 'Inicio', href: '/', order: 0, icon: 'home', submenus: [] },
  { id: 'services', name: 'Servicios', href: '/services', order: 1, icon: 'briefcase', submenus: [] },
  { id: 'contact', name: 'Contacto', href: '/contact', order: 2, icon: 'mail', submenus: [] },
  { id: 'orders', name: 'Pedidos', href: '/orders', order: 3, icon: 'clipboardList', submenus: [] },
];

const MENU_ICON_MAP = {
  home: Home,
  inicio: Home,
  briefcase: Briefcase,
  services: Briefcase,
  servicio: Briefcase,
  servicios: Briefcase,
  mail: Mail,
  contact: Mail,
  contacto: Mail,
  phone: Phone,
  telefono: Phone,
  grid: Grid2x2,
  grid2x2: Grid2x2,
  dashboard: Grid2x2,
  clipboard: ClipboardList,
  clipboardlist: ClipboardList,
  pedidos: ClipboardList,
  orders: ClipboardList,
  message: MessageCircle,
  mensajes: MessageCircle,
  messagecircle: MessageCircle,
  user: User,
  perfil: User,
  settings: Settings,
  ajustes: Settings,
  layoutdashboard: LayoutDashboard,
  panel: LayoutDashboard,
  layers: Layers,
  monitor: Monitor,
  globe: Globe,
  rocket: Rocket,
  shieldcheck: ShieldCheck,
  security: ShieldCheck,
  star: Star,
  shoppingbag: ShoppingBag,
  tienda: ShoppingBag,
  code: Code2,
  code2: Code2,
  bookopen: BookOpen,
  documentacion: BookOpen,
  heart: Heart,
};

function normalizeIconKey(name = '') {
  return name.trim().replace(/[\s_-]+/g, '').toLowerCase();
}

function getMenuIconComponent(iconName, menuName) {
  const iconKey = iconName ? normalizeIconKey(iconName) : '';
  if (iconKey && MENU_ICON_MAP[iconKey]) {
    return MENU_ICON_MAP[iconKey];
  }
  const fallbackKey = normalizeIconKey(menuName);
  return MENU_ICON_MAP[fallbackKey] || null;
}

const sortMenus = (items) =>
  items
    .map((menu, index) => ({
      ...menu,
      order: typeof menu.order === 'number' ? menu.order : index,
      submenus: Array.isArray(menu.submenus)
        ? menu.submenus
            .map((child, childIndex) => ({
              ...child,
              order: typeof child.order === 'number' ? child.order : childIndex,
            }))
            .sort((a, b) => a.order - b.order)
        : [],
    }))
    .sort((a, b) => a.order - b.order);

export default function Header() {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [menus, setMenus] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const { show: openAuthPanel } = useAuthPanel();

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const isSuperAdmin = useMemo(
    () => (user?.email ? user.email.toLowerCase() === SUPER_ADMIN_EMAIL : false),
    [user?.email],
  );

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
    let active = true;
    fetch('/api/menus', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Menu fetch failed'))))
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data?.menus)) {
          setMenus(data.menus);
        }
      })
      .catch(() => {});
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

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setScrolled(y > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMobileOpen(false);
    window.location.href = '/';
  }, []);

  const sortedMenuItems = useMemo(() => {
    const source = menus.length > 0 ? menus : FALLBACK_MENUS;
    return sortMenus(source);
  }, [menus]);

  const topActions = useMemo(() => {
    if (!user) return [];
    const actions = [];

    if (isSuperAdmin) {
      actions.push({ type: 'link', label: 'Centro admin', href: '/admin' });
      actions.push({ type: 'link', label: 'Crear super admin', href: '/admin/bootstrap' });
    } else if (isAdmin) {
      actions.push({ type: 'link', label: 'Panel admin', href: '/admin' });
    }

    actions.push({ type: 'link', label: 'Ver perfil', href: '/profile' });
    actions.push({ type: 'button', label: 'Salir', onClick: logout });
    return actions;
  }, [user, isAdmin, isSuperAdmin, logout]);

  const closeMobile = () => setMobileOpen(false);

  const handleAuth = (mode) => {
    openAuthPanel(mode);
    closeMobile();
  };

  const toggleExpanded = (id) => {
    setExpandedMenu((prev) => (prev === id ? null : id));
  };

  return (
    <header
      className={[
        'sticky top-0 z-40 flex flex-col transition',
        scrolled ? 'bg-white shadow-sm' : 'bg-white shadow-none',
      ].join(' ')}
    >
      {user && (
        <div className="bg-indigo-700/95 text-[11px] leading-4 text-white">
          <div className="container flex flex-col gap-2 py-2 text-center font-medium tracking-wide md:flex-row md:items-center md:justify-between">
            <span>Bienvenido{user.name ? ` ${user.name}` : ''}</span>
            {topActions.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
                {topActions.map((action) =>
                  action.type === 'link' ? (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="inline-flex items-center gap-2 rounded border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
                      onClick={closeMobile}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      className="inline-flex items-center gap-2 rounded border border-white/20 bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
                    >
                      {action.label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container pt-1 md:pt-2 pb-0 flex justify-between items-start md:items-center relative">
        <Link
          href="/"
          className="relative flex items-start mx-3 sm:mx-0 shrink-0"
          onClick={closeMobile}
        >
          <div className="relative w-20 h-20 md:w-28 md:h-28 -mb-6 md:-mb-8 translate-y-2 md:translate-y-3 rounded-full border-4 border-white shadow-2xl overflow-hidden ring-4 ring-indigo-50 z-[70]">
            <Image
              src={brand.logoUrl || DEFAULT_BRAND.logoUrl}
              alt={brand.name || DEFAULT_BRAND.name}
              fill
              sizes="112px"
              className="object-cover"
              priority
            />
          </div>
          <span className="sr-only">{brand.name || DEFAULT_BRAND.name}</span>
        </Link>

        <nav className="hidden md:flex gap-2 items-center md:ml-auto md:justify-end">
          {sortedMenuItems.map((menu) => {
            const IconComponent = getMenuIconComponent(menu.icon, menu.name);
            return (
              <div key={menu.id || menu.name} className="relative group">
                <Link
                  href={menu.href || '#'}
                  className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {IconComponent && <IconComponent size={16} className="text-indigo-500" />}
                  <span>{menu.name}</span>
                  {menu.submenus.length > 0 && (
                    <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-600" />
                  )}
                </Link>
                {menu.submenus.length > 0 && (
                  <div className="pointer-events-none absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-lg opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
                    {menu.submenus.map((child) => (
                      <Link
                        key={`${menu.id}-${child.name}`}
                        href={child.href || '#'}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                        onClick={closeMobile}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? null : (
            <>
              <button
                type="button"
                onClick={() => handleAuth('login')}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => handleAuth('register')}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Crear cuenta
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg border border-slate-200 p-2 text-slate-600"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-lg">
          <div className="container py-4">
            <ul className="space-y-2">
              {sortedMenuItems.map((menu) => {
                const hasChildren = menu.submenus.length > 0;
                const isExpanded = expandedMenu === (menu.id || menu.name);
                const IconComponent = getMenuIconComponent(menu.icon, menu.name);
                return (
                  <li key={menu.id || menu.name}>
                    <div className="flex items-center justify-between">
                      <Link
                        href={menu.href || '#'}
                        className="flex-1 rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50"
                        onClick={closeMobile}
                      >
                        <span className="inline-flex items-center gap-2">
                          {IconComponent ? <IconComponent size={16} className="text-indigo-500" /> : null}
                          <span>{menu.name}</span>
                        </span>
                      </Link>
                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(menu.id || menu.name)}
                          className="rounded-full border border-slate-200 p-1 text-slate-500"
                          aria-label="Mostrar submenus"
                        >
                          <ChevronRight
                            size={16}
                            className={`transition ${isExpanded ? 'rotate-90 text-indigo-600' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                    {hasChildren && isExpanded && (
                      <ul className="mt-1 space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-2">
                        {menu.submenus.map((child) => (
                          <li key={`${menu.id}-${child.name}`}>
                            <Link
                              href={child.href || '#'}
                              className="block rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-indigo-100"
                              onClick={closeMobile}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 border-t border-slate-200 pt-4">
              {user ? (
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="font-medium text-slate-800">{user.name}</div>
                  <Link
                    href="/profile"
                    className="block rounded-lg border border-slate-200 px-4 py-2 text-center hover:bg-slate-50"
                    onClick={closeMobile}
                  >
                    Ver perfil
                  </Link>
                  {isSuperAdmin ? (
                    <Link
                      href="/admin"
                      className="block rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-center font-medium text-indigo-700 hover:bg-indigo-100"
                      onClick={closeMobile}
                    >
                      Centro admin
                    </Link>
                  ) : (
                    isAdmin && (
                      <Link
                        href="/admin"
                        className="block rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-center font-medium text-indigo-700 hover:bg-indigo-100"
                        onClick={closeMobile}
                      >
                        Panel admin
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleAuth('login')}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Ingresar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuth('register')}
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    Crear cuenta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
