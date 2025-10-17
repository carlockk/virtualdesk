'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense, useEffect, useMemo, useState } from 'react';

export default function AdminMessagesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user || null))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    let timer;

    const load = async () => {
      try {
        const res = await fetch('/api/chat', { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudo obtener las conversaciones');
        const data = await res.json();
        if (!active) return;
        setConversations(data.conversations || []);
        setLoadingConversations(false);
        if (!activeChannel && data.conversations?.length) {
          setActiveChannel((prev) => prev || data.conversations[0].channel);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setLoadingConversations(false);
      }
      if (!active) return;
      timer = setTimeout(load, 5000);
    };

    load();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [isAdmin, activeChannel]);

  useEffect(() => {
    if (!isAdmin || !activeChannel) return;
    let active = true;
    let timer;

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/chat?channel=${encodeURIComponent(activeChannel)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudieron cargar los mensajes');
        const data = await res.json();
        if (!active) return;
        setMessages(data.messages || []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err.message);
      }
      if (!active) return;
      timer = setTimeout(loadMessages, 3000);
    };

    loadMessages();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [isAdmin, activeChannel]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!text.trim() || !activeChannel) return;
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, channel: activeChannel }),
    });
    setText('');
  };

  const activeConversation = useMemo(
    () => conversations.find((c) => c.channel === activeChannel),
    [conversations, activeChannel],
  );

  const renderMessage = (message) => {
    const mine = message.fromRole === 'admin';
    const alignment = mine ? 'justify-end' : 'justify-start';
    const bubble = mine
      ? 'bg-indigo-600 text-white'
      : message.fromRole === 'user'
      ? 'bg-white border border-indigo-100 text-gray-800'
      : 'bg-white border text-gray-700';

    return (
      <div key={message._id} className={`flex ${alignment}`}>
        <div className={`max-w-[80%] p-3 rounded-xl shadow-sm text-sm ${bubble}`}>
          <span className="block text-xs font-semibold mb-1 text-indigo-500">
            {message.fromRole === 'admin' ? 'Tu' : message.sender}
          </span>
          <span className="whitespace-pre-wrap break-words block">{message.text}</span>
          <span className="block text-[10px] opacity-70 mt-1">
            {new Date(message.createdAt).toLocaleString()}
          </span>
        </div>
      </div>
    );
  };

  let content;
  if (currentUser && !isAdmin) {
    content = (
      <div className="text-center text-gray-600 py-12">
        Necesitas permisos de administrador para ver esta seccion.
      </div>
    );
  } else if (!currentUser) {
    content = (
      <div className="text-center text-gray-600 py-12">
        Inicia sesion como administrador para gestionar las conversaciones.
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Conversaciones</h2>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {loadingConversations && (
              <p className="p-4 text-sm text-gray-500">Cargando conversaciones...</p>
            )}
            {!loadingConversations && conversations.length === 0 && (
              <p className="p-4 text-sm text-gray-500">Sin conversaciones activas por ahora.</p>
            )}
            {conversations.map((conversation) => {
              const isActive = conversation.channel === activeChannel;
              return (
                <button
                  key={conversation.channel}
                  onClick={() => setActiveChannel(conversation.channel)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-indigo-50 transition ${
                    isActive ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-gray-800">
                      {conversation.user?.name || 'Visitante'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {conversation.user?.email || conversation.channel}
                    </span>
                    <span className="text-xs text-gray-600 mt-1 truncate">
                      {conversation.lastMessage?.text || 'Sin mensajes'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      {conversation.lastMessage?.createdAt
                        ? new Date(conversation.lastMessage.createdAt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="lg:col-span-2 bg-white border rounded-2xl shadow-sm flex flex-col">
          {activeChannel ? (
            <>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Canal: {activeChannel}</h3>
                {activeConversation?.user && (
                  <p className="text-sm text-gray-500">
                    {activeConversation.user.name} - {activeConversation.user.email}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mt-10">
                    Todavia no hay mensajes. Escribe el primero.
                  </p>
                ) : (
                  messages.map(renderMessage)
                )}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t flex gap-3">
                <textarea
                  className="flex-1 border rounded-xl p-3 min-h-[56px]"
                  placeholder="Responder..."
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selecciona una conversacion para verla.
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Header />
      </Suspense>
      <section className="container py-12">
        <h1 className="text-3xl font-bold mb-6">Centro de mensajes</h1>
        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {content}
      </section>
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Cargando...</div>}>
        <Footer />
      </Suspense>
    </main>
  );
}
