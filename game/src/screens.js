// The three drawn screens: the title, the end of a duel, and the small overlays the table
// needs. Split from table.js so the table stays a table.

import { FIELD, PALETTE, FONT, FONT_UI, SIGILS, SIGIL_ORDER } from './config.js';
import { drawSigil, roundRect } from './cards-draw.js';

/** The title screen: the name, the wheel, the two ways in. */
export function drawTitle(ctx, t) {
  const { width, height } = FIELD;

  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, 'rgba(13, 11, 18, 0.93)');
  veil.addColorStop(0.6, 'rgba(13, 11, 18, 0.86)');
  veil.addColorStop(1, 'rgba(13, 11, 18, 0.96)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, width, height);

  // The four sigils, slowly turning far behind the name, well clear of the type.
  ctx.save();
  // Pushed wide, so no ambient sigil sits behind the menu's own type.
  const corners = [
    { x: 168, y: 168 },
    { x: 1112, y: 168 },
    { x: 168, y: 556 },
    { x: 1112, y: 556 },
  ];
  SIGIL_ORDER.forEach((key, i) => {
    const bob = Math.sin(t * 0.4 + i * 1.7) * 10;
    ctx.globalAlpha = 0.15;
    drawSigil(ctx, SIGILS[key], corners[i].x, corners[i].y + bob, 96, false);
  });
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(255, 138, 90, 0.72)';
  ctx.font = `600 14px ${FONT_UI}`;
  ctx.fillText('A DUEL OF CARDS AT THE SUNDERED GATE', 640, 138);

  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `700 100px ${FONT}`;
  ctx.fillText('EMBERFALL', 640, 244);

  const rule = ctx.createLinearGradient(360, 0, 920, 0);
  rule.addColorStop(0, 'rgba(255, 138, 90, 0)');
  rule.addColorStop(0.5, 'rgba(255, 176, 130, 0.85)');
  rule.addColorStop(1, 'rgba(255, 138, 90, 0)');
  ctx.fillStyle = rule;
  ctx.fillRect(360, 266, 560, 2);

  ctx.fillStyle = 'rgba(216, 205, 230, 0.84)';
  ctx.font = `400 22px ${FONT}`;
  ctx.fillText('Three gates. Four sigils. One warden stands.', 640, 308);
  ctx.fillStyle = 'rgba(190, 178, 208, 0.6)';
  ctx.font = `400 17px ${FONT}`;
  ctx.fillText('A sigil breaks the one beside it on the wheel: +3 power where it does.', 640, 338);

  ctx.restore();

  drawTitleMenu(ctx);
  drawTitleWheel(ctx);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(154, 144, 170, 0.45)';
  ctx.font = `500 12px ${FONT_UI}`;
  ctx.fillText('Mouse or number keys to choose · arrows to move · Enter to commit · R to recall', 640, 700);
  ctx.restore();
}

/** The two menu entries: enter the gate, or read how the wheel turns. */
function drawTitleMenu(ctx) {
  const items = [
    { label: 'ENTER THE GATE', sub: 'begin a duel', y: 388, primary: true },
    { label: 'HOW THE WHEEL TURNS', sub: 'read the rules', y: 452, primary: false },
  ];
  ctx.save();
  ctx.textAlign = 'center';
  items.forEach((item) => {
    const w = 360;
    const h = 50;
    const x = 640 - w / 2;
    roundRect(ctx, x, item.y, w, h, 8);
    ctx.fillStyle = item.primary ? 'rgba(255, 138, 90, 0.16)' : 'rgba(214, 176, 255, 0.07)';
    ctx.fill();
    ctx.strokeStyle = item.primary ? 'rgba(255, 176, 130, 0.75)' : 'rgba(214, 176, 255, 0.3)';
    ctx.lineWidth = item.primary ? 2 : 1.4;
    ctx.stroke();
    ctx.fillStyle = item.primary ? PALETTE.parchment : 'rgba(216, 205, 230, 0.86)';
    ctx.font = `700 18px ${FONT_UI}`;
    ctx.fillText(item.label, 640, item.y + 24);
    ctx.fillStyle = 'rgba(154, 144, 170, 0.66)';
    ctx.font = `500 11px ${FONT_UI}`;
    ctx.fillText(item.sub, 640, item.y + 40);
  });
  ctx.restore();
}

