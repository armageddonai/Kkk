// ===== BloxySpin (Jailbreak edition) — demo app =====
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

/* ---------- state ---------- */

let user = null;            // { name, avatar, cash, items: [itemId] }
let lobbies = [];           // coinflip lobbies
let history = [];           // finished coinflips
let jackpot = { entries: [], timer: 20, userEntered: false };
let mines = null;           // active mines round

/* ---------- persistence ---------- */

function save() {
  if (user) localStorage.setItem("bloxyspin-user", JSON.stringify(user));
}
function load() {
  try {
    const raw = localStorage.getItem("bloxyspin-user");
    if (raw) { user = JSON.parse(raw); onLoggedIn(); }
  } catch (_) { /* fresh start */ }
}

/* ---------- navigation ---------- */

const VIEWS = ["home", "coinflip", "jackpot", "mines", "inventory", "chat"];
const TAB_FOR_VIEW = { home: "home", coinflip: "coinflip", jackpot: "coinflip", mines: "coinflip", inventory: "home", chat: "chat" };

function navigate(view) {
  VIEWS.forEach(v => $("#view-" + v).classList.toggle("hidden", v !== view));
  $$(".bottombar .tab").forEach(t => t.classList.toggle("active", t.dataset.nav === TAB_FOR_VIEW[view]));
  if (view === "inventory") renderInventory();
  if (view === "coinflip") renderLobbies();
  if (view === "chat") scrollChat();
  window.scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav) { e.preventDefault(); navigate(nav.dataset.nav); }
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
    cash: STARTER_CASH,
    items: [...STARTER_ITEMS],
  };
  save();
  closeModal();
  onLoggedIn();
  addChatMessage({ name: "BloxyBot", avatar: "🤖", verified: true }, `Welcome @${name}! You got a free starter garage 🚗`, true);
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
}

function updateWallet() {
  $("#wallet-value").textContent = fmt(user.cash + itemsValue(user.items));
  save();
}

function requireLogin() {
  if (user) return true;
  openModal("#modal-login");
  return false;
}

/* ---------- inventory ---------- */

function itemChip(id) {
  const it = ITEM_BY_ID[id];
  return `<span class="item-chip r-${it.rarity}" title="${it.name} — ${fmt(it.value)}">${it.icon}</span>`;
}

function renderInventory() {
  const grid = $("#inv-grid");
  if (!user || user.items.length === 0) {
    grid.innerHTML = `<p class="muted">${user ? "Your garage is empty. Win some flips!" : "Login to see your garage."}</p>`;
    return;
  }
  grid.innerHTML = user.items.map(id => {
    const it = ITEM_BY_ID[id];
    return `<div class="inv-item"><span class="big">${it.icon}</span><strong>${it.name}</strong><small>🪙 ${fmt(it.value)}</small></div>`;
  }).join("");
}

/* ---------- item picker ---------- */

let pickerState = null; // { selected:Set, min, max, onConfirm }

