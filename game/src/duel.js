// The duel's state machine: a hand, three gates, a round of commits, a reveal, damage.
// Every transition is a function of the state alone, so the same moves always give the
// same board and a screenshot scene can play the rules forward without the browser.

import { DUEL, GATES, BREAK_BONUS, SIGILS } from './config.js';
import { dealOpening, draw, resolveClash } from './cards.js';

export const PHASE = {
  TITLE: 'title',
  CHOOSE: 'choose',
  REVEAL: 'reveal',
  OVER: 'over',
};

export function newDuel(rng, seed) {
  const opening = dealOpening(rng);
  return {
    seed,
    /** The clock reading the current hand was dealt at, for the deal animation. */
    handDealtAt: 0,
    /** When the foe's cards turned face up this round, for the flip. */
    revealStartedAt: 0,
    phase: PHASE.TITLE,
    hp: DUEL.hp,
    foeHp: DUEL.hp,
    round: 1,
    deck: opening.deck,
    playerHand: opening.playerHand,
    foeHand: opening.foeHand,
    playerDiscard: opening.playerDiscard,
    foeDiscard: opening.foeDiscard,
    /** Clock reading each gate last received a card, for its drop animation. */
    placedAt: {},
    /** What each side has committed this round: { laneKey: card }. */
    playerPlays: {},
    foePlays: {},
    /** Set during the reveal, one entry a gate: the clash and what it did. */
    clash: [],
    selectedCardId: null,
    selectedLane: 0,
    log: [],
    revealElapsed: 0,
    winner: null,
  };
}

/** Cards the player still holds, in the order the hand shows them. */
export function handOf(state) {
  return state.playerHand;
}

/** Whether every gate already carries one of the player's cards. */
export function placedEveryLane(state) {
  return GATES.every((gate) => state.playerPlays[gate.key]);
}

/**
 * Put the selected card on a gate. Returns a short line for the log, or null when the
 * move is not allowed (no card, gate already held by the player, wrong phase).
 */
export function placeCard(state, cardId, laneIndex, clock) {
  if (state.phase !== PHASE.CHOOSE) return null;
  const gate = GATES[laneIndex];
  if (!gate || state.playerPlays[gate.key]) return null;
  const index = state.playerHand.findIndex((card) => card.id === cardId);
  if (index === -1) return null;
  const card = state.playerHand[index];
  state.playerPlays[gate.key] = card;
  if (clock !== undefined) state.placedAt = { ...(state.placedAt || {}), [gate.key]: clock };
  state.selectedCardId = null;
  state.selectedLane = nextOpenLane(state);
  return `${card.name} takes the ${gate.name}`;
}

/** Take a card back off a gate, before the round is committed. */
export function recallCard(state, laneIndex) {
  if (state.phase !== PHASE.CHOOSE) return null;
  const gate = GATES[laneIndex];
  if (!gate) return null;
  const card = state.playerPlays[gate.key];
  if (!card) return null;
  delete state.playerPlays[gate.key];
  if (state.placedAt) delete state.placedAt[gate.key];
  state.selectedCardId = card.id;
  state.selectedLane = laneIndex;
  return `${card.name} returns to hand`;
}

/** The first gate the player has left open, or the current one when all are held. */
export function nextOpenLane(state) {
  const open = GATES.findIndex((gate) => !state.playerPlays[gate.key]);
  return open === -1 ? state.selectedLane : open;
}

/**
 * The foe's plan for this round: it answers each of the player's cards with the cheapest
 * card that beats it (counting the break bonus), and spends what is left on the gates the
 * player left open. A hand that cannot answer anything still places its smallest cards,
 * so a gate is never a free win against it.
 */
export function planFoeRound(state) {
  const foe = state.foeHand.slice();
  const answer = {};
  const used = new Set();

  const cheapestBeater = (targetCard, pool) => {
    let best = null;
    for (const card of pool) {
      if (used.has(card.id)) continue;
      const mine = card.power + (SIGILS[card.sigil].beats === targetCard.sigil ? BREAK_BONUS : 0);
      const theirs = targetCard.power + (SIGILS[targetCard.sigil].beats === card.sigil ? BREAK_BONUS : 0);
      if (mine > theirs && (best === null || card.power < best.power)) best = card;
    }
    return best;
  };

  // Answer the player's strongest threats first, so the best card is spent where it matters.
  const threats = GATES.filter((gate) => state.playerPlays[gate.key])
    .map((gate) => ({ gate, card: state.playerPlays[gate.key] }))
    .sort((a, b) => b.card.power - a.card.power);

  for (const { gate, card } of threats) {
    const beater = cheapestBeater(card, foe);
    if (beater) {
      answer[gate.key] = beater;
      used.add(beater.id);
    }
  }

  // Spend the rest on gates the player has not taken, cheapest first, to rake small damage.
  const openGates = GATES.filter((gate) => !state.playerPlays[gate.key]);
  const spare = foe.filter((card) => !used.has(card.id)).sort((a, b) => a.power - b.power);
  for (const gate of openGates) {
    if (spare.length === 0) break;
    const card = spare.shift();
    answer[gate.key] = card;
    used.add(card.id);
  }

  return answer;
}

