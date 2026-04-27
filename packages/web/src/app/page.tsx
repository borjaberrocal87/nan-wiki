import { redirect } from "next/navigation";
import { getServerIsLoggedIn } from "../lib/auth";
import Header from "../components/layout/Header";
import LinkGrid from "../components/links/LinkGrid";

export default async function Home() {
  const authenticated = await getServerIsLoggedIn();
  if (!authenticated) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <LinkGrid />
      </main>
    </div>
  );
}
