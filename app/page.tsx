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
  const [englishWish, setEnglishWish] = useState(false);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const voices = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Safari may populate its voice list after the first request.
    const synthesis = 'speechSynthesis' in window ? window.speechSynthesis : null;
    const refreshVoices = () => { voices.current = synthesis?.getVoices() ?? []; };
    refreshVoices();
    synthesis?.addEventListener('voiceschanged', refreshVoices);
    // Restore browser-only state after the static page has hydrated.
    const frame = requestAnimationFrame(() => {
      setEntry(readCard());
      setEnglishWish(/iPhone/i.test(navigator.userAgent));
      setVoiceAvailable('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
      setLoading(false);
    });
    return () => {
      cancelAnimationFrame(frame);
      synthesis?.removeEventListener('voiceschanged', refreshVoices);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  function speakWish(person: string) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    const available = synthesis.getVoices();
    if (available.length) voices.current = available;
    const language = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replaceAll('_', '-').split('-')[0];
    const isIPhone = /iPhone/i.test(navigator.userAgent);
    const englishVoice = voices.current.find(voice => voice.lang.toLowerCase().replaceAll('_', '-') === 'en-in')
      ?? voices.current.find(voice => language(voice) === 'en');
    const voice = isIPhone ? englishVoice : voices.current.find(voice => language(voice) === 'mr')
      ?? voices.current.find(voice => language(voice) === 'hi')
      ?? voices.current.find(voice => voice.lang.toLowerCase().replaceAll('_', '-') === 'en-in')
      ?? voices.current.find(voice => language(voice) === 'en');
    if (!voice) {
      setVoiceError(isIPhone ? 'The English voice is not ready. Please tap again in a moment.' : 'आवाज तयार नाही. थोड्या वेळाने पुन्हा बटण दाबा.');
      return;
    }
    // Never send Devanagari to an English voice: some iPhones read only
    // the Latin name and punctuation. Keep the fallback wish in Marathi,
    // using phonetic Latin text that the selected voice can pronounce.
    const phonetic = !isIPhone && language(voice) === 'en';
    const safeName = person.replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').trim();
    const text = isIPhone
      ? `Happy Diwali, ${safeName}. Wishing you and your family a Diwali filled with light, joy, and prosperity. May this festival bring you happiness, peace, and good health.`
      : phonetic
      ? `${safeName}. Tumhala aani tumchya kutumbala Diwalichya hardik shubhechha. Tumche aayushya prakashane, aanandane aani samruddhine ujalun nigho. Hee Diwali tumhala sukh, shanti aani uttam aarogya gheun yevo.`
      : `${safeName}. तुम्हाला आणि तुमच्या कुटुंबाला दिवाळीच्या हार्दिक शुभेच्छा. तुमचे आयुष्य प्रकाशाने, आनंदाने आणि समृद्धीने उजळून निघो. ही दिवाळी तुम्हाला सुख, शांती आणि उत्तम आरोग्य घेऊन येवो.`;
    const wish = new SpeechSynthesisUtterance(text);
    wish.voice = voice;
    wish.lang = voice.lang;
    wish.rate = 0.9;
    wish.onerror = event => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        setVoiceError(isIPhone ? 'The voice could not play. Please tap to try again.' : 'मराठी आवाज उपलब्ध नसू शकतो. पुन्हा प्रयत्न करण्यासाठी खालील बटण दाबा.');
      }
    };
    setVoiceError(phonetic ? 'या उपकरणावर मराठी आवाज उपलब्ध नाही. शुभेच्छा उपलब्ध आवाजात ऐकवल्या जात आहेत.' : '');
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
      <h1 lang="mr">दिवाळीच्या हार्दिक शुभेच्छा,<br /><em>{entry.name}!</em></h1>
      <p className="wish" lang="mr">तुमचे घर प्रकाशाने आणि मन आनंदाने उजळून निघो.<br className="wide" /> ही दिवाळी तुम्हाला सुख, शांती आणि समृद्धी घेऊन येवो!</p>
      {voiceAvailable ? <button className="voice-button" lang={englishWish ? 'en' : 'mr'} onClick={() => speakWish(entry.name)}>{englishWish ? '🔊 Hear my Diwali wish' : '🔊 मराठीत शुभेच्छा ऐका'}</button>
        : <p className="voice-note" lang="mr">तुमच्या ब्राउझरमध्ये आवाजात शुभेच्छा ऐकण्याची सुविधा उपलब्ध नाही. तुम्हाला दिवाळीच्या हार्दिक शुभेच्छा!</p>}
      {voiceError && <p className="voice-note" lang={englishWish ? 'en' : 'mr'} role="status">{voiceError}</p>}
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
    <footer>Made with light, shared with love. <span lang="mr">शुभ दीपावली</span></footer>
  </main>;
}
