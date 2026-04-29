"use client";

import { useState } from "react";
import type { LinkItem } from "../../lib/api";
import { SOURCE_CONFIG, type SourceType } from "../../lib/sources";

interface LinkTableProps {
  links: LinkItem[];
}

function generateId(linkId: string): string {
  const hash = linkId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  const num = Math.abs(hash) % 9000 + 1000;
  return `#WK-${num}`;
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return url;
  }
}

export default function LinkTable({ links }: LinkTableProps) {
  const [tooltip, setTooltip] = useState<{ message: string; x: number; y: number } | null>(null);

  return (
    <div className="bg-surface-container-lowest border border-slate-800/50 rounded-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-surface-container-low">
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">
                ID
              </th>
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">
                Message
              </th>
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">
                Domain
              </th>
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">
                Source
              </th>
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">
                Author
              </th>
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">
                Channel
              </th>
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest whitespace-nowrap">
                Posted At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {links.map((link, index) => {
              const sourceKey = (link.source_id || "other").toLowerCase() as SourceType;
              const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.other;
              const domain = extractDomain(link.url);
              const authorName = link.author_username || (link.author_id ? `User ${link.author_id}` : null);
              const authorInitial = authorName ? authorName.charAt(0).toUpperCase() : "?";
              const message = link.description || "\u2014";
              const postedAt = link.posted_at
                ? new Date(link.posted_at).toISOString().replace("T", " ").slice(0, 16)
                : "\u2014";

              return (
                <tr
                  key={link.id}
                  className="hover:bg-slate-900/50 transition-colors group"
                >
                  {/* ID column */}
                  <td className="p-4">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 group/link no-underline"
                    >
                      <span className="font-mono text-[12px] text-violet-400 group-hover/link:text-violet-500 transition-colors">
                        {generateId(link.id)}
                      </span>
                      <span className="material-symbols-outlined text-xs text-slate-600 group-hover/link:text-violet-500 cursor-pointer flex-shrink-0">
                        open_in_new
                      </span>
                    </a>
                  </td>

                  {/* Message column */}
                  <td className="p-4 max-w-xs">
                    <p
                      className="text-sm text-slate-400 truncate"
                      onMouseEnter={(e) => {
                        if (message.length > 30) {
                          setTooltip({ message, x: e.clientX, y: e.clientY });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (tooltip) {
                          setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {message}
                    </p>
                  </td>

                  {/* Domain column */}
                  <td className="p-4 text-sm text-slate-400 font-medium">
                    {domain}
                  </td>

                  {/* Source column */}
                  <td className="p-4">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-tighter flex items-center gap-1 w-fit"
                      style={{
                        backgroundColor: `rgba(${parseInt(sourceConfig.bgOpacity) * 255 / 100 | 0}, ${parseInt(sourceConfig.bgOpacity) * 255 / 100 | 0}, ${parseInt(sourceConfig.bgOpacity) * 255 / 100 | 0}, 0.15)`,
                        color: sourceConfig.color,
                      }}
                    >
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: sourceConfig.color }}
                      />
                      {sourceConfig.label}
                    </span>
                  </td>

                  {/* Author column */}
                  <td className="p-4 text-sm text-slate-300">
                    {authorName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-xs font-semibold text-text-secondary flex-shrink-0">
                          {authorInitial}
                        </div>
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {authorName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-tertiary italic">\u2014</span>
                    )}
                  </td>

                  {/* Channel column */}
                  <td className="p-4 text-sm text-slate-500">
                    {link.channel_name ? `#${link.channel_name}` : "\u2014"}
                  </td>

                  {/* Posted At column */}
                  <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                    {postedAt}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tooltip rendered outside the overflow-hidden container */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[100] w-64 whitespace-normal break-words rounded-lg border border-slate-700 bg-surface-container-low px-3 py-2 text-sm text-slate-300 shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 8,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {tooltip.message}
        </div>
      )}
    </div>
  );
}
