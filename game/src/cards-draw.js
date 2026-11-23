// A sigil drawn as a shape, a card face with its frame and its corner pips, and the card
// back. Every sigil is told apart by shape before colour, so a card reads at thumbnail size
// and to a player who cannot separate the hues.

import { SIGILS } from './config.js';

/**
 * Draw a sigil glyph centred on (cx, cy) at `size` across. `lit` brightens the outline for a
 * card that is committed or winning; the shape itself never changes with state.
 */
export function drawSigil(ctx, sigil, cx, cy, size, lit) {
  const r = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = sigil.color;
  ctx.strokeStyle = lit ? sigil.edge : sigil.color;
  ctx.lineWidth = Math.max(1.6, size * 0.08);
  ctx.lineJoin = 'round';
  ctx.beginPath();

  switch (sigil.shape) {
    case 'spike': {
      // Ember: a five-pointed burst, the notch between each arm deep and sharp.
      for (let i = 0; i < 10; i += 1) {
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const radius = i % 2 === 0 ? r : r * 0.44;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'ring': {
      // Gale: an open ring with three wind strokes drawn through it.
      ctx.arc(0, 0, r * 0.74, Math.PI * 0.16, Math.PI * 1.7);
      ctx.lineWidth = size * 0.15;
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 3; i += 1) {
        const y = -r * 0.26 + i * r * 0.3;
        const long = i === 1 ? r * 0.5 : r * 0.34;
        ctx.moveTo(-r * 0.44, y);
        ctx.lineTo(-r * 0.44 + long, y);
      }
      ctx.lineWidth = size * 0.09;
      ctx.stroke();
      break;
    }
    case 'hex': {
      // Frost: a six-sided crystal, faceted so it glints even small.
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(r * 0.42, 0);
      ctx.lineTo(0, r * 0.5);
      ctx.lineTo(-r * 0.42, 0);
      ctx.closePath();
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }
    default: {
      // Stone: a boulder with one chipped corner, deliberately not a polygon.
      const s = r * 0.9;
      ctx.moveTo(-s, -s * 0.68);
      ctx.lineTo(s * 0.24, -s);
      ctx.lineTo(s, -s * 0.14);
      ctx.lineTo(s * 0.74, s);
      ctx.lineTo(-s * 0.82, s * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/**
 * A card face. Parchment body, a frame in the sigil's colour, the sigil on its tile, the
 * power large, and a pip in two opposite corners so the value still reads in a fanned hand.
 * `flip` (0..1) turns the card about its vertical axis, for the reveal.
 */
export function drawCard(ctx, card, x, y, w, h, opts) {
  const o = opts || {};
  const spec = SIGILS[card.sigil];
  const radius = Math.round(w * 0.09);
  // flip: 1 is face up, 0 is the back. Below halfway the back is what shows.
  const flip = o.flip === undefined ? 1 : o.flip;
  const squash = Math.abs(Math.cos(Math.PI * (flip - 1)));
  if (flip < 0.5) {
    drawCardBack(ctx, x + (w * (1 - squash)) / 2, y, w * squash, h, undefined);
    return;
  }

  ctx.save();
  const halfW = (w * squash) / 2;
  const drawX = x + w / 2 - halfW;

  if (o.lift) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = o.lift * 1.6;
    ctx.shadowOffsetY = o.lift * 0.5;
  }

  // Body: parchment, warmer at the top edge where the light falls.
  roundRect(ctx, drawX, y, halfW * 2, h, radius);
  const body = ctx.createLinearGradient(drawX, y, drawX, y + h);
  body.addColorStop(0, o.dim ? '#cfc6b5' : '#f8f2e5');
  body.addColorStop(0.55, o.dim ? '#bdb3a0' : '#e9dfc9');
  body.addColorStop(1, o.dim ? '#a99f8d' : '#d3c7ae');
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Frame: a dark outer line and a sigil-coloured inner line, like a printed card.
  ctx.lineWidth = Math.max(2, w * 0.024);
  ctx.strokeStyle = o.selected ? spec.edge : 'rgba(28, 22, 34, 0.72)';
  ctx.stroke();
  roundRect(ctx, drawX + w * 0.055, y + h * 0.035, halfW * 2 - w * 0.11, h - h * 0.07, radius * 0.7);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = o.dim ? 'rgba(120, 112, 130, 0.5)' : spec.color;
  ctx.globalAlpha = 0.55;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (o.selected) {
    roundRect(ctx, drawX - 4, y - 4, halfW * 2 + 8, h + 8, radius + 4);
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }

  // Sigil tile across the upper half.
  const tileX = drawX + w * 0.13;
  const tileY = y + h * 0.09;
  const tileW = halfW * 2 - w * 0.26;
  const tileH = h * 0.4;
  roundRect(ctx, tileX, tileY, tileW, tileH, radius * 0.62);
  const tile = ctx.createLinearGradient(tileX, tileY, tileX, tileY + tileH);
  tile.addColorStop(0, spec.color);
  tile.addColorStop(1, shade(spec.color, -0.34));
  ctx.globalAlpha = o.dim ? 0.42 : 0.9;
  ctx.fillStyle = tile;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = o.dim ? 'rgba(90, 84, 100, 0.5)' : spec.edge;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  drawSigil(ctx, spec, tileX + tileW / 2, tileY + tileH / 2, Math.min(tileW, tileH) * 0.62, !o.dim);

  // A faint sigil behind the power, so the suit still reads at a glance when the tile is
  // only a few dozen pixels across in a contact sheet.
  ctx.save();
  ctx.globalAlpha = o.dim ? 0.10 : 0.14;
  drawSigil(ctx, spec, drawX + halfW, y + h * 0.70, Math.min(halfW * 2, h * 0.5) * 0.92, false);
  ctx.restore();

  // The power, large under the tile.
  ctx.fillStyle = o.dim ? '#655d6d' : '#1a1420';
  ctx.font = `700 ${Math.round(h * 0.25)}px ui-serif, Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.power), drawX + halfW, y + h * 0.70);

  // The sigil's name, small, so the wheel is legible without the legend.
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = o.dim ? '#7a7282' : '#453d4f';
  ctx.font = `700 ${Math.round(h * 0.088)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(spec.label.toUpperCase(), drawX + halfW, y + h * 0.92);

  ctx.restore();
}

/** A card back, for the foe's uncommitted hand: nothing about the card shows through it. */
export function drawCardBack(ctx, x, y, w, h, index) {
  const radius = Math.round(w * 0.09);
  roundRect(ctx, x, y, w, h, radius);
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#302541');
  grad.addColorStop(0.5, '#241b31');
  grad.addColorStop(1, '#180f22');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(214, 180, 255, 0.34)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // An inked device on the back: a ring, a broken ring, and a three-point star.
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const unit = Math.min(w, h) * 0.28;
  ctx.strokeStyle = 'rgba(201, 168, 255, 0.42)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, unit, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, unit * 0.6, Math.PI * 0.2, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 3; i += 1) {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const px = cx + Math.cos(angle) * unit * 0.42;
    const py = cy + Math.sin(angle) * unit * 0.42;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  if (index !== undefined) {
    ctx.fillStyle = 'rgba(201, 168, 255, 0.42)';
    ctx.font = `600 ${Math.round(h * 0.08)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(index + 1), x + w / 2, y + h * 0.9);
  }
}

/** Darken (factor < 0) or lighten a hex colour, for a tile's second stop. */
export function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const target = factor < 0 ? 0 : 255;
  const amount = Math.abs(factor);
  const mix = (channel) => Math.round(channel + (target - channel) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** A rounded rectangle path; the one shape every panel, card and slot is built from. */
export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
