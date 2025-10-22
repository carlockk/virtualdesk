'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_BRAND = {
  name: 'VirtualDesk',
  logoUrl: '/virt.jpg',
  updatedAt: null,
};

export default function BrandPage() {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });

  useEffect(() => {
    let active = true;
    fetch('/api/admin/brand', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const fetched = data?.brand || DEFAULT_BRAND;
        setBrand(fetched);
        setName(fetched.name || '');
        setPreview(fetched.logoUrl || '');
      })
      .catch((err) => {
        if (!active) return;
        setStatus((prev) => ({ ...prev, error: err.message || 'No se pudo cargar la marca.' }));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const initials = useMemo(() => {
    const source = name || brand.name || DEFAULT_BRAND.name;
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'VD';
  }, [name, brand.name]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setLogoFile(file);
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(brand.logoUrl || '');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, message: '', error: '' });
    try {
      const form = new FormData();
      form.set('name', name.trim());
      if (logoFile) {
        form.set('logo', logoFile);
      }

      const res = await fetch('/api/admin/brand', {
        method: 'PATCH',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo actualizar la marca.');
      }

      const updated = data.brand || DEFAULT_BRAND;
      setBrand(updated);
      setName(updated.name || '');
      setPreview(updated.logoUrl || '');
      setLogoFile(null);
      setStatus({ loading: false, message: 'Marca actualizada correctamente.', error: '' });
    } catch (err) {
      setStatus({ loading: false, message: '', error: err.message || 'Error inesperado.' });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Identidad de marca</h1>
        <p className="text-sm text-slate-600">
          Actualiza el nombre y el logotipo que se muestran tanto en el panel administrativo como en el sitio web.
        </p>
      </header>

      {status.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.error}
        </div>
      )}
      {status.message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[1fr,1fr]">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Nombre de la marca
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                maxLength={80}
                required
              />
            </label>
            <p className="text-xs text-slate-500">
              Este texto se muestra en el panel administrativo y puede reutilizarse en distintas secciones del sitio.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Logotipo</p>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                {preview ? (
                  <img src={preview} alt="Vista previa del logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-indigo-600">{initials}</span>
                )}
              </div>
              <div className="flex-1 text-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Formatos admitidos: JPG, PNG, WEBP o GIF. Tamano maximo 5 MB.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setName(brand.name || '');
              setPreview(brand.logoUrl || '');
              setLogoFile(null);
              setStatus({ loading: false, message: '', error: '' });
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            disabled={status.loading}
          >
            Restablecer
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            disabled={status.loading}
          >
            {status.loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Vista previa actual</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-indigo-600">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{brand.name}</p>
            <p className="text-xs text-slate-500">
              Actualizado {brand.updatedAt ? new Date(brand.updatedAt).toLocaleString() : 'recientemente'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


