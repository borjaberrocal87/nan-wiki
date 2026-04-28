"use client";

import { usePathname } from "next/navigation";

export default function LoginBodyWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <main
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "32px var(--spacing-gutter, 24px) 80px",
      }}
    >
      {children}
    </main>
  );
}
