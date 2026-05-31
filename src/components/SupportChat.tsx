"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { ChatPanel } from "@/app/dashboard/ChatPanel";

type SupportFaq = {
  general: { q: string; a: string }[];
  payment: { q: string; a: string }[];
};

type Props = {
  userId?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  faq: SupportFaq;
  hasActivePlan?: boolean;
  userName?: string;
};

type Category = "menu" | "general" | "payment";
type View = Category | "form" | "answer" | "success" | "list" | "chat" | "direct-lariis";

export function SupportChat({ userId, defaultEmail, defaultPhone, faq, hasActivePlan = false, userName = "Amiga" }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [chatLocked, setChatLocked] = useState(false);
  const [lariisReceived, setLariisReceived] = useState(false);
  const [lariisRead, setLariisRead] = useState(false);
  // 3 mensagens da gaby_mypriv: msg1 (60s), msg2 (70s), msg3 (80s)
  const [lariisStartTs, setLariisStartTs] = useState<number | null>(null);
  const [lariisTick, setLariisTick] = useState(0); // forca re-render a cada 1s

  // Carrega estado de bloqueio do chat ao montar e quando plano fica ativo
  useEffect(() => {
    try {
      if (hasActivePlan) {
        localStorage.removeItem("footpriv_chat_locked");
        setChatLocked(false);
        return;
      }
      const locked = localStorage.getItem("footpriv_chat_locked");
      if (locked) setChatLocked(true);
    } catch {}
  }, [hasActivePlan]);

  // Carrega estado da mensagem da gaby_mypriv (re-checa periodicamente p/ pegar quando o ChatPanel marcar received)
  useEffect(() => {
    const sync = () => {
      try {
        if (localStorage.getItem("footpriv_lariis_received") === "1") setLariisReceived(true);
        if (localStorage.getItem("footpriv_lariis_read") === "1") setLariisRead(true);
        const ts = localStorage.getItem("footpriv_lariis_start_ts");
        if (ts) setLariisStartTs(parseInt(ts, 10));
      } catch {}
    };
    sync();
    const interval = setInterval(sync, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listener pra notificacao push: abre direct da gaby ao clicar
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setOpen(true);
      try { localStorage.setItem("footpriv_lariis_read", "1"); } catch {}
      setLariisRead(true);
      setView("direct-lariis");
    };
    window.addEventListener("open-gaby-direct", handler);
    return () => window.removeEventListener("open-gaby-direct", handler);
  }, []);

  // Tick de 1s pra atualizar mensagens visiveis e indicador "digitando"
  useEffect(() => {
    if (!lariisStartTs) return;
    const tick = setInterval(() => setLariisTick(t => t + 1), 1000);
    return () => clearInterval(tick);
  }, [lariisStartTs]);

  // Calcula quantas mensagens ja chegaram (0, 1, 2 ou 3)
  function getLariisMsgCount(): number {
    if (!lariisStartTs) return 0;
    const elapsed = Date.now() - lariisStartTs;
    if (elapsed >= 80000) return 3;
    if (elapsed >= 70000) return 2;
    if (elapsed >= 60000) return 1;
    return 0;
  }

  // Indicador "digitando": aparece entre as mensagens (entre 60-70s, 70-80s)
  function isLariisTyping(): boolean {
    if (!lariisStartTs) return false;
    const elapsed = Date.now() - lariisStartTs;
    // Digitando antes da msg 2 (entre 60s e 70s)
    if (elapsed >= 60000 && elapsed < 70000) return true;
    // Digitando antes da msg 3 (entre 70s e 80s)
    if (elapsed >= 70000 && elapsed < 80000) return true;
    return false;
  }
  const [selectedFaq, setSelectedFaq] = useState<{ q: string; a: string } | null>(null);
  const [formCategory, setFormCategory] = useState<"general" | "payment">("payment");
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formEmail, setFormEmail] = useState(defaultEmail || "");
  const [formPhone, setFormPhone] = useState(defaultPhone || "");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  function reset() {
    setView("list");
    setSelectedFaq(null);
    setFormSubject("");
    setFormMessage("");
    setAttachment(null);
    setError("");
  }

  function openFaqAnswer(category: "general" | "payment", item: { q: string; a: string }) {
    setSelectedFaq(item);
    setView("answer");
    // Pre-popula categoria caso clique em "ainda preciso de ajuda"
    setFormCategory(category);
    setFormSubject(item.q);
  }

  function openFormFromAnswer() {
    setFormMessage("");
    setView("form");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Arquivo grande demais (máx 5MB)");
      return;
    }
    setError("");
    setAttachment(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formEmail || !formPhone || !formMessage) {
      setError("Preencha email, telefone e mensagem.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      let attachmentUrl: string | null = null;

      // 1. Upload da imagem (se houver)
      if (attachment && userId) {
        const safeName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const path = `${userId}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("support-attachments")
          .upload(path, attachment, {
            cacheControl: "3600",
            upsert: false,
            contentType: attachment.type || "image/jpeg",
          });
        if (upErr) {
          console.warn("[Support] upload erro:", upErr);
        } else {
          attachmentUrl = path;
        }
      }

      // 2. Insere ticket
      const { error: insErr } = await supabase.from("support_tickets").insert({
        user_id: userId || null,
        category: formCategory,
        subject: formSubject || null,
        message: formMessage,
        email: formEmail,
        phone: formPhone,
        attachment_url: attachmentUrl,
        status: "new",
      });

      if (insErr) {
        console.error("[Support] insert erro:", insErr);
        setError("Erro ao enviar. Tente novamente.");
        setSubmitting(false);
        return;
      }

      setView("success");
      setSubmitting(false);
    } catch (err: any) {
      console.error("[Support] erro:", err);
      setError(err?.message || "Erro inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-[150] w-14 h-14 rounded-full bg-[#0084FF] hover:bg-[#0070d8] text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          aria-label="Mensagens"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.726 7.21V22l3.405-1.869c.909.252 1.871.388 2.869.388 5.523 0 10-4.145 10-9.26C22 6.145 17.523 2 12 2zm.994 12.46l-2.541-2.71-4.955 2.71 5.45-5.788 2.602 2.71 4.895-2.71-5.45 5.788z"/></svg>
          {lariisReceived && !lariisRead && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[11px] text-white font-bold shadow-lg">1</span>
          )}
        </button>
      )}

      {/* Caixa do chat */}
      {open && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[150] w-auto sm:w-[380px] max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: "min(600px, calc(100vh - 32px))" }}>
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0084FF] to-[#0070d8] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {view !== "list" && (
                <button
                  onClick={() => {
                    if (view === "form") setView("answer");
                    else if (view === "answer") setView(formCategory);
                    else if (view === "general" || view === "payment") setView("menu");
                    else if (view === "menu") setView("list");
                    else if (view === "chat") setView("list");
                    else if (view === "direct-lariis") setView("list");
                    else if (view === "success") {
                      reset();
                      setOpen(false);
                    }
                  }}
                  className="w-7 h-7 -ml-1 rounded-full hover:bg-white/20 flex items-center justify-center transition flex-shrink-0"
                  aria-label="Voltar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-tight">Mensagens</p>
                <p className="text-[10px] text-white/80 leading-tight">
                  {view === "list" && "Conversas e suporte"}
                  {view === "chat" && "Chat público de creators"}
                  {view === "direct-lariis" && "Mensagem privada"}
                  {view === "menu" && "Dúvidas e suporte"}
                  {view === "general" && "Dúvidas gerais"}
                  {view === "payment" && "Dúvidas sobre pagamento"}
                  {view === "answer" && "Resposta"}
                  {view === "form" && "Falar com a equipe"}
                  {view === "success" && "Ticket enviado!"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                reset();
                setOpen(false);
              }}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition flex-shrink-0"
              aria-label="Fechar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conteúdo */}
          <div className={`flex-1 ${view === "chat" ? "" : "overflow-y-auto p-4"}`}>
            {/* LISTA INICIAL — estilo Messenger */}
            {view === "list" && (
              <div className="space-y-3">
                {/* Chat publico */}
                <button
                  onClick={() => {
                    if (chatLocked) return;
                    setView("chat");
                  }}
                  disabled={chatLocked}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition ${chatLocked ? "bg-gray-50 opacity-60 cursor-not-allowed" : "bg-white border border-gray-200 hover:border-[#0084FF] hover:bg-blue-50/30"}`}
                >
                  <img src="https://i.pinimg.com/736x/18/57/b0/1857b072b8d6070ea49173879fc47de7.jpg" alt="Foot Priv" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">Chat público de creators</p>
                      {!chatLocked && <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 animate-pulse"></span>}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">
                      {chatLocked ? "🔒 Bloqueado — conclua seu plano" : "127 online · toque para entrar"}
                    </p>
                  </div>
                  {!chatLocked && (
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                {/* Direct privado da lariis (so aparece se ja chegou a msg) */}
                {lariisReceived && (
                  <button
                    onClick={() => {
                      try { localStorage.setItem("footpriv_lariis_read", "1"); } catch {}
                      setLariisRead(true);
                      setView("direct-lariis");
                    }}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl transition bg-white border border-gray-200 hover:border-[#0084FF] hover:bg-blue-50/30 relative"
                  >
                    <img src="https://i.pinimg.com/736x/45/04/36/450436f8951b6fc7146c29983b1485ce.jpg" alt="gaby_mypriv" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">gaby_mypriv</p>
                      <p className="text-[11px] text-gray-500 truncate">oii, td bem? vi no grupo que vc é nova, temos um grupinho no zap...</p>
                    </div>
                    {!lariisRead && (
                      <div className="w-5 h-5 rounded-full bg-[#0084FF] flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-white font-bold">1</span>
                      </div>
                    )}
                  </button>
                )}

                {/* Sem mais conversas */}
                <p className="text-[11px] text-gray-400 text-center py-1">— Sem mais conversas —</p>

                {/* Duvidas e suporte (separado embaixo) */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 px-1">Dúvidas e suporte</p>
                  <button
                    onClick={() => setView("menu")}
                    className="w-full bg-white border border-gray-200 hover:border-[#0084FF] rounded-xl p-3 text-left transition flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                      <svg className="w-5 h-5 text-[#0084FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">Dúvidas</p>
                      <p className="text-[11px] text-gray-500 truncate">Perguntas gerais e sobre pagamento</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* CHAT EMBUTIDO */}
            {view === "chat" && (
              <ChatPanel userName={userName} compact />
            )}

            {/* DIRECT PRIVADO DA GABY_MYPRIV - 3 mensagens com "digitando" */}
            {view === "direct-lariis" && (() => {
              const msgCount = getLariisMsgCount();
              const typing = isLariisTyping();
              const messages = [
                "oii, td bem?",
                "vi no grupo que vc é nova aqui na plataforma, temos um grupo no zap para se ajudar se quiser entrar me avisa q eu envio link ou vc me manda seu numero e eu add la.",
                "bastante resenha e fofoca, mas se ajudamos bastante tambem, desde posições que pagam mais de fotos até sobre dinheiro e finanças, qlqr coisa me avisa aqui, e seja bem vinda",
              ];
              return (
                <div className="space-y-3 p-1">
                  {/* Header */}
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
                    <img src="https://i.pinimg.com/736x/45/04/36/450436f8951b6fc7146c29983b1485ce.jpg" alt="gaby_mypriv" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">gaby_mypriv</p>
                      <p className="text-[10px] text-gray-500">creator · ativa agora</p>
                    </div>
                  </div>

                  {/* Mensagens (renderizadas conforme o tempo) */}
                  {messages.slice(0, msgCount).map((text, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <img src="https://i.pinimg.com/736x/45/04/36/450436f8951b6fc7146c29983b1485ce.jpg" alt="gaby_mypriv" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-gray-100 inline-block max-w-full">
                          {i === 0 && <p className="text-[11px] font-bold text-amber-600 mb-0.5">gaby_mypriv</p>}
                          <p className="text-sm text-gray-800 leading-snug whitespace-pre-wrap break-words">{text}</p>
                          <p className="text-[9px] text-gray-400 text-right mt-1">agora</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Digitando... */}
                  {typing && (
                    <div className="flex items-start gap-2">
                      <img src="https://i.pinimg.com/736x/45/04/36/450436f8951b6fc7146c29983b1485ce.jpg" alt="gaby_mypriv" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm border border-gray-100 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  )}

                  {/* Input bloqueado */}
                  <div className="bg-gray-50 border-t border-gray-200 px-4 py-4 mt-4">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-xs text-gray-600 text-center">Ative seu plano para responder mensagens privadas</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* MENU DUVIDAS (categorias) */}
            {view === "menu" && (
              <div className="space-y-2">
                <button
                  onClick={() => setView("general")}
                  className="w-full bg-white border border-gray-200 hover:border-[#0084FF] rounded-xl p-3 text-left transition flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                    <svg className="w-5 h-5 text-[#0084FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Dúvidas gerais</p>
                    <p className="text-[11px] text-gray-500 truncate">{faq.general.length} perguntas frequentes</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setView("payment")}
                  className="w-full bg-white border border-gray-200 hover:border-[#0084FF] rounded-xl p-3 text-left transition flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                    <svg className="w-5 h-5 text-[#0084FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Dúvidas sobre pagamento</p>
                    <p className="text-[11px] text-gray-500 truncate">Pix não atualizou? Envie o comprovante</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <p className="text-[10px] text-gray-400 text-center mt-3 leading-snug">
                  Atendimento humano de segunda a sexta, das 9h às 18h.
                </p>
              </div>
            )}

            {/* LISTA DE PERGUNTAS */}
            {(view === "general" || view === "payment") && (
              <div className="space-y-2">
                {(view === "general" ? faq.general : faq.payment).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => openFaqAnswer(view as "general" | "payment", item)}
                    className="w-full bg-white border border-gray-200 hover:border-[#0084FF] rounded-xl px-3 py-2.5 text-left transition flex items-center gap-2"
                  >
                    <span className="text-sm text-gray-900 flex-1 leading-snug">{item.q}</span>
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}

                <button
                  onClick={() => {
                    setFormCategory(view as "general" | "payment");
                    setFormSubject("Outra dúvida");
                    setView("form");
                  }}
                  className="w-full mt-3 bg-gray-50 border border-gray-200 hover:border-gray-400 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 font-semibold transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="flex-1">Não encontrei minha dúvida</span>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* RESPOSTA DA FAQ */}
            {view === "answer" && selectedFaq && (
              <div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-1">Pergunta</p>
                  <p className="text-sm text-gray-900 font-bold leading-snug">{selectedFaq.q}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Resposta</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedFaq.a}</p>
                </div>

                <button
                  onClick={openFormFromAnswer}
                  className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  Ainda preciso de ajuda
                </button>
              </div>
            )}

            {/* FORM */}
            {view === "form" && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Descreva sua situação..."
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none transition resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Telefone (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    Anexar comprovante (opcional)
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-[#0084FF] rounded-xl py-3 text-sm text-gray-600 transition flex items-center justify-center gap-2"
                  >
                    {attachment ? (
                      <>
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-emerald-700 font-semibold truncate max-w-[200px]">{attachment.name}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span>Anexar arquivo (até 5MB)</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0084FF] hover:bg-[#0070d8] disabled:bg-gray-300 disabled:cursor-wait text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar para a equipe</span>
                  )}
                </button>
              </form>
            )}

            {/* SUCESSO */}
            {view === "success" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-display text-xl text-gray-900 mb-1">Ticket enviado!</p>
                <p className="text-sm text-gray-600 leading-snug px-2 mb-4">
                  Nossa equipe respondeu pelo email/WhatsApp informados em até 30 minutos durante horário comercial.
                </p>
                <button
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                  className="text-sm text-gray-700 font-semibold underline hover:text-gray-900"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
