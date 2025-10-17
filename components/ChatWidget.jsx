'use client';
import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const GUEST_CHANNEL_KEY = 'virtualdesk.chat.channel';
const GUEST_NAME_KEY = 'virtualdesk.chat.name';

const makeGuestChannel = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `guest-${crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2);
  return `guest-${Date.now().toString(36)}${random}`;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [name, setName] = useState('Invitado');
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setName(data.user.name);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setChannel(user.id);
      return;
    }
    if (typeof window === 'undefined') return;
    const storedName = window.localStorage.getItem(GUEST_NAME_KEY);
    if (storedName) setName(storedName);
    let storedChannel = window.localStorage.getItem(GUEST_CHANNEL_KEY);
    if (!storedChannel) {
      storedChannel = makeGuestChannel();
      window.localStorage.setItem(GUEST_CHANNEL_KEY, storedChannel);
    }
    setChannel(storedChannel);
  }, [user]);

  useEffect(() => {
    if (!channel) return;
    let active = true;
    let timer;
    const load = async () => {
      try {
        const res = await fetch(`/api/chat?channel=${encodeURIComponent(channel)}`, { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        setMessages(data.messages || []);
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
      } catch {
        /* silent */
      }
      if (!active) return;
      timer = setTimeout(load, 3000);
    };
    load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [channel]);

  const send = async (event) => {
    event.preventDefault();
    if (!text.trim() || !channel) return;
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: name || 'Invitado', text, channel }),
    });
    setText('');
  };

  const handleNameChange = (value) => {
    setName(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GUEST_NAME_KEY, value);
    }
  };

  const isOwn = (message) => {
    if (user?.role === 'admin') return message.fromRole === 'admin';
    if (user) return message.fromRole === 'user';
    return message.fromRole !== 'admin' && message.channel === channel;
  };

  const renderMessage = (message) => {
    const mine = isOwn(message);
    const alignment = mine ? 'justify-end' : 'justify-start';
    const bubble = mine
      ? 'bg-indigo-600 text-white'
      : message.fromRole === 'admin'
      ? 'bg-white border border-indigo-100 text-gray-800'
      : 'bg-white border text-gray-700';

    return (
      <div key={message._id} className={`flex ${alignment}`}>
        <div className={`max-w-[80%] p-2 rounded-lg shadow-sm text-sm ${bubble}`}>
          <span className="block font-semibold text-xs mb-1">
            {message.fromRole === 'admin' ? 'Equipo VirtualDesk' : message.sender}
          </span>
          <span className="whitespace-pre-wrap break-words">{message.text}</span>
          <span className="block text-[10px] opacity-70 mt-1">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-indigo-600 text-white rounded-full p-4 shadow-xl hover:bg-indigo-700 transition transform hover:scale-105"
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 h-96 flex flex-col mt-4 border border-gray-200">
          <div className="bg-indigo-600 text-white p-3 rounded-t-2xl flex justify-between items-center">
            <h3 className="font-semibold">Soporte VirtualDesk</h3>
            <button onClick={() => setIsOpen(false)} className="text-white" aria-label="Cerrar">
              &times;
            </button>
          </div>

          {user ? (
            <div className="px-3 py-2 text-xs text-gray-600 bg-indigo-50">
              Hablando como <span className="font-semibold text-indigo-700">{user.name}</span>
            </div>
          ) : (
            <div className="px-3 pt-2">
              <input
                className="w-full mb-2 px-2 py-1 border rounded"
                placeholder="Tu nombre (opcional)"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
          )}

          <div ref={ref} className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-gray-500 text-sm">Inicia la conversación...</p>
            )}
            {messages.map(renderMessage)}
          </div>

          <form onSubmit={send} className="p-3 border-t flex gap-2">
            <input
              className="flex-1 p-2 border rounded-lg"
              placeholder="Escribe un mensaje..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!channel}
            />
            <button className="btn-primary" disabled={!channel || !text.trim()}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
