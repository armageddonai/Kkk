// ===== RideClash backend =====
// Accounts, real chat, presence, server-authoritative 1v1 coinflips,
// Roblox avatar proxy, and optional "Sign in with Roblox" OAuth.
// Demo items only — there is intentionally no deposit/withdraw/real-value code.

const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const express = require("express");
const { Server } = require("socket.io");

/* ---------- config ---------- */

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*"; // e.g. https://armageddonai.github.io
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`; // public URL of this server
const SECRET = process.env.SECRET || crypto.randomBytes(32).toString("hex");
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || "";
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET || "";
const OAUTH_ENABLED = !!(ROBLOX_CLIENT_ID && ROBLOX_CLIENT_SECRET);
const DATA_FILE = path.join(__dirname, "data", "state.json");
const BOT_FILL = process.env.BOT_FILL !== "off"; // bots keep lobbies alive

/* ---------- shared game data (single source of truth: ../js/data.js) ---------- */

const dataSrc = fs.readFileSync(path.join(__dirname, "..", "js", "data.js"), "utf8");
const [ITEMS, STARTER_ITEMS, ITEM_BY_ID, BOTS, DAILY_BONUS_MAX] =
  vm.runInNewContext(dataSrc + ";[ITEMS, STARTER_ITEMS, ITEM_BY_ID, BOTS, DAILY_BONUS_MAX]");

const itemsValue = (ids) => ids.reduce((s, id) => s + (ITEM_BY_ID[id]?.value || 0), 0);
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const randHash = () => crypto.randomBytes(16).toString("hex");

/* ---------- state ---------- */

// accounts: key -> { key, name, avatar, robloxId?, items:[], lastBonus, wins, losses }
let accounts = {};
let lobbies = []; // { id, hostKey|null(bot), host:{name,avatar}, items:[], created }
let chatHistory = []; // last 40 messages

function loadState() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    accounts = raw.accounts || {};
    // drop items that no longer exist in the roster
    for (const a of Object.values(accounts)) {
      a.items = (a.items || []).filter((id) => ITEM_BY_ID[id]);
      if (!a.items.length) a.items = [...STARTER_ITEMS];
    }
  } catch (_) { /* first boot */ }
}
function saveState() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({ accounts }));
  } catch (e) { console.error("saveState failed:", e.message); }
}
loadState();
setInterval(saveState, 60_000);
process.on("SIGTERM", () => { saveState(); process.exit(0); });

/* ---------- tiny signed tokens ---------- */

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return body + "." + mac;
}
function verify(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expect = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()); } catch (_) { return null; }
}

/* ---------- roblox public-api helpers ---------- */

const avatarCache = new Map(); // username(lower) -> { url, t }

async function robloxAvatar(username) {
  const key = username.toLowerCase();
  const hit = avatarCache.get(key);
  if (hit && Date.now() - hit.t < 3_600_000) return hit.url;
  try {
    const u = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    }).then((r) => r.json());
    const id = u?.data?.[0]?.id;
    if (!id) return null;
    const t = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=false`
    ).then((r) => r.json());
    const url = t?.data?.[0]?.imageUrl || null;
    avatarCache.set(key, { url, t: Date.now() });
    return url;
  } catch (_) { return null; }
}

/* ---------- accounts ---------- */

function getOrCreateAccount(key, name, avatar, robloxId) {
  if (!accounts[key]) {
    accounts[key] = {
      key, name, avatar,
      robloxId: robloxId || null,
      items: [...STARTER_ITEMS],
      lastBonus: 0, wins: 0, losses: 0,
    };
  } else {
    accounts[key].name = name;
    if (avatar) accounts[key].avatar = avatar;
  }
  return accounts[key];
}

const publicAccount = (a) => ({
  name: a.name, avatar: a.avatar, items: a.items,
  lastBonus: a.lastBonus, wins: a.wins, losses: a.losses,
  roblox: !!a.robloxId,
});

