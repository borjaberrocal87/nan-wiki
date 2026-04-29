import { useState, useRef, useCallback } from 'react';
import type { ChatMessage } from '@/lib/api';
import { sendChatMessageStream } from '@/lib/api';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef(false);

  const sendMessage = useCallback(async (message: string) => {
    if (streamingRef.current) return;
    streamingRef.current = true;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    const assistantIndex = messages.length;
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', references: [], timestamp: new Date() },
    ]);

    try {
      let accumulated = '';
      let references: string[] = [];

      await sendChatMessageStream(
        message,
        (chunk) => {
          accumulated += chunk;
          setStreamingContent(accumulated);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: accumulated,
            };
            return updated;
          });
        },
        (urls) => {
          references = urls;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              references: urls,
            };
            return updated;
          });
        },
        (err) => {
          setError(err);
        },
      );

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: accumulated,
          references,
          timestamp: new Date(),
        };
        return updated;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${message}`,
          references: [],
          timestamp: new Date(),
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      streamingRef.current = false;
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    clearMessages,
  };
}
