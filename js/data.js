// ===== Jailbreak 1v1 demo — item data =====
// Pretend versions of Roblox Jailbreak tradables. Values are quoted in in-game
// Jailbreak cash (like community value lists do) and are rough approximations
// inspired by public lists (JBValues, Jailbreak Changelogs, JTN) as of mid-2026.
// Nothing here is official, tradable, or affiliated with Badimo or those sites.

const ITEMS = [
  // ---- HYPERCHROMES (level 5 unless noted) ----
  { id: "hypershift",  name: "HyperShift",      icon: "🌈", value: 320000000, rarity: "godly",     type: "hyperchrome", demand: "insane" },
  { id: "hyperdiamond",name: "HyperDiamond 5",  icon: "💎", value: 55000000,  rarity: "godly",     type: "hyperchrome", demand: "high" },
  { id: "hyperblue",   name: "HyperBlue 5",     icon: "🔵", value: 50000000,  rarity: "godly",     type: "hyperchrome", demand: "high" },
  { id: "hyperpink",   name: "HyperPink 5",     icon: "🩷", value: 45000000,  rarity: "legendary", type: "hyperchrome", demand: "high" },
  { id: "hyperpurple", name: "HyperPurple 5",   icon: "🟣", value: 42000000,  rarity: "legendary", type: "hyperchrome", demand: "medium" },
  { id: "hypergreen",  name: "HyperGreen 5",    icon: "🟢", value: 35000000,  rarity: "legendary", type: "hyperchrome", demand: "medium" },
  { id: "hyperorange", name: "HyperOrange 5",   icon: "🟠", value: 30000000,  rarity: "legendary", type: "hyperchrome", demand: "medium" },
  { id: "hyperred",    name: "HyperRed 5",      icon: "🔴", value: 25000000,  rarity: "legendary", type: "hyperchrome", demand: "medium" },

  // ---- LIMITED VEHICLES ----
  { id: "torpedo",    name: "Torpedo",      icon: "🏎️", value: 95000000, rarity: "godly",     type: "vehicle", demand: "insane" },
  { id: "brulee",     name: "Brulee",       icon: "🏁", value: 45000000, rarity: "legendary", type: "vehicle", demand: "high" },
  { id: "javelin",    name: "Javelin",      icon: "🚀", value: 38000000, rarity: "legendary", type: "vehicle", demand: "insane" },
  { id: "concept",    name: "Concept",      icon: "🛸", value: 30000000, rarity: "legendary", type: "vehicle", demand: "high" },
  { id: "arachnid",   name: "Arachnid",     icon: "🕷️", value: 22000000, rarity: "legendary", type: "vehicle", demand: "high" },
  { id: "torino",     name: "Torino",       icon: "🚓", value: 18000000, rarity: "legendary", type: "vehicle", demand: "medium" },
  { id: "m12molten",  name: "M12 Molten",   icon: "🌋", value: 15000000, rarity: "legendary", type: "vehicle", demand: "high" },
  { id: "beamhybrid", name: "Beam Hybrid",  icon: "⚡", value: 12000000, rarity: "epic",      type: "vehicle", demand: "medium" },
  { id: "voltbike",   name: "Volt Bike",    icon: "🏍️", value: 10000000, rarity: "epic",      type: "vehicle", demand: "high" },
  { id: "parisian",   name: "Parisian",     icon: "🗼", value: 8500000,  rarity: "epic",      type: "vehicle", demand: "medium" },
  { id: "bigbanana",  name: "Big Banana",   icon: "🍌", value: 7000000,  rarity: "epic",      type: "vehicle", demand: "medium" },
  { id: "striker",    name: "Striker",      icon: "🦂", value: 6000000,  rarity: "epic",      type: "vehicle", demand: "medium" },
  { id: "lamatador",  name: "La Matador",   icon: "🐂", value: 5000000,  rarity: "epic",      type: "vehicle", demand: "medium" },
  { id: "beignet",    name: "Beignet",      icon: "🍩", value: 4500000,  rarity: "epic",      type: "vehicle", demand: "high" },
  { id: "megalodon",  name: "Megalodon",    icon: "🦈", value: 4000000,  rarity: "epic",      type: "vehicle", demand: "medium" },
  { id: "deja",       name: "Deja",         icon: "🌀", value: 3500000,  rarity: "rare",      type: "vehicle", demand: "medium" },
  { id: "airtail",    name: "Airtail",      icon: "🛩️", value: 3000000,  rarity: "rare",      type: "vehicle", demand: "low" },
  { id: "stallion",   name: "Stallion",     icon: "🐎", value: 2500000,  rarity: "rare",      type: "vehicle", demand: "medium" },
  { id: "surus",      name: "Surus",        icon: "🐘", value: 2000000,  rarity: "rare",      type: "vehicle", demand: "low" },
  { id: "littlebird", name: "Little Bird",  icon: "🚁", value: 1800000,  rarity: "rare",      type: "vehicle", demand: "low" },
  { id: "roadcrusher",name: "Roadcrusher",  icon: "🚜", value: 1500000,  rarity: "rare",      type: "vehicle", demand: "low" },
  { id: "bananacar",  name: "Banana Car",   icon: "🍌", value: 1200000,  rarity: "rare",      type: "vehicle", demand: "medium" },

  // ---- TEXTURES / DRIFTS / RIMS ----
  { id: "bluefire",   name: "Blue Fire (Drift)",     icon: "🔥", value: 6000000, rarity: "epic", type: "cosmetic", demand: "high" },
  { id: "gradpixel",  name: "Gradient Pixel",        icon: "👾", value: 2800000, rarity: "rare", type: "cosmetic", demand: "medium" },
  { id: "hologram",   name: "Hologram (Texture)",    icon: "🪩", value: 1500000, rarity: "rare", type: "cosmetic", demand: "medium" },
  { id: "goldrims",   name: "Gold (Rims)",           icon: "🟡", value: 800000,  rarity: "rare", type: "cosmetic", demand: "low" },

  // ---- NON-LIMITED RIDES (starter tier) ----
  { id: "volt",       name: "Volt",         icon: "🔋", value: 500000, rarity: "common", type: "vehicle", demand: "low" },
  { id: "roadster",   name: "Roadster",     icon: "🚗", value: 350000, rarity: "common", type: "vehicle", demand: "low" },
  { id: "model3",     name: "Model 3",      icon: "🚘", value: 250000, rarity: "common", type: "vehicle", demand: "low" },
  { id: "lambo",      name: "Lambo",        icon: "🟨", value: 200000, rarity: "common", type: "vehicle", demand: "low" },
  { id: "ferrari",    name: "Ferrari",      icon: "🟥", value: 180000, rarity: "common", type: "vehicle", demand: "low" },
  { id: "camaro",     name: "Camaro",       icon: "🚙", value: 120000, rarity: "common", type: "vehicle", demand: "low" },
  { id: "pickup",     name: "Pickup",       icon: "🛻", value: 60000,  rarity: "common", type: "vehicle", demand: "low" },
  { id: "suv",        name: "SUV",          icon: "🚐", value: 50000,  rarity: "common", type: "vehicle", demand: "low" },
  { id: "atv",        name: "ATV",          icon: "🛞", value: 40000,  rarity: "common", type: "vehicle", demand: "low" },
  { id: "dirtbike",   name: "Dirt Bike",    icon: "🚵", value: 30000,  rarity: "common", type: "vehicle", demand: "low" },
];

