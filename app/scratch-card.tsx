'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Entry } from '@/lib/event-types';

export default function ScratchCard({ entry, onReveal }: { entry: Entry; onReveal: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{x:number;y:number} | null>(null);
  const distance = useRef(0);
  const audio = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0,0,600,320);
      gradient.addColorStop(0,'#c99744'); gradient.addColorStop(.5,'#f4dfaa'); gradient.addColorStop(1,'#d5a655');
      ctx.fillStyle = gradient; ctx.fillRect(0,0,600,320);
      ctx.fillStyle='#65461e'; ctx.textAlign='center'; ctx.font='32px Georgia'; ctx.fillText('A little sparkle awaits',300,150);
      ctx.font='14px Arial'; ctx.fillText('SCRATCH TO CELEBRATE DIWALI',300,190);
    }
    return () => { if(timer.current) clearTimeout(timer.current); void audio.current?.close(); };
  }, []);
  function reveal() {
    if(entry.played) return;
    setCelebrating(true);
    timer.current=setTimeout(()=>setCelebrating(false),3200);
    try {
      const ctx=new AudioContext(); audio.current=ctx;
      void ctx.resume().then(()=>{
        for(let i=0;i<22;i++) {
          const duration=.08+Math.random()*.12;
          const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate);
          const data=buffer.getChannelData(0);
          for(let j=0;j<data.length;j++) data[j]=Math.random()*2-1;
          const source=ctx.createBufferSource(); source.buffer=buffer;
          const gain=ctx.createGain(); const start=ctx.currentTime+i*.105;
          gain.gain.setValueAtTime(.16,start); gain.gain.exponentialRampToValueAtTime(.001,start+duration);
          source.connect(gain).connect(ctx.destination); source.start(start);
        }
      }).catch(()=>{});
    } catch { /* Reveal remains available when audio is unsupported. */ }
    onReveal();
  }
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const bounds=event.currentTarget.getBoundingClientRect();
    return {x:(event.clientX-bounds.left)*600/bounds.width,y:(event.clientY-bounds.top)*320/bounds.height};
  }
  function scratch(event: PointerEvent<HTMLCanvasElement>) {
    if(!last.current || entry.played) return;
    const next=point(event); const ctx=canvas.current?.getContext('2d'); if(!ctx) return;
    ctx.globalCompositeOperation='destination-out'; ctx.lineWidth=55; ctx.lineCap='round'; ctx.beginPath();
    ctx.moveTo(last.current.x,last.current.y); ctx.lineTo(next.x,next.y); ctx.stroke();
    distance.current+=Math.hypot(next.x-last.current.x,next.y-last.current.y); last.current=next;
    if(distance.current>600) {last.current=null; reveal();}
  }
  return <section className="scratch-card" aria-label="Your Diwali celebration scratch card">
    {celebrating && <div className="diwali-particles" aria-hidden="true">{Array.from({length:48},(_,i)=><span key={i} style={{left:`${i*37%100}%`,top:`${i*23%85}%`,animationDelay:`${i%8*.09}s`,color:['#f5ad23','#e95d35','#d04087','#8c68c9'][i%4]}}>{i%3===0?'✦':'•'}</span>)}</div>}
    <div className="scratch-surface">
      <div className="scratch-result" aria-hidden={!entry.played}><span className="result-icon" aria-hidden="true">🪔</span><h2>Happy Diwali, {entry.name}!</h2><p>May your Diwali sparkle with light, joy, and happiness.</p></div>
      {!entry.played && <canvas ref={canvas} width={600} height={320} aria-label="Scratch to celebrate Diwali, or use the button below" onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);last.current=point(event);}} onPointerMove={scratch} onPointerUp={()=>{last.current=null;}} onPointerCancel={()=>{last.current=null;}} />}
    </div>
    {!entry.played && <button className="reveal-button" onClick={reveal}>Tap to celebrate</button>}
    <p className="sr-only" role="status">{entry.played?`Happy Diwali, ${entry.name}!`:''}</p>
    <p className="saved">{entry.played?'Let the celebrations sparkle. Happy Diwali!':'Scratch the golden card for a sparkling Diwali surprise.'}</p>
  </section>;
}
