"use client";

import { useEffect, useState } from "react";
import {
  fetchLandingConfig,
  saveLandingConfig,
  DEFAULT_LANDING_CONFIG,
  type LandingConfig,
} from "@/lib/landing-config";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "footfans2026";
const SESSION_KEY = "ff_admin_authed";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [config, setConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Verifica sessão local
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    } catch {}
  }, []);

  // Carrega config quando logar
  useEffect(() => {
    if (!authed) return;
    (async () => {
      const c = await fetchLandingConfig();
      setConfig(c);
      setLoading(false);
    })();
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthed(true);
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    } else {
      setLoginError("Senha incorreta.");
      setTimeout(() => setLoginError(""), 2500);
    }
  }

  function handleLogout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setAuthed(false);
    setPasswordInput("");
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    const res = await saveLandingConfig(config);
    if (res.ok) {
      setSaveMessage("✓ Salvo! Recarregue a página inicial pra ver.");
      setTimeout(() => setSaveMessage(""), 4000);
    } else {
      setSaveMessage(`Erro: ${res.error}`);
    }
    setSaving(false);
  }

  function resetDefaults() {
    if (!confirm("Restaurar todas as configurações padrão? Isso vai sobrescrever o que está salvo.")) return;
    setConfig(DEFAULT_LANDING_CONFIG);
  }

  function updateField<K extends keyof LandingConfig>(key: K, value: LandingConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function updateFaq(idx: number, field: "q" | "a", value: string) {
    setConfig((c) => ({
      ...c,
      faqs: c.faqs.map((f, i) => (i === idx ? { ...f, [field]: value } : f)),
    }));
  }

  function addFaq() {
    setConfig((c) => ({ ...c, faqs: [...c.faqs, { q: "Nova pergunta", a: "Nova resposta" }] }));
  }

  function removeFaq(idx: number) {
    setConfig((c) => ({ ...c, faqs: c.faqs.filter((_, i) => i !== idx) }));
  }

  // ========== TELA DE LOGIN ==========
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-3 bg-gray-900 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-gray-900 mb-1">Painel Admin</h1>
            <p className="text-sm text-gray-500">Foot Fans · Editor da landing</p>
          </div>
          <input
            type="password"
            placeholder="Senha de acesso"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
            className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition mb-3"
          />
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-3">
              {loginError}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ========== EDITOR ==========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-gray-900">Editor da Landing</h1>
          <p className="text-xs text-gray-500">Personalize a página inicial — alterações aplicam ao salvar</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 font-medium underline underline-offset-4">
            Ver página ao vivo →
          </a>
          <button onClick={resetDefaults} className="text-sm text-gray-500 hover:text-gray-900 transition">
            Resetar
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900 transition">
            Sair
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-xl transition text-sm"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </header>

      {saveMessage && (
        <div className={`px-6 py-3 text-sm font-medium ${
          saveMessage.startsWith("✓")
            ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
            : "bg-red-50 text-red-800 border-b border-red-200"
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-0 lg:h-[calc(100vh-73px)]">
        {/* === FORMULÁRIO === */}
        <div className="overflow-y-auto p-6 lg:border-r border-gray-200">
          {/* SEÇÃO LOGO + TAGLINE */}
          <Section title="Logo & Identidade" icon="✨">
            <Field label="Texto principal do logo">
              <input
                type="text"
                value={config.logo_primary}
                onChange={(e) => updateField("logo_primary", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Texto secundário do logo">
              <input
                type="text"
                value={config.logo_secondary}
                onChange={(e) => updateField("logo_secondary", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Tagline (acima do logo)" hint="Ex: Discreto · Anônimo · Lucrativo">
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
                className="input"
              />
            </Field>
          </Section>

          {/* SEÇÃO HEADLINE + CTA */}
          <Section title="Headline & Botão CTA" icon="📣">
            <Field label="Headline principal" hint="Frase de impacto abaixo do logo">
              <textarea
                value={config.headline}
                onChange={(e) => updateField("headline", e.target.value)}
                rows={2}
                className="input resize-none"
              />
            </Field>
            <Field label="Texto do botão (CTA)">
              <input
                type="text"
                value={config.cta_text}
                onChange={(e) => updateField("cta_text", e.target.value)}
                className="input"
              />
            </Field>
          </Section>

          {/* SEÇÃO BANNER */}
          <Section title="Banner Topo" icon="📢">
            <Field label="Texto do banner amarelo">
              <input
                type="text"
                value={config.banner_top_text}
                onChange={(e) => updateField("banner_top_text", e.target.value)}
                className="input"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.banner_top_enabled}
                onChange={(e) => updateField("banner_top_enabled", e.target.checked)}
                className="w-4 h-4 accent-gray-900"
              />
              Mostrar banner no topo
            </label>
          </Section>

          {/* SEÇÃO CORES */}
          <Section title="Cores" icon="🎨">
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Primária" value={config.color_primary} onChange={(v) => updateField("color_primary", v)} />
              <ColorField label="Acento" value={config.color_accent} onChange={(v) => updateField("color_accent", v)} />
              <ColorField label="Fundo (topo)" value={config.color_bg_from} onChange={(v) => updateField("color_bg_from", v)} />
              <ColorField label="Fundo (meio)" value={config.color_bg_via} onChange={(v) => updateField("color_bg_via", v)} />
              <ColorField label="Fundo (base)" value={config.color_bg_to} onChange={(v) => updateField("color_bg_to", v)} />
            </div>
          </Section>

          {/* SEÇÃO IMAGEM FUNDO */}
          <Section title="Imagem de fundo (opcional)" icon="🖼️">
            <Field label="URL da imagem" hint="Cole aqui um link público de imagem. Deixe vazio pra usar só o gradiente.">
              <input
                type="url"
                value={config.background_image_url}
                onChange={(e) => updateField("background_image_url", e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </Field>
            {config.background_image_url && (
              <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src={config.background_image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </Section>

          {/* SEÇÃO FAQ */}
          <Section title="FAQ" icon="❓">
            {config.faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Pergunta {i + 1}
                  </span>
                  <button
                    onClick={() => removeFaq(i)}
                    className="text-xs text-red-600 hover:text-red-800 transition"
                  >
                    Remover
                  </button>
                </div>
                <input
                  type="text"
                  value={faq.q}
                  onChange={(e) => updateFaq(i, "q", e.target.value)}
                  placeholder="Pergunta"
                  className="input mb-2"
                />
                <textarea
                  value={faq.a}
                  onChange={(e) => updateFaq(i, "a", e.target.value)}
                  rows={3}
                  placeholder="Resposta"
                  className="input resize-none"
                />
              </div>
            ))}
            <button
              onClick={addFaq}
              className="w-full border-2 border-dashed border-gray-300 hover:border-gray-500 text-gray-500 hover:text-gray-900 py-3 rounded-xl text-sm font-semibold transition"
            >
              + Adicionar pergunta
            </button>
          </Section>

          <div className="h-12"></div>
        </div>

        {/* === PREVIEW AO VIVO === */}
        <div className="bg-gray-100 overflow-y-auto p-6 hidden lg:block">
          <div className="sticky top-0 bg-gray-100 pb-3 mb-3 z-10">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Pré-visualização</p>
          </div>
          <Preview config={config} />
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #111827;
        }
      `}</style>
    </div>
  );
}

// ============= COMPONENTES =============

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs font-mono text-gray-900 outline-none min-w-0"
        />
      </div>
    </div>
  );
}

