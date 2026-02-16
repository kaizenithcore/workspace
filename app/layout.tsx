import type React from "react";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Kaizenith Workspace",
  description:
    "Unified productivity workspace — calendar, tasks, pomodoro, and time tracking.",
  generator: "v0.app",
  icons: {
    icon: [{ url: "/icon.png", type: "image/x-icon" }],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f6" },
    { media: "(prefers-color-scheme: dark)", color: "#111216" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-0F4X0GRCNX"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-0F4X0GRCNX');
            `,
          }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${geistMono.variable} font-sans antialiased density-comfortable`}
      >
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
