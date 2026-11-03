'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Entry, EventState } from '@/lib/event-types';

export default function ScratchCard({ entry, onResult }: { entry: Entry; onResult: (data: EventState) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const distance = useRef(0), inFlight = useRef(false);
  const [result, setResult] = useState(entry);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 600, 240);
    gradient.addColorStop(0, '#c99744'); gradient.addColorStop(0.5, '#f4dfaa'); gradient.addColorStop(1, '#d5a655');
    context.fillStyle = gradient; context.fillRect(0, 0, 600, 240);
    context.fillStyle = '#65461e'; context.textAlign = 'center';
    context.font = '32px Georgia'; context.fillText('A little luck awaits', 300, 112);
    context.font = '14px Arial'; context.fillText('SCRATCH TO REVEAL', 300, 148);
  }, []);
  async function reveal() {
    if (inFlight.current || result.played) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const response = await fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reveal' }), signal: AbortSignal.timeout(12000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (!data.entry?.played) throw new Error('Your card is not ready. Please try again.');
      setResult(data.entry); onResult(data);
    } catch (error) {
      setError(error instanceof Error && error.name === 'TimeoutError' ? 'Connection took too long. Please try again.' : error instanceof Error ? error.message : 'Please try again.');
    } finally { inFlight.current = false; setBusy(false); }
  }
  function scratch(event: PointerEvent<HTMLCanvasElement>) {
    if (!last.current || busy) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: (event.clientX - bounds.left) * 600 / bounds.width, y: (event.clientY - bounds.top) * 240 / bounds.height };
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.globalCompositeOperation = 'destination-out'; context.lineWidth = 55; context.lineCap = 'round'; context.beginPath();
    context.moveTo(last.current.x, last.current.y); context.lineTo(point.x, point.y); context.stroke();
    distance.current += Math.hypot(point.x - last.current.x, point.y - last.current.y); last.current = point;
    if (distance.current > 450) { last.current = null; void reveal(); }
  }
  return <section className="scratch-card" aria-label="Your Diwali scratch card">
    <div className="scratch-surface"><div className="scratch-result" aria-live="polite">
      {result.played ? <>
        <span className="result-icon" aria-hidden="true">{result.win ? '🎁' : '🪔'}</span>
        <h2>{result.win ? 'You’re a lucky winner!' : 'A bright wish, just for you.'}</h2>
        <p>{result.win ? 'You won a gift card! Show this card to the organizer to collect your gift.' : 'No gift card this time. Here’s wishing you a wonderful Diwali!'}</p>
        {!!result.win && <code>Winning card: {result.id}</code>}
      </> : <><h2>{busy ? 'Opening your surprise…' : 'Your surprise is waiting'}</h2><p>Scratch the golden card or tap below.</p></>}
    </div>{!result.played && <canvas ref={canvas} width={600} height={240} aria-label="Scratch to reveal your result, or use the button below"
      onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); const bounds = event.currentTarget.getBoundingClientRect(); last.current = { x: (event.clientX - bounds.left) * 600 / bounds.width, y: (event.clientY - bounds.top) * 240 / bounds.height }; }}
      onPointerMove={scratch} onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />}</div>
    {!result.played && <button className="reveal-button" onClick={reveal} disabled={busy}>{busy ? 'Revealing…' : 'Tap to reveal instead'}</button>}
    {error && <p className="error" role="alert">{error}</p>}
    {!!result.played && <p className="saved">Your result is saved. Happy celebrating!</p>}
  </section>;
}
