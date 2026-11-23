// Every number the duel is balanced on, and the four sigils it is played with.
// The table is a fixed 1280x720 logical field; the renderer scales it to the window,
// so nothing below depends on how large the browser is.

export const FIELD = { width: 1280, height: 720 };

/** Simulation runs on a fixed step so a screenshot scene replays identically. */
export const STEP = 1 / 60;

export const DUEL = {
  hp: 20,
  handSize: 5,
  lanes: 3,
  maxRound: 18,
  revealSeconds: 1.15,
  damageShownSeconds: 1.4,
};

/**
 * The four sigils and the wheel they turn on: each breaks one and yields to one.
 * A sigil that breaks the other adds BREAK_BONUS power in a clash, which is the
 * whole reason a smaller card can still take a gate.
 */
export const SIGILS = {
  ember: { key: 'ember', label: 'Ember', color: '#ff7a4d', edge: '#ffb591', shape: 'spike', beats: 'gale' },
  gale:  { key: 'gale',  label: 'Gale',  color: '#5fd6a4', edge: '#a8f0cf', shape: 'ring',  beats: 'frost' },
  frost: { key: 'frost', label: 'Frost', color: '#6fb6ff', edge: '#b6dcff', shape: 'hex',   beats: 'stone' },
  stone: { key: 'stone', label: 'Stone', color: '#d9b45c', edge: '#f3dfa6', shape: 'block', beats: 'ember' },
};

export const SIGIL_ORDER = ['ember', 'gale', 'frost', 'stone'];
export const BREAK_BONUS = 3;

/** Card values a deck is built from: each sigil carries one of each. */
export const CARD_VALUES = [2, 4, 6];

export const GATES = [
  { key: 'west', name: 'West Gate', x: 300 },
  { key: 'heart', name: 'Heart Gate', x: 640 },
  { key: 'east', name: 'East Gate', x: 980 },
];

export const LAYOUT = {
  handY: 556,
  handCardW: 116,
  handCardH: 150,
  handGap: 14,
  revealY: 236,
  revealCardW: 100,
  revealCardH: 136,
  foeHandY: 56,
  foeCardW: 66,
  foeCardH: 88,
  gateLabelY: 172,
  gateCardTop: 196,
  gateCardBottom: 344,
  logY: 566,
};

export const PALETTE = {
  sky0: '#120e18',
  sky1: '#1d1526',
  emberGlow: '#3a1f18',
  gate: '#2a2233',
  gateLit: '#4a3a55',
  stone: '#241d2e',
  stoneEdge: '#3a3048',
  parchment: '#f3ecdd',
  ink: '#1a1420',
  text: '#efe7f5',
  muted: '#9a90aa',
  win: '#7fe08a',
  lose: '#ff6b6b',
  warn: '#ffcf6b',
};

export const FONT = 'ui-serif, Georgia, "Times New Roman", serif';
export const FONT_UI = 'system-ui, -apple-system, "Segoe UI", sans-serif';
