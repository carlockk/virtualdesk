'use client';

import { useEffect, useMemo, useState } from 'react';
import { ICON_LIBRARY, filterIconOptions, normalizeIconKey } from '@/lib/icons';
import IconRenderer from '@/components/IconRenderer';
import { X } from 'lucide-react';

export default function IconPicker({ open, onClose, onSelect, currentValue = '', title = 'Seleccionar icono' }) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const options = useMemo(() => filterIconOptions(ICON_LIBRARY, search), [search]);
  const activeKey = normalizeIconKey(currentValue);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">Iconos proporcionados por lucide-react.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-64"
              />
              <button
                type="button"
                onClick={() => onSelect('')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
              >
                Sin icono
              </button>
            </div>
            <div className="text-xs text-slate-500">
              {options.length} icono{options.length === 1 ? '' : 's'} disponibles
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {options.map((option) => {
              const normalizedValue = normalizeIconKey(option.value);
              const isActive = activeKey === normalizedValue;
              return (
                <button
                  key={`icon-picker-${option.value || 'none'}`}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    isActive
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-indigo-600">
                    <IconRenderer name={option.value} size={16} />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block text-sm font-medium">{option.label}</span>
                    {option.value ? <span className="block text-xs text-slate-400">{option.value}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>

          {options.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No se encontraron iconos para “{search}”.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
