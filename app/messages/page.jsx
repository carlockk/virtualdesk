'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense, useEffect, useRef, useState } from 'react';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    let timer;
    const load = async () => {
      try {
        const res = await fetch(`/api/chat?channel=${encodeURIComponent(user.id)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudieron cargar los mensajes');
        const data = await res.json();
        if (!active) return;
        setMessages(data.messages || []);
        setError(null);
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
      } catch (err) {
        if (!active) return;
        setError(err.message);
      }
      if (!active) return;
      timer = setTimeout(load, 3000);
    };
    load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  const send = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    setText('');
  };

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Header />
      </Suspense>

      <section className="container py-12 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold mb-6">Mis mensajes</h1>
        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
            Necesitas iniciar sesion para consultar tus conversaciones.
          </div>
        )}
        {user && (
          <div className="flex-1 bg-white border rounded-2xl shadow-sm flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Conversacion con el equipo de VirtualDesk
              </h2>
              <p className="text-sm text-gray-500">Resuelve tus dudas en cualquier momento.</p>
            </div>
            <div ref={ref} className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">
                  Aun no tienes mensajes. Empieza la conversacion desde el chat o envia uno ahora.
                </p>
              ) : (
                messages.map((message) => {
                  const mine = message.fromRole !== 'admin';
                  const alignment = mine ? 'justify-end' : 'justify-start';
                  const bubble = mine
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-indigo-100 text-gray-800';
                  return (
                    <div key={message._id} className={`flex ${alignment}`}>
                      <div className={`max-w-[70%] p-3 rounded-xl shadow-sm text-sm ${bubble}`}>
                        <span className="block text-xs font-semibold mb-1">
                          {message.fromRole === 'admin' ? 'Equipo VirtualDesk' : 'Tu'}
                        </span>
                        <span className="whitespace-pre-wrap break-words block">{message.text}</span>
                        <span className="block text-[10px] opacity-70 mt-1">
                          {formatDateTime(message?.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {error && (
              <div className="mx-4 mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={send} className="p-4 border-t flex gap-3">
              <textarea
                className="flex-1 border rounded-xl p-3 min-h-[56px]"
                placeholder="Escribe tu mensaje..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60"
                disabled={!text.trim()}
              >
                Enviar
              </button>
            </form>
          </div>
        )}
      </section>

      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
