// Everything a designer would tweak lives here: riders, vehicles, parks, scoring.

export const RIDERS = [
  { id: 'vojta', name: 'Vojta', desc: 'Ohnivá helma s číslem 7', helmet: 'flame', hoodie: 0x2f7cff, hood: 0x2462d6, pants: 0x4f5689, glove: 0x15141c, shoe: 0xf2f2f6 },
  { id: 'nik', name: 'Ninja Nik', desc: 'Rychlý a tichý', helmet: 'ninja', hoodie: 0x26232f, hood: 0x1a1822, pants: 0x1d1b25, glove: 0xd8262f, shoe: 0x2c2935, extra: 'band' },
  { id: 'bolt', name: 'Robot Bolt', desc: 'Svítí mu oči', helmet: 'robot', hoodie: 0xb3bccf, hood: 0x8f98ae, pants: 0x6c7489, glove: 0x3a4155, shoe: 0x3a4155, extra: 'antenna', metal: true },
  { id: 'rex', name: 'Dino Rex', desc: 'Kluk v kostýmu dinosaura', helmet: 'dino', hoodie: 0x46c24f, hood: 0x369c3e, pants: 0x2f8a37, glove: 0x1f5e25, shoe: 0xf2f2f6, extra: 'dino' },
  { id: 'max', name: 'Astronaut Max', lock: 'Odemkneš na hřišti Pláž' },
  { id: 'kuba', name: 'Pirát Kuba', lock: 'Odemkneš na hřišti Sopka' },
  { id: 'banan', name: 'Opičák Banán', lock: 'Odemkneš na Ledové hoře' },
  { id: 'zlaty', name: 'Zlatý šampion', lock: 'Odemkneš za všechny levely' },
];

// speed / jump / spin are 1..5 and drive the physics (see physics.js -> stats()).
export const VEHICLES = [
  { id: 'modra', name: 'Modrá startovní', type: 'scooter', speed: 3, jump: 3, spin: 3, unlock: 0, color: 0x2a6ef0, wheel: 0x86ff4d },
  { id: 'klasik', name: 'Klasik', type: 'bmx', speed: 3, jump: 3, spin: 3, unlock: 0, color: 0xe23a2a, wheel: 0xf2f2f6 },
  { id: 'blesk', name: 'Blesk', type: 'scooter', speed: 5, jump: 2, spin: 3, unlock: 300, color: 0xffd23f, wheel: 0x2ad1ff },
  { id: 'dabel', name: 'Ďábel', type: 'bmx', speed: 5, jump: 3, spin: 2, unlock: 500, color: 0x1c1b26, wheel: 0xff3b2e },
  { id: 'pruzina', name: 'Pružina', type: 'scooter', speed: 2, jump: 5, spin: 3, unlock: 800, color: 0x3fd45a, wheel: 0xffffff },
  { id: 'tygr', name: 'Tygr', type: 'bmx', speed: 3, jump: 4, spin: 4, unlock: 1200, color: 0xff8a1f, wheel: 0x1c1b26 },
  { id: 'vrtule', name: 'Vrtule', type: 'scooter', speed: 3, jump: 3, spin: 5, unlock: 2000, color: 0xb04bff, wheel: 0xff5bd0 },
  { id: 'ohnive', name: 'Ohnivé BMX', type: 'bmx', speed: 5, jump: 5, spin: 5, unlock: 5000, color: 0xff5a14, wheel: 0xffd23f, glow: true },
];

export const PARKS = [
  { id: 'mesto', name: 'Městský skatepark', open: true, sky: ['#3a1c60', '#ff8a52'] },
  { id: 'plaz', name: 'Pláž', sky: ['#2a8ad8', '#ffd38a'] },
  { id: 'sopka', name: 'Sopka', sky: ['#2a0c18', '#ff4a1a'] },
  { id: 'led', name: 'Ledová hora', sky: ['#5ab8ff', '#e8f6ff'] },
  { id: 'dzungle', name: 'Dino džungle', sky: ['#1f5a3a', '#c8f07a'] },
  { id: 'mesic', name: 'Měsíc', sky: ['#05040f', '#3a3a6a'] },
];

// Flames per trick. Ring 4, spin 6 and flair 7/8 are Vojta's own numbers.
export const SCORE = { jump: 1, grind: 2, style: 3, ring: 4, spin: 6, flairFront: 7, flairBack: 8, flips: [0, 5, 12, 20, 30, 50] };

export const FLIP_NAMES = ['', 'SALTO', 'DVOJITÉ SALTO', 'TROJITÉ SALTO', 'ČTYŘNÁSOBNÉ SALTO', 'MEGA SALTO ×5'];
export const STYLE_NAMES = { tailwhip: 'TAILWHIP', barspin: 'BARSPIN', superman: 'SUPERMAN', nohand: 'BEZ RUKOU' };
