"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/campus", label: "Campus" },
  { href: "/exploremode", label: "Explore" },
  { href: "/gamemode", label: "Game" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/admin") return pathname.startsWith("/admin");
    return pathname === href;
  };

  return (
    <header className="neo-header" role="banner">
      <div className="neo-header-inner">
        <div className="neo-history">
          <button
            className="neo-nav-btn"
            onClick={() => router.back()}
            aria-label="Go back"
            type="button"
          >
            &lt;
          </button>
          <button
            className="neo-nav-btn"
            onClick={() => router.forward()}
            aria-label="Go forward"
            type="button"
          >
            &gt;
          </button>
        </div>

        <Link href="/" className="neo-logo">
          <span className="neo-logo-dot" aria-hidden="true" />
          <span className="neo-logo-text">Campus Guide 3D</span>
        </Link>

        <nav className="neo-nav" aria-label="Primary">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`neo-nav-link${isActive(href) ? " active" : ""}`}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="neo-actions">
          <Link href="/campus" className="neo-nav-btn neo-search" aria-label="Search">
            Search
          </Link>
          <Link href="/campus" className="neo-cta">
            Enter Campus
          </Link>
        </div>

        <button
          className="neo-mobile-toggle"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
          type="button"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      <div className={`neo-mobile-menu${mobileOpen ? " open" : ""}`}>
        <nav aria-label="Mobile">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`neo-nav-link${isActive(href) ? " active" : ""}`}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <Link href="/campus" className="neo-cta" onClick={() => setMobileOpen(false)}>
            Enter Campus
          </Link>
        </nav>
      </div>
    </header>
  );
}
