'use client';

import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const EMPTY_FORM = {
  title: '',
  description: '',
  projectUrl: '',
  order: '',
};

function Dialog({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export default function WorksManager() {
  const [works, setWorks] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');

  const loadWorks = async () => {
    try {
      setFetching(true);
      setError('');
      const res = await fetch('/api/works', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo cargar los trabajos.');
      }
      setWorks(Array.isArray(data.works) ? data.works : []);
    } catch (err) {
      setError(err.message || 'Error inesperado.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadWorks();
  }, []);

  useEffect(() => {
    if (!imageFile) return;
    const previewUrl = imagePreview;
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [imageFile, imagePreview]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return works;
    return works.filter((work) => {
      return (
        work.title.toLowerCase().includes(term) ||
        work.description.toLowerCase().includes(term)
      );
    });
  }, [works, search]);

  const openCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (work) => {
    setFormMode('edit');
    setEditingId(work.id);
    setFormData({
      title: work.title || '',
      description: work.description || '',
      projectUrl: work.projectUrl || '',
      order: work.order ?? '',
    });
    setImageFile(null);
    setImagePreview(work.imageUrl || '');
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormError('');

    if (file && file.size > 0) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImageFile(null);
      if (formMode !== 'edit') {
        setImagePreview('');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = new FormData();
      payload.set('title', formData.title.trim());
      payload.set('description', formData.description.trim());
      payload.set('projectUrl', formData.projectUrl.trim());
      payload.set('order', formData.order === '' ? '' : String(formData.order));

      if (formMode === 'create' && !imageFile) {
        throw new Error('Selecciona una imagen para el trabajo.');
      }
      if (imageFile) {
        payload.set('image', imageFile);
      }

      const endpoint =
        formMode === 'create' ? '/api/works' : `/api/works/${editingId}`;
      const method = formMode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, { method, body: payload });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo guardar el trabajo.');
      }

      closeDialog();
      await loadWorks();
    } catch (err) {
      setFormError(err.message || 'Error al guardar el trabajo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (work) => {
    const confirmed = window.confirm(`Seguro que deseas eliminar "${work.title}"?`);
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/works/${work.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo eliminar el trabajo.');
      }
      await loadWorks();
    } catch (err) {
      setError(err.message || 'Error al eliminar.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Trabajos</h1>
          <p className="text-sm text-slate-600">Administra el portafolio mostrado en la web.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadWorks}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={16} />
            Nuevo trabajo
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">Total: {works.length}</span>
        <div className="w-full sm:w-64">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar trabajos..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Imagen</th>
              <th className="px-4 py-3 text-left font-medium">Titulo</th>
              <th className="px-4 py-3 text-left font-medium">Proyecto</th>
              <th className="px-4 py-3 text-left font-medium">Orden</th>
              <th className="px-4 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fetching ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Cargando trabajos...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No hay trabajos cargados.
                </td>
              </tr>
            ) : (
              filtered.map((work) => (
                <tr key={work.id}>
                  <td className="px-4 py-3">
                    <div className="h-14 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {work.imageUrl ? (
                        <img
                          src={work.imageUrl}
                          alt={work.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                          Sin imagen
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex flex-col gap-1">
                      <span>{work.title}</span>
                      <span className="text-xs text-slate-500 line-clamp-2">{work.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {work.projectUrl ? (
                      <a
                        href={work.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Ver proyecto
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{work.order ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(work)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(work)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={formMode === 'create' ? 'Nuevo trabajo' : 'Editar trabajo'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Titulo</span>
              <input
                required
                type="text"
                value={formData.title}
                onChange={handleChange('title')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Orden</span>
              <input
                type="number"
                value={formData.order}
                onChange={handleChange('order')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Descripcion</span>
              <textarea
                required
                value={formData.description}
                onChange={handleChange('description')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={4}
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">URL del proyecto (opcional)</span>
              <input
                type="url"
                value={formData.projectUrl}
                onChange={handleChange('projectUrl')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <div className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">
                Imagen {formMode === 'create' ? '(obligatoria)' : '(opcional para reemplazar)'}
              </span>
              <div className="flex items-center gap-4">
                <div className="h-24 w-36 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={formData.title || 'Vista previa'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Formatos permitidos: JPG, PNG, WEBP. Maximo 6 MB.
                  </p>
                  {formMode === 'edit' && !imageFile && (
                    <p className="text-xs text-slate-500">
                      Si no seleccionas una imagen nueva, se conservara la actual.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              {formMode === 'create' ? 'Crear trabajo' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}









