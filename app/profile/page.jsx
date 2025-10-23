'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuthPanel } from '@/components/AuthPanelProvider';
import { Eye, EyeOff } from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  email: '',
  personType: 'natural',
  phone: '',
  address: '',
  rut: '',
  businessName: '',
};

const PASSWORD_INITIAL = {
  password: '',
  confirmPassword: '',
};

export default function ProfilePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ loading: true, saving: false, message: '', error: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarStatus, setAvatarStatus] = useState({ uploading: false, message: '', error: '' });
  const [passwordForm, setPasswordForm] = useState(PASSWORD_INITIAL);
  const [passwordStatus, setPasswordStatus] = useState({ saving: false, message: '', error: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);
  const fileInputRef = useRef(null);
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
          setAvatarUrl(data.user.avatarUrl || '');
          setAvatarStatus({ uploading: false, message: '', error: '' });
          setStatus({ loading: false, saving: false, message: '', error: '' });
          setPasswordForm({ ...PASSWORD_INITIAL });
          setPasswordStatus({ saving: false, message: '', error: '' });
          setPasswordVisible(false);
          setPasswordConfirmVisible(false);
        } else {
          setForm({ ...INITIAL_FORM });
          setAvatarUrl('');
          setAvatarStatus({ uploading: false, message: '', error: '' });
          setStatus({
            loading: false,
            saving: false,
            message: '',
            error: 'Necesitas iniciar sesion para ver tu perfil.',
          });
          setPasswordForm({ ...PASSWORD_INITIAL });
          setPasswordStatus({ saving: false, message: '', error: '' });
          setPasswordVisible(false);
          setPasswordConfirmVisible(false);
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus({
          loading: false,
          saving: false,
          message: '',
          error: 'No se pudo cargar tu perfil. Intenta nuevamente.',
        });
        setPasswordStatus({ saving: false, message: '', error: '' });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordFieldChange = (field) => (event) => {
    const value = event.target.value;
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordStatus.saving) return;

    const password = passwordForm.password.trim();
    const confirm = passwordForm.confirmPassword.trim();

    if (password.length < 6) {
      setPasswordStatus({
        saving: false,
        message: '',
        error: 'La contrasena debe tener al menos 6 caracteres.',
      });
      return;
    }

    if (password !== confirm) {
      setPasswordStatus({
        saving: false,
        message: '',
        error: 'Las contrasenas no coinciden.',
      });
      return;
    }

    setPasswordStatus({ saving: true, message: '', error: '' });

    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No pudimos actualizar tu contrasena.');
      }

      setPasswordStatus({
        saving: false,
        message: data?.message || 'Listo, actualizamos tu contrasena.',
        error: '',
      });
      setPasswordForm({ ...PASSWORD_INITIAL });
      setPasswordVisible(false);
      setPasswordConfirmVisible(false);
    } catch (err) {
      setPasswordStatus({
        saving: false,
        message: '',
        error: err.message || 'No pudimos actualizar tu contrasena.',
      });
    }
  };

  const triggerAvatarUpload = () => {
    if (avatarStatus.uploading) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith('image/')) {
      setAvatarStatus({ uploading: false, message: '', error: 'Selecciona una imagen valida (PNG, JPG, WEBP o GIF).' });
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarStatus({ uploading: false, message: '', error: 'La imagen debe pesar menos de 5 MB.' });
      event.target.value = '';
      return;
    }

    setAvatarStatus({ uploading: true, message: '', error: '' });

    try {
      const payload = new FormData();
      payload.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: payload,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setAvatarStatus({
          uploading: false,
          message: '',
          error: data?.message || 'No se pudo actualizar la foto.',
        });
        return;
      }

      if (data.user) {
        setAvatarUrl(data.user.avatarUrl || '');
        setForm((prev) => ({
          ...prev,
          name: data.user.name || prev.name,
          email: data.user.email || prev.email,
          personType: data.user.personType || prev.personType,
          phone: data.user.phone || prev.phone,
          address: data.user.address || prev.address,
          rut: data.user.rut || prev.rut,
          businessName: data.user.businessName || prev.businessName,
        }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('virtualdesk:user-updated', { detail: { user: data.user } }));
        }
      }

      setAvatarStatus({
        uploading: false,
        message: 'Foto actualizada correctamente.',
        error: '',
      });
    } catch (err) {
      setAvatarStatus({
        uploading: false,
        message: '',
        error: err.message || 'Error inesperado al subir la imagen.',
      });
    } finally {
      event.target.value = '';
    }
  };

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
          error: data?.message || 'No se pudo guardar la informacion.',
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
            Iniciar sesion
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-10">
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-2xl font-semibold uppercase text-indigo-700 shadow-lg ring-4 ring-indigo-50">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <span>{(form.name || form.email || 'U').trim().charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">Sube una imagen cuadrada para que luzca mejor en todo el sitio.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={triggerAvatarUpload}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                disabled={avatarStatus.uploading}
              >
                {avatarStatus.uploading ? 'Subiendo...' : 'Cambiar foto'}
              </button>
              {avatarUrl && (
                <a
                  href={avatarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Ver actual
                </a>
              )}
            </div>
            {avatarStatus.error && <p className="mt-2 text-sm text-red-600">{avatarStatus.error}</p>}
            {avatarStatus.message && <p className="mt-2 text-sm text-green-600">{avatarStatus.message}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
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
          <label className="block text-sm font-medium text-gray-700">Correo electronico</label>
          <input
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
            value={form.email}
            disabled
          />
          <p className="mt-1 text-xs text-gray-500">Este correo esta asociado a tu cuenta y no puede modificarse.</p>
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
            <label className="block text-sm font-medium text-gray-700">Telefono</label>
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
          <label className="block text-sm font-medium text-gray-700">Razon social (si aplica)</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.businessName}
            onChange={handleChange('businessName')}
            placeholder="VirtualDesk SpA"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Direccion</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={form.address}
            onChange={handleChange('address')}
            rows={3}
            placeholder="Calle, numero, comuna, ciudad"
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

        <form
          onSubmit={handlePasswordSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cambiar contrasena</h2>
            <p className="mt-1 text-sm text-gray-600">
              Actualiza tu contrasena cuando lo necesites. Te enviaremos un mensaje si algo sale mal.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nueva contrasena</label>
              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={passwordForm.password}
                  onChange={handlePasswordFieldChange('password')}
                  placeholder="********"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={passwordStatus.saving}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((prev) => !prev)}
                  className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md px-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label={passwordVisible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  disabled={passwordStatus.saving}
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Repite tu contrasena</label>
              <div className="relative">
                <input
                  type={passwordConfirmVisible ? 'text' : 'password'}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFieldChange('confirmPassword')}
                  placeholder="********"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={passwordStatus.saving}
                />
                <button
                  type="button"
                  onClick={() => setPasswordConfirmVisible((prev) => !prev)}
                  className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md px-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label={passwordConfirmVisible ? 'Ocultar confirmacion' : 'Mostrar confirmacion'}
                  disabled={passwordStatus.saving}
                >
                  {passwordConfirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {passwordStatus.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {passwordStatus.error}
            </div>
          )}
          {passwordStatus.message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {passwordStatus.message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={passwordStatus.saving}
            >
              {passwordStatus.saving ? 'Actualizando...' : 'Actualizar contrasena'}
            </button>
          </div>
        </form>
      </div>
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
            Completa tu informacion para que podamos contactarte y preparar propuestas personalizadas. Ningun campo es obligatorio.
          </p>

          <div className="mt-8">{renderContent()}</div>
        </div>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de pagina...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
