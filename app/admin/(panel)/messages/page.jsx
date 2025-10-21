'use client';

import { useAdmin } from '@/components/admin/AdminContext';
import { Loader2, Send, UserCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

export default function AdminMessagesPage() {
  const { user } = useAdmin();
  const [conversations, setConversations] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = async () => {
    try {
      setLoadingList(true);
      const res = await fetch('/api/chat', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo cargar el centro de mensajes.');
      }
      const items = Array.isArray(data.conversations) ? data.conversations : [];
      setConversations(items);
      if (!activeChannel && items.length > 0) {
        setActiveChannel(items[0].channel);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar conversaciones.');
    } finally {
      setLoadingList(false);
    }
  };

  const loadMessages = async (channel) => {
    if (!channel) return;
    try {
      setLoadingThread(true);
      const res = await fetch(`/api/chat?channel=${encodeURIComponent(channel)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudieron cargar los mensajes.');
      }
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error al cargar mensajes.');
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    let timer;
    loadConversations();
    timer = setInterval(loadConversations, 8000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!activeChannel) return;
    let timer;
    loadMessages(activeChannel);
    timer = setInterval(() => loadMessages(activeChannel), 4000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeChannel]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!text.trim() || !activeChannel) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: activeChannel, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo enviar el mensaje.');
      }
      setText('');
      await loadMessages(activeChannel);
    } catch (err) {
      setError(err.message || 'Error al enviar el mensaje.');
    }
  };

  const activeConversation = useMemo(
    () => conversations.find((item) => item.channel === activeChannel),
    [conversations, activeChannel],
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-72">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Conversaciones</h2>
          <span className="text-xs text-slate-500">{conversations.length}</span>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Cargando...
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Aun no hay conversaciones.
            </p>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.channel === activeChannel;
              return (
                <button
                  key={conversation.channel}
                  type="button"
                  onClick={() => setActiveChannel(conversation.channel)}
                  className={`flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition ${
                    isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-800">
                    {conversation.user?.name || 'Visitante'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {conversation.user?.email || conversation.channel}
                  </span>
                  <span className="truncate text-xs text-slate-500">
                    {conversation.lastMessage?.text || 'Sin mensajes'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(conversation.lastMessage?.createdAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
          <UserCircle2 size={24} className="text-indigo-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {activeConversation?.user?.name || activeChannel || 'Selecciona un canal'}
            </p>
            <p className="text-xs text-slate-500">{activeConversation?.user?.email}</p>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex h-[60vh] flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loadingThread ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Cargando mensajes...
              </div>
            ) : !activeChannel ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Selecciona una conversacion para comenzar.
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Aun no hay mensajes. Responde para iniciar la conversacion.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const mine = message.fromRole === 'admin';
                  return (
                    <div
                      key={message._id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow ${
                          mine
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <p className="font-medium">
                          {mine ? user?.name || 'Tu' : message.sender || 'Visitante'}
                        </p>
                        <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                        <span className="mt-1 block text-[10px] opacity-70">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Escribe una respuesta..."
                className="h-24 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!text.trim() || !activeChannel}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
