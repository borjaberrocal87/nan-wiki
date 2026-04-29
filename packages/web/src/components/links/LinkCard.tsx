"use client";

import type { LinkItem } from "../../lib/api";
import { SOURCE_CONFIG, getRelativeDate, type SourceType } from "../../lib/sources";

interface LinkCardProps {
  link: LinkItem;
}

export default function LinkCard({ link }: LinkCardProps) {
  const sourceKey = (link.source_id || "other").toLowerCase() as SourceType;
  const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.other;
  const title = link.title || link.url;
  const authorName = link.author_username || (link.author_id ? `User ${link.author_id}` : null);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-0 no-underline text-inherit bg-surface-container-lowest border border-border-color rounded p-4 transition-all duration-200 cursor-pointer hover:border-accent-primary-container hover:shadow-[0_0_12px_rgba(124,58,237,0.15)]"
    >
      {/* Top row: source label + date */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="font-mono text-xs font-medium text-accent-primary-container uppercase tracking-[0.05em]">
          {sourceConfig.label}
        </span>
        <span className="font-mono text-xs text-text-tertiary">
          {getRelativeDate(link.posted_at)}
        </span>
      </div>

      {/* Title */}
      <h3 className="m-0 mb-1.5 text-base font-semibold leading-[1.35] text-text-primary tracking-[-0.01em] line-clamp-2">
        {title}
      </h3>

      {/* Description */}
      {link.description && (
        <p className="m-0 mb-3 text-sm text-text-secondary leading-[1.5] line-clamp-2">
          {link.description}
        </p>
      )}

      {/* Tags — mono badges with border */}
      {link.tags && link.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {link.tags.slice(0, 4).map((tag) => (
            <span key={tag.id} className="font-mono text-xs text-text-secondary border border-border-outline-variant rounded px-2 py-0.5 bg-secondary">
              {tag.name}
            </span>
          ))}
          {link.tags.length > 4 && (
            <span className="font-mono text-xs text-text-tertiary">
              +{link.tags.length - 4}
            </span>
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
            {authorName && <span className="text-text-secondary">{authorName}</span>}
            {authorName && link.channel_name && <span className="mx-1">/</span>}
            {link.channel_name && <span>#{link.channel_name}</span>}
          </span>
        </div>
      )}
    </a>
  );
}
