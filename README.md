# BloxySpin — Roblox Jailbreak Edition 🏎️🪙

A fan-made, **fully fake** recreation of the bloxyspin.org look and feel, re-themed
around **Roblox Jailbreak** vehicles instead of pet items.

Everything runs locally in your browser with pretend currency and pretend items —
no real money, no real trades, no accounts, no affiliation with Roblox, Badimo,
or bloxyspin.org.

## Features

- 🎨 Dark navy BloxySpin-style UI with mobile bottom navigation
- 🪙 **Coinflip** — join bot lobbies or create your own, with a 3D coin flip,
  win percentages, item lists, and a round hash, plus game history
- 🎰 **Jackpot** — deposit items into a shared pot drawn every 20 seconds,
  win chance weighted by deposit value
- 💣 **Mine Battles** — classic mines: pick gems, dodge bombs, cash out a
  fair multiplier
- 💬 **Live chat** — simulated player chat with an online counter
- 🎒 **Inventory** — a starter garage of Jailbreak rides (Torpedo, Brulee,
  Volt Bike, Concept…) saved in `localStorage`

## Run it

No build step. Just open `index.html`, or serve it:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Structure

```
index.html      # all views + modals
css/style.css   # theme and layout
js/data.js      # Jailbreak items, bot players, chat lines
js/app.js       # navigation, coinflip, jackpot, mines, chat, inventory
```
