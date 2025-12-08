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
} from "lucide-react";

function Sidebar() {
  const { isOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  const items = [
    { title: "Chat", url: "/chat", icon: MessageCircle },
    { title: "Upload", url: "/upload", icon: UploadCloud },
    { title: "Gallery", url: "/gallery", icon: Image },
  ];
  return (
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
              AIReceipt
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

        {/* Nav Items */}
        <nav className="text-white flex flex-col space-y-2 py-6 px-2 ">
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
                <h2 className="text-sm font-medium ">{item.title}</h2>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
