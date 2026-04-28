import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:8000";

function getBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    return `${protocol}://${forwardedHost}`;
  }
  const host = request.headers.get("host");
  if (host) {
    const protocol = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
    return `${protocol}//${host}`;
  }
  return "/";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/login", getBaseUrl(request)));
  }

  try {
    const resp = await fetch(`${API_URL}/api/auth/discord/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    });

    if (!resp.ok) {
      return NextResponse.redirect(new URL("/login", getBaseUrl(request)));
    }

    const data = await resp.json();
    const token = data.token;

    if (token) {
      const baseUrl = getBaseUrl(request);
      const response = NextResponse.redirect(new URL("/", baseUrl));
      response.cookies.set("nan_wiki_session", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }
  } catch {
    return NextResponse.redirect(new URL("/login", getBaseUrl(request)));
  }

  return NextResponse.redirect(new URL("/login", getBaseUrl(request)));
}
