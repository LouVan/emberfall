// The table: the Sundered Gate at dusk, three gates across it, two wardens' hands and the
// life totals. Everything is drawn into the same 1280x720 logical field and scaled once.

import { FIELD, GATES, LAYOUT, PALETTE, FONT, FONT_UI, SIGIL_ORDER, SIGILS } from './config.js';
import { drawCard, drawCardBack, drawSigil, roundRect } from './cards-draw.js';
import { PHASE, placedEveryLane } from './duel.js';

/** The backdrop: a dusk sky, the broken arch, embers drifting up. */
export function drawTable(ctx, state, t) {
  const { width, height } = FIELD;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, PALETTE.sky0);
  sky.addColorStop(0.52, PALETTE.sky1);
  sky.addColorStop(1, '#150f1c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Low ember glow behind the arch, so the eye lands mid-table.
  const glow = ctx.createRadialGradient(width / 2, 300, 40, width / 2, 300, 520);
  glow.addColorStop(0, 'rgba(255, 138, 90, 0.16)');
  glow.addColorStop(1, 'rgba(255, 138, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  drawArch(ctx);
  drawEmbers(ctx, t);

  // The stone floor the hands rest on.
  const floor = ctx.createLinearGradient(0, 470, 0, height);
  floor.addColorStop(0, 'rgba(20, 15, 26, 0)');
  floor.addColorStop(0.4, 'rgba(16, 12, 22, 0.86)');
  floor.addColorStop(1, '#0e0a14');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 440, width, height - 440);

  drawGateLine(ctx, state, t);
}

/** The Sundered Gate: two stone pillars and a broken arch over the middle gate. */
function drawArch(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(96, 78, 118, 0.42)';
  ctx.lineWidth = 26;
  ctx.lineCap = 'butt';

  ctx.beginPath();
  ctx.moveTo(58, 60);
  ctx.lineTo(58, 452);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1222, 60);
  ctx.lineTo(1222, 452);
  ctx.stroke();

  // The arch, broken at the keystone: two unequal spans that do not meet.
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(640, 300, 348, Math.PI * 1.06, Math.PI * 1.52);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(640, 300, 348, Math.PI * 1.62, Math.PI * 1.94);
  ctx.stroke();

  // Carved sigils on the pillars, one on each side.
  ctx.globalAlpha = 0.26;
  drawSigil(ctx, SIGILS.ember, 58, 200, 32, false);
  drawSigil(ctx, SIGILS.frost, 1222, 200, 32, false);
  drawSigil(ctx, SIGILS.gale, 58, 340, 24, false);
  drawSigil(ctx, SIGILS.stone, 1222, 340, 24, false);
  ctx.restore();
}

