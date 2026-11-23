// The deck and the two wardens' hands. A card is a sigil, a power and an id; nothing
// else is stored, so a hand is a plain array the reveal can compare card against card.

import { CARD_VALUES, SIGIL_ORDER, SIGILS, DUEL } from './config.js';

let nextId = 1;

/** One card: { id, sigil, power, name }. */
export function makeCard(sigil, power) {
  const base = SIGILS[sigil];
  return { id: nextId++, sigil, power, name: `${base.label} ${power}` };
}

/** A shuffled deck: every sigil at every value, twice, so both wardens see the same shape. */
export function buildDeck(rng) {
  const deck = [];
  for (let pass = 0; pass < 2; pass += 1) {
    for (const sigil of SIGIL_ORDER) {
      for (const power of CARD_VALUES) deck.push(makeCard(sigil, power));
    }
  }
  return shuffle(deck, rng);
}

/** Fisher-Yates on a seeded generator; returns the same array, reordered. */
export function shuffle(items, rng) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const t = items[i];
    items[i] = items[j];
    items[j] = t;
  }
  return items;
}

/** Draw up to `want` cards, reshuffling the discard pile when the deck runs dry. */
export function draw(hand, deck, discard, want, rng) {
  while (hand.length < want) {
    if (deck.length === 0) {
      if (discard.length === 0) return hand;
      deck.push(...shuffle(discard.splice(0, discard.length), rng));
    }
    hand.push(deck.pop());
  }
  return hand;
}

/**
 * Who takes a gate. Power decides it; a sigil that breaks the other adds BREAK_BONUS,
 * so a 4 of the breaking sigil (7) beats a 6 of the sigil it breaks but loses to a
 * plain 8 of the third. Ties go to the attacker, measured by `attacker`.
 */
export function resolveClash(attackerCard, defenderCard, attackerIsPlayer, breakBonus) {
  if (!defenderCard) {
    return { winner: attackerIsPlayer ? 'player' : 'foe', margin: attackerCard.power };
  }
  const bonus = (a, b) => (SIGILS[a.sigil].beats === b.sigil ? breakBonus : 0);
  const attackerPower = attackerCard.power + bonus(attackerCard, defenderCard);
  const defenderPower = defenderCard.power + bonus(defenderCard, attackerCard);
  if (attackerPower > defenderPower) {
    return { winner: attackerIsPlayer ? 'player' : 'foe', margin: attackerPower - defenderPower };
  }
  if (defenderPower > attackerPower) {
    return { winner: attackerIsPlayer ? 'foe' : 'player', margin: defenderPower - attackerPower };
  }
  return { winner: attackerIsPlayer ? 'player' : 'foe', margin: 0 };
}

/** The opening hands: both wardens draw a full hand off the same shuffled deck. */
export function dealOpening(rng) {
  const deck = buildDeck(rng);
  const playerHand = [];
  const foeHand = [];
  draw(playerHand, deck, [], DUEL.handSize, rng);
  draw(foeHand, deck, [], DUEL.handSize, rng);
  return { deck, playerHand, foeHand, playerDiscard: [], foeDiscard: [] };
}

export { nextId };
