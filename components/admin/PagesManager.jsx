'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const INITIAL_FORM = {
  title: '',
  slug: '',
  summary: '',
  heroImage: '',
  content: '',
  status: 'published',
  order: 0,
  path: '',
  sections: [],
};

function slugify(value) {
  return value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
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

function excerptFromHtml(html, maxLength = 200) {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

const SECTION_POSITIONS = [
  { value: 'belowTitle', label: 'Debajo del titulo' },
  { value: 'main', label: 'Antes del contenido principal' },
  { value: 'afterContent', label: 'Debajo de la descripcion' },
];

const SECTION_TYPE_LABELS = {
  cards: 'Seccion de tarjetas',
  slider: 'Seccion de slider',
};

function uniqueId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function moveItem(array, fromIndex, toIndex) {
  if (fromIndex === toIndex) return array;
  const next = array.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function prepareSectionsForForm(sections = []) {
  if (!Array.isArray(sections)) return [];
  return sections
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .filter((section) => section && (section.type === 'cards' || section.type === 'slider'))
    .map((section) => ({
      id: section.id || uniqueId('section'),
      type: section.type === 'slider' ? 'slider' : 'cards',
      position: section.position || 'main',
      title: section.title || '',
      description: section.description || '',
      items: Array.isArray(section.items)
        ? section.items
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((item) => ({
            id: item.id || uniqueId('card'),
            title: item.title || '',
            description: item.description || '',
            imageUrl: item.imageUrl || '',
            linkLabel: item.linkLabel || '',
            linkUrl: item.linkUrl || '',
          }))
        : [],
    }));
}

const createEmptyCard = () => ({
  id: uniqueId('card'),
  title: '',
  description: '',
  imageUrl: '',
  linkLabel: '',
  linkUrl: '',
});

const createEmptySlide = () => ({
  id: uniqueId('slide'),
  title: '',
  description: '',
  imageUrl: '',
  linkLabel: '',
  linkUrl: '',
});

const createEmptySection = (type = 'cards') => ({
  id: uniqueId('section'),
  type,
  position: 'main',
  title: '',
  description: '',
  items: [],
});

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
  const [formError, setFormError] = useState('');
  const [heroUploading, setHeroUploading] = useState(false);
  const heroFileInputRef = useRef(null);

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
    setFormError('');
  };

  const openCreate = () => {
    setFormMode('create');
    setFormData({ ...INITIAL_FORM, status: 'published' });
    setEditingId(null);
    setDialogOpen(true);
    setFormError('');
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
      sections: prepareSectionsForForm(page.sections),
    });
    setDialogOpen(true);
    setFormError('');
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'title' && formMode === 'create') {
      const generated = slugify(value);
      setFormData((prev) => ({ ...prev, slug: generated }));
    }
  };

  const handleContentChange = useCallback((html) => {
    setFormData((prev) => ({ ...prev, content: html }));
  }, []);

  const addSection = (type = 'cards') => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection(type)],
    }));
  };

  const updateSectionField = (sectionId, field, value) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const removeSection = (sectionId) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }));
  };

  const moveSection = (sectionId, direction) => {
    setFormError('');
    setFormData((prev) => {
      const index = prev.sections.findIndex((section) => section.id === sectionId);
      if (index === -1) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.sections.length) return prev;
      return {
        ...prev,
        sections: moveItem(prev.sections, index, nextIndex),
      };
    });
  };

  const addItemToSection = (sectionId) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const factory = section.type === 'slider' ? createEmptySlide : createEmptyCard;
        return {
          ...section,
          items: [...section.items, factory()],
        };
      }),
    }));
  };

  const updateItemField = (sectionId, itemId, field, value) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item,
          ),
        };
      }),
    }));
  };

  const removeItemFromSection = (sectionId, itemId) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        };
      }),
    }));
  };

  const moveItemWithinSection = (sectionId, itemId, direction) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const index = section.items.findIndex((item) => item.id === itemId);
        if (index === -1) return section;
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= section.items.length) return section;
        return {
          ...section,
          items: moveItem(section.items, index, nextIndex),
        };
      }),
    }));
  };

  const requestHeroUpload = () => {
    if (heroUploading) return;
    const input = heroFileInputRef.current;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleHeroFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/uploads/content', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.message || 'No se pudo subir la imagen destacada.');
      }
      setFormData((prev) => ({
        ...prev,
        heroImage: data.url,
      }));
    } catch (err) {
      const message = err.message || 'No se pudo subir la imagen destacada.';
      setFormError(message);
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } finally {
      setHeroUploading(false);
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
    setFormError('');

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
      setFormError('El titulo es obligatorio.');
      setSaving(false);
      return;
    }
    if (!payload.slug) {
      const generated = slugify(payload.title);
      if (!generated) {
        setFormError('No se pudo generar un slug valido.');
        setSaving(false);
        return;
      }
      payload.slug = generated;
    }

    for (const section of formData.sections) {
      if (section.type === 'slider') {
        if (!section.items.length) {
          setFormError('Cada slider debe tener al menos una diapositiva.');
          setSaving(false);
          return;
        }
        for (const slide of section.items) {
          if (!slide.imageUrl || !slide.imageUrl.trim()) {
            setFormError('Cada diapositiva debe tener una imagen.');
            setSaving(false);
            return;
          }
        }
      } else {
        for (const card of section.items) {
          if (!card.title || !card.title.trim()) {
            setFormError('Cada tarjeta debe tener un titulo.');
            setSaving(false);
            return;
          }
        }
      }
    }

    const normalizedSections = formData.sections
      .map((section, index) => {
        const type = section.type === 'slider' ? 'slider' : 'cards';
        const items = section.items
          .map((item, itemIndex) => ({
            id: item.id || uniqueId(type === 'slider' ? 'slide' : 'card'),
            title: item.title?.trim() || '',
            description: item.description?.trim() || '',
            imageUrl: item.imageUrl?.trim() || '',
            linkLabel: item.linkLabel?.trim() || '',
            linkUrl: item.linkUrl?.trim() || '',
            order: itemIndex,
          }))
          .filter((item) => (type === 'slider' ? Boolean(item.imageUrl) : Boolean(item.title)));

        return {
          id: section.id || uniqueId('section'),
          type,
          position: SECTION_POSITIONS.some((option) => option.value === section.position)
            ? section.position
            : 'main',
          title: section.title?.trim() || '',
          description: section.description?.trim() || '',
          order: index,
          items,
        };
      })
      .filter((section) => section.items.length > 0 || section.title || section.description);

    payload.sections = normalizedSections;

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
      const message = err.message || 'Error al guardar la pagina.';
      setFormError(message);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page) => {
    const confirmed = window.confirm(`Eliminar la pagina "${page.title}"? Esta accion no se puede deshacer.`);
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
                {page.content ? excerptFromHtml(page.content) : 'Sin contenido.'}
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
                  <span className="font-medium text-slate-700">Imagen destacada</span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={formData.heroImage}
                      onChange={handleFieldChange('heroImage')}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="https://..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={requestHeroUpload}
                        disabled={heroUploading}
                        className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {heroUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                        {heroUploading ? 'Subiendo...' : 'Subir imagen'}
                      </button>
                      {formData.heroImage ? (
                        <a
                          href={formData.heroImage}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:bg-slate-50"
                        >
                          <LinkIcon size={12} />
                          Ver
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeroFileChange}
                  />
                  <p className="text-xs text-slate-400">
                    Puedes pegar una URL publica o subir una imagen desde tu dispositivo. Se recomienda usar imagenes horizontales.
                  </p>
                </label>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <span className="font-medium text-slate-700">Contenido enriquecido</span>
                <RichTextEditor
                  value={formData.content}
                  onChange={handleContentChange}
                  placeholder="Describe la pagina con texto enriquecido, imagenes y listas."
                />
                <p className="text-xs text-slate-400">
                  El contenido se almacena en HTML. Puedes insertar imagenes, aplicar colores y resaltar texto.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className="font-medium text-slate-700">Secciones de la pagina</span>
                    <p className="text-xs text-slate-500">
                      Inserta bloques de tarjetas o sliders y decide donde se mostraran dentro del contenido.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addSection('cards')}
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      <Plus size={14} /> Seccion de tarjetas
                    </button>
                    <button
                      type="button"
                      onClick={() => addSection('slider')}
                      className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                    >
                      <Plus size={14} /> Seccion slider
                    </button>
                  </div>
                </div>

                {formData.sections.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Aun no has agregado secciones para esta pagina.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.sections.map((section, sectionIndex) => {
                      const typeLabel = SECTION_TYPE_LABELS[section.type] || SECTION_TYPE_LABELS.cards;
                      const pluralLabel = section.type === 'slider' ? 'Diapositivas' : 'Tarjetas';
                      const singularLabel = section.type === 'slider' ? 'Diapositiva' : 'Tarjeta';

                      return (
                        <div key={section.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <header className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400">
                                <GripVertical size={16} />
                              </span>
                              <div>
                                <h3 className="text-sm font-semibold text-slate-800">
                                  Seccion {sectionIndex + 1} - {typeLabel}
                                </h3>
                                <p className="text-xs text-slate-500">
                                  Posicion:{' '}
                                  {SECTION_POSITIONS.find((option) => option.value === section.position)?.label || 'Personalizada'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => moveSection(section.id, -1)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                disabled={sectionIndex === 0}
                              >
                                <ArrowUp size={14} /> Subir
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSection(section.id, 1)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                disabled={sectionIndex === formData.sections.length - 1}
                              >
                                <ArrowDown size={14} /> Bajar
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSection(section.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={14} /> Eliminar
                              </button>
                            </div>
                          </header>

                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="space-y-1 text-xs font-medium text-slate-700">
                              Titulo de la seccion (opcional)
                              <input
                                type="text"
                                value={section.title}
                                onChange={(event) => updateSectionField(section.id, 'title', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </label>
                            <label className="space-y-1 text-xs font-medium text-slate-700">
                              Posicion
                              <select
                                value={section.position}
                                onChange={(event) => updateSectionField(section.id, 'position', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                {SECTION_POSITIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="space-y-1 text-xs font-medium text-slate-700 md:col-span-2">
                              Descripcion (opcional)
                              <textarea
                                value={section.description}
                                onChange={(event) => updateSectionField(section.id, 'description', event.target.value)}
                                rows={2}
                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Texto breve para presentar esta seccion."
                              />
                            </label>
                          </div>

                          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-800">
                                {pluralLabel} ({section.items.length})
                              </h4>
                              <button
                                type="button"
                                onClick={() => addItemToSection(section.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                              >
                                <Plus size={12} /> Agregar {singularLabel.toLowerCase()}
                              </button>
                            </div>

                            {section.items.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                {section.type === 'slider'
                                  ? 'Agrega al menos una diapositiva para este slider.'
                                  : 'Agrega al menos una tarjeta para esta seccion.'}
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {section.items.map((item, itemIndex) => (
                                  <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                    <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
                                      <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <GripVertical size={14} className="text-slate-400" />
                                        <span>
                                          {singularLabel} {itemIndex + 1}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => moveItemWithinSection(section.id, item.id, -1)}
                                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                          disabled={itemIndex === 0}
                                        >
                                          <ArrowUp size={12} /> Subir
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveItemWithinSection(section.id, item.id, 1)}
                                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                          disabled={itemIndex === section.items.length - 1}
                                        >
                                          <ArrowDown size={12} /> Bajar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeItemFromSection(section.id, item.id)}
                                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                                        >
                                          <Trash2 size={12} /> Quitar
                                        </button>
                                      </div>
                                    </div>

                                    {section.type === 'slider' ? (
                                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <label className="space-y-1 text-xs font-medium text-slate-700 md:col-span-2">
                                          Imagen (URL requerida)
                                          <input
                                            type="text"
                                            value={item.imageUrl}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'imageUrl', event.target.value)
                                            }
                                            required
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="https://..."
                                          />
                                        </label>
                                        <label className="space-y-1 text-xs font-medium text-slate-700">
                                          Titulo (opcional)
                                          <input
                                            type="text"
                                            value={item.title}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'title', event.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          />
                                        </label>
                                        <label className="space-y-1 text-xs font-medium text-slate-700">
                                          Descripcion (opcional)
                                          <textarea
                                            value={item.description}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'description', event.target.value)
                                            }
                                            rows={2}
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Texto para acompanar la imagen."
                                          />
                                        </label>
                                        <label className="space-y-1 text-xs font-medium text-slate-700">
                                          Texto del enlace (opcional)
                                          <input
                                            type="text"
                                            value={item.linkLabel}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'linkLabel', event.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Ver mas"
                                          />
                                        </label>
                                        <label className="space-y-1 text-xs font-medium text-slate-700">
                                          URL del enlace (opcional)
                                          <input
                                            type="text"
                                            value={item.linkUrl}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'linkUrl', event.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="https://..."
                                          />
                                        </label>
                                      </div>
                                    ) : (
                                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <label className="space-y-1 text-xs font-medium text-slate-700">
                                          Titulo
                                          <input
                                            type="text"
                                            value={item.title}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'title', event.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            required
                                          />
                                        </label>
                                        <label className="space-y-1 text-xs font-medium text-slate-700">
                                          Imagen (URL opcional)
                                          <input
                                            type="text"
                                            value={item.imageUrl}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'imageUrl', event.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="https://..."
                                          />
                                        </label>
                                        <label className="space-y-1 text-xs font-medium text-slate-700 md:col-span-2">
                                          Descripcion
                                          <textarea
                                            value={item.description}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'description', event.target.value)
                                            }
                                            rows={2}
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Texto breve para esta tarjeta."
                                          />
                                        </label>
                                        <label className="space-y-1 text-xs font-medium text-slate-700">
                                          Texto del enlace (opcional)
                                          <input
                                            type="text"
                                            value={item.linkLabel}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'linkLabel', event.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="Ver mas"
                                          />
                                        </label>
                                        <label className="space-y-1 text-xs font-medium text-slate-700">
                                          URL del enlace (opcional)
                                          <input
                                            type="text"
                                            value={item.linkUrl}
                                            onChange={(event) =>
                                              updateItemField(section.id, item.id, 'linkUrl', event.target.value)
                                            }
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            placeholder="https://..."
                                          />
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {formError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{formError}</div>
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



