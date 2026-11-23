// Emberfall hands its game in. The game itself is game/ — plain static files a desktop
// browser loads offline, with no build step — and this program copies it, with the
// screenshots its maker took, to /output and writes the dossier the judge reads.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The caps below are the scorer's own: game/ is refused past 993 files or 48 MiB, a path
// under it past 1,000 bytes, more than 4 screenshots, one screenshot past 256 KiB, or a
// dossier past its own cap. They go to buildDossier so an entry the grader would refuse is
// refused here first, with the reason, rather than at intake.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

/** Copy one of the entry's directories into the output, if it is there at all. */
function copyInto(name: string) {
  const from = join(here, name);
  if (!existsSync(from)) return false;
  cpSync(from, join(out, name), { recursive: true });
  return true;
}

mkdirSync(out, { recursive: true });
copyInto('game');
mkdirSync(join(out, 'screenshots'), { recursive: true });
copyInto('screenshots');

writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));
