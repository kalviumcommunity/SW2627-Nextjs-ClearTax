"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Search, User } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/jobs", label: "Jobs" },
];

export default function Navbar() {
  const { user, logout, initialize } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link href="/" className="brand-mark">
          <span className="brand-mark__badge">CT</span>
          <span>
            <strong>ClearTax</strong>
            <small>Invoice Processing</small>
          </span>
        </Link>

        <nav className="topbar__nav" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="topbar__nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="topbar__tools">
          <div className="topbar__search">
            <Search className="h-4 w-4" />
            <span>Search invoices</span>
          </div>
          <button type="button" className="topbar__icon-button" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>

          {mounted && user ? (
            <div className="nav-profile-container">
              <div className="nav-profile-info">
                <User className="h-4 w-4 text-accent" />
                <span className="nav-username">{user.name}</span>
              </div>
              <button 
                type="button" 
                onClick={logout} 
                className="nav-btn-logout"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link href="/login" className="nav-btn-login">
                Sign In
              </Link>
              <Link href="/login" className="nav-btn-signup">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

