"use client";

import { User, Search } from "lucide-react";
import { useSidebar } from "@/context/contextSidebar";

function Header({ title }: { title: string }) {
  const { isOpen } = useSidebar();

  const sidebarWidth = isOpen ? "18rem" : "5.5rem"; // w-72 = 18rem, w-22 ≈ 5.5rem

  return (
    <header
      className="fixed bg-gradient-to-br from-[#0a0a0f] via-[#0f0f0f] to-[#0f0a10] top-0 flex flex-col items-start gap-4 px-6 py-4 z-50 transition-all duration-300"
      style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth})` }}
    >
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2 w-full">
          <Search className="text-gray-300 " />
          <input
            type="text"
            placeholder="Search..."
            className="w-full max-w-xl px-4 py-1 bg-gray-800 border border-white/20 rounded-4xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transform transition-all duration-300 ease-in bg-gray-800 group hover:scale-105 hover:bg-gray-700">
          <User className="w-4 h-4 text-gray-300 group-hover:rotate-5 transition-all duration-300 ease-in" />
        </button>
      </div>

      <div className="flex items-center gap-2 ">
        <h1 className="text-white font-bold text-3xl tracking-tight">
          {title}
        </h1>
      </div>
    </header>
  );
}

export default Header;
