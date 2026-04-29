"use client";

import { useState } from "react";
import type { LinkItem } from "../../lib/api";
import { SOURCE_CONFIG, getRelativeDate, type SourceType } from "../../lib/sources";

interface LinkCardProps {
  link: LinkItem;
  onTagFilter?: (tagId: string) => void;
  activeTagFilter?: string | null;
}

export default function LinkCard({ link, onTagFilter, activeTagFilter }: LinkCardProps) {
  const [expandedTags, setExpandedTags] = useState(false);
  const sourceKey = (link.source_id || "other").toLowerCase() as SourceType;
  const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.other;
  const title = link.title || link.url;
  const authorName = link.author_username || (link.author_id ? `User ${link.author_id}` : null);

  return (
    <div className="flex flex-col gap-0 bg-surface-container-lowest border border-slate-700 rounded p-4 transition-all duration-200 hover:border-accent-primary-container hover:shadow-[0_0_12px_rgba(124,58,237,0.15)]">
      {/* Top row: source badge + date */}
      <div className="flex items-center justify-between gap-2 mb-3">
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
        <span className="font-mono text-xs text-text-tertiary">
          {getRelativeDate(link.posted_at)}
        </span>
      </div>

      {/* Title */}
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="m-0 mb-1.5 text-base font-semibold leading-[1.35] text-text-primary tracking-[-0.01em] line-clamp-2 no-underline hover:text-violet-400 transition-colors"
      >
        {title}
      </a>

      {/* Description */}
      {link.description && (
        <p className="m-0 mb-3 text-sm text-slate-300 leading-[1.5] line-clamp-2">
          {link.description}
        </p>
      )}

      {/* Tags — mono badges with border */}
      {link.tags && link.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(expandedTags ? link.tags : link.tags.slice(0, 4)).map((tag) => {
            const isActive = activeTagFilter === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => onTagFilter?.(tag.id)}
                className={`font-mono text-xs rounded px-2 py-0.5 border transition-colors cursor-pointer ${
                  isActive
                    ? "text-violet-400 border-violet-500 bg-violet-500/10"
                    : "text-slate-400 border-slate-700 bg-slate-800/50 hover:text-violet-400 hover:border-violet-500 hover:bg-violet-500/10"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
          {link.tags.length > 4 && !expandedTags && (
            <button
              onClick={() => setExpandedTags(true)}
              className="font-mono text-xs text-slate-300 hover:text-violet-400 cursor-pointer transition-colors"
            >
              +{link.tags.length - 4}
            </button>
          )}
        </div>
      )}

      {/* Bottom row: author + channel */}
      {(authorName || link.channel_name) && (
        <div className="flex items-center gap-2 pt-2.5 mt-auto border-t border-border-color">
          {authorName && (
            <div
              className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-xs font-semibold text-text-secondary"
              title={authorName}
            >
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-mono text-xs text-text-tertiary">
            {authorName && <span className="text-slate-300">{authorName}</span>}
            {authorName && link.channel_name && <span className="mx-1">/</span>}
            {link.channel_name && <span className="text-slate-500">#{link.channel_name}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
