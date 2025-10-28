'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';
import IconRenderer from '@/components/IconRenderer';
import IconPicker from '@/components/admin/IconPicker';
import { ICON_LIBRARY, filterIconOptions } from '@/lib/icons';
import { DEFAULT_HERO } from '@/lib/hero-defaults';

const MIN_HEIGHT = 40;
const MAX_HEIGHT = 120;

function createEmptySlide() {
  return {
    id: crypto.randomUUID(),
    imageUrl: '',
  };
}

function createEmptyButton() {
  return {
    id: crypto.randomUUID(),
    label: '',
    href: '',
    icon: '',
    visible: true,
  };
}

export default function HeroManager({ initialHero }) {
  const [hero, setHero] = useState(() => ({
    ...DEFAULT_HERO,
    ...(initialHero || {}),
  }));
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [uploadingSlideId, setUploadingSlideId] = useState('');
  const [pendingSlideId, setPendingSlideId] = useState('');
  const slideFileInputRef = useRef(null);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const heroImageInputRef = useRef(null);
  const [iconPickerTarget, setIconPickerTarget] = useState(null);

  const slides = hero.slides || [];
  const buttons = hero.buttons || [];

  const normalizedButtons = useMemo(() => {
    if (!buttons.length) {
      return DEFAULT_HERO.buttons.map((button) => ({ ...button, id: crypto.randomUUID() }));
    }
    return buttons;
  }, [buttons]);

  const openIconPicker = (target) => {
    setIconPickerTarget(target);
  };

  const closeIconPicker = () => setIconPickerTarget(null);

  const handleIconSelect = (iconValue) => {
    if (!iconPickerTarget) return;
    if (iconPickerTarget.type === 'button') {
      const buttonId = iconPickerTarget.id;
      setHero((prev) => ({
        ...prev,
        buttons: prev.buttons.map((button) =>
          button.id === buttonId ? { ...button, icon: iconValue } : button,
        ),
      }));
    }
    closeIconPicker();
  };

  const toggleHeroVisibility = () => {
    setHero((prev) => ({ ...prev, visible: !prev.visible }));
  };

  const updateHeroField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setHero((prev) => ({ ...prev, [field]: value }));
  };

  const updateTextBlock = (key, field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setHero((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const addSlide = () => {
    setHero((prev) => ({
      ...prev,
      slides: [...(prev.slides || []), createEmptySlide()],
    }));
  };

  const updateSlideField = (slideId, field, value) => {
    setHero((prev) => ({
      ...prev,
      slides: (prev.slides || []).map((slide) =>
        slide.id === slideId ? { ...slide, [field]: value } : slide,
      ),
    }));
  };

  const removeSlide = (slideId) => {
    setHero((prev) => ({
      ...prev,
      slides: (prev.slides || []).filter((slide) => slide.id !== slideId),
    }));
  };

  const moveSlide = (slideId, direction) => {
    setHero((prev) => {
      const currentSlides = prev.slides || [];
      const index = currentSlides.findIndex((slide) => slide.id === slideId);
      if (index === -1) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= currentSlides.length) return prev;
      const nextSlides = currentSlides.slice();
      const [item] = nextSlides.splice(index, 1);
      nextSlides.splice(nextIndex, 0, item);
      return { ...prev, slides: nextSlides };
    });
  };

  const requestSlideUpload = (slideId) => {
    setPendingSlideId(slideId);
    const input = slideFileInputRef.current;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const requestHeroImageUpload = () => {
    const input = heroImageInputRef.current;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleHeroImageFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setHeroImageUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/uploads/content', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.message || 'No se pudo subir la imagen destacada.');
      }
      setHero((prev) => ({ ...prev, heroImage: data.url }));
    } catch (err) {
      const message = err.message || 'No se pudo subir la imagen destacada.';
      setFormError(message);
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } finally {
      setHeroImageUploading(false);
    }
  };

  const handleSlideFileChange = async (event) => {
    const file = event.target.files?.[0];
    const targetId = pendingSlideId;
    if (!file || !targetId) return;
    setUploadingSlideId(targetId);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/uploads/content', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.message || 'No se pudo subir la imagen.');
      }
      updateSlideField(targetId, 'imageUrl', data.url);
    } catch (err) {
      const message = err.message || 'No se pudo subir la imagen.';
      setFormError(message);
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } finally {
      setUploadingSlideId('');
      setPendingSlideId('');
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const addButton = () => {
    setHero((prev) => ({
      ...prev,
      buttons: [...(prev.buttons || []), createEmptyButton()],
    }));
  };

  const updateButtonField = (buttonId, field, value) => {
    setHero((prev) => ({
      ...prev,
      buttons: (prev.buttons || []).map((button) =>
        button.id === buttonId ? { ...button, [field]: value } : button,
      ),
    }));
  };

  const removeButton = (buttonId) => {
    setHero((prev) => ({
      ...prev,
      buttons: (prev.buttons || []).filter((button) => button.id !== buttonId),
    }));
  };

  const moveButton = (buttonId, direction) => {
    setHero((prev) => {
      const currentButtons = prev.buttons || [];
      const index = currentButtons.findIndex((button) => button.id === buttonId);
      if (index === -1) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= currentButtons.length) return prev;
      const nextButtons = currentButtons.slice();
      const [item] = nextButtons.splice(index, 1);
      nextButtons.splice(nextIndex, 0, item);
      return { ...prev, buttons: nextButtons };
    });
  };

  const handleResetHero = () => {
    setHero({ ...DEFAULT_HERO });
    setFormError('');
    setStatusMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    setStatusMessage('');
    const payload = {
      visible: hero.visible,
      height: Number(hero.height) || DEFAULT_HERO.height,
      title: {
        text: hero.title?.text || '',
        visible: hero.title?.visible !== false,
      },
      subtitle: {
        text: hero.subtitle?.text || '',
        visible: hero.subtitle?.visible !== false,
      },
      heroImage: hero.heroImage || '',
      slides: (hero.slides || []).map((slide, index) => ({
        id: slide.id || crypto.randomUUID(),
        imageUrl: slide.imageUrl || '',
        order: index,
      })),
      buttons: normalizedButtons.map((button, index) => ({
        id: button.id || crypto.randomUUID(),
        label: button.label || '',
        href: button.href || '',
        icon: button.icon || '',
        visible: button.visible !== false,
        order: index,
      })),
    };

    if (payload.visible && payload.slides.filter((slide) => slide.imageUrl.trim()).length === 0) {
      setFormError('Agrega al menos una imagen para el slider.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || 'No se pudo guardar la configuracion.');
      }
      setHero(data.hero);
      setStatusMessage('Configuracion guardada correctamente.');
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar la configuracion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Hero del inicio</h1>
          <p className="text-sm text-slate-600">
            Controla el slider principal de la pagina de inicio, las imagenes y los botones de llamada a la
            accion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetHero}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Restaurar por defecto
          </button>
          <button
            type="button"
            onClick={toggleHeroVisibility}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              hero.visible ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
            }`}
          >
            {hero.visible ? (
              <>
                <Eye size={16} /> Slider visible
              </>
            ) : (
              <>
                <EyeOff size={16} /> Slider oculto
              </>
            )}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Guardar cambios
          </button>
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ajustes generales</h2>
            <p className="text-xs text-slate-500">Configura la altura y los textos principales del slider.</p>
          </div>
          <div className="text-xs text-slate-500">Altura actual: {hero.height || DEFAULT_HERO.height}vh</div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Altura del slider (vh)</span>
            <input
              type="number"
              min={MIN_HEIGHT}
              max={MAX_HEIGHT}
              value={hero.height ?? DEFAULT_HERO.height}
              onChange={(event) => {
                const value = Math.min(Math.max(Number(event.target.value) || DEFAULT_HERO.height, MIN_HEIGHT), MAX_HEIGHT);
                setHero((prev) => ({ ...prev, height: value }));
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400">Entre {MIN_HEIGHT} y {MAX_HEIGHT}.</p>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Imagen destacada (opcional)</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={hero.heroImage || ''}
                onChange={(event) => setHero((prev) => ({ ...prev, heroImage: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="/hero.jpg"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={requestHeroImageUpload}
                  disabled={heroImageUploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
                >
                  {heroImageUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  {heroImageUploading ? 'Subiendo...' : 'Subir imagen'}
                </button>
                {hero.heroImage ? (
                  <a
                    href={hero.heroImage}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <LinkIcon size={12} /> Ver
                  </a>
                ) : null}
              </div>
            </div>
            <input
              ref={heroImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleHeroImageFile}
            />
            <p className="text-xs text-slate-400">
              Esta imagen se muestra detras del titular cuando no hay slider de fondo.
            </p>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Titulo principal</span>
              <input
                type="text"
                value={hero.title?.text || ''}
                onChange={updateTextBlock('title', 'text')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={hero.title?.visible !== false}
                onChange={updateTextBlock('title', 'visible')}
                className="rounded border-slate-300"
              />
              Mostrar titulo en el slider
            </label>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Descripcion</span>
              <textarea
                value={hero.subtitle?.text || ''}
                onChange={updateTextBlock('subtitle', 'text')}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={hero.subtitle?.visible !== false}
                onChange={updateTextBlock('subtitle', 'visible')}
                className="rounded border-slate-300"
              />
              Mostrar descripcion
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Imagenes del slider</h2>
            <p className="text-xs text-slate-500">Sube todas las imagenes que deseas mostrar en el carrusel.</p>
          </div>
          <button
            type="button"
            onClick={addSlide}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <Plus size={14} /> Agregar imagen
          </button>
        </header>

        {(!slides || slides.length === 0) && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Aun no has agregado imagenes. Agrega al menos una para que el slider se muestre.
          </div>
        )}

        <div className="space-y-3">
          {(slides || []).map((slide, index) => (
            <div key={slide.id} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr,auto]">
              <div className="space-y-2">
                <label className="space-y-1 text-xs font-medium text-slate-700">
                  URL de la imagen
                  <input
                    type="text"
                    value={slide.imageUrl}
                    onChange={(event) => updateSlideField(slide.id, 'imageUrl', event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => requestSlideUpload(slide.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                  >
                    {uploadingSlideId === slide.id ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Subiendo...
                      </>
                    ) : (
                      <>
                        <ImageIcon size={14} /> Subir imagen
                      </>
                    )}
                  </button>
                  {slide.imageUrl && (
                    <a
                      href={slide.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      <LinkIcon size={12} /> Ver
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => moveSlide(slide.id, -1)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
                    disabled={index === 0}
                  >
                    <ArrowUp size={12} /> Subir
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(slide.id, 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
                    disabled={index === slides.length - 1}
                  >
                    <ArrowDown size={12} /> Bajar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(slide.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={12} /> Quitar
                  </button>
                </div>
                <div className="h-28 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt={`slide-${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">Sin imagen</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <input
          ref={slideFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSlideFileChange}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Botones de llamada a la accion</h2>
            <p className="text-xs text-slate-500">Personaliza los botones que aparecen sobre el slider.</p>
          </div>
          <button
            type="button"
            onClick={addButton}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <Plus size={14} /> Agregar boton
          </button>
        </header>

        <div className="space-y-3">
          {normalizedButtons.map((button, index) => (
            <div key={button.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-indigo-600">
                    <IconRenderer name={button.icon} size={16} />
                  </span>
                  <span>
                    Boton {index + 1}{' '}
                    {button.visible === false ? <span className="ml-1 text-rose-500">(oculto)</span> : null}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openIconPicker({ type: 'button', id: button.id })}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Elegir icono
                  </button>
                  <button
                    type="button"
                    onClick={() => moveButton(button.id, -1)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
                    disabled={index === 0}
                  >
                    <ArrowUp size={12} /> Subir
                  </button>
                  <button
                    type="button"
                    onClick={() => moveButton(button.id, 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
                    disabled={index === normalizedButtons.length - 1}
                  >
                    <ArrowDown size={12} /> Bajar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeButton(button.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={12} /> Quitar
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-slate-700">
                  Texto del boton
                  <input
                    type="text"
                    value={button.label}
                    onChange={(event) => updateButtonField(button.id, 'label', event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-700">
                  Enlace
                  <input
                    type="text"
                    value={button.href}
                    onChange={(event) => updateButtonField(button.id, 'href', event.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="/contact"
                  />
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-700">
                  Icono (opcional)
                  <div className="flex items-center gap-2">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-indigo-600">
                      <IconRenderer name={button.icon} size={16} />
                    </div>
                    <button
                      type="button"
                      onClick={() => openIconPicker({ type: 'button', id: button.id })}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Seleccionar icono
                    </button>
                    {button.icon ? (
                      <button
                        type="button"
                        onClick={() => updateButtonField(button.id, 'icon', '')}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={button.visible !== false}
                    onChange={(event) => updateButtonField(button.id, 'visible', event.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Mostrar boton
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {(formError || statusMessage) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            formError
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {formError || statusMessage}
        </div>
      )}

      <IconPicker
        open={Boolean(iconPickerTarget)}
        onClose={closeIconPicker}
        onSelect={handleIconSelect}
        currentValue={
          iconPickerTarget?.type === 'button'
            ? normalizedButtons.find((btn) => btn.id === iconPickerTarget.id)?.icon || ''
            : ''
        }
        title="Seleccionar icono para el boton"
      />
    </div>
  );
}