/* ---------- express ---------- */

const app = express();
const server = http.createServer(app);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CLIENT_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(express.json());

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, oauth: OAUTH_ENABLED, online: io.engine.clientsCount }));

// Real Roblox headshot for any username (no login needed).
app.get("/api/avatar", async (req, res) => {
  const username = String(req.query.username || "").trim();
  if (!username) return res.status(400).json({ error: "username required" });
  res.json({ url: await robloxAvatar(username) });
});

app.get("/api/leaderboard", (_req, res) => {
  const rows = Object.values(accounts)
    .map((a) => ({ name: a.name, avatar: a.avatar, value: itemsValue(a.items), wins: a.wins }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  res.json(rows);
});

/* ---------- sign in with roblox (oauth 2.0 + pkce) ---------- */

const pkceStore = new Map(); // state -> { verifier, t }

app.get("/auth/roblox/login", (_req, res) => {
  if (!OAUTH_ENABLED) return res.status(404).send("Roblox OAuth is not configured on this server.");
  const state = crypto.randomBytes(16).toString("hex");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  pkceStore.set(state, { verifier, t: Date.now() });
  const url = new URL("https://apis.roblox.com/oauth/v1/authorize");
  url.searchParams.set("client_id", ROBLOX_CLIENT_ID);
  url.searchParams.set("redirect_uri", BASE_URL + "/auth/roblox/callback");
  url.searchParams.set("scope", "openid profile");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  res.redirect(url.toString());
});

app.get("/auth/roblox/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const pkce = pkceStore.get(state);
    pkceStore.delete(state);
    if (!code || !pkce) return res.status(400).send("Invalid OAuth state.");
    const tok = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: ROBLOX_CLIENT_ID,
        client_secret: ROBLOX_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: String(code),
        code_verifier: pkce.verifier,
      }),
    }).then((r) => r.json());
    if (!tok.access_token) return res.status(400).send("Token exchange failed.");
    const info = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: { Authorization: "Bearer " + tok.access_token },
    }).then((r) => r.json());
    const name = info.preferred_username || info.nickname || "Player" + info.sub;
    const avatar = info.picture || (await robloxAvatar(name)) || "🙂";
    getOrCreateAccount("rbx:" + info.sub, name, avatar, info.sub);
    const session = sign({ key: "rbx:" + info.sub, t: Date.now() });
    const dest = (CLIENT_ORIGIN === "*" ? "" : CLIENT_ORIGIN) + "/#rbx=" + session;
    res.redirect(dest || "/#rbx=" + session);
  } catch (e) {
    res.status(500).send("OAuth error: " + e.message);
  }
});

/* ---------- socket.io ---------- */

const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });

function broadcastLobbies() {
  io.emit("lobbies", lobbies.map((l) => ({
    id: l.id, host: l.host, items: l.items, value: itemsValue(l.items), isBot: !l.hostKey,
  })));
}
function broadcastOnline() {
  io.emit("online", io.engine.clientsCount);
}

function makeBotLobby() {
  const bot = rand(BOTS);
  const pool = Math.random() < 0.08 ? ITEMS : ITEMS.filter((i) => i.value <= 50_000_000);
  const items = Array.from({ length: randInt(1, 4) }, () => rand(pool).id);
  return { id: randHash().slice(0, 8), hostKey: null, host: { name: bot.name, avatar: bot.avatar }, items, created: Date.now() };
}
if (BOT_FILL) {
  lobbies = Array.from({ length: 5 }, makeBotLobby);
  setInterval(() => {
    if (lobbies.length < 6) { lobbies.push(makeBotLobby()); broadcastLobbies(); }
  }, 25_000);
}

