import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import TemaProvider from "@/components/providers/TemaProvider";
import ToastContainer from "@/components/ui/ToastContainer";
import SwProvider from "@/components/providers/SwProvider";
import OnayDialog from "@/components/onay/OnayDialog";
import GeriAlSnackbar from "@/components/snackbar/GeriAlSnackbar";
import CerezBanner from "@/components/cerez/CerezBanner";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${jetbrains.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
        />
      </head>
      <body className="h-full">
        <TemaProvider>{children}</TemaProvider>
        <ToastContainer />
        <OnayDialog />
        <GeriAlSnackbar />
        <CerezBanner />
        <SwProvider />
      </body>
    </html>
  );
}
