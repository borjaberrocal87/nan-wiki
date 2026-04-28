# 🎯 Use environment variables for OAuth redirect URLs instead of hardcoding

## 💡 Convention

All OAuth and auth redirect URLs in the Next.js frontend must be constructed from `API_URL` (or `NEXT_PUBLIC_API_URL`) defined in the `.env` file, never hardcoded. This includes:

- Discord OAuth authorization links (login buttons)
- OAuth callback URLs
- Any URL that points to the API auth endpoints

The `API_URL` is defined in `packages/web/src/lib/api.ts` via `process.env.NEXT_PUBLIC_API_URL` and defaults to `http://localhost:8000`.

For server-side redirects in route handlers, always use the request's `host` header (or `x-forwarded-host` behind a reverse proxy) instead of `request.url`, which resolves to the Docker container's internal IP.

```
✅ Use: `${API_URL}/api/auth/discord`
✅ Use: `getBaseUrl(request)` that reads `x-forwarded-host` or `host` header
❌ Hardcode: `https://cloud-api.nan.builders/api/auth/discord`
❌ Use `request.url` for redirects in Docker — resolves to container IP
```

## 🏆 Benefits

- **Environment parity**: Same code works locally, in Docker, and on production without URL changes.
- **No dead links after deploy**: Hardcoded `localhost` URLs break when the app is served from a different host.
- **Container-safe redirects**: Using `request.url` in Docker returns the internal container IP, causing redirects to broken URLs like `http://0afb7c3844ea:3000/`.
- **Single source of truth**: One env variable controls all API endpoints, reducing URL drift.

## 👀 Examples

### ✅ Good: Dynamic URL from env + request host header

```ts
// packages/web/src/lib/api.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// packages/web/src/components/auth/LoginScreen.tsx
interface LoginScreenProps {
  discordAuthUrl: string;
}

export default function LoginScreen({ discordAuthUrl }: LoginScreenProps) {
  return (
    <a href={discordAuthUrl} className="bg-violet-600 ...">
      Login with Discord
    </a>
  );
}

// packages/web/src/app/login/page.tsx
import { API_URL } from "../../lib/api";
// ...
return <LoginScreen discordAuthUrl={`${API_URL}/api/auth/discord`} />;
```

```ts
// packages/web/src/app/auth/discord/callback/route.ts
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
  // ...
  const baseUrl = getBaseUrl(request);
  const response = NextResponse.redirect(new URL("/", baseUrl));
  // ...
}
```

### ❌ Bad: Hardcoded URL

```ts
// packages/web/src/components/auth/LoginScreen.tsx
export default function LoginScreen() {
  return (
    <a
      href="https://cloud-api.nan.builders/api/auth/discord"
      className="bg-violet-600 ..."
    >
      Login with Discord
    </a>
  );
}
```

### ❌ Bad: Using request.url for redirects in Docker

```ts
// packages/web/src/app/auth/discord/callback/route.ts
export async function GET(request: NextRequest) {
  // ...
  // In Docker, request.url = "http://0afb7c3844ea:3000/..."
  // Redirect goes to internal container IP, not the user's browser
  const response = NextResponse.redirect(new URL("/", request.url));
  return response;
}
```

## 🧐 Real world examples

- [`packages/web/src/lib/api.ts`](../../packages/web/src/lib/api.ts) — `API_URL` from `NEXT_PUBLIC_API_URL`
- [`packages/web/src/components/auth/LoginScreen.tsx`](../../packages/web/src/components/auth/LoginScreen.tsx) — receives `discordAuthUrl` as prop
- [`packages/web/src/app/login/page.tsx`](../../packages/web/src/app/login/page.tsx) — constructs URL from `API_URL`
- [`packages/web/src/app/auth/discord/callback/route.ts`](../../packages/web/src/app/auth/discord/callback/route.ts) — `getBaseUrl()` using `host` header

## 🔗 Related agreements

- [`AGENTS.md`](../../AGENTS.md) — Environment variables configuration
- [`docs/backend/docker-multi-stage-builds.md`](backend/docker-multi-stage-builds.md) — Docker networking and container IPs

Doc created by 🐢 💨 (Turbotuga™, [Codely](https://codely.com)’s mascot)
