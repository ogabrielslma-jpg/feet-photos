"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateListingTitle, RARITIES, PLACEHOLDER_IMAGES } from "@/lib/fake-data";

const FAQS = [
  {
    q: "Como funciona?",
    a: "Você envia a foto do seu pé no formulário acima e recebe propostas de compra de algum dos nossos 43.730 usuários compradores. Tempo de venda estimado é de 2 até 15 minutos.",
  },
  {
    q: "Como eu vou receber o pagamento?",
    a: "Dentro da plataforma você cadastra uma conta bancária e uma chave pix. Os pagamentos caem na conta dentro de 15 minutos após a venda. Exceto aos domingos e feriados o qual esse tempo pode levar até 60 minutos.",
  },
  {
    q: "Regras da plataforma. Leia com atenção!",
    a: "Os compradores querem exclusividade, ou seja, você vai receber uma vez por uma foto vendida. Para fazer mais de uma venda, é necessário enviar outra foto do seu pé! Ex: Ao enviar a foto do seu pé agora mesmo, você vai receber algumas propostas, escolher uma, e realizar a venda. Para fazer uma nova venda, será necessário enviar outra foto do seu pé.",
  },
  {
    q: "Isso é real?",
    a: "Não. Este é um projeto acadêmico fictício criado em 24 horas para um desafio universitário. Nenhum sheik existe, nenhuma transação acontece, nenhuma foto é vendida. É 100% simulação.",
  },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeBuyers, setActiveBuyers] = useState(43730);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const i = setInterval(() => {
      setActiveBuyers((c) => c + Math.floor(Math.random() * 7) - 3);
    }, 2500);
    return () => clearInterval(i);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Gera senha automática (não pede pro user — UX mais limpa)
      const autoPassword = `FP_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

      // 1. Cria conta
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: autoPassword,
        options: { data: { username: name } },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Erro ao criar conta");

      await supabase.auth.signInWithPassword({ email, password: autoPassword });

      // 2. Upload da foto
      let imageUrl = PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
      if (file) {
        const fileName = `${signUpData.user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("feet-photos")
          .upload(fileName, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("feet-photos").getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // 3. Cria listagem
      const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
      const startPrice = 100 * rarity.multiplier + Math.floor(Math.random() * 500);

      await supabase.from("listings").insert({
        seller_id: signUpData.user.id,
        title: generateListingTitle(),
        description: "Authenticated by FootFans AI™",
        image_url: imageUrl,
        starting_price: startPrice,
        current_bid: startPrice,
        rarity: rarity.label.toLowerCase(),
      });

      // Salva senha no localStorage pra user poder logar depois (simulação)
      try {
        localStorage.setItem(`ff_pwd_${email}`, autoPassword);
      } catch {}

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Algo deu errado");
      setLoading(false);
    }
  }

  return (
    <>
      {/* HERO - layout centralizado */}
      <section className="relative min-h-screen flex flex-col items-center justify-start py-16 px-6">
        {/* Fundo escuro elegante */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 60%, #000000 100%)",
          }} />
          <div className="absolute inset-0" style={{
            background: "radial-gradient(circle at 50% 40%, rgba(34, 197, 94, 0.05) 0%, transparent 60%)",
          }} />
        </div>

        {/* Login link no topo direito */}
        <div className="absolute top-6 right-6 z-20">
          <Link href="/login" className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-100/60 hover:text-bone-100 transition">
            Entrar
          </Link>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto pt-12 animate-fade-up">
          {/* Eyebrow / Headline pequena */}
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-6">
            Discreto · Anônimo · Lucrativo
          </p>

          {/* Logo FOOT FANS */}
          <div className="text-center mb-3">
            <div className="font-display text-5xl md:text-6xl tracking-[0.15em] text-moss-500 leading-none mb-1">
              FOOT
            </div>
            <div className="font-display text-2xl md:text-3xl tracking-[0.4em] text-bone-100 leading-none">
              FANS
            </div>
          </div>

          {/* Métrica social */}
          <p className="text-center text-base text-bone-100/70 mt-8 mb-8 font-light">
            Mais de <span className="text-moss-400 font-semibold">{activeBuyers.toLocaleString("pt-BR")}</span> compradores ativos<br />
            aguardando sua foto agora
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Upload area */}
            <label className="block cursor-pointer group">
              <div className={`bg-ink-900/80 backdrop-blur-sm border-2 border-dashed rounded-2xl px-6 py-10 text-center transition ${preview ? "border-moss-700" : "border-ink-700 hover:border-ink-600"}`}>
                {preview ? (
                  <div className="flex items-center gap-4">
                    <img src={preview} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm text-moss-400 font-mono uppercase tracking-wider mb-1">✓ Foto carregada</div>
                      <div className="text-xs text-bone-100/60 truncate">{file?.name}</div>
                    </div>
                    <span
                      onClick={(e) => { e.preventDefault(); setFile(null); setPreview(null); }}
                      className="text-xs text-ink-600 hover:text-bone-100 cursor-pointer"
                    >
                      Trocar
                    </span>
                  </div>
                ) : (
                  <>
                    <svg className="w-7 h-7 mx-auto mb-3 text-bone-100/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <div className="text-bone-100/90 text-base">Escolher arquivo</div>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {/* Nome */}
            <input
              type="text"
              required
              placeholder="Seu primeiro nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ink-900/80 backdrop-blur-sm border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition text-base"
            />

            {/* Email */}
            <input
              type="email"
              required
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-900/80 backdrop-blur-sm border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition text-base"
            />

            {error && (
              <div className="bg-red-950/40 border border-red-900 text-red-300 px-4 py-3 text-sm rounded-2xl">
                {error}
              </div>
            )}

            {/* Botão verde grande */}
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-moss-500 hover:bg-moss-400 disabled:bg-ink-700 disabled:cursor-not-allowed text-ink-950 disabled:text-ink-600 font-bold py-5 rounded-2xl transition text-base tracking-wide uppercase"
            >
              {loading ? "Enviando..." : "Enviar aos compradores"}
            </button>
          </form>

          {/* Scroll cue */}
          <div className="text-center mt-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-600 mb-2">
              Perguntas frequentes
            </p>
            <svg className="w-4 h-4 mx-auto text-ink-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="relative bg-ink-950 py-24 px-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-center font-display text-3xl text-bone-100 mb-10">
            Perguntas <span className="italic-accent text-moss-500">frequentes</span>
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`border rounded-2xl transition-all ${
                  openFaq === i
                    ? "border-moss-700 bg-ink-900/80"
                    : "border-ink-800 bg-ink-900/40"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className={`text-base ${openFaq === i ? "text-bone-100" : "text-bone-100/80"}`}>
                    {faq.q}
                  </span>
                  <svg
                    className={`w-4 h-4 text-bone-100/60 transition-transform flex-shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-bone-100/70 leading-relaxed text-sm font-light animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Logo footer */}
          <div className="text-center mt-20">
            <div className="font-display text-3xl tracking-[0.15em] text-moss-500 leading-none mb-1">
              FOOT
            </div>
            <div className="font-display text-base tracking-[0.4em] text-bone-100/60 leading-none">
              FANS
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-600 mt-6">
              © 2026 — Projeto acadêmico fictício
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
