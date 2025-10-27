'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Loader2,
  List,
  ListOrdered,
  Palette,
  Underline,
} from 'lucide-react';

const DEFAULT_CONTENT = '';
const ALLOWED_PLACEHOLDER = 'Empieza a escribir…';

function safeHtml(value) {
  if (typeof value !== 'string') return DEFAULT_CONTENT;
  return value;
}

export default function RichTextEditor({ value, onChange, placeholder = ALLOWED_PLACEHOLDER, className = '' }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const [foreColor, setForeColor] = useState('#1f2937');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [uploading, setUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const desired = safeHtml(value);
    if (editor.innerHTML !== desired) {
      editor.innerHTML = desired || DEFAULT_CONTENT;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!onChange) return;
    const editor = editorRef.current;
    onChange(editor?.innerHTML || DEFAULT_CONTENT);
  }, [onChange]);

  const exec = useCallback(
    (command, option = null) => {
      if (!isMounted) return false;
      const editor = editorRef.current;
      if (!editor) return false;
      editor.focus();
      let success = false;
      try {
        success = document.execCommand(command, false, option);
        emitChange();
      } catch (err) {
        console.warn('[RichTextEditor] execCommand failed', command, err);
      }
      return success;
    },
    [emitChange, isMounted],
  );

  const applyColor = useCallback(
    (color) => {
      if (!color) return;
      exec('foreColor', color);
      setForeColor(color);
    },
    [exec],
  );

  const applyBgColor = useCallback(
    (color) => {
      if (!color) return;
      const ok = exec('hiliteColor', color);
      if (!ok) {
        exec('backColor', color);
      }
      setBgColor(color);
    },
    [exec],
  );

  const orderedList = useCallback(() => exec('insertOrderedList'), [exec]);
  const unorderedList = useCallback(() => exec('insertUnorderedList'), [exec]);
  const justifyLeft = useCallback(() => exec('justifyLeft'), [exec]);
  const justifyCenter = useCallback(() => exec('justifyCenter'), [exec]);
  const justifyRight = useCallback(() => exec('justifyRight'), [exec]);

  const toolbarButtons = useMemo(
    () => [
      { icon: Bold, label: 'Negrita', action: () => exec('bold') },
      { icon: Italic, label: 'Cursiva', action: () => exec('italic') },
      { icon: Underline, label: 'Subrayado', action: () => exec('underline') },
      { icon: AlignLeft, label: 'Alinear a la izquierda', action: justifyLeft },
      { icon: AlignCenter, label: 'Centrar', action: justifyCenter },
      { icon: AlignRight, label: 'Alinear a la derecha', action: justifyRight },
      { icon: List, label: 'Lista', action: unorderedList },
      { icon: ListOrdered, label: 'Lista numerada', action: orderedList },
    ],
    [exec, justifyLeft, justifyCenter, justifyRight, unorderedList, orderedList],
  );

  const requestImageUpload = useCallback(() => {
    if (uploading) return;
    const input = fileInputRef.current;
    if (input) {
      input.value = '';
      input.click();
    }
  }, [uploading]);

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', file);

        const res = await fetch('/api/admin/uploads/content', { method: 'POST', body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok || !data?.url) {
          throw new Error(data?.message || 'No se pudo subir la imagen.');
        }

        const safeUrl = data.url;
        const alt = data.originalName || file.name || 'Imagen';
        const wrapperStyle = 'margin:1.5rem 0;text-align:center;';
        const imageStyle = 'max-width:100%;height:auto;';
        const html = `<figure style="${wrapperStyle}"><img src="${safeUrl}" alt="${alt}" style="${imageStyle}" /></figure>`;
        exec('insertHTML', html);
      } catch (err) {
        console.error('[RichTextEditor] upload error', err);
        if (typeof window !== 'undefined') {
          window.alert(err.message || 'No se pudo subir la imagen.');
        }
      } finally {
        setUploading(false);
      }
    },
    [exec],
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
        {toolbarButtons.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            title={label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            <Icon size={16} />
          </button>
        ))}

        <div className="h-5 w-px bg-slate-200" />

        <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
          <Palette size={14} />
          Texto
          <input
            type="color"
            value={foreColor}
            onChange={(event) => applyColor(event.target.value)}
            className="h-0 w-0 opacity-0"
          />
        </label>

        <label className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
          <Palette size={14} />
          Fondo
          <input
            type="color"
            value={bgColor}
            onChange={(event) => applyBgColor(event.target.value)}
            className="h-0 w-0 opacity-0"
          />
        </label>

        <div className="h-5 w-px bg-slate-200" />

        <button
          type="button"
          onClick={requestImageUpload}
          disabled={uploading}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-transparent px-3 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
          <span>{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="relative min-h-[220px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 [&_*]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-100"
        onInput={emitChange}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
