"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateListingTitle, RARITIES, PLACEHOLDER_IMAGES } from "@/lib/fake-data";
import { fetchLandingConfig, DEFAULT_LANDING_CONFIG, type LandingConfig } from "@/lib/landing-config";

type Step =
  | "upload"      // foto + nome + email
  | "submitted"   // "foto enviada"
  | "q1" | "q2" | "q3" | "q4" | "q5"  // 5 perguntas
  | "birthdate"
  | "credentials" // senha + username
  | "done";       // redireciona pro login

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
    a: "Os compradores querem exclusividade, ou seja, você vai receber uma vez por uma foto vendida. Para fazer mais de uma venda, é necessário enviar outra foto do seu pé!",
  },
  {
    q: "Isso é real?",
    a: "Não. Este é um projeto acadêmico fictício criado em 24 horas para um desafio universitário. Nenhum sheik existe, nenhuma transação acontece. É 100% simulação.",
  },
];

const QUESTIONS = [
  {
    id: "q1",
    title: "Você tem alguma tatuagem nos pés?",
    subtitle: "Compradores valorizam exclusividade visual.",
    options: ["Não tenho", "Tenho uma pequena", "Tenho várias", "Tenho, mas escondidas"],
  },
  {
    id: "q2",
    title: "Costuma pintar as unhas dos pés?",
    subtitle: "Cores chamativas aumentam o lance médio.",
    options: ["Nunca", "Às vezes", "Sempre", "Faço pedicure profissional"],
  },
  {
    id: "q3",
    title: "Qual o formato dos seus dedos?",
    subtitle: "Cada formato tem demanda em diferentes regiões.",
    options: ["Egípcio (decrescente)", "Grego (segundo dedo maior)", "Romano (3 primeiros iguais)", "Não sei"],
  },
  {
    id: "q4",
    title: "Qual o tamanho do seu pé?",
    subtitle: "Tamanhos pequenos são mais valorizados em Dubai.",
    options: ["33-35", "36-37", "38-39", "40+"],
  },
  {
    id: "q5",
    title: "Cuidados com os pés?",
    subtitle: "Quanto mais cuidados, maior a raridade.",
    options: ["Nenhum especial", "Hidratação semanal", "Pedicure mensal", "Spa, esfoliação, hidratação diária"],
  },
];

