"use client";

import type { LinkItem } from "../../lib/api";

interface LinkCardProps {
  link: LinkItem;
}

const sourceColors: Record<string, string> = {
  github: "#f0f6fc",
  twitter: "#1b95e0",
  youtube: "#ff0000",
  twitch: "#9146ff",
  linkedin: "#0a66c2",
  reddit: "#ff4500",
  medium: "#00ab48",
  blog: "#aaaaaa",
  other: "#aaaaaa",
};

export default function LinkCard({ link }: LinkCardProps) {
  const source = link.source || "other";
  const color = sourceColors[source] || "#aaaaaa";
  const title = link.title || link.url;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        backgroundColor: "#111111",
        border: "1px solid #1e1e1e",
        borderRadius: "8px",
        padding: "16px",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#333333";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: 500,
          textTransform: "capitalize",
          backgroundColor: `${color}20`,
          color: color,
        }}>
          {source}
        </span>
        <span style={{
          fontSize: "12px",
          color: "#666",
        }}>
          {new Date(link.posted_at).toLocaleDateString()}
        </span>
      </div>

      <h3 style={{
        margin: 0,
        fontSize: "15px",
        fontWeight: 500,
        lineHeight: "1.4",
        color: "#e5e5e5",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {title}
      </h3>

      {link.description && (
        <p style={{
          margin: 0,
          fontSize: "13px",
          color: "#888",
          lineHeight: "1.5",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {link.description}
        </p>
      )}

      {link.tags && link.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "auto" }}>
          {link.tags.slice(0, 5).map((tag) => (
            <span key={tag} style={{
              display: "inline-block",
              padding: "2px 8px",
              backgroundColor: "#1e1e1e",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#999",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}
