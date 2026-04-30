import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatWindow from '../ChatWindow';

const defaultProps = {
  messages: [] as Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>,
  isStreaming: false,
  streamingContent: '',
  messagesEndRef: { current: null },
};

describe('ChatWindow', () => {
  it('renders empty state with suggestions when no messages', () => {
    render(<ChatWindow {...defaultProps} />);
    expect(screen.getByText('Ask anything about your data')).toBeInTheDocument();
    expect(screen.getByText('Show me the 10 most recent links')).toBeInTheDocument();
    expect(screen.getByText('Top 5 users who shared the most links')).toBeInTheDocument();
    expect(screen.getByText(/Links tagged with/)).toBeInTheDocument();
  });

  it('renders user messages', () => {
    const messages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
    ];
    render(<ChatWindow {...defaultProps} messages={messages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders assistant messages', () => {
    const messages = [
      { role: 'assistant' as const, content: 'Here is the answer', timestamp: new Date() },
    ];
    render(<ChatWindow {...defaultProps} messages={messages} />);
    expect(screen.getByText('Here is the answer')).toBeInTheDocument();
  });

  it('renders multiple messages', () => {
    const messages = [
      { role: 'user' as const, content: 'First', timestamp: new Date() },
      { role: 'assistant' as const, content: 'Second', timestamp: new Date() },
      { role: 'user' as const, content: 'Third', timestamp: new Date() },
    ];
    render(<ChatWindow {...defaultProps} messages={messages} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('shows streaming cursor when streaming', () => {
    render(<ChatWindow {...defaultProps} isStreaming={true} streamingContent="Typing..." />);
    expect(screen.getByText('Typing...')).toBeInTheDocument();
  });

  it('appends streaming content to messages', () => {
    const messages = [
      { role: 'user' as const, content: 'Hi', timestamp: new Date() },
    ];
    render(<ChatWindow {...defaultProps} messages={messages} isStreaming={true} streamingContent="Hello there!" />);
    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('renders SQL code blocks in assistant messages', () => {
    const messages = [
      {
        role: 'assistant' as const,
        content: 'Here is your query:\n\n```sql\nSELECT * FROM links\n```',
        timestamp: new Date(),
      },
    ];
    render(<ChatWindow {...defaultProps} messages={messages} />);
    expect(screen.getByText('Here is your query:')).toBeInTheDocument();
    expect(screen.getByText('SELECT * FROM links')).toBeInTheDocument();
  });

  it('renders URL links in messages', () => {
    const messages = [
      { role: 'assistant' as const, content: 'Check this: https://example.com', timestamp: new Date() },
    ];
    render(<ChatWindow {...defaultProps} messages={messages} />);
    expect(screen.getByText('Check this:')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('does not show suggestions when streaming', () => {
    render(<ChatWindow {...defaultProps} isStreaming={true} streamingContent="" />);
    expect(screen.queryByText('Ask anything about your data')).not.toBeInTheDocument();
  });

  it('does not show suggestions when messages exist', () => {
    const messages = [
      { role: 'user' as const, content: 'Hi', timestamp: new Date() },
    ];
    render(<ChatWindow {...defaultProps} messages={messages} />);
    expect(screen.queryByText('Ask anything about your data')).not.toBeInTheDocument();
  });

  it('renders assistant avatar', () => {
    const messages = [
      { role: 'assistant' as const, content: 'Hello', timestamp: new Date() },
    ];
    const { container } = render(<ChatWindow {...defaultProps} messages={messages} />);
    const avatars = container.querySelectorAll('[style*="32px"]');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('renders user avatar', () => {
    const messages = [
      { role: 'user' as const, content: 'Hello', timestamp: new Date() },
    ];
    const { container } = render(<ChatWindow {...defaultProps} messages={messages} />);
    const avatars = container.querySelectorAll('[style*="32px"]');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('renders messagesEndRef element', () => {
    const ref = { current: null };
    render(<ChatWindow {...defaultProps} messagesEndRef={ref} />);
    const container = document.querySelector('[style*="flex"]');
    expect(container).toBeInTheDocument();
  });

  it('handles empty streaming content', () => {
    render(<ChatWindow {...defaultProps} isStreaming={true} streamingContent="" />);
    const allElements = document.querySelectorAll('[style*="animation"]');
    expect(allElements.length).toBeGreaterThan(0);
  });

  it('renders streaming message as assistant role', () => {
    render(<ChatWindow {...defaultProps} isStreaming={true} streamingContent="Streaming..." />);
    const streamingMsg = screen.getByText('Streaming...');
    expect(streamingMsg).toBeInTheDocument();
  });

  it('renders suggestions with correct count', () => {
    render(<ChatWindow {...defaultProps} />);
    const suggestions = document.querySelectorAll('[style*="padding: 10px 14px"]');
    expect(suggestions.length).toBe(3);
  });
});
