"use client";
import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useCompany } from "./contextCompany";

type ChatboxContextType = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (input: string, clearInput: () => void) => Promise<void>;
};

const ChatboxContext = createContext<ChatboxContextType | undefined>(undefined);

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
};

export function ChatboxProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedCompany } = useCompany();

  const sendMessage = async (input: string, clearInput: () => void) => {
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
    clearInput();

    // API Call
    try {
      setIsLoading(true);
      const aiRes = await axios.post("/api/chat", {
        query: currentInput,
        selectedCompany: selectedCompany._id,
      });
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

  return (
    <ChatboxContext.Provider value={{ messages, isLoading, sendMessage }}>
      {children}
    </ChatboxContext.Provider>
  );
}

export const useChatbox = () => {
  const context = useContext(ChatboxContext);
  if (context === undefined) {
    throw new Error("useChatbox must be used within a ChatboxProvider");
  }
  return context;
};
