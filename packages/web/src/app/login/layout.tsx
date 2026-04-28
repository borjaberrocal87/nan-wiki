import type { Metadata } from "next";
import "../../styles/login.css";

export const metadata: Metadata = {
  title: "WikiEngine | Login",
  description: "Discover links shared by your community",
  robots: "noindex, nofollow",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
