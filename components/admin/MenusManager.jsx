'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  ListTree,
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

const INITIAL_FORM = {
  name: '',
  href: '',
  icon: '',
  category: 'global',
  order: 0,
  enabled: true,
  submenus: [],
};

const INITIAL_SUBMENU = {
  name: '',
  href: '',
  order: 0,
};

const ICON_MAP = {
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

const ICON_LIBRARY = [
  { value: '', label: 'Sin icono', icon: null },
  { value: 'home', label: 'Inicio', icon: Home },
  { value: 'layout-dashboard', label: 'Panel', icon: LayoutDashboard },
  { value: 'briefcase', label: 'Servicios', icon: Briefcase },
  { value: 'layers', label: 'Capas', icon: Layers },
  { value: 'grid-2x2', label: 'Dashboard', icon: Grid2x2 },
  { value: 'globe', label: 'Global', icon: Globe },
  { value: 'rocket', label: 'Lanzamiento', icon: Rocket },
  { value: 'shield-check', label: 'Seguridad', icon: ShieldCheck },
  { value: 'star', label: 'Destacado', icon: Star },
  { value: 'shopping-bag', label: 'Tienda', icon: ShoppingBag },
  { value: 'clipboard-list', label: 'Pedidos', icon: ClipboardList },
  { value: 'mail', label: 'Correo', icon: Mail },
  { value: 'phone', label: 'Telefono', icon: Phone },
  { value: 'message-circle', label: 'Mensajes', icon: MessageCircle },
  { value: 'user', label: 'Perfil', icon: User },
  { value: 'settings', label: 'Ajustes', icon: Settings },
  { value: 'monitor', label: 'Monitor', icon: Monitor },
  { value: 'code', label: 'Codigo', icon: Code2 },
  { value: 'book-open', label: 'Documentacion', icon: BookOpen },
  { value: 'heart', label: 'Favorito', icon: Heart },
];

function IconRenderer({ name, size = 16, className = '' }) {
  const IconComponent = getIconComponent(name);
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} />;
}

function normalizeIconKey(iconName = '') {
  return iconName.trim().replace(/[\s_-]+/g, '').toLowerCase();
}

function getIconComponent(iconName) {
  if (!iconName) return null;
  return ICON_MAP[normalizeIconKey(iconName)] || null;
}

