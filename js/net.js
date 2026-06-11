// ===== RideClash network layer =====
// When a backend URL is configured, this upgrades the site from offline demo
// mode to live mode: real accounts, real chat, real lobbies, server-rolled
// coinflips, and real Roblox avatars. With no backend it does nothing and the
// site stays a fully local bot demo.

(function () {
  const BACKEND = (
    localStorage.getItem("rideclash-backend") ||
    (window.RIDECLASH_CONFIG || {}).backend ||
    ""
  ).replace(/\/$/, "");

  window.net = { backend: BACKEND, online: false, oauth: false };
  if (!BACKEND) return;

  // OAuth return: server redirects to /#rbx=<session token>
  if (location.hash.startsWith("#rbx=")) {
    localStorage.setItem("rideclash-token", location.hash.slice(5));
    history.replaceState(null, "", location.pathname + location.search);
  }

  let socket = null;

  function connect(guestName) {
    const auth = {};
    const token = localStorage.getItem("rideclash-token");
    if (token) auth.token = token;
    if (guestName) auth.guest = guestName;
    if (socket) socket.disconnect();
    socket = io(BACKEND, { auth });

    socket.on("connect", () => { net.online = true; });
    socket.on("disconnect", () => { net.online = false; });

    socket.on("init", (d) => {
      net.online = true;
      net.oauth = d.oauth;
      if (d.token) localStorage.setItem("rideclash-token", d.token);
      const btn = document.getElementById("roblox-login");
      if (btn && d.oauth) {
        btn.classList.remove("hidden");
        btn.href = BACKEND + "/auth/roblox/login";
      }
      if (d.you) app.setAccount(d.you);
      app.setLobbies(d.lobbies);
      app.resetChat();
      d.chat.forEach((m) => app.addServerChat(m));
      app.toast("🟢 Connected to live server", "success");
    });

    socket.on("account", (acc) => app.setAccount(acc));
    socket.on("lobbies", (l) => app.setLobbies(l));
    socket.on("online", (n) => app.setOnline(n));
    socket.on("chat:msg", (m) => app.addServerChat(m));
    socket.on("flip:result", (d) => app.showServerFlip(d));
    socket.on("gift", (g) => app.giftLanded(g.id));
    socket.on("err", (msg) => app.toast(msg, "error"));
  }

  net.guestLogin = (name) => {
    localStorage.removeItem("rideclash-token"); // fresh guest session
    connect(name);
  };
  net.sendChat = (text) => socket && socket.emit("chat:send", text);
  net.createLobby = (ids) => socket && socket.emit("lobby:create", ids);
  net.joinLobby = (id, ids) => socket && socket.emit("lobby:join", { id, items: ids });
  net.cancelLobby = () => socket && socket.emit("lobby:cancel");
  net.claimGift = () => socket && socket.emit("gift:claim");
  net.syncDelta = (add, remove) => socket && socket.emit("sync:delta", { add, remove });

  // load the socket.io client from the backend, then connect
  const s = document.createElement("script");
  s.src = BACKEND + "/socket.io/socket.io.js";
  s.onload = () => connect();
  s.onerror = () => console.warn("RideClash: backend unreachable, staying in demo mode");
  document.head.appendChild(s);
})();
