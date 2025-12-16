"use client";

import { useSidebar } from "@/context/contextSidebar";
import Sidebar from "@/components/Sidebar";
import { ChatboxProvider } from "@/context/contextChatbox";
import { CompanyProvider } from "@/context/contextCompany";
import { UploadProvider } from "@/context/contextUpload";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isOpen } = useSidebar();

  return (
    <>
      <CompanyProvider>
        <ChatboxProvider>
          <UploadProvider>
            <Sidebar />
            <main
              className={`transition-all duration-300 ${
                isOpen ? "ml-72" : "ml-22"
              }`}
            >
              {children}
            </main>
          </UploadProvider>
        </ChatboxProvider>
      </CompanyProvider>
    </>
  );
}
