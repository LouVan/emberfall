// One sigil drawn as a shape, so a card is never told apart by text or colour alone.
// The four shapes are distinct at thumbnail size: a spike, a ring, a hex and a block.

/**
 * Draw a sigil glyph centred on (cx, cy) at `size` across. `lit` brightens the edge for a
 * card that is committed or winning; the shape always stays the same.
 */
export function drawSigil(ctx, sigil, cx, cy, size, lit) {
  const r = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = sigil.color;
  ctx.strokeStyle = lit ? sigil.edge : sigil.color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.beginPath();
  switch (sigil.shape) {
    case 'spike': {
      // Ember: a five-point burst.
      for (let i = 0; i < 10; i += 1) {
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const radius = i % 2 === 0 ? r : r * 0.46;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case 'ring': {
      // Gale: a ring with a gap and three tail strokes.
      ctx.arc(0, 0, r * 0.78, Math.PI * 0.18, Math.PI * 1.72);
      ctx.lineWidth = size * 0.16;
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 3; i += 1) {
        const y = -r * 0.3 + i * r * 0.34;
        ctx.moveTo(-r * 0.5, y);
        ctx.lineTo(r * 0.34, y);
      }
      ctx.lineWidth = size * 0.1;
      ctx.stroke();
      ctx.restore();
      return;
    }
    case 'hex': {
      // Frost: a six-sided crystal with an inner facet.
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
      ctx.moveTo(0, -r * 0.52);
      ctx.lineTo(r * 0.45, 0);
      ctx.lineTo(0, r * 0.52);
      ctx.lineTo(-r * 0.45, 0);
      ctx.closePath();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      return;
    }
    default: {
      // Stone: a squared boulder with a chipped corner.
      const s = r * 0.92;
      ctx.moveTo(-s, -s * 0.72);
      ctx.lineTo(s * 0.28, -s);
      ctx.lineTo(s, -s * 0.18);
      ctx.lineTo(s * 0.78, s);
      ctx.lineTo(-s * 0.86, s * 0.84);
      ctx.closePath();
      break;
    }
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** A card face: parchment, a sigil tile, the power, and the sigil's name small beneath. */
export function drawCard(ctx, card, x, y, w, h, opts) {
  const o = opts || {};
  const sigil = card.sigil;
  const spec = SIGIL_SPECS()[sigil];
  const radius = Math.round(w * 0.1);

  ctx.save();
  if (o.lift) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = o.lift;
    ctx.shadowOffsetY = o.lift * 0.4;
  }

  // Body.
  roundRect(ctx, x, y, w, h, radius);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, o.dim ? '#cfc6b5' : '#f7f1e4');
  grad.addColorStop(1, o.dim ? '#b6ac9a' : '#ded3bd');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(2, w * 0.026);
  ctx.strokeStyle = o.selected ? spec.edge : 'rgba(26, 20, 32, 0.55)';
  ctx.stroke();

  if (o.selected) {
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, radius + 4);
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Sigil tile across the upper half.
  const tileY = y + h * 0.09;
  const tileH = h * 0.44;
  roundRect(ctx, x + w * 0.1, tileY, w * 0.8, tileH, radius * 0.7);
  ctx.fillStyle = spec.color;
  ctx.globalAlpha = o.dim ? 0.34 : 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = spec.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawSigil(ctx, spec, x + w / 2, tileY + tileH / 2, Math.min(w, tileH) * 0.52, !o.dim);

  // Power, large and readable when shrunk.
  ctx.fillStyle = o.dim ? '#6a6272' : '#1a1420';
  ctx.font = `700 ${Math.round(h * 0.26)}px ui-serif, Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(card.power), x + w / 2, y + h * 0.82);

  // Sigil name, small, so the wheel is legible without hovering.
  ctx.fillStyle = o.dim ? '#7a7282' : '#4a4252';
  ctx.font = `600 ${Math.round(h * 0.104)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(spec.label.toUpperCase(), x + w / 2, y + h * 0.95);

  ctx.restore();
}

/** A card back, for the foe's uncommitted hand: no information leaks through it. */
export function drawCardBack(ctx, x, y, w, h, index) {
  const radius = Math.round(w * 0.1);
  roundRect(ctx, x, y, w, h, radius);
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#2b2138');
  grad.addColorStop(1, '#1a1424');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(214, 180, 255, 0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.34;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.strokeStyle = '#c9a8ff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(w, h) * 0.27, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 3; i += 1) {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const px = cx + Math.cos(angle) * Math.min(w, h) * 0.2;
    const py = cy + Math.sin(angle) * Math.min(w, h) * 0.2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(201, 168, 255, 0.4)';
  ctx.font = `600 ${Math.round(h * 0.085)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(index + 1), x + w / 2, y + h * 0.9);
}

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

let cachedSpecs = null;
function SIGIL_SPECS() {
  if (!cachedSpecs) {
    // Imported lazily to keep this module writable without a cycle through config.
    cachedSpecs = {
      ember: { key: 'ember', label: 'Ember', color: '#ff7a4d', edge: '#ffb591', shape: 'spike' },
      gale: { key: 'gale', label: 'Gale', color: '#5fd6a4', edge: '#a8f0cf', shape: 'ring' },
      frost: { key: 'frost', label: 'Frost', color: '#6fb6ff', edge: '#b6dcff', shape: 'hex' },
      stone: { key: 'stone', label: 'Stone', color: '#d9b45c', edge: '#f3dfa6', shape: 'block' },
    };
  }
  return cachedSpecs;
}