/** Slow embers rising off the floor; they wrap so the loop never needs a reset. */
function drawEmbers(ctx, t) {
  ctx.save();
  for (let i = 0; i < 26; i += 1) {
    const lane = (i * 97) % FIELD.width;
    const speed = 16 + (i % 7) * 9;
    const drift = Math.sin(t * 0.5 + i) * 14;
    const y = FIELD.height - ((t * speed + i * 61) % (FIELD.height + 80));
    const size = 1.3 + (i % 4) * 0.9;
    const alpha = 0.10 + (i % 5) * 0.05;
    ctx.fillStyle = `rgba(255, 168, 112, ${alpha})`;
    ctx.beginPath();
    ctx.arc(lane + drift, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The three gates, the clash held on them, and the round's damage numbers. */
function drawGateLine(ctx, state, t) {
  GATES.forEach((gate, index) => {
    const mine = state.playerPlays[gate.key];
    const theirs = state.foePlays[gate.key];
    const entry = state.clash.find((c) => c.gate.key === gate.key);
    const hovered = state.phase === PHASE.CHOOSE && state.selectedLane === index;
    const cx = gate.x;

    // Gate pool of light.
    const pool = ctx.createRadialGradient(cx, 270, 10, cx, 270, 150);
    const lit = hovered ? 0.3 : 0.14;
    pool.addColorStop(0, `rgba(214, 176, 255, ${lit})`);
    pool.addColorStop(1, 'rgba(214, 176, 255, 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(cx, 270, 150, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gate name and a rule under it.
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = hovered ? PALETTE.text : PALETTE.muted;
    ctx.font = `600 16px ${FONT_UI}`;
    ctx.fillText(gate.name.toUpperCase(), cx, LAYOUT.gateLabelY);
    ctx.strokeStyle = hovered ? 'rgba(214, 176, 255, 0.65)' : 'rgba(154, 144, 170, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 46, LAYOUT.gateLabelY + 10);
    ctx.lineTo(cx + 46, LAYOUT.gateLabelY + 10);
    ctx.stroke();
    ctx.restore();

    // The empty slot, so a gate reads as a place a card goes.
    if (!theirs) {
      ctx.save();
      ctx.strokeStyle = hovered ? 'rgba(214, 176, 255, 0.42)' : 'rgba(154, 144, 170, 0.16)';
      ctx.setLineDash([7, 7]);
      ctx.lineWidth = 1.5;
      roundRect(
        ctx,
        cx - LAYOUT.revealCardW / 2,
        LAYOUT.gateCardTop,
        LAYOUT.revealCardW,
        LAYOUT.revealCardH,
        10,
      );
      ctx.stroke();
      ctx.restore();
    }
    if (!mine) {
      ctx.save();
      ctx.strokeStyle = hovered ? 'rgba(214, 176, 255, 0.5)' : 'rgba(154, 144, 170, 0.2)';
      ctx.setLineDash([7, 7]);
      ctx.lineWidth = 1.5;
      roundRect(
        ctx,
        cx - LAYOUT.revealCardW / 2,
        LAYOUT.gateCardBottom,
        LAYOUT.revealCardW,
        LAYOUT.revealCardH,
        10,
      );
      ctx.stroke();
      ctx.restore();
    }

    // What stands on the gate: the foe above, the player below.
    if (theirs) {
      drawCard(ctx, theirs, cx - LAYOUT.revealCardW / 2, LAYOUT.gateCardTop, LAYOUT.revealCardW, LAYOUT.revealCardH, {
        lift: 8,
        selected: entry && entry.winner === 'foe' && state.phase === PHASE.REVEAL,
        dim: state.phase === PHASE.REVEAL && entry && entry.winner !== 'foe',
      });
    }
    if (mine) {
      drawCard(ctx, mine, cx - LAYOUT.revealCardW / 2, LAYOUT.gateCardBottom, LAYOUT.revealCardW, LAYOUT.revealCardH, {
        lift: 8,
        selected: entry && entry.winner === 'player' && state.phase === PHASE.REVEAL,
        dim: state.phase === PHASE.REVEAL && entry && entry.winner !== 'player',
      });
    }

    // The break bonus, called out where it decided a gate.
    if (entry && entry.mine && entry.theirs && state.phase === PHASE.REVEAL) {
      const breaking = SIGILS[entry.mine.sigil].beats === entry.theirs.sigil;
      const broken = SIGILS[entry.theirs.sigil].beats === entry.mine.sigil;
      if (breaking || broken) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = breaking ? PALETTE.win : PALETTE.lose;
        ctx.font = `700 13px ${FONT_UI}`;
        ctx.fillText(breaking ? 'SIGIL BREAK +3' : 'BROKEN BY SIGIL', cx, 496);
        ctx.restore();
      }
    }

    // Damage floating off a won gate.
    if (entry && state.phase === PHASE.REVEAL && entry.winner) {
      const rise = Math.min(1, state.revealElapsed / 0.5);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, (state.revealElapsed - 0.9) / 0.6));
      ctx.textAlign = 'center';
      ctx.fillStyle = entry.winner === 'player' ? PALETTE.win : PALETTE.lose;
      ctx.font = `800 34px ${FONT}`;
      ctx.fillText(`-${entry.damage}`, cx, 538 - rise * 14);
      ctx.restore();
    }
  });
}

/** Life totals, round counter, and the wheel legend that explains the four sigils. */
export function drawHud(ctx, state) {
  ctx.save();
  drawLife(ctx, 74, 30, 'YOU', state.hp, PALETTE.win, state.hp / 20, 'left');
  drawLife(ctx, FIELD.width - 74, 30, 'THE OTHER WARDEN', state.foeHp, PALETTE.lose, state.foeHp / 20, 'right');

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 13px ${FONT_UI}`;
  ctx.fillText(`ROUND ${state.round} OF 18`, FIELD.width / 2, 32);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 21px ${FONT}`;
  const phrase = state.phase === PHASE.CHOOSE
    ? (placedEveryLane(state) ? 'All gates held — commit the round' : 'Choose a card, then a gate')
    : state.phase === PHASE.REVEAL ? 'The gates answer' : '';
  ctx.fillText(phrase, FIELD.width / 2, 58);
  ctx.restore();

  drawWheelLegend(ctx);
}

/** A life total with a bar under it; `align` right puts the bar under the right edge. */
function drawLife(ctx, x, y, who, value, colour, fraction, align) {
  ctx.save();
  ctx.textAlign = align === 'right' ? 'right' : 'left';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 12px ${FONT_UI}`;
  ctx.fillText(who, x, y);
  ctx.fillStyle = colour;
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText(String(value), x, y + 42);

  const barW = 168;
  const barX = align === 'right' ? x - barW : x;
  const barY = y + 54;
  roundRect(ctx, barX, barY, barW, 7, 3.5);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fill();
  const filled = Math.max(0, Math.min(1, fraction));
  if (filled > 0) {
    roundRect(ctx, align === 'right' ? barX + barW * (1 - filled) : barX, barY, barW * filled, 7, 3.5);
    ctx.fillStyle = colour;
    ctx.fill();
  }
  ctx.restore();
}

/** The wheel, far left: each sigil stacked with the one it breaks, the game's one rule. */
function drawWheelLegend(ctx) {
  ctx.save();
  const x = 60;
  let y = 402;
  ctx.fillStyle = 'rgba(154, 144, 170, 0.8)';
  ctx.font = `600 11px ${FONT_UI}`;
  ctx.textAlign = 'left';
  ctx.fillText('THE WHEEL', x, y);
  y += 24;

  SIGIL_ORDER.forEach((key) => {
    const spec = SIGILS[key];
    drawSigil(ctx, spec, x + 8, y - 4, 14, false);
    ctx.fillStyle = 'rgba(200, 190, 214, 0.8)';
    ctx.font = `600 11px ${FONT_UI}`;
    ctx.fillText(spec.label, x + 24, y);
    y += 20;
  });

  ctx.fillStyle = 'rgba(154, 144, 170, 0.6)';
  ctx.font = `500 10px ${FONT_UI}`;
  ctx.fillText('each breaks the next, +3', x, y + 2);
  ctx.restore();
}

/** The player's hand along the bottom, the foe's face-down hand along the top. */
export function drawHands(ctx, state, hoveredCardId) {
  const { handY, handCardW, handCardH, handGap } = LAYOUT;
  const hand = state.playerHand;
  const totalW = hand.length * handCardW + Math.max(0, hand.length - 1) * handGap;
  let x = (FIELD.width - totalW) / 2;

  hand.forEach((card) => {
    const selected = state.selectedCardId === card.id;
    const placed = Object.values(state.playerPlays).some((c) => c.id === card.id);
    const lift = selected ? 16 : hoveredCardId === card.id ? 8 : 0;
    drawCard(ctx, card, x, handY - lift, handCardW, handCardH, {
      selected,
      dim: placed,
      lift: lift + 6,
    });
    if (placed) {
      // A committed card keeps its place in the hand but is ringed, so the row never shifts.
      ctx.save();
      ctx.strokeStyle = 'rgba(127, 224, 138, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      roundRect(ctx, x - 3, handY - 3, handCardW + 6, handCardH + 6, 14);
      ctx.stroke();
      ctx.restore();
    }
    x += handCardW + handGap;
  });

  // The foe's hand: backs only, so no information leaks through it.
  const foeCount = state.foeHand.length;
  const { foeCardW, foeCardH, foeHandY } = LAYOUT;
  const foeTotal = foeCount * foeCardW + Math.max(0, foeCount - 1) * 9;
  let fx = (FIELD.width - foeTotal) / 2;
  for (let i = 0; i < foeCount; i += 1) {
    drawCardBack(ctx, fx, foeHandY, foeCardW, foeCardH, i);
    fx += foeCardW + 9;
  }
}

/** The log's last three lines, bottom-left under the wheel, clear of the gates and the hand. */
export function drawLog(ctx, state) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = `500 12px ${FONT_UI}`;
  const lines = state.log.slice(-2);
  lines.forEach((line, i) => {
    const last = i === lines.length - 1;
    ctx.fillStyle = last ? 'rgba(239, 231, 245, 0.85)' : 'rgba(154, 144, 170, 0.42)';
    ctx.fillText(trimTo(ctx, line, 250), 60, 536 + i * 17);
  });
  ctx.restore();
}

/** Shorten a line to fit a width, with an ellipsis, so the log never runs into the hand. */
function trimTo(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 4 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}
