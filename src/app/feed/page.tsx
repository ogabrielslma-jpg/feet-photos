"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import {
  PLACEHOLDER_IMAGES,
  generateListingTitle,
  RARITIES,
} from "@/lib/fake-data";

export default function FeedPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("listings")
        .select("*, seller:profiles(username)")
        .order("created_at", { ascending: false })
        .limit(24);

      let realListings = data || [];

      if (realListings.length < 12) {
        const fakeCount = 12 - realListings.length;
        const fakes = Array.from({ length: fakeCount }, (_, i) => ({
          id: `fake-${i}`,
          title: generateListingTitle(),
          image_url: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
          current_bid: 500 + Math.floor(Math.random() * 50000),
          bid_count: Math.floor(Math.random() * 80) + 5,
          rarity: RARITIES[Math.floor(Math.random() * RARITIES.length)].label.toLowerCase(),
          seller: { username: ["pearlsoles", "moonlit_pedals", "saharan_silk"][i % 3] },
        }));
        realListings = [...realListings, ...fakes];
      }

      setListings(realListings);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="relative min-h-screen pb-20">
      <header className="absolute top-7 left-0 right-0 z-30 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl tracking-[0.15em] text-moss-500">FOOT</span>
          <span className="font-display text-sm tracking-[0.3em] text-bone-100">FANS</span>
        </Link>
        <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-100/60 hover:text-bone-100">
          Voltar
        </Link>
      </header>

      <div className="absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 50%, #000000 100%)",
      }} />

      <div className="relative z-10 pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-3">Galeria</p>
            <h1 className="font-display text-4xl text-bone-100">
              Leilões <span className="italic-accent text-moss-500">ao vivo</span>
            </h1>
          </div>

          {loading ? (
            <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-ink-600 py-20">Carregando...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((l) => {
                const r = RARITIES.find(x => x.label.toLowerCase() === l.rarity) || RARITIES[0];
                return (
                  <div key={l.id} className="bg-ink-900 border border-ink-800 hover:border-moss-700 rounded-2xl overflow-hidden transition">
                    <div className="relative aspect-square">
                      <img src={l.image_url} alt={l.title} className="w-full h-full object-cover blur-sm hover:blur-none transition grayscale hover:grayscale-0" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent"></div>
                      <div className={`absolute top-3 left-3 ${r.color} border bg-ink-950/80 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.3em] rounded-full`}>{r.label}</div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-display text-base text-bone-100 mb-1 leading-tight">{l.title}</h3>
                        <div className="font-display text-lg text-moss-400 tabular-nums">{l.current_bid.toLocaleString("en-US")} <span className="text-[10px] font-mono text-bone-100/50">CC</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
