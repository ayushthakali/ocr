"use client";

import { useEffect, useRef } from "react";
import Header from "@/components/Header";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { useChatbox } from "@/context/contextChatbox";
import ReactMarkdown from "react-markdown";
import ChatHistorySidebar from "@/app/(main)/chat/ChatHistorySidebar";

function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, setInput, input } = useChatbox();

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

        {/* Chat messages area */}
        <div className="w-full flex flex-col items-center justify-start flex-1">
          <div className="w-full max-w-4xl flex-1 rounded-xl overflow-y-auto px-2 scrollbar-hid">
            {messages.length == 0 ? (
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
                          ? "bg-white/10 text-white border border-white/20 rounded-br-sm max-w-[80%]"
                          : "text-white "
                      }`}
                    >
                      {m.sender === "ai" ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold">{children}</strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc ml-4 mb-2">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal ml-4 mb-2">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1">{children}</li>
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
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-2 rounded-2xl bg-white/10 text-white border border-white/20 rounded-bl-sm">
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

          {/* Chat bar */}
          <div className="relative w-full max-w-3xl ">
            <input
              type="text"
              value={input}
              disabled={isLoading}
              onKeyDown={handleKeyPress}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isLoading
                  ? "Please wait..."
                  : "Ask anything about your receipt..."
              }
              className="peer w-full pl-6 pr-14 py-2 bg-gray-800 border border-white/20 rounded-4xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/60 transition-all"
            />

            <button
              onClick={() => sendMessage()}
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 peer-focus:bg-white/80 transition-all text-white peer-focus:text-black"
            >
              {!isLoading ? (
                <ArrowUp className="w-4 h-4 " />
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
