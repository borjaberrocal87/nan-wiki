import { useState, useRef, useCallback } from 'react';
import type { ChatMessage } from '@/lib/api';
import { sendChatMessageStream } from '@/lib/api';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  const sendMessage = useCallback(async (message: string) => {
    if (streamingRef.current) return;
    streamingRef.current = true;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      messagesRef.current = updated;
      return updated;
    });
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    setMessages((prev) => {
      const updated: ChatMessage[] = [...prev, { role: 'assistant', content: '', timestamp: new Date() }];
      messagesRef.current = updated;
      return updated;
    });

    try {
      let accumulated = '';

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
        (err) => {
          setError(err);
        },
      );

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: accumulated,
          timestamp: new Date(),
        };
        return updated;
      });
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errMessage);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errMessage}`,
          timestamp: new Date(),
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      streamingRef.current = false;
    }
  }, []);

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
