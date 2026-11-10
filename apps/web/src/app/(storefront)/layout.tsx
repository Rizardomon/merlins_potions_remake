import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { Header } from "@/components/storefront/header";
import { CategoryNav } from "@/components/storefront/category-nav";
import { Footer } from "@/components/storefront/footer";
import { NewsletterBlock } from "@/components/storefront/newsletter-block";
import { BagDrawer } from "@/components/storefront/bag-drawer";
import { AddToBagToast } from "@/components/storefront/add-to-bag-toast";
import { BagProvider } from "@/lib/bag/provider";
import { listPotions } from "@/lib/api/product-repository";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const catalog = await listPotions();

  return (
    <BagProvider catalog={catalog}>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <CategoryNav />
        <main className="flex-1">{children}</main>
        <NewsletterBlock />
        <Footer />
      </div>
      <BagDrawer />
      <AddToBagToast />
    </BagProvider>
  );
}
