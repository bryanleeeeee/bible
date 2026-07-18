import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/nav";
import { ServiceWorkerRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: { default: "Lumen — Explore the Bible as a living graph", template: "%s · Lumen" },
  description:
    "Search Scripture by word, question, or feeling. Trace people, places, themes, and original Hebrew and Greek through an interactive knowledge graph.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1420" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift"
          >
            Skip to content
          </a>
          <Nav />
          <main id="main">{children}</main>
          <ServiceWorkerRegister />
          <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted">
            <div className="gilt-rule mb-6" />
            Scripture text: King James Version and World English Bible (public domain). Licensed
            translations load through configured providers.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
