"use client";

import Link from "next/link";
import { isLoggedIn } from "../../lib/auth";
import { apiLogout } from "../../lib/api";

export default function Header() {
  const authenticated = isLoggedIn();

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      backgroundColor: "#0a0a0a",
      borderBottom: "1px solid #1e1e1e",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <Link href="/" style={{
        color: "#e5e5e5",
        textDecoration: "none",
        fontSize: "18px",
        fontWeight: 600,
        letterSpacing: "-0.02em",
      }}>
        Link Library
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {authenticated ? (
          <>
            <Link href="/" style={{
              color: "#999",
              textDecoration: "none",
              fontSize: "14px",
              padding: "6px 12px",
              borderRadius: "4px",
              transition: "color 0.2s",
            }}>
              Explore
            </Link>
            <button
              onClick={async () => {
                await apiLogout();
                window.location.href = '/';
              }}
              style={{
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: "14px",
                padding: "6px 12px",
                borderRadius: "4px",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" style={{
            backgroundColor: "#e5e5e5",
            color: "#0a0a0a",
            padding: "8px 16px",
            borderRadius: "6px",
            fontWeight: 500,
            fontSize: "14px",
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
