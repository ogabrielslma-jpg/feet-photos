// Config da landing — editável via /admin
// Lê do Supabase com fallback pra defaults

import { createClient } from "./supabase-client";

export type LandingConfig = {
  logo_primary: string;
  logo_secondary: string;
  tagline: string;
  headline: string;
  cta_text: string;
  banner_top_text: string;
  banner_top_enabled: boolean;
  color_primary: string;
  color_accent: string;
  color_bg_from: string;
  color_bg_via: string;
  color_bg_to: string;
  background_image_url: string;
  faqs: { q: string; a: string }[];
};

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  logo_primary: "FOOT",
  logo_secondary: "FANS",
  tagline: "Discreto · Anônimo · Lucrativo",
  headline: "Mais de 43.730 compradores ativos aguardando sua foto agora",
  cta_text: "Enviar aos compradores",
  banner_top_text: "⚠ Simulação acadêmica — nada aqui é real",
  banner_top_enabled: true,
  color_primary: "#22c55e",
  color_accent: "#a3e635",
  color_bg_from: "#1a1a2e",
  color_bg_via: "#0a0a0a",
  color_bg_to: "#000000",
  background_image_url: "",
  faqs: [
    { q: "Como funciona?", a: "Você envia a foto do seu pé no formulário acima e recebe propostas de compra de algum dos nossos 43.730 usuários compradores." },
    { q: "Como eu vou receber o pagamento?", a: "Dentro da plataforma você cadastra uma conta bancária e uma chave pix. Os pagamentos caem na conta dentro de 15 minutos após a venda." },
    { q: "Regras da plataforma. Leia com atenção!", a: "Os compradores querem exclusividade. Você vai receber uma vez por uma foto vendida." },
    { q: "Isso é real?", a: "Não. Este é um projeto acadêmico fictício. Nenhum sheik existe, nenhuma transação acontece. É 100% simulação." },
  ],
};

export async function fetchLandingConfig(): Promise<LandingConfig> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("landing_config")
      .select("data")
      .eq("id", "main")
      .single();

    if (error || !data) return DEFAULT_LANDING_CONFIG;

    // Merge: fallback nos campos faltantes
    return { ...DEFAULT_LANDING_CONFIG, ...(data.data as Partial<LandingConfig>) };
  } catch {
    return DEFAULT_LANDING_CONFIG;
  }
}

export async function saveLandingConfig(config: LandingConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("landing_config")
      .upsert({ id: "main", data: config, updated_at: new Date().toISOString() });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Erro desconhecido" };
  }
}
