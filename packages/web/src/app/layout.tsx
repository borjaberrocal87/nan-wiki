import type { Metadata } from "next";
import "../styles/globals.css";
import Header from "../components/layout/Header";
import { Suspense } from "react";
import LoginBodyWrapper from "../components/layout/LoginBodyWrapper";

export const metadata: Metadata = {
  title: "NaN Wiki",
  description: "NaN Wiki",
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
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <LoginBodyWrapper>{children}</LoginBodyWrapper>
      </body>
    </html>
  );
}
