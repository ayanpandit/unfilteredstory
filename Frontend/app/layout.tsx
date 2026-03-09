import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const feedBase = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"}`;

export const metadata: Metadata = {
  title: "UnfilterStory | Raw Startup Intelligence",
  description:
    "No fluff. No bias. Just raw insights into India's most ambitious startups, their funding, and the stories that matter.",
  alternates: {
    types: {
      "application/rss+xml": `${feedBase}/rss`,
      "application/atom+xml": `${feedBase}/rss/atom`,
      "application/feed+json": `${feedBase}/rss/json`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
