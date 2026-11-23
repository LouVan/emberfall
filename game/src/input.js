// Mouse and keyboard, turned into table actions. The hit boxes are the same numbers the
// renderer draws with, so a click lands where the card looks.

import { FIELD, GATES, LAYOUT } from './config.js';

/** Which hand card, if any, sits under a point in field space. */
export function cardAt(state, x, y) {
  const hand = state.playerHand;
  const { handCardW, handCardH, handGap } = LAYOUT;
  const totalW = hand.length * handCardW + Math.max(0, hand.length - 1) * handGap;
  const startX = (FIELD.width - totalW) / 2;
  // Generous vertical band: a card is lifted when chosen, so the band reaches above it.
  if (y < LAYOUT.handY - 24 || y > LAYOUT.handY + handCardH + 10) return null;
  for (let i = 0; i < hand.length; i += 1) {
    const cx = startX + i * (handCardW + handGap);
    if (x >= cx && x <= cx + handCardW) return hand[i].id;
  }
  return null;
}

/** Which gate, if any, a point falls on. */
export function laneAt(x, y) {
  if (y < 190 || y > 470) return -1;
  for (let i = 0; i < GATES.length; i += 1) {
    if (Math.abs(x - GATES[i].x) <= 90) return i;
  }
  return -1;
}

/** Where a point is, in the canvas's logical field, whatever the window's size. */
export function toField(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
  const offsetX = (rect.width - FIELD.width * scale) / 2;
  const offsetY = (rect.height - FIELD.height * scale) / 2;
  return {
    x: (event.clientX - rect.left - offsetX) / scale,
    y: (event.clientY - rect.top - offsetY) / scale,
  };
}

/** Attach the listeners once; `handlers` gets onPick, onLane, onConfirm, onRecall, onRestart, onAny. */
export function bindInput(canvas, handlers) {
  canvas.addEventListener('mousemove', (event) => {
    const point = toField(canvas, event);
    const id = cardAt(handlers.state(), point.x, point.y);
    handlers.onHover(id, laneAt(point.x, point.y));
  });

  canvas.addEventListener('click', (event) => {
    const point = toField(canvas, event);
    const lane = laneAt(point.x, point.y);
    const id = cardAt(handlers.state(), point.x, point.y);
    if (id !== null) {
      handlers.onPick(id);
      return;
    }
    if (lane !== -1) {
      handlers.onLane(lane, event.shiftKey);
      return;
    }
    handlers.onAny(point);
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key >= '1' && key <= '9') {
      const index = Number(key) - 1;
      const hand = handlers.state().playerHand;
      if (hand[index]) handlers.onPick(hand[index].id);
      return;
    }
    if (key === 'ArrowLeft' || key === 'a') handlers.onLaneShift(-1);
    else if (key === 'ArrowRight' || key === 'd') handlers.onLaneShift(1);
    else if (key === 'ArrowUp' || key === 'w') handlers.onHandShift(-1);
    else if (key === 'ArrowDown' || key === 's') handlers.onHandShift(1);
    else if (key === 'Enter' || key === ' ') handlers.onConfirm();
    else if (key === 'r' || key === 'R') handlers.onRecall();
    else if (key === 'Escape') handlers.onEscape();
    else handlers.onAny(null);
  });
}
