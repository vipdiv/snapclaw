'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { recognize } from 'tesseract.js';

const categories = [
  'EVENT_LOGISTICS',
  'EXPENSE',
  'IDEA',
  'CONTENT',
  'PROOF',
  'BUG',
  'REFERENCE',
  'REVIEW_REQUIRED',
  'OTHER',
] as const;

type Intent = 'CALENDAR' | 'SIGNAL';

function parseFields(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const date = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2},\s*\d{4})\b/i)?.[0] ?? '';
  const time = text.match(/\b(\d{1,2}:\d{2}\s?(AM|PM)?|\d{1,2}\s?(AM|PM))\b/i)?.[0] ?? '';
  const location = text.match(/(?:at|@|location[:\-]?)\s+([^\n,.]+)/i)?.[1]?.trim() ?? '';
  return {
    title: lines[0] ?? '',
    date,
    time,
    location,
  };
}

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('OTHER');
  const [extractedText, setExtractedText] = useState('');
  const [intent, setIntent] = useState<Intent>('SIGNAL');
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch('/api/auth/google/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setConnected(Boolean(d.connected)))
      .catch(() => setConnected(false));
  }, []);

  const onFile = async (file?: File) => {
    if (!file) return;
    setMessage('');
    setLoading(true);
    setImagePreview(URL.createObjectURL(file));
    const { data } = await recognize(file, 'eng');
    setExtractedText(data.text);
    const parsed = parseFields(data.text);
    setTitle(parsed.title);
    setDate(parsed.date);
    setTime(parsed.time);
    setLocation(parsed.location);
    setLoading(false);
  };

  const connectGoogle = () => {
    window.location.href = '/api/auth/google/start';
  };

  const postAction = async (path: string, mode: Intent) => {
    if (!connected) {
      connectGoogle();
      return;
    }
    setIntent(mode);
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, date, time, location, category, extractedText, mode }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? 'Failed action.');
      if (json.connectRequired) connectGoogle();
      return;
    }
    setConnected(true);
    setMessage(json.message || 'Done');
  };

  return (
    <main>
      <section className="card stack">
        <div className="header">
          <Image src="/mascot.svg" alt="SnapClaw mascot" width={40} height={40} />
          <div>
            <h1>SnapClaw</h1>
            <div className="muted">Screenshot to calendar + log.</div>
          </div>
        </div>
        <div className={`badge ${connected ? 'ok' : ''}`}>Intent: {intent}</div>
        <button className="secondary" onClick={connectGoogle}>Connect Google</button>
      </section>

      <section className="card stack">
        <h2>Upload Screenshot</h2>
        <div
          className="drop"
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          Drag & drop image or tap to upload
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: 10 }} />}
        {loading && <div className="small muted">Running OCR...</div>}
      </section>

      <section className="card stack">
        <h2>Extracted Fields</h2>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="row">
          <input placeholder="Date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input placeholder="Time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value as (typeof categories)[number])}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <textarea value={extractedText} onChange={(e) => setExtractedText(e.target.value)} />
      </section>

      <section className="card stack">
        <div className="actions">
          <button onClick={() => postAction('/api/calendar/create', 'CALENDAR')}>Create Calendar Event</button>
          <button onClick={() => postAction('/api/sheets/append', 'SIGNAL')}>Log to Google Sheet</button>
        </div>
        <button className="secondary" onClick={() => { setImagePreview(''); setTitle(''); setDate(''); setTime(''); setLocation(''); setCategory('OTHER'); setExtractedText(''); setMessage(''); }}>Start Over</button>
        {message && <div className="small">{message}</div>}
      </section>
    </main>
  );
}
