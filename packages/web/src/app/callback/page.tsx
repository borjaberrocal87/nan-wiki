"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      router.push("/login");
      return;
    }

    if (code) {
      window.location.href = `${API_URL}/api/auth/discord/callback?code=${code}&state=${searchParams.get("state")}`;
    } else {
      router.push("/login");
    }
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#666",
    }}>
      Logging in...
    </div>
  );
}
