# Research: Jailbreak trading & sites like this (June 2026)

Findings from web research used to shape this site, with sources. Values change
weekly — treat all numbers as ballpark.

## 1. The Jailbreak economy

- Values are quoted in **in-game Jailbreak cash** (millions), set by community
  value lists, not by Badimo: [JBValues](https://jbvalues.com/),
  [Jailbreak Changelogs](https://jailbreakchangelogs.com/values),
  [Jailbreak Trading Network](https://www.jailbreaktradingnetwork.com/).
  Badimo has publicly endorsed Jailbreak Changelogs (donated $500)
  ([Badimo on X](https://x.com/badimo/status/1983975178733543491)).
- **HyperChromes rule the economy**: all HyperChromes together ≈ 279M;
  **HyperShift** alone is the most valuable item (~300M+ clean)
  ([Eldorado blog](https://www.eldorado.gg/blog/roblox-jailbreak-values-list/),
  [JTN blog](https://blog.jailbreaktradingnetwork.com/2025/08/roblox-jailbreak-trading-network-hyper_22.html)).
- **Torpedo** is the top vehicle (~90–100M in 2026 lists; sources vary),
  **Javelin** has the most insane demand among vehicles.
- Tradable categories: vehicles, textures/colors, rims, spoilers, weapon skins,
  safes, furniture ([Jailbreak Wiki: Trading](https://jailbreak.fandom.com/wiki/Trading)).
  NASCAR and MCL36 are untradable (licensing).
- Trading happens at the **Trading Island** (red cube on the ship at Beach Town);
  traders need phone/ID verification and 30 days of playtime.
- Slang used by the community (now reflected in our chat/UI): **clean** (not
  duped), **duped** (exploit-created, worth less, ban risk), **overpay**,
  **demand**, **W/L trades**, **adds**.

## 2. Game context

- Jailbreak is by **Badimo** (asimo3089 + badcc). **Season 32: Street Racing**
  starts June 13, 2026 alongside the **9-Year Anniversary live event**
  ([Jailbreak Wiki: Seasons](https://jailbreak.fandom.com/wiki/Seasons)).
- Crew Battles is currently a private-server gamemode (removed from public in
  Season 29, returned in The Jewel Update).

## 3. How wagering sites present themselves (UX research only)

- Sites like Bloxflip/RBLXWild offer: Crash, Mines (1–24 bombs on 5×5), Towers,
  Case Battles, Upgrader, Plinko, Jackpot, Coinflip
  ([Bloxflip FAQ](https://bloxflip.com/faq)).
- Standard UI patterns we mirror (with fake items): item thumbnails with value
  tags, % win chance per side, join ranges on coinflips (~95–110% of lobby
  value), "provably fair" round hashes, live chat with verified badges, levels
  and daily rewards.

## 4. Why this site stays free-to-play (the legal reality)

- A 2023 federal class action (N.D. Cal.) names Roblox plus the operators of
  **RBXFlip, Bloxflip and RBLXWild** as running "an illegal gambling operation
  preying on children"; in March 2024 the court refused to dismiss it
  ([TechCrunch](https://techcrunch.com/2023/08/18/roblox-children-gambling-class-action-lawsuit-robux/),
  [ClassAction.org](https://www.classaction.org/news/class-action-claims-roblox-casino-websites-operate-illegal-gambling-ring-targeted-at-children),
  [Weitz & Luxenberg](https://www.weitzlux.com/consumer-protection/fraud/roblox-gambling-litigation/)).
- Roblox sent Bloxflip a legal demand to stop using Roblox branding and stop
  accessing the platform.
- Roblox's [Name & Logo guidelines](https://en.help.roblox.com/hc/en-us/articles/115001708126-Roblox-Name-and-Logo-Community-Usage-Guidelines)
  prohibit using "Roblox" **or similar terms like "Blox"** in product names
  without a license — which is why this site should rebrand away from
  "BloxySpin" before any public launch.
- What's clearly fine: free fan sites and community value lists with no
  real-value transactions, no Roblox logo, clear non-affiliation disclaimers,
  and no personal-data collection from kids (COPPA).

## 5. Future multiplayer architecture (for when we outgrow the demo)

- **"Sign in with Roblox" is officially supported** via Open Cloud OAuth 2.0 /
  OpenID Connect — gives user ID, username, display name
  ([OAuth overview](https://create.roblox.com/docs/cloud/auth/oauth2-overview),
  [reference](https://create.roblox.com/docs/cloud/auth/oauth2-reference)).
  Avatar headshots come from the public thumbnails API.
- Minimal real-multiplayer stack: small Node + Socket.IO (or native WebSocket)
  server on a free tier (Render/Fly/Railway), or serverless realtime
  (Cloudflare Durable Objects / Supabase Realtime). Server must be
  authoritative: it rolls the RNG and holds inventories; clients only render.
