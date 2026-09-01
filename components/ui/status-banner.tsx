"use client"

import React, { useState } from "react"
import { useTable } from "@/lib/context/table-context"
import { Loader2, CheckCircle, X } from "lucide-react"

export function StatusBanner() {
  const { session, t } = useTable();
  const [dismissed, setDismissed] = useState(false);
  const [prevStatus, setPrevStatus] = useState(session?.status);

  // Reset the dismissed flag whenever the session status changes —
  // adjusting state during render instead of inside an effect body.
  if (session?.status !== prevStatus) {
    setPrevStatus(session?.status);
    setDismissed(false);
  }

  if (!session || dismissed) return null;

  const isPending = session.status === 'pending_approval';
  const isConfirmed = session.status === 'confirmed';

  if (!isPending && !isConfirmed) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-40 max-w-[480px] mx-auto animate-in slide-in-from-top-4 duration-300">
      {isPending && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500 text-white shadow-lg border border-amber-400 font-medium text-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-heading font-bold text-xs uppercase tracking-wider opacity-75">
                {t('waitingApproval')}
              </span>
              <span className="text-[13px]">{t('orderPending')}</span>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isConfirmed && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-600 text-white shadow-lg border border-emerald-500 font-medium text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 animate-bounce" />
            <div className="flex flex-col text-left">
              <span className="font-heading font-bold text-xs uppercase tracking-wider opacity-75">
                {t('confirmed')}
              </span>
              <span className="text-[13px]">{t('orderConfirmed')}</span>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
