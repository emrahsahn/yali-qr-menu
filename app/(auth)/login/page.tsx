"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"
import { Lock, User as UserIcon, ArrowRight } from "lucide-react"
import { YaliLogo } from "@/components/ui/yali-logo"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError("Lütfen kullanıcı adı ve şifrenizi girin.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const result = await login(username, password)
      if (result.success) {
        router.push("/panel")
      } else {
        setError(result.error || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.")
      }
    } catch {
      setError("Giriş yapılırken beklenmeyen bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative bg-gradient-to-br from-[#B98A4A]/10 via-background to-black/90">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <YaliLogo size="md" shadow className="rounded-3xl" />
          <h1 className="font-heading font-black text-4xl text-foreground tracking-widest leading-none">
            YALI RESTAURANT
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary">
            GÖREVLİ & YÖNETİM PANELİ
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full glass-panel p-8 rounded-3xl border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden bg-card/90">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold text-center animate-shake">
                {error}
              </div>
            )}

            {/* Username Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-foreground/60 px-1">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Kullanıcı adınız"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full bg-secondary/60 dark:bg-black/20 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-foreground/35"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-foreground/60 px-1">
                Şifre
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-secondary/60 dark:bg-black/20 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-foreground/35"
                />
              </div>
            </div>



            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl font-bold text-xs uppercase bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-all duration-300 py-6 px-6 tracking-wider cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Panele Giriş Yap <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-foreground/40 font-semibold">
            Yalı Restaurant Dijital Görevli Paneli
          </p>
        </div>
      </div>
    </div>
  )
}
