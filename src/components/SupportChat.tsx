"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase-client";

type SupportFaq = {
  general: { q: string; a: string }[];
  payment: { q: string; a: string }[];
};

type Props = {
  userId?: string;
  defaultEmail?: string;
  defaultPhone?: string;
  faq: SupportFaq;
};

type Category = "menu" | "general" | "payment";
type View = Category | "form" | "answer" | "success";

export function SupportChat({ userId, defaultEmail, defaultPhone, faq }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
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
    setView("menu");
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
          className="fixed bottom-4 right-4 z-[150] w-14 h-14 rounded-full bg-[#62C86E] hover:bg-[#52b85d] text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          aria-label="Suporte"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Caixa do chat */}
      {open && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[150] w-auto sm:w-[380px] max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: "min(600px, calc(100vh - 32px))" }}>
          {/* Header */}
          <div className="bg-gradient-to-br from-[#62C86E] to-[#52b85d] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {view !== "menu" && (
                <button
                  onClick={() => {
                    if (view === "form") setView("answer");
                    else if (view === "answer") setView(formCategory);
                    else if (view === "general" || view === "payment") setView("menu");
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
                <p className="text-[15px] font-bold leading-tight">Suporte</p>
                <p className="text-[10px] text-white/80 leading-tight">
                  {view === "menu" && "Como podemos ajudar?"}
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
          <div className="flex-1 overflow-y-auto p-4">
            {/* MENU INICIAL */}
            {view === "menu" && (
              <div className="space-y-2">
                <button
                  onClick={() => setView("general")}
                  className="w-full bg-white border border-gray-200 hover:border-[#62C86E] rounded-xl p-3 text-left transition flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition">
                    <svg className="w-5 h-5 text-[#62C86E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
                  className="w-full bg-white border border-gray-200 hover:border-[#62C86E] rounded-xl p-3 text-left transition flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition">
                    <svg className="w-5 h-5 text-[#62C86E]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
                    className="w-full bg-white border border-gray-200 hover:border-[#62C86E] rounded-xl px-3 py-2.5 text-left transition flex items-center gap-2"
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
                    className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-[#62C86E] rounded-xl py-3 text-sm text-gray-600 transition flex items-center justify-center gap-2"
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
                  className="w-full bg-[#62C86E] hover:bg-[#52b85d] disabled:bg-gray-300 disabled:cursor-wait text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
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
