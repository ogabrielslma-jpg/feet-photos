"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchLandingConfig,
  saveLandingConfig,
  uploadLandingAsset,
  sanitizeRichHtml,
  DEFAULT_LANDING_CONFIG,
  type LandingConfig,
  type ViewportConfig,
} from "@/lib/landing-config";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "footfans2026";
const SESSION_KEY = "ff_admin_authed";

type Viewport = "desktop" | "mobile";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [config, setConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    } catch {}
  }, []);

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

  function copyDesktopToMobile() {
    if (!confirm("Copiar todas as configurações do Desktop para o Mobile?")) return;
    setConfig((c) => ({ ...c, mobile: { ...c.desktop } }));
  }

  function copyMobileToDesktop() {
    if (!confirm("Copiar todas as configurações do Mobile para o Desktop?")) return;
    setConfig((c) => ({ ...c, desktop: { ...c.mobile } }));
  }

  function updateField<K extends keyof LandingConfig>(key: K, value: LandingConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function updateViewportField<K extends keyof ViewportConfig>(key: K, value: ViewportConfig[K]) {
    setConfig((c) => ({
      ...c,
      [viewport]: { ...c[viewport], [key]: value },
    }));
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

  function updateQuestion(qIdx: number, field: "title" | "subtitle", value: string) {
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q, i) =>
        i === qIdx ? { ...q, [field]: value } : q
      ),
    }));
  }

  function updateQuestionOption(qIdx: number, optIdx: number, field: "emoji" | "text" | "color", value: string) {
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === optIdx ? { ...o, [field]: value } : o
              ),
            }
          : q
      ),
    }));
  }

  function addQuestionOption(qIdx: number) {
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q, i) =>
        i === qIdx
          ? { ...q, options: [...q.options, { emoji: "✨", text: "Nova opção", color: "#22c55e" }] }
          : q
      ),
    }));
  }

  function removeQuestionOption(qIdx: number, optIdx: number) {
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.filter((_, j) => j !== optIdx) }
          : q
      ),
    }));
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
          <input type="password" placeholder="Senha de acesso" value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)} autoFocus
            className="w-full bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition mb-3" />
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-3">
              {loginError}
            </div>
          )}
          <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition text-sm">
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

  const v = config[viewport];

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
          <button onClick={resetDefaults} className="text-sm text-gray-500 hover:text-gray-900 transition">Resetar</button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900 transition">Sair</button>
          <button onClick={handleSave} disabled={saving}
            className="bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-xl transition text-sm">
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

          {/* === TOGGLE DESKTOP / MOBILE === */}
          <div className="bg-gray-900 text-white rounded-2xl p-2 mb-6 sticky top-0 z-10 shadow-lg">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setViewport("desktop")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                  viewport === "desktop" ? "bg-white text-gray-900" : "text-white/70 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Desktop
              </button>
              <button
                onClick={() => setViewport("mobile")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                  viewport === "mobile" ? "bg-white text-gray-900" : "text-white/70 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Mobile
              </button>
            </div>
            <div className="text-center mt-1.5">
              <p className="text-[10px] text-white/60 leading-tight">
                Editando configurações visuais para <strong className="text-white">{viewport === "desktop" ? "💻 Desktop" : "📱 Mobile"}</strong>
              </p>
              <button
                onClick={viewport === "desktop" ? copyDesktopToMobile : copyMobileToDesktop}
                className="text-[10px] text-white/60 hover:text-white underline mt-0.5"
              >
                Copiar config para {viewport === "desktop" ? "Mobile" : "Desktop"}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 mb-6 text-center bg-gray-100 rounded-lg py-2 px-3">
            ℹ Textos, cores, FAQ e URLs são <strong>compartilhados</strong>. Tamanho da logo, alinhamento e posição da imagem de fundo são <strong>separados</strong> entre desktop e mobile.
          </p>

          {/* === BANNER DO TOPO === */}
          <Section title="Banner do topo" icon="📢">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-2">
              <input type="checkbox" checked={config.banner_enabled}
                onChange={(e) => updateField("banner_enabled", e.target.checked)}
                className="w-4 h-4 accent-gray-900" />
              Mostrar banner no topo da landing
            </label>

            {config.banner_enabled && (
              <>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => updateField("banner_mode", "text")}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition border ${
                        config.banner_mode === "text"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}>
                      Aa Texto
                    </button>
                    <button type="button" onClick={() => updateField("banner_mode", "image")}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition border ${
                        config.banner_mode === "image"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                      }`}>
                      🖼 Imagem
                    </button>
                  </div>
                </div>

                {config.banner_mode === "text" ? (
                  <Field label="Texto do banner" hint="Ex: 'Projeto acadêmico de [Universidade] - 2026'">
                    <input type="text" value={config.banner_text}
                      onChange={(e) => updateField("banner_text", e.target.value)}
                      className="input" />
                  </Field>
                ) : (
                  <ImageUploadField
                    label="Imagem do banner"
                    hint="Fica horizontal no topo, altura máx 48px. Upload preserva qualidade."
                    folder="banner"
                    value={config.banner_image_url}
                    onChange={(url) => updateField("banner_image_url", url)}
                    previewBg={config.banner_bg_color}
                    previewMaxHeight={48}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <ColorField label="Cor de fundo" value={config.banner_bg_color} onChange={(val) => updateField("banner_bg_color", val)} />
                  {config.banner_mode === "text" && (
                    <ColorField label="Cor do texto" value={config.banner_text_color} onChange={(val) => updateField("banner_text_color", val)} />
                  )}
                </div>

                <Field label="Link ao clicar (opcional)" hint="Deixe vazio se não for clicável">
                  <input type="url" value={config.banner_link_url}
                    onChange={(e) => updateField("banner_link_url", e.target.value)}
                    placeholder="https://..." className="input" />
                </Field>
              </>
            )}
          </Section>

          {/* === LOGO === */}
          <Section title="Logo & Identidade" icon="✨">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Tipo de logo</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => updateField("logo_mode", "text")}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition border ${
                    config.logo_mode === "text" ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}>Aa Texto</button>
                <button type="button" onClick={() => updateField("logo_mode", "image")}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition border ${
                    config.logo_mode === "image" ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}>🖼 Imagem</button>
              </div>
            </div>

            {config.logo_mode === "text" ? (
              <>
                <Field label="Texto principal">
                  <input type="text" value={config.logo_primary}
                    onChange={(e) => updateField("logo_primary", e.target.value)} className="input" />
                </Field>
                <Field label="Texto secundário">
                  <input type="text" value={config.logo_secondary}
                    onChange={(e) => updateField("logo_secondary", e.target.value)} className="input" />
                </Field>
              </>
            ) : (
              <ImageUploadField
                label="Imagem da logo"
                hint="PNG ou SVG com fundo transparente. Upload preserva qualidade."
                folder="logo"
                value={config.logo_image_url}
                onChange={(url) => updateField("logo_image_url", url)}
                previewBg="linear-gradient(to bottom right, #1f2937, #111827)"
                previewMaxHeight={Math.max(80, v.logo_size * 0.5)}
              />
            )}

            <ViewportLabel viewport={viewport} />

            <Field label={`Tamanho da logo: ${v.logo_size}%`}>
              <input type="range" min="40" max="250" value={v.logo_size}
                onChange={(e) => updateViewportField("logo_size", parseInt(e.target.value))}
                className="w-full accent-gray-900" />
            </Field>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Alinhamento</label>
              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((align) => (
                  <button key={align} type="button"
                    onClick={() => updateViewportField("logo_align", align)}
                    className={`py-2 rounded-lg text-xs font-semibold transition border ${
                      v.logo_align === align ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}>
                    {align === "left" ? "← Esquerda" : align === "center" ? "Centro" : "Direita →"}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Tagline (acima do logo)" hint="Ex: Discreto · Anônimo · Lucrativo">
              <input type="text" value={config.tagline}
                onChange={(e) => updateField("tagline", e.target.value)} className="input" />
            </Field>
          </Section>

          {/* === HEADLINE + CTA === */}
          <Section title="Headline & Botão CTA" icon="📣">
            <Field label="Headline principal" hint="Use a barra de formatação para destacar palavras">
              <RichTextEditor
                value={config.headline_html}
                onChange={(html) => {
                  updateField("headline_html", html);
                  // Mantém versão plana sincronizada (fallback)
                  const plain = html.replace(/<[^>]*>/g, "");
                  updateField("headline", plain);
                }}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Tamanho: ${config.headline_size}px`}>
                <input type="range" min="12" max="48" value={config.headline_size}
                  onChange={(e) => updateField("headline_size", parseInt(e.target.value))}
                  className="w-full accent-gray-900" />
              </Field>
              <Field label={`Peso: ${config.headline_weight}`}>
                <input type="range" min="300" max="900" step="100" value={config.headline_weight}
                  onChange={(e) => updateField("headline_weight", parseInt(e.target.value))}
                  className="w-full accent-gray-900" />
              </Field>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Alinhamento</label>
              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((align) => (
                  <button key={align} type="button"
                    onClick={() => updateField("headline_align", align)}
                    className={`py-2 rounded-lg text-xs font-semibold transition border ${
                      config.headline_align === align ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}>
                    {align === "left" ? "← Esquerda" : align === "center" ? "Centro" : "Direita →"}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 my-2"></div>

            <Field label="Texto do botão (CTA)">
              <input type="text" value={config.cta_text}
                onChange={(e) => updateField("cta_text", e.target.value)} className="input" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Tamanho: ${config.cta_size}px`}>
                <input type="range" min="10" max="24" value={config.cta_size}
                  onChange={(e) => updateField("cta_size", parseInt(e.target.value))}
                  className="w-full accent-gray-900" />
              </Field>
              <Field label={`Peso: ${config.cta_weight}`}>
                <input type="range" min="300" max="900" step="100" value={config.cta_weight}
                  onChange={(e) => updateField("cta_weight", parseInt(e.target.value))}
                  className="w-full accent-gray-900" />
              </Field>
            </div>
          </Section>

          {/* === CORES === */}
          <Section title="Cores" icon="🎨">
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Primária" value={config.color_primary} onChange={(val) => updateField("color_primary", val)} />
              <ColorField label="Acento" value={config.color_accent} onChange={(val) => updateField("color_accent", val)} />
              <ColorField label="Fundo (topo)" value={config.color_bg_from} onChange={(val) => updateField("color_bg_from", val)} />
              <ColorField label="Fundo (meio)" value={config.color_bg_via} onChange={(val) => updateField("color_bg_via", val)} />
              <ColorField label="Fundo (base)" value={config.color_bg_to} onChange={(val) => updateField("color_bg_to", val)} />
            </div>
          </Section>

          {/* === IMAGEM DE FUNDO === */}
          <Section title="Imagem de fundo (opcional)" icon="🖼️">
            <ImageUploadField
              label="Imagem de fundo"
              hint="Compartilhada entre desktop e mobile. Recomendado mínimo 2400px de largura."
              folder="background"
              value={config.background_image_url}
              onChange={(url) => updateField("background_image_url", url)}
              previewBg="#111827"
              previewMaxHeight={160}
            />

            {config.background_image_url && (
              <>
                <ViewportLabel viewport={viewport} />

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Comportamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["cover", "contain", "auto"] as const).map((fit) => (
                      <button key={fit} type="button"
                        onClick={() => updateViewportField("background_fit", fit)}
                        className={`py-2 rounded-lg text-xs font-semibold transition border ${
                          v.background_fit === fit ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                        }`}
                        title={fit === "cover" ? "Preenche tudo" : fit === "contain" ? "Imagem inteira" : "Tamanho original"}>
                        {fit === "cover" ? "Preencher" : fit === "contain" ? "Conter" : "Auto"}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label={`Posição horizontal: ${v.background_position_x}%`} hint="0% = esquerda · 100% = direita">
                  <input type="range" min="0" max="100" value={v.background_position_x}
                    onChange={(e) => updateViewportField("background_position_x", parseInt(e.target.value))}
                    className="w-full accent-gray-900" />
                </Field>

                <Field label={`Posição vertical: ${v.background_position_y}%`} hint="0% = topo · 100% = base">
                  <input type="range" min="0" max="100" value={v.background_position_y}
                    onChange={(e) => updateViewportField("background_position_y", parseInt(e.target.value))}
                    className="w-full accent-gray-900" />
                </Field>

                <Field label={`Zoom: ${v.background_size}%`} hint="50% = afasta · 250% = aproxima">
                  <input type="range" min="50" max="250" value={v.background_size}
                    onChange={(e) => updateViewportField("background_size", parseInt(e.target.value))}
                    className="w-full accent-gray-900" />
                </Field>

                <Field label={`Escurecimento: ${v.background_overlay_opacity}%`} hint="Camada escura sobre a imagem pra texto ficar legível">
                  <input type="range" min="0" max="90" value={v.background_overlay_opacity}
                    onChange={(e) => updateViewportField("background_overlay_opacity", parseInt(e.target.value))}
                    className="w-full accent-gray-900" />
                </Field>
              </>
            )}
          </Section>

          {/* === FAQ === */}
          <Section title="FAQ" icon="❓">
            {config.faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pergunta {i + 1}</span>
                  <button onClick={() => removeFaq(i)} className="text-xs text-red-600 hover:text-red-800 transition">Remover</button>
                </div>
                <input type="text" value={faq.q} onChange={(e) => updateFaq(i, "q", e.target.value)}
                  placeholder="Pergunta" className="input mb-2" />
                <textarea value={faq.a} onChange={(e) => updateFaq(i, "a", e.target.value)} rows={3}
                  placeholder="Resposta" className="input resize-none" />
              </div>
            ))}
            <button onClick={addFaq}
              className="w-full border-2 border-dashed border-gray-300 hover:border-gray-500 text-gray-500 hover:text-gray-900 py-3 rounded-xl text-sm font-semibold transition">
              + Adicionar pergunta
            </button>
          </Section>

          {/* === PERGUNTAS DO ONBOARDING === */}
          <Section title="Perguntas do cadastro" icon="❔">
            <p className="text-[11px] text-gray-500 mb-2">
              As perguntas que aparecem no fluxo de onboarding (após enviar a foto). Cada uma tem título, subtítulo e opções de resposta com emoji + cor.
            </p>
            {config.questions.map((q, qIdx) => (
              <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pergunta {qIdx + 1}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => updateQuestion(qIdx, "title", e.target.value)}
                    placeholder="Título da pergunta"
                    className="input font-semibold"
                  />
                  <input
                    type="text"
                    value={q.subtitle}
                    onChange={(e) => updateQuestion(qIdx, "subtitle", e.target.value)}
                    placeholder="Subtítulo / explicação"
                    className="input text-sm"
                  />
                </div>

                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Opções de resposta
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={`${q.id}-opt-${optIdx}`}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={opt.emoji}
                        onChange={(e) => updateQuestionOption(qIdx, optIdx, "emoji", e.target.value)}
                        placeholder="🌟"
                        className="w-12 text-center bg-white border border-gray-200 rounded px-1 py-1.5 text-base"
                        title="Emoji"
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateQuestionOption(qIdx, optIdx, "text", e.target.value)}
                        placeholder="Texto da opção"
                        className="flex-1 bg-white border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900 min-w-0"
                      />
                      <input
                        type="color"
                        value={opt.color}
                        onChange={(e) => updateQuestionOption(qIdx, optIdx, "color", e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200 flex-shrink-0"
                        title="Cor"
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestionOption(qIdx, optIdx)}
                        className="text-red-500 hover:text-red-700 text-lg flex-shrink-0 px-1"
                        title="Remover opção"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addQuestionOption(qIdx)}
                    className="w-full border border-dashed border-gray-300 hover:border-gray-500 text-gray-500 hover:text-gray-900 py-2 rounded-lg text-xs font-semibold transition"
                  >
                    + Adicionar opção
                  </button>
                </div>
              </div>
            ))}
          </Section>

          <div className="h-12"></div>
        </div>

        {/* === PREVIEW === */}
        <div className="bg-gray-100 overflow-y-auto p-6 hidden lg:block">
          <div className="sticky top-0 bg-gray-100 pb-3 mb-3 z-10 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Pré-visualização: {viewport === "desktop" ? "💻 Desktop" : "📱 Mobile"}
            </p>
          </div>
          <Preview config={config} viewport={viewport} />
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
        <span>{icon}</span>{title}
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
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs font-mono text-gray-900 outline-none min-w-0" />
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  hint,
  folder,
  value,
  onChange,
  previewBg,
  previewMaxHeight,
}: {
  label: string;
  hint?: string;
  folder: "logo" | "banner" | "background";
  value: string;
  onChange: (url: string) => void;
  previewBg?: string;
  previewMaxHeight?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Imagem muito grande (máx 10MB)");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Apenas imagens são aceitas");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setUploading(true);
    setError("");
    const res = await uploadLandingAsset(file, folder);
    if (res.ok && res.url) {
      onChange(res.url);
    } else {
      setError(res.error || "Erro no upload");
      setTimeout(() => setError(""), 4000);
    }
    setUploading(false);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">{label}</label>

      {!value && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`block cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition ${
            dragOver ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-500 bg-white"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Enviando...</span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <div className="text-sm font-semibold text-gray-700">Clique ou arraste a imagem</div>
              <div className="text-[11px] text-gray-500 mt-0.5">PNG, JPG, SVG, WebP — até 10MB</div>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onInputChange} disabled={uploading} />
        </label>
      )}

      {value && (
        <>
          <div className="rounded-lg p-3 flex items-center justify-center mb-2" style={{ background: previewBg || "#f3f4f6", minHeight: 80 }}>
            <img src={value} alt="preview" style={{ maxHeight: previewMaxHeight || 120, maxWidth: "100%", objectFit: "contain" }} />
          </div>
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer bg-gray-900 hover:bg-black text-white text-xs font-semibold py-2 px-3 rounded-lg text-center transition">
              {uploading ? "Enviando..." : "Trocar imagem"}
              <input type="file" accept="image/*" className="hidden" onChange={onInputChange} disabled={uploading} />
            </label>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-2 px-3 rounded-lg transition border border-red-200"
            >
              Remover
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setShowUrlInput(!showUrlInput)}
        className="text-[11px] text-gray-500 hover:text-gray-900 underline mt-2 transition"
      >
        {showUrlInput ? "Esconder campo de URL" : "Ou colar URL manualmente"}
      </button>

      {showUrlInput && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full mt-2 bg-gray-50 border border-gray-200 focus:border-gray-900 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 outline-none"
        />
      )}

      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {hint && <p className="text-[11px] text-gray-400 mt-2">{hint}</p>}
    </div>
  );
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);
  const lastValueRef = useRef(value);
  const [highlightColor, setHighlightColor] = useState("#fef08a");
  const [textColor, setTextColor] = useState("#22c55e");

  // Atualiza editor quando value externo muda (mas evita loops)
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value;
    }
  }, [value]);

  function exec(command: string, val?: string) {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
    forceUpdate((n) => n + 1);
  }

  function handleInput() {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
  }

  function applyHighlight() {
    exec("hiliteColor", highlightColor);
  }

  function applyTextColor() {
    exec("foreColor", textColor);
  }

  function clearFormat() {
    exec("removeFormat");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 px-2 py-1.5 flex items-center gap-1 flex-wrap">
        <ToolbarBtn onClick={() => exec("bold")} title="Negrito (Cmd+B)">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("italic")} title="Itálico (Cmd+I)">
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("underline")} title="Sublinhado (Cmd+U)">
          <u>U</u>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("strikeThrough")} title="Tachado">
          <s>S</s>
        </ToolbarBtn>

        <div className="h-5 w-px bg-gray-300 mx-1"></div>

        {/* Marca-texto */}
        <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded px-1 py-0.5">
          <button
            type="button"
            onClick={applyHighlight}
            title="Aplicar marca-texto"
            className="px-1.5 py-1 text-xs font-bold rounded hover:bg-gray-100 transition"
            style={{ background: highlightColor }}
          >
            ✏️
          </button>
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 p-0"
            title="Cor do marca-texto"
          />
        </div>

        {/* Cor de texto */}
        <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded px-1 py-0.5">
          <button
            type="button"
            onClick={applyTextColor}
            title="Aplicar cor"
            className="px-1.5 py-1 text-xs font-bold rounded hover:bg-gray-100 transition"
            style={{ color: textColor }}
          >
            A
          </button>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 p-0"
            title="Cor do texto"
          />
        </div>

        <div className="h-5 w-px bg-gray-300 mx-1"></div>

        <ToolbarBtn onClick={clearFormat} title="Limpar formatação">
          <span className="text-xs">⊘</span>
        </ToolbarBtn>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        className="p-3 min-h-[80px] text-sm text-gray-900 focus:outline-none prose-sm"
        style={{ wordBreak: "break-word" }}
      />

      <style jsx>{`
        div[contenteditable] mark {
          padding: 0 2px;
          border-radius: 2px;
        }
        div[contenteditable]:empty::before {
          content: 'Digite a headline aqui...';
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded transition text-sm"
    >
      {children}
    </button>
  );
}

function ViewportLabel({ viewport }: { viewport: Viewport }) {
  return (
    <div className={`text-[10px] uppercase tracking-wider font-bold rounded-lg py-1.5 px-3 ${
      viewport === "desktop" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
    }`}>
      ↓ Configuração específica para {viewport === "desktop" ? "💻 DESKTOP" : "📱 MOBILE"}
    </div>
  );
}

function Preview({ config, viewport }: { config: LandingConfig; viewport: Viewport }) {
  const v = config[viewport];
  const hasImage = !!config.background_image_url;
  const gradientBg = `radial-gradient(ellipse at top, ${config.color_bg_from} 0%, ${config.color_bg_via} 60%, ${config.color_bg_to} 100%)`;

  const alignClass =
    v.logo_align === "left" ? "items-start text-left" :
    v.logo_align === "right" ? "items-end text-right" :
    "items-center text-center";

  // Largura do preview muda conforme viewport
  const widthClass = viewport === "mobile" ? "max-w-sm mx-auto" : "max-w-full";

  return (
    <div className={widthClass}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        {/* Banner topo */}
        {config.banner_enabled && (
          <div className="text-center py-2 px-4 flex items-center justify-center"
               style={{ backgroundColor: config.banner_bg_color, color: config.banner_text_color }}>
            {config.banner_mode === "image" && config.banner_image_url ? (
              <img src={config.banner_image_url} alt="banner" className="max-h-10 w-auto mx-auto object-contain" />
            ) : (
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase">{config.banner_text}</span>
            )}
          </div>
        )}

        <div className="relative min-h-[480px] overflow-hidden" style={{ background: gradientBg }}>
          {hasImage && (
            <>
              <img src={config.background_image_url} alt=""
                className="absolute inset-0 w-full h-full"
                style={{
                  objectFit: v.background_fit === "auto" ? "none" : v.background_fit,
                  objectPosition: `${v.background_position_x}% ${v.background_position_y}%`,
                  transform: `scale(${v.background_size / 100})`,
                  transformOrigin: `${v.background_position_x}% ${v.background_position_y}%`,
                }} />
              <div className="absolute inset-0 bg-black"
                style={{ opacity: v.background_overlay_opacity / 100 }}></div>
            </>
          )}

          <div className={`relative p-8 min-h-[480px] flex flex-col justify-center ${alignClass}`}>
            <p className="text-[10px] uppercase tracking-[0.4em] mb-4" style={{ color: config.color_primary }}>
              {config.tagline}
            </p>
            {config.logo_mode === "image" && config.logo_image_url ? (
              <img src={config.logo_image_url} alt="logo" className="mb-4"
                style={{ height: `${v.logo_size * 0.6}px`, maxWidth: "80%", objectFit: "contain" }} />
            ) : (
              <div className="mb-3">
                <div className="tracking-[0.15em] leading-none mb-1 font-serif"
                  style={{ color: config.color_primary, fontSize: `${v.logo_size * 0.5}px` }}>
                  {config.logo_primary}
                </div>
                <div className="tracking-[0.4em] leading-none text-white font-serif"
                  style={{ fontSize: `${v.logo_size * 0.25}px` }}>
                  {config.logo_secondary}
                </div>
              </div>
            )}
            <p
              className="text-white/70 mt-6 mb-6 max-w-xs"
              style={{
                fontSize: `${config.headline_size}px`,
                fontWeight: config.headline_weight,
                textAlign: config.headline_align,
                lineHeight: 1.4,
              }}
              dangerouslySetInnerHTML={{
                __html: sanitizeRichHtml(config.headline_html || config.headline),
              }}
            />
            <button className="py-3 px-8 rounded-2xl uppercase tracking-wide"
              style={{
                backgroundColor: config.color_primary, color: "#0a0a0a",
                fontSize: `${config.cta_size}px`,
                fontWeight: config.cta_weight,
                alignSelf: v.logo_align === "left" ? "flex-start" :
                            v.logo_align === "right" ? "flex-end" : "center",
              }}>
              {config.cta_text}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
