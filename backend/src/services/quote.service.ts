import { Quote } from "../entities/Quote";
import { QuoteRepository } from "../repositories/quote.repository";
import { UserRepository } from "../repositories/user.repository";

interface PaginatedQuotesResult {
  quotes: Quote[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export class QuoteService {
  private quoteRepo: QuoteRepository;
  private userRepo: UserRepository;

  constructor(quoteRepository: QuoteRepository, userRepository: UserRepository) {
    this.quoteRepo = quoteRepository;
    this.userRepo = userRepository;
  }

  async getQuotes(page: number, limit: number): Promise<PaginatedQuotesResult> {
    const skip = (page - 1) * limit;
    const [quotes, totalItems] = await this.quoteRepo.findPaginated(skip, limit);

    return {
      quotes,
      page,
      limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
    };
  }

  async createQuote(text: string, ownerId: number): Promise<Quote> {
    const owner = await this.userRepo.findById(ownerId);
    if (!owner) {
      throw new Error("User not found");
    }

    const quote = new Quote(text.trim(), ownerId);
    const savedQuote = await this.quoteRepo.save(quote);
    savedQuote.owner = owner;

    return savedQuote;
  }

  async deleteQuote(quoteId: number, requesterId: number): Promise<void> {
    const quote = await this.quoteRepo.findById(quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.ownerId !== requesterId) {
      throw new Error("You can only delete your own quotes");
    }

    await this.quoteRepo.delete(quoteId);
  }
}
