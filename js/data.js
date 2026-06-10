// ===== BloxySpin (Jailbreak edition) — demo data =====
// All items are pretend versions of Roblox Jailbreak vehicles with made-up values.

const ITEMS = [
  // ---- GODLY ----
  { id: "torpedo",    name: "Torpedo",       icon: "🏎️", value: 15000000, rarity: "godly" },
  { id: "concept",    name: "Concept",       icon: "🛸", value: 12000000, rarity: "godly" },
  { id: "hyperdiver", name: "HyperDiver",    icon: "🚤", value: 9500000,  rarity: "godly" },
  { id: "torino",     name: "Torino",        icon: "🚓", value: 8500000,  rarity: "godly" },

  // ---- LEGENDARY ----
  { id: "brulee",     name: "Brulee",        icon: "🏁", value: 6500000, rarity: "legendary" },
  { id: "beamhybrid", name: "Beam Hybrid",   icon: "⚡", value: 5800000, rarity: "legendary" },
  { id: "arachnid",   name: "Arachnid",      icon: "🕷️", value: 5000000, rarity: "legendary" },
  { id: "m12molten",  name: "M12 Molten",    icon: "🌋", value: 4400000, rarity: "legendary" },
  { id: "eternal",    name: "Eternal",       icon: "✨", value: 4000000, rarity: "legendary" },
  { id: "parisian",   name: "Parisian",      icon: "🗼", value: 3600000, rarity: "legendary" },
  { id: "airtail",    name: "Airtail",       icon: "🛩️", value: 3200000, rarity: "legendary" },
  { id: "roadcrusher",name: "Roadcrusher",   icon: "🚜", value: 2800000, rarity: "legendary" },
  { id: "widow",      name: "Widow",         icon: "🕸️", value: 2500000, rarity: "legendary" },
  { id: "wraith",     name: "Wraith",        icon: "👻", value: 2200000, rarity: "legendary" },

  // ---- EPIC ----
  { id: "voltbike",   name: "Volt Bike",     icon: "🏍️", value: 1900000, rarity: "epic" },
  { id: "javelin",    name: "Javelin",       icon: "🚀", value: 1700000, rarity: "epic" },
  { id: "stallion",   name: "Stallion",      icon: "🐎", value: 1500000, rarity: "epic" },
  { id: "surus",      name: "Surus",         icon: "🐘", value: 1300000, rarity: "epic" },
  { id: "bigbanana",  name: "Big Banana",    icon: "🍌", value: 1150000, rarity: "epic" },
  { id: "beignet",    name: "Beignet",       icon: "🍩", value: 1000000, rarity: "epic" },
  { id: "striker",    name: "Striker",       icon: "🦂", value: 900000,  rarity: "epic" },
  { id: "deja",       name: "Deja",          icon: "🌀", value: 820000,  rarity: "epic" },
  { id: "cyberwall",  name: "Cyber Wall",    icon: "🤖", value: 750000,  rarity: "epic" },
  { id: "falcon",     name: "Falcon",        icon: "🦅", value: 680000,  rarity: "epic" },
  { id: "lamatador",  name: "La Matador",    icon: "🐂", value: 600000,  rarity: "epic" },
  { id: "volt4x4",    name: "Volt 4x4",      icon: "🔋", value: 540000,  rarity: "epic" },

  // ---- RARE ----
  { id: "bananacar",  name: "Banana Car",    icon: "🍌", value: 480000, rarity: "rare" },
  { id: "littlebird", name: "Little Bird",   icon: "🚁", value: 430000, rarity: "rare" },
  { id: "jetski",     name: "Jet Ski",       icon: "🌊", value: 380000, rarity: "rare" },
  { id: "drone",      name: "Drone",         icon: "🛰️", value: 340000, rarity: "rare" },
  { id: "slipstream", name: "Slipstream",    icon: "💨", value: 300000, rarity: "rare" },
  { id: "megalodon",  name: "Megalodon",     icon: "🦈", value: 270000, rarity: "rare" },
  { id: "frostbike",  name: "Frost Bike",    icon: "❄️", value: 240000, rarity: "rare" },
  { id: "pixelracer", name: "Pixel Racer",   icon: "👾", value: 210000, rarity: "rare" },
  { id: "sandcrawler",name: "Sand Crawler",  icon: "🏜️", value: 185000, rarity: "rare" },
  { id: "nighthawk",  name: "Night Hawk",    icon: "🌙", value: 160000, rarity: "rare" },

  // ---- COMMON ----
  { id: "roadster",   name: "Roadster",      icon: "🚗", value: 140000, rarity: "common" },
  { id: "cybertruck", name: "Cybertruck",    icon: "🛻", value: 120000, rarity: "common" },
  { id: "model3",     name: "Model 3",       icon: "🚘", value: 100000, rarity: "common" },
  { id: "lambo",      name: "Lambo",         icon: "🟡", value: 88000,  rarity: "common" },
  { id: "ferrari",    name: "Ferrari",       icon: "🔴", value: 76000,  rarity: "common" },
  { id: "mclaren",    name: "McLaren",       icon: "🟠", value: 65000,  rarity: "common" },
  { id: "mustang",    name: "Mustang",       icon: "🐴", value: 55000,  rarity: "common" },
  { id: "camaro",     name: "Camaro",        icon: "🚙", value: 48000,  rarity: "common" },
  { id: "mini",       name: "Mini",          icon: "🚕", value: 40000,  rarity: "common" },
  { id: "pickup",     name: "Pickup",        icon: "🛻", value: 34000,  rarity: "common" },
  { id: "suv",        name: "SUV",           icon: "🚐", value: 28000,  rarity: "common" },
  { id: "dunebuggy",  name: "Dune Buggy",    icon: "🏖️", value: 24000,  rarity: "common" },
  { id: "atv",        name: "ATV",           icon: "🛞", value: 20000,  rarity: "common" },
  { id: "dirtbike",   name: "Dirt Bike",     icon: "🚵", value: 16000,  rarity: "common" },
  { id: "gokart",     name: "Go Kart",       icon: "🏎",  value: 12000,  rarity: "common" },
  { id: "scooter",    name: "Scooter",       icon: "🛴", value: 8000,   rarity: "common" },
];

const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

const RARITY_ORDER = { godly: 0, legendary: 1, epic: 2, rare: 3, common: 4 };
const RARITY_LABEL = { godly: "GODLY", legendary: "LEGENDARY", epic: "EPIC", rare: "RARE", common: "COMMON" };

// Starter garage handed out on login.
const STARTER_ITEMS = ["stallion", "beignet", "bananacar", "littlebird", "roadster", "lambo", "camaro", "dirtbike"];
const DAILY_BONUS_MAX = 500000; // daily gift is a random ride worth up to this

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
  { name: "RisingCityCamper",   avatar: "🏙️", verified: false },
  { name: "CargoTrainAndy",     avatar: "🚂", verified: false },
  { name: "MuseumMain",         avatar: "🏛️", verified: true },
  { name: "PixelPusher",        avatar: "👾", verified: false },
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
  "crash to 10x watch this",
  "bro cashed out at 1.01x 💀",
  "daily gift just gave me a free ride W",
  "1v1 me mines 5 bombs rn",
];
