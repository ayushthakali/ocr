"use client";

import { useSidebar } from "@/context/contextSidebar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isOpen } = useSidebar();

  return (
    <>
      <main className={`transition-all duration-300 ${isOpen ? "ml-72" : "ml-22"}`}>{children}</main>
    </>
  );
}
