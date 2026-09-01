import React from "react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#E8833A]/10 via-transparent to-foreground/5 px-4 py-12">
      {children}
    </div>
  )
}
