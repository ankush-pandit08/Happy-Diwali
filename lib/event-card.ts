import type { Entry } from './event-types';

export const jokes = [
  { setup: 'Why did the diya get promoted?', punchline: 'Because it was the brightest one in the office!' },
  { setup: 'What did one ladoo say to the other?', punchline: 'Stop going round in circles and enjoy Diwali!' },
  { setup: 'My wallet loves Diwali shopping.', punchline: 'It finally gets to feel light too!' },
  { setup: 'Why did the phone love Diwali?', punchline: 'For once, everyone else was lighting up too!' },
  { setup: 'I told myself: just one more kaju katli.', punchline: 'Apparently, I have been saying that since breakfast!' },
  { setup: 'Why was the rangoli so calm?', punchline: 'It knew how to stay grounded, even when life got colourful!' },
  { setup: 'Diwali cleaning is a treasure hunt.', punchline: 'You find everything except the motivation to finish!' },
  { setup: 'Why did the fairy lights skip the argument?', punchline: 'They did not want to get tangled up in it!' },
  { setup: 'Mummy: Diwali ki safai ho gayi?', punchline: 'Me: Haan! Phone ki gallery ekdum saaf hai!' },
  { setup: 'My fitness plan this Diwali?', punchline: 'Ladoo in one hand, jalebi in the other. Balanced diet!' },
  { setup: 'Why did the diya bring sunglasses?', punchline: 'Its future was looking very bright!' },
  { setup: 'I bought a bigger box for Diwali sweets.', punchline: 'For sharing, obviously. With my future self!' },
] as const;

const storageKey = 'diwali-joke-card';

export function readCard(): Entry | null {
  try {
    const card = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (card && typeof card.name === 'string' && card.name.trim().length >= 2 && card.name.length <= 60
      && Number.isInteger(card.jokeIndex) && card.jokeIndex >= 0 && card.jokeIndex < jokes.length
      && typeof card.played === 'boolean') return card;
  } catch { /* Storage may be unavailable; the card still works for this visit. */ }
  return null;
}

export function saveCard(card: Entry) {
  try { localStorage.setItem(storageKey, JSON.stringify(card)); }
  catch { /* Keep playing when browser storage is unavailable. */ }
}