// Resolve a flip: server rolls, items move, both sides get told.
function resolveFlip(lobby, joiner /* {key|null, name, avatar} */, joinerItems) {
  lobbies = lobbies.filter((l) => l.id !== lobby.id);
  const hostVal = itemsValue(lobby.items);
  const joinVal = itemsValue(joinerItems);
  const hostPct = hostVal / (hostVal + joinVal);
  const hostWins = Math.random() < hostPct;
  const all = [...lobby.items, ...joinerItems];

  const award = (key, won) => {
    const a = accounts[key];
    if (!a) return;
    if (won) { a.items.push(...all); a.wins++; } else { a.losses++; }
    for (const sock of io.sockets.sockets.values()) {
      if (sock.data.key === key) sock.emit("account", publicAccount(a));
    }
  };
  if (lobby.hostKey) award(lobby.hostKey, hostWins);
  if (joiner.key) award(joiner.key, !hostWins);

  io.emit("flip:result", {
    id: lobby.id, host: lobby.host, joiner: { name: joiner.name, avatar: joiner.avatar },
    hostItems: lobby.items, joinerItems, hostWins, hash: randHash(),
  });
  broadcastLobbies();
  saveState();
}

io.use((socket, next) => {
  const auth = socket.handshake.auth || {};
  if (auth.token) {
    const payload = verify(auth.token);
    if (payload?.key && accounts[payload.key]) {
      socket.data.key = payload.key;
      return next();
    }
  }
  if (auth.guest && typeof auth.guest === "string") {
    const name = auth.guest.trim().slice(0, 20);
    if (!name) return next(new Error("bad name"));
    socket.data.key = "guest:" + name.toLowerCase();
    socket.data.guestName = name;
    return next();
  }
  socket.data.key = null; // spectator
  next();
});