export default function Home() {
  const [step, setStep] = useState<Step>("upload");

  // Tela 1
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  // Perguntas (q1-q5)
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Birthdate
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeBuyers, setActiveBuyers] = useState(43730);
  const [config, setConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchLandingConfig().then(setConfig);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setActiveBuyers((c) => c + Math.floor(Math.random() * 7) - 3);
    }, 8000);
    return () => clearInterval(i);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  // Submit da tela 1: foto + nome + email
  function handleSubmitInitial(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !firstName || !email) return;
    setStep("submitted");
    // Auto-avança pra primeira pergunta após 2.5s
    setTimeout(() => setStep("q1"), 2500);
  }

  // Avança pra próxima pergunta ou pra birthdate
  function answerQuestion(questionId: string, value: string) {
    setAnswers((a) => ({ ...a, [questionId]: value }));
    const order: Step[] = ["q1", "q2", "q3", "q4", "q5", "birthdate"];
    const idx = order.indexOf(step as Step);
    if (idx >= 0 && idx < order.length - 1) {
      setStep(order[idx + 1]);
    }
  }

  function handleBirthdate(e: React.FormEvent) {
    e.preventDefault();
    if (!day || !month || !year) return;
    // Valida idade mínima (18+)
    const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const age = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) {
      setError("Você precisa ter 18+ anos para usar a plataforma.");
      return;
    }
    setError("");
    setStep("credentials");
  }

  // Submit final: cria conta + faz upload + cria listing
  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Cria conta no Supabase
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, first_name: firstName } },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Erro ao criar conta");

      // 2. Faz login
      await supabase.auth.signInWithPassword({ email, password });

      // 3. Upload da foto
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

      // 4. Atualiza profile com username
      try {
        await supabase.from("profiles").update({ username }).eq("id", signUpData.user.id);
      } catch {}

      // 5. Cria listagem
      const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
      const startPrice = 100 * rarity.multiplier + Math.floor(Math.random() * 500);

      await supabase.from("listings").insert({
        seller_id: signUpData.user.id,
        title: generateListingTitle(),
        description: `Tatuagem: ${answers.q1} | Esmalte: ${answers.q2} | Formato: ${answers.q3} | Tamanho: ${answers.q4} | Cuidados: ${answers.q5}`,
        image_url: imageUrl,
        starting_price: startPrice,
        current_bid: startPrice,
        rarity: rarity.label.toLowerCase(),
      });

      // Salva senha pra auto-fill no login
      try { localStorage.setItem(`ff_pwd_${email}`, password); } catch {}

      setStep("done");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Algo deu errado");
      setLoading(false);
    }
  }

  // Container e Progress estão definidos como componentes externos no final do arquivo

  // ============ TELA 1: UPLOAD + NOME + EMAIL ============
  if (step === "upload") {
    return (
      <>
        <Wrapper showLoginLink config={config}>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-6" style={{ color: config.color_primary }}>
            {config.tagline}
          </p>
          <div className="text-center mb-3">
            <div className="font-display text-5xl md:text-6xl tracking-[0.15em] text-moss-500 leading-none mb-1" style={{ color: config.color_primary }}>{config.logo_primary}</div>
            <div className="font-display text-2xl md:text-3xl tracking-[0.4em] text-bone-100 leading-none">{config.logo_secondary}</div>
          </div>
          <p className="text-center text-base text-bone-100/70 mt-8 mb-8 font-light">
            {config.headline}
          </p>

          <form onSubmit={handleSubmitInitial} className="space-y-3">
            <label className="block cursor-pointer group">
              <div className={`bg-ink-900/80 backdrop-blur-sm border-2 border-dashed rounded-2xl px-6 py-8 text-center transition ${preview ? "border-moss-700" : "border-ink-700 hover:border-ink-600"}`}>
                {preview ? (
                  <div className="flex items-center gap-4">
                    <img src={preview} alt="" className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-xs text-moss-400 font-mono uppercase tracking-wider mb-1">✓ Foto carregada</div>
                      <div className="text-xs text-bone-100/60 truncate">{file?.name}</div>
                    </div>
                    <span onClick={(e) => { e.preventDefault(); setFile(null); setPreview(null); }}
                      className="text-xs text-ink-600 hover:text-bone-100 cursor-pointer">Trocar</span>
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

            <input type="text" required placeholder="Seu primeiro nome" value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition text-base" />

            <input type="email" required placeholder="Seu e-mail" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition text-base" />

            <button type="submit" disabled={!file || !firstName || !email}
              className="w-full bg-moss-500 hover:bg-moss-400 disabled:bg-ink-700 disabled:cursor-not-allowed text-ink-950 disabled:text-ink-600 font-bold py-5 rounded-2xl transition text-base tracking-wide uppercase"
              style={{ backgroundColor: file && firstName && email ? config.color_primary : undefined }}>
              {config.cta_text}
            </button>
          </form>

          <div className="text-center mt-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-600 mb-2">Perguntas frequentes</p>
            <svg className="w-4 h-4 mx-auto text-ink-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Wrapper>

        <section className="relative bg-ink-950 py-24 px-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-center font-display text-3xl text-bone-100 mb-10">
              Perguntas <span className="italic-accent text-moss-500">frequentes</span>
            </h2>
            <div className="space-y-3">
              {config.faqs.map((faq, i) => (
                <div key={i} className={`border rounded-2xl transition-all ${openFaq === i ? "border-moss-700 bg-ink-900/80" : "border-ink-800 bg-ink-900/40"}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                    <span className={`text-base ${openFaq === i ? "text-bone-100" : "text-bone-100/80"}`}>{faq.q}</span>
                    <svg className={`w-4 h-4 text-bone-100/60 transition-transform flex-shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="text-center mt-20">
              <div className="font-display text-3xl tracking-[0.15em] text-moss-500 leading-none mb-1" style={{ color: config.color_primary }}>{config.logo_primary}</div>
              <div className="font-display text-base tracking-[0.4em] text-bone-100/60 leading-none">{config.logo_secondary}</div>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-600 mt-6">© 2026 — Projeto acadêmico fictício</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ============ TELA 2: SUBMITTED (loading) ============
  if (step === "submitted") {
    return (
      <Wrapper config={config}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-8 relative">
            <div className="absolute inset-0 border-4 border-moss-700/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-moss-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-moss-500 mb-3">
            Sua foto está no leilão
          </p>
          <h2 className="font-display text-3xl text-bone-100 mb-4">
            Enviando para os <span className="italic-accent text-moss-500">compradores...</span>
          </h2>
          <p className="text-bone-100/60 text-sm">
            Enquanto isso, complete seu cadastro<br/>para receber os lances.
          </p>
        </div>
      </Wrapper>
    );
  }

  // ============ TELAS DE PERGUNTAS (q1-q5) ============
  const questionIndex = ["q1", "q2", "q3", "q4", "q5"].indexOf(step as string);
  if (questionIndex >= 0) {
    const q = QUESTIONS[questionIndex];
    return (
      <Wrapper config={config}>
        <Progress current={questionIndex + 1} total={7} />
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-moss-500 mb-3">
          Pergunta {questionIndex + 1} de 5
        </p>
        <h2 className="text-center font-display text-3xl text-bone-100 mb-2 leading-tight">
          {q.title}
        </h2>
        <p className="text-center text-bone-100/60 text-sm mb-8">{q.subtitle}</p>

        <div className="space-y-2">
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => answerQuestion(q.id, opt)}
              className="w-full bg-ink-900/80 border border-ink-700 hover:border-moss-700 hover:bg-ink-900 rounded-2xl px-6 py-4 text-bone-100 text-left transition group"
            >
              <span className="text-base">{opt}</span>
              <span className="float-right text-ink-600 group-hover:text-moss-500 transition">→</span>
            </button>
          ))}
        </div>
      </Wrapper>
    );
  }

  // ============ TELA: BIRTHDATE ============
  if (step === "birthdate") {
    return (
      <Wrapper config={config}>
        <Progress current={6} total={7} />
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-moss-500 mb-3">
          Quase lá
        </p>
        <h2 className="text-center font-display text-3xl text-bone-100 mb-2 leading-tight">
          Sua <span className="italic-accent text-moss-500">data de nascimento</span>
        </h2>
        <p className="text-center text-bone-100/60 text-sm mb-8">
          Apenas maiores de 18 anos podem vender.
        </p>

        <form onSubmit={handleBirthdate} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <input type="number" min="1" max="31" required placeholder="Dia" value={day}
              onChange={(e) => setDay(e.target.value)}
              className="bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-4 py-4 text-bone-100 placeholder-ink-600 focus:outline-none text-center text-base" />
            <input type="number" min="1" max="12" required placeholder="Mês" value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-4 py-4 text-bone-100 placeholder-ink-600 focus:outline-none text-center text-base" />
            <input type="number" min="1900" max="2010" required placeholder="Ano" value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-4 py-4 text-bone-100 placeholder-ink-600 focus:outline-none text-center text-base" />
          </div>

          {error && (
            <div className="bg-red-950/40 border border-red-900 text-red-300 px-4 py-3 text-sm rounded-2xl">{error}</div>
          )}

          <button type="submit"
            className="w-full bg-moss-500 hover:bg-moss-400 text-ink-950 font-bold py-5 rounded-2xl transition uppercase tracking-wide">
            Continuar
          </button>
        </form>
      </Wrapper>
    );
  }

  // ============ TELA: CREDENTIALS (username + senha) ============
  if (step === "credentials") {
    return (
      <Wrapper config={config}>
        <Progress current={7} total={7} />
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-moss-500 mb-3">
          Última etapa
        </p>
        <h2 className="text-center font-display text-3xl text-bone-100 mb-2">
          Crie sua <span className="italic-accent text-moss-500">conta</span>
        </h2>
        <p className="text-center text-bone-100/60 text-sm mb-8">
          Para acessar a plataforma e ver seus lances.
        </p>

        <form onSubmit={handleFinalSubmit} className="space-y-3">
          {/* Email com opção de trocar */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-600 mb-2 px-2">E-mail</label>
            {editingEmail ? (
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEditingEmail(false)}
                autoFocus
                className="w-full bg-ink-900/80 border border-moss-700 rounded-2xl px-6 py-4 text-bone-100 focus:outline-none text-base" />
            ) : (
              <div className="bg-ink-900/40 border border-ink-800 rounded-2xl px-6 py-4 flex items-center justify-between">
                <span className="text-bone-100/80 text-sm truncate">{email}</span>
                <button type="button" onClick={() => setEditingEmail(true)}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-moss-500 hover:text-moss-400 transition flex-shrink-0 ml-3">
                  Trocar
                </button>
              </div>
            )}
          </div>

          <input type="text" required placeholder="Username (ex: pearlsoles_official)" value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            className="w-full bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition text-base" />

          <input type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition text-base" />

          <input type="password" required placeholder="Confirmar senha" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-ink-900/80 border border-ink-700 focus:border-moss-700 rounded-2xl px-6 py-4 text-bone-100 placeholder-ink-600 focus:outline-none transition text-base" />

          {error && (
            <div className="bg-red-950/40 border border-red-900 text-red-300 px-4 py-3 text-sm rounded-2xl">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-moss-500 hover:bg-moss-400 disabled:bg-ink-700 text-ink-950 font-bold py-5 rounded-2xl transition uppercase tracking-wide">
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      </Wrapper>
    );
  }

  // ============ TELA: DONE (redirecting) ============
  if (step === "done") {
    return (
      <Wrapper config={config}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-8 bg-moss-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-ink-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-3xl text-bone-100 mb-4">
            Conta <span className="italic-accent text-moss-500">criada!</span>
          </h2>
          <p className="text-bone-100/60 text-sm">
            Redirecionando para o login...
          </p>
        </div>
      </Wrapper>
    );
  }

  return null;
}

// === Componentes externos (definidos fora pra não recriar a cada render) ===

function Wrapper({ children, showLoginLink = false, config = DEFAULT_LANDING_CONFIG }: { children: React.ReactNode; showLoginLink?: boolean; config?: LandingConfig }) {
  const bg = config.background_image_url
    ? `url(${config.background_image_url})`
    : `radial-gradient(ellipse at top, ${config.color_bg_from} 0%, ${config.color_bg_via} 60%, ${config.color_bg_to} 100%)`;
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center py-16 px-6">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: bg,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle at 50% 40%, ${config.color_primary}10 0%, transparent 60%)`,
        }} />
      </div>

      <div className="absolute top-8 left-0 right-0 px-6 flex items-center justify-between max-w-md mx-auto z-20">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-lg tracking-[0.15em]" style={{ color: config.color_primary }}>{config.logo_primary}</span>
          <span className="font-display text-xs tracking-[0.4em] text-bone-100">{config.logo_secondary}</span>
        </Link>
        {showLoginLink && (
          <Link href="/login" className="font-mono text-[10px] uppercase tracking-[0.25em] text-bone-100/60 hover:text-bone-100 transition">
            Entrar
          </Link>
        )}
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto pt-8">
        {children}
      </div>
    </section>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all ${i === current - 1 ? "w-8 bg-moss-500" : i < current - 1 ? "w-4 bg-moss-700" : "w-4 bg-ink-700"}`}
        />
      ))}
    </div>
  );
}
