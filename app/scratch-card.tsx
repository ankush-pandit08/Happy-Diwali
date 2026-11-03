'use client';
import { useEffect, useRef, type PointerEvent } from 'react';
import type { Entry } from '@/lib/event-types';
import { jokes } from '@/lib/event-card';

export default function ScratchCard({ entry, onReveal }: { entry: Entry; onReveal: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const distance = useRef(0);
  const joke = jokes[entry.jokeIndex];

  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 600, 320);
    gradient.addColorStop(0, '#c99744'); gradient.addColorStop(0.5, '#f4dfaa'); gradient.addColorStop(1, '#d5a655');
    context.fillStyle = gradient; context.fillRect(0, 0, 600, 320);
    context.fillStyle = '#65461e'; context.textAlign = 'center';
    context.font = '32px Georgia'; context.fillText('A little laughter awaits', 300, 150);
    context.font = '14px Arial'; context.fillText('SCRATCH TO REVEAL YOUR JOKE', 300, 190);
  }, []);

  function scratch(event: PointerEvent<HTMLCanvasElement>) {
    if (!last.current || entry.played) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = { x: (event.clientX - bounds.left) * 600 / bounds.width, y: (event.clientY - bounds.top) * 320 / bounds.height };
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.globalCompositeOperation = 'destination-out'; context.lineWidth = 55; context.lineCap = 'round'; context.beginPath();
    context.moveTo(last.current.x, last.current.y); context.lineTo(point.x, point.y); context.stroke();
    distance.current += Math.hypot(point.x - last.current.x, point.y - last.current.y); last.current = point;
    if (distance.current > 600) { last.current = null; onReveal(); }
  }

  return <section className="scratch-card" aria-label="Your Diwali joke scratch card">
    <div className="scratch-surface">
      <div className="scratch-result" aria-hidden={!entry.played}>
        <span className="result-icon" aria-hidden="true">😂</span>
        <h2>{joke.setup}</h2>
        <p>{joke.punchline}</p>
      </div>
      {!entry.played && <canvas ref={canvas} width={600} height={320} aria-label="Scratch to reveal your Diwali joke, or use the button below"
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); const bounds = event.currentTarget.getBoundingClientRect(); last.current = { x: (event.clientX - bounds.left) * 600 / bounds.width, y: (event.clientY - bounds.top) * 320 / bounds.height }; }}
        onPointerMove={scratch} onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />}
    </div>
    {!entry.played && <button className="reveal-button" onClick={onReveal}>Tap to reveal my joke</button>}
    <p className="sr-only" role="status">{entry.played ? `${joke.setup} ${joke.punchline}` : ''}</p>
    <p className="saved">{entry.played ? 'Keep smiling. Happy Diwali! 🪔' : 'Scratch the golden card for a little Diwali laughter.'}</p>
  </section>;
}