/** The wheel drawn as a wheel: four sigils around a ring, each breaking the next. */
function drawTitleWheel(ctx) {
  ctx.save();
  const cx = 640;
  const cy = 592;
  const r = 44;
  ctx.strokeStyle = 'rgba(214, 176, 255, 0.16)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // The direction of the wheel, so it reads as a cycle and not a list.
  ctx.fillStyle = 'rgba(154, 144, 170, 0.5)';
  ctx.font = `600 10px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText('BREAKS', cx, cy + 4);

  SIGIL_ORDER.forEach((key, i) => {
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    drawSigil(ctx, SIGILS[key], x, y, 24, false);
  });
  ctx.restore();
}

/** The end screen: win, loss or a drawn gate, with the tally and a way back. */
export function drawEnd(ctx, state, t) {
  const { width, height } = FIELD;
  const win = state.winner === 'player';
  const draw = state.winner === 'draw';
  const clock = t === undefined ? 0 : t;

  ctx.save();
  const veil = ctx.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, 'rgba(10, 8, 14, 0.88)');
  veil.addColorStop(1, 'rgba(10, 8, 14, 0.96)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, width, height);

  // On a win the four sigils lift behind the panel, one after another, as the flourish.
  if (win) {
    ctx.save();
    SIGIL_ORDER.forEach((key, i) => {
      const rise = Math.max(0, Math.min(1, (clock - i * 0.1) / 1.0));
      if (rise <= 0) return;
      // They rise out of the floor and come to rest in the band above the panel, where the
      // verdict's own light does not wash them out.
      const x = 640 + (i - 1.5) * 150;
      const y = 300 - rise * 172;
      ctx.globalAlpha = 0.42 * Math.min(1, rise * 1.6);
      drawSigil(ctx, SIGILS[key], x, y, 54 + rise * 22, true);
    });
    ctx.restore();
  }

  // A solid panel, so the gates behind never bleed through the verdict.
  roundRect(ctx, 288, 168, 704, 388, 16);
  const panel = ctx.createLinearGradient(0, 168, 0, 556);
  panel.addColorStop(0, 'rgba(26, 21, 34, 0.97)');
  panel.addColorStop(1, 'rgba(16, 12, 22, 0.99)');
  ctx.fillStyle = panel;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 176, 130, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  const tint = draw ? PALETTE.warn : win ? PALETTE.win : PALETTE.lose;
  const glow = ctx.createRadialGradient(640, 300, 20, 640, 300, 420);
  glow.addColorStop(0, draw ? 'rgba(255,207,107,0.16)' : win ? 'rgba(127,224,138,0.16)' : 'rgba(255,107,107,0.14)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = tint;
  ctx.font = `600 14px ${FONT_UI}`;
  ctx.fillText(draw ? 'THE GATE HOLDS' : win ? 'THE GATE IS YOURS' : 'THE GATE IS LOST', 640, 212);

  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `700 78px ${FONT}`;
  ctx.fillText(draw ? 'A DRAWN LINE' : win ? 'YOU HOLD' : 'YOU FALL', 640, 300);

  ctx.fillStyle = 'rgba(216, 205, 230, 0.8)';
  ctx.font = `400 19px ${FONT}`;
  ctx.fillText(`You ${state.hp} · the other warden ${state.foeHp} · ${state.round} rounds fought`, 640, 342);

  // The last two round lines, so the verdict has its reasons under it.
  ctx.font = `500 14px ${FONT_UI}`;
  state.log.slice(-2).forEach((line, i) => {
    ctx.fillStyle = 'rgba(154, 144, 170, 0.7)';
    ctx.fillText(line, 640, 382 + i * 21);
  });

  const w = 360;
  const h = 50;
  const x = 640 - w / 2;
  const y = 442;
  roundRect(ctx, x, y, w, h, 8);
  const cta = ctx.createLinearGradient(x, y, x, y + h);
  cta.addColorStop(0, 'rgba(255, 150, 100, 0.34)');
  cta.addColorStop(1, 'rgba(255, 130, 80, 0.20)');
  ctx.fillStyle = cta;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 190, 150, 0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff6ec';
  ctx.font = `700 18px ${FONT_UI}`;
  ctx.fillText('DUEL AGAIN', 640, y + 31);

  ctx.fillStyle = 'rgba(154, 144, 170, 0.45)';
  ctx.font = `500 12px ${FONT_UI}`;
  ctx.fillText('Press Enter or click to take the gate again', 640, 532);
  ctx.restore();
}

/** The rules overlay the title's second entry opens. */
export function drawRules(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 14, 0.93)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.parchment;
  ctx.font = `700 42px ${FONT}`;
  ctx.fillText('HOW THE WHEEL TURNS', 640, 118);

  const rules = [
    ['THE GATES', 'Three gates stand between you and the other warden. Each round you place one card on every gate you can.'],
    ['THE CLASH', 'A gate goes to the higher power, and only the margin deals damage. A gate one side leaves open is taken for full power.'],
    ['THE WHEEL', 'Ember breaks Gale, Gale breaks Frost, Frost breaks Stone, Stone breaks Ember. A card that breaks its rival adds 3 power.'],
    ['THE HAND', 'Five cards a round, drawn from one deck. A card played is gone until the deck runs dry and the discards return.'],
    ['THE END', 'The first warden to 0 falls. If both still stand at round 18, the higher life takes the gate.'],
  ];

  ctx.textAlign = 'left';
  let y = 186;
  for (const [head, body] of rules) {
    ctx.fillStyle = 'rgba(255, 176, 130, 0.9)';
    ctx.font = `700 14px ${FONT_UI}`;
    ctx.fillText(head, 232, y);
    ctx.fillStyle = 'rgba(216, 205, 230, 0.82)';
    ctx.font = `400 16px ${FONT}`;
    const last = wrapText(ctx, body, 232, y + 24, 816, 23);
    y = last + 44;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(154, 144, 170, 0.55)';
  ctx.font = `500 12px ${FONT_UI}`;
  ctx.fillText('Press Esc or click to return to the gate', 640, 668);
  ctx.restore();
}

/** Break a paragraph into lines no wider than `maxWidth`; returns the last baseline used. */
export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cursor = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) ctx.fillText(line, x, cursor);
  return cursor;
}
