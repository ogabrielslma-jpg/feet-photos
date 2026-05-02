// Config da landing — editável via /admin
// Campos visuais separados pra Desktop e Mobile

import { createClient } from "./supabase-client";

// Configurações que mudam entre desktop e mobile
export type ViewportConfig = {
  logo_size: number;          // 40-250
  logo_align: "left" | "center" | "right";
  background_position_x: number; // 0-100
  background_position_y: number; // 0-100
  background_size: number;       // 50-250
  background_overlay_opacity: number; // 0-100
  background_fit: "cover" | "contain" | "auto";
};

// Config completa
export type LandingConfig = {
  // Logo
  logo_mode: "text" | "image";
  logo_primary: string;
  logo_secondary: string;
  logo_image_url: string;

  // Textos
  tagline: string;
  headline: string;
  cta_text: string;

  // Banner topo (livre)
  banner_enabled: boolean;
  banner_mode: "text" | "image";
  banner_text: string;
  banner_image_url: string;
  banner_bg_color: string;
  banner_text_color: string;
  banner_link_url: string; // opcional, banner clicável

  // Cores gerais
  color_primary: string;
  color_accent: string;
  color_bg_from: string;
  color_bg_via: string;
  color_bg_to: string;

  // Imagem de fundo
  background_image_url: string;

  // Configs específicas por viewport
  desktop: ViewportConfig;
  mobile: ViewportConfig;

  faqs: { q: string; a: string }[];
};

const DEFAULT_VIEWPORT: ViewportConfig = {
  logo_size: 100,
  logo_align: "center",
  background_position_x: 50,
  background_position_y: 50,
  background_size: 100,
  background_overlay_opacity: 40,
  background_fit: "cover",
};

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  logo_mode: "text",
  logo_primary: "FOOT",
  logo_secondary: "FANS",
  logo_image_url: "",

  tagline: "Discreto · Anônimo · Lucrativo",
  headline: "Mais de 43.730 compradores ativos aguardando sua foto agora",
  cta_text: "Enviar aos compradores",

  banner_enabled: false,
  banner_mode: "text",
  banner_text: "",
  banner_image_url: "",
  banner_bg_color: "#fbbf24",
  banner_text_color: "#0a0a0a",
  banner_link_url: "",

  color_primary: "#22c55e",
  color_accent: "#a3e635",
  color_bg_from: "#1a1a2e",
  color_bg_via: "#0a0a0a",
  color_bg_to: "#000000",

  background_image_url: "",

  desktop: { ...DEFAULT_VIEWPORT },
  mobile: { ...DEFAULT_VIEWPORT },

  faqs: [
    { q: "Como funciona?", a: "Você envia a foto do seu pé no formulário acima e recebe propostas de compra de algum dos nossos 43.730 usuários compradores." },
    { q: "Como eu vou receber o pagamento?", a: "Dentro da plataforma você cadastra uma conta bancária e uma chave pix. Os pagamentos caem na conta dentro de 15 minutos após a venda." },
    { q: "Regras da plataforma. Leia com atenção!", a: "Os compradores querem exclusividade. Você vai receber uma vez por uma foto vendida." },
    { q: "Isso é real?", a: "Não. Este é um projeto acadêmico fictício. Nenhum sheik existe, nenhuma transação acontece. É 100% simulação." },
  ],
};

// Migra config antiga (sem desktop/mobile) pra nova estrutura
function migrateConfig(raw: any): LandingConfig {
  const merged: any = { ...DEFAULT_LANDING_CONFIG, ...raw };

  // Se viertor de versão antiga, copia campos legados
  if (!raw?.desktop || typeof raw.desktop !== "object") {
    merged.desktop = {
      logo_size: raw?.logo_size ?? DEFAULT_VIEWPORT.logo_size,
      logo_align: raw?.logo_align ?? DEFAULT_VIEWPORT.logo_align,
      background_position_x: raw?.background_position_x ?? DEFAULT_VIEWPORT.background_position_x,
      background_position_y: raw?.background_position_y ?? DEFAULT_VIEWPORT.background_position_y,
      background_size: raw?.background_size ?? DEFAULT_VIEWPORT.background_size,
      background_overlay_opacity: raw?.background_overlay_opacity ?? DEFAULT_VIEWPORT.background_overlay_opacity,
      background_fit: raw?.background_fit ?? DEFAULT_VIEWPORT.background_fit,
    };
  }
  if (!raw?.mobile || typeof raw.mobile !== "object") {
    merged.mobile = { ...merged.desktop };
  }

  // Migra banner_top → banner se existir
  if (raw?.banner_top_text && !merged.banner_text) {
    merged.banner_enabled = !!raw.banner_top_enabled;
    merged.banner_mode = "text";
    merged.banner_text = raw.banner_top_text;
  }

  return merged as LandingConfig;
}

export async function fetchLandingConfig(): Promise<LandingConfig> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("landing_config")
      .select("data")
      .eq("id", "main")
      .single();

    if (error || !data) return DEFAULT_LANDING_CONFIG;
    return migrateConfig(data.data);
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