function openPicker({ title, min = 0, max = Infinity, onConfirm }) {
  pickerState = { selected: new Set(), min, max, onConfirm };
  $("#picker-title").textContent = title;
  $("#picker-range").textContent = max === Infinity
    ? "Pick any of your items."
    : `Pick items worth 🪙 ${fmt(min)} – ${fmt(max)} to match the lobby.`;
  const grid = $("#picker-grid");
  grid.innerHTML = user.items.map((id, idx) => {
    const it = ITEM_BY_ID[id];
    return `<button class="inv-item" data-idx="${idx}"><span class="big">${it.icon}</span><strong>${it.name}</strong><small>🪙 ${fmt(it.value)}</small></button>`;
  }).join("") || `<p class="muted">No items in your garage.</p>`;
  grid.onclick = (e) => {
    const btn = e.target.closest("[data-idx]");
    if (!btn) return;
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
  $("#picker-confirm").style.opacity = ok ? 1 : 0.4;
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
  const items = Array.from({ length: count }, () => rand(ITEMS).id);
  return { id: randHash().slice(0, 8), host: bot, items, isUser: false };
}

function seedLobbies() {
  lobbies = Array.from({ length: 5 }, makeBotLobby);
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
        const bot = rand(BOTS);
        const target = itemsValue(ids);
        const botItems = [];
        let v = 0;
        while (v < target * 0.95) {
          const pool = ITEMS.filter(i => v + i.value <= target * 1.1);
          if (!pool.length) break;
          const pick = rand(pool);
          botItems.push(pick.id);
          v += pick.value;
        }
        if (!botItems.length) botItems.push(ITEMS[ITEMS.length - 1].id);
        runFlip(lobby, bot, botItems, true);
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

  const hostWins = Math.random() < hostPct;
  setTimeout(() => {
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
    } else {
      res.textContent = `${winnerName} won 🪙 ${fmt(total)} 💀`;
      res.classList.add("lose");
    }
    history.unshift({
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
    ? history.map(h => `<div class="history-row"><span>vs ${h.vs}</span><span>🪙 ${fmt(h.value)}</span><span class="${h.won ? "win" : "lose"}">${h.won ? "WIN" : "LOSS"}</span><span class="muted">${h.time}</span></div>`).join("")
    : `<p class="muted">No games yet.</p>`;
  openModal("#modal-history");
});

/* ---------- jackpot ---------- */

function jackpotTick() {
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
  const total = jackpot.entries.reduce((s, e) => s + itemsValue(e.items), 0);
  const result = $("#jp-result");
  if (jackpot.entries.length >= 2) {
    let roll = Math.random() * total;
    let winner = jackpot.entries[0];
    for (const e of jackpot.entries) {
      roll -= itemsValue(e.items);
      if (roll <= 0) { winner = e; break; }
    }
    const allItems = jackpot.entries.flatMap(e => e.items);
    result.classList.remove("hidden", "win", "lose");
    if (winner.isUser) {
      user.items.push(...allItems);
      updateWallet();
      result.textContent = `🎉 You won the 🪙 ${fmt(total)} pot!`;
      result.classList.add("win");
    } else {
      result.textContent = `${winner.avatar} ${winner.name} won the 🪙 ${fmt(total)} pot.`;
      result.classList.add(jackpot.userEntered ? "lose" : "win");
    }
  }
  jackpot = { entries: [], timer: 20, userEntered: false };
}

$("#jp-join-btn").addEventListener("click", () => {
  if (!requireLogin()) return;
  if (jackpot.userEntered) return alert("You're already in this pot!");
  openPicker({
    title: "Deposit into the jackpot",
    onConfirm: (ids) => {
      jackpot.entries.push({ name: user.name, avatar: user.avatar, items: ids, isUser: true });
      jackpot.userEntered = true;
      renderJackpot();
    },
  });
});

/* ---------- mines ---------- */

function renderMinesGrid() {
  const grid = $("#mines-grid");
  grid.innerHTML = Array.from({ length: 25 }, (_, i) =>
    `<button class="mine-tile" data-tile="${i}" ${mines ? "" : "disabled"}></button>`).join("");
}

$("#mines-start").addEventListener("click", () => {
  if (!requireLogin()) return;
  const bet = Number($("#mines-bet").value) || 0;
  if (bet < 1000) return alert("Minimum bet is 🪙 1,000.");
  if (bet > user.cash) return alert(`Not enough coins — you have 🪙 ${fmt(user.cash)}.`);
  user.cash -= bet;
  updateWallet();

  const count = Number($("#mines-count").value);
  const bombs = new Set();
  while (bombs.size < count) bombs.add(randInt(0, 24));
  mines = { bet, bombs, revealed: new Set(), mult: 1 };
  renderMinesGrid();
  $("#mines-cashout").classList.remove("hidden");
  $("#mines-mult").textContent = "1.00x";
  $("#mines-msg").textContent = "Pick a tile…";
});

$("#mines-grid").addEventListener("click", (e) => {
  const tile = e.target.closest("[data-tile]");
  if (!tile || !mines) return;
  const i = Number(tile.dataset.tile);
  if (mines.revealed.has(i)) return;
  mines.revealed.add(i);

  if (mines.bombs.has(i)) {
    tile.classList.add("bomb");
    tile.textContent = "💣";
    [...mines.bombs].forEach(b => {
      const t = $(`[data-tile="${b}"]`);
      t.classList.add("bomb");
      t.textContent = "💣";
    });
    $("#mines-msg").textContent = `💥 Boom! You lost 🪙 ${fmt(mines.bet)}.`;
    endMines();
    return;
  }

  tile.classList.add("gem");
  tile.textContent = "💎";
  const picks = [...mines.revealed].filter(t => !mines.bombs.has(t)).length;
  const tiles = 25, bombCount = mines.bombs.size;
  // fair multiplier: odds of surviving this many picks
  let mult = 1;
  for (let k = 0; k < picks; k++) mult *= (tiles - k) / (tiles - bombCount - k);
  mines.mult = mult;
  $("#mines-mult").textContent = mult.toFixed(2) + "x";
  $("#mines-msg").textContent = `Safe! Cash out for 🪙 ${fmt(mines.bet * mult)}?`;

  if (picks === tiles - bombCount) cashOutMines(); // cleared the board
});

$("#mines-cashout").addEventListener("click", cashOutMines);

function cashOutMines() {
  if (!mines) return;
  const winnings = Math.floor(mines.bet * mines.mult);
  user.cash += winnings;
  updateWallet();
  $("#mines-msg").textContent = `💰 Cashed out 🪙 ${fmt(winnings)} (${mines.mult.toFixed(2)}x)!`;
  endMines();
}

function endMines() {
  mines = null;
  $("#mines-cashout").classList.add("hidden");
  $$("#mines-grid .mine-tile").forEach(t => t.disabled = true);
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

/* ---------- boot ---------- */

load();
seedLobbies();
renderLobbies();
renderJackpot();
renderMinesGrid();
seedChat();
chatLoop();
setInterval(jackpotTick, 1000);
navigate("home");
