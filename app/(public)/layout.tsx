import React from "react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {children}
    </main>
  );
}
