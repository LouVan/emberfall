// A deterministic generator, so a screenshot scene and a replayed move always deal the
// same cards. Nothing here reads the clock.

/** mulberry32: small, fast, and the same sequence for the same seed forever. */
export function makeRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seed out of the URL when one is given, so ?seed=7 shows one fixed duel. */
export function seedFromLocation(search) {
  const match = /[?&]seed=(\d+)/.exec(search || '');
  return match ? Number(match[1]) >>> 0 : 20261123;
}
