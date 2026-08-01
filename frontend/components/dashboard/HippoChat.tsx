"use client";

import React, { useState, useRef, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

const CHATBOT_URL = "/api/chatbot";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface HippoChatProps {
  fullHeight?: boolean;
}

export default function HippoChat({ fullHeight = false }: HippoChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am **Hippo**, your clinical AI healthcare assistant. You can ask me questions about symptoms, wellness advice, or verify medical definitions. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract <think>...</think> blocks from content
  const parseThinking = (text: string) => {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/;
    const match = text.match(thinkRegex);
    
    if (match) {
      const thought = match[1].trim();
      const content = text.replace(thinkRegex, "").trim();
      return { thought, content };
    }
    
    // Check if thinking is open but not closed yet (during streaming)
    if (text.includes("<think>")) {
      const parts = text.split("<think>");
      const thoughtPart = parts[1] || "";
      return { thought: thoughtPart.trim(), content: "", isThinkingOngoing: true };
    }
    
    return { thought: null, content: text };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    const assistantMsgId = `msg-assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Create message history for context
      const chatHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));
      
      chatHistory.push({
        role: "user",
        content: userMessage.content,
      });

      const response = await fetch(`${CHATBOT_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "MedGemma 1.5 4B",
          messages: chatHistory,
          stream: true,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("Response body is not readable");

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Process SSE lines
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              const contentToken = parsed.choices?.[0]?.delta?.content || "";
              accumulatedContent += contentToken;

              // Update the assistant message in state
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            } catch (jsonErr) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }

      // Finish streaming state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

    } catch (err: any) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "I apologize, but I encountered an error communicating with the local MedGemma AI engine. Please verify the MedGemma server is running on port 8001.",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full bg-[#FAF9F5] border border-[#E6E1D3] rounded-[32px] overflow-hidden shadow-xs flex flex-col ${
      fullHeight ? "flex-1 min-h-0" : "h-[650px]"
    }`}>
      
      {/* Header Info */}
      <header className="px-6 py-4 bg-white border-b border-[#E6E1D3] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF6E8] border border-[#E6E1D3] flex items-center justify-center text-[#8C6B1F]">
            <MaterialIcon name="smart_toy" className="text-xl" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#1C1B18] leading-tight">
              Chat with Hippo
            </h3>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              MedGemma 1.5 4B IT Online
            </span>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: "Hello! I am **Hippo**, your clinical AI healthcare assistant. You can ask me questions about symptoms, wellness advice, or verify medical definitions. How can I help you today?",
              },
            ])
          }
          className="p-2 text-[#787363] hover:text-[#1C1B18] hover:bg-[#FAF6E8] rounded-xl transition-colors cursor-pointer"
          title="Clear Conversation"
        >
          <MaterialIcon name="refresh" className="text-lg" />
        </button>
      </header>

      {/* Messages Scrolling Body */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-radial from-[#FAF6E8]/10 to-transparent custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const { thought, content, isThinkingOngoing } = parseThinking(msg.content);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 max-w-3xl ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar Bubble */}
              <div
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold border ${
                  isUser
                    ? "bg-[#1C1B18] text-white border-transparent"
                    : "bg-[#FAF6E8] text-[#8C6B1F] border-[#E8E2D2]"
                }`}
              >
                {isUser ? "ME" : "HP"}
              </div>

              {/* Message bubble card */}
              <div className="space-y-2 max-w-[85%]">
                {/* Reasoning block */}
                {thought && (
                  <details
                    className="group border border-[#E6E1D3] rounded-2xl bg-[#FAF6E8]/50 overflow-hidden font-sans text-xs"
                    open={isThinkingOngoing}
                  >
                    <summary className="px-4 py-2 bg-white/70 border-b border-[#E6E1D3] text-[#8C6B1F] font-semibold flex items-center justify-between cursor-pointer list-none select-none">
                      <div className="flex items-center gap-1.5">
                        <svg
                          className={`w-3.5 h-3.5 ${isThinkingOngoing ? "animate-spin" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <span>{isThinkingOngoing ? "Hippo is thinking..." : "Thought Process"}</span>
                      </div>
                      <span className="text-[10px] group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="p-4 text-[#787363] leading-relaxed whitespace-pre-wrap font-mono">
                      {thought}
                    </div>
                  </details>
                )}

                {/* Main chat body */}
                {content && (
                  <div
                    className={`rounded-[22px] px-4.5 py-3 text-sm leading-relaxed font-sans ${
                      isUser
                        ? "bg-[#8C6B1F] text-white rounded-tr-xs"
                        : "bg-white border border-[#E6E1D3] text-[#1C1B18] rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{content}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-white border-t border-[#E6E1D3] flex items-center gap-3 shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Hippo about symptoms, prescriptions, or dietary advice..."
          disabled={loading}
          className="flex-1 px-4.5 py-3 bg-[#FAF9F5] border border-[#DCD5C5] rounded-xl text-[#1C1B18] placeholder-[#A8A28E] focus:outline-hidden focus:ring-2 focus:ring-[#8C6B1F]/30 focus:border-[#8C6B1F] transition-all font-sans text-sm"
        />

        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="p-3 bg-[#1C1B18] text-white hover:bg-[#2E2C26] transition-all rounded-xl disabled:opacity-40 disabled:hover:bg-[#1C1B18] disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center"
        >
          <MaterialIcon name="send" className="text-lg" />
        </button>
      </form>
    </div>
  );
}
