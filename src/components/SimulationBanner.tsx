"use client";

import { useEffect, useState } from "react";
import { fetchLandingConfig, DEFAULT_LANDING_CONFIG } from "@/lib/landing-config";

export default function SimulationBanner() {
  const [text, setText] = useState(DEFAULT_LANDING_CONFIG.banner_top_text);
  const [enabled, setEnabled] = useState(DEFAULT_LANDING_CONFIG.banner_top_enabled);

  useEffect(() => {
    fetchLandingConfig().then((c) => {
      setText(c.banner_top_text);
      setEnabled(c.banner_top_enabled);
    });
  }, []);

  if (!enabled) return null;

  return (
    <div className="bg-amber-400 text-ink-950 text-center py-1.5 px-4 font-mono text-[10px] tracking-[0.2em] uppercase sticky top-0 z-50">
      {text}
    </div>
  );
}
