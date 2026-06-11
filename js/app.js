// ===== RideClash (Jailbreak 1v1s) — premium demo app =====
// Everything runs locally in the browser with pretend currency. Nothing is real.

/* ---------- helpers ---------- */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function randHash() {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");
}
function itemsValue(ids) { return ids.reduce((s, id) => s + ITEM_BY_ID[id].value, 0); }
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Picks bot items whose total lands inside [target*0.95, target*1.1].
function matchItems(target) {
  const out = [];
  let v = 0;
  while (v < target * 0.95) {
    const pool = ITEMS.filter(i => v + i.value <= target * 1.1);
    if (!pool.length) break;
    const pick = rand(pool);
    out.push(pick.id);
    v += pick.value;
  }
  if (!out.length) out.push(ITEMS[ITEMS.length - 1].id);
  return out;
}

/* ---------- sound (tiny WebAudio synth) ---------- */

let soundOn = (localStorage.getItem("rideclash-sound") || localStorage.getItem("bloxyspin-sound")) !== "off";
let audioCtx = null;

function beep(freq, dur = 0.08, type = "sine", gain = 0.06, delay = 0) {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch (_) { /* audio unavailable */ }
}

const sfx = {
  click: () => beep(600, 0.05, "triangle", 0.05),
  tick: () => beep(900, 0.03, "square", 0.03),
  win: () => { beep(523, 0.12, "triangle", 0.07); beep(659, 0.12, "triangle", 0.07, 0.1); beep(784, 0.22, "triangle", 0.08, 0.2); },
  lose: () => { beep(220, 0.2, "sawtooth", 0.05); beep(150, 0.3, "sawtooth", 0.05, 0.12); },
  bomb: () => beep(80, 0.4, "sawtooth", 0.12),
  gem: () => beep(1100, 0.07, "triangle", 0.05),
};

$("#sound-btn").addEventListener("click", () => {
  soundOn = !soundOn;
  localStorage.setItem("rideclash-sound", soundOn ? "on" : "off");
  $("#sound-btn").textContent = soundOn ? "🔊" : "🔇";
  if (soundOn) sfx.click();
});

/* ---------- state ---------- */

let user = null;            // { name, avatar, items: [itemId], lastBonus }
let lobbies = [];           // coinflip lobbies
let history = [];           // finished games
let jackpot = { entries: [], timer: 20, userEntered: false, drawing: false };
let mines = null;           // active 1v1 mines match
let crash = null;           // active crash round
let crashBusts = [];

/* ---------- persistence ---------- */

function save() {
  if (user) localStorage.setItem("rideclash-user", JSON.stringify(user));
  localStorage.setItem("rideclash-history", JSON.stringify(history.slice(0, 50)));
}
function load() {
  try {
    // fall back to the pre-rebrand key so existing garages survive
    const raw = localStorage.getItem("rideclash-user") || localStorage.getItem("bloxyspin-user");
    if (raw) {
      user = JSON.parse(raw);
      delete user.cash; // pre-item-economy saves had a coin balance
      user.items = (user.items || []).filter(id => ITEM_BY_ID[id]); // drop ids from old rosters
      if (!user.items.length) user.items = [...STARTER_ITEMS];
      onLoggedIn();
    }
    const h = localStorage.getItem("rideclash-history") || localStorage.getItem("bloxyspin-history");
    if (h) history = JSON.parse(h);
  } catch (_) { /* fresh start */ }
}

/* ---------- navigation ---------- */

const VIEWS = ["home", "coinflip", "jackpot", "mines", "crash", "inventory", "chat"];
const TAB_FOR_VIEW = { home: "home", coinflip: "coinflip", jackpot: "coinflip", mines: "coinflip", crash: "coinflip", inventory: "home", chat: "chat" };

function navigate(view) {
  VIEWS.forEach(v => $("#view-" + v).classList.toggle("hidden", v !== view));
  $$(".bottombar .tab").forEach(t => t.classList.toggle("active", t.dataset.nav === TAB_FOR_VIEW[view]));
  if (view === "home") renderLeaderboard();
  if (view === "inventory") renderInventory();
  if (view === "coinflip") renderLobbies();
  if (view === "chat") scrollChat();
  window.scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav) { e.preventDefault(); sfx.click(); navigate(nav.dataset.nav); }
  if (e.target.closest("[data-close]")) closeModal();
});

/* ---------- modals ---------- */