io.on("connection", async (socket) => {
  let account = null;
  if (socket.data.key) {
    if (socket.data.guestName && !accounts[socket.data.key]) {
      const avatar = (await robloxAvatar(socket.data.guestName)) || rand(["🙂", "😎", "🥷", "👾", "🤖"]);
      account = getOrCreateAccount(socket.data.key, socket.data.guestName, avatar);
    } else {
      account = accounts[socket.data.key];
      if (socket.data.guestName) account = getOrCreateAccount(socket.data.key, socket.data.guestName, null);
    }
  }

  socket.emit("init", {
    you: account ? publicAccount(account) : null,
    token: account ? sign({ key: socket.data.key, t: Date.now() }) : null,
    lobbies: lobbies.map((l) => ({ id: l.id, host: l.host, items: l.items, value: itemsValue(l.items), isBot: !l.hostKey })),
    chat: chatHistory,
    oauth: OAUTH_ENABLED,
  });
  broadcastOnline();

  let lastChat = 0;
  socket.on("chat:send", (text) => {
    if (!account || typeof text !== "string") return;
    if (Date.now() - lastChat < 1500) return; // rate limit
    lastChat = Date.now();
    const msg = { name: account.name, avatar: account.avatar, roblox: !!account.robloxId, text: text.slice(0, 120), t: Date.now() };
    chatHistory.push(msg);
    if (chatHistory.length > 40) chatHistory.shift();
    io.emit("chat:msg", msg);
  });

  const takeItems = (ids) => {
    // validate ownership and escrow (remove from account)
    if (!Array.isArray(ids) || !ids.length || ids.length > 20) return null;
    const pool = [...account.items];
    for (const id of ids) {
      const i = pool.indexOf(id);
      if (i === -1) return null;
      pool.splice(i, 1);
    }
    account.items = pool;
    return ids;
  };

  socket.on("lobby:create", (ids) => {
    if (!account) return;
    if (lobbies.some((l) => l.hostKey === socket.data.key)) return socket.emit("err", "You already have an open lobby.");
    const items = takeItems(ids);
    if (!items) return socket.emit("err", "Invalid items.");
    const lobby = { id: randHash().slice(0, 8), hostKey: socket.data.key, host: { name: account.name, avatar: account.avatar }, items, created: Date.now() };
    lobbies.unshift(lobby);
    socket.emit("account", publicAccount(account));
    broadcastLobbies();
    if (BOT_FILL) { // a bot joins if no human does
      setTimeout(() => {
        const still = lobbies.find((l) => l.id === lobby.id);
        if (!still) return;
        const bot = rand(BOTS);
        const target = itemsValue(lobby.items);
        const botItems = [];
        let v = 0;
        while (v < target * 0.95) {
          const pool = ITEMS.filter((i) => v + i.value <= target * 1.1);
          if (!pool.length) break;
          const pick = rand(pool); botItems.push(pick.id); v += pick.value;
        }
        if (!botItems.length) botItems.push(ITEMS[ITEMS.length - 1].id);
        resolveFlip(still, { key: null, name: bot.name, avatar: bot.avatar }, botItems);
      }, randInt(8000, 20000));
    }
  });

  socket.on("lobby:join", ({ id, items: ids }) => {
    if (!account) return;
    const lobby = lobbies.find((l) => l.id === id);
    if (!lobby) return socket.emit("err", "Lobby is gone.");
    if (lobby.hostKey === socket.data.key) return socket.emit("err", "That's your own lobby.");
    const val = itemsValue(lobby.items);
    const joinVal = itemsValue(ids || []);
    if (joinVal < val * 0.95 || joinVal > val * 1.1) return socket.emit("err", "Items outside the join range.");
    const items = takeItems(ids);
    if (!items) return socket.emit("err", "Invalid items.");
    socket.emit("account", publicAccount(account));
    resolveFlip(lobby, { key: socket.data.key, name: account.name, avatar: account.avatar }, items);
  });

  socket.on("lobby:cancel", () => {
    if (!account) return;
    const mine = lobbies.find((l) => l.hostKey === socket.data.key);
    if (!mine) return;
    account.items.push(...mine.items);
    lobbies = lobbies.filter((l) => l !== mine);
    socket.emit("account", publicAccount(account));
    broadcastLobbies();
  });

  socket.on("gift:claim", () => {
    if (!account) return;
    if (Date.now() - account.lastBonus < 24 * 3600 * 1000) return socket.emit("err", "Daily gift not ready yet.");
    account.lastBonus = Date.now();
    const gift = rand(ITEMS.filter((i) => i.value <= DAILY_BONUS_MAX));
    account.items.push(gift.id);
    socket.emit("gift", { id: gift.id });
    socket.emit("account", publicAccount(account));
    saveState();
  });

  // Local minigames (mines/crash/jackpot vs bots) report their item deltas.
  // Removals are validated against ownership; additions must be real items and
  // are capped per call to keep casual tampering boring.
  socket.on("sync:delta", ({ add, remove }) => {
    if (!account) return;
    if (!Array.isArray(add) || !Array.isArray(remove) || add.length > 30 || remove.length > 30) return;
    const removed = takeItems(remove.length ? remove : []) ?? (remove.length ? null : []);
    if (removed === null) return socket.emit("account", publicAccount(account)); // resync client
    const adds = add.filter((id) => ITEM_BY_ID[id]).slice(0, 30);
    account.items.push(...adds);
    socket.emit("account", publicAccount(account));
  });

  socket.on("disconnect", () => {
    if (account) {
      const mine = lobbies.find((l) => l.hostKey === socket.data.key);
      if (mine) { // refund open lobby
        account.items.push(...mine.items);
        lobbies = lobbies.filter((l) => l !== mine);
        broadcastLobbies();
      }
    }
    broadcastOnline();
  });
});

server.listen(PORT, () => {
  console.log(`RideClash server on :${PORT}`);
  console.log(`  client origin: ${CLIENT_ORIGIN}`);
  console.log(`  roblox oauth:  ${OAUTH_ENABLED ? "ENABLED" : "disabled (set ROBLOX_CLIENT_ID/SECRET)"}`);
});
