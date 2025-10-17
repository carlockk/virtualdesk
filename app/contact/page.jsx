'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } else {
      setStatus('error');
    }
  };

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando encabezado...</div>}>
        <Header />
      </Suspense>

      <section className="container py-12">
        <h2 className="text-4xl font-bold text-center mb-8">Contáctanos Directamente</h2>

        <form onSubmit={submit} className="max-w-2xl mx-auto card p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input className="w-full mt-1 p-3 border rounded-lg" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
          </div>
          <div>
            <label className="block text-sm font-medium">Email (se notificará a administración)</label>
            <input type="email" className="w-full mt-1 p-3 border rounded-lg" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required/>
          </div>
          <div>
            <label className="block text-sm font-medium">Mensaje</label>
            <textarea rows={4} className="w-full mt-1 p-3 border rounded-lg" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} required/>
          </div>
          <button className="btn-primary w-full" disabled={status==='loading'}>
            {status==='loading' ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
          {status==='success' && <p className="text-green-700 bg-green-50 border border-green-200 p-2 rounded">¡Mensaje enviado! Te contactaremos pronto.</p>}
          {status==='error' && <p className="text-red-700 bg-red-50 border border-red-200 p-2 rounded">Error al enviar. Intenta nuevamente.</p>}
        </form>
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Preparando chat...</div>}>
        <ChatWidget />
      </Suspense>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando pie de página...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
