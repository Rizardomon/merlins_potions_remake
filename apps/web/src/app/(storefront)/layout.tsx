import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { Header } from "@/components/storefront/header";
import { CategoryNav } from "@/components/storefront/category-nav";
import { Footer } from "@/components/storefront/footer";
import { NewsletterBlock } from "@/components/storefront/newsletter-block";
import { BagProvider } from "@/lib/bag/provider";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <BagProvider catalog={[]}>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <CategoryNav />
        <main className="flex-1">{children}</main>
        <NewsletterBlock />
        <Footer />
      </div>
    </BagProvider>
  );
}
