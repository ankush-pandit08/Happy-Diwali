'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import ScratchCard from './scratch-card';
import type { Entry } from '@/lib/event-types';
import { jokes, readCard, saveCard } from '@/lib/event-card';

export default function Home() {
  const [name, setName] = useState('');
  const [entry, setEntry] = useState<Entry | null>(null);
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Restore browser-only state after the static page has hydrated.
    const frame = requestAnimationFrame(() => {
      setEntry(readCard());
      setVoiceAvailable('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
      setLoading(false);
    });
    return () => {
      cancelAnimationFrame(frame);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  function speakWish(person: string) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const wish = new SpeechSynthesisUtterance(`Happy Diwali, ${person}! Wishing you and your family lots of light, laughter, and happiness. Have a wonderful Diwali!`);
    wish.lang = 'en-IN';
    const voices = synthesis.getVoices();
    const voice = voices.find(voice => voice.lang.toLowerCase() === 'en-in')
      ?? voices.find(voice => voice.lang.toLowerCase().startsWith('en'));
    if (voice) wish.voice = voice;
    wish.rate = 0.9;
    wish.onerror = event => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        setVoiceError('The voice could not play. Tap below to try again.');
      }
    };
    setVoiceError('');
    utterance.current = wish;
    synthesis.resume();
    synthesis.speak(wish);
  }

  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2 || cleanName.length > 60) return;
    const card = { name: cleanName, jokeIndex: Math.floor(Math.random() * jokes.length), played: false };
    saveCard(card);
    setEntry(card);
    // Speak directly from the submit gesture so mobile browsers allow audio.
    speakWish(cleanName);
  }

  function reveal() {
    if (!entry || entry.played) return;
    const card = { ...entry, played: true };
    saveCard(card);
    setEntry(card);
  }

  function playAgain() {
    if (!entry) return;
    const card = { ...entry, played: false };
    saveCard(card);
    setEntry(card);
    // Remount to repaint the coating and reset scratch progress and effects.
    setRound(value => value + 1);
  }

  return <main className="celebration">
    <span className="eyebrow">A LITTLE LIGHT & JOY</span>
    <div className="diya" aria-hidden="true"><span className="flame" /><span className="bowl" /></div>
    {entry ? <>
      <h1>Happy Diwali,<br /><em>{entry.name}!</em></h1>
      <p className="wish">May your home be full of light, your heart full of joy,<br className="wide" /> and your Diwali full of laughter.</p>
      {voiceAvailable ? <button className="voice-button" onClick={() => speakWish(entry.name)}>🔊 Hear my Diwali wish</button>
        : <p className="voice-note">Your browser does not support voice wishes. Sending you a written wish full of light and love!</p>}
      {voiceError && <p className="voice-note" role="status">{voiceError}</p>}
      <ScratchCard key={round} entry={entry} onReveal={reveal} onPlayAgain={playAgain} />
    </> : <>
      <h1>A little Diwali<br /><em>surprise for you.</em></h1>
      <p className="wish">A warm wish. A sparkling surprise. Start with your name.</p>
      <form className="name-form" onSubmit={enter}>
        <label htmlFor="name">What’s your name?</label>
        <input id="name" name="name" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={60} pattern=".*\S.*\S.*" title="Please enter at least two non-space characters." value={name} onChange={event => setName(event.target.value)} disabled={loading} />
        <button disabled={loading}>{loading ? 'Getting ready…' : 'Make my Diwali ✨'}</button>
      </form>
    </>}
    <p className="footnote">Scratch a little, celebrate a little.<br />A Diwali sparkle and a smile, just for you.</p>
    <footer>Made with light, shared with love. <span lang="hi">शुभ दीपावली</span></footer>
  </main>;
}
