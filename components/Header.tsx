"use client";

import { useSidebar } from "@/context/contextSidebar";
import { Search, User } from "lucide-react";

function Header() {
  const { isOpen } = useSidebar();
  return (
    <header
      className={`fixed top-0 left-0 right-0 max-w-screen h-20 bg- transition-all duration-300 bg-gradient-to-b from-[#080808] to-[#0f0f0f] border-b border-gray-800 transition-all duration-200  ${
        isOpen ? "ml-72" : "ml-20"
      }`}
    >
      <div className="relative flex justify-between items-center h-full px-6 py-2 ">
        <div className="flex items-center gap-2">
          <Search className="text-gray-300 " />
          <input
            type="text"
            placeholder="Search..."
            className="w-lg px-4 py-3 bg-gray-800 border border-white/20 rounded-xl text-white placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-purple-500/80 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          className={`flex-shrink-0 flex w-12 h-12 rounded-full flex items-center justify-center transform transition-all duration-300 ease-in bg-gray-800 group group-hover:scale-105 group-hover:bg-gray-700`}
        >
          <User
            className={`w-6 h-6 group-hover:rotate-5 transition-all duration-300 ease-in text-gray-300`}
          />
        </button>
      </div>
    </header>
  );
}

export default Header;
