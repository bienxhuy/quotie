import type { Quote } from "@/types/quote.type";
import { formatDateTime } from "@/utils/date";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type QuoteDetailModalProps = {
  quote: Quote | null;
  onClose: () => void;
};

export function QuoteDetailModal({ quote, onClose }: QuoteDetailModalProps) {
  if (!quote) {
    return null;
  }

  const ownerName = quote.owner?.name ?? "Unknown";
  const createdLabel = formatDateTime(quote.createdAt);

  return (
    <Dialog open={!!quote} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[#0b1220] text-white shadow-[0_30px_80px_rgba(8,15,26,0.7)]">
        <DialogHeader>
          <DialogTitle>{ownerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">{createdLabel}</p>
          <p className="text-lg font-semibold leading-relaxed text-white sm:text-2xl">
            {quote.text}
          </p>
        </div>

        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
