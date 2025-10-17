'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuthPanel } from '@/components/AuthPanelProvider';

const INITIAL_FORM = {
  name: '',
  email: '',
  personType: 'natural',
  phone: '',
  address: '',
  rut: '',
  businessName: '',
};

const INITIAL_AVATAR = {
  url: '',
  preview: '',
  uploading: false,
  error: '',
};

export default function ProfilePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ loading: true, saving: false, message: '', error: '' });
  const [avatar, setAvatar] = useState(INITIAL_AVATAR);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const currentAvatarSource = avatar.preview || avatar.url;
  const { show } = useAuthPanel();

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.user) {
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
            personType: data.user.personType || 'natural',
            phone: data.user.phone || '',
            address: data.user.address || '',
            rut: data.user.rut || '',
            businessName: data.user.businessName || '',
          });
          setAvatar((prev) => {
            if (prev.preview) URL.revokeObjectURL(prev.preview);
            return { url: data.user.avatarUrl || '', preview: '', uploading: false, error: '' };
          });
          setStatus({ loading: false, saving: false, message: '', error: '' });
        } else {
          setAvatar({ ...INITIAL_AVATAR });
          setStatus({
            loading: false,
            saving: false,
            message: '',
            error: 'Necesitas iniciar sesión para ver tu perfil.',
          });
        }
      })
      .catch(() => {
        if (!active) return;
        setAvatar({ ...INITIAL_AVATAR });
        setStatus({
          loading: false,
          saving: false,
          message: '',
          error: 'No se pudo cargar tu perfil. Intenta nuevamente.',
        });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatar.preview) {
        URL.revokeObjectURL(avatar.preview);
      }
    };
  }, [avatar.preview]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || avatar.uploading) return;

    const previewUrl = URL.createObjectURL(file);
    setStatus((prev) => ({ ...prev, message: '', error: '' }));
    setAvatar((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return { url: prev.url, preview: previewUrl, uploading: true, error: '' };
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploads/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo subir la imagen.');
      }

      const user = data.user || {};
      setForm((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        personType: user.personType ?? prev.personType,
        phone: user.phone ?? prev.phone,
        address: user.address ?? prev.address,
        rut: user.rut ?? prev.rut,
        businessName: user.businessName ?? prev.businessName,
        email: user.email ?? prev.email,
      }));
      setAvatar({ url: user.avatarUrl || '', preview: '', uploading: false, error: '' });
      setAvatarModalOpen(false);
      setStatus((prev) => ({
        ...prev,
        saving: false,
        message: 'Foto de perfil actualizada.',
        error: '',
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('virtualdesk:user-updated', { detail: { user } }));
      }
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.';
      setAvatar((prev) => ({
        ...prev,
        preview: '',
        uploading: false,
        error: message,
      }));
      setStatus((prev) => ({
        ...prev,
        saving: false,
        message: '',
        error: message,
      }));
    } finally {
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [avatar.uploading]);

  const handleAvatarRemove = useCallback(async () => {
    if (avatar.uploading || (!avatar.url && !avatar.preview)) return;

    if (avatar.preview) {
      URL.revokeObjectURL(avatar.preview);
    }

    setAvatar((prev) => ({ ...prev, preview: '', uploading: true, error: '' }));
    setStatus((prev) => ({ ...prev, message: '', error: '' }));

    try {
      const res = await fetch('/api/uploads/avatar', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo eliminar la imagen.');
      }

      const user = data.user || {};
      setForm((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        personType: user.personType ?? prev.personType,
        phone: user.phone ?? prev.phone,
        address: user.address ?? prev.address,
        rut: user.rut ?? prev.rut,
        businessName: user.businessName ?? prev.businessName,
        email: user.email ?? prev.email,
      }));
      setAvatar({ ...INITIAL_AVATAR });
      setAvatarModalOpen(false);
      setStatus((prev) => ({
        ...prev,
        saving: false,
        message: 'Foto de perfil eliminada.',
        error: '',
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('virtualdesk:user-updated', { detail: { user } }));
      }
    } catch (removeError) {
      const message = removeError instanceof Error ? removeError.message : 'No se pudo eliminar la imagen.';
      setAvatar((prev) => ({
        ...prev,
        uploading: false,
        error: message,
      }));
      setStatus((prev) => ({
        ...prev,
        saving: false,
        message: '',
        error: message,
      }));
    }
  }, [avatar.preview, avatar.uploading, avatar.url]);

  const triggerAvatarPicker = useCallback(() => {
    if (avatar.uploading) return;
    fileInputRef.current?.click();
  }, [avatar.uploading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status.saving) return;
    setStatus((prev) => ({ ...prev, saving: true, message: '', error: '' }));

    try {
      const payload = {
        name: form.name,
        personType: form.personType,
        phone: form.phone,
        address: form.address,
        rut: form.rut,
        businessName: form.businessName,
      };

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setStatus({
          loading: false,
          saving: false,
          message: '',
          error: data?.message || 'No se pudo guardar la información.',
        });
        return;
      }

      const user = data.user;
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        personType: user.personType || prev.personType,
        phone: user.phone || '',
        address: user.address || '',
        rut: user.rut || '',
        businessName: user.businessName || '',
      }));
      setAvatar((prev) => {
        if (prev.preview) URL.revokeObjectURL(prev.preview);
        return { ...prev, url: user.avatarUrl || '', preview: '', uploading: false, error: '' };
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('virtualdesk:user-updated', { detail: { user } }));
      }
      setStatus({
        loading: false,
        saving: false,
        message: 'Perfil actualizado correctamente.',
        error: '',
      });
    } catch (err) {
      setStatus({
        loading: false,
        saving: false,
        message: '',
        error: err.message || 'Error inesperado al guardar.',
      });
    }
  };

  const renderContent = () => {
    if (status.loading) {
      return <p className="text-gray-600">Cargando perfil...</p>;
    }

    if (status.error && !form.email) {
      return (
        <div className="space-y-4">
          <p className="text-gray-700">{status.error}</p>
          <button
            onClick={() => show('login')}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            Iniciar sesión
          </button>
        </div>
      );
    }

    const baseLabel = (form.name || form.email || '').trim();
    const avatarInitial = baseLabel ? baseLabel.charAt(0).toUpperCase() : 'U';
    const avatarSource = avatar.preview || avatar.url;

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        <div>
          <h2 className="text-lg font-medium text-gray-900">Foto de perfil</h2>
          <p className="mt-1 text-sm text-gray-500">Sube una imagen cuadrada para mostrarla en tu perfil y mensajes.</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => avatarSource && setAvatarModalOpen(true)}
                className="group relative h-32 w-32 overflow-hidden rounded-full border border-gray-200 bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {avatarSource ? (
                  <img
                    src={avatarSource}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-200 to-indigo-400 text-3xl font-semibold text-indigo-800">
                    {avatarInitial}
                  </div>
                )}
                {avatar.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-medium text-gray-700">
                    Subiendo...
                  </div>
                )}
              </button>
              {avatarSource ? (
                <span className="text-xs text-gray-400">Haz click para ampliar</span>
              ) : (
                <span className="text-xs text-gray-400">Aun no tienes foto de perfil</span>
              )}
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2">
              <button
                type="button"
                onClick={triggerAvatarPicker}
                disabled={avatar.uploading}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {avatar.uploading ? 'Subiendo...' : avatar.url ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {(avatar.url || avatar.preview) && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={avatar.uploading}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Quitar foto
                </button>
              )}
              <p className="text-xs text-gray-500">Formatos PNG o JPG hasta 5MB.</p>
            </div>
          </div>
          {avatar.error && <p className="mt-2 text-sm text-red-600">{avatar.error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.name}
            onChange={handleChange('name')}
            required
            minLength={2}
            maxLength={80}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            value={form.email}
            disabled
          />
          <p className="mt-1 text-xs text-gray-500">Este correo está asociado a tu cuenta y no puede modificarse.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de persona</label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.personType}
            onChange={handleChange('personType')}
          >
            <option value="natural">Persona natural</option>
            <option value="empresa">Empresa</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="+56 9 1234 5678"
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">RUT</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={form.rut}
              onChange={handleChange('rut')}
              placeholder="11.111.111-1"
              maxLength={30}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Razón social (si aplica)</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.businessName}
            onChange={handleChange('businessName')}
            placeholder="VirtualDesk SpA"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.address}
            onChange={handleChange('address')}
            rows={3}
            placeholder="Calle, número, comuna, ciudad"
            maxLength={200}
          />
          <p className="mt-1 text-xs text-gray-500">Estos datos son opcionales, pero nos ayudan a preparar propuestas a medida.</p>
        </div>

        {status.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{status.error}</div>
        )}
        {status.message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{status.message}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status.saving}
          >
            {status.saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container flex-1 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-gray-900">Mi perfil</h1>
          <p className="mt-2 text-sm text-gray-500">
            Completa tu información para que podamos contactarte y preparar propuestas personalizadas. Ningún campo es obligatorio.
          </p>

          <div className="mt-8">{renderContent()}</div>
        </div>
      </section>

      {isAvatarModalOpen && currentAvatarSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setAvatarModalOpen(false)}
        >
          <div className="relative max-h-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white hover:bg-black/80"
              onClick={() => setAvatarModalOpen(false)}
            >
              Cerrar
            </button>
            <img
              src={currentAvatarSource}
              alt="Foto de perfil ampliada"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      )}

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de página...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
