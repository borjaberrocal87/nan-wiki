import { redirect } from "next/navigation";
import { getServerIsLoggedIn } from "../lib/auth";
import LinkGrid from "../components/links/LinkGrid";

export default async function Home() {
  const authenticated = await getServerIsLoggedIn();
  if (!authenticated) {
    redirect("/login");
  }

  return <LinkGrid />;
}
