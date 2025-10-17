'use client';
import { useState } from 'react';
import Modal from '@/components/Modal';

export default function ServiceCard({ service, onSelect }) {
  const [open, setOpen] = useState(false);
  const openInfo = () => setOpen(true);
  const closeInfo = () => setOpen(false);

  return (
    <div className="card p-0 overflow-hidden transition hover:shadow-md">
      {/* Imagen del servicio */}
      {service.img && (
        <img
          src={service.img}
          alt={service.name}
          className="w-full h-36 object-cover"
          loading="lazy"
        />
      )}

      {/* Contenido */}
      <div className="p-6 flex flex-col justify-between">
        <div>
          <span className="text-3xl mb-3 block">{service.icon}</span>
          <h3
            className="text-xl font-bold text-indigo-600 mb-2 cursor-pointer"
            title={service.description}
            onClick={openInfo} /* móvil: abre modal */
          >
            {service.name}
          </h3>
          <p className="text-gray-600 mb-4">{service.description}</p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">Pasa el mouse para ver detalles</span>
          <button
            onClick={() => onSelect(service)}
            className="btn-primary"
            aria-label={`Me interesa ${service.name}`}
          >
            Me interesa
          </button>
        </div>
      </div>

      {/* Popup (móvil) */}
      <Modal open={open} onClose={closeInfo} title={service.name}>
        <p>{service.description}</p>
      </Modal>
    </div>
  );
}
