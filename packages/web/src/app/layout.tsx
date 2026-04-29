import type { Metadata } from "next";
import "../styles/globals.css";
import Header from "../components/layout/Header";
import { Suspense } from "react";
import LoginBodyWrapper from "../components/layout/LoginBodyWrapper";

export const metadata: Metadata = {
  title: "NaN Wiki",
  description: "NaN Wiki",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <LoginBodyWrapper>{children}</LoginBodyWrapper>
      </body>
    </html>
  );
}
