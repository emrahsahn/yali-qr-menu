"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User } from "@/lib/types/auth"

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (!active) return
      const storedUser = localStorage.getItem("yali_user")
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as User)
        } catch {
          localStorage.removeItem("yali_user")
        }
      }
      setIsLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (res.ok && data.user) {
        setUser(data.user)
        if (typeof window !== "undefined") {
          localStorage.setItem("yali_user", JSON.stringify(data.user))
        }
        return { success: true, user: data.user }
      }

      return {
        success: false,
        error: data.error || "Kullanıcı adı veya şifre hatalı."
      }
    } catch {
      return {
        success: false,
        error: "Sunucu bağlantı hatası. Lütfen tekrar deneyin."
      }
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("yali_user")
    }
    // Clear server-side HttpOnly cookie
    fetch("/api/auth", { method: "DELETE" }).catch(() => {})
    router.replace("/")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
