"use client";

import Link from "next/link";
import { useSidebar } from "@/context/contextSidebar";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  UploadCloud,
  Image,
  ChevronsLeft,
  Menu,
  Building2,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useCompany } from "@/context/contextCompany";
import { LogoutDialog } from "./LogoutDialog";
import { createPortal } from "react-dom"; // Add this import

function Sidebar() {
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] =
    useState<boolean>(false);
  const router = useRouter();
  const items = [
    { title: "Chat", url: "/chat", icon: MessageCircle },
    { title: "Upload", url: "/upload", icon: UploadCloud },
    { title: "Gallery", url: "/gallery", icon: Image },
  ];
  const {
    companies,
    selectedCompany,
    isSwitching,
    isLoading,
    isPerformingTask,
    setSelectedCompany,
  } = useCompany();

  const isDisabled = isSwitching || isPerformingTask;

  const handleLogout = async () => {
    try {
      await axios.post(`/api/auth/logout`, { withCredentials: true });
      toast.success("Logged out successfully!");
      router.push("/auth");
      sessionStorage.removeItem("Active_Company");
    } catch {
      toast.error("Logout failed!");
    }
  };

  return (
    <>
      {/* Loading overlay - now renders at document.body level */}
      {isDisabled &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500" />
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-white text-base font-semibold mb-1">
                  {isSwitching ? "Switching Company" : "Processing"}
                </p>
                <p className="text-gray-400 text-sm">Please wait a moment...</p>
              </div>
            </div>
          </div>,
          document.body
        )}
      <aside>
        <div
          className={`fixed top-0 left-0 w-72 min-h-screen bg-gradient-to-b from-[#080808] to-[#0f0f0f] border-r border-gray-800 transition-all duration-300  ${
            isOpen ? "translate-x-0" : "-translate-x-50"
          }`}
        >
          {/* title */}
          <div className="pt-6 px-6 pb-1 flex justify-between items-center ">
            <div>
              <h1 className="text-white text-4xl font-bold tracking-tight font-poppins">
                Receipt AI
              </h1>
              <p className="text-gray-300 text-xs mt-1">Document Scanner</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="flex-shrink-0 w-10 h-10 bg-gray-700 border border-white/20 group hover:bg-gray-600 rounded-full flex items-center justify-center cursor-pointer"
            >
              {isOpen ? (
                <ChevronsLeft className="w-6 h-6 text-white group-hover:scale-105 transform transition-all duration-200 " />
              ) : (
                <Menu className="w-6 h-6 text-white group-hover:scale-105" />
              )}
            </button>
          </div>

          {/* Company Selector */}
          {isOpen && (
            <div className="px-4 py-4 border-b border-white/5">
              <div className="relative">
                <button
                  onClick={() =>
                    setIsCompanyDropdownOpen(!isCompanyDropdownOpen)
                  }
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs text-gray-400 mb-0.5">
                        Current Company
                      </p>
                      {isLoading ? (
                        <div className="h-2 w-24 bg-white/10 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-sm text-white font-medium truncate">
                          {selectedCompany.company_name || "Select Company"}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      isCompanyDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {isCompanyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                    {companies.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400 text-center">
                        No companies found
                      </div>
                    ) : (
                      companies.map((company) => (
                        <button
                          key={company._id}
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsCompanyDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 ${
                            selectedCompany === company
                              ? "bg-white/5 text-white"
                              : "text-gray-400"
                          }`}
                        >
                          <p className="font-medium">{company.company_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            PAN: {company.pan_no}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="text-white flex flex-col space-y-2 px-2 ">
            {items.map((item, index) => {
              const isActive = pathname === item.url;
              return (
                <Link
                  href={item.url}
                  key={index}
                  className={`relative flex flex-row-reverse justify-between items-center gap-2 group hover:text-white py-2 px-4 rounded transition-all duration-300 ease-in ${
                    isOpen ? "hover:bg-white/20 " : ""
                  }
                ${
                  isActive
                    ? "before:absolute before:content-[''] before:left-0 before:h-full rounded-r before:w-[2px] before:bg-gradient-to-br before:from-blue-500 before:to-purple-600 before:rounded-xl "
                    : "text-gray-300"
                }`}
                >
                  <div
                    className={`flex-shrink-0 flex w-10 h-10 rounded-full flex items-center justify-center transform transition-all duration-300 ease-in 
                    ${
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 scale-105"
                        : "bg-gray-800 group-hover:scale-105 group-hover:bg-gray-700"
                    }`}
                  >
                    {
                      <item.icon
                        className={`w-6 h-6 group-hover:rotate-5 transition-all duration-300 ease-in
                        ${isActive ? "text-white " : "text-gray-300"}`}
                      />
                    }
                  </div>
                  <h2
                    className={`text-sm font-medium transition-all duration-300 group-hover:translate-x-1 ${
                      isActive ? "translate-x-1" : ""
                    }`}
                  >
                    {item.title}
                  </h2>
                </Link>
              );
            })}
          </nav>

          {/* Settings and Logout */}
          <div className="py-4 px-2 text-white absolute bottom-0 w-full border-t border-white/20 space-y-2">
            <Link
              href="/settings"
              className={`relative flex flex-row-reverse justify-between items-center gap-2 group hover:text-white py-2 px-4 rounded transition-all duration-300 ease-in ${
                isOpen ? "hover:bg-white/20 " : ""
              }
                ${
                  pathname === "/settings"
                    ? "before:absolute before:content-[''] before:left-0 before:h-full rounded-r before:w-[2px] before:bg-gradient-to-br before:from-blue-500 before:to-purple-600 before:rounded-xl "
                    : "text-gray-300"
                }`}
            >
              <div
                className={`flex-shrink-0 flex w-10 h-10 rounded-full flex items-center justify-center transform transition-all duration-300 ease-in
                    ${
                      pathname === "/settings"
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 scale-105"
                        : "bg-gray-800 group-hover:scale-105 group-hover:bg-gray-700"
                    }`}
              >
                <Settings
                  className={`w-6 h-6 group-hover:rotate-5 transition-all duration-300 ease-in
                        ${
                          pathname === "/settings"
                            ? "text-white "
                            : "text-gray-300"
                        }`}
                />
              </div>
              <h2 className="text-sm font-medium ">Settings</h2>
            </Link>

            <LogoutDialog handleClick={handleLogout} />
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
