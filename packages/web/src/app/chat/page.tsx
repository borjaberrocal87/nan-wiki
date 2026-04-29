"use client";

import { Suspense } from "react";
import ChatView from "./ChatView";

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatView />
    </Suspense>
  );
}
