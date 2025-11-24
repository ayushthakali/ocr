"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid, UploadCloud, Image, ChevronsLeft, Menu } from "lucide-react";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const items = [
    { title: "Dashboard", url: "/", icon: Grid },
    { title: "Upload", url: "/upload", icon: UploadCloud },
    { title: "Gallery", url: "/gallery", icon: Image },
  ];
  return (
    <aside >
      <div
        className={`sticky top-0 left-0 w-72 h-screen bg-gradient-to-b from-[#080808] to-[#0f0f0f] border-r border-gray-800 transition-all duration-300  ${
          isOpen ? "translate-x-0" : "-translate-x-52"
        }`}
      >
        {/* title */}
        <div className="border-b border-gray-800 py-8 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-white text-5xl font-bold tracking-tight">
              OCR
            </h1>
            <p className="text-gray-300 text-sm mt-1">Document Scanner</p>
          </div>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex-shrink-0 w-12 h-12 bg-gray-700 group hover:bg-gray-600 rounded-full flex items-center justify-center cursor-pointer"
          >
            {isOpen ? (
              <ChevronsLeft className="w-8 h-8 text-white group-hover:scale-105 transform transition-all duration-200 " />
            ) : (
              <Menu className="w-6 h-6 text-white group-hover:scale-105" />
            )}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="text-white flex flex-col space-y-4 py-6  ">
          {items.map((item, index) => {
            const isActive = pathname === item.url;
            return (
              <Link
                href={item.url}
                key={index}
                className={`flex flex-row-reverse justify-between items-center gap-2 group hover:text-white py-2 px-4 rounded-4xl transition-all duration-300 ease-in ${
                  isOpen ? "hover:bg-white/20 " : "bg-white/0"
                }
                ${
                  isActive
                    ? "bg-white/10 text-white shadow-lg shadow-white/5"
                    : "text-gray-300"
                }`}
              >
                <div
                  className={`flex-shrink-0 flex w-12 h-12 rounded-full flex items-center justify-center transform transition-all duration-300 ease-in
                    ${
                      isActive
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 scale-105"
                        : "bg-gray-800 group-hover:scale-105 group-hover:bg-gray-700"
                    }`}
                >
                  {
                    <item.icon
                      className={`w-6 h-6 group-hover:rotate-5 transition-all duration-300 ease-in
                        ${isActive ? "text-white" : "text-gray-300"}`}
                    />
                  }
                </div>
                <h2 className="text-lg font-medium ">{item.title}</h2>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
