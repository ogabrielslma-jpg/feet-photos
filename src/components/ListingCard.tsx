"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import {
  randomBidder,
  randomBidIncrement,
  formatDirhams,
  ccToUSD,
  RARITIES,
} from "@/lib/fake-data";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  current_bid: number;
  bid_count: number;
  rarity: string;
  seller: { username: string } | null;
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const [currentBid, setCurrentBid] = useState(listing.current_bid);
  const [bidCount, setBidCount] = useState(listing.bid_count);
  const [lastBidder, setLastBidder] = useState<{ name: string; emirate: string; avatar: string } | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const rarity = RARITIES.find((r) => r.label.toLowerCase() === listing.rarity) || RARITIES[0];
  const supabase = createClient();

  // Gera bids fake automaticamente em intervalos aleatórios (5-15s)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNextBid = () => {
      const delay = 5000 + Math.random() * 10000;
      timeoutId = setTimeout(async () => {
        const bidder = randomBidder();
        const increment = randomBidIncrement(currentBid);
        const newBid = currentBid + increment;

        setCurrentBid(newBid);
        setBidCount((c) => c + 1);
        setLastBidder(bidder);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 1000);

        // Persiste no Supabase (opcional, dá um charme)
        try {
          await supabase.from("bids").insert({
            listing_id: listing.id,
            bidder_name: bidder.name,
            bidder_avatar: bidder.avatar,
            amount: newBid,
          });
          await supabase
            .from("listings")
            .update({ current_bid: newBid, bid_count: bidCount + 1 })
            .eq("id", listing.id);
        } catch {
          // sem stress, é simulação
        }

        scheduleNextBid();
      }, delay);
    };

    scheduleNextBid();
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBid]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gold-100 hover:shadow-xl transition group relative">
      {showFlash && (
        <div className="absolute inset-0 bg-gold-300/20 z-20 pointer-events-none animate-pulse"></div>
      )}

      {/* Imagem com blur de "exclusividade" */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Image
          src={listing.image_url}
          alt={listing.title}
          fill
          className="object-cover blur-[2px] group-hover:blur-none transition-all duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition"></div>
        <div className={`absolute top-3 left-3 ${rarity.color} text-xs font-bold px-3 py-1 rounded-full`}>
          ✦ {rarity.label}
        </div>
        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-mono">
          🔴 LIVE
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-serif text-lg font-bold mb-1">{listing.title}</h3>
        <p className="text-xs text-gray-500 mb-3">
          @{listing.seller?.username || "anonymous"}
        </p>

        <div className="bg-gradient-to-r from-gold-50 to-sand-50 p-3 rounded-lg mb-3">
          <div className="text-xs text-gray-500">Lance atual</div>
          <div className="font-bold text-2xl text-gold-700">
            {formatDirhams(currentBid)}
          </div>
          <div className="text-xs text-gray-400">{ccToUSD(currentBid)}</div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span>🏷️ {bidCount} lances</span>
          <span className="text-red-600 font-mono">⏰ encerra em 2h 47m</span>
        </div>

        {lastBidder && (
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg slide-in">
            <img
              src={lastBidder.avatar}
              alt=""
              className="w-8 h-8 rounded-full"
            />
            <div className="text-xs">
              <div className="font-semibold">{lastBidder.name}</div>
              <div className="text-gray-500">acabou de dar lance • {lastBidder.emirate}</div>
            </div>
          </div>
        )}

        <button className="w-full mt-3 bg-gold-500 hover:bg-gold-600 text-white font-bold py-2 rounded-lg text-sm">
          Dar Lance Maior
        </button>
      </div>
    </div>
  );
}
