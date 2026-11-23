// The loop and the wiring: boot the duel, take input, draw the table each frame. Every
// scene the screenshots need is reached from here, so the game and its shots share one path.

import { FIELD, STEP } from './config.js';
import { makeRandom, seedFromLocation } from './random.js';
import {
  PHASE,
  newDuel,
  stampDeal,
  placeCard,
  recallCard,
  commitRound,
  settleRound,
  nextRound,
  placedEveryLane,
  nextOpenLane,
} from './duel.js';
import { drawTable, drawHud, drawHands, drawLog, drawSky, drawEmbers } from './table.js';
import { drawTitle, drawEnd, drawRules } from './screens.js';
import { bindInput } from './input.js';
import { buildScene } from './shots.js';

const canvas = document.getElementById('stage');
const announce = document.getElementById('announce');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const startScene = params.get('shot');

const state = {
  duel: null,
  rng: makeRandom(seedFromLocation(location.search)),
  screen: 'title',
  showRules: false,
  hoveredCardId: null,
  clock: 0,
};

function say(text) {
  if (announce) announce.textContent = text;
}

/** Size the canvas to the window while keeping the logical field's aspect. */
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  const w = Math.round(FIELD.width * scale);
  const h = Math.round(FIELD.height * scale);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
}

function startDuel() {
  state.duel = newDuel(state.rng, seedFromLocation(location.search));
  state.duel.phase = PHASE.CHOOSE;
  state.duel.selectedCardId = state.duel.playerHand[0] ? state.duel.playerHand[0].id : null;
  state.duel.selectedLane = 0;
  state.screen = 'duel';
  stampDeal(state.duel, state.clock);
  say('The gate opens. Choose a card, then a gate.');
}

function handlePick(cardId) {
  const duel = state.duel;
  if (!duel || duel.phase !== PHASE.CHOOSE) return;
  duel.selectedCardId = cardId;
  const card = duel.playerHand.find((c) => c.id === cardId);
  if (card) say(`${card.name} chosen. Choose a gate.`);
}

/** Place the chosen card on a gate, or take back what stands there with shift. */
function handleLane(lane, shift) {
  const duel = state.duel;
  if (!duel || duel.phase !== PHASE.CHOOSE) return;
  duel.selectedLane = lane;
  if (shift) {
    recallCard(duel, lane);
    return;
  }
  const cardId = duel.selectedCardId ?? (duel.playerHand[0] && duel.playerHand[0].id);
  if (cardId == null) return;
  placeCard(duel, cardId, lane, state.clock);
  if (placedEveryLane(duel)) {
    say('All gates held. Press Enter to commit the round.');
    commitIfReady();
  } else {
    duel.selectedLane = nextOpenLane(duel);
    say('Card placed. Choose the next gate.');
  }
}

function commitIfReady() {
  const duel = state.duel;
  if (!duel || duel.phase !== PHASE.CHOOSE) return;
  if (!placedEveryLane(duel)) return;
  commitRound(duel);
  say('The gates answer.');
}

function handleConfirm() {
  if (state.screen === 'title') {
    if (state.showRules) {
      state.showRules = false;
      return;
    }
    startDuel();
    return;
  }
  if (state.screen === 'over') {
    startDuel();
    return;
  }
  const duel = state.duel;
  if (duel && duel.phase === PHASE.CHOOSE) commitIfReady();
}

function handleRecall() {
  const duel = state.duel;
  if (!duel || duel.phase !== PHASE.CHOOSE) return;
  recallCard(duel, duel.selectedLane);
}

function handleEscape() {
  if (state.showRules) {
    state.showRules = false;
    return;
  }
  if (state.screen !== 'title') state.screen = 'title';
}

function handleLaneShift(dir) {
  const duel = state.duel;
  if (!duel || duel.phase !== PHASE.CHOOSE) return;
  duel.selectedLane = (duel.selectedLane + dir + 3) % 3;
}