const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

const RARITY_ORDER = { godly: 0, legendary: 1, epic: 2, rare: 3, common: 4 };
const RARITY_LABEL = { godly: "GODLY", legendary: "LEGENDARY", epic: "EPIC", rare: "RARE", common: "COMMON" };
const DEMAND_LABEL = { insane: "🔥 INSANE", high: "📈 HIGH", medium: "➖ MED", low: "📉 LOW" };

// Starter garage handed out on login.
const STARTER_ITEMS = ["volt", "roadster", "lambo", "camaro", "bananacar", "pickup", "atv", "dirtbike"];
const DAILY_BONUS_MAX = 2000000; // daily gift is a random item worth up to this

const BOTS = [
  { name: "tgfsix",             avatar: "🥷", verified: true },
  { name: "McDonaldManagerWifi",avatar: "🍟", verified: false },
  { name: "Mazenesx",           avatar: "🐸", verified: true },
  { name: "nopje101",           avatar: "🧊", verified: false },
  { name: "VoltKing_YT",        avatar: "⚡", verified: false },
  { name: "CrimGrinder",        avatar: "🔫", verified: false },
  { name: "HyperShiftHunter",   avatar: "🌈", verified: true },
  { name: "RailgunRanny",       avatar: "🎯", verified: false },
  { name: "TorpedoTrader",      avatar: "🏎️", verified: false },
  { name: "BrokeAtTheBank",     avatar: "🏦", verified: false },
  { name: "CraterCityCamper",   avatar: "🏙️", verified: false },
  { name: "CargoPlaneAndy",     avatar: "✈️", verified: false },
  { name: "MuseumMain",         avatar: "🏛️", verified: true },
  { name: "PixelPusher",        avatar: "👾", verified: false },
];

const CHAT_LINES = [
  "anyone flipping torpedos rn?",
  "just won a clean javelin LETS GOO 🔥",
  "post brulee no lock",
  "who robbed the cargo train with me lol",
  "W site",
  "lost my volt bike to a 49%... pain",
  "hows it going tgf",
  "wat",
  "clean items only pls no dupes",
  "new pvp mines is actually fun ngl",
  "trading m12 molten for arachnid + adds",
  "anyone wanna 1v1 mines",
  "GG that jackpot was insane",
  "season 32 street racing HYPE 🏁",
  "9 year anniversary event this weekend!!",
  "grinding cargo plane for hyperchrome lvl 5 😮‍💨",
  "torino is so underrated fr",
  "rigged 😭 (it's not i just lost)",
  "stop begging in chat lil bro",
  "that was a massive overpay 💀",
  "demand on javelin is insane rn",
  "bro cashed out at 1.01x 💀",
  "daily gift just gave me a free ride W",
  "1v1 me mines 5 bombs rn",
  "hypershift in the jackpot?? someone clip this",
];
