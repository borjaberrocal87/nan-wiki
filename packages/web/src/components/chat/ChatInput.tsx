import { useState, useRef, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface-container-lowest)',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask something about your data..."
        disabled={disabled}
        className="input"
        style={{
          flex: 1,
          padding: '10px 14px',
          fontSize: '14px',
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="btn-primary"
        style={{
          padding: '10px 18px',
          fontSize: '14px',
          opacity: value.trim() && !disabled ? 1 : 0.5,
          cursor: value.trim() && !disabled ? 'pointer' : 'not-allowed',
        }}
      >
        <span className="material-symbols-outlined text-sm">send</span>
        Send
      </button>
    </div>
  );
}
