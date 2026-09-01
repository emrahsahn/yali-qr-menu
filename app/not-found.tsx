import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[70vh] p-6 text-center">
      <div className="p-5 rounded-full bg-primary/10 border border-primary/20 text-primary">
        <Compass className="h-8 w-8" />
      </div>
      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="font-heading font-black text-3xl text-foreground tracking-wide">
          404
        </h1>
        <p className="text-xs text-foreground/60 font-semibold leading-relaxed">
          Aradığınız sayfa bulunamadı ya da taşınmış olabilir.
        </p>
      </div>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-md hover:bg-primary/90 transition-all"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
