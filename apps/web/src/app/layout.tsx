import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
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
  title: "Merlin's Potions",
  description: "The finest magical potions, brewed to perfection.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrainsMono.variable} font-sans`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
