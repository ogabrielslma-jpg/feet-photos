import type { Metadata } from "next";
import "./globals.css";

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
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
