"use client";

import { useSidebar } from "@/context/contextSidebar";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/context/contextSidebar";
import { ChatboxProvider } from "@/context/contextChatbox";
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isOpen } = useSidebar();

  return (
    <>
      <ChatboxProvider>
        <SidebarProvider>
          <Sidebar />
          <main
            className={`transition-all duration-300 ${
              isOpen ? "ml-72" : "ml-22"
            }`}
          >
            {children}
          </main>
        </SidebarProvider>
      </ChatboxProvider>
    </>
  );
}
