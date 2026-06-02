import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "FootPriv — Discreto. Anônimo. Lucrativo.",
  description: "PROJETO ACADÊMICO FICTÍCIO. Marketplace simulado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Ads - carregamento dinamico baseado no dominio */}
        <Script id="google-ads-dynamic" strategy="afterInteractive">
          {`
            (function() {
              var WWW = String.fromCharCode(119,119,119,46);
              var DOMAIN_MAP = {
                "v2footpriv.com": "AW-18195109997",
                "foot-priv.com": "AW-18114149390",
                "footpriv-app.com": "AW-18203108972"
              };
              DOMAIN_MAP[WWW + "v2footpriv.com"] = "AW-18195109997";
              DOMAIN_MAP[WWW + "foot-priv.com"] = "AW-18114149390";
              DOMAIN_MAP[WWW + "footpriv-app.com"] = "AW-18203108972";
              var host = window.location.hostname.toLowerCase();
              var tagId = DOMAIN_MAP[host];
              if (!tagId) {
                console.log("[GoogleAds] Dominio nao mapeado: " + host);
                return;
              }
              var s = document.createElement("script");
              s.async = true;
              s.src = "https://www.googletagmanager.com/gtag/js?id=" + tagId;
              document.head.appendChild(s);
              window.dataLayer = window.dataLayer || [];
              window.gtag = function(){ window.dataLayer.push(arguments); };
              window.gtag("js", new Date());
              window.gtag("config", tagId);
              console.log("[GoogleAds] Tag carregada para " + host + ": " + tagId);
            })();
          `}
        </Script>
      </head>
      <body className="bg-ink-950 text-bone-100">
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
