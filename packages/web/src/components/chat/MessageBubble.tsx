interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  references?: string[];
}

export default function MessageBubble({ role, content, references }: MessageBubbleProps) {
  const isUser = role === 'user';

  const renderContent = (text: string) => {
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
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        gap: '10px',
      }}
    >
      {!isUser && (
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
            fontSize: '14px',
            color: 'var(--text-on-primary-container)',
            fontWeight: 600,
          }}
        >
          <span className="material-symbols-outlined text-sm">smart_toy</span>
        </div>
      )}

      <div
        style={{
          maxWidth: '75%',
          minWidth: '60px',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            backgroundColor: isUser ? 'var(--accent-primary-container)' : 'var(--bg-surface-container-high)',
            color: isUser ? 'var(--text-on-primary-container)' : 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
          }}
        >
          {renderContent(content)}
        </div>

        {references && references.length > 0 && !isUser && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {references.slice(0, 5).map((url, i) => {
              const domain = (() => {
                try {
                  return new URL(url).hostname.replace('www.', '');
                } catch {
                  return url;
                }
              })();
              return (
                <a
                  key={i}
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
            {references.length > 5 && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                }}
              >
                +{references.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {isUser && (
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
            fontSize: '14px',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          <span className="material-symbols-outlined text-sm">person</span>
        </div>
      )}
    </div>
  );
}
