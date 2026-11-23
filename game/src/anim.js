// Timing for the animations, all in seconds of a fixed step. A scene that must hold still for
// a screenshot passes `animate: false`, so the same state draws either way.

export const ANIM = {
  /** A dealt hand comes in card by card, each a little after the one before. */
  dealStagger: 0.075,
  dealDuration: 0.42,
  /** A card placed on a gate drops onto it. */
  placeDuration: 0.28,
  /** The foe's card turns over on the reveal. */
  flipDuration: 0.36,
  /** Damage numbers climb, then hold. */
  damageRise: 0.34,
  /** The winning side's gate pulses for this long after a clash is settled. */
  gateFlash: 0.7,
};

/** Ease-out cubic: fast at the start, settled at the end. */
export function easeOut(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) ** 3;
}

/** A 0..1 progress value for something that started at `elapsed` and takes `duration`. */
export function progress(elapsed, duration) {
  return Math.max(0, Math.min(1, elapsed / duration));
}
