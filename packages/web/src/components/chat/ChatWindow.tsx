import React, { useRef, useEffect, type RefObject } from 'react';

interface ChatWindowProps {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    references?: string[];
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
              smart_toy
            </span>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Ask about your shared links
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.5', maxWidth: '360px' }}>
            Get answers about the links you've shared. I can search through your collection using semantic understanding.
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
              'What links about React have been shared?',
              'Show me recent GitHub repositories',
              'What are the best resources on TypeScript?',
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
              <span className="material-symbols-outlined text-sm">smart_toy</span>
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
              {msg.role === 'user' ? msg.content : renderContent(msg.content, msg.references)}
            </div>

            {msg.references && msg.references.length > 0 && msg.role === 'assistant' && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {msg.references.slice(0, 5).map((url, j) => {
                  const domain = (() => {
                    try { return new URL(url).hostname.replace('www.', ''); }
                    catch { return url; }
                  })();
                  return (
                    <a
                      key={j}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--text-tertiary)',
                        textDecoration: 'none',
                        backgroundColor: 'var(--bg-surface-container)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>link</span>
                      {domain}
                    </a>
                  );
                })}
                {msg.references.length > 5 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    +{msg.references.length - 5} more
                  </span>
                )}
              </div>
            )}
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

      {isStreaming && displayMessages.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
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
            <span className="material-symbols-outlined text-sm">smart_toy</span>
          </div>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '16px 16px 16px 4px',
              backgroundColor: 'var(--bg-surface-container-high)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '16px',
                backgroundColor: 'var(--accent-primary)',
                marginLeft: '2px',
                animation: 'typing 1s infinite',
              }}
            />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

function renderContent(text: string, references?: string[]): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
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
    }
    return <span key={i}>{part}</span>;
  });
}
