import React, { useRef, useEffect, type RefObject } from 'react';

interface ChatWindowProps {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  isStreaming: boolean;
  streamingContent: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export default function ChatWindow({
  messages,
  isStreaming,
  streamingContent,
  messagesEndRef,
}: ChatWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isStreaming, streamingContent]);

  const displayMessages = isStreaming
    ? [...messages, { role: 'assistant' as const, content: streamingContent, timestamp: new Date() }]
    : messages;

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {displayMessages.length === 0 && !isStreaming && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface-container-high)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>
              database
            </span>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Ask anything about your data
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.5', maxWidth: '360px' }}>
            Natural language to SQL. Ask questions and get instant queries against your database.
          </p>
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            {[
              'Show me the 10 most recent links',
              'Top 5 users who shared the most links',
              'Links tagged with "react" or "javascript"',
            ].map((suggestion) => (
              <div
                key={suggestion}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-surface-container)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {displayMessages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '16px',
            gap: '10px',
          }}
        >
          {msg.role === 'assistant' && (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined text-sm">database</span>
            </div>
          )}

          <div style={{ maxWidth: '75%', minWidth: '60px' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                backgroundColor: msg.role === 'user' ? 'var(--accent-primary-container)' : 'var(--bg-surface-container-high)',
                color: msg.role === 'user' ? 'var(--text-on-primary-container)' : 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.5',
                wordBreak: 'break-word',
              }}
            >
              {msg.role === 'user' ? msg.content : renderSQL(msg.content)}
              {isStreaming && i === displayMessages.length - 1 && msg.role === 'assistant' && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '16px',
                    backgroundColor: 'var(--accent-primary)',
                    marginLeft: '2px',
                    animation: 'typing 1s infinite',
                    verticalAlign: 'middle',
                  }}
                />
              )}
            </div>
          </div>

          {msg.role === 'user' && (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface-container-highest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
          )}
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}

function renderContent(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const urlParts = line.split(urlRegex);
    urlParts.forEach((part, partIndex) => {
      if (urlRegex.test(part)) {
        result.push(
          <a
            key={`url-${lineIndex}-${partIndex}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'underline',
              textDecorationColor: 'var(--border-color)',
              wordBreak: 'break-all',
            }}
          >
            {part}
          </a>
        );
      } else if (part) {
        result.push(<span key={`text-${lineIndex}-${partIndex}`}>{part}</span>);
      }
    });
    if (lineIndex < lines.length - 1) {
      result.push(<br key={`br-${lineIndex}`} />);
    }
  });

  return result;
}

function renderSQL(text: string): React.ReactNode {
  const sqlBlockRegex = /```sql\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  while ((match = sqlBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${partIndex++}`}>
          {renderContent(text.slice(lastIndex, match.index))}
        </span>
      );
    }
    parts.push(
      <pre
        key={`sql-${partIndex++}`}
        style={{
          margin: '8px 0',
          padding: '12px',
          backgroundColor: 'var(--bg-surface-container-low)',
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: '1.4',
          overflowX: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {match[1]}
      </pre>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${partIndex++}`}>
        {renderContent(text.slice(lastIndex))}
      </span>
    );
  }

  return parts.length > 0 ? parts : text;
}
