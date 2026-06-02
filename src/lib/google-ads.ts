// Configuracao Google Ads por dominio
// Cada dominio tem sua propria conta + tag global + ID de conversao

export type GoogleAdsConfig = {
  tagId: string;          // ex: AW-18195109997
  conversionId: string;   // ex: AW-18195109997/qR5MCOzbzrccEO2wjeRD
};

const DOMAIN_MAP: Record<string, GoogleAdsConfig> = {
  "v2footpriv.com": {
    tagId: "AW-18195109997",
    conversionId: "AW-18195109997/qR5MCOzbzrccEO2wjeRD",
  },
  "www.v2footpriv.com": {
    tagId: "AW-18195109997",
    conversionId: "AW-18195109997/qR5MCOzbzrccEO2wjeRD",
  },
  "foot-priv.com": {
    tagId: "AW-18114149390",
    conversionId: "AW-18114149390/N1pzCL_wzrccEI74v71D",
  },
  "www.foot-priv.com": {
    tagId: "AW-18114149390",
    conversionId: "AW-18114149390/N1pzCL_wzrccEI74v71D",
  },
  "footpriv-app.com": {
    tagId: "AW-18203108972",
    conversionId: "AW-18203108972/NwJsCNvp5bccEOzM9edD",
  },
  "www.footpriv-app.com": {
    tagId: "AW-18203108972",
    conversionId: "AW-18203108972/NwJsCNvp5bccEOzM9edD",
  },
  "footprivapp.com": {
    tagId: "AW-18207184697",
    conversionId: "AW-18207184697/2G-ACIH9_LccELmu7ulD",
  },
  "www.footprivapp.com": {
    tagId: "AW-18207184697",
    conversionId: "AW-18207184697/2G-ACIH9_LccELmu7ulD",
  },
};

/**
 * Retorna a config do Google Ads para o dominio atual.
 * Retorna null se o dominio nao estiver mapeado (ex: preview da Vercel).
 */
export function getGoogleAdsConfig(): GoogleAdsConfig | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  return DOMAIN_MAP[host] || null;
}