function openModal(id) {
  $("#modal-backdrop").classList.remove("hidden");
  $$(".modal").forEach(m => m.classList.add("hidden"));
  $(id).classList.remove("hidden");
}
function closeModal() {
  $("#modal-backdrop").classList.add("hidden");
  $$(".modal").forEach(m => m.classList.add("hidden"));
}
$("#modal-backdrop").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

/* ---------- toasts / confetti / info ---------- */

function toast(text, kind = "") {
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.textContent = text;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function confetti() {
  const box = $("#confetti");
  const colors = ["#2979ff", "#ffb627", "#2ee06f", "#ff4d5e", "#b35cff", "#5b9bff"];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = rand(colors);
    p.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
    p.style.animationDelay = (Math.random() * 0.4) + "s";
    box.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}

const INFO_PAGES = {
  support: ["❓ Support", "This is a free fan-made demo — there's no real support team because there's nothing real to support! No real money, items, or trades ever touch this site. If something looks broken, refresh the page; your demo garage is saved in your browser."],
  fair: ["🛡️ Provably Fair", "Every coinflip, jackpot draw, mines board and crash point is generated by your own browser's random number generator, weighted exactly by the displayed percentages. The whole game logic is open source — open the page source and read js/app.js to verify it yourself."],
};

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-info]");
  if (!btn) return;
  const [title, body] = INFO_PAGES[btn.dataset.info];
  $("#info-title").textContent = title;
  $("#info-body").textContent = body;
  openModal("#modal-info");
});

/* ---------- login ---------- */

$("#login-btn").addEventListener("click", () => openModal("#modal-login"));
$("#login-submit").addEventListener("click", doLogin);
$("#login-name").addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });

function doLogin() {
  const name = $("#login-name").value.trim();
  if (!name) return;
  user = {
    name,
    avatar: rand(["🙂", "😎", "🥷", "👾", "🤖", "🦊", "🐱"]),
    items: [...STARTER_ITEMS],
    lastBonus: 0,
  };
  save();
  closeModal();
  onLoggedIn();
  sfx.win();
  addChatMessage({ name: "ClashBot", avatar: "🤖", verified: true }, `Welcome @${name}! You got a free starter garage 🚗`, true);
}

function onLoggedIn() {
  $("#login-btn").classList.add("hidden");
  $("#user-chip").classList.remove("hidden");
  $("#user-avatar").textContent = user.avatar;
  $("#user-name").textContent = user.name;
  $("#wallet").classList.remove("hidden");
  $("#chat-input").disabled = false;
  $("#chat-input").placeholder = "Say something…";
  $("#chat-send").disabled = false;
  updateWallet();
  updateGift();
}

function updateWallet() {
  $("#wallet-value").textContent = `${fmt(itemsValue(user.items))} · ${user.items.length} 🚗`;
  save();
}

function requireLogin() {
  if (user) return true;
  openModal("#modal-login");
  return false;
}

/* ---------- daily bonus ---------- */

const BONUS_COOLDOWN = 24 * 60 * 60 * 1000;

function updateGift() {
  const ready = user && Date.now() - (user.lastBonus || 0) >= BONUS_COOLDOWN;
  $("#gift-btn").classList.toggle("ready", !!ready);
}

$("#gift-btn").addEventListener("click", () => {
  if (!requireLogin()) return;
  const left = BONUS_COOLDOWN - (Date.now() - (user.lastBonus || 0));
  if (left > 0) {
    const h = Math.floor(left / 3600000), m = Math.ceil((left % 3600000) / 60000);
    return toast(`Next daily bonus in ${h}h ${m}m ⏳`);
  }
  user.lastBonus = Date.now();
  const gift = rand(ITEMS.filter(i => i.value <= DAILY_BONUS_MAX));
  user.items.push(gift.id);
  updateWallet();
  updateGift();
  confetti();
  sfx.win();
  toast(`🎁 Daily ride: ${gift.icon} ${gift.name} (🪙 ${fmt(gift.value)})!`, "success");
});

setInterval(updateGift, 60000);

/* ---------- leaderboard ---------- */

