'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';

const DESCRIPTION_LIMIT = 140;
const SLIDE_DURATION_MS = 400;

function truncateDescription(text, limit) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}...`;
}

function normalizeOrder(value) {
  if (value === '' || value === null || value === undefined) return Number.MAX_SAFE_INTEGER;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function sortWorks(items) {
  return [...items].sort((a, b) => {
    const orderA = normalizeOrder(a?.order);
    const orderB = normalizeOrder(b?.order);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

function computeItemsPerView(width) {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function WorkCard({ work, isSuperAdmin, onEdit, onDelete }) {
  const shortDescription = truncateDescription(work.description, DESCRIPTION_LIMIT);
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <img
        src={work.imageUrl}
        alt={work.title}
        className="h-44 w-full object-cover"
        loading="lazy"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{work.title}</h4>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(work)}
                className="rounded-full border border-gray-200 p-1.5 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                aria-label={`Editar ${work.title}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(work)}
                className="rounded-full border border-gray-200 p-1.5 text-gray-600 hover:border-red-300 hover:text-red-600"
                aria-label={`Eliminar ${work.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600" title={work.description}>
          {shortDescription}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {work.createdAt ? new Date(work.createdAt).toLocaleDateString() : ''}
          </span>
          {work.projectUrl && (
            <a
              href={work.projectUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Ir al proyecto
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function WorkPanel({ open, onClose, onSubmit, onDelete, work }) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const [title, setTitle] = useState(work?.title || '');
  const [description, setDescription] = useState(work?.description || '');
  const [projectUrl, setProjectUrl] = useState(work?.projectUrl || '');
  const [order, setOrder] = useState(
    typeof work?.order === 'number' ? String(work.order) : '',
  );
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(work?.imageUrl || '');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const fileUrlRef = useRef('');
  const fileInputRef = useRef(null);

  const isEdit = Boolean(work?.id);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), SLIDE_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mounted]);

  useEffect(() => {
    setTitle(work?.title || '');
    setDescription(work?.description || '');
    setProjectUrl(work?.projectUrl || '');
    setOrder(typeof work?.order === 'number' ? String(work.order) : '');
    setImageFile(null);
    setError('');
    setPreviewUrl(work?.imageUrl || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [work, open]);

  useEffect(() => {
    return () => {
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
        fileUrlRef.current = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  const resetFilePreview = () => {
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = '';
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      resetFilePreview();
      setPreviewUrl(work?.imageUrl || '');
      return;
    }
    setImageFile(file);
    resetFilePreview();
    const objectUrl = URL.createObjectURL(file);
    fileUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (!description.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }
    if (!isEdit && !imageFile) {
      setError('Selecciona una imagen para el trabajo.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('projectUrl', projectUrl.trim());
      if (order) {
        formData.append('order', order);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const endpoint = isEdit ? `/api/works/${work.id}` : '/api/works';
      const method = isEdit ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo guardar el trabajo.');
      }
      onSubmit(data.work, isEdit ? 'edit' : 'create');
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !work?.id) return;
    if (!window.confirm(`¿Eliminar "${work.title}"?`)) return;
    setError('');
    try {
      setDeleting(true);
      const response = await fetch(`/api/works/${work.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo eliminar el trabajo.');
      }
      onDelete(work.id);
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex">
      <button
        type="button"
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} z-0`}
        onClick={onClose}
        aria-label="Cerrar creador de trabajos"
      />
      <aside
        className={`relative z-10 ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-500 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar trabajo' : 'Crear trabajo'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-800"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nombre del proyecto"
              disabled={submitting || deleting}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Resumen breve del trabajo realizado"
              disabled={submitting || deleting}
            />
            <p className="text-xs text-gray-400">
              Se mostrará con puntos suspensivos y un tooltip al superar {DESCRIPTION_LIMIT} caracteres.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">URL del proyecto</label>
            <input
              type="url"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={projectUrl}
              onChange={(event) => setProjectUrl(event.target.value)}
              placeholder="https://"
              disabled={submitting || deleting}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Orden (opcional)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              placeholder="0"
              disabled={submitting || deleting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Imagen</label>
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={title || 'Vista previa'}
                  className="h-36 w-full rounded-lg object-cover"
                />
              ) : (
                <ImagePlus size={48} className="text-gray-400" />
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
                <span>Formatos: JPG, PNG, WEBP</span>
                <span>Máx: 6 MB</span>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Seleccionar archivo
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={submitting || deleting}
                />
              </label>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                disabled={deleting || submitting}
              >
                {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                Eliminar
              </button>
            ) : (
              <span className="text-xs text-gray-400">La imagen se subirá a Cloudinary.</span>
            )}
            <div className="flex flex-1 justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                disabled={submitting || deleting}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : isEdit ? (
                  <Pencil size={16} />
                ) : (
                  <Plus size={16} />
                )}
                {isEdit ? 'Guardar cambios' : 'Crear trabajo'}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function WorksShowcase() {
  const [works, setWorks] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '', message: '' });
  const [user, setUser] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isSuperAdmin = useMemo(() => {
    if (!user?.email) return false;
    return user.role === 'admin' && user.email.toLowerCase() === SUPER_ADMIN_EMAIL;
  }, [user]);

  const isSlider = works.length > 4;
  const maxIndex = Math.max(0, works.length - itemsPerView);

  const loadWorks = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const response = await fetch('/api/works', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'No se pudieron obtener los trabajos.');
      }
      const works = Array.isArray(data?.works) ? data.works : [];
      setWorks(sortWorks(works));
      setStatus({ loading: false, error: '', message: '' });
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Error inesperado.', message: '' });
    }
  }, []);

  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!isSlider) {
      setCurrentIndex(0);
      return;
    }
    const updateItems = () => {
      const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
      const next = computeItemsPerView(width);
      const capped = Math.min(next, works.length);
      setItemsPerView(capped || 1);
      setCurrentIndex((prev) => Math.min(prev, Math.max(0, works.length - (capped || 1))));
    };
    updateItems();
    window.addEventListener('resize', updateItems);
    return () => window.removeEventListener('resize', updateItems);
  }, [isSlider, works.length]);

  useEffect(() => {
    if (!isSlider) {
      const width = typeof window === 'undefined' ? 1280 : window.innerWidth;
      setItemsPerView(Math.min(computeItemsPerView(width), Math.max(works.length, 1)));
    }
  }, [isSlider, works.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const handleOpenCreate = () => {
    setEditingWork(null);
    setPanelOpen(true);
  };

  const handleCardEdit = (work) => {
    setEditingWork(work);
    setPanelOpen(true);
  };

  const handleCardDelete = async (work) => {
    if (!isSuperAdmin) return;
    if (!window.confirm(`¿Eliminar "${work.title}"?`)) return;
    try {
      const response = await fetch(`/api/works/${work.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo eliminar el trabajo.');
      }
      setWorks((prev) => prev.filter((item) => item.id !== work.id));
      setStatus({ loading: false, error: '', message: 'Trabajo eliminado.' });
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Error inesperado.', message: '' });
    }
  };

  const handlePanelSubmit = (work, action) => {
    setPanelOpen(false);
    setEditingWork(null);
    setStatus({
      loading: false,
      error: '',
      message: action === 'edit' ? 'Trabajo actualizado.' : 'Trabajo creado.',
    });
    setWorks((prev) => {
      if (action === 'edit') {
        const updated = prev.map((item) => (item.id === work.id ? work : item));
        return sortWorks(updated);
      }
      return sortWorks([work, ...prev]);
    });
  };

  const handlePanelDelete = (id) => {
    setPanelOpen(false);
    setEditingWork(null);
    setWorks((prev) => prev.filter((item) => item.id !== id));
    setStatus({ loading: false, error: '', message: 'Trabajo eliminado.' });
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingWork(null);
  };

  const renderContent = () => {
    if (status.loading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-2xl border border-gray-200 bg-gray-50 p-6"
            >
              <div className="mb-4 h-40 w-full rounded-xl bg-gray-200" />
              <div className="mb-2 h-4 w-3/5 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-4/5 rounded bg-gray-200" />
              <div className="h-4 w-2/5 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      );
    }

    if (status.error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.error}
        </div>
      );
    }

    if (works.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
          No hay trabajos cargados todavía.
        </div>
      );
    }

    if (!isSlider) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {works.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              isSuperAdmin={isSuperAdmin}
              onEdit={handleCardEdit}
              onDelete={handleCardDelete}
            />
          ))}
        </div>
      );
    }

    const translatePercent = (currentIndex * 100) / itemsPerView;

    return (
      <div className="relative">
        <div className="-mx-3 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${translatePercent}%)` }}
          >
            {works.map((work) => (
              <div
                key={work.id}
                className="w-full px-3"
                style={{ flex: `0 0 calc(100% / ${itemsPerView})` }}
              >
                <WorkCard
                  work={work}
                  isSuperAdmin={isSuperAdmin}
                  onEdit={handleCardEdit}
                  onDelete={handleCardDelete}
                />
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute -left-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 md:flex"
          aria-label="Anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          className="absolute -right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 md:flex"
          aria-label="Siguiente"
        >
          <ChevronRight size={18} />
        </button>
        <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm disabled:opacity-40"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm disabled:opacity-40"
            aria-label="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="py-12">
      <div className="container">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-3xl font-bold text-gray-900">Trabajos realizados</h3>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500"
            >
              <Plus size={16} />
              Crear trabajos
            </button>
          )}
        </div>
        {status.message && !status.loading && !status.error && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {status.message}
          </div>
        )}
        {renderContent()}
      </div>
      {isSuperAdmin && (
        <WorkPanel
          open={panelOpen}
          work={panelOpen ? editingWork : null}
          onClose={closePanel}
          onSubmit={handlePanelSubmit}
          onDelete={handlePanelDelete}
        />
      )}
    </section>
  );
}
