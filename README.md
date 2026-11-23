# Emberfall

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/LouVan/emberfall/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/LouVan/emberfall/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A card duel across three gates at the Sundered Gate. Each round you put one card on every
gate you can; the higher power takes the gate and the margin is the damage. Four sigils turn
on a wheel — Ember breaks Gale, Gale breaks Frost, Frost breaks Stone, Stone breaks Ember —
and a card that breaks its rival adds three power, so a small card can still take a gate off
a bigger one. The other warden answers your strongest card with the cheapest card that beats
it and spends what is left on the gates you left open.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

## Layout

- `game/index.html` and `game/src/` — the game, plain static files, no build step
- `game/src/duel.js` — the rules: hands, commits, clashes, damage, the end
- `game/src/cards.js` — the deck, the draw and `resolveClash`
- `game/src/table.js` — the table: gates, hands, life totals, the wheel legend
- `game/src/screens.js` — the title, the rules overlay and the end screen
- `game/src/cards-draw.js` — one sigil drawn as a shape, and a card face
- `game/src/input.js` — mouse and keyboard into table actions
- `game/src/shots.js` — the screenshot scenes, played through the real rules
- `main.ts` — hands the game in: copies `game/` and `screenshots/`, writes `dossier.json`

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
