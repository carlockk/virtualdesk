'use client';

import { getIconComponent } from '@/lib/icons';

export default function IconRenderer({ name, size = 16, className = '' }) {
  const Icon = getIconComponent(name);
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
}