function renderLeaderboard() {
  const rows = BOTS.slice(0, 7).map(b => ({
    name: b.name, avatar: b.avatar, value: randInt(8, 120) * 250000, me: false,
  }));
  if (user) rows.push({ name: user.name, avatar: user.avatar, value: itemsValue(user.items), me: true });
  rows.sort((a, b) => b.value - a.value);
  $("#leaderboard").innerHTML = rows.slice(0, 8).map((r, i) =>
    `<div class="lb-row ${r.me ? "me" : ""}">
      <span class="lb-rank">${i + 1}</span>
      <span class="avatar avatar-sm">${r.avatar}</span>
      <span class="lb-name">${r.name}${r.me ? " (you)" : ""}</span>
      <span class="lb-value">🪙 ${fmt(r.value)}</span>
    </div>`).join("");
}

/* ---------- inventory ---------- */

function itemChip(id) {
  const it = ITEM_BY_ID[id];
  return `<span class="item-chip r-${it.rarity}" title="${it.name} — ${fmt(it.value)}">${it.icon}</span>`;
}

function invCard(it, extra = "") {
  return `<div class="inv-item r-${it.rarity}" ${extra}>
    <span class="big">${it.icon}</span>
    <strong>${it.name}</strong>
    <small>🪙 ${fmt(it.value)}</small>
    <span class="rarity-tag ${it.rarity}">${RARITY_LABEL[it.rarity]}</span>
    <span class="demand-tag">${DEMAND_LABEL[it.demand]}</span>
  </div>`;
}

function renderInventory() {
  const grid = $("#inv-grid");
  if (!user || user.items.length === 0) {
    grid.innerHTML = `<p class="muted">${user ? "Your garage is empty. Win some 1v1s!" : "Login to see your garage."}</p>`;
    return;
  }
  const q = ($("#inv-search").value || "").toLowerCase();
  const sort = $("#inv-sort").value;
  const type = $("#inv-type").value;
  let items = user.items.map(id => ITEM_BY_ID[id])
    .filter(it => it.name.toLowerCase().includes(q) && (type === "all" || it.type === type));
  if (sort === "value-desc") items.sort((a, b) => b.value - a.value);
  if (sort === "value-asc") items.sort((a, b) => a.value - b.value);
  if (sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  grid.innerHTML = items.map(it => invCard(it)).join("") || `<p class="muted">No rides match "${q}".</p>`;
}

$("#inv-search").addEventListener("input", renderInventory);
$("#inv-sort").addEventListener("change", renderInventory);
$("#inv-type").addEventListener("change", renderInventory);

/* ---------- item picker ---------- */

let pickerState = null; // { selected:Set, min, max, onConfirm }

function openPicker({ title, min = 0, max = Infinity, onConfirm }) {
  pickerState = { selected: new Set(), min, max, onConfirm };
  $("#picker-title").textContent = title;
  $("#picker-range").textContent = max === Infinity
    ? "Pick any of your items."
    : `Pick items worth 🪙 ${fmt(min)} – ${fmt(max)} to match the lobby.`;
  const grid = $("#picker-grid");
  const sorted = user.items.map((id, idx) => ({ it: ITEM_BY_ID[id], idx })).sort((a, b) => b.it.value - a.it.value);
  grid.innerHTML = sorted.map(({ it, idx }) =>
    `<button class="inv-item r-${it.rarity}" data-idx="${idx}">
      <span class="big">${it.icon}</span>
      <strong>${it.name}</strong>
      <small>🪙 ${fmt(it.value)}</small>
      <span class="rarity-tag ${it.rarity}">${RARITY_LABEL[it.rarity]}</span>
      <span class="demand-tag">${DEMAND_LABEL[it.demand]}</span>
    </button>`).join("") || `<p class="muted">No items in your garage.</p>`;
  grid.onclick = (e) => {
    const btn = e.target.closest("[data-idx]");
    if (!btn) return;
    sfx.click();
    const idx = Number(btn.dataset.idx);
    if (pickerState.selected.has(idx)) pickerState.selected.delete(idx);
    else pickerState.selected.add(idx);
    btn.classList.toggle("selected");
    updatePickerTotal();
  };
  updatePickerTotal();
  openModal("#modal-picker");
}

function updatePickerTotal() {
  const ids = [...pickerState.selected].map(i => user.items[i]);
  const total = itemsValue(ids);
  $("#picker-total").textContent = `🪙 ${fmt(total)}`;
  const ok = ids.length > 0 && total >= pickerState.min && total <= pickerState.max;
  $("#picker-confirm").disabled = !ok;
}

$("#picker-confirm").addEventListener("click", () => {
  const idxs = [...pickerState.selected].sort((a, b) => b - a);
  const ids = idxs.map(i => user.items[i]);
  idxs.forEach(i => user.items.splice(i, 1)); // items leave the garage while in play
  updateWallet();
  closeModal();
  pickerState.onConfirm(ids);
});

/* ---------- coinflip ---------- */

function makeBotLobby() {
  const bot = rand(BOTS);
  const count = randInt(1, 4);
  // mostly mid-tier lobbies; the occasional whale posts a HyperShift-class flip
  const pool = Math.random() < 0.08 ? ITEMS : ITEMS.filter(i => i.value <= 50000000);
  const items = Array.from({ length: count }, () => rand(pool).id);
  return { id: randHash().slice(0, 8), host: bot, items, isUser: false };
}

function seedLobbies() {
  lobbies = Array.from({ length: 6 }, makeBotLobby);
}

function renderLobbies() {
  $("#cf-total-value").textContent = "🪙 " + fmt(lobbies.reduce((s, l) => s + itemsValue(l.items), 0));
  $("#cf-total-items").textContent = lobbies.reduce((s, l) => s + l.items.length, 0);
  $("#cf-lobbies").innerHTML = lobbies.map(l => {
    const val = itemsValue(l.items);
    const chips = l.items.slice(0, 4).map(itemChip).join("") +
      (l.items.length > 4 ? `<span class="item-more">+${l.items.length - 4}</span>` : "");
    return `<div class="lobby">
      ${l.isUser ? `<div class="lobby-mine-tag">YOUR LOBBY — waiting for opponent…</div>` : ""}
      <div class="lobby-heads">
        <span class="avatar avatar-md side-h">${l.host.avatar}</span>
        <span class="lobby-vs">VS</span>
        <span class="avatar avatar-md">?</span>
      </div>
      <div class="lobby-items">${chips}</div>
      <div class="lobby-value">🪙 ${fmt(val)}</div>
      <div class="lobby-range">${fmt(val * 0.95)} – ${fmt(val * 1.1)}</div>
      ${l.isUser ? "" : `<button class="btn btn-primary" data-join="${l.id}">Join</button>`}
    </div>`;
  }).join("");
}

$("#cf-lobbies").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-join]");
  if (!btn || !requireLogin()) return;
  const lobby = lobbies.find(l => l.id === btn.dataset.join);
  if (!lobby) return;
  const val = itemsValue(lobby.items);
  openPicker({
    title: `Join ${lobby.host.name}'s flip`,
    min: val * 0.95,
    max: val * 1.1,
    onConfirm: (ids) => runFlip(lobby, { name: user.name, avatar: user.avatar }, ids, false),
  });
});

