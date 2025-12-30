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

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
};

export interface ChatHistoryItem {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatboxContext = createContext<ChatboxContextType | undefined>(undefined);

export function ChatboxProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { selectedCompany, setIsChatting, isLoadingChat, setIsLoadingChat } =
    useCompany();

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
  }, [selectedCompany, setIsLoadingChat]);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setCurrentChatId(null);
  }, [selectedCompany]);

  useEffect(() => {
    setIsChatting(isLoading);
  }, [isLoading, setIsChatting]);

  useEffect(() => {
    if (selectedCompany?._id) {
      loadChatHistories();
    }
  }, [selectedCompany, loadChatHistories]);

  // Send message to backend
  const sendMessage = async () => {
    if (!input.trim()) {
      return;
    }

    const currentInput = input.trim();

    //Set user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: currentInput,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // Auto create chat for first time user
    if (!currentChatId) {
      // Generate title from first user message i.e. currentInput if needed
      let title: string;

      if (currentInput) {
        // Generate new title from first message
        title =
          currentInput.substring(0, 50) +
          (currentInput.length > 50 ? "..." : "");
      } else {
        title = "New Chat";
      }

      try {
        const response = await axios.post(
          "/api/chat/chat-history",
          {
            title: title,
            messages: userMessage,
          },
          {
            headers: {
              "X-Active-Company": selectedCompany._id,
            },
          }
        );

        setCurrentChatId(response.data.newChat._id);
        setChatHistories((prev) => [response.data.newChat, ...prev]);
      } catch (error) {
        const message = getErrorMessage(error);
        toast.error("Failed to create chat: " + message);
        return;
      }
    }

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

      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);
      await saveChatHistory(updatedMessages);
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

  // Save chat history
  const saveChatHistory = useCallback(
    async (messagesToSave?: Message[]) => {
      if (!currentChatId) {
        return;
      }

      const messagesToUse = messagesToSave || messages;

      // Check if chat still exists
      const currentChat = chatHistories.find((c) => c._id === currentChatId);
      if (!currentChat) {
        console.log("Chat doesn't exist.");
        return;
      }

      try {
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

        const response = await axios.patch(
          `/api/chat/chat-history/${currentChatId}`,
          { title, messages: messagesToUse },
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
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.log("Chat was deleted, removing from local state");
          setChatHistories((prev) =>
            prev.filter((c) => c._id !== currentChatId)
          );
          setCurrentChatId(null);
        } else {
          console.error("Error saving chat:", error);
        }
      }
    },
    [currentChatId, messages, chatHistories, selectedCompany, setChatHistories]
  );

  //Load selected chat history
  const loadChatHistory = useCallback(
    async (chatId: string) => {
      try {
        setIsLoadingChat(true);

        // Save current chat before switching
        if (currentChatId && messages.length > 0) {
          await saveChatHistory();
        }

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
    [
      selectedCompany,
      currentChatId,
      messages,
      saveChatHistory,
      setIsLoadingChat,
    ]
  );

  // Create new chat
  const createNewChat = useCallback(async () => {
    try {
      setIsLoadingChat(true);

      // Save current chat before creating new one
      if (currentChatId && messages.length > 0) {
        await saveChatHistory();
      }

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
      const deletedChatTitle = response.data.deletedChatTitle;
      toast.success(
        deletedChatTitle
          ? `New chat created. Oldest chat "${deletedChatTitle}" was removed.`
          : "New chat created",
        { autoClose: 2000 }
      );

      setCurrentChatId(response.data.newChat._id);
      setMessages([]);
      setInput("");
      await loadChatHistories();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      console.error(message);
    } finally {
      setIsLoadingChat(false);
    }
  }, [
    selectedCompany,
    loadChatHistories,
    currentChatId,
    messages,
    saveChatHistory,
    setIsLoadingChat,
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
    [selectedCompany, currentChatId, setChatHistories, setIsLoadingChat]
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
