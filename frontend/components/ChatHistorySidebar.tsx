"use client";
import { useState } from "react";
import { MessageSquare, Plus, Trash2, Clock } from "lucide-react";
// import { useChatbox } from "@/context/ChatboxContext";

export default function ChatHistorySidebar() {
  //   const {
  //     chatHistories,
  //     currentChatId,
  //     createNewChat,
  //     loadChatHistory,
  //     deleteChatHistory,
  //   } = useChatbox();

  const [chatHistories, setChatHistories] = useState([
    {
      _id: "chat001",
      title: "How to calculate quarterly taxes?",
      messages: [
        {
          id: "1",
          sender: "user",
          text: "How do I calculate quarterly taxes?",
          timestamp: new Date("2024-12-16T10:00:00"),
        },
        {
          id: "2",
          sender: "ai",
          text: "Quarterly taxes are calculated based on your estimated annual income...",
          timestamp: new Date("2024-12-16T10:00:05"),
        },
      ],
      createdAt: new Date("2024-12-16T10:00:00"),
      updatedAt: new Date("2024-12-16T10:30:00"),
    },
    {
      _id: "chat002",
      title: "VAT registration process",
      messages: [
        {
          id: "3",
          sender: "user",
          text: "What documents do I need for VAT registration?",
          timestamp: new Date("2024-12-15T14:20:00"),
        },
        {
          id: "4",
          sender: "ai",
          text: "For VAT registration, you'll need: PAN card, business registration certificate...",
          timestamp: new Date("2024-12-15T14:20:10"),
        },
      ],
      createdAt: new Date("2024-12-15T14:20:00"),
      updatedAt: new Date("2024-12-15T14:45:00"),
    },
    {
      _id: "chat003",
      title: "Employee salary deductions",
      messages: [
        {
          id: "5",
          sender: "user",
          text: "What are the standard deductions for employee salaries?",
          timestamp: new Date("2024-12-14T09:15:00"),
        },
        {
          id: "6",
          sender: "ai",
          text: "Standard deductions include PF, ESI, professional tax, and income tax...",
          timestamp: new Date("2024-12-14T09:15:08"),
        },
        {
          id: "7",
          sender: "user",
          text: "Can you explain ESI calculation?",
          timestamp: new Date("2024-12-14T09:16:00"),
        },
        {
          id: "8",
          sender: "ai",
          text: "ESI is calculated at 3.25% of gross wages for employers and 0.75% for employees...",
          timestamp: new Date("2024-12-14T09:16:12"),
        },
      ],
      createdAt: new Date("2024-12-14T09:15:00"),
      updatedAt: new Date("2024-12-14T09:20:00"),
    },
    {
      _id: "chat004",
      title: "GST return filing deadline",
      messages: [
        {
          id: "9",
          sender: "user",
          text: "When is the GST return filing deadline?",
          timestamp: new Date("2024-12-10T16:30:00"),
        },
        {
          id: "10",
          sender: "ai",
          text: "The GST return filing deadline is typically the 20th of the following month...",
          timestamp: new Date("2024-12-10T16:30:06"),
        },
      ],
      createdAt: new Date("2024-12-10T16:30:00"),
      updatedAt: new Date("2024-12-10T16:35:00"),
    },
    {
      _id: "chat005",
      title: "New Chat",
      messages: [],
      createdAt: new Date("2024-12-16T11:00:00"),
      updatedAt: new Date("2024-12-16T11:00:00"),
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState<string | null>("chat001");

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="w-1/4 backdrop-blur-sm p-2 flex flex-col h-full">
      {/* New Chat Button */}
      <button
        // onClick={createNewChat}
        className="w-full mb-4 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl flex items-center gap-2 text-white transition-all"
      >
        <Plus className="w-4 h-4" />
        <span className="font-medium text-sm">New Chat</span>
      </button>

      {/* Chat History Header */}
      <div className="mb-3 px-2">
        <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {/* Recent Chats ({chatHistories.length}/6) */}
          Recent Chats
        </h3>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {chatHistories.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No chat history yet</p>
          </div>
        ) : (
          chatHistories.map((chat) => (
            <div
              key={chat._id}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                currentChatId === chat._id
                  ? "bg-purple-500/20 border border-purple-500/30"
                  : "bg-white/5 hover:bg-white/10 border border-white/10"
              }`}
              //   onClick={() => loadChatHistory(chat._id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate mb-1">
                    {chat.title}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {formatDate(chat.updatedAt)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {chat.messages.length} messages
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this chat?")) {
                      //   deleteChatHistory(chat._id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))
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
