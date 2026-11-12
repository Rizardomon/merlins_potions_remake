import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { Header } from "@/components/storefront/header";
import { CategoryNav } from "@/components/storefront/category-nav";
import { Footer } from "@/components/storefront/footer";
import { NewsletterBlock } from "@/components/storefront/newsletter-block";
import { BagDrawer } from "@/components/storefront/bag-drawer";
import { AddToBagToast } from "@/components/storefront/add-to-bag-toast";
import { AccountOverlay } from "@/components/account/account-overlay";
import { BagProvider } from "@/lib/bag/provider";
import { AccountOverlayProvider } from "@/lib/account/provider";
import { listPotions } from "@/lib/api/product-repository";
import { fetchFromApi } from "@/lib/bff";
import { getSessionToken } from "@/lib/bff";
import type { SessionResponse } from "@merlins-potions-remake/shared";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const catalog = await listPotions();
  const sessionToken = await getSessionToken();
  const initialSession = sessionToken
    ? await fetchFromApi<SessionResponse>("/auth/session", sessionToken)
    : null;

  return (
    <AccountOverlayProvider initialSession={initialSession ?? { customer: null }}>
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
        <AccountOverlay>
          {/* Form content will be placed here by child routes */}
        </AccountOverlay>
      </BagProvider>
    </AccountOverlayProvider>
  );
}
