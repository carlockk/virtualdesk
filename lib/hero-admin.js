import mongoose from 'mongoose';
import HeroSettings from '@/models/HeroSettings';
import { DEFAULT_HERO } from '@/lib/hero-defaults';

const DEFAULT_ID = 'default';

function ensureId(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : new mongoose.Types.ObjectId().toString();
}

export function serializeHero(doc) {
  if (!doc) return { ...DEFAULT_HERO };
  return {
    visible: doc.visible !== false,
    height: typeof doc.height === 'number' ? doc.height : DEFAULT_HERO.height,
    title: {
      text: doc.title?.text || DEFAULT_HERO.title.text,
      visible: doc.title?.visible !== false,
    },
    subtitle: {
      text: doc.subtitle?.text || DEFAULT_HERO.subtitle.text,
      visible: doc.subtitle?.visible !== false,
    },
    heroImage:
      typeof doc.heroImage === 'string'
        ? doc.heroImage
        : DEFAULT_HERO.heroImage || '',
    slides:
      Array.isArray(doc.slides) && doc.slides.length > 0
        ? doc.slides
            .map((slide, index) => ({
              id: slide.id || ensureId(),
              imageUrl: slide.imageUrl || '',
              order: typeof slide.order === 'number' ? slide.order : index,
            }))
            .filter((slide) => slide.imageUrl.trim())
            .sort((a, b) => a.order - b.order)
        : DEFAULT_HERO.slides,
    buttons:
      Array.isArray(doc.buttons) && doc.buttons.length > 0
        ? doc.buttons
            .map((button, index) => ({
              id: button.id || ensureId(),
              label: button.label || '',
              href: button.href || '#',
              icon: button.icon || '',
              visible: button.visible !== false,
              order: typeof button.order === 'number' ? button.order : index,
            }))
            .filter((button) => button.label.trim() && button.href.trim())
            .sort((a, b) => a.order - b.order)
        : DEFAULT_HERO.buttons,
  };
}

async function upsertDefaultHero() {
  await HeroSettings.findByIdAndUpdate(
    DEFAULT_ID,
    { $setOnInsert: DEFAULT_HERO },
    { new: true, upsert: true },
  );
}

export async function getHeroSettingsDocument() {
  const doc = await HeroSettings.findById(DEFAULT_ID).lean();
  if (doc) return doc;
  await upsertDefaultHero();
  return HeroSettings.findById(DEFAULT_ID).lean();
}

export async function getHeroSettingsForPublic() {
  const doc = await getHeroSettingsDocument();
  return serializeHero(doc);
}

export async function getHeroSettingsForAdmin() {
  const doc = await getHeroSettingsDocument();
  return serializeHero(doc);
}

export function normalizeHeroPayload(payload = {}) {
  const visible = payload.visible !== false;
  const height = Math.min(Math.max(Number(payload.height) || DEFAULT_HERO.height, 40), 120);

  const titleText = typeof payload.title?.text === 'string' ? payload.title.text : DEFAULT_HERO.title.text;
  const titleVisible =
    typeof payload.title?.visible === 'boolean' ? payload.title.visible : DEFAULT_HERO.title.visible;

  const subtitleText =
    typeof payload.subtitle?.text === 'string' ? payload.subtitle.text : DEFAULT_HERO.subtitle.text;
  const subtitleVisible =
    typeof payload.subtitle?.visible === 'boolean' ? payload.subtitle.visible : DEFAULT_HERO.subtitle.visible;

  const heroImage = typeof payload.heroImage === 'string' ? payload.heroImage.trim() : '';

  const slidesInput = Array.isArray(payload.slides) ? payload.slides : [];
  const slides = slidesInput
    .map((slide, index) => ({
      id: ensureId(slide.id),
      imageUrl: (slide.imageUrl || '').trim(),
      order: typeof slide.order === 'number' ? slide.order : index,
    }))
    .filter((slide) => slide.imageUrl);

  const buttonsInput = Array.isArray(payload.buttons) ? payload.buttons : [];
  const buttons = buttonsInput
    .map((button, index) => ({
      id: ensureId(button.id),
      label: (button.label || '').trim(),
      href: (button.href || '').trim(),
      icon: (button.icon || '').trim(),
      visible: button.visible !== false,
      order: typeof button.order === 'number' ? button.order : index,
    }))
    .filter((button) => button.label && button.href)
    .map((button) => ({
      ...button,
      icon: button.icon ? button.icon.trim() : '',
    }));

  return {
    visible,
    height,
    title: { text: titleText.trim(), visible: titleVisible },
    subtitle: { text: subtitleText.trim(), visible: subtitleVisible },
    heroImage,
    slides,
    buttons,
  };
}

export async function saveHeroSettings(payload) {
  const normalized = normalizeHeroPayload(payload);
  await HeroSettings.findByIdAndUpdate(
    DEFAULT_ID,
    {
      visible: normalized.visible,
      height: normalized.height,
      title: normalized.title,
      subtitle: normalized.subtitle,
      heroImage: normalized.heroImage,
      slides: normalized.slides,
      buttons: normalized.buttons,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const doc = await HeroSettings.findById(DEFAULT_ID).lean();
  return serializeHero(doc);
}
