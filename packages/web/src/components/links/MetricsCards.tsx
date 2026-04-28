"use client";

interface MetricsCardsProps {
  totalEntries: number;
  userLinkCount: number;
}

export default function MetricsCards({ totalEntries, userLinkCount }: MetricsCardsProps) {
  const contributionPercent = totalEntries > 0 ? Math.round((userLinkCount / totalEntries) * 100) : 0;

  const cards = [
    {
      title: "Node Health",
      value: "99.98%",
      change: "+0.02%",
      changeColor: "text-emerald-500",
      icon: "monitoring",
      progress: 99.9,
      progressColor: "bg-violet-600",
      info: "DATABASE_INDEX_A-F [STABLE]",
    },
    {
      title: "Total Entries",
      value: totalEntries.toLocaleString(),
      change: `LATEST: 12 SEC AGO`,
      changeColor: "text-slate-500",
      icon: "database",
      info: "NODE_STATUS: ONLINE",
    },
    {
      title: "Active Auth",
      value: null,
      avatars: [
        { label: "A", color: "bg-slate-800" },
        { label: "B", color: "bg-slate-800" },
        { label: "+12", color: null },
      ],
      change: "Session Active",
      changeColor: "text-emerald-500",
      icon: "security",
      info: "IP_ADDR: 192.168.0.124 [MASKED]",
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="p-6 border border-slate-800 bg-surface-container-lowest relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-violet-500 text-[18px]">{card.icon}</span>
          </div>

          <div className="text-[10px] text-violet-500 uppercase tracking-[0.2em] font-black mb-4">
            {card.title}
          </div>

          {card.value !== null && (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-space-grotesk text-slate-50">
                {card.value}
              </span>
              {card.change && (
                <span className={`text-[10px] ${card.changeColor} font-bold`}>
                  {card.change}
                </span>
              )}
            </div>
          )}

          {"avatars" in card && card.avatars && (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                {card.avatars.map((avatar, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400 ${avatar.color || "bg-slate-800"}`}
                  >
                    {avatar.label}
                  </div>
                ))}
              </div>
              <span className={`text-[10px] ${card.changeColor} font-black uppercase`}>
                {card.change}
              </span>
            </div>
          )}

          {"progress" in card && card.progress !== undefined && (
            <div className="w-full bg-slate-900 h-1 mt-4 relative">
              <div
                className={`absolute inset-0 ${card.progressColor}`}
                style={{ width: `${card.progress}%` }}
              />
            </div>
          )}

          {"info" in card && card.info && (
            <div className="text-[10px] text-slate-500 mt-4 font-mono">
              {card.info}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
