"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { ArrowUp, Loader2 } from "lucide-react";
import axios from "axios";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
};

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) {
      return;
    }
    const currentInput = input;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: currentInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // API Call
    try {
      setIsLoading(true);
      const aiRes = await axios.post("/api/chat", { query: currentInput });
      const aiMessage: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: aiRes.data,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("API Error: ", err);
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: "ai",
        text: "Sorry, I encountered an error. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section className="h-screen">
      <Header title="RAG Chat - Chat with your documents" />

      <div className="pt-36 pb-4 px-4 max-h-screen h-full w-full flex flex-col items-center justify-start gap-4">
        {/* Chat messages area */}
        <div className="w-full max-w-4xl flex-1 rounded-xl overflow-y-auto px-2 scrollbar-hid">
          {messages.length == 0 ? (
            <div className="h-full flex items-center justify-center text-white/70 text-center">
              <div>
                <p className="text-lg mb-2">Welcome!</p>
                <p className="text-sm">Ask me anything about your documents</p>
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
                    <p className="whitespace-pre-wrap break-word">{m.text}</p>
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
            onClick={sendMessage}
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 peer-focus:bg-white/80 transition-all text-white peer-focus:text-black"
          >
            <ArrowUp className="w-4 h-4 " />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Chat;
