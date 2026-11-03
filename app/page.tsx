'use client';
import { useEffect, useState, type FormEvent } from 'react';
import ScratchCard from './scratch-card';
import type { EventState } from '@/lib/event-types';

export default function Home() {
  const [name, setName] = useState('');
  const [data, setData] = useState<EventState>({ entry: null, winnerCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch('/api/event', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]), cache: 'no-store' })
      .then(async response => { const result = response.ok ? await response.json() : null; if (active && result) setData(result); })
      .catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, []);
  async function enter(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }), signal: AbortSignal.timeout(12000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (error) {
      setError(error instanceof Error && error.name === 'TimeoutError' ? 'The connection took too long. Please try again.' : error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  }
  return <main className="celebration">
    <span className="eyebrow">A LITTLE LIGHT & LUCK</span>
    <div className="diya" aria-hidden="true"><span className="flame" /><span className="bowl" /></div>
    {data.entry ? <>
      <h1>Happy Diwali,<br /><em>{data.entry.name}!</em></h1>
      <p className="wish">May your home be full of light, your heart full of joy,<br className="wide" /> and your year full of beautiful beginnings.</p>
      <ScratchCard key={data.entry.id} entry={data.entry} onResult={setData} />
    </> : <>
      <h1>A little Diwali<br /><em>surprise for you.</em></h1>
      <p className="wish">A warm wish. A little luck. Start with your name.</p>
      <form className="name-form" onSubmit={enter}>
        <label htmlFor="name">What’s your name?</label>
        <input id="name" name="name" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={60} value={name} onChange={event => setName(event.target.value)} disabled={busy || loading} />
        <button disabled={busy || loading}>{loading ? 'Getting ready…' : busy ? 'Lighting your wish…' : 'Make my Diwali ✨'}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </>}
    <p className="footnote">3 lucky winners. A gift card for each.<br />One scratch card per browser. Gifts shared personally by the organizer.</p>
    <footer>Made with light, shared with love. <span lang="hi">शुभ दीपावली</span></footer>
  </main>;
}