function Dialog({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export default function MenusManager() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [availablePages, setAvailablePages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const loadMenus = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/menus', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data?.menus)) {
        throw new Error(data?.message || 'No se pudieron cargar los menus.');
      }
      setMenus(data.menus);
    } catch (err) {
      setError(err.message || 'Error al obtener menus.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePages = async () => {
    try {
      setLoadingPages(true);
      const res = await fetch('/api/admin/pages?all=1', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data?.pages)) {
        throw new Error(data?.message || 'No se pudieron obtener las paginas disponibles.');
      }
      setAvailablePages(data.pages);
    } catch (err) {
      console.warn('[menus] paginas no disponibles', err);
    } finally {
      setLoadingPages(false);
    }
  };

  useEffect(() => {
    loadMenus();
    loadAvailablePages();
  }, []);

  const openCreate = () => {
    setFormMode('create');
    setFormData({ ...INITIAL_FORM });
    setFormError('');
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (menu) => {
    setFormMode('edit');
    setEditingId(menu.id);
    setFormError('');
    setFormData({
      name: menu.name || '',
      href: menu.href || '',
      icon: menu.icon || '',
      category: menu.category || 'global',
      order: typeof menu.order === 'number' ? menu.order : 0,
      enabled: menu.enabled !== false,
      submenus: Array.isArray(menu.submenus)
        ? menu.submenus.map((item) => ({
            name: item.name || '',
            href: item.href || '',
            order: typeof item.order === 'number' ? item.order : 0,
          }))
        : [],
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormData({ ...INITIAL_FORM });
    setEditingId(null);
    setFormError('');
    setSaving(false);
  };

  const openIconPicker = () => {
    setIconSearch('');
    setIconPickerOpen(true);
  };

  const closeIconPicker = () => setIconPickerOpen(false);

  const handleIconSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      icon: value,
    }));
    setIconPickerOpen(false);
  };

  const updateField = (field) => (event) => {
    const value = field === 'enabled' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === 'order'
          ? Number.isNaN(Number(value))
            ? 0
            : Number(value)
        : value,
    }));
  };

  const updateSubmenuField = (index, field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => {
      const next = prev.submenus.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]:
                field === 'order'
                  ? Number.isNaN(Number(value))
                    ? 0
                    : Number(value)
                  : value,
            }
          : item,
      );
      return { ...prev, submenus: next };
    });
  };

  const addSubmenu = () => {
    setFormData((prev) => ({
      ...prev,
      submenus: [...prev.submenus, { ...INITIAL_SUBMENU }],
    }));
  };

  const removeSubmenu = (index) => {
    setFormData((prev) => ({
      ...prev,
      submenus: prev.submenus.filter((_, idx) => idx !== index),
    }));
  };

  const handleMainPageSelect = (event) => {
    const pageId = event.target.value;
    if (!pageId) return;
    const page = findPageById(pageId);
    if (!page) return;
    setFormData((prev) => ({
      ...prev,
      href: page.path,
      name: prev.name.trim() ? prev.name : page.title,
      category: 'pages',
    }));
  };

  const handleSubmenuPageSelect = (index) => (event) => {
    const pageId = event.target.value;
    if (!pageId) return;
    const page = findPageById(pageId);
    if (!page) return;
    setFormData((prev) => {
      const next = prev.submenus.map((item, idx) => {
        if (idx !== index) return item;
        const updated = {
          ...item,
          href: page.path,
        };
        if (!(item.name || '').trim()) {
          updated.name = page.title;
        }
        return updated;
      });
      return { ...prev, submenus: next };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setFormError('');
    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      href: formData.href.trim(),
      icon: formData.icon.trim(),
      category: formData.category || 'global',
      order: Number(formData.order) || 0,
      enabled: Boolean(formData.enabled),
      submenus: formData.submenus
        .map((item) => ({
          name: item.name.trim(),
          href: item.href.trim(),
          order: Number(item.order) || 0,
        }))
        .filter((item) => item.name && item.href),
    };

    if (payload.submenus.length === 0) {
      payload.submenus = [];
    }

    if (!payload.name) {
      setFormError('El nombre del menu es obligatorio.');
      setSaving(false);
      return;
    }
    if (!payload.href) {
      setFormError('Debes indicar un enlace para el menu.');
      setSaving(false);
      return;
    }

    try {
      let res;
      if (formMode === 'create') {
        res = await fetch('/api/admin/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (editingId) {
        res = await fetch(`/api/admin/menus/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res?.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo guardar el menu.');
      }
      closeDialog();
      await loadMenus();
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar el menu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menu) => {
    if (!menu?.id) return;
    const confirmed = window.confirm(`Seguro que deseas eliminar el menu "${menu.name}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;
    try {
      setDeletingId(menu.id);
      const res = await fetch(`/api/admin/menus/${menu.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo eliminar el menu.');
      }
      await loadMenus();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el menu.');
    } finally {
      setDeletingId('');
    }
  };

  const publishedPages = useMemo(() => {
    return availablePages
      .filter((page) => (page.status || 'draft') === 'published')
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [availablePages]);

  const findPageById = useCallback(
    (id) => {
      if (!id) return null;
      return publishedPages.find((page) => page.id === id) || null;
    },
    [publishedPages],
  );

  const findPageByHref = useCallback(
    (href) => {
      if (!href) return null;
      const normalized = href.trim();
      if (!normalized) return null;
      return publishedPages.find((page) => (page.path || '').trim() === normalized) || null;
    },
    [publishedPages],
  );

  const mainSelectedPageId = useMemo(() => {
    const matched = findPageByHref(formData.href);
    return matched?.id || '';
  }, [findPageByHref, formData.href]);

  const iconPreview = useMemo(() => Boolean(getIconComponent(formData.icon)), [formData.icon]);
  const filteredIconOptions = useMemo(() => {
    const term = iconSearch.trim().toLowerCase();
    if (!term) return ICON_LIBRARY;
    return ICON_LIBRARY.filter((option) => {
      const label = option.label.toLowerCase();
      const value = (option.value || '').toLowerCase();
      return label.includes(term) || value.includes(term);
    });
  }, [iconSearch]);
  const totalMenus = menus.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Menus de navegacion</h1>
          <p className="text-sm text-slate-600">
            Gestiona los enlaces principales del sitio y organiza submenus segun las secciones disponibles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadMenus}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Recargar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} /> Crear menu
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-12 text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Cargando menus...
        </div>
      ) : totalMenus === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
          Aun no has creado menus. Usa el boton Crear menu para empezar.
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => {
          const hasIcon = Boolean(getIconComponent(menu.icon));
          return (
            <article
              key={menu.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-full bg-indigo-100 p-2 text-indigo-600">
                    {hasIcon ? (
                      <IconRenderer name={menu.icon} size={16} className="text-indigo-600" />
                    ) : (
                      <ListTree size={16} className="text-indigo-600" />
                    )}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {menu.name}
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          (menu.category || 'global') === 'pages'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {(menu.category || 'global') === 'pages' ? 'Paginas' : 'Principal'}
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500">
                      {menu.href}{' '}
                      {menu.enabled ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          Visible
                        </span>
                      ) : (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          Oculto
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      Orden: {menu.order ?? 0}
                      {menu.icon ? ` - Icono: ${menu.icon}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(menu)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(menu)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    disabled={deletingId === menu.id}
                  >
                    {deletingId === menu.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Eliminar
                  </button>
                </div>
              </div>

              {menu.submenus?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700">Submenus</h3>
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
                    {menu.submenus
                      .slice()
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((submenu) => (
                        <li
                          key={`${menu.id}-${submenu.name}`}
                          className="flex items-center justify-between px-4 py-2 text-sm text-slate-600"
                        >
                          <div>
                            <div className="font-medium text-slate-800">{submenu.name}</div>
                            <div className="text-xs text-slate-500">{submenu.href}</div>
                          </div>
                          <span className="text-xs text-slate-400">Orden: {submenu.order ?? 0}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        title={formMode === 'create' ? 'Crear menu' : 'Editar menu'}
        onClose={closeDialog}
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Nombre</span>
              <input
                type="text"
                value={formData.name}
                onChange={updateField('name')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </label>
                        <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Icono (opcional)</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  list="menu-icon-options"
                  value={formData.icon}
                  onChange={updateField('icon')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Selecciona o escribe (ej: home, briefcase, mail)"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openIconPicker}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Elegir icono
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, icon: '' }))}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:text-indigo-600"
                  >
                    Sin icono
                  </button>
                </div>
              </div>
              <datalist id="menu-icon-options">
                {ICON_LIBRARY.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </datalist>
              <p className="text-xs text-slate-400">
                Usa iconos de Lucide React. Puedes escribir el nombre o abrir el catalogo para elegirlos visualmente.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Vista previa:</span>
                {iconPreview ? (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-600">
                    <IconRenderer name={formData.icon} size={16} />
                  </span>
                ) : (
                  <span>Sin icono</span>
                )}
              </div>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Ubicación</span>
              <select
                value={formData.category}
                onChange={updateField('category')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="global">Menú principal</option>
                <option value="pages">Paginas (submenu automatico)</option>
              </select>
              <p className="text-xs text-slate-400">
                Elige si este enlace aparece como item principal o dentro del grupo Paginas.
              </p>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Orden</span>
              <input
                type="number"
                value={formData.order}
                onChange={updateField('order')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="md:col-span-2 space-y-1 text-sm">
              <span className="font-medium text-slate-700">Enlace</span>
              <input
                type="text"
                value={formData.href}
                onChange={updateField('href')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="https://tusitio.com/seccion o /ruta-interna"
                required
              />
              {publishedPages.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <select
                    value={mainSelectedPageId}
                    onChange={handleMainPageSelect}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Selecciona una pagina publicada</option>
                    {publishedPages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title} ({page.path})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={loadAvailablePages}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <RefreshCw size={14} />
                    Actualizar
                  </button>
                  {loadingPages && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Loader2 size={12} className="animate-spin" />
                      Cargando
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-400">
                Puedes escribir cualquier direccion o elegir una pagina publicada para autocompletar.
              </p>
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={updateField('enabled')}
              className="rounded border-slate-300"
            />
            Mostrar en la navegacion principal
          </label>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Submenus (opcional)</h3>
              <button
                type="button"
                onClick={addSubmenu}
                className="inline-flex items-center gap-1 rounded-md border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
              >
                <Plus size={12} /> Anadir submenu
              </button>
            </div>

            {formData.submenus.length === 0 && (
              <p className="text-xs text-slate-500">
                Agrega enlaces secundarios si este menu necesita mostrar opciones adicionales.
              </p>
            )}

            {formData.submenus.length > 0 && (
              <div className="space-y-3">
                {formData.submenus.map((submenu, index) => {
                  const submenuSelectedPage = findPageByHref(submenu.href);
                  return (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr,1fr,auto]"
                    >
                      <label className="space-y-1 text-xs font-medium text-slate-700">
                        Nombre
                        <input
                          type="text"
                          value={submenu.name}
                          onChange={updateSubmenuField(index, 'name')}
                          className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-slate-700">
                        Enlace
                        <input
                          type="text"
                          value={submenu.href}
                          onChange={updateSubmenuField(index, 'href')}
                          className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {publishedPages.length > 0 ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <select
                              value={submenuSelectedPage?.id || ''}
                              onChange={handleSubmenuPageSelect(index)}
                              className="rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Elegir pagina publicada</option>
                              {publishedPages.map((page) => (
                                <option key={`submenu-${page.id}`} value={page.id}>
                                  {page.title} ({page.path})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                      </label>
                      <div className="flex items-end gap-2">
                        <label className="flex-1 space-y-1 text-xs font-medium text-slate-700">
                          Orden
                          <input
                            type="number"
                            value={submenu.order}
                            onChange={updateSubmenuField(index, 'order')}
                            className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSubmenu(index)}
                          className="inline-flex items-center justify-center rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                          aria-label="Eliminar submenu"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {formMode === 'create' ? 'Crear menu' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Dialog>

      {iconPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Seleccionar icono</h2>
                <p className="text-xs text-slate-500">Los iconos provienen de lucide-react.</p>
              </div>
              <button
                type="button"
                onClick={closeIconPicker}
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </header>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(event) => setIconSearch(event.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 md:w-64"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleIconSelect('');
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Sin icono
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  {filteredIconOptions.length} icono{filteredIconOptions.length === 1 ? '' : 's'} disponibles
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredIconOptions.map((option) => {
                  const isActive = normalizeIconKey(formData.icon) === normalizeIconKey(option.value);
                  return (
                    <button
                      key={`picker-${option.value || 'none'}`}
                      type="button"
                      onClick={() => handleIconSelect(option.value)}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                        isActive
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                      }`}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-indigo-600">
                        <IconRenderer name={option.value} size={16} />
                      </span>
                      <span className="flex-1 text-left">
                        <span className="block text-sm font-medium">{option.label}</span>
                        {option.value ? <span className="block text-xs text-slate-400">{option.value}</span> : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredIconOptions.length === 0 && (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No se encontraron iconos para “{iconSearch}”.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
