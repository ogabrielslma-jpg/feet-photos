// Dados fictícios — TUDO INVENTADO. Projeto acadêmico simulado.

export const FAKE_SHEIKS = [
  { name: "Sheikh Abdullah Al-Footim", emirate: "Dubai" },
  { name: "Prince Khalid bin Toetalla", emirate: "Riyadh" },
  { name: "Sultan Mohammed Al-Pedalov", emirate: "Abu Dhabi" },
  { name: "Sheikh Yusuf Al-Heelman", emirate: "Doha" },
  { name: "Prince Faisal Bin Soleyman", emirate: "Kuwait" },
  { name: "Sheikh Omar Ankleworth III", emirate: "Sharjah" },
  { name: "Sultan Rashid Al-Archski", emirate: "Manama" },
  { name: "Prince Tariq bin Bunionov", emirate: "Muscat" },
  { name: "Sheikh Ibrahim Al-Tarsali", emirate: "Dubai" },
  { name: "Sultan Hamad Bin Calluso", emirate: "Riyadh" },
  { name: "Prince Nasser Al-Insteppi", emirate: "Doha" },
  { name: "Sheikh Mansour Bin Pedicur", emirate: "Abu Dhabi" },
];

export const RARITIES = [
  { label: "Common", color: "text-ink-600 border-ink-700", multiplier: 1 },
  { label: "Rare", color: "text-blue-400 border-blue-900", multiplier: 3 },
  { label: "Epic", color: "text-purple-400 border-purple-900", multiplier: 8 },
  { label: "Legendary", color: "text-amber-400 border-amber-900", multiplier: 25 },
  { label: "Pharaonic", color: "text-moss-400 border-moss-700", multiplier: 100 },
];

export const FOOT_ADJECTIVES = [
  "Pristine", "Sun-Kissed", "Marble-Smooth", "Royal", "Pearlescent",
  "Velvet-Soft", "Diamond-Heeled", "Honey-Glazed", "Saharan", "Moonlit",
  "Silken", "Pomegranate-Tinted", "Cashmere-Wrapped", "Topaz", "Goddess-Tier",
];

export const FOOT_NOUNS = [
  "Arches", "Soles", "Heels", "Toes Quintet", "Ankles", "Pedals",
  "Footprints", "Imprints", "Twin Petals", "Sacred Pair",
];

export function randomBidder() {
  const sheik = FAKE_SHEIKS[Math.floor(Math.random() * FAKE_SHEIKS.length)];
  return {
    name: sheik.name,
    emirate: sheik.emirate,
    avatar: `https://i.pravatar.cc/100?u=${encodeURIComponent(sheik.name)}`,
  };
}

export function randomBidIncrement(currentBid: number): number {
  const min = Math.max(50, currentBid * 0.05);
  const max = Math.max(200, currentBid * 0.3);
  return Math.round((min + Math.random() * (max - min)) / 50) * 50;
}

export function generateListingTitle(): string {
  const adj = FOOT_ADJECTIVES[Math.floor(Math.random() * FOOT_ADJECTIVES.length)];
  const noun = FOOT_NOUNS[Math.floor(Math.random() * FOOT_NOUNS.length)];
  return `${adj} ${noun}`;
}

export function formatDirhams(amount: number): string {
  return `🐪 ${amount.toLocaleString("en-US")} CC`;
}

export function ccToBRL(cc: number): string {
  return `≈ R$ ${(cc * 1.05).toFixed(2)}`;
}

// Imagens de fundo escuras vibe sensual-misteriosa do Unsplash (CDN público)
export const HERO_BG = "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=2000&q=80";

export const PLACEHOLDER_IMAGES = [
  "https://picsum.photos/seed/foot1/800/800",
  "https://picsum.photos/seed/foot2/800/800",
  "https://picsum.photos/seed/foot3/800/800",
  "https://picsum.photos/seed/foot4/800/800",
  "https://picsum.photos/seed/foot5/800/800",
  "https://picsum.photos/seed/foot6/800/800",
  "https://picsum.photos/seed/foot7/800/800",
  "https://picsum.photos/seed/foot8/800/800",
];
