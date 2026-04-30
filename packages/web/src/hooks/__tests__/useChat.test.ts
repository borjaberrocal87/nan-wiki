import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import * as api from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof api>('@/lib/api');
  return {
    ...actual,
    sendChatMessageStream: vi.fn(),
  };
});

describe('useChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty messages', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamingContent).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('clears messages', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.clearMessages();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('does not send message while streaming', async () => {
    (api.sendChatMessageStream as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { result, rerender } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('first message');
    });

    rerender();
    expect(result.current.isStreaming).toBe(true);

    // Try to send another message while streaming
    await act(async () => {
      result.current.sendMessage('second message');
    });

    // Should still be streaming, second message ignored
    expect(result.current.messages.length).toBe(2); // user + assistant
  });

  it('adds user message and starts streaming on send', async () => {
    (api.sendChatMessageStream as any).mockImplementation((_msg: string, onChunk: (c: string) => void) => {
      onChunk('Hello');
      return Promise.resolve();
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('Hi');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Hi');
  });

  it('accumulates streaming content', async () => {
    let onChunkFn: ((c: string) => void) | undefined;
    (api.sendChatMessageStream as any).mockImplementation((_msg: string, onChunk: (c: string) => void) => {
      onChunk('Hello');
      onChunk(' world');
      return Promise.resolve();
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('test');
    });

    // After sendMessage completes, streaming should be done
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages[1].content).toBe('Hello world');
  });

  it('completes streaming with accumulated content', async () => {
    (api.sendChatMessageStream as any).mockImplementation((_msg: string, onChunk: (c: string) => void) => {
      onChunk('Hello');
      onChunk(' world');
      return Promise.resolve();
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('test');
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages[1].content).toBe('Hello world');
  });

  it('sets error on streaming failure', async () => {
    (api.sendChatMessageStream as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('test');
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages[1].content).toContain('Sorry, I encountered an error');
  });

  it('handles non-Error exceptions', async () => {
    (api.sendChatMessageStream as any).mockRejectedValue('string error');

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('test');
    });

    expect(result.current.error).toBe('Failed to send message');
    expect(result.current.isStreaming).toBe(false);
  });

  it('resets streaming state after completion', async () => {
    (api.sendChatMessageStream as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('msg1');
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamingContent).toBe('');

    // Send another message after first completes
    await act(async () => {
      result.current.sendMessage('msg2');
    });

    expect(result.current.messages).toHaveLength(4); // 2 from first + 2 from second
  });

  it('returns correct shape', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current).toHaveProperty('messages');
    expect(result.current).toHaveProperty('isStreaming');
    expect(result.current).toHaveProperty('streamingContent');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('sendMessage');
    expect(result.current).toHaveProperty('clearMessages');
  });
});
