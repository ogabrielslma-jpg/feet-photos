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

type Tab = "feed" | "my-auction" | "wallet";

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
};

const AUCTION_DURATION = 35;
const PLATFORM_FEE = 0.10;
const CC_TO_BRL = 1.05;

const FAKE_USERNAMES = [
  "pearlsoles_official", "moonlit_pedals", "saharan_silk",
  "honey_heels", "velvet_arches", "desert_rose_88",
  "marble_toes_x", "silk_steps", "topaz_ankles",
  "diamond_petals", "royal_imprint", "goddess_pair",
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("my-auction");
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
  const [loading, setLoading] = useState(true);
  const [hasSold, setHasSold] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const bidScheduledRef = useRef(false);

  // Carrega user + listing
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
      }
      generateFeedSales();
      setLoading(false);
    }
    load();
  }, []);

  function generateFeedSales() {
    const sales: FeedSale[] = Array.from({ length: 8 }, (_, i) => {
      const sheik = FAKE_SHEIKS[Math.floor(Math.random() * FAKE_SHEIKS.length)];
      const amount = 200 + Math.floor(Math.random() * 9800);
      const u = FAKE_USERNAMES[i % FAKE_USERNAMES.length];
      const minutes = Math.floor(Math.random() * 50) + 1;
      return {
        id: `sale-${i}`,
        seller_username: u,
        seller_avatar: `https://i.pravatar.cc/100?u=${u}`,
        buyer_name: sheik.name,
        buyer_emirate: sheik.emirate,
        amount_cc: amount,
        image_url: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
        rarity: RARITIES[Math.floor(Math.random() * RARITIES.length)].label.toLowerCase(),
        time_ago: minutes < 5 ? "agora" : `há ${minutes}min`,
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

  // Geração de bids fake (e notificações flutuantes)
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

        // Pop-up notification
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
    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeListing, auctionEnded]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
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
      try {
        if (user) {
          supabase.from("profiles").update({ total_earnings: liquid }).eq("id", user.id);
        }
      } catch {}
    }, 3600);
  }

  function closeSaleAndGoToWallet() {
    setSaleStep(null);
    setSelectedBid(null);
    setTab("wallet");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#000" }}>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-bone-100/40">Carregando...</p>
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

  return (
    <div className="relative min-h-screen pb-32">
      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 50%, #000000 100%)" }}
      />

      {/* Header */}
      <header className="relative z-30 px-6 pt-12 pb-6 max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl tracking-[0.15em] text-moss-500">FOOT</span>
          <span className="font-display text-sm tracking-[0.3em] text-bone-100">FANS</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-100/60 hidden sm:block">
            @{profile?.username || "user"}
          </span>
          <button
            onClick={logout}
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-600 hover:text-bone-100 transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Notificações flutuantes (top-right) */}
      <div className="fixed top-24 right-4 z-50 space-y-2 max-w-xs w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-ink-900 border border-moss-700 rounded-2xl p-3 flex items-center gap-3 shadow-2xl pointer-events-auto"
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            <div className="w-10 h-10 rounded-full bg-moss-600 flex items-center justify-center text-ink-950 font-bold flex-shrink-0">
              {n.bidder_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-bone-100 truncate font-medium">{n.bidder_name}</div>
              <div className="text-[10px] text-moss-400 font-mono">
                ofertou R$ {(n.amount * CC_TO_BRL).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 px-4 max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-ink-900/40 border border-ink-800 rounded-2xl p-1 max-w-md mx-auto">
          {[
            { id: "feed", label: "Feed" },
            { id: "my-auction", label: "Meu leilão" },
            { id: "wallet", label: "Carteira" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex-1 py-3 px-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-mono transition ${
                tab === t.id
                  ? "bg-moss-600 text-ink-950 font-medium"
                  : "text-bone-100/60 hover:text-bone-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* === FEED === */}
        {tab === "feed" && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-2">Vendas recentes</p>
              <h1 className="font-display text-3xl text-bone-100">
                Feed da <span className="italic-accent text-moss-500">comunidade</span>
              </h1>
            </div>

            {feedSales.map((sale) => {
              const r = RARITIES.find((x) => x.label.toLowerCase() === sale.rarity) || RARITIES[0];
              return (
                <div key={sale.id} className="bg-ink-900/60 border border-ink-800 rounded-2xl overflow-hidden">
                  {/* Header com vendedora */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <img src={sale.seller_avatar} alt="" className="w-10 h-10 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-bone-100 font-medium">@{sale.seller_username}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600">
                        vendeu {sale.time_ago}
                      </div>
                    </div>
                    <div
                      className={`${r.color} border bg-ink-950/60 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] rounded-full`}
                    >
                      {r.label}
                    </div>
                  </div>

                  {/* Imagem */}
                  <div className="relative aspect-square bg-ink-800">
                    <img src={sale.image_url} alt="" className="w-full h-full object-cover blur-sm grayscale opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="bg-moss-600/15 backdrop-blur-md border border-moss-700/40 rounded-xl px-4 py-3">
                        <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-moss-400 mb-1">
                          Vendido por
                        </div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-display text-2xl text-moss-400 tabular-nums">
                            {sale.amount_cc.toLocaleString("en-US")} CC
                          </span>
                          <span className="font-mono text-xs text-bone-100/70">
                            R$ {(sale.amount_cc * CC_TO_BRL).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comprador */}
                  <div className="px-4 py-3 border-t border-ink-800">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600 mb-1">
                      Comprado por
                    </div>
                    <div className="text-sm text-bone-100">{sale.buyer_name}</div>
                    <div className="font-mono text-[10px] text-ink-600 uppercase tracking-wider mt-0.5">
                      {sale.buyer_emirate}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* === MEU LEILÃO === */}
        {tab === "my-auction" && activeListing && (
          <div>
            {/* Timer + status */}
            {!auctionEnded && !hasSold && (
              <div className="mb-4 bg-ink-900/60 border border-ink-800 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-moss-500 rounded-full animate-pulse"></span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-moss-500">Ao vivo</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-600">Encerra em</span>
                  <span
                    className={`font-display text-3xl tabular-nums ${
                      timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-bone-100"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            )}

            {hasSold && (
              <div className="mb-4 bg-moss-600/10 border border-moss-700 rounded-2xl px-5 py-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-moss-400 mb-1">
                  ✓ Leilão finalizado
                </p>
                <p className="text-sm text-bone-100">
                  Você não pode vender a mesma foto novamente.
                </p>
              </div>
            )}

            {/* Foto + lance */}
            <div className="relative aspect-[4/5] bg-ink-900 overflow-hidden rounded-2xl mb-4">
              <img src={activeListing.image_url} alt={activeListing.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent"></div>

              <div
                className={`absolute top-4 left-4 ${rarity.color} border bg-ink-950/80 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.3em] rounded-full`}
              >
                ✦ {rarity.label}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-100/60 mb-1">
                  Lance atual
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-5xl font-light text-moss-400 tabular-nums">
                    {currentBid.toLocaleString("en-US")}
                  </span>
                  <span className="font-mono text-xs text-bone-100/60 uppercase">CC</span>
                </div>
                <p className="font-mono text-sm text-bone-100/80 mt-1 tabular-nums">
                  R$ {(currentBid * CC_TO_BRL).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Histórico de lances */}
            <div className="bg-ink-900/50 border border-ink-800 rounded-2xl p-5">
              <h3 className="font-display text-lg text-bone-100 mb-4 flex items-center justify-between">
                <span>Lances <span className="italic-accent text-moss-500">ao vivo</span></span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-600">
                  {bidHistory.length} ofertas
                </span>
              </h3>
              {bidHistory.length === 0 ? (
                <div className="text-center py-8 text-bone-100/40 text-sm">
                  Aguardando primeiros lances...
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {bidHistory.map((bid, i) => (
                    <div
                      key={bid.id}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl ${
                        i === 0
                          ? "bg-moss-600/10 border border-moss-700/40"
                          : "bg-ink-950/40"
                      }`}
                    >
                      <img
                        src={bid.bidder_avatar}
                        alt=""
                        className="w-9 h-9 rounded-full grayscale flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-bone-100 truncate">{bid.bidder_name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600">
                          {bid.emirate}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-display text-base text-moss-400 tabular-nums">
                          {bid.amount.toLocaleString("en-US")} CC
                        </div>
                        <div className="font-mono text-[10px] text-bone-100/50 tabular-nums">
                          R$ {(bid.amount * CC_TO_BRL).toFixed(2)}
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
          <div>
            <div className="text-center mb-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-2">Sua carteira</p>
              <h1 className="font-display text-3xl text-bone-100">
                Saldo <span className="italic-accent text-moss-500">disponível</span>
              </h1>
            </div>

            {/* Saldo principal */}
            <div className="bg-gradient-to-br from-moss-700/20 to-ink-900 border border-moss-700/40 rounded-3xl p-8 mb-6 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-moss-400 mb-3">Saldo em reais</p>
              <div className="font-display text-6xl font-light text-bone-100 mb-2 tabular-nums">
                R$ {(walletBalance * CC_TO_BRL).toFixed(2)}
              </div>
              <p className="font-mono text-sm text-bone-100/60 tabular-nums">
                {walletBalance.toLocaleString("en-US")} CC
              </p>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-ink-900/60 border border-ink-800 rounded-2xl p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-600 mb-1">Vendas</p>
                <p className="font-display text-2xl text-bone-100">{hasSold ? "1" : "0"}</p>
              </div>
              <div className="bg-ink-900/60 border border-ink-800 rounded-2xl p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-600 mb-1">Taxa plataforma</p>
                <p className="font-display text-2xl text-bone-100">10%</p>
              </div>
            </div>

            {/* Aviso */}
            <div className="bg-ink-900/40 border border-ink-800 rounded-2xl p-5 mb-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-moss-500 mb-2">ⓘ Como funciona</p>
              <p className="text-sm text-bone-100/70 leading-relaxed">
                A plataforma retém 10% de cada venda. Você recebe o valor líquido instantaneamente após o comprador
                confirmar a transação. Saques caem na sua chave PIX em até 15 minutos.
              </p>
            </div>

            <button
              disabled={walletBalance === 0}
              className="w-full bg-moss-500 hover:bg-moss-400 disabled:bg-ink-800 disabled:text-ink-600 disabled:cursor-not-allowed text-ink-950 font-bold py-4 rounded-2xl transition uppercase tracking-wide text-sm"
            >
              {walletBalance > 0 ? "Sacar via PIX" : "Sem saldo disponível"}
            </button>
          </div>
        )}
      </div>

      {/* === MODAL FINAL: ESCOLHE LANCE VENCEDOR === */}
      {showFinalModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-ink-900 border border-moss-700 rounded-3xl max-w-lg w-full p-6 my-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-moss-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-ink-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-3xl text-bone-100 mb-2">
                Leilão <span className="italic-accent text-moss-500">finalizado!</span>
              </h2>
              <p className="text-sm text-bone-100/70">
                Parabéns! Escolha um dos lances abaixo para finalizar a venda.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400/80 mt-3 px-3 py-2 bg-amber-950/30 rounded-lg border border-amber-900/40">
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
                      ? "border-moss-700 bg-moss-600/10 hover:bg-moss-600/20"
                      : "border-ink-800 bg-ink-950/40 hover:border-moss-700/60"
                  }`}
                >
                  <img src={bid.bidder_avatar} alt="" className="w-10 h-10 rounded-full grayscale flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-bone-100 truncate">{bid.bidder_name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600">
                      {bid.emirate} {i === 0 && <span className="text-moss-400">· Maior lance</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display text-lg text-moss-400 tabular-nums">
                      {bid.amount.toLocaleString("en-US")} CC
                    </div>
                    <div className="font-mono text-[10px] text-bone-100/50 tabular-nums">
                      R$ {(bid.amount * CC_TO_BRL).toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === MODAL DE PROCESSAMENTO DA VENDA === */}
      {saleStep && selectedBid && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-ink-900 border border-moss-700 rounded-3xl max-w-md w-full p-8 text-center">
            {saleStep === "verifying" && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-moss-700/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-moss-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-3">Etapa 1 de 3</p>
                <h3 className="font-display text-2xl text-bone-100 mb-2">Verificando comprador</h3>
                <p className="text-sm text-bone-100/60">{selectedBid.bidder_name}</p>
              </>
            )}
            {saleStep === "debiting" && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-400 mb-3">Etapa 2 de 3</p>
                <h3 className="font-display text-2xl text-bone-100 mb-2">
                  Debitando do saldo
                </h3>
                <p className="text-sm text-bone-100/60 mb-1">{selectedBid.bidder_name}</p>
                <p className="font-mono text-xs text-amber-400 tabular-nums">
                  -R$ {(selectedBid.amount * CC_TO_BRL).toFixed(2)}
                </p>
              </>
            )}
            {saleStep === "success" && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-moss-500 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-ink-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-3">Etapa 3 de 3</p>
                <h3 className="font-display text-2xl text-bone-100 mb-3">
                  Venda <span className="italic-accent text-moss-500">realizada</span> com sucesso!
                </h3>
                <div className="bg-ink-950/60 border border-ink-800 rounded-xl p-4 my-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-600 mb-1">Você recebeu</p>
                  <p className="font-display text-3xl text-moss-400 tabular-nums">
                    R$ {(selectedBid.amount * (1 - PLATFORM_FEE) * CC_TO_BRL).toFixed(2)}
                  </p>
                  <p className="font-mono text-[10px] text-ink-600 mt-1">
                    (após taxa de 10% da plataforma)
                  </p>
                </div>
                <button
                  onClick={closeSaleAndGoToWallet}
                  className="w-full bg-moss-500 hover:bg-moss-400 text-ink-950 font-bold py-4 rounded-2xl transition uppercase tracking-wide text-sm"
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
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
