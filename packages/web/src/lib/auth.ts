export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

export function logout(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/';
  }
}

export async function getServerToken(): Promise<string | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  return token ? token.value : null;
}

export async function getServerIsLoggedIn(): Promise<boolean> {
  return (await getServerToken()) !== null;
}
