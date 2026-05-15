import { useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Loader2, Trash2 } from "lucide-react";

import type { Quote } from "@/types/quote.type";
import { formatDate } from "@/utils/date";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type QuoteCardProps = {
  quote: Quote;
  canDelete: boolean;
  isDeleting: boolean;
  onOpen: (quote: Quote) => void;
  onDelete: (quote: Quote) => Promise<void> | void;
};

export function QuoteCard({
  quote,
  canDelete,
  isDeleting,
  onOpen,
  onDelete,
}: QuoteCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const ownerName = quote.owner?.name ?? "Unknown";
  const createdLabel = formatDate(quote.createdAt);
  const snippet = quote.text.length > 200 ? `${quote.text.slice(0, 200).trim()}...` : quote.text;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(quote);
    }
  };

  const handleConfirm = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    await onDelete(quote);
    setIsConfirmOpen(false);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open quote by ${ownerName}`}
      onClick={() => onOpen(quote)}
      onKeyDown={handleKeyDown}
      className="group relative mb-6 break-inside-avoid cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_40px_rgba(8,15,26,0.35)] backdrop-blur transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
    >
      <div className="flex items-center justify-between text-xs text-white/50">
        <span className="truncate">by {ownerName}</span>
        {canDelete && (
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-rose-200/80 transition-colors hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-[#0b1220] text-white shadow-[0_30px_80px_rgba(8,15,26,0.7)]">
              <DialogHeader>
                <DialogTitle>Delete quote</DialogTitle>
                <DialogDescription className="text-white/60">
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-white/70">"{snippet}"</p>
              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  className="bg-rose-500/80 text-white hover:bg-rose-500"
                  onClick={handleConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="mt-4">
        <p className="text-base leading-relaxed text-white/85 sm:text-lg">{snippet}</p>
      </div>
      <div className="mt-4 text-xs text-white/50">
        <span>{createdLabel}</span>
      </div>
    </article>
  );
}