/**
 * Close the round: the foe commits, both hands drop the cards they played, and the
 * reveal begins. Returns the clash list so the renderer can animate it.
 */
export function commitRound(state) {
  if (state.phase !== PHASE.CHOOSE) return [];
  state.foePlays = planFoeRound(state);

  const spentPlayer = new Set(Object.values(state.playerPlays).map((card) => card.id));
  const spentFoe = new Set(Object.values(state.foePlays).map((card) => card.id));
  state.playerHand = state.playerHand.filter((card) => !spentPlayer.has(card.id));
  state.foeHand = state.foeHand.filter((card) => !spentFoe.has(card.id));

  const clash = [];
  for (const gate of GATES) {
    const mine = state.playerPlays[gate.key] || null;
    const theirs = state.foePlays[gate.key] || null;
    if (!mine && !theirs) {
      clash.push({ gate, mine, theirs, winner: null, margin: 0, damage: 0 });
      continue;
    }
    if (mine && !theirs) {
      clash.push({ gate, mine, theirs, winner: 'player', margin: mine.power, damage: mine.power });
      continue;
    }
    if (!mine && theirs) {
      clash.push({ gate, mine, theirs, winner: 'foe', margin: theirs.power, damage: theirs.power });
      continue;
    }
    const outcome = resolveClash(theirs, mine, false, BREAK_BONUS);
    clash.push({
      gate,
      mine,
      theirs,
      winner: outcome.winner,
      margin: outcome.margin,
      damage: outcome.margin,
    });
  }

  state.clash = clash;
  state.phase = PHASE.REVEAL;
  state.revealElapsed = 0;
  state.lastDealt = { player: 0, foe: 0 };
  return clash;
}

/** Apply the round's damage once the reveal has held long enough. */
export function settleRound(state) {
  let toFoe = 0;
  let toPlayer = 0;
  for (const entry of state.clash) {
    if (entry.winner === 'player') toFoe += entry.damage;
    if (entry.winner === 'foe') toPlayer += entry.damage;
  }
  state.foeHp = Math.max(0, state.foeHp - toFoe);
  state.hp = Math.max(0, state.hp - toPlayer);
  state.lastDealt = { player: toPlayer, foe: toFoe };

  for (const entry of state.clash) {
    if (entry.mine) state.playerDiscard.push(entry.mine);
    if (entry.theirs) state.foeDiscard.push(entry.theirs);
  }

  const line = toFoe === toPlayer
    ? `Round ${state.round}: the gates hold, ${toFoe} through on each side`
    : `Round ${state.round}: ${toFoe} to the foe, ${toPlayer} to you`;
  state.log.push(line);

  if (state.foeHp <= 0 || state.hp <= 0) {
    state.phase = PHASE.OVER;
    state.winner = state.foeHp <= 0 && state.hp <= 0 ? 'draw' : state.foeHp <= 0 ? 'player' : 'foe';
    return state.winner;
  }
  if (state.round >= DUEL.maxRound) {
    state.phase = PHASE.OVER;
    state.winner = state.hp === state.foeHp ? 'draw' : state.hp > state.foeHp ? 'player' : 'foe';
    return state.winner;
  }
  return null;
}

/** Begin the next round: both wardens draw back up, the board clears. */
export function nextRound(state, rng, clock) {
  state.round += 1;
  state.playerPlays = {};
  state.foePlays = {};
  state.clash = [];
  state.placedAt = {};
  state.handDealtAt = clock === undefined ? state.handDealtAt : clock;
  draw(state.playerHand, state.deck, state.playerDiscard, DUEL.handSize, rng);
  draw(state.foeHand, state.deck, state.foeDiscard, DUEL.handSize, rng);
  state.phase = PHASE.CHOOSE;
  state.selectedCardId = state.playerHand.length ? state.playerHand[0].id : null;
  state.selectedLane = 0;
  state.revealElapsed = 0;
}

/** Mark the moment a hand is shown, so the renderer deals it in. */
export function stampDeal(state, clock) {
  state.handDealtAt = clock;
  return state;
}

/** Advance the reveal timer; returns true when the reveal is finished and settled. */
export function tickReveal(state, dt) {
  if (state.phase !== PHASE.REVEAL) return false;
  state.revealElapsed += dt;
  return state.revealElapsed >= DUEL.revealSeconds + DUEL.damageShownSeconds;
}
