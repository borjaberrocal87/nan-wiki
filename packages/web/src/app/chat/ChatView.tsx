"use client";

import { useRef } from "react";
import ChatWindow from "../../components/chat/ChatWindow";
import ChatInput from "../../components/chat/ChatInput";
import { useChat } from "../../hooks/useChat";

export default function ChatView() {
  const { messages, isStreaming, streamingContent, error, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "16px auto",
        height: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-primary)",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-surface-container-lowest)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-primary-container)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ color: "var(--text-on-primary-container)" }}>
              smart_toy
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Link Assistant
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: 0 }}>
              Ask about your shared links
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            style={{
              background: "none",
              border: "1px solid var(--border-color)",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent-primary-container)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              refresh
            </span>
            Clear
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "var(--accent-error-container)",
            color: "var(--text-on-surface)",
            fontSize: "13px",
            borderBottom: "1px solid var(--accent-error)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            error
          </span>
          {error}
        </div>
      )}

      {/* Chat messages */}
      <ChatWindow
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        messagesEndRef={messagesEndRef}
      />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
