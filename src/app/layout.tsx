import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedditLeads",
  description:
    "AI-powered Reddit lead generation — analyze your site, surface high-intent threads, and track outreach.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