function handleHandShift(dir) {
  const duel = state.duel;
  if (!duel || duel.phase !== PHASE.CHOOSE) return;
  const hand = duel.playerHand;
  if (!hand.length) return;
  const at = hand.findIndex((c) => c.id === duel.selectedCardId);
  const next = ((at === -1 ? 0 : at) + dir + hand.length) % hand.length;
  duel.selectedCardId = hand[next].id;
}

/** Clicks that land on no card and no gate: the title's menu and the end screen. */
function handleAny(point) {
  if (state.screen === 'title') {
    if (state.showRules) {
      state.showRules = false;
      return;
    }
    if (point && point.y >= 440) {
      state.showRules = true;
      say('How the wheel turns.');
      return;
    }
    if (point && point.y >= 376) startDuel();
    return;
  }
  if (state.screen === 'over') startDuel();
}

/** The reveal holds for a beat, settles, then opens the next round. */
function advanceReveal(dt) {
  const duel = state.duel;
  duel.revealElapsed = (duel.revealElapsed || 0) + dt;
  if (duel.revealElapsed < 1.15) return;
  const winner = settleRound(duel);
  if (winner) {
    state.screen = 'over';
    say(winner === 'player' ? 'You hold the gate.' : winner === 'draw' ? 'A drawn line.' : 'You fall.');
    return;
  }
  duel.revealElapsed = 1.15;
  if (duel.revealElapsed >= 1.55) {
    nextRound(duel, state.rng, state.clock);
    say('A new round. Choose a card, then a gate.');
  }
}

function update(dt) {
  const duel = state.duel;
  if (!duel) return;
  if (duel.phase === PHASE.REVEAL) {
    if ((duel.revealElapsed || 0) < 1.15) {
      advanceReveal(dt);
    } else {
      duel.revealElapsed += dt;
      if (duel.revealElapsed >= 1.55) {
        nextRound(duel, state.rng, state.clock);
        say('A new round. Choose a card, then a gate.');
      }
    }
  }
}

/**
 * The title's own backdrop: the dusk sky and the drifting embers, and none of the table's
 * furniture. A title that shows the gates and the empty slots behind its own type reads as a
 * double exposure; this keeps the door and drops the room.
 */
function drawTitleBackdrop(ctx, t) {
  drawSky(ctx);
  drawEmbers(ctx, t);
}

function render() {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  state.clock += STEP;
  const duel = state.duel;

  if (state.screen === 'title') {
    drawTitleBackdrop(ctx, state.clock);
    drawTitle(ctx, state.clock);
    if (state.showRules) drawRules(ctx);
    return;
  }
  drawTable(ctx, duel, state.clock);
  drawHands(ctx, duel, state.hoveredCardId, state.clock);
  drawHud(ctx, duel);
  drawLog(ctx, duel);
  if (state.screen === 'over' || duel.phase === PHASE.OVER) drawEnd(ctx, duel, state.clock);
}

bindInput(canvas, {
  state: () => state.duel || { playerHand: [], phase: PHASE.TITLE },
  onPick: handlePick,
  onLane: handleLane,
  onConfirm: handleConfirm,
  onRecall: handleRecall,
  onEscape: handleEscape,
  onLaneShift: handleLaneShift,
  onHandShift: handleHandShift,
  onAny: handleAny,
  onHover: (id) => {
    state.hoveredCardId = id;
  },
});

window.addEventListener('resize', resize);
resize();

let last = 0;
function frame(time) {
  const now = time / 1000;
  if (last === 0) last = now;
  const dt = Math.min(0.1, now - last);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// The screenshot scenes drive the same functions the player does, then stop the loop's
// own advance so the frame holds still for the camera.
if (startScene) {
  buildScene({ startDuel, state, handlePick, handleLane, commitIfReady }, startScene);
  state.clock = 1.6;
  render();
} else {
  requestAnimationFrame(frame);
}

// Keep the loop reachable for a scene that settles asynchronously.
window.__emberfall = { state, render, startDuel };
