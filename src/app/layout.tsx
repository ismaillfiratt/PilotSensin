import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TemaProvider from "@/components/providers/TemaProvider";
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
  title: "Pilot Sensin – İşletme Yönetim Platformu",
  description: "KOBİ'ler için erken uyarı ve yönetim platformu",
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
      </body>
    </html>
  );
}
