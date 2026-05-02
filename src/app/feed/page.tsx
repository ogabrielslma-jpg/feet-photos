"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  PLACEHOLDER_IMAGES,
  generateListingTitle,
  RARITIES,
  formatDirhams,
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
          seller: {
            username: ["pearlsoles", "desert_arches", "moonlit_pedals", "saharan_silk", "honey_heels"][i % 5],
          },
        }));
        realListings = [...realListings, ...fakes];
      }

      setListings(realListings);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-4">
              Galeria
            </p>
            <h1 className="font-display text-5xl md:text-6xl text-bone-100 mb-4">
              Leilões <span className="italic-accent text-moss-500">ao vivo</span>
            </h1>
            <p className="text-bone-100/60 text-sm max-w-md mx-auto">
              {listings.length} leilões em andamento. Lances são gerados automaticamente para fins de simulação.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-600">
                Carregando...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => {
                const rarity = RARITIES.find(r => r.label.toLowerCase() === listing.rarity) || RARITIES[0];
                return (
                  <div
                    key={listing.id}
                    className="group relative bg-ink-900 border border-ink-800 hover:border-moss-700 rounded-sm overflow-hidden transition-all"
                  >
                    <div className="relative aspect-square overflow-hidden bg-ink-800">
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover blur-sm group-hover:blur-none transition-all duration-700 grayscale group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent"></div>

                      <div className={`absolute top-3 left-3 ${rarity.color} border bg-ink-950/80 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.3em] rounded-sm`}>
                        {rarity.label}
                      </div>

                      <div className="absolute top-3 right-3 bg-ink-950/80 backdrop-blur-sm border border-moss-700 px-2 py-0.5 rounded-sm flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-moss-500 rounded-full animate-pulse"></span>
                        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-moss-500">Live</span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-bone-100/50 mb-1">
                          @{listing.seller?.username || "anonymous"}
                        </p>
                        <h3 className="font-display text-lg text-bone-100 mb-2 leading-tight">
                          {listing.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-display text-xl text-moss-400 tabular-nums leading-none">
                              {listing.current_bid.toLocaleString("en-US")}
                              <span className="text-[10px] font-mono text-bone-100/50 ml-1">CC</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-ink-600">
                            {listing.bid_count} lances
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link
              href="/"
              className="inline-block bg-moss-600 hover:bg-moss-500 text-ink-950 font-medium tracking-wide px-8 py-4 rounded-sm transition uppercase text-sm pulse-green"
            >
              Quero vender também
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
