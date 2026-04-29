"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { apiLogout, fetchAuthMe, type AuthUser } from "../../lib/api";

export default function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchAuthMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (isLoginPage) return null;

  return (
    <header style={{
      borderBottom: "1px solid var(--border-color)",
      backgroundColor: "var(--bg-surface-container-lowest)",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 var(--spacing-gutter, 24px)",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" className="header-logo font-mono">
          Nan <span className="text-[10px] uppercase tracking-widest text-violet-400">wiki</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {!checking && user ? (
            <>
              <span className="header-welcome font-mono">
                Welcome, {user.username}
              </span>
              <button
                onClick={async () => {
                  await apiLogout();
                  document.cookie = 'nan_wiki_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                  window.location.href = '/';
                }}
                className="header-logout font-mono"
              >
                <span className="material-symbols-outlined text-sm mr-1">logout</span>
                Logout
              </button>
            </>
          ) : !checking ? (
            <Link href="/login" className="btn-primary font-sans" style={{
              fontSize: "13px",
              padding: "6px 14px",
            }}>
              Login
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