$("#cf-create-btn").addEventListener("click", () => {
  if (!requireLogin()) return;
  openPicker({
    title: "Create a coinflip",
    onConfirm: (ids) => {
      const lobby = { id: randHash().slice(0, 8), host: { name: user.name, avatar: user.avatar }, items: ids, isUser: true };
      lobbies.unshift(lobby);
      renderLobbies();
      // a bot finds the lobby after a few seconds
      setTimeout(() => {
        runFlip(lobby, rand(BOTS), matchItems(itemsValue(ids)), true);
      }, randInt(2500, 5000));
    },
  });
});

function runFlip(lobby, joiner, joinerItems, userIsHost) {
  lobbies = lobbies.filter(l => l.id !== lobby.id);
  renderLobbies();

  const hostVal = itemsValue(lobby.items);
  const joinVal = itemsValue(joinerItems);
  const total = hostVal + joinVal;
  const hostPct = hostVal / total;

  $("#flip-av1").textContent = lobby.host.avatar;
  $("#flip-name1").textContent = lobby.host.name;
  $("#flip-av2").textContent = joiner.avatar;
  $("#flip-name2").textContent = joiner.name;
  $("#flip-hash").textContent = "# " + randHash();
  $("#flip-val1").innerHTML = `🪙 ${fmt(hostVal)} <em>${(hostPct * 100).toFixed(2)}%</em>`;
  $("#flip-val2").innerHTML = `🪙 ${fmt(joinVal)} <em>${((1 - hostPct) * 100).toFixed(2)}%</em>`;
  const itemRow = (id) => {
    const it = ITEM_BY_ID[id];
    return `<div class="flip-item"><span>${it.icon}</span><span>${it.name}<small>🪙 ${fmt(it.value)}</small></span></div>`;
  };
  $("#flip-items1").innerHTML = lobby.items.map(itemRow).join("");
  $("#flip-items2").innerHTML = joinerItems.map(itemRow).join("");
  $("#flip-result").textContent = "";
  $("#flip-result").className = "flip-result";

  const coin = $("#flip-coin");
  coin.classList.add("coin-spin");
  openModal("#modal-flip");
  const tick = setInterval(sfx.tick, 220);

  const hostWins = Math.random() < hostPct;
  setTimeout(() => {
    clearInterval(tick);
    coin.classList.remove("coin-spin");
    coin.style.transform = hostWins ? "rotateY(0deg)" : "rotateY(180deg)";

    const allItems = [...lobby.items, ...joinerItems];
    const userWon = userIsHost ? hostWins : !hostWins;
    const winnerName = hostWins ? lobby.host.name : joiner.name;
    const res = $("#flip-result");
    if (userWon) {
      user.items.push(...allItems);
      res.textContent = `🎉 You won 🪙 ${fmt(total)}!`;
      res.classList.add("win");
      confetti();
      sfx.win();
    } else {
      res.textContent = `${winnerName} won 🪙 ${fmt(total)} 💀`;
      res.classList.add("lose");
      sfx.lose();
    }
    history.unshift({
      game: "Coinflip",
      vs: userIsHost ? joiner.name : lobby.host.name,
      value: total,
      won: userWon,
      time: nowTime(),
    });
    updateWallet();
    lobbies.push(makeBotLobby()); // keep the list alive
    renderLobbies();
  }, 2200);
}

