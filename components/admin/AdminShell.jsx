'use client';

import { AdminProvider } from '@/components/admin/AdminContext';
import {
  Briefcase,
  ClipboardList,
  FolderGit2,
  Globe,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Palette,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/services', label: 'Servicios', icon: Briefcase },
  { href: '/admin/orders', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/brand', label: 'Marca', icon: Palette },
  { href: '/admin/works', label: 'Trabajos', icon: FolderGit2 },
  { href: '/admin/messages', label: 'Mensajes', icon: MessageSquare },
];

const DEFAULT_BRAND = {
  name: 'VirtualDesk',
  logoUrl: '/virt.jpg',
};

export default function AdminShell({ user, isSuperAdmin, children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  const brandInitials = useMemo(() => {
    const source = brand.name || DEFAULT_BRAND.name;
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'VD';
  }, [brand.name]);

  const navLinks = useMemo(() => {
    return NAV_ITEMS.map((item) => {
      const active =
        item.href === '/admin'
          ? pathname === '/admin'
          : pathname?.startsWith(item.href);
      return { ...item, active };
    });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  };

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name || 'Marca'} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-indigo-600">{brandInitials}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{brand.name}</p>
          <p className="text-xs text-slate-500">Panel administrativo</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    item.active
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-200 px-6 py-4 text-sm">
        <p className="font-medium text-slate-800">{user?.name || 'Administrador'}</p>
        <p className="text-xs text-slate-500">{user?.email}</p>
        {isSuperAdmin && (
          <span className="mt-2 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
            Super admin
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );

  return (
    <AdminProvider value={{ user, isSuperAdmin }}>
      <div className="min-h-screen bg-slate-100">
        <div className="flex min-h-screen">
          <div className="hidden lg:flex">{sidebar}</div>

          {sidebarOpen && (
            <div className="fixed inset-0 z-40 flex lg:hidden">
              <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSidebarOpen(false)} />
              <div className="relative z-50 h-full w-72 shadow-xl">{sidebar}</div>
            </div>
          )}

          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                    onClick={() => setSidebarOpen((prev) => !prev)}
                  >
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{brand.name}</p>
                    <p className="text-xs text-slate-500">Panel administrativo</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    <Globe size={16} />
                    Ver sitio
                  </Link>
                </div>
              </div>
            </header>
            <main className="flex-1 px-4 py-6 lg:px-8">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}
