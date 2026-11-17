import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script        from "next/script";
import TemaProvider       from "@/components/providers/TemaProvider";
import UyariMotorProvider  from "@/components/providers/UyariMotorProvider";
import OtoKontrolProvider  from "@/components/providers/OtoKontrolProvider";
import ToastContainer from "@/components/ui/ToastContainer";
import SwProvider    from "@/components/providers/SwProvider";
import OnayDialog    from "@/components/onay/OnayDialog";
import GeriAlSnackbar from "@/components/snackbar/GeriAlSnackbar";
import CerezBanner   from "@/components/cerez/CerezBanner";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PilotSensin – İşletme Yönetim Platformu",
  description: "KOBİ'ler için erken uyarı ve yönetim platformu",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PilotSensin",
  },
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0F3D2E",
};

// FOUC önleme: localStorage'dan temayı okuyup <html data-theme="..."> set eder
const FOUC_SCRIPT = `(function(){try{document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${jetbrains.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
        />
      </head>
      <body className="h-full">
        {/* FOUC önleme — React 19 uyumlu, beforeInteractive */}
        <Script
          id="tema-fouc"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }}
        />
        <TemaProvider>
          <OtoKontrolProvider>
            <UyariMotorProvider>
              {children}
            </UyariMotorProvider>
          </OtoKontrolProvider>
        </TemaProvider>
        <ToastContainer />
        <OnayDialog />
        <GeriAlSnackbar />
        <CerezBanner />
        <SwProvider />
      </body>
    </html>
  );
}
