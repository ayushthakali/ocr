"use client";

import { ExternalLink, Search } from "lucide-react";
import axios from "axios";
import { useSidebar } from "@/context/contextSidebar";
import { toast } from "react-toastify";
import { useCompany } from "@/context/contextCompany";
import { useState } from "react";

function Header({
  title,
  isGallery = false,
}: {
  title: string;
  isGallery: boolean;
}) {
  const { isOpen } = useSidebar();
  const { selectedCompany, setIsSheetsLoading } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const sidebarWidth = isOpen ? "18rem" : "5.5rem"; // w-72 = 18rem, w-22 ≈ 5.5rem

  const openUserGoogleSheets = async () => {
    try {
      setIsLoading(true);
      setIsSheetsLoading(true);
      const response = await axios.get("/api/sheets/status", {
        headers: {
          "X-Active-Company": selectedCompany._id,
        },
      });
      if (response.data.connected && response.data.spreadsheet_url) {
        window.open(response.data.spreadsheet_url, "_blank");
      } else {
        toast.error("Please connect your Google Sheets first.");
      }
    } catch (error) {
      console.error("Error fetching Google Sheets URL:", error);
      alert("Failed to open Google Sheets. Please try again.");
    } finally {
      setIsLoading(false);
      setIsSheetsLoading(false);
    }
  };

  return (
    <header
      className="fixed bg-gradient-to-br from-[#0a0a0f] via-[#0f0f0f] to-[#0f0a10] top-0 flex flex-col items-start gap-4 px-6 py-4 z-50 transition-all duration-300"
      style={{ left: sidebarWidth, width: `calc(100% - ${sidebarWidth})` }}
    >
      <div className="flex items-center w-full py-2 justify-between">
        <h1 className="text-white font-bold text-3xl tracking-tight">
          {title}
        </h1>

        <button
          onClick={openUserGoogleSheets}
          disabled={isLoading}
          className="flex gap-2 items-center justify-center px-4 py-2 bg-gradient-to-br from-blue-600 to-purple-600 hover:bg-gradient-to-br hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity/50"
        >
          {isLoading ? (
            <div className="border-4 w-6 h-6 rounded-full border-t-transparent animate-spin border-white/80 transition-all" />
          ) : (
            <>
              <ExternalLink />
              <span>View Google Sheets</span>
            </>
          )}
        </button>
      </div>
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
    </header>
  );
}

export default Header;
