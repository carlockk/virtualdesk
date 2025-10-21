'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';

export default function ServiceCard({ service, onSelect }) {
  const [open, setOpen] = useState(false);
  const openInfo = () => setOpen(true);
  const closeInfo = () => setOpen(false);

  const title = service.title || service.name || 'Servicio';
  const summary = service.summary || service.description || '';
  const detail = service.description || service.summary || '';
  const imageUrl = service.imageUrl || service.img || '';
  const icon = (service.icon || '').trim();
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'SV';

  return (
    <div className="card p-0 overflow-hidden transition hover:shadow-md">
      <div className="h-36 w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
            Imagen pendiente
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col justify-between">
        <div>
          {icon ? (
            <span className="text-3xl mb-3 block">{icon}</span>
          ) : (
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-sm font-semibold text-indigo-600">
              {initials}
            </div>
          )}
          <h3
            className="text-xl font-bold text-indigo-600 mb-2 cursor-pointer"
            title={detail}
            onClick={openInfo}
          >
            {title}
          </h3>
          <p className="text-gray-600 mb-4">{summary}</p>
          {service.price !== null && service.price !== undefined && (
            <p className="text-sm font-semibold text-indigo-600">
              Desde ${Number(service.price).toLocaleString('es-CL')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">Pasa el mouse para ver detalles</span>
          <button
            onClick={() => onSelect(service)}
            className="btn-primary"
            aria-label={`Me interesa ${title}`}
          >
            Me interesa
          </button>
        </div>
      </div>

      <Modal open={open} onClose={closeInfo} title={title}>
        <p>{detail}</p>
      </Modal>
    </div>
  );
}




