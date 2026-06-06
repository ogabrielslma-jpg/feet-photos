"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

if (typeof window !== "undefined") {
  posthog.init("phc_nVA4PKL5i7YZvF4HKXSELuD3dZFPAvZtpzXZ4hYvARYp", {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    // Session Replay configurado pra capturar sessoes com problemas
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
      },
    },
    // Desabilita no localhost pra nao poluir analytics
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.opt_out_capturing();
    },
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
