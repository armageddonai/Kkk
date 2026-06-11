# RideClash server

The live backend for RideClash: real accounts, real global chat, presence,
**server-authoritative 1v1 coinflips** (the server rolls the dice and holds the
items, clients only render), a Roblox avatar proxy, and optional
"Sign in with Roblox" OAuth.

Demo items only — there is intentionally no deposit/withdraw/real-value code.

## Deploy free on Render (one time, ~5 minutes)

1. Go to [render.com](https://render.com) → sign up with your GitHub account.
2. Click **New → Blueprint** and pick this repo (it reads `render.yaml` at the
   repo root and configures everything).
3. After the first deploy, open the service → copy its URL
   (e.g. `https://rideclash-server.onrender.com`) and set it as the
   **BASE_URL** environment variable, then redeploy.
4. Put the same URL into `js/config.js` on the site:
   ```js
   window.RIDECLASH_CONFIG = { backend: "https://rideclash-server.onrender.com" };
   ```
   Push that change and the live site switches to multiplayer mode.

Note: Render's free tier sleeps after idle — the first visitor of the day waits
~30s while it wakes. Account data is saved to disk every minute but the free
tier's disk is ephemeral, so accounts reset on redeploys (fine for v1).

## Enable "Sign in with Roblox" (optional)

1. On [create.roblox.com](https://create.roblox.com/dashboard/credentials)
   → **OAuth 2.0 apps** → create an app.
2. Redirect URL: `<your server URL>/auth/roblox/callback`.
   Scopes: `openid`, `profile`.
3. Set `ROBLOX_CLIENT_ID` and `ROBLOX_CLIENT_SECRET` env vars on Render and
   redeploy. A "Sign in with Roblox" button appears on the site automatically.

Even without OAuth, guest logins that match a real Roblox username
automatically get that account's real avatar headshot.

## Run locally

```bash
cd server && npm install && node index.js
# then in the browser console on the site:
# localStorage.setItem("rideclash-backend", "http://localhost:3000"); location.reload()
```

## What the server owns vs. trusts

- **Server-authoritative:** accounts, inventories, coinflip lobbies/outcomes,
  chat (rate-limited), daily gift cooldowns.
- **Client-reported (v1 compromise):** results of the local bot minigames
  (mines/crash/jackpot) sync as item deltas with ownership validation on
  removals. Making those server-side is the next milestone.
