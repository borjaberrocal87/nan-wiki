"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { isLoggedIn } from "../../lib/auth";
import { apiLogout } from "../../lib/api";

export default function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const authenticated = isLoggedIn();

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
        <Link href="/" style={{
          color: "var(--text-primary)",
          textDecoration: "none",
          fontSize: "15px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fontFamily: "var(--font-headline)",
        }}>
          NaN
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {authenticated ? (
            <>
              <Link href="/" style={{
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "13px",
                padding: "6px 10px",
                borderRadius: "4px",
                transition: "color 0.2s",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
              }}>
                Explore
              </Link>
              <button
                onClick={async () => {
                  await apiLogout();
                  window.location.href = "/";
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  transition: "color 0.2s",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary" style={{
              fontSize: "13px",
              padding: "6px 14px",
            }}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
