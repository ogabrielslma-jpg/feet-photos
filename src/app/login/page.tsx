"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Tenta auto-preencher senha do localStorage (do cadastro)
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

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 60%, #000000 100%)",
      }} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-display text-4xl tracking-[0.15em] text-moss-500 leading-none mb-1">FOOT</div>
          <div className="font-display text-xl tracking-[0.4em] text-bone-100 leading-none">FANS</div>
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
            className="w-full bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition"
          />

          {error && (
            <div className="bg-red-950/40 border border-red-900 text-red-300 px-4 py-3 text-sm rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-moss-500 hover:bg-moss-400 disabled:bg-ink-700 text-ink-950 font-bold py-5 rounded-2xl transition uppercase tracking-wide"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center mt-8 font-mono text-xs uppercase tracking-[0.2em] text-ink-600">
          Sem conta?{" "}
          <Link href="/" className="text-moss-500 hover:text-moss-400">
            Enviar foto
          </Link>
        </p>
      </div>
    </div>
  );
}
