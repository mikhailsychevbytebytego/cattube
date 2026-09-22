import type { Metadata, Viewport } from "next";
import { Caveat, Roboto } from "next/font/google";
import Script from "next/script";

import { ThemeProvider } from "@/components/cattube/theme-provider";
import { env } from "@/lib/env";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "CatTube ~ Meow More Today",
    template: "%s | CatTube",
  },
  description: "Good cats. Better days. Watch kittens, compilations, and cozy feline vlogs on CatTube.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${roboto.variable} ${caveat.variable} min-h-dvh w-full antialiased`}
    >
      <body className="min-h-dvh w-full bg-ct-bg font-sans text-ct-text">
        <Script id="cattube-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
