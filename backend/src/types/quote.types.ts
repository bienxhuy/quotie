export interface CreateQuoteRequest {
  text: string;
}

export interface DeleteQuoteRequest {
  id: number;
}

export interface QuoteOwnerResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface QuoteResponse {
  id: number;
  text: string;
  owner: QuoteOwnerResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteListResponse {
  quotes: QuoteResponse[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
