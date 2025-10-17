import './globals.css';
import { Suspense } from 'react';
import { AuthPanelProvider } from '@/components/AuthPanelProvider';

export const metadata = {
  title: 'VirtualDesk - Servicios Informaticos',
  description: 'Soluciones integrales de software en Chile (Web, Apps, Integraciones, DevOps).',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <AuthPanelProvider>
          <Suspense fallback={<div className="p-6 text-center text-gray-500">Cargando layout...</div>}>
            {children}
          </Suspense>
        </AuthPanelProvider>
      </body>
    </html>
  );
}
