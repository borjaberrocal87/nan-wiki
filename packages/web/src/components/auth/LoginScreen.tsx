interface LoginScreenProps {
  onLogin?: () => void;
  discordAuthUrl: string;
}

export default function LoginScreen({ onLogin, discordAuthUrl }: LoginScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight text-white">
            NaN
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-violet-400">
            wiki
          </p>
        </div>

        <a
          href={discordAuthUrl}
          className="inline-flex items-center gap-3 rounded-lg bg-violet-600 px-8 py-3 font-mono text-sm text-white no-underline transition-all duration-300 hover:bg-violet-500 hover:shadow-[0_0_24px_rgba(139,92,246,0.4)]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.791 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Login with Discord
        </a>

        <p className="text-xs text-neutral-500">
          NaN community members only
        </p>
      </div>
    </div>
  );
}
