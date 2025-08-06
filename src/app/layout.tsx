import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/SessionProvider";
import ModernNavigation from "@/components/ModernNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuckFoozle",
  description: "The slargiest streamer on Twitch",
  openGraph: {
    title: "BuckFoozle",
    description: "The slargiest streamer on Twitch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuckFoozle",
    description: "The slargiest streamer on Twitch",
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
        <AuthSessionProvider>
          <ModernNavigation />
          <main>
            {children}
          </main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
