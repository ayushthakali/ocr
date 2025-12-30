"use client";

import { useEffect, useRef, } from "react";
import Header from "@/components/Header";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { useChatbox } from "@/context/contextChatbox";
import ReactMarkdown from "react-markdown";
import ChatHistorySidebar from "@/app/(main)/chat/ChatHistorySidebar";

function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, setInput, input, isLoadingChat } =
    useChatbox();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section className="h-screen">
      <Header title="RAG Chat - Chat with your documents" isGallery={false} />

      <div className="pt-28 pb-4 px-2 max-h-screen h-full w-full flex">
        {/* Sidebar */}
        <ChatHistorySidebar />

        {/* Chat container */}
        <div className="w-full flex flex-col items-center justify-start flex-1">
          {/* Messages area */}
          <div
            className="relative w-full max-w-4xl flex-1 rounded-xl overflow-y-auto px-2 "
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.2) transparent",
            }}
          >
            {/* Chat loading overlay */}
            {isLoadingChat && (
              <div className="absolute inset-0 z-20 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f0f] to-[#0f0a10] flex items-center justify-center rounded-xl transition-opacity">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="w-12 h-12 animate-spin" />
                  <p className="text-xl text-white/80">Loading chat…</p>
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/70 text-center">
                <div>
                  <p className="text-lg mb-2">Welcome to RAG Chat!</p>
                  <p className="text-sm">
                    Ask me anything about your documents...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.sender === "ai" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-2xl ${
                        m.sender === "user"
                          ? "bg-white/5 text-white border border-white/10 rounded-br-sm max-w-[80%]"
                          : "text-white"
                      }`}
                    >
                      {m.sender === "ai" ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 text-white/90 text-base font-light">
                                {children}
                              </p>
                            ),
                            code: ({ children }) => (
                              <code className="px-2 py-1 bg-white/10 rounded text-blue-300 text-sm font-mono">
                                {children}
                              </code>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-white">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-blue-200">
                                {children}
                              </em>
                            ),
                            ul: ({ children }) => (
                              <ul className="space-y-2 my-2 ml-4">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="space-y-2 my-2 ml-4 list-decimal">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-white/90 leading-relaxed text-base pl-2">
                                {children}
                              </li>
                            ),
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold text-white my-4">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-semibold text-white mb-3 mt-4">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-medium text-white mb-2 mt-4">
                                {children}
                              </h3>
                            ),
                          }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {m.text}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Inline thinking indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-2 rounded-2xl bg-white/5 text-white border border-white/10 rounded-bl-sm">
                      <div className="flex items-center gap-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat input bar */}
          <div className="relative w-full max-w-3xl">
            <input
              type="text"
              value={input}
              disabled={isLoading || isLoadingChat}
              onKeyDown={handleKeyPress}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isLoading || isLoadingChat
                  ? "Please wait..."
                  : "Ask anything about your receipt..."
              }
              className="peer w-full pl-6 pr-14 py-2 bg-gray-800 border border-white/20 rounded-4xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/60 transition-all"
            />

            <button
              onClick={() => sendMessage()}
              disabled={isLoading || isLoadingChat}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 peer-focus:bg-white/80 transition-all text-white peer-focus:text-black"
            >
              {!isLoading ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <div className="bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center">
                  <Square className="w-2 h-2 bg-white/90" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Chat;
