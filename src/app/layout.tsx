import type { Metadata } from "next";
import "./globals.css";
import SimulationBanner from "@/components/SimulationBanner";

export const metadata: Metadata = {
  title: "FootFans — Discreto. Anônimo. Lucrativo.",
  description: "PROJETO ACADÊMICO FICTÍCIO. Marketplace simulado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-ink-950 text-bone-100">
        <SimulationBanner />
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
