import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UdaLink — Satu link untuk semua produk affiliate",
  description: "Aplikasi link di bio khusus affiliator Indonesia. Mudah dicari dengan nomor produk, multi-marketplace, dan statistik klik.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://udalink.vercel.app"),
  openGraph: {
    title: "UdaLink — Satu link untuk semua produk affiliate",
    description: "Buat etalase link afiliasi kamu sekarang. Penonton cari nomor produk dari video, langsung klik dan beli.",
    type: "website",
    locale: "id_ID",
    siteName: "UdaLink",
  },
  twitter: {
    card: "summary_large_image",
    title: "UdaLink — Satu link untuk semua produk affiliate",
    description: "Buat etalase link afiliasi kamu sekarang. Penonton cari nomor produk dari video, langsung klik dan beli.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
