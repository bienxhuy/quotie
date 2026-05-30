import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Plus, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { createQuote } from "@/services/quote.service";
import { useQuotes } from "@/hooks/useQuotes";
import { QuoteComposer } from "@/components/quotes/QuoteComposer";
import { QuoteDetailModal } from "@/components/quotes/QuoteDetailModal";
import { QuoteCard } from "@/components/quotes/QuoteCard";
import { QuoteSkeletonGrid } from "@/components/quotes/QuoteSkeleton";
import type { Quote } from "@/types/quote.type";

export default function QuotePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    quotes,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    reload,
    deleteQuoteOptimistic,
  } = useQuotes(9);

  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Handle creating a new quote
  const handleCreate = async (values: { text: string }) => {
    setCreateError(null);
    setIsCreating(true);

    try {
      await createQuote(values);
      toast.success("Quote posted. Refresh to see it.");
      return true;
    } catch (createError) {
      const message =
        (createError as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create quote.";
      setCreateError(message);
      toast.error(message);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  // Handle deleting a quote
  const handleDelete = async (quote: Quote) => {
    setDeletingId(quote.id);

    try {
      await deleteQuoteOptimistic(quote.id);
      toast.success("Quote deleted.");
    } catch {
      toast.error("Failed to delete quote.");
    } finally {
      setDeletingId(null);
    }
  };

  const isOwner = (quote: Quote) =>
    isAuthenticated && user && String(user.id) === String(quote.owner?.id);

  const handleComposerOpenChange = (open: boolean) => {
    setIsComposerOpen(open);
    if (!open) {
      setCreateError(null);
    }
  };

  const handleComposerSubmit = async (values: { text: string }) => {
    const success = await handleCreate(values);
    if (success) {
      setIsComposerOpen(false);
    }
    return success;
  };

  const statusLabel = isAuthenticated ? "Signed in" : "Guest";

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore || loadMoreError) {
      return;
    }

    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { root: null, rootMargin: "0px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMoreError, loadMore]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f16] text-white font-['Space_Grotesk']">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1220] via-[#0a0f16] to-[#05070c]" />
      <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[160px]" />
      <div className="absolute bottom-[-120px] right-[-40px] h-[360px] w-[360px] rounded-full bg-blue-500/20 blur-[140px]" />
      <div className="absolute top-24 left-[-120px] h-[240px] w-[240px] rounded-full bg-indigo-500/15 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,rgba(255,255,255,0.02))]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Quote feed</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Quotes</h1>
              <p className="mt-2 text-sm text-white/60">
                A curated stream of thoughts from the Quotie community.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              {statusLabel}
            </span>
            <Button
              type="button"
              id="new-quote-button"
              onClick={() => {
                setCreateError(null);
                setIsComposerOpen(true);
              }}
              className="h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(34,211,238,0.35)] transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-400 hover:shadow-[0_16px_30px_rgba(34,211,238,0.45)] focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-0"
            >
              <Plus className="h-4 w-4" />
              New quote
            </Button>
            <Button
              type="button"
              id="refresh-button"
              onClick={reload}
              disabled={isLoading}
              className="h-9 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white/80 transition-all hover:border-cyan-400/40 hover:text-white"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        <Dialog open={isComposerOpen} onOpenChange={handleComposerOpenChange}>
          <DialogContent className="border-white/10 bg-[#0b1220] text-white shadow-[0_30px_80px_rgba(8,15,26,0.7)]">
            <DialogHeader>
              <DialogTitle>Share a new quote</DialogTitle>
              <DialogDescription className="text-white/60">
                Post something memorable to the community.
              </DialogDescription>
            </DialogHeader>
            <QuoteComposer
              isAuthenticated={isAuthenticated}
              isSubmitting={isCreating}
              submitError={createError}
              onSubmit={handleComposerSubmit}
              onLogin={() => {
                setIsComposerOpen(false);
                navigate("/login");
              }}
            />
          </DialogContent>
        </Dialog>

        <section aria-live="polite" className="space-y-6">
          {isLoading && quotes.length === 0 && <QuoteSkeletonGrid count={6} />}

          {error && quotes.length === 0 && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
              <p className="text-sm text-rose-200">{error}</p>
              <Button
                type="button"
                onClick={reload}
                className="mt-4 h-9 rounded-xl bg-white/10 text-xs font-semibold text-white/80 hover:bg-white/20"
              >
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !error && quotes.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              <p className="text-lg font-semibold text-white">No quotes yet</p>
              <p className="mt-2 text-sm text-white/60">
                Start the conversation by sharing a new quote.
              </p>
              {!isAuthenticated && (
                <Button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-4 h-9 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white/80 transition-all hover:border-cyan-400/40 hover:text-white"
                >
                  Login to post
                </Button>
              )}
            </div>
          )}

          {quotes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotes.map((quote) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  canDelete={!!isOwner(quote)}
                  isDeleting={deletingId === quote.id}
                  onOpen={setSelectedQuote}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {loadMoreError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-xs text-rose-200">
              <p>{loadMoreError}</p>
              <Button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="mt-3 h-8 rounded-xl border border-rose-300/30 bg-rose-500/10 text-xs font-semibold text-rose-100 transition-all hover:bg-rose-500/20"
              >
                Try again
              </Button>
            </div>
          )}
        </section>

        {quotes.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            {isLoadingMore && (
              <p className="text-xs text-white/50">Loading more quotes...</p>
            )}
            {!hasMore && !isLoadingMore && (
              <p className="text-xs text-white/40">No more quotes to load.</p>
            )}
            <div ref={loadMoreRef} className="h-6 w-full" />
          </div>
        )}
      </div>

      <QuoteDetailModal quote={selectedQuote} onClose={() => setSelectedQuote(null)} />
    </div>
  );
}
