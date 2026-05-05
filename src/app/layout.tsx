import type { Metadata } from "next";
import { Audiowide, Geist, Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "FindEvo",
  description:
    "AI-powered Reddit lead generation — analyze your site, surface high-intent threads, and track outreach.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${plusJakarta.variable} ${inter.variable} ${geistMono.variable} ${audiowide.variable}`}
    >
      <head>
        <script
          // Sync theme before first paint to prevent FOUC.
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