$("#cf-history-btn").addEventListener("click", () => {
  $("#history-list").innerHTML = history.length
    ? history.map(h => `<div class="history-row"><span>${h.game || "Coinflip"} vs ${h.vs}</span><span>🪙 ${fmt(h.value)}</span><span class="${h.won ? "win" : "lose"}">${h.won ? "WIN" : "LOSS"}</span><span class="muted">${h.time}</span></div>`).join("")
    : `<p class="muted">No games yet.</p>`;
  openModal("#modal-history");
});

/* ---------- jackpot ---------- */

function jackpotTick() {
  if (jackpot.drawing) return;
  jackpot.timer--;
  // bots wander in
  if (jackpot.timer > 3 && Math.random() < 0.25 && jackpot.entries.length < 6) {
    const bot = rand(BOTS);
    if (!jackpot.entries.some(e => e.name === bot.name)) {
      jackpot.entries.push({ name: bot.name, avatar: bot.avatar, items: [rand(ITEMS).id, rand(ITEMS).id], isUser: false });
    }
  }
  if (jackpot.timer <= 0) drawJackpot();
  renderJackpot();
}

function renderJackpot() {
  $("#jp-timer").textContent = Math.max(jackpot.timer, 0);
  const total = jackpot.entries.reduce((s, e) => s + itemsValue(e.items), 0);
  $("#jp-value").textContent = "🪙 " + fmt(total);
  $("#jp-entries").innerHTML = jackpot.entries.map(e => {
    const v = itemsValue(e.items);
    const pct = total ? (v / total * 100).toFixed(1) : "0";
    return `<div class="jp-entry"><span class="avatar avatar-sm">${e.avatar}</span><span>${e.name}${e.isUser ? " (you)" : ""}</span><span>🪙 ${fmt(v)}</span><span class="pct">${pct}%</span></div>`;
  }).join("") || `<p class="muted">Pot is empty — be the first in!</p>`;
}

function drawJackpot() {
  const entries = jackpot.entries;
  const total = entries.reduce((s, e) => s + itemsValue(e.items), 0);
  if (entries.length < 2) {
    jackpot = { entries, timer: 20, userEntered: jackpot.userEntered, drawing: false };
    return;
  }

  // pick winner weighted by value
  let roll = Math.random() * total;
  let winner = entries[0];
  for (const e of entries) {
    roll -= itemsValue(e.items);
    if (roll <= 0) { winner = e; break; }
  }

  jackpot.drawing = true;
  spinJackpotWheel(entries, winner, () => {
    const allItems = entries.flatMap(e => e.items);
    const result = $("#jp-result");
    result.classList.remove("hidden", "win", "lose");
    if (winner.isUser) {
      user.items.push(...allItems);
      updateWallet();
      result.textContent = `🎉 You won the 🪙 ${fmt(total)} pot!`;
      result.classList.add("win");
      confetti();
      sfx.win();
      history.unshift({ game: "Jackpot", vs: "the pot", value: total, won: true, time: nowTime() });
    } else {
      result.textContent = `${winner.avatar} ${winner.name} won the 🪙 ${fmt(total)} pot.`;
      result.classList.add(jackpot.userEntered ? "lose" : "win");
      if (jackpot.userEntered) {
        sfx.lose();
        history.unshift({ game: "Jackpot", vs: "the pot", value: total, won: false, time: nowTime() });
      }
    }
    save();
    jackpot = { entries: [], timer: 20, userEntered: false, drawing: false };
    renderJackpot();
  });
}

