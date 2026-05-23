import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { OrderDrawer } from "@/components/OrderDrawer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kalaasutra by Shubham Art | Customized Names & Corporate Gifts",
  description: "Order personalized LED nameplates, engraved keychains, custom desk organizers, diaries, and premium business signage online. High-quality craftsmanship from Pune. All India Delivery.",
  keywords: [
    "customized keychains India",
    "personalized LED nameplate",
    "acrylic name plate Pune",
    "custom wooden name stand",
    "personalized birthday gifts Pune",
    "Devanagari calligraphic keychain",
    "handmade sketch portrait online",
    "Kalaasutra",
    "Shubham Art"
  ],
  authors: [{ name: "Shubham Sutar" }],
  openGraph: {
    title: "Kalaasutra by Shubham Art | Customized Names & Corporate Gifts",
    description: "Personalized premium gifts and custom decor. Crafted with precision and passion.",
    type: "website",
    locale: "en_IN",
  }
};

import { headers } from "next/headers";
import { SiteSettingsService } from "@/lib/services/site-settings.service";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  // Fetch settings dynamically
  let isMaintenance = false;
  let maintenanceMessage = "";
  let whatsappPhone = "918421949875";

  try {
    const settings = await SiteSettingsService.getSettings(['site_status', 'whatsapp_number']);
    
    // Normalize site_status
    const statusVal = settings.site_status;
    if (typeof statusVal === 'string') {
      isMaintenance = statusVal === 'maintenance';
      maintenanceMessage = isMaintenance ? "We are preparing something special! We will be back online in a few hours." : "";
    } else if (statusVal && typeof statusVal === 'object') {
      isMaintenance = statusVal.status === 'maintenance';
      maintenanceMessage = statusVal.message || "We are preparing something special! We will be back online in a few hours.";
    }

    // Normalize whatsapp_number
    const phoneVal = settings.whatsapp_number;
    if (typeof phoneVal === 'string') {
      whatsappPhone = phoneVal;
    } else if (phoneVal && typeof phoneVal === 'object') {
      whatsappPhone = phoneVal.phone || "918421949875";
    }
  } catch (error) {
    console.error("Failed to load settings in RootLayout:", error);
  }

  const showStorefront = !isAdmin && !isMaintenance;

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfair.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-bg-light dark:bg-bg-dark text-zinc-900 dark:text-zinc-100 transition-colors duration-200 overflow-x-hidden">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('app-theme');
                  if (savedTheme && savedTheme !== 'theme-default') {
                    document.documentElement.classList.add(savedTheme.replace('theme-', 'theme-'));
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {showStorefront && <NavBar />}
        {showStorefront && <OrderDrawer whatsappPhone={whatsappPhone} />}
        <main className="flex-grow flex flex-col">
          {!isAdmin && isMaintenance ? (
            <MaintenanceScreen message={maintenanceMessage} whatsappNumber={whatsappPhone} />
          ) : (
            children
          )}
        </main>
        {showStorefront && <Footer whatsappPhone={whatsappPhone} />}
      </body>
    </html>
  );
}

