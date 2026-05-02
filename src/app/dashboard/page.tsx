"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  randomBidder,
  randomBidIncrementBRL,
  brlToLocal,
  RARITIES,
  PLACEHOLDER_IMAGES,
  FAKE_SHEIKS,
  generateListingTitle,
  type Sheik,
} from "@/lib/fake-data";

type Tab = "feed" | "my-auction" | "wallet" | "profile";

type Bid = {
  id: string;
  bidder_name: string;
  bidder_avatar: string;
  emirate: string;
  country: string;
  flag: string;
  currency: string;
  currencyRate: number;
  amount_brl: number;
  created_at: string;
};

type Notification = {
  id: string;
  bidder_name: string;
  flag: string;
  amount_brl: number;
};

type FeedSale = {
  id: string;
  seller_username: string;
  seller_avatar: string;
  buyer_name: string;
  buyer_emirate: string;
  buyer_flag: string;
  amount_brl: number;
  image_url: string;
  rarity: string;
  time_ago: string;
  bids_count: number;
};

type RankUser = {
  rank: number;
  username: string;
  avatar: string;
  total_sales: number;
  total_earned_brl: number;
  total_bids: number;
};

// Leilão histórico (concluído)
type PastAuction = {
  id: string;
  image_url: string;
  rarity: string;
  final_amount_brl: number;
  buyer: Sheik;
  bids: Bid[];
  ended_at: string;
};

const PLATFORM_FEE = 0.10;
const MIN_BID = 220;
const MAX_BID = 399.70;
const UPLOAD_COOLDOWN_HOURS = 2;

const FAKE_USERNAMES = [
  "pearlsoles_official", "moonlit_pedals", "saharan_silk",
  "honey_heels", "velvet_arches", "desert_rose_88",
  "marble_toes_x", "silk_steps", "topaz_ankles",
  "diamond_petals", "royal_imprint", "goddess_pair",
];

const FAKE_COMMENTS = [
  "Lindíssima! 😍",
  "Que cuidado impecável...",
  "Comprador de Dubai já tá de olho hehe",
  "Lance subindo rápido nessa!",
  "Pharaonic merecidíssimo",
  "Inspiração total ✨",
];