function spinJackpotWheel(entries, winner, done) {
  const wheel = $("#jp-wheel");
  const strip = $("#jp-strip");
  wheel.classList.remove("hidden");

  // weighted strip of avatars, winner placed near the end
  const pool = entries.flatMap(e => Array(Math.max(1, Math.round(itemsValue(e.items) / 200000))).fill(e));
  const tiles = Array.from({ length: 40 }, () => rand(pool));
  const winIdx = 34;
  tiles[winIdx] = winner;
  strip.innerHTML = tiles.map(e => `<span class="avatar avatar-md">${e.avatar}</span>`).join("");

  const tileW = 56; // 48px avatar + 8px gap
  const target = winIdx * tileW + 24 - wheel.clientWidth / 2;
  strip.style.transition = "none";
  strip.style.transform = "translateX(0)";
  void strip.offsetWidth; // restart transition
  strip.style.transition = "transform 3.2s cubic-bezier(0.12, 0.8, 0.18, 1)";
  strip.style.transform = `translateX(${-target}px)`;

  const tick = setInterval(sfx.tick, 140);
  setTimeout(() => {
    clearInterval(tick);
    done();
    setTimeout(() => wheel.classList.add("hidden"), 2500);
  }, 3400);
}

$("#jp-join-btn").addEventListener("click", () => {
  if (!requireLogin()) return;
  if (jackpot.userEntered) return toast("You're already in this pot!", "error");
  if (jackpot.drawing) return toast("Wait for the next round!", "error");
  openPicker({
    title: "Deposit into the jackpot",
    onConfirm: (ids) => {
      jackpot.entries.push({ name: user.name, avatar: user.avatar, items: ids, isUser: true });
      jackpot.userEntered = true;
      renderJackpot();
    },
  });
});

/* ---------- PVP mines (1v1) ---------- */

$("#mines-find").addEventListener("click", () => {
  if (!requireLogin()) return;
  openPicker({
    title: "Wager your rides — 1v1 Mines",
    onConfirm: (ids) => startMinesMatch(ids),
  });
});

$("#mines-again").addEventListener("click", () => {
  mines = null;
  $("#mines-match").classList.add("hidden");
  $("#mines-setup").classList.remove("hidden");
});

function startMinesMatch(wager) {
  const bot = rand(BOTS);
  const botItems = matchItems(itemsValue(wager));
  const bombCount = Number($("#mines-count").value);
  const bombs = new Set();
  while (bombs.size < bombCount) bombs.add(randInt(0, 24));

  mines = { wager, bot, botItems, bombs, revealed: new Set(), turn: "you", over: false };

  $("#mines-setup").classList.add("hidden");
  $("#mines-match").classList.remove("hidden");
  $("#mines-again").classList.add("hidden");
  $("#mines-av-you").textContent = user.avatar;
  $("#mines-name-you").textContent = user.name;
  $("#mines-av-opp").textContent = bot.avatar;
  $("#mines-name-opp").textContent = bot.name;
  $("#mines-pot-value").textContent = "🪙 " + fmt(itemsValue(wager) + itemsValue(botItems));

  $("#mines-grid").innerHTML = Array.from({ length: 25 }, (_, i) =>
    `<button class="mine-tile" data-tile="${i}"></button>`).join("");
  setMinesTurn("you");
}

function setMinesTurn(turn) {
  mines.turn = turn;
  $("#mines-p-you").classList.toggle("turn", turn === "you");
  $("#mines-p-opp").classList.toggle("turn", turn === "bot");
  const msg = $("#mines-msg");
  msg.className = "mines-msg";
  msg.textContent = turn === "you" ? "Your turn — pick a tile! 💎" : `${mines.bot.name} is picking…`;
  $$("#mines-grid .mine-tile").forEach(t => {
    t.disabled = turn !== "you" || mines.revealed.has(Number(t.dataset.tile));
  });
  if (turn === "bot") setTimeout(botMinesPick, randInt(900, 1700));
}