function Preview({ config }: { config: LandingConfig }) {
  const bg = config.background_image_url
    ? `url(${config.background_image_url})`
    : `radial-gradient(ellipse at top, ${config.color_bg_from} 0%, ${config.color_bg_via} 60%, ${config.color_bg_to} 100%)`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200">
      {config.banner_top_enabled && (
        <div className="bg-amber-400 text-gray-900 text-center py-1.5 px-4 text-[10px] font-mono tracking-wider uppercase">
          {config.banner_top_text}
        </div>
      )}
      <div
        className="relative p-8 text-center min-h-[480px] flex flex-col items-center justify-center"
        style={{
          background: bg,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.4em] mb-4" style={{ color: config.color_primary }}>
          {config.tagline}
        </p>
        <div className="text-center mb-3">
          <div className="text-5xl tracking-[0.15em] leading-none mb-1 font-serif" style={{ color: config.color_primary }}>
            {config.logo_primary}
          </div>
          <div className="text-2xl tracking-[0.4em] leading-none text-white font-serif">
            {config.logo_secondary}
          </div>
        </div>
        <p className="text-base text-white/70 mt-6 mb-6 font-light max-w-xs">
          {config.headline}
        </p>
        <button
          className="font-bold py-3 px-8 rounded-2xl uppercase tracking-wide text-sm"
          style={{ backgroundColor: config.color_primary, color: "#0a0a0a" }}
        >
          {config.cta_text}
        </button>
      </div>
    </div>
  );
}
