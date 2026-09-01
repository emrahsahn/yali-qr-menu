import { Loader2 } from "lucide-react";

export default function TableLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[70vh] p-6">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-xs text-foreground/50 uppercase tracking-widest font-bold">
        Menü yükleniyor...
      </p>
    </div>
  );
}
