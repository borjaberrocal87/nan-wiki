import { redirect } from "next/navigation";
import { getServerIsLoggedIn } from "../../lib/auth";
import LoginScreen from "../../components/auth/LoginScreen";
import { API_URL } from "../../lib/api";

async function handleLogin() {
  "use server";
  const authenticated = await getServerIsLoggedIn();
  if (authenticated) {
    redirect("/");
  }
  redirect(`${API_URL}/api/auth/discord`);
}

export default async function Login() {
  const authenticated = await getServerIsLoggedIn();
  if (authenticated) {
    redirect("/");
  }

  return <LoginScreen onLogin={handleLogin} discordAuthUrl={`${API_URL}/api/auth/discord`} />;
}
