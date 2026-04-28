"use client";

import type { LinkItem } from "../../lib/api";
import { SOURCE_CONFIG, getRelativeDate, type SourceType } from "../../lib/sources";

interface LinkCardProps {
  link: LinkItem;
}

export default function LinkCard({ link }: LinkCardProps) {
  const sourceKey = (link.source || "other").toLowerCase() as SourceType;
  const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.other;
  const title = link.title || link.url;
  const authorName = link.author_username || (link.author_id ? `User ${link.author_id}` : null);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0",
        textDecoration: "none",
        color: "inherit",
        backgroundColor: "var(--bg-surface-container-lowest)",
        border: "1px solid var(--border-color)",
        borderRadius: "4px",
        padding: "16px 20px",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-primary-container)";
        e.currentTarget.style.boxShadow = "0 0 12px rgba(124, 58, 237, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top row: source label + date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "12px" }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--accent-primary-container)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {sourceConfig.label}
        </span>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--text-tertiary)",
        }}>
          {getRelativeDate(link.posted_at)}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        margin: "0 0 6px 0",
        fontSize: "15px",
        fontWeight: 600,
        lineHeight: "1.35",
        color: "var(--text-primary)",
        letterSpacing: "-0.01em",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {title}
      </h3>

      {/* Description */}
      {link.description && (
        <p style={{
          margin: "0 0 12px 0",
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: "1.5",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {link.description}
        </p>
      )}

      {/* Tags — mono badges with border */}
      {link.tags && link.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
          {link.tags.slice(0, 4).map((tag) => (
            <span key={tag} style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-outline-variant)",
              borderRadius: "4px",
              padding: "2px 8px",
              backgroundColor: "var(--bg-secondary)",
            }}>
              {tag}
            </span>
          ))}
          {link.tags.length > 4 && (
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-tertiary)",
            }}>
              +{link.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Bottom row: author + channel */}
      {(authorName || link.channel_name) && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingTop: "10px",
          borderTop: "1px solid var(--border-color)",
          marginTop: "auto",
        }}>
          {authorName && (
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-surface-container)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
              title={authorName}
            >
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-tertiary)",
          }}>
            {authorName && <span style={{ color: "var(--text-secondary)" }}>{authorName}</span>}
            {authorName && link.channel_name && <span style={{ margin: "0 4px" }}>/</span>}
            {link.channel_name && <span>#{link.channel_name}</span>}
          </span>
        </div>
      )}
    </a>
  );
}
