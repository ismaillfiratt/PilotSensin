import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TemaProvider from "@/components/providers/TemaProvider";
import ToastContainer from "@/components/ui/ToastContainer";
import SwProvider from "@/components/providers/SwProvider";
import OnayDialog from "@/components/onay/OnayDialog";
import GeriAlSnackbar from "@/components/snackbar/GeriAlSnackbar";
import CerezBanner from "@/components/cerez/CerezBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  themeColor: "#0e172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
