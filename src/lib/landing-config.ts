// Config da landing — editável via /admin
// Lê do Supabase com fallback pra defaults

import { createClient } from "./supabase-client";

export type LandingConfig = {
  // Logo
  logo_primary: string;
  logo_secondary: string;
  logo_mode: "text" | "image"; // texto vs imagem
  logo_image_url: string;
  logo_size: number; // 40-200 (px da altura da imagem ou tamanho do texto)
  logo_align: "left" | "center" | "right";

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

  // Imagem de fundo
  background_image_url: string;
  background_position_x: number; // 0-100
  background_position_y: number; // 0-100
  background_size: number; // 50-200 (% do zoom)
  background_overlay_opacity: number; // 0-100 — escurece sobre a imagem
  background_fit: "cover" | "contain" | "auto";

  faqs: { q: string; a: string }[];
};

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  logo_primary: "FOOT",
  logo_secondary: "FANS",
  logo_mode: "text",
  logo_image_url: "",
  logo_size: 100,
  logo_align: "center",
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
  background_position_x: 50,
  background_position_y: 50,
  background_size: 100,
  background_overlay_opacity: 40,
  background_fit: "cover",
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