function revealMinesTile(i, byBot) {
  const tile = $(`[data-tile="${i}"]`);
  mines.revealed.add(i);
  tile.disabled = true;
  if (mines.bombs.has(i)) {
    tile.classList.add("bomb");
    tile.textContent = "💣";
    sfx.bomb();
    endMinesMatch(!byBot ? "lose" : "win");
    return true;
  }
  tile.classList.add("gem");
  if (byBot) tile.classList.add("bot-pick");
  tile.textContent = "💎";
  sfx.gem();
  return false;
}

$("#mines-grid").addEventListener("click", (e) => {
  const tile = e.target.closest("[data-tile]");
  if (!tile || !mines || mines.over || mines.turn !== "you") return;
  const i = Number(tile.dataset.tile);
  if (mines.revealed.has(i)) return;
  if (!revealMinesTile(i, false)) setMinesTurn("bot");
});

function botMinesPick() {
  if (!mines || mines.over) return;
  const open = Array.from({ length: 25 }, (_, i) => i).filter(i => !mines.revealed.has(i));
  if (!revealMinesTile(rand(open), true)) setMinesTurn("you");
}

function endMinesMatch(outcome) {
  mines.over = true;
  // show remaining bombs
  [...mines.bombs].forEach(b => {
    const t = $(`[data-tile="${b}"]`);
    t.disabled = true;
    if (!t.textContent) { t.classList.add("bomb"); t.textContent = "💣"; }
  });
  $$("#mines-grid .mine-tile").forEach(t => t.disabled = true);
  $("#mines-p-you").classList.remove("turn");
  $("#mines-p-opp").classList.remove("turn");

  const pot = itemsValue(mines.wager) + itemsValue(mines.botItems);
  const msg = $("#mines-msg");
  if (outcome === "win") {
    user.items.push(...mines.wager, ...mines.botItems);
    msg.textContent = `🎉 ${mines.bot.name} hit a bomb — you win 🪙 ${fmt(pot)}!`;
    msg.className = "mines-msg win";
    confetti();
    sfx.win();
  } else {
    msg.textContent = `💥 You hit a bomb — ${mines.bot.name} takes 🪙 ${fmt(pot)}.`;
    msg.className = "mines-msg lose";
    sfx.lose();
  }
  history.unshift({ game: "PVP Mines", vs: mines.bot.name, value: pot, won: outcome === "win", time: nowTime() });
  updateWallet();
  $("#mines-again").classList.remove("hidden");
}

/* ---------- crash ---------- */

function renderCrashBusts() {
  $("#crash-busts").innerHTML = crashBusts.slice(-10).map(b =>
    `<span class="crash-bust-chip ${b >= 2 ? "hi" : "lo"}">${b.toFixed(2)}x</span>`).join("");
}

$("#crash-start").addEventListener("click", () => {
  if (!requireLogin() || crash) return;
  openPicker({
    title: "Wager rides on Crash",
    onConfirm: (ids) => startCrashRound(ids),
  });
});

function startCrashRound(wager) {
  const bet = itemsValue(wager);
  $("#crash-wager").innerHTML = wager.map(itemChip).join("");

  // bust point: 1/(1-u) gives a fair heavy-tail curve, capped at 100x
  const bust = Math.min(100, Math.max(1, 0.99 / (1 - Math.random())));
  crash = { wager, bet, bust, mult: 1, t: 0 };

  $("#crash-start").classList.add("hidden");
  $("#crash-cashout").classList.remove("hidden");
  const multEl = $("#crash-mult");
  multEl.className = "crash-mult";
  $("#crash-msg").textContent = `🪙 ${fmt(bet)} on board — hold on… 🚀`;

  crash.timer = setInterval(() => {
    crash.t += 0.05;
    crash.mult = Math.exp(crash.t * 0.18);
    if (crash.mult >= crash.bust) return bustCrash();
    multEl.textContent = crash.mult.toFixed(2) + "x";
    $("#crash-cashout").textContent = `Cash out 🪙 ${fmt(crash.bet * crash.mult)}`;
    const p = Math.min(1, Math.log(crash.mult) / Math.log(20));
    const rocket = $("#crash-rocket");
    rocket.style.left = (8 + p * 74) + "%";
    rocket.style.bottom = (6 + p * 70) + "%";
    if (Math.random() < 0.2) sfx.tick();
  }, 50);
}

