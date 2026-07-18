"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, BookOpen, MessageCircleQuestion, Search, Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/read", label: "Read", icon: BookOpen },
  { href: "/graph", label: "Graph", icon: Waypoints },
  { href: "/timeline", label: "Timeline", icon: History },
  { href: "/assistant", label: "Assistant", icon: MessageCircleQuestion },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ground/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3" aria-label="Primary">
        <Link href="/" className="font-scripture text-xl font-semibold tracking-tight">
          Lumen<span className="text-gilt">.</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                pathname.startsWith(href.split("/").slice(0, 2).join("/"))
                  ? "bg-line/60 text-ink"
                  : "text-muted hover:bg-line/40 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
