"use client";

import type { LinkItem } from "../../lib/api";
import { SOURCE_CONFIG, type SourceType } from "../../lib/sources";

interface LinkTableProps {
  links: LinkItem[];
}

function generateId(index: number): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
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

function extractPath(url: string): string {
  try {
    const { pathname, search, hash } = new URL(url);
    return pathname + search + hash;
  } catch {
    return url;
  }
}

export default function LinkTable({ links }: LinkTableProps) {
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
                URL
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
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest">
                Message
              </th>
              <th className="p-4 font-label-md text-slate-400 uppercase text-[10px] tracking-widest whitespace-nowrap">
                Posted At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {links.map((link, index) => {
              const sourceKey = (link.source || "other").toLowerCase() as SourceType;
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
                  <td className="p-4 font-mono text-[12px] text-violet-400">
                    {generateId(index)}
                  </td>

                  {/* URL column */}
                  <td className="p-4">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 group/link no-underline"
                    >
                      <span className="text-slate-300 truncate max-w-[200px] text-sm group-hover/link:text-violet-400 transition-colors">
                        {extractPath(link.url)}
                      </span>
                      <span className="material-symbols-outlined text-xs text-slate-600 group-hover/link:text-violet-500 cursor-pointer flex-shrink-0">
                        open_in_new
                      </span>
                    </a>
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

                  {/* Message column */}
                  <td className="p-4 max-w-xs">
                    <p className="text-sm text-slate-400 truncate">
                      {message}
                    </p>
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
    </div>
  );
}
