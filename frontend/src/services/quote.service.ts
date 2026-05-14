import axiosInstance from "@/lib/axios";
import { ApiResponse } from "@/types/api.type";
import type { Quote } from "@/types/quote.type";

type QuoteList = {
  quotes: Quote[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

type CreateQuoteRequest = {
  text: string;
};

type DeleteQuoteRequest = {
  id: number;
};

type QuoteListResponse = ApiResponse<QuoteList>;
type QuoteResponse = ApiResponse<Quote>;

type QuoteListParams = {
  page?: number;
  limit?: number;
};

/**
 * Get paginated quotes
 */
export async function getQuotes(params: QuoteListParams = {}): Promise<QuoteList> {
  const response = await axiosInstance.get<QuoteListResponse>(
    "/api/quotes",
    { params }
  );
  return response.data.data;
}

/**
 * Create a new quote
 */
export async function createQuote(data: CreateQuoteRequest): Promise<Quote> {
  const response = await axiosInstance.post<QuoteResponse>(
    "/api/quotes",
    data
  );
  return response.data.data;
}

/**
 * Delete a quote by id
 */
export async function deleteQuote(data: DeleteQuoteRequest): Promise<void> {
  await axiosInstance.delete("/api/quotes", { data });
}
