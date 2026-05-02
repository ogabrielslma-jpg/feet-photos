"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  randomBidder,
  randomBidIncrement,
  RARITIES,
  PLACEHOLDER_IMAGES,
  FAKE_SHEIKS,
} from "@/lib/fake-data";

type Tab = "feed" | "my-auction" | "wallet" | "profile";

type Bid = {
  id: string;
  bidder_name: string;
  bidder_avatar: string;
  emirate: string;
  amount: number;
  created_at: string;
};

type Notification = {
  id: string;
  bidder_name: string;
  amount: number;
};

type FeedSale = {
  id: string;
  seller_username: string;
  seller_avatar: string;
  buyer_name: string;
  buyer_emirate: string;
  amount_cc: number;
  image_url: string;
  rarity: string;
  time_ago: string;
  likes: number;
  comments: number;
};

type Story = {
  id: string;
  username: string;
  avatar: string;
  is_live: boolean;
};

type RankUser = {
  rank: number;
  username: string;
  avatar: string;
  total_sales: number;
  total_earned: number;
};

const AUCTION_DURATION = 35;
const PLATFORM_FEE = 0.10;
const CC_TO_BRL = 1.05;

const FAKE_USERNAMES = [
  "pearlsoles_official", "moonlit_pedals", "saharan_silk",
  "honey_heels", "velvet_arches", "desert_rose_88",
  "marble_toes_x", "silk_steps", "topaz_ankles",
  "diamond_petals", "royal_imprint", "goddess_pair",
  "sunkissed_steps", "bare_elegance", "soft_treads"
];