$("#crash-cashout").addEventListener("click", () => {
  if (!crash) return;
  const { wager, bet, mult } = crash;
  stopCrash();
  // keep your rides and win extra ones worth the profit
  const winnings = matchItems(bet * (mult - 1));
  user.items.push(...wager, ...winnings);
  updateWallet();
  const multEl = $("#crash-mult");
  multEl.classList.add("cashed");
  const names = winnings.map(id => `${ITEM_BY_ID[id].icon} ${ITEM_BY_ID[id].name}`).join(", ");
  $("#crash-msg").textContent = `💰 Cashed out at ${mult.toFixed(2)}x — won ${names}!`;
  history.unshift({ game: "Crash", vs: `${mult.toFixed(2)}x`, value: itemsValue(winnings), won: true, time: nowTime() });
  if (mult >= 1.5) confetti();
  sfx.win();
});

function bustCrash() {
  const { bust, bet } = crash;
  stopCrash();
  crashBusts.push(bust);
  renderCrashBusts();
  const multEl = $("#crash-mult");
  multEl.textContent = bust.toFixed(2) + "x";
  multEl.classList.add("busted");
  $("#crash-msg").textContent = `💥 Busted at ${bust.toFixed(2)}x — your rides are gone (🪙 ${fmt(bet)}).`;
  history.unshift({ game: "Crash", vs: `${bust.toFixed(2)}x`, value: bet, won: false, time: nowTime() });
  updateWallet();
  sfx.bomb();
}

function stopCrash() {
  clearInterval(crash.timer);
  crash = null;
  $("#crash-start").classList.remove("hidden");
  $("#crash-cashout").classList.add("hidden");
  $("#crash-wager").innerHTML = "";
  const rocket = $("#crash-rocket");
  rocket.style.left = "8%";
  rocket.style.bottom = "6%";
}

/* ---------- chat ---------- */

function addChatMessage(who, text, isMine = false) {
  const el = document.createElement("div");
  el.className = "chat-msg" + (isMine ? " mine" : "");
  el.innerHTML = `<span class="avatar avatar-sm">${who.avatar}</span>
    <div style="flex:1">
      <div class="who">@${who.name} ${who.verified ? `<span class="badge">✅</span>` : ""}</div>
      <div class="body"></div>
    </div>
    <span class="time">${nowTime()}</span>`;
  el.querySelector(".body").textContent = text;
  const box = $("#chat-messages");
  box.appendChild(el);
  while (box.children.length > 60) box.firstChild.remove();
  scrollChat();
}

function scrollChat() {
  const box = $("#chat-messages");
  box.scrollTop = box.scrollHeight;
}

function sendChat() {
  const input = $("#chat-input");
  const text = input.value.trim();
  if (!text || !user) return;
  addChatMessage({ name: user.name, avatar: user.avatar, verified: false }, text, true);
  input.value = "";
  sfx.click();
}
$("#chat-send").addEventListener("click", sendChat);
$("#chat-input").addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });

function seedChat() {
  for (let i = 0; i < 7; i++) addChatMessage(rand(BOTS), rand(CHAT_LINES));
}

function chatLoop() {
  setTimeout(() => {
    addChatMessage(rand(BOTS), rand(CHAT_LINES));
    $("#online-count").textContent = String(randInt(105, 134));
    chatLoop();
  }, randInt(5000, 12000));
}

/* ---------- live ticker ---------- */

function tickerLoop() {
  const it = rand(ITEMS);
  const lines = [
    `<strong>@${rand(BOTS).name}</strong> just won ${it.icon} ${it.name} (🪙 ${fmt(it.value)}) on Coinflip!`,
    `<strong>@${rand(BOTS).name}</strong> cashed out ${(1 + Math.random() * 8).toFixed(2)}x on Crash 🚀`,
    `<strong>@${rand(BOTS).name}</strong> took a 🪙 ${fmt(randInt(2, 40) * 100000)} jackpot 🎰`,
    `<strong>@${rand(BOTS).name}</strong> won a 1v1 Mines for ${it.icon} ${it.name} ⚔️`,
  ];
  $("#ticker-text").innerHTML = rand(lines);
  setTimeout(tickerLoop, randInt(4000, 8000));
}

/* ---------- boot ---------- */

load();
$("#sound-btn").textContent = soundOn ? "🔊" : "🔇";
seedLobbies();
renderLobbies();
renderJackpot();
renderLeaderboard();
renderCrashBusts();
seedChat();
chatLoop();
tickerLoop();
setInterval(jackpotTick, 1000);
navigate("home");
