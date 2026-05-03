"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type LandingConfig } from "@/lib/landing-config";

export default function LoginClient({ initialConfig }: { initialConfig: LandingConfig }) {
  const config = initialConfig;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  function tryAutoFill(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setEmail(v);
    try {
      const stored = localStorage.getItem(`ff_pwd_${v}`);
      if (stored) setPassword(stored);
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const hasImage = !!config.background_image_url;
  const v = config.desktop;
  const gradientBg = `radial-gradient(ellipse at top, ${config.color_bg_from} 0%, ${config.color_bg_via} 60%, ${config.color_bg_to} 100%)`;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ background: gradientBg }} />

      {hasImage && (
        <>
          <img
            src={config.background_image_url}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{
              objectFit: v.background_fit === "auto" ? "none" : v.background_fit,
              objectPosition: `${v.background_position_x}% ${v.background_position_y}%`,
              transform: `scale(${v.background_size / 100})`,
              transformOrigin: `${v.background_position_x}% ${v.background_position_y}%`,
            }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: v.background_overlay_opacity / 100 }}
          />
        </>
      )}

      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 50% 40%, ${config.color_primary}10 0%, transparent 60%)`,
      }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          {config.logo_mode === "image" && config.logo_image_url ? (
            <div className="flex justify-center mb-3">
              <img
                src={config.logo_image_url}
                alt="logo"
                style={{ height: `${v.logo_size * 0.6}px`, maxWidth: "80%", objectFit: "contain" }}
              />
            </div>
          ) : (
            <>
              <div className="font-display tracking-[0.15em] leading-none mb-1"
                   style={{ color: config.color_primary, fontSize: `${v.logo_size * 0.4}px` }}>
                {config.logo_primary}
              </div>
              <div className="font-display tracking-[0.4em] text-bone-100 leading-none"
                   style={{ fontSize: `${v.logo_size * 0.2}px` }}>
                {config.logo_secondary}
              </div>
            </>
          )}
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-600 mt-6">
            Acessar leilão
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={tryAutoFill}
            className="w-full bg-ink-900/80 border border-ink-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink-900/80 border border-ink-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition"
          />

          {error && (
            <div className="bg-red-950/40 border border-red-900 text-red-300 px-4 py-3 text-sm rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full disabled:bg-ink-700 text-ink-950 font-bold py-5 rounded-2xl transition uppercase tracking-wide"
            style={{ backgroundColor: loading ? undefined : config.color_primary }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-8 font-mono text-xs uppercase tracking-[0.2em] text-ink-600">
          Sem conta?{" "}
          <Link href="/" style={{ color: config.color_primary }} className="hover:opacity-80">
            Enviar foto
          </Link>
        </p>
      </div>
    </div>
  );
}