function fmtBRL(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCurrency(v: number, currency: string): string {
  return `${currency} ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Leilão atual
  const [activeListing, setActiveListing] = useState<any>(null);
  const [currentBidBRL, setCurrentBidBRL] = useState(MIN_BID);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [hasSold, setHasSold] = useState(false);

  // Modal venda
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [saleStep, setSaleStep] = useState<"verifying" | "debiting" | "success" | null>(null);

  // Histórico de leilões
  const [pastAuctions, setPastAuctions] = useState<PastAuction[]>([]);
  const [openPastAuction, setOpenPastAuction] = useState<PastAuction | null>(null);

  // Notificações (duram 2min agora)
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Online counter
  const [onlineBuyers, setOnlineBuyers] = useState(13247);

  // Upload cooldown
  const [lastUploadAt, setLastUploadAt] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Carteira
  const [walletBalance, setWalletBalance] = useState(0);

  // Feed
  const [feedSales, setFeedSales] = useState<FeedSale[]>([]);
  const [ranking, setRanking] = useState<RankUser[]>([]);
  const [likedSales, setLikedSales] = useState<Set<string>>(new Set());

  // Profile editing
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();
  const bidScheduledRef = useRef(false);

  // ============ LOAD INICIAL ============
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
        // Lance inicial em R$ 220 (não usa current_bid antigo de CC)
        setCurrentBidBRL(MIN_BID);
        // Timer 30-45s aleatório
        setTimeLeft(30 + Math.floor(Math.random() * 16));
      }
      generateMockData();
      setLoading(false);
    }
    load();
  }, []);

  function generateMockData() {
    const newRanking: RankUser[] = FAKE_USERNAMES.slice(0, 5).map((u, i) => ({
      rank: i + 1,
      username: u,
      avatar: `https://i.pravatar.cc/200?u=${u}`,
      total_sales: 50 - i * 7,
      total_earned_brl: (50 - i * 7) * (250 + Math.floor(Math.random() * 130)),
      total_bids: (50 - i * 7) * (8 + Math.floor(Math.random() * 6)),
    }));
    setRanking(newRanking);

    const sales: FeedSale[] = Array.from({ length: 12 }, (_, i) => {
      const sheik = FAKE_SHEIKS[Math.floor(Math.random() * FAKE_SHEIKS.length)];
      const amount = MIN_BID + Math.random() * (MAX_BID - MIN_BID);
      const u = FAKE_USERNAMES[i % FAKE_USERNAMES.length];
      const minutes = Math.floor(Math.random() * 50) + 1;
      return {
        id: `sale-${i}`,
        seller_username: u,
        seller_avatar: `https://i.pravatar.cc/200?u=${u}`,
        buyer_name: sheik.name,
        buyer_emirate: sheik.emirate,
        buyer_flag: sheik.flag,
        amount_brl: Math.round(amount * 100) / 100,
        image_url: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
        rarity: RARITIES[Math.floor(Math.random() * RARITIES.length)].label.toLowerCase(),
        time_ago: minutes < 5 ? "agora" : `há ${minutes}min`,
        bids_count: 9 + Math.floor(Math.random() * 9), // 9 a 17
      };
    });
    setFeedSales(sales);
  }

  // ============ TIMER COUNTDOWN ============
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

  // ============ ONLINE BUYERS DINAMICO ============
  useEffect(() => {
    const i = setInterval(() => {
      setOnlineBuyers((prev) => {
        const delta = Math.floor(Math.random() * 80) - 40;
        const next = prev + delta;
        return Math.max(12001, Math.min(15500, next));
      });
    }, 3000);
    return () => clearInterval(i);
  }, []);

  // ============ COOLDOWN UPLOAD ============
  useEffect(() => {
    if (!lastUploadAt) return;
    const i = setInterval(() => {
      const elapsed = Date.now() - lastUploadAt;
      const total = UPLOAD_COOLDOWN_HOURS * 60 * 60 * 1000;
      const remaining = total - elapsed;
      setCooldownRemaining(Math.max(0, remaining));
    }, 1000);
    return () => clearInterval(i);
  }, [lastUploadAt]);

  function formatCooldown(ms: number): string {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m.toString().padStart(2, "0")}min ${s.toString().padStart(2, "0")}s`;
  }

  // ============ BIDS FAKE + NOTIFICAÇÕES (2min) ============
  useEffect(() => {
    if (!activeListing || bidScheduledRef.current || auctionEnded) return;
    bidScheduledRef.current = true;
    let timeoutId: any;
    const scheduleNextBid = (lastBid: number) => {
      const delay = 1500 + Math.random() * 3000;
      timeoutId = setTimeout(() => {
        if (auctionEnded) return;
        const bidder = randomBidder();
        const increment = randomBidIncrementBRL(lastBid);
        let newBid = Math.round((lastBid + increment) * 100) / 100;
        if (newBid > MAX_BID) newBid = MAX_BID;
        const newBidObj: Bid = {
          id: `bid-${Date.now()}-${Math.random()}`,
          bidder_name: bidder.name,
          bidder_avatar: bidder.avatar,
          emirate: bidder.emirate,
          country: bidder.country,
          flag: bidder.flag,
          currency: bidder.currency,
          currencyRate: bidder.currencyRate,
          amount_brl: newBid,
          created_at: new Date().toISOString(),
        };
        setCurrentBidBRL(newBid);
        setBidHistory((h) => [newBidObj, ...h].slice(0, 30));

        // Notificação dura 2 minutos
        const notif: Notification = {
          id: newBidObj.id,
          bidder_name: bidder.name,
          flag: bidder.flag,
          amount_brl: newBid,
        };
        setNotifications((n) => [notif, ...n].slice(0, 4));
        setTimeout(() => {
          setNotifications((n) => n.filter((x) => x.id !== notif.id));
        }, 120000);

        if (newBid < MAX_BID) {
          scheduleNextBid(newBid);
        }
      }, delay);
    };
    scheduleNextBid(currentBidBRL);
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

  async function changePassword() {
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || "Erro ao alterar senha.");
    }
    setPasswordSaving(false);
  }

  function selectWinningBid(bid: Bid) {
    setSelectedBid(bid);
    setSaleStep("verifying");
    setShowFinalModal(false);
    setTimeout(() => setSaleStep("debiting"), 1800);
    setTimeout(() => {
      setSaleStep("success");
      const liquid = Math.round(bid.amount_brl * (1 - PLATFORM_FEE) * 100) / 100;
      setWalletBalance((b) => Math.round((b + liquid) * 100) / 100);
      setHasSold(true);

      // Salva como leilão histórico
      const past: PastAuction = {
        id: `past-${Date.now()}`,
        image_url: activeListing?.image_url || "",
        rarity: activeListing?.rarity || "common",
        final_amount_brl: bid.amount_brl,
        buyer: {
          name: bid.bidder_name,
          emirate: bid.emirate,
          country: bid.country,
          flag: bid.flag,
          currency: bid.currency,
          currencyRate: bid.currencyRate,
        },
        bids: [...bidHistory],
        ended_at: new Date().toISOString(),
      };
      setPastAuctions((p) => [past, ...p]);
      setLastUploadAt(Date.now());
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

  const userInitial = (profile?.username || user?.email || "?").charAt(0).toUpperCase();
  // Por padrão mostra inicial. Só usa imagem se user fez upload custom
  const userAvatarUrl = customAvatar;

  const canUpload = !lastUploadAt || cooldownRemaining <= 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* === Notificações flutuantes (2min) === */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-xs w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-lg pointer-events-auto"
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            <div className="text-2xl flex-shrink-0">{n.flag}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-900 truncate font-semibold">{n.bidder_name}</div>
              <div className="text-[11px] text-gray-600">
                ofertou <span className="font-semibold text-emerald-600">R$ {fmtBRL(n.amount_brl)}</span>
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
            <NavItem active={tab === "feed"} onClick={() => setTab("feed")} icon="home" label="Feed" />
            <NavItem active={tab === "my-auction"} onClick={() => setTab("my-auction")} icon="hammer" label="Meus Leilões"
              badge={!auctionEnded && bidHistory.length > 0 ? String(bidHistory.length) : undefined} />
            <NavItem active={tab === "wallet"} onClick={() => setTab("wallet")} icon="wallet" label="Carteira" />
            <NavItem active={tab === "profile"} onClick={() => setTab("profile")} icon="user" label="Perfil" />
          </nav>

          <div className="border border-gray-200 rounded-2xl p-3 flex items-center gap-3 mt-4">
            <UserAvatar url={userAvatarUrl} initial={userInitial} size={40} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">@{profile?.username || "user"}</div>
              <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-900 transition">Sair</button>
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
                R$ {fmtBRL(walletBalance)}
              </span>
            </button>
          </header>

          {/* === FEED === */}
          {tab === "feed" && (
            <div className="px-0 lg:px-6 lg:pt-6">
              {/* Card "compradores online" + botão upload */}
              <div className="bg-white border-b lg:border lg:rounded-2xl border-gray-200 px-4 py-4 mb-4 lg:mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">Compradores online</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-base font-bold tabular-nums">{onlineBuyers.toLocaleString("pt-BR")}</span>
                  </div>
                </div>

                <button
                  disabled={!canUpload}
                  onClick={() => {
                    if (!canUpload) return;
                    alert("Para fins de demonstração: upload de nova foto seria aqui. Após enviar, cooldown de 2h é iniciado.");
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition ${
                    canUpload
                      ? "bg-gray-900 hover:bg-black text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {canUpload ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Enviar novo upload para leilão</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Próximo upload em {formatCooldown(cooldownRemaining)}</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-500 text-center mt-2 leading-relaxed">
                  ⓘ Uploads liberados a cada 2h para dar chance a todas as criadoras.
                </p>
              </div>

              {/* Top vendedoras da semana */}
              <div className="bg-white border-b lg:border lg:rounded-2xl border-gray-200 px-4 py-5 mb-4 lg:mb-6">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Top creators da semana</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Atualizado a cada 24h</p>
                  </div>
                  <span className="text-xl">🏆</span>
                </div>
                <div className="space-y-3">
                  {ranking.map((u) => (
                    <div key={u.username} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        u.rank === 1 ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 shadow-sm" :
                        u.rank === 2 ? "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 shadow-sm" :
                        u.rank === 3 ? "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 shadow-sm" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {u.rank}
                      </div>
                      <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">@{u.username}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                            {u.total_sales}
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            {u.total_bids}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-600 tabular-nums">
                          R$ {fmtBRL(u.total_earned_brl)}
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">arrecadado</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posts do feed */}
              <div className="space-y-4 lg:space-y-6">
                {feedSales.map((sale) => {
                  const r = RARITIES.find((x) => x.label.toLowerCase() === sale.rarity) || RARITIES[0];
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
                              R$ {fmtBRL(sale.amount_brl)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-3 mb-2 text-gray-700">
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                              {sale.bids_count} lances
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          <span className="font-semibold">@{sale.seller_username}</span>{" "}
                          vendeu para{" "}
                          <span className="font-semibold inline-flex items-center gap-1">
                            <span className="text-base">{sale.buyer_flag}</span>
                            {sale.buyer_name}
                          </span>{" "}
                          de {sale.buyer_emirate}
                        </div>
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

          {/* === MEUS LEILÕES === */}
          {tab === "my-auction" && (
            <div className="px-4 lg:px-6 pt-6 space-y-4">
              {/* LEILÃO ATIVO */}
              {activeListing && !hasSold && (
                <div className="bg-white border-2 border-emerald-300 rounded-2xl overflow-hidden">
                  {/* Header com timer cronômetro */}
                  <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-xs uppercase tracking-wider text-red-600 font-bold">Ao vivo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-wider text-gray-500">Seu leilão acaba em</div>
                        <div className={`text-2xl font-display font-light tabular-nums ${timeLeft <= 10 ? "text-red-500" : "text-gray-900"}`}>
                          {timeLeft}s
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Foto + lance */}
                  <div className="relative aspect-square bg-gray-100">
                    <img src={activeListing.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full text-gray-900 border border-gray-200">
                      ✦ {rarity.label}
                    </div>
                    <div className="absolute top-3 right-3 bg-amber-50 border border-amber-200 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider rounded-full text-amber-800">
                      ⚠ Vende uma vez só
                    </div>
                  </div>

                  <div className="p-5 border-b border-gray-100">
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Lance atual</p>
                    <div className="font-display text-4xl text-gray-900 tabular-nums font-light">
                      R$ {fmtBRL(currentBidBRL)}
                    </div>
                  </div>

                  {/* Lances ao vivo (em R$) */}
                  <div className="p-5">
                    <h3 className="font-semibold text-base text-gray-900 mb-3 flex items-center justify-between">
                      <span>Lances ao vivo</span>
                      <span className="text-[10px] text-gray-500 font-normal uppercase tracking-wider">
                        {bidHistory.length} ofertas
                      </span>
                    </h3>
                    {bidHistory.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        Aguardando primeiros lances...
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto">
                        {bidHistory.map((bid, i) => (
                          <div key={bid.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                            i === 0 ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"
                          }`}>
                            <img src={bid.bidder_avatar} alt="" className="w-9 h-9 rounded-full grayscale flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 truncate font-medium flex items-center gap-1">
                                <span className="text-base">{bid.flag}</span>
                                <span className="truncate">{bid.bidder_name}</span>
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-gray-500">{bid.emirate}</div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-semibold text-gray-900 tabular-nums">
                                R$ {fmtBRL(bid.amount_brl)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LEILÕES ANTERIORES (cards) */}
              {pastAuctions.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1">
                    Leilões anteriores ({pastAuctions.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {pastAuctions.map((past) => {
                      const r = RARITIES.find((x) => x.label.toLowerCase() === past.rarity) || RARITIES[0];
                      return (
                        <button
                          key={past.id}
                          onClick={() => setOpenPastAuction(past)}
                          className="bg-white border border-gray-200 rounded-2xl overflow-hidden text-left hover:border-gray-400 transition"
                        >
                          <div className="relative aspect-square bg-gray-100">
                            <img src={past.image_url} alt="" className="w-full h-full object-cover blur-sm" />
                            <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded-full text-gray-900">
                              {r.label}
                            </div>
                            <div className="absolute bottom-2 right-2 text-2xl">{past.buyer.flag}</div>
                          </div>
                          <div className="p-3">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Arrematado por</div>
                            <div className="font-display text-lg text-emerald-600 tabular-nums font-semibold">
                              R$ {fmtBRL(past.final_amount_brl)}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate mt-1">
                              {past.buyer.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {pastAuctions.length === 0 && hasSold === false && !activeListing && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">Nenhum leilão ainda. Envie sua primeira foto pelo feed.</p>
                </div>
              )}
            </div>
          )}

          {/* === CARTEIRA === */}
          {tab === "wallet" && (
            <div className="px-4 lg:px-6 pt-6 pb-8">
              {/* Card principal saldo */}
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-7 mb-5 text-white shadow-2xl overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
                <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Carteira FootFans</p>
                      <p className="text-xs text-white/70">@{profile?.username || "user"}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6zM7 10V7a4 4 0 118 0v3" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1.5">Saldo disponível</p>
                  <div className="font-display text-5xl font-light tabular-nums tracking-tight">
                    R$ {fmtBRL(walletBalance)}
                  </div>
                </div>
              </div>

              {/* Stats em grid */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Vendas</p>
                  <p className="font-display text-2xl text-gray-900 font-semibold">{pastAuctions.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Total sacado</p>
                  <p className="font-display text-2xl text-gray-900 font-semibold">R$ 0</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">Pendente</p>
                  <p className="font-display text-2xl text-gray-900 font-semibold">R$ 0</p>
                </div>
              </div>

              {/* Botão saque */}
              <button
                disabled={walletBalance === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition tracking-wide text-sm flex items-center justify-center gap-2 shadow-md mb-5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {walletBalance > 0 ? "Sacar via PIX agora" : "Sem saldo disponível"}
              </button>

              {/* Card taxa progressiva */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Sua taxa atual</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-4xl text-gray-900 font-light tabular-nums">10</span>
                      <span className="text-2xl text-gray-700">%</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-full px-3 py-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-700 font-semibold">Iniciante</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">📈 Reduza sua taxa</p>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">10%</div>
                        <div className="text-xs text-gray-700 truncate">
                          <span className="font-semibold">Iniciante</span> — até R$ 50.000 sacados
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">atual</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 opacity-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">8%</div>
                        <div className="text-xs text-gray-700 truncate">
                          <span className="font-semibold">Pro</span> — após R$ 50.000 sacados
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">🔒</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 opacity-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 flex items-center justify-center text-xs font-bold flex-shrink-0">5%</div>
                        <div className="text-xs text-gray-700 truncate">
                          <span className="font-semibold">Super Creator</span> — convite especial
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 flex-shrink-0">⭐</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 text-center mt-3 leading-relaxed">
                  Quanto mais você vende, menos a plataforma cobra.
                </p>
              </div>

              {/* Banner app em breve */}
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-5 overflow-hidden shadow-md">
                <div className="absolute -right-6 -top-6 text-7xl opacity-20">📱</div>
                <div className="relative">
                  <div className="inline-block bg-white/20 backdrop-blur text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mb-2">
                    Em breve
                  </div>
                  <h4 className="text-white font-bold text-base leading-tight mb-1">
                    Vocês pediram e está quase lá!
                  </h4>
                  <p className="text-white/90 text-xs leading-relaxed mb-3">
                    Nos próximos dias, o FootFans estará disponível na <strong>App Store</strong> e <strong>Play Store</strong>.
                  </p>
                  <div className="flex gap-2">
                    <div className="bg-black/40 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                      <span className="text-base"></span>
                      <div className="text-white">
                        <div className="text-[8px] leading-none uppercase opacity-80">Em breve na</div>
                        <div className="text-[11px] leading-tight font-bold">App Store</div>
                      </div>
                    </div>
                    <div className="bg-black/40 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                      <span className="text-base">▶</span>
                      <div className="text-white">
                        <div className="text-[8px] leading-none uppercase opacity-80">Em breve no</div>
                        <div className="text-[11px] leading-tight font-bold">Google Play</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === PERFIL === */}
          {tab === "profile" && (
            <div className="px-4 lg:px-6 pt-6 pb-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-3">
                    <UserAvatar url={userAvatarUrl} initial={userInitial} size={96} />
                    <label className="absolute -bottom-1 -right-1 bg-gray-900 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-black transition cursor-pointer shadow-lg ring-4 ring-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") setCustomAvatar(reader.result);
                          };
                          reader.readAsDataURL(f);
                        }} />
                    </label>
                  </div>
                  <h2 className="font-display text-2xl text-gray-900">@{profile?.username || "user"}</h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {!customAvatar && (
                    <p className="text-[11px] text-gray-400 mt-2 text-center">
                      Clique no ícone de câmera para adicionar foto
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 block">Username</label>
                    <input type="text" value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 block">E-mail</label>
                    <input type="email" value={editEmail} disabled
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 block">Bio</label>
                    <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
                      placeholder="Conte algo sobre você..."
                      className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition resize-none" />
                  </div>
                  <button onClick={saveProfile} disabled={profileSaving}
                    className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition text-sm">
                    {profileSaving ? "Salvando..." : profileSaved ? "✓ Salvo" : "Salvar alterações"}
                  </button>
                </div>
              </div>

              {/* Card Segurança */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Segurança</h3>
                <button onClick={() => {
                  setNewPassword("");
                  setConfirmNewPassword("");
                  setPasswordError("");
                  setPasswordSuccess(false);
                  setShowPasswordModal(true);
                }}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 transition rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Alterar senha</div>
                      <div className="text-[11px] text-gray-500">Atualize a senha da sua conta</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>

              <button onClick={logout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition text-sm border border-red-200">
                Sair da conta
              </button>
            </div>
          )}
        </main>

        {/* === SIDEBAR DIREITA (DESKTOP) === */}
        <aside className="hidden xl:flex flex-col w-80 sticky top-0 h-screen p-6 gap-4 overflow-y-auto">
          <button onClick={() => setTab("wallet")}
            className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-5 text-white text-left hover:from-black hover:to-gray-800 transition shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-white/70">Carteira</span>
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6zM7 10V7a4 4 0 118 0v3" />
              </svg>
            </div>
            <div className="font-display text-3xl tabular-nums font-light">
              R$ {fmtBRL(walletBalance)}
            </div>
            <p className="text-[10px] text-white/60 mt-1">Acessar carteira →</p>
          </button>

          {activeListing && !hasSold && !auctionEnded && (
            <button onClick={() => setTab("my-auction")}
              className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-gray-300 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Seu leilão</span>
                <span className={`text-sm font-semibold tabular-nums ${timeLeft <= 10 ? "text-red-500" : "text-gray-900"}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="flex items-center gap-3">
                <img src={activeListing.image_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 tabular-nums">
                    R$ {fmtBRL(currentBidBRL)}
                  </div>
                  <div className="text-[10px] text-gray-500">{bidHistory.length} lances</div>
                </div>
              </div>
            </button>
          )}

          {bidHistory.length > 0 && !hasSold && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Últimos lances</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {bidHistory.slice(0, 5).map((bid) => (
                  <div key={bid.id} className="flex items-center gap-2">
                    <span className="text-base">{bid.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-900 truncate">{bid.bidder_name}</div>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 tabular-nums">
                      R$ {fmtBRL(bid.amount_brl)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-[10px] text-gray-400 mt-auto">
            © 2026 — Projeto acadêmico
          </p>
        </aside>
      </div>

      {/* === BOTTOM TAB MOBILE === */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 px-2 py-2 grid grid-cols-4 gap-1">
        <BottomTab active={tab === "feed"} onClick={() => setTab("feed")} icon="home" label="Feed" />
        <BottomTab active={tab === "my-auction"} onClick={() => setTab("my-auction")} icon="hammer" label="Leilões" />
        <BottomTab active={tab === "wallet"} onClick={() => setTab("wallet")} icon="wallet" label="Carteira" />
        <BottomTab active={tab === "profile"} onClick={() => setTab("profile")} icon="user" label="Perfil" />
      </nav>

      {/* === MODAL: ESCOLHER COMPRADOR === */}
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
              <p className="text-sm text-gray-600">Escolha um comprador para finalizar a venda.</p>
              <p className="text-xs text-amber-700 bg-amber-50 mt-3 px-3 py-2 rounded-lg border border-amber-200">
                ⚠ Você não pode vender a mesma foto novamente.
              </p>
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {bidHistory.slice(0, 8).map((bid, i) => (
                <button key={bid.id} onClick={() => selectWinningBid(bid)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                    i === 0
                      ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}>
                  <span className="text-2xl flex-shrink-0">{bid.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 font-semibold truncate">{bid.bidder_name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">
                      {bid.emirate} {i === 0 && <span className="text-emerald-600">· Maior</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-gray-900 tabular-nums">
                      R$ {fmtBRL(bid.amount_brl)}
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
                <p className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                  <span className="text-base">{selectedBid.flag}</span>
                  {selectedBid.bidder_name}
                </p>
                <p className="text-xs text-amber-600 tabular-nums font-semibold">
                  -{fmtCurrency(brlToLocal(selectedBid.amount_brl, selectedBid.currencyRate), selectedBid.currency)}
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
                <p className="text-xs uppercase tracking-wider text-emerald-600 mb-2 font-semibold">Venda concluída</p>
                <h3 className="font-display text-2xl text-gray-900 mb-4">Resumo da venda</h3>

                {/* Resumo detalhado */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-5 text-left space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Pago pelo comprador</span>
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {fmtCurrency(brlToLocal(selectedBid.amount_brl, selectedBid.currencyRate), selectedBid.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-200">
                    <span className="text-gray-500 text-xs">Equivalente em Reais</span>
                    <span className="text-gray-700 tabular-nums">R$ {fmtBRL(selectedBid.amount_brl)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Taxa Foot Fans (10%)</span>
                    <span className="font-semibold text-red-500 tabular-nums">
                      − R$ {fmtBRL(selectedBid.amount_brl * PLATFORM_FEE)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-900">Você recebe (90%)</span>
                    <span className="font-display text-2xl text-emerald-600 tabular-nums font-light">
                      R$ {fmtBRL(selectedBid.amount_brl * (1 - PLATFORM_FEE))}
                    </span>
                  </div>
                </div>

                <button onClick={closeSaleAndGoToWallet}
                  className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition text-sm uppercase tracking-wider">
                  Ver carteira
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* === MODAL: DETALHES DE LEILÃO ANTERIOR === */}
      {openPastAuction && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-8 shadow-2xl overflow-hidden">
            <button onClick={() => setOpenPastAuction(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur w-9 h-9 rounded-full flex items-center justify-center hover:bg-white transition border border-gray-200">
              ×
            </button>

            <div className="relative aspect-square bg-gray-100">
              <img src={openPastAuction.image_url} alt="" className="w-full h-full object-cover blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="text-[10px] uppercase tracking-wider text-white/70 mb-1">Arrematado por</div>
                <div className="font-display text-4xl tabular-nums font-light">
                  R$ {fmtBRL(openPastAuction.final_amount_brl)}
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Comprador</h3>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 flex items-center gap-3">
                <span className="text-3xl flex-shrink-0">{openPastAuction.buyer.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{openPastAuction.buyer.name}</div>
                  <div className="text-xs text-gray-600">{openPastAuction.buyer.emirate}, {openPastAuction.buyer.country}</div>
                  <div className="text-[10px] text-emerald-700 tabular-nums mt-1">
                    Pagou {fmtCurrency(brlToLocal(openPastAuction.final_amount_brl, openPastAuction.buyer.currencyRate), openPastAuction.buyer.currency)}
                  </div>
                </div>
              </div>

              <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
                Histórico de lances ({openPastAuction.bids.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {openPastAuction.bids.map((bid, i) => (
                  <div key={bid.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
                    <span className="text-base">{bid.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">{bid.bidder_name}</div>
                      <div className="text-[10px] text-gray-500">{bid.emirate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 tabular-nums">
                        R$ {fmtBRL(bid.amount_brl)}
                      </div>
                      <div className="text-[10px] text-gray-500 tabular-nums">
                        {fmtCurrency(brlToLocal(bid.amount_brl, bid.currencyRate), bid.currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: ALTERAR SENHA === */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">
              ×
            </button>
            <h3 className="font-display text-2xl text-gray-900 mb-1">Alterar senha</h3>
            <p className="text-sm text-gray-500 mb-5">Use uma senha forte com no mínimo 6 caracteres.</p>

            {passwordSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900">Senha alterada!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 block">Nova senha</label>
                  <input type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 block">Confirmar nova senha</label>
                  <input type="password" value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition" />
                </div>
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">
                    {passwordError}
                  </div>
                )}
                <button onClick={changePassword} disabled={passwordSaving}
                  className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition text-sm mt-2">
                  {passwordSaving ? "Atualizando..." : "Atualizar senha"}
                </button>
              </div>
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
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${
        active ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-700 hover:bg-gray-50"
      }`}>
      <Icon name={icon} active={active} />
      <span className="text-base flex-1 text-left">{label}</span>
      {badge && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}

function BottomTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition ${
        active ? "text-gray-900" : "text-gray-400"
      }`}>
      <Icon name={icon} active={active} />
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function Icon({ name, active }: { name: string; active: boolean }) {
  const fill = active ? "currentColor" : "none";
  if (name === "home") return <svg className="w-6 h-6" fill={fill} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
  if (name === "hammer") return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  if (name === "wallet") return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6zM7 10V7a4 4 0 118 0v3" /></svg>;
  if (name === "user") return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  return null;
}

function UserAvatar({ url, initial, size }: { url: string | null; initial: string; size: number }) {
  if (url) {
    return <img src={url} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  // Cor de fundo determinística baseada na inicial
  const colors = [
    "from-pink-400 to-rose-500",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-violet-400 to-purple-500",
  ];
  const colorIdx = initial.charCodeAt(0) % colors.length;
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colors[colorIdx]} text-white font-bold flex items-center justify-center flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
