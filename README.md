# RideClash — Jailbreak 1v1s ⚔️🏎️

A fan-made, **fully fake** 1v1 arena themed on the Roblox Jailbreak trading
community. Wager pretend rides, HyperChromes and textures against other
players in Coinflip, PVP Mines, Crash and Jackpot.

Everything runs locally in your browser with pretend items — no real money,
no real trades, no accounts, no affiliation with Roblox, Badimo, or any
trading/value-list site. See `RESEARCH.md` for the research behind the item
values and the legal reasoning for staying free-to-play.

## Features

- ⚔️ **PVP Mines** — 1v1 item wagers, take turns picking tiles, bomb loses the pot
- 🪙 **Coinflip** — versus screen, value-weighted win chance, round hash, 3D coin
- 🚀 **Crash** — wager rides, cash out before the bust to win extra rides
- 🎰 **Jackpot** — shared pot with an animated spinner wheel draw
- 🚗 **44 items** across vehicles, level-5 HyperChromes and textures/rims, with
  rarity tiers, demand labels and values inspired by community lists
- 🎁 Daily ride gift, 🏆 leaderboard, 💬 simulated trader chat, 🔊 sounds
- 🎒 Garage with search, sort and type filters, saved in `localStorage`

## Run it

No build step. Open `index.html`, or:

```bash
python3 -m http.server 8080
```

Deploys automatically to GitHub Pages via `.github/workflows/pages.yml`.

## Structure

```
index.html      # all views + modals
css/style.css   # theme and layout
js/data.js      # items, values, bots, chat lines
js/app.js       # navigation, games, chat, garage
RESEARCH.md     # sourced research on the Jailbreak economy & legal landscape
```
