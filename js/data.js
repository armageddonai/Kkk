// ===== BloxySpin (Jailbreak edition) — demo data =====
// All items are pretend versions of Roblox Jailbreak vehicles with made-up values.

const ITEMS = [
  { id: "torpedo",   name: "Torpedo",        icon: "🏎️", value: 7000000, rarity: "legendary" },
  { id: "concept",   name: "Concept",        icon: "🛸", value: 5500000, rarity: "legendary" },
  { id: "hyperdiver",name: "HyperDiver",     icon: "🚤", value: 4200000, rarity: "legendary" },
  { id: "torino",    name: "Torino",         icon: "🚓", value: 3800000, rarity: "legendary" },
  { id: "brulee",    name: "Brulee",         icon: "🏁", value: 2500000, rarity: "epic" },
  { id: "beamhybrid",name: "Beam Hybrid",    icon: "⚡", value: 2200000, rarity: "epic" },
  { id: "arachnid",  name: "Arachnid",       icon: "🕷️", value: 1800000, rarity: "epic" },
  { id: "m12molten", name: "M12 Molten",     icon: "🌋", value: 1500000, rarity: "epic" },
  { id: "eternal",   name: "Eternal",        icon: "✨", value: 1200000, rarity: "epic" },
  { id: "parisian",  name: "Parisian",       icon: "🗼", value: 950000,  rarity: "rare" },
  { id: "voltbike",  name: "Volt Bike",      icon: "🏍️", value: 800000,  rarity: "rare" },
  { id: "javelin",   name: "Javelin",        icon: "🚀", value: 650000,  rarity: "rare" },
  { id: "stallion",  name: "Stallion",       icon: "🐎", value: 500000,  rarity: "rare" },
  { id: "surus",     name: "Surus",          icon: "🐘", value: 400000,  rarity: "rare" },
  { id: "beignet",   name: "Beignet",        icon: "🍩", value: 300000,  rarity: "common" },
  { id: "roadster",  name: "Roadster",       icon: "🚗", value: 250000,  rarity: "common" },
  { id: "littlebird",name: "Little Bird",    icon: "🚁", value: 200000,  rarity: "common" },
  { id: "banana",    name: "Banana Car",     icon: "🍌", value: 150000,  rarity: "common" },
  { id: "dirtbike",  name: "Dirt Bike",      icon: "🚵", value: 90000,   rarity: "common" },
  { id: "camaro",    name: "Camaro",         icon: "🚙", value: 60000,   rarity: "common" },
];

const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// Starter garage handed out on login.
const STARTER_ITEMS = ["brulee", "voltbike", "javelin", "stallion", "beignet", "roadster", "banana", "camaro"];
const STARTER_CASH = 500000;

const BOTS = [
  { name: "tgfsix",             avatar: "🥷", verified: true },
  { name: "McDonaldManagerWifi",avatar: "🍟", verified: false },
  { name: "Mazenesx",           avatar: "🐸", verified: true },
  { name: "nopje101",           avatar: "🧊", verified: false },
  { name: "VoltKing_YT",        avatar: "⚡", verified: false },
  { name: "CrimGrinder",        avatar: "🔫", verified: false },
  { name: "1MStudClub",         avatar: "💰", verified: true },
  { name: "RailgunRanny",       avatar: "🎯", verified: false },
  { name: "TorpedoTrader",      avatar: "🏎️", verified: false },
  { name: "BrokeAtTheBank",     avatar: "🏦", verified: false },
];

const CHAT_LINES = [
  "anyone flipping torpedos rn?",
  "just hit a 2.3M flip LETS GOO 🔥",
  "post brulee no lock",
  "who robbed the cargo train with me lol",
  "W site",
  "lost my volt bike to a 49%... pain",
  "hows it going tgf",
  "wat",
  "lionytowek_ grind Yo",
  "new pvp mines is actually fun ngl",
  "trading m12 molten for arachnid + adds",
  "anyone wanna 1v1 mines",
  "GG that jackpot was insane",
  "crew battles when??",
  "i grinded 8 hours for this concept dont judge",
  "torino is so underrated fr",
  "rigged 😭 (it's not i just lost)",
  "stop begging in chat lil bro",
  "jailbreak season 30 hype",
  "who else camping rising city",
];
