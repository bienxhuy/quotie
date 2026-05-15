import { useCallback, useEffect, useState } from "react";
import { deleteQuote, getQuotes } from "@/services/quote.service";
import type { Quote } from "@/types/quote.type";

type UseQuotesResult = {
  quotes: Quote[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  deleteQuoteOptimistic: (id: number) => Promise<void>;
};

const DEFAULT_LIMIT = 9;

export function useQuotes(limit: number = DEFAULT_LIMIT): UseQuotesResult {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const result = await getQuotes({ page: pageToLoad, limit });
      setQuotes((current) => (replace ? result.quotes : [...current, ...result.quotes]));
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    },
    [limit]
  );

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadMoreError(null);

    try {
      await fetchPage(1, true);
    } catch {
      setError("Failed to load quotes.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || page >= totalPages) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      await fetchPage(page + 1, false);
    } catch {
      setLoadMoreError("Failed to load more quotes.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, isLoading, isLoadingMore, page, totalPages]);

  const reload = useCallback(async () => {
    await loadInitial();
  }, [loadInitial]);

  const deleteQuoteOptimistic = useCallback(async (id: number) => {
    let previousQuotes: Quote[] = [];

    setQuotes((current) => {
      previousQuotes = current;
      return current.filter((quote) => quote.id !== id);
    });

    try {
      await deleteQuote({ id });
    } catch (deleteError) {
      setQuotes(previousQuotes);
      throw deleteError;
    }
  }, []);

  const hasMore = page < totalPages;

  return {
    quotes,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    reload,
    deleteQuoteOptimistic,
  };
}
