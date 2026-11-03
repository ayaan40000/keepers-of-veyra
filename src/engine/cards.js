// Cards (optional sport corner, 1.1): the order of a shuffled deck. Pure logic.
// Cards never change skill estimates, never earn Lumen and make no review sets: it is practice for its own sake.
import { rng, shuffle } from './util.js';

export const SUITS = ['S', 'H', 'D', 'C'];
export const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const SUIT_MARK = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const RANK_NAME = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
export const LADDER = [10, 15, 20, 26, 39, 52];
// Roughly six seconds a card to study, the same to write back (draft in C/deck-formats.json).
export const studySecondsFor = (n) => Math.round((n * 6) / 5) * 5;

export const fullDeck = () => RANKS.flatMap((r) => SUITS.map((s) => r + s));
export const cardName = (code) => `${RANK_NAME[code.slice(0, -1)] || code.slice(0, -1)} of ${SUIT_NAME[code.slice(-1)]}`;
export const deckOrder = (seed, n = 52) => shuffle(fullDeck(), rng(seed)).slice(0, Math.max(1, Math.min(52, n)));

// "10h", "H10", "ah", "Ace of Hearts" and "10 H" all read as a card. Returns the code (10H) or null.
export function parseCard(text) {
  const s = String(text ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (!s) return null;
  const long = s.match(/^(ACE|JACK|QUEEN|KING|\d{1,2}) OF (SPADES|HEARTS|DIAMONDS|CLUBS)$/);
  if (long) return rankCode(long[1]) + long[2][0];
  const a = s.replace(/ /g, '').match(/^(10|[A2-9JQK])([SHDC])$/);
  if (a) return a[1] + a[2];
  const b = s.replace(/ /g, '').match(/^([SHDC])(10|[A2-9JQK])$/);
  return b ? b[2] + b[1] : null;
}
function rankCode(w) { return { ACE: 'A', JACK: 'J', QUEEN: 'Q', KING: 'K' }[w] || w; }

// Longest correct run from card 1: the first mistake or blank ends it.
export function runScore(deck, answers) {
  let run = 0;
  for (let i = 0; i < deck.length; i++) { if (parseCard(answers[i]) === deck[i]) run++; else break; }
  return { run, total: deck.length, acc: deck.length ? run / deck.length : 0, right: deck.filter((c, i) => parseCard(answers[i]) === c).length };
}

// Double Deck style: asked "card number 17?" in random order until the first miss.
export function positionOrder(n, seed) { return shuffle(Array.from({ length: n }, (_, i) => i), rng(seed ^ 0x9e3779b1)); }
export function positionStreak(deck, order, answers) {
  let streak = 0;
  for (let k = 0; k < order.length; k++) { if (parseCard(answers[k]) === deck[order[k]]) streak++; else break; }
  return streak;
}
