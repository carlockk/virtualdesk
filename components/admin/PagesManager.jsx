'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';

const INITIAL_FORM = {
  title: '',
  slug: '',
  summary: '',
  heroImage: '',
  content: '',
  status: 'published',
  order: 0,
  path: '',
};

function slugify(value) {
  return value
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export default function PagesManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const loadPages = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/pages?all=1', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data?.pages)) {
        throw new Error(data?.message || 'No se pudieron obtener las paginas.');
      }
      setPages(data.pages);
    } catch (err) {
      setError(err.message || 'Error al cargar paginas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const filteredPages = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pages;
    return pages.filter((page) => {
      return (
        page.title.toLowerCase().includes(term) ||
        page.slug.toLowerCase().includes(term) ||
        page.path?.toLowerCase().includes(term)
      );
    });
  }, [pages, search]);

  const closeDialog = () => {
    setDialogOpen(false);
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setSaving(false);
  };

  const openCreate = () => {
    setFormMode('create');
    setFormData({ ...INITIAL_FORM, status: 'published' });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (page) => {
    setFormMode('edit');
    setEditingId(page.id);
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      summary: page.summary || '',
      heroImage: page.heroImage || '',
      content: page.content || '',
      status: page.status || 'draft',
      order: typeof page.order === 'number' ? page.order : 0,
      path: page.path || '',
    });
    setDialogOpen(true);
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'title' && formMode === 'create') {
      const generated = slugify(value);
      setFormData((prev) => ({ ...prev, slug: generated }));
    }
  };

  const handleSlugChange = (event) => {
    const value = slugify(event.target.value);
    setFormData((prev) => ({ ...prev, slug: value }));
  };

  const handleStatusToggle = async (page) => {
    try {
      const newStatus = page.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo actualizar el estado.');
      }
      setPages((prev) => prev.map((item) => (item.id === page.id ? data.page : item)));
    } catch (err) {
      setError(err.message || 'Error al actualizar la pagina.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      summary: formData.summary.trim(),
      heroImage: formData.heroImage.trim(),
      content: formData.content,
      status: formData.status,
      order: Number(formData.order) || 0,
      path: formData.path.trim(),
    };

    if (!payload.title) {
      setError('El titulo es obligatorio.');
      setSaving(false);
      return;
    }
    if (!payload.slug) {
      const generated = slugify(payload.title);
      if (!generated) {
        setError('No se pudo generar un slug valido.');
        setSaving(false);
        return;
      }
      payload.slug = generated;
    }

    try {
      let res;
      if (formMode === 'create') {
        res = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (editingId) {
        res = await fetch(`/api/admin/pages/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res?.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo guardar la pagina.');
      }
      closeDialog();
      await loadPages();
    } catch (err) {
      setError(err.message || 'Error al guardar la pagina.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page) => {
    const confirmed = window.confirm(`¿Eliminar la pagina "${page.title}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;
    try {
      setDeletingId(page.id);
      const res = await fetch(`/api/admin/pages/${page.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo eliminar la pagina.');
      }
      await loadPages();
    } catch (err) {
      setError(err.message || 'Error al eliminar la pagina.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Paginas</h1>
          <p className="text-sm text-slate-600">
            Crea y organiza el contenido informativo del sitio. Las paginas publicadas pueden enlazarse desde el menu principal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadPages}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Recargar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} /> Crear pagina
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por titulo, slug o ruta"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-12 text-slate-500">
          <Loader2 size={18} className="animate-spin" /> Cargando paginas...
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
          No hay paginas registradas.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPages.map((page) => (
            <article
              key={page.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    <h2 className="text-lg font-semibold text-slate-900">{page.title}</h2>
                  </div>
                  <div className="text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={12} />
                      <span>{page.path || `/pages/${page.slug}`}</span>
                    </div>
                    <div>Slug: {page.slug}</div>
                    <div>Orden: {page.order ?? 0}</div>
                  </div>
                  {page.summary && <p className="text-sm text-slate-600">{page.summary}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Actualizado: {formatDate(page.updatedAt)}</span>
                    <span>Creado: {formatDate(page.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(page)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      page.status === 'published'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {page.status === 'published' ? <Eye size={14} /> : <EyeOff size={14} />}
                    {page.status === 'published' ? 'Publicado' : 'Oculto'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(page)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(page)}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    disabled={deletingId === page.id}
                  >
                    {deletingId === page.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Eliminar
                  </button>
                </div>
              </div>
              {page.heroImage && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <ImageIcon size={14} />
                  <span className="truncate">{page.heroImage}</span>
                </div>
              )}
              <div className="mt-4 text-sm text-slate-600 line-clamp-3">
                {page.content ? page.content.slice(0, 200) : 'Sin contenido.'}
              </div>
            </article>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {formMode === 'create' ? 'Crear pagina' : 'Editar pagina'}
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </header>
            <form className="max-h-[80vh] overflow-y-auto px-6 py-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Titulo</span>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={handleFieldChange('title')}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Slug</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="ej: nueva-pagina"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Ruta personalizada (opcional)</span>
                  <input
                    type="text"
                    value={formData.path}
                    onChange={handleFieldChange('path')}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="/pages/nueva-pagina"
                  />
                  <p className="text-xs text-slate-400">Si se deja vacio se generara automaticamente en /pages/slug.</p>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Estado</span>
                  <select
                    value={formData.status}
                    onChange={handleFieldChange('status')}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="published">Publicada</option>
                    <option value="draft">Oculta</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Orden</span>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={handleFieldChange('order')}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="font-medium text-slate-700">Resumen</span>
                  <textarea
                    value={formData.summary}
                    onChange={handleFieldChange('summary')}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Descripcion breve que se mostrara en listados."
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="font-medium text-slate-700">Imagen destacada (URL)</span>
                  <input
                    type="text"
                    value={formData.heroImage}
                    onChange={handleFieldChange('heroImage')}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Contenido</span>
                <textarea
                  value={formData.content}
                  onChange={handleFieldChange('content')}
                  rows={10}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Puedes usar HTML basico (p, h2, strong, a, ul, etc.) para dar formato al contenido."
                />
              </label>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
              )}

              <div className="mt-6 flex justify-end gap-2">
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
                  {formMode === 'create' ? 'Crear pagina' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
