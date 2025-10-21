'use client';
import { Loader2, Pencil, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const EMPTY_FORM = {
  title: '',
  summary: '',
  description: '',
  category: '',
  price: '',
  order: '',
  active: true,
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

export default function ServicesManager() {
  // keep future extension, ensures component rendered inside provider
  const [services, setServices] = useState([]);
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

  const loadServices = async () => {
    try {
      setFetching(true);
      setError('');
      const res = await fetch('/api/admin/services', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo cargar los servicios.');
      }
      setServices(Array.isArray(data.services) ? data.services : []);
    } catch (err) {
      setError(err.message || 'Error inesperado.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (!imageFile) return undefined;
    const previewUrl = imagePreview;
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [imageFile, imagePreview]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return services;
    return services.filter((service) => {
      return (
        service.title.toLowerCase().includes(term) ||
        service.summary.toLowerCase().includes(term) ||
        (service.category || '').toLowerCase().includes(term)
      );
    });
  }, [services, search]);

  const openCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (service) => {
    setFormMode('edit');
    setEditingId(service.id);
    setFormData({
      title: service.title || '',
      summary: service.summary || '',
      description: service.description || '',
      category: service.category || '',
      price: service.price ?? '',
      order: service.order ?? '',
      active: service.active !== false,
    });
    setImageFile(null);
    setImagePreview(service.imageUrl || '');
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
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormError('');

    if (file && file.size > 0) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImageFile(null);
      if (formMode === 'edit') {
        setImagePreview((prev) => prev);
      } else {
        setImagePreview('');
      }
    }
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const trimmedTitle = formData.title.trim();
      const trimmedSummary = formData.summary.trim();
      if (!trimmedTitle) {
        throw new Error('El titulo es obligatorio.');
      }
      if (trimmedSummary.length < 10) {
        throw new Error('El resumen debe tener al menos 10 caracteres.');
      }
      if (formMode === 'create' && !imageFile) {
        throw new Error('Selecciona una imagen para el servicio.');
      }

      const payload = new FormData();
      payload.set('title', trimmedTitle);
      payload.set('summary', trimmedSummary);
      payload.set('description', formData.description.trim());
      payload.set('category', formData.category.trim());
      payload.set('price', formData.price === '' ? '' : String(formData.price));
      payload.set('order', formData.order === '' ? '' : String(formData.order));
      payload.set('active', formData.active ? 'true' : 'false');
      if (imageFile) {
        payload.set('image', imageFile);
      }

      const endpoint =
        formMode === 'create'
          ? '/api/admin/services'
          : `/api/admin/services/${editingId}`;
      const method = formMode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, {
        method,
        body: payload,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo guardar el servicio.');
      }

      closeDialog();
      await loadServices();
    } catch (err) {
      setFormError(err.message || 'Error al guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service) => {
    const confirmed = window.confirm(`Seguro que deseas eliminar "${service.title}"?`);
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo eliminar el servicio.');
      }
      await loadServices();
    } catch (err) {
      setError(err.message || 'Error al eliminar.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Servicios</h1>
          <p className="text-sm text-slate-600">
            Mantiene actualizado el catalogo que se muestra en el sitio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadServices}
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
            Nuevo servicio
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">Total: {services.length}</span>
        <div className="w-full sm:w-64">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar servicios..."
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
              <th className="px-4 py-3 text-left font-medium">Categoria</th>
              <th className="px-4 py-3 text-left font-medium">Precio</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fetching ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Cargando servicios...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay servicios registrados.
                </td>
              </tr>
            ) : (
              filtered.map((service) => (
                <tr key={service.id}>
                  <td className="px-4 py-3">
                    <div className="h-14 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.title}
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
                    <div className="flex flex-col">
                      <span>{service.title}</span>
                      <span className="text-xs text-slate-500">{service.summary}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{service.category || 'Sin categoria'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {service.price === null || service.price === undefined
                      ? 'No definido'
                      : `$${Number(service.price).toLocaleString('es-CL')}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        service.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {service.active ? 'Publicado' : 'Oculto'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service)}
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
        title={formMode === 'create' ? 'Nuevo servicio' : 'Editar servicio'}
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
              <span className="font-medium text-slate-700">Categoria</span>
              <input
                type="text"
                value={formData.category}
                onChange={handleChange('category')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Resumen</span>
              <textarea
                required
                value={formData.summary}
                onChange={handleChange('summary')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={2}
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Descripcion</span>
              <textarea
                value={formData.description}
                onChange={handleChange('description')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={4}
              />
            </label>
            <div className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Imagen del servicio</span>
              <div className="flex items-center gap-4">
                <div className="h-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                    onChange={handleImageChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Formatos admitidos: JPG, PNG, WEBP, GIF. Maximo 6 MB.
                  </p>
                  {formMode === 'edit' && !imageFile && (
                    <p className="text-xs text-slate-500">
                      Si no seleccionas una imagen nueva, se conservara la actual.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Precio estimado</span>
              <input
                type="number"
                min={0}
                value={formData.price}
                onChange={handleChange('price')}
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
          </div>

          <button
            type="button"
            onClick={handleToggleActive}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {formData.active ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
            {formData.active ? 'Publicado' : 'Oculto'}
          </button>

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
              {formMode === 'create' ? 'Crear servicio' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}



