"use client";

import { User, ExternalLink, Search } from "lucide-react";
import { useSidebar } from "@/context/contextSidebar";

function Header({
  title,
  isGallery = false,
}: {
  title: string;
  isGallery: boolean;
}) {
  const { isOpen } = useSidebar();

  const sidebarWidth = isOpen ? "18rem" : "5.5rem"; // w-72 = 18rem, w-22 ≈ 5.5rem

  return (
    <header
      className="fixed bg-gradient-to-br from-[#0a0a0f] via-[#0f0f0f] to-[#0f0a10] top-0 flex flex-col items-start gap-4 px-6 py-4 z-50 transition-all duration-300"
      style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth})` }}
    >
      <div  
        className={`flex items-center w-full py-2
        ${isGallery ? "justify-between" : "justify-end"}`}
      >
        {isGallery && (
          <div className="flex items-center gap-2 w-1/2">
            <Search className="text-gray-300 " />
            <input
              type="text"
              placeholder="Search..."
              className="w-full max-w-xl px-4 py-1 bg-gray-800 border border-white/20 rounded-4xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}

        <div className="flex items-center justify-center ">
          <a
            href="https://docs.google.com/spreadsheets/d/1XSsh29t1cDqmO3UEM_WNjZaM-URdotV9s8RTJN40aBw/edit?gid=0#gid=0"
            target="_blank"
            className="flex gap-2 items-center px-4 py-2 bg-gradient-to-br from-blue-600 to-purple-600 hover:bg-gradient-to-br hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
          >
            <ExternalLink />
            <span>View Google Sheets</span>
          </a>
        </div>

        {/* <button className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transform transition-all duration-300 ease-in bg-gray-800 group hover:scale-105 hover:bg-gray-700">
          <User className="w-4 h-4 text-gray-300 group-hover:rotate-5 transition-all duration-300 ease-in" />
        </button> */}
      </div>

      <h1 className="text-white font-bold text-3xl tracking-tight">{title}</h1>
    </header>
  );
}

export default Header;