const FAKE_COMMENTS = [
  "Lindíssima! 😍",
  "Que cuidado impecável...",
  "Comprador de Dubai já tá de olho hehe",
  "Lance subindo rápido nessa!",
  "Pharaonic merecidíssimo",
  "Inspiração total ✨",
  "Já bati meu recorde de vendas semana passada",
  "Como você consegue manter assim?",
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeListing, setActiveListing] = useState<any>(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timeLeft, setTimeLeft] = useState(AUCTION_DURATION);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [saleStep, setSaleStep] = useState<"verifying" | "debiting" | "success" | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [feedSales, setFeedSales] = useState<FeedSale[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [ranking, setRanking] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSold, setHasSold] = useState(false);
  const [likedSales, setLikedSales] = useState<Set<string>>(new Set());

  // Profile editing
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

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
      setEditUsername(profileData?.username || "");
      setEditEmail(user.email || "");
      setEditBio(profileData?.bio || "");

      const { data: listingData } = await supabase
        .from("listings").select("*").eq("seller_id", user.id)
        .order("created_at", { ascending: false }).limit(1).single();
      if (listingData) {
        setActiveListing(listingData);
        setCurrentBid(listingData.current_bid);
      }
      generateMockData();
      setLoading(false);
    }
    load();
  }, []);

  function generateMockData() {
    // Stories
    const newStories: Story[] = FAKE_USERNAMES.slice(0, 10).map((u, i) => ({
      id: `story-${i}`,
      username: u,
      avatar: `https://i.pravatar.cc/200?u=${u}`,
      is_live: i < 3,
    }));
    setStories(newStories);

    // Ranking top 5
    const newRanking: RankUser[] = FAKE_USERNAMES.slice(0, 5).map((u, i) => ({
      rank: i + 1,
      username: u,
      avatar: `https://i.pravatar.cc/200?u=${u}`,
      total_sales: 50 - i * 7,
      total_earned: (50 - i * 7) * (1500 + Math.floor(Math.random() * 1000)),
    }));
    setRanking(newRanking);

    // Feed
    const sales: FeedSale[] = Array.from({ length: 12 }, (_, i) => {
      const sheik = FAKE_SHEIKS[Math.floor(Math.random() * FAKE_SHEIKS.length)];
      const amount = 200 + Math.floor(Math.random() * 9800);
      const u = FAKE_USERNAMES[i % FAKE_USERNAMES.length];
      const minutes = Math.floor(Math.random() * 50) + 1;
      return {
        id: `sale-${i}`,
        seller_username: u,
        seller_avatar: `https://i.pravatar.cc/200?u=${u}`,
        buyer_name: sheik.name,
        buyer_emirate: sheik.emirate,
        amount_cc: amount,
        image_url: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
        rarity: RARITIES[Math.floor(Math.random() * RARITIES.length)].label.toLowerCase(),
        time_ago: minutes < 5 ? "agora" : `há ${minutes}min`,
        likes: Math.floor(Math.random() * 500) + 20,
        comments: Math.floor(Math.random() * 80) + 3,
      };
    });
    setFeedSales(sales);
  }

  // Timer countdown
  useEffect(() => {
    if (!activeListing || auctionEnded) return;
    if (timeLeft <= 0) {
      setAuctionEnded(true);
      setShowFinalModal(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [activeListing, timeLeft, auctionEnded]);

  // Bids fake
  useEffect(() => {
    if (!activeListing || bidScheduledRef.current || auctionEnded) return;
    bidScheduledRef.current = true;
    let timeoutId: any;
    const scheduleNextBid = (lastBid: number) => {
      const delay = 2500 + Math.random() * 4000;
      timeoutId = setTimeout(() => {
        if (auctionEnded) return;
        const bidder = randomBidder();
        const increment = randomBidIncrement(lastBid);
        const newBid = lastBid + increment;
        const newBidObj: Bid = {
          id: `bid-${Date.now()}-${Math.random()}`,
          bidder_name: bidder.name,
          bidder_avatar: bidder.avatar,
          emirate: bidder.emirate,
          amount: newBid,
          created_at: new Date().toISOString(),
        };
        setCurrentBid(newBid);
        setBidHistory((h) => [newBidObj, ...h].slice(0, 30));

        const notif: Notification = {
          id: newBidObj.id,
          bidder_name: bidder.name,
          amount: newBid,
        };
        setNotifications((n) => [notif, ...n].slice(0, 3));
        setTimeout(() => {
          setNotifications((n) => n.filter((x) => x.id !== notif.id));
        }, 5000);

        scheduleNextBid(newBid);
      }, delay);
    };
    scheduleNextBid(activeListing.current_bid);
    return () => clearTimeout(timeoutId);
  }, [activeListing, auctionEnded]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function toggleLike(saleId: string) {
    setLikedSales((prev) => {
      const next = new Set(prev);
      if (next.has(saleId)) next.delete(saleId);
      else next.add(saleId);
      return next;
    });
  }

  async function saveProfile() {
    if (!user) return;
    setProfileSaving(true);
    try {
      await supabase.from("profiles").update({
        username: editUsername,
        bio: editBio,
      }).eq("id", user.id);
      setProfile({ ...profile, username: editUsername, bio: editBio });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {}
    setProfileSaving(false);
  }

  function selectWinningBid(bid: Bid) {
    setSelectedBid(bid);
    setSaleStep("verifying");
    setShowFinalModal(false);
    setTimeout(() => setSaleStep("debiting"), 1800);
    setTimeout(() => {
      setSaleStep("success");
      const liquid = Math.round(bid.amount * (1 - PLATFORM_FEE));
      setWalletBalance((b) => b + liquid);
      setHasSold(true);
    }, 3600);
  }

  function closeSaleAndGoToWallet() {
    setSaleStep(null);
    setSelectedBid(null);
    setTab("wallet");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const rarity = activeListing
    ? RARITIES.find((r) => r.label.toLowerCase() === activeListing.rarity) || RARITIES[0]
    : RARITIES[0];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const userInitial = (profile?.username || user?.email || "?").charAt(0).toUpperCase();
  const userAvatar = `https://i.pravatar.cc/200?u=${profile?.username || user?.email}`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Notificações flutuantes */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-xs w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-lg pointer-events-auto"
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {n.bidder_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-900 truncate font-semibold">{n.bidder_name}</div>
              <div className="text-[11px] text-gray-600">
                ofertou <span className="font-semibold text-gray-900">R$ {(n.amount * CC_TO_BRL).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex min-h-screen">
        {/* === SIDEBAR ESQUERDA (DESKTOP) === */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white sticky top-0 h-screen p-6">
          <Link href="/" className="flex items-baseline gap-2 mb-10">
            <span className="font-display text-2xl tracking-[0.15em] text-gray-900">FOOT</span>
            <span className="font-display text-xs tracking-[0.4em] text-gray-500">FANS</span>
          </Link>

          <nav className="flex-1 space-y-1">
            <NavItem
              active={tab === "feed"}
              onClick={() => setTab("feed")}
              icon="home"
              label="Feed"
            />
            <NavItem
              active={tab === "my-auction"}
              onClick={() => setTab("my-auction")}
              icon="hammer"
              label="Meu Leilão"
              badge={!auctionEnded && bidHistory.length > 0 ? String(bidHistory.length) : undefined}
            />
            <NavItem
              active={tab === "wallet"}
              onClick={() => setTab("wallet")}
              icon="wallet"
              label="Carteira"
            />
            <NavItem
              active={tab === "profile"}
              onClick={() => setTab("profile")}
              icon="user"
              label="Perfil"
            />
          </nav>

          {/* Card do usuário */}
          <div className="border border-gray-200 rounded-2xl p-3 flex items-center gap-3 mt-4">
            <img src={userAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">@{profile?.username || "user"}</div>
              <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-900 transition">
                Sair
              </button>
            </div>
          </div>
        </aside>

        {/* === CONTEÚDO CENTRAL === */}
        <main className="flex-1 max-w-2xl mx-auto pb-24 lg:pb-12">
          {/* TOPBAR MOBILE */}
          <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="font-display text-lg tracking-[0.15em] text-gray-900">FOOT</span>
              <span className="font-display text-[10px] tracking-[0.4em] text-gray-500">FANS</span>
            </Link>

            {/* Carteira mobile - ícone com saldo */}
            <button
              onClick={() => setTab("wallet")}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition rounded-full pl-2 pr-3 py-1.5"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6zM7 10V7a4 4 0 118 0v3" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-900 tabular-nums">
                R$ {(walletBalance * CC_TO_BRL).toFixed(0)}
              </span>
            </button>
          </header>

          {/* === FEED === */}
          {tab === "feed" && (
            <div className="px-0 lg:px-6 lg:pt-6">
              {/* Stories */}
              <div className="bg-white border-b lg:border lg:rounded-2xl border-gray-200 px-4 py-4 mb-4 lg:mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Destaques de hoje</h3>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: "none" }}>
                  {/* Story do user */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-400">+</div>
                    </div>
                    <span className="text-[10px] text-gray-600">Você</span>
                  </div>
                  {stories.map((s) => (
                    <div key={s.id} className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer">
                      <div className="relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                        <img src={s.avatar} alt="" className="w-full h-full rounded-full object-cover border-2 border-white" />
                        {s.is_live && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            Live
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-700 truncate max-w-[64px]">@{s.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top vendedoras da semana */}
              <div className="bg-white border-b lg:border lg:rounded-2xl border-gray-200 px-4 py-4 mb-4 lg:mb-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top vendedoras da semana</h3>
                  <span className="text-[10px] text-gray-400">🏆</span>
                </div>
                <div className="space-y-3">
                  {ranking.map((u) => (
                    <div key={u.username} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        u.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                        u.rank === 2 ? "bg-gray-100 text-gray-700" :
                        u.rank === 3 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-50 text-gray-500"
                      }`}>
                        {u.rank}
                      </div>
                      <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">@{u.username}</div>
                        <div className="text-[11px] text-gray-500">{u.total_sales} vendas</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-600 tabular-nums">
                          R$ {(u.total_earned * CC_TO_BRL / 1000).toFixed(1)}k
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts do feed */}
              <div className="space-y-4 lg:space-y-6">
                {feedSales.map((sale) => {
                  const r = RARITIES.find((x) => x.label.toLowerCase() === sale.rarity) || RARITIES[0];
                  const isLiked = likedSales.has(sale.id);
                  return (
                    <article key={sale.id} className="bg-white border-y lg:border lg:rounded-2xl border-gray-200 overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 flex items-center gap-3">
                        <img src={sale.seller_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">@{sale.seller_username}</div>
                          <div className="text-[10px] text-gray-500">{sale.time_ago}</div>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
                          r.label === "Pharaonic" ? "bg-emerald-50 text-emerald-700" :
                          r.label === "Legendary" ? "bg-amber-50 text-amber-700" :
                          r.label === "Epic" ? "bg-purple-50 text-purple-700" :
                          r.label === "Rare" ? "bg-blue-50 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {r.label}
                        </span>
                      </div>

                      {/* Imagem */}
                      <div className="relative aspect-square bg-gray-100">
                        <img src={sale.image_url} alt="" className="w-full h-full object-cover blur-md grayscale" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 text-center shadow-xl">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Vendido por</div>
                            <div className="font-display text-3xl text-gray-900 tabular-nums">
                              R$ {(sale.amount_cc * CC_TO_BRL).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 tabular-nums">
                              {sale.amount_cc.toLocaleString("en-US")} CC
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-4 mb-2">
                          <button onClick={() => toggleLike(sale.id)} className="hover:scale-110 transition">
                            <svg className={`w-6 h-6 ${isLiked ? "text-red-500 fill-current" : "text-gray-700"}`} fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          <button className="hover:scale-110 transition">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                          <button className="hover:scale-110 transition">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {(sale.likes + (isLiked ? 1 : 0)).toLocaleString("pt-BR")} curtidas
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          <span className="font-semibold">@{sale.seller_username}</span>{" "}
                          vendeu para <span className="font-semibold">{sale.buyer_name}</span> de {sale.buyer_emirate}
                        </div>
                        <button className="text-xs text-gray-500 mt-1 hover:text-gray-700">
                          Ver todos os {sale.comments} comentários
                        </button>
                        <div className="text-xs text-gray-500 mt-2 italic">
                          {FAKE_COMMENTS[Math.floor(Math.random() * FAKE_COMMENTS.length)]}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* === MEU LEILÃO === */}
          {tab === "my-auction" && activeListing && (
            <div className="px-4 lg:px-6 pt-6">
              {!auctionEnded && !hasSold && (
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Ao vivo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Encerra em</span>
                    <span className={`font-display text-3xl tabular-nums font-light ${timeLeft <= 10 ? "text-red-500" : "text-gray-900"}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              )}

              {hasSold && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 text-center mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                    ✓ Leilão finalizado
                  </p>
                  <p className="text-sm text-emerald-900">
                    Você não pode vender a mesma foto novamente.
                  </p>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
                <div className="relative aspect-square bg-gray-100">
                  <img src={activeListing.image_url} alt={activeListing.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full text-gray-900 border border-gray-200">
                    ✦ {rarity.label}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Lance atual</p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-display text-5xl text-gray-900 tabular-nums font-light">
                      R$ {(currentBid * CC_TO_BRL).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 tabular-nums">
                    {currentBid.toLocaleString("en-US")} CC
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center justify-between">
                  <span>Lances ao vivo</span>
                  <span className="text-xs text-gray-500 font-normal">
                    {bidHistory.length} ofertas
                  </span>
                </h3>
                {bidHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aguardando primeiros lances...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {bidHistory.map((bid, i) => (
                      <div
                        key={bid.id}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl ${
                          i === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"
                        }`}
                      >
                        <img src={bid.bidder_avatar} alt="" className="w-9 h-9 rounded-full grayscale flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate font-medium">{bid.bidder_name}</div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500">{bid.emirate}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-semibold text-gray-900 tabular-nums">
                            R$ {(bid.amount * CC_TO_BRL).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-gray-500 tabular-nums">
                            {bid.amount.toLocaleString("en-US")} CC
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === CARTEIRA === */}
          {tab === "wallet" && (
            <div className="px-4 lg:px-6 pt-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl p-8 mb-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs uppercase tracking-wider text-white/70">Carteira FootFans</span>
                  <svg className="w-7 h-7 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6zM7 10V7a4 4 0 118 0v3" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wider text-white/60 mb-2">Saldo disponível</p>
                <div className="font-display text-5xl font-light tabular-nums mb-1">
                  R$ {(walletBalance * CC_TO_BRL).toFixed(2)}
                </div>
                <p className="text-sm text-white/60 tabular-nums">{walletBalance.toLocaleString("en-US")} CC</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Vendas</p>
                  <p className="font-display text-2xl text-gray-900">{hasSold ? "1" : "0"}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Taxa plataforma</p>
                  <p className="font-display text-2xl text-gray-900">10%</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
                <p className="text-xs uppercase tracking-wider text-blue-700 mb-2 font-semibold">ⓘ Como funciona</p>
                <p className="text-sm text-blue-900 leading-relaxed">
                  A plataforma retém 10% de cada venda. Você recebe o valor líquido instantaneamente após o comprador
                  confirmar a transação. Saques caem na sua chave PIX em até 15 minutos.
                </p>
              </div>

              <button
                disabled={walletBalance === 0}
                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition uppercase tracking-wide text-sm"
              >
                {walletBalance > 0 ? "Sacar via PIX" : "Sem saldo disponível"}
              </button>
            </div>
          )}

          {/* === PERFIL === */}
          {tab === "profile" && (
            <div className="px-4 lg:px-6 pt-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-3">
                    <img src={userAvatar} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
                    <button className="absolute bottom-0 right-0 bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <h2 className="font-display text-2xl text-gray-900">@{profile?.username || "user"}</h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 block">Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 block">E-mail</label>
                    <input
                      type="email"
                      value={editEmail}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">E-mail não pode ser alterado</p>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 block">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      placeholder="Conte algo sobre você..."
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition resize-none"
                    />
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    {profileSaving ? "Salvando..." : profileSaved ? "✓ Salvo" : "Salvar alterações"}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Segurança</h3>
                <button className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition flex items-center justify-between">
                  <span className="text-sm text-gray-900">Alterar senha</span>
                  <span className="text-gray-400">→</span>
                </button>
              </div>

              <button
                onClick={logout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition text-sm border border-red-200"
              >
                Sair da conta
              </button>
            </div>
          )}
        </main>

        {/* === SIDEBAR DIREITA (DESKTOP) — CARTEIRINHA + LANCES === */}
        <aside className="hidden xl:flex flex-col w-80 sticky top-0 h-screen p-6 gap-4 overflow-y-auto">
          {/* Carteirinha */}
          <button
            onClick={() => setTab("wallet")}
            className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-5 text-white text-left hover:from-black hover:to-gray-800 transition shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-white/70">Carteira</span>
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6zM7 10V7a4 4 0 118 0v3" />
              </svg>
            </div>
            <div className="font-display text-3xl tabular-nums font-light">
              R$ {(walletBalance * CC_TO_BRL).toFixed(2)}
            </div>
            <p className="text-[10px] text-white/60 mt-1">Acessar carteira →</p>
          </button>

          {/* Card meu leilão (preview) */}
          {activeListing && !hasSold && !auctionEnded && (
            <button
              onClick={() => setTab("my-auction")}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-gray-300 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Seu leilão</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-red-500 font-semibold uppercase">Ao vivo</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img src={activeListing.image_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 tabular-nums">
                    R$ {(currentBid * CC_TO_BRL).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-gray-500">{bidHistory.length} lances</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Encerra em</span>
                <span className={`text-sm font-semibold tabular-nums ${timeLeft <= 10 ? "text-red-500" : "text-gray-900"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </button>
          )}

          {/* Lances ao vivo (preview) */}
          {bidHistory.length > 0 && !hasSold && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Últimos lances</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {bidHistory.slice(0, 5).map((bid) => (
                  <div key={bid.id} className="flex items-center gap-2">
                    <img src={bid.bidder_avatar} alt="" className="w-7 h-7 rounded-full grayscale" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-900 truncate">{bid.bidder_name}</div>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 tabular-nums">
                      R$ {(bid.amount * CC_TO_BRL).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-[10px] text-gray-400 mt-auto">
            © 2026 — Projeto acadêmico fictício
          </p>
        </aside>
      </div>

      {/* === BOTTOM TAB MOBILE === */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 px-2 py-2 grid grid-cols-4 gap-1">
        <BottomTab active={tab === "feed"} onClick={() => setTab("feed")} icon="home" label="Feed" />
        <BottomTab active={tab === "my-auction"} onClick={() => setTab("my-auction")} icon="hammer" label="Leilão" />
        <BottomTab active={tab === "wallet"} onClick={() => setTab("wallet")} icon="wallet" label="Carteira" />
        <BottomTab active={tab === "profile"} onClick={() => setTab("profile")} icon="user" label="Perfil" />
      </nav>

      {/* === MODAL FINAL === */}
      {showFinalModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 my-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-3xl text-gray-900 mb-2">Leilão finalizado!</h2>
              <p className="text-sm text-gray-600">
                Parabéns! Escolha um dos lances abaixo para finalizar a venda.
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 mt-3 px-3 py-2 rounded-lg border border-amber-200">
                ⚠ Atenção: você não pode vender a mesma foto para outro comprador depois.
              </p>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {bidHistory.slice(0, 8).map((bid, i) => (
                <button
                  key={bid.id}
                  onClick={() => selectWinningBid(bid)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                    i === 0
                      ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <img src={bid.bidder_avatar} alt="" className="w-10 h-10 rounded-full grayscale flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 font-semibold truncate">{bid.bidder_name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">
                      {bid.emirate} {i === 0 && <span className="text-emerald-600">· Maior lance</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-gray-900 tabular-nums">
                      R$ {(bid.amount * CC_TO_BRL).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500 tabular-nums">
                      {bid.amount.toLocaleString("en-US")} CC
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === MODAL PROCESSAMENTO === */}
      {saleStep && selectedBid && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
            {saleStep === "verifying" && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-semibold">Etapa 1 de 3</p>
                <h3 className="font-display text-2xl text-gray-900 mb-2">Verificando comprador</h3>
                <p className="text-sm text-gray-600">{selectedBid.bidder_name}</p>
              </>
            )}
            {saleStep === "debiting" && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-amber-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-xs uppercase tracking-wider text-amber-600 mb-2 font-semibold">Etapa 2 de 3</p>
                <h3 className="font-display text-2xl text-gray-900 mb-2">Debitando do saldo</h3>
                <p className="text-sm text-gray-600 mb-1">{selectedBid.bidder_name}</p>
                <p className="text-xs text-amber-600 tabular-nums font-semibold">
                  -R$ {(selectedBid.amount * CC_TO_BRL).toFixed(2)}
                </p>
              </>
            )}
            {saleStep === "success" && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs uppercase tracking-wider text-emerald-600 mb-2 font-semibold">Etapa 3 de 3</p>
                <h3 className="font-display text-2xl text-gray-900 mb-3">Venda realizada com sucesso!</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Você recebeu</p>
                  <p className="font-display text-3xl text-emerald-600 tabular-nums font-light">
                    R$ {(selectedBid.amount * (1 - PLATFORM_FEE) * CC_TO_BRL).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">(após taxa de 10% da plataforma)</p>
                </div>
                <button
                  onClick={closeSaleAndGoToWallet}
                  className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition text-sm uppercase tracking-wider"
                >
                  Ver carteira
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// === COMPONENTES ===

function NavItem({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: string; label: string; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${
        active ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon name={icon} active={active} />
      <span className="text-base flex-1 text-left">{label}</span>
      {badge && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}

function BottomTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition ${
        active ? "text-gray-900" : "text-gray-400"
      }`}
    >
      <Icon name={icon} active={active} />
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function Icon({ name, active }: { name: string; active: boolean }) {
  const fill = active ? "currentColor" : "none";
  const stroke = "currentColor";
  if (name === "home") {
    return (
      <svg className="w-6 h-6" fill={fill} stroke={stroke} viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (name === "hammer") {
    return (
      <svg className="w-6 h-6" fill="none" stroke={stroke} viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (name === "wallet") {
    return (
      <svg className="w-6 h-6" fill="none" stroke={stroke} viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6zM7 10V7a4 4 0 118 0v3" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg className="w-6 h-6" fill="none" stroke={stroke} viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return null;
}
