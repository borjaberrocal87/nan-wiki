"use client";

import type { TopAuthor } from "../../lib/api";

interface MetricsCardsProps {
  totalLinks: number;
  linksToday: number;
  totalAuthors: number;
  userLinkCount: number;
  contributionPercent: number;
  topAuthors: TopAuthor[];
}

export default function MetricsCards({
  totalLinks,
  linksToday,
  totalAuthors,
  userLinkCount,
  contributionPercent,
  topAuthors,
}: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Entries",
      value: totalLinks.toLocaleString(),
      change: `${linksToday} TODAY`,
      changeColor: "text-slate-500",
      icon: "database",
      info: `NODES: ${totalAuthors} AUTHORS`,
    },
    {
      title: "Top Contributors",
      value: null,
      avatars: topAuthors.map((a, i) => ({
        label: a.username[0].toUpperCase(),
        color: i === 0 ? "bg-violet-600 text-white" : "bg-slate-800",
        username: a.username,
        count: a.linkCount,
      })),
      change: "MOST ACTIVE",
      changeColor: "text-violet-400",
      icon: "emoji_events",
    },
    {
      title: "Your Contributions",
      value: `${contributionPercent}%`,
      change: `${userLinkCount} of ${totalLinks.toLocaleString()}`,
      changeColor: "text-emerald-500",
      icon: "person_add",
      progress: contributionPercent,
      progressColor: "bg-emerald-500",
      info: `OF ${totalAuthors} AUTHORS`,
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
                    className={`w-8 h-8 rounded-full border border-slate-900 flex items-center justify-center text-[10px] font-bold ${avatar.color}`}
                    title={avatar.username}
                  >
                    {avatar.label}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] ${card.changeColor} font-black uppercase`}>
                  {card.change}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {card.avatars.map((a) => a.username).join(", ")}
                </span>
              </div>
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
