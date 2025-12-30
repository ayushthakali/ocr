"use client";

import { Plus, Clock, MessageSquare, Loader2 } from "lucide-react";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useChatbox } from "@/context/contextChatbox";
import { useCompany } from "@/context/contextCompany";
import { ChatHistoryItem } from "@/context/contextChatbox";
import { toast } from "react-toastify";

interface ChatItemProps {
  chat: ChatHistoryItem;
  isActive: boolean;
  deleteChat: (id: string) => Promise<void>;
  loadChatHistory: (id: string) => Promise<void>;
}

const ChatItem = ({
  chat,
  isActive,
  loadChatHistory,
  deleteChat,
}: ChatItemProps) => {
  const { isLoading } = useChatbox();
  const { isLoadingChat } = useCompany();
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) //calculation in milliseconds
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
        isActive
          ? "bg-purple-500/20 border border-purple-500/30"
          : "bg-white/5 hover:bg-white/10 border border-white/10"
      }`}
      onClick={() => {
        if (isLoading || isLoadingChat) {
          toast.warning("Please wait for the current response to complete");
          return;
        }
        loadChatHistory(chat._id);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate mb-1">
            {chat.title}
          </h4>
          <p className="text-xs text-gray-400">{formatDate(chat.updatedAt)}</p>
        </div>
        <DeleteDialog
          title="Confirm Deletion?"
          description="Are you sure you want to delete this chat?"
          handleClick={() => deleteChat(chat._id)}
        />
      </div>
    </div>
  );
};

interface ChatSectionProps {
  title: string;
  chats: ChatHistoryItem[];
  currentChatId: string | null;
  deleteChat: (id: string) => Promise<void>;
  loadChatHistory: (id: string) => Promise<void>;
}

const ChatSection = ({
  title,
  chats,
  currentChatId,
  deleteChat,
  loadChatHistory,
}: ChatSectionProps) => {
  if (chats.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        {title}
      </h4>
      <div className="space-y-2">
        {chats.map((chat) => (
          <ChatItem
            key={chat._id}
            chat={chat}
            isActive={currentChatId === chat._id}
            deleteChat={deleteChat}
            loadChatHistory={loadChatHistory}
          />
        ))}
      </div>
    </div>
  );
};

export default function ChatHistorySidebar() {
  const {
    chatHistories,
    createNewChat,
    currentChatId,
    deleteChat,
    loadChatHistory,
    isLoading,
  } = useChatbox();
  const { isLoadingChat } = useCompany();

  // Group chats by date
  const groupChatsByDate = (chats: typeof chatHistories) => {
    const now = new Date();
    const groups = {
      today: [] as typeof chatHistories,
      yesterday: [] as typeof chatHistories,
      lastWeek: [] as typeof chatHistories,
      lastMonth: [] as typeof chatHistories,
      byMonth: {} as Record<string, typeof chatHistories>,
    };

    chats.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt);
      const diffDays = Math.floor(
        (now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        groups.today.push(chat);
      } else if (diffDays === 1) {
        groups.yesterday.push(chat);
      } else if (diffDays <= 7) {
        groups.lastWeek.push(chat);
      } else if (diffDays <= 30) {
        groups.lastMonth.push(chat);
      } else {
        const monthYear = chatDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        if (!groups.byMonth[monthYear]) {
          groups.byMonth[monthYear] = [];
        }
        groups.byMonth[monthYear].push(chat);
      }
    });

    return groups;
  };

  const groupedChats = groupChatsByDate(chatHistories);
  const hasNoChats = chatHistories.length === 0;

  return (
    <div className="w-64 backdrop-blur-sm p-2 flex flex-col h-full ">
      {/* New Chat Button */}
      <button
        onClick={createNewChat}
        disabled={isLoadingChat || isLoading}
        className="w-full mb-4 px-4 py-3 bg-purple-500/30 hover:bg-purple-500/40 border border-purple-500/40 rounded-xl flex items-center gap-2 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoadingChat ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        <span className="font-medium text-sm">New Chat</span>
      </button>

      {/* Chat History Header */}
      <div className="mb-5 px-1 flex justify-between text-gray-300">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <h3 className="text-sm font-semibold">
            Recent Chats ({chatHistories.length}/6)
          </h3>
        </div>
      </div>

      {/* Chat History List */}
      <div
        className="flex-1 overflow-y-auto space-y-4 transition-all pr-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.2) transparent",
        }}
      >
        {/* Empty State */}
        {isLoadingChat && hasNoChats ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-gray-600 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-500">Loading chats...</p>
          </div>
        ) : hasNoChats ? (
          <div className="text-center py-16">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No chat history yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Create your first chat above
            </p>
          </div>
        ) : (
          <>
            {/* Today Section */}
            <ChatSection
              title="Today"
              chats={groupedChats.today}
              currentChatId={currentChatId}
              deleteChat={deleteChat}
              loadChatHistory={loadChatHistory}
            />

            {/* Yesterday Section */}
            <ChatSection
              title="Yesterday"
              chats={groupedChats.yesterday}
              currentChatId={currentChatId}
              deleteChat={deleteChat}
              loadChatHistory={loadChatHistory}
            />

            {/* Last 7 Days Section */}
            <ChatSection
              title="Last 7 days"
              chats={groupedChats.lastWeek}
              currentChatId={currentChatId}
              deleteChat={deleteChat}
              loadChatHistory={loadChatHistory}
            />

            {/* Last 30 Days Section */}
            <ChatSection
              title="Last 30 days"
              chats={groupedChats.lastMonth}
              currentChatId={currentChatId}
              deleteChat={deleteChat}
              loadChatHistory={loadChatHistory}
            />

            {/* Older Chats by Month */}
            {Object.entries(groupedChats.byMonth).map(([monthYear, chats]) => (
              <ChatSection
                key={monthYear}
                title={monthYear}
                chats={chats}
                currentChatId={currentChatId}
                deleteChat={deleteChat}
                loadChatHistory={loadChatHistory}
              />
            ))}
          </>
        )}
      </div>

      {/* Info Footer */}
      {chatHistories.length >= 6 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ Maximum 6 chats reached. Creating a new chat will delete the
            oldest one.
          </p>
        </div>
      )}
    </div>
  );
}
