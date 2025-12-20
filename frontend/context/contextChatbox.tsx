"use client";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useCompany } from "./contextCompany";
import { getErrorMessage } from "@/lib/getError";
import { toast } from "react-toastify";

type ChatboxContextType = {
  messages: Message[];
  isLoading: boolean;
  sendMessage: () => Promise<void>;
  input: string;
  setInput: (input: string) => void;
  loadChatHistory: (chatId: string) => Promise<void>;
  loadChatHistories: () => Promise<void>;
};

const ChatboxContext = createContext<ChatboxContextType | undefined>(undefined);

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
};

type ChatHistoryItem = {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

export function ChatboxProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const { selectedCompany, setIsChatting } = useCompany();
  const [chatHistories, setChatHistories] = useState<ChatHistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [selectedCompany._id]);

  useEffect(() => {
    setIsChatting(isLoading);
  }, [isLoading, setIsChatting]);

  // Send message to backend
  const sendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // API Call
    try {
      setIsLoading(true);
      const aiRes = await axios.post("/api/chat", {
        query: input,
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

  //Load chat histories
  const loadChatHistories = async () => {
    try {
      setIsLoadingChat(true);
      const response = await axios.get("/api/chat/chat-history", {
        headers: {
          "X-Active-Company": selectedCompany._id,
        },
      });
      setChatHistories(response.data);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      console.error(message);
    } finally {
      setIsLoadingChat(false);
    }
  };

  //Load selected chat history
  const loadChatHistory = async (chatId: string) => {
    try {
      setIsLoadingChat(true);
      const response = await axios.get(`/api/chat/chat-history/${chatId}`, {
        headers: {
          "X-Active-Company": selectedCompany._id,
        },
      });
      setMessages(response.data.messages || []);
      setCurrentChatId(chatId);
      setInput("");
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      console.error(message);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <ChatboxContext.Provider
      value={{
        messages,
        sendMessage,
        isLoading,
        input,
        setInput,
        loadChatHistory,
        loadChatHistories,
      }}
    >
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
