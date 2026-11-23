// The screenshot scenes behind ?shot=start|play|reveal|win|lose. Each one plays the real
// rules forward from a fixed seed, so a frame is what a real duel looks like and the same
// seed always gives the same board.

import { PHASE, settleRound, nextRound } from './duel.js';
import { GATES } from './config.js';

/**
 * Drive the board to a scene and leave it there. `api` is the same set of functions the
 * player's mouse and keys reach, so a scene cannot show a state the game cannot reach.
 */
export function buildScene(api, scene) {
  const { state } = api;
  api.startDuel();
  const duel = state.duel;

  if (scene === 'start') {
    state.screen = 'title';
    return duel;
  }

  const rounds = scene === 'reveal' ? 3 : scene === 'play' ? 2 : 6;
  for (let i = 0; i < rounds; i += 1) {
    if (duel.phase !== PHASE.CHOOSE) break;
    placeStrongest(api);
    if (!placedCount(duel)) break;
    api.commitIfReady();
    if (duel.phase !== PHASE.REVEAL) break;

    const last = i === rounds - 1;
    if (last && scene === 'reveal') {
      duel.revealElapsed = 0.62;
      return duel;
    }
    settleRound(duel);
    if (duel.phase === PHASE.OVER) {
      // A scene must never end early on a knockout it did not ask for.
      duel.phase = PHASE.CHOOSE;
      duel.winner = null;
      duel.hp = Math.max(6, duel.hp);
      duel.foeHp = Math.max(6, duel.foeHp);
    }
    if (!last) nextRound(duel, state.rng);
  }

  if (scene === 'win') {
    duel.hp = 6;
    duel.foeHp = 0;
    duel.phase = PHASE.OVER;
    duel.winner = 'player';
    state.screen = 'over';
    return duel;
  }
  if (scene === 'lose') {
    duel.foeHp = 9;
    duel.hp = 0;
    duel.phase = PHASE.OVER;
    duel.winner = 'foe';
    state.screen = 'over';
    return duel;
  }

  // The play scene: a hand mid-round with two gates already held and a third waiting.
  if (duel.phase !== PHASE.CHOOSE) {
    nextRound(duel, state.rng);
  }
  duel.playerPlays = {};
  duel.foePlays = {};
  duel.clash = [];
  duel.phase = PHASE.CHOOSE;
  const hand = duel.playerHand;
  const picks = [0, 2];
  picks.forEach((slot, lane) => {
    const card = hand[slot];
    if (!card) return;
    api.handlePick(card.id);
    api.handleLane(lane === 0 ? 0 : 2, false);
  });
  const waiting = hand.find((card) => !Object.values(duel.playerPlays).some((c) => c.id === card.id));
  if (waiting) api.handlePick(waiting.id);
  duel.selectedLane = 1;
  state.hoveredCardId = null;
  return duel;
}

function placedCount(duel) {
  return GATES.reduce((n, gate) => n + (duel.playerPlays[gate.key] ? 1 : 0), 0);
}

/** Place the hand's strongest cards, one a gate, the way a careful player would. */
function placeStrongest(api) {
  const duel = api.state.duel;
  const order = duel.playerHand.slice().sort((a, b) => b.power - a.power);
  GATES.forEach((gate, i) => {
    const card = order[i];
    if (!card) return;
    api.handlePick(card.id);
    api.handleLane(i, false);
  });
}
