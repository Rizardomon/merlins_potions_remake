import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Merlin's Potions",
  description: "The finest magical potions, brewed to perfection.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} font-sans`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
