import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Link Library",
  description: "Discover links shared by your community",
};

import Header from "../components/layout/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
