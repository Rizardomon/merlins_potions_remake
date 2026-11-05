import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { ThemeScript } from "@/components/theme/theme-provider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "App Template",
  description: "Template NestJS + Next.js",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `suppressHydrationWarning`: o ThemeScript escreve `data-theme` no <html> antes da
    // hidratação, então o atributo diverge do que o servidor renderizou — de propósito.
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${manrope.variable} ${jetbrainsMono.variable} font-sans`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
