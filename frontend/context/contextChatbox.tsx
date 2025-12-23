"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { useCompany } from "./contextCompany";
import { getErrorMessage } from "@/lib/getError";
import { toast } from "react-toastify";

type ChatboxContextType = {
  messages: Message[];
  isLoading: boolean;
  isLoadingChat: boolean;
  sendMessage: () => Promise<void>;
  input: string;
  setInput: (input: string) => void;
  loadChatHistory: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  createNewChat: () => Promise<void>;
  saveChatHistory: () => Promise<void>;
  chatHistories: ChatHistoryItem[];
  currentChatId: string | null;
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

  //Load chat histories
  const loadChatHistories = useCallback(async () => {
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
  }, [selectedCompany._id]);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setCurrentChatId(null);
  }, [selectedCompany._id]);

  useEffect(() => {
    setIsChatting(isLoading);
  }, [isLoading, setIsChatting]);

  useEffect(() => {
    if (selectedCompany?._id) {
      loadChatHistories();
    }
  }, [selectedCompany._id, loadChatHistories]);

  // Send message to backend
  const sendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    const currentInput = input.trim();
    // Auto create chat for first time user
    if (!currentChatId) {
      try {
        const response = await axios.post(
          "/api/chat/chat-history",
          {
            title: "New Chat",
            messages: [],
          },
          {
            headers: {
              "X-Active-Company": selectedCompany._id,
            },
          }
        );

        setCurrentChatId(response.data._id);
        setChatHistories((prev) => [response.data, ...prev]);
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error("Failed to create chat: " + message);
        return; // Don't send message if chat creation failed
      }
    }

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
      saveChatHistory();
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

  //Load selected chat history
  const loadChatHistory = useCallback(
    async (chatId: string) => {
      try {
        setIsLoadingChat(true);
        const response = await axios.get(`/api/chat/chat-history/${chatId}`, {
          headers: {
            "X-Active-Company": selectedCompany._id,
          },
        });
        const chatData = response.data;
        setMessages(chatData.messages || []);
        setCurrentChatId(chatId);
        setInput("");
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(message);
        console.error(message);
      } finally {
        setIsLoadingChat(false);
      }
    },
    [selectedCompany._id]
  );

  // Create new chat
  const createNewChat = useCallback(async () => {
    try {
      setIsLoadingChat(true);
      const response = await axios.post(
        "/api/chat/chat-history",
        {
          title: "New Chat",
          messages: [],
        },
        {
          headers: {
            "X-Active-Company": selectedCompany._id,
          },
        }
      );
      toast.success("New chat created.");
      setCurrentChatId(response.data._id);
      setMessages([]);
      setInput("");
      setChatHistories((prev) => [response.data, ...prev]);
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      console.error(message);
    } finally {
      setIsLoadingChat(false);
    }
  }, [selectedCompany._id, setChatHistories]);

  // Save chat history
  const saveChatHistory = useCallback(async () => {
    // Check if we have a chat to save
    if (!currentChatId || messages.length === 0) return;

    try {
      // Find current chat to check title
      const currentChat = chatHistories.find(
        (chat) => chat._id === currentChatId
      );

      // Generate title from first user message if needed
      const firstUserMessage = messages.find((m) => m.sender === "user");
      let title: string;

      if (currentChat?.title === "New Chat" && firstUserMessage) {
        // Generate new title from first message
        title =
          firstUserMessage.text.substring(0, 50) +
          (firstUserMessage.text.length > 50 ? "..." : "");
      } else {
        title = currentChat?.title || "New Chat";
      }
      // console.log(title);

      const response = await axios.patch(
        `/api/chat/chat-history/${currentChatId}`,
        { title, messages },
        {
          headers: {
            "X-Active-Company": selectedCompany._id,
          },
        }
      );
      setChatHistories((prev) =>
        prev.map((chat) =>
          chat._id === currentChatId
            ? {
                ...chat,
                title: response.data.title,
                messages: response.data.messages,
                updatedAt: response.data.updatedAt,
              }
            : chat
        )
      );
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(message);
    }
  }, [
    currentChatId,
    messages,
    chatHistories,
    selectedCompany._id,
    setChatHistories,
  ]);

  // Delete a chat history
  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        setIsLoadingChat(true);
        await axios.delete(`/api/chat/chat-history/${chatId}`, {
          headers: {
            "X-Active-Company": selectedCompany._id,
          },
        });
        //Check if the deleted chat is currently being opened
        if (currentChatId === chatId) {
          setMessages([]);
          setInput("");
          setCurrentChatId(null);
        }
        toast.success("Chat deleted successfully.");
        setChatHistories((prev) => prev.filter((chat) => chat._id !== chatId));
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error(message);
        console.error(message);
      } finally {
        setIsLoadingChat(false);
      }
    },
    [selectedCompany._id, currentChatId, setChatHistories]
  );

  return (
    <ChatboxContext.Provider
      value={{
        messages,
        isLoadingChat,
        sendMessage,
        isLoading,
        input,
        setInput,
        loadChatHistory,
        createNewChat,
        deleteChat,
        saveChatHistory,
        chatHistories,
        currentChatId,
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
