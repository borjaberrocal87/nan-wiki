import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Link Library",
  description: "Discover links shared by your community",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
