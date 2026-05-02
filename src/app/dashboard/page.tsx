"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  randomBidder,
  randomBidIncrement,
  ccToBRL,
  RARITIES,
  generateListingTitle,
  PLACEHOLDER_IMAGES,
} from "@/lib/fake-data";

type Bid = {
  id: string;
  bidder_name: string;
  bidder_avatar: string;
  amount: number;
  emirate?: string;
  created_at: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeListing, setActiveListing] = useState<any>(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [bidCount, setBidCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(900);
  const [loading, setLoading] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const bidScheduledRef = useRef(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);
      const { data: listingData } = await supabase
        .from("listings").select("*").eq("seller_id", user.id)
        .order("created_at", { ascending: false }).limit(1).single();
      if (listingData) {
        setActiveListing(listingData);
        setCurrentBid(listingData.current_bid);
        setBidCount(listingData.bid_count || 0);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!activeListing) return;
    const i = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 900)), 1000);
    return () => clearInterval(i);
  }, [activeListing]);

  useEffect(() => {
    if (!activeListing || bidScheduledRef.current) return;
    bidScheduledRef.current = true;
    let timeoutId: NodeJS.Timeout;
    const scheduleNextBid = (lastBid: number) => {
      const delay = 4000 + Math.random() * 8000;
      timeoutId = setTimeout(() => {
        const bidder = randomBidder();
        const increment = randomBidIncrement(lastBid);
        const newBid = lastBid + increment;
        const newBidObj: Bid = {
          id: `bid-${Date.now()}`,
          bidder_name: bidder.name,
          bidder_avatar: bidder.avatar,
          emirate: bidder.emirate,
          amount: newBid,
          created_at: new Date().toISOString(),
        };
        setCurrentBid(newBid);
        setBidCount((c) => c + 1);
        setBidHistory((h) => [newBidObj, ...h].slice(0, 20));
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 1200);
        scheduleNextBid(newBid);
      }, delay);
    };
    scheduleNextBid(activeListing.current_bid);
    return () => {
      clearTimeout(timeoutId);
      bidScheduledRef.current = false;
    };
  }, [activeListing]);

  async function uploadNewListing() {
    if (!user) return;
    const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
    const startPrice = 100 * rarity.multiplier + Math.floor(Math.random() * 500);
    const fakeImage = PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
    const { data } = await supabase.from("listings").insert({
      seller_id: user.id,
      title: generateListingTitle(),
      description: "Authenticated by FootFans AI™",
      image_url: fakeImage,
      starting_price: startPrice,
      current_bid: startPrice,
      rarity: rarity.label.toLowerCase(),
    }).select().single();
    if (data) {
      bidScheduledRef.current = false;
      setActiveListing(data);
      setCurrentBid(data.current_bid);
      setBidHistory([]);
      setBidCount(0);
      setTimeLeft(900);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-600">
          Carregando...
        </p>
      </div>
    );
  }

  // Mini header consistente
  const Header = () => (
    <header className="absolute top-7 left-0 right-0 z-30 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
      <Link href="/" className="flex items-baseline gap-2">
        <span className="font-display text-xl tracking-[0.15em] text-moss-500">FOOT</span>
        <span className="font-display text-sm tracking-[0.3em] text-bone-100">FANS</span>
      </Link>
      <button onClick={logout} className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-100/60 hover:text-bone-100 transition">
        Sair
      </button>
    </header>
  );

  if (!activeListing) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
        <Header />
        <div className="absolute inset-0 z-0" style={{
          background: "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 60%, #000000 100%)",
        }} />
        <div className="relative z-10 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-moss-500 mb-4">
            Olá, {profile?.username || "vendedor"}
          </p>
          <h1 className="font-display text-3xl text-bone-100 mb-8">
            Você ainda não tem<br/><span className="italic-accent text-moss-500">leilão ativo</span>
          </h1>
          <button
            onClick={uploadNewListing}
            className="bg-moss-500 hover:bg-moss-400 text-ink-950 font-bold px-8 py-4 rounded-2xl transition uppercase text-sm tracking-wide"
          >
            Iniciar leilão demo
          </button>
        </div>
      </div>
    );
  }

  const rarity = RARITIES.find(r => r.label.toLowerCase() === activeListing.rarity) || RARITIES[0];

  return (
    <div className="relative min-h-screen pb-20">
      <Header />
      <div className="absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 50%, #000000 100%)",
      }} />

      <div className="relative z-10 pt-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-3">
              Seu leilão · #{activeListing.id.slice(0, 8)}
            </p>
            <h1 className="font-display text-3xl text-bone-100 mb-2">
              {activeListing.title}
            </h1>
            <div className="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]">
              <span className="w-2 h-2 bg-moss-500 rounded-full animate-pulse"></span>
              <span className="text-moss-500">Ao vivo</span>
              <span className="text-ink-600 ml-2">· encerra em {formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Foto + lance atual */}
            <div className="relative">
              <div className="relative aspect-square bg-ink-900 overflow-hidden rounded-2xl">
                {showFlash && (
                  <div className="absolute inset-0 bg-moss-500/10 z-20 pointer-events-none animate-fade-in"></div>
                )}
                <img src={activeListing.image_url} alt={activeListing.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent"></div>

                <div className={`absolute top-4 left-4 ${rarity.color} border bg-ink-950/80 backdrop-blur-sm px-3 py-1 text-[10px] font-mono uppercase tracking-[0.3em] rounded-full`}>
                  ✦ {rarity.label}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-100/60 mb-2">
                    Lance atual
                  </p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`font-display text-5xl font-light text-moss-400 tabular-nums transition-transform ${showFlash ? "scale-110" : "scale-100"}`}>
                      {currentBid.toLocaleString("en-US")}
                    </span>
                    <span className="font-mono text-xs text-bone-100/60 uppercase tracking-wider">CC</span>
                  </div>
                  <p className="font-mono text-[10px] text-ink-600 mt-1">{ccToBRL(currentBid)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-ink-900/50 border border-ink-800 p-3 rounded-xl">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-600 mb-1">Lances</div>
                  <div className="font-display text-xl text-bone-100 tabular-nums">{bidCount}</div>
                </div>
                <div className="bg-ink-900/50 border border-ink-800 p-3 rounded-xl">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-600 mb-1">Sheiks</div>
                  <div className="font-display text-xl text-bone-100 tabular-nums">
                    {new Set(bidHistory.map(b => b.bidder_name)).size}
                  </div>
                </div>
                <div className="bg-ink-900/50 border border-ink-800 p-3 rounded-xl">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-600 mb-1">Inicial</div>
                  <div className="font-display text-xl text-bone-100 tabular-nums">
                    {activeListing.starting_price.toLocaleString("en-US")}
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-ink-900/50 border border-ink-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-ink-800">
                <h3 className="font-display text-lg text-bone-100">Lances ao vivo</h3>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-moss-500">
                  Auto · ~6s
                </span>
              </div>

              {bidHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600 mb-2">
                    Aguardando primeiro lance...
                  </div>
                  <div className="text-bone-100/40 text-xs">
                    Notificando os sheiks
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {bidHistory.map((bid, i) => (
                    <div
                      key={bid.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        i === 0
                          ? "bg-moss-900/20 border border-moss-800/50 slide-in-right"
                          : "bg-ink-800/30 border border-ink-800"
                      }`}
                    >
                      <img
                        src={bid.bidder_avatar}
                        alt=""
                        className="w-9 h-9 rounded-full grayscale"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-bone-100 truncate font-medium">
                          {bid.bidder_name}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-600">
                          {bid.emirate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-base text-moss-400 tabular-nums">
                          {bid.amount.toLocaleString("en-US")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={uploadNewListing}
              className="bg-ink-900 border border-ink-700 hover:border-moss-700 text-bone-100 font-mono text-[10px] uppercase tracking-[0.25em] px-6 py-3 rounded-2xl transition"
            >
              + Iniciar novo leilão (demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
