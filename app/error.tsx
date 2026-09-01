"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uygulama hatası:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[70vh] p-6 text-center">
      <div className="p-5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="font-heading font-black text-2xl text-foreground">
          Bir şeyler ters gitti
        </h1>
        <p className="text-xs text-foreground/60 font-semibold leading-relaxed">
          Beklenmeyen bir hata oluştu. Sayfayı yeniden yüklemeyi deneyin, sorun
          devam ederse lütfen personelle iletişime geçin.
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all cursor-pointer"
      >
        <RotateCcw className="h-4 w-4" />
        Tekrar Dene
      </button>
    </div>
  );
}
