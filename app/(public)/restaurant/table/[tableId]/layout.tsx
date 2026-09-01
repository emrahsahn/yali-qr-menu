import React from "react"

export default function TableLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-grow flex flex-col w-full bg-background min-h-screen">
      {children}
    </div>
  );
}
