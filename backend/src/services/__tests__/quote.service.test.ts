import { QuoteService } from "../quote.service";
import { UserRole } from "../../entities/User";

function mockQuoteRepo() {
  return {
    findPaginated: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };
}

function mockUserRepo() {
  return {
    findById: jest.fn(),
  };
}

function buildUser(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: UserRole.REGULAR,
    ...overrides,
  };
}

function buildQuote(overrides: Record<string, any> = {}) {
  return {
    id: 42,
    text: "Test quote text",
    ownerId: 1,
    owner: buildUser(),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("QuoteService", () => {
  let quoteRepo: ReturnType<typeof mockQuoteRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let quoteService: QuoteService;

  beforeEach(() => {
    quoteRepo = mockQuoteRepo();
    userRepo = mockUserRepo();
    quoteService = new QuoteService(quoteRepo as any, userRepo as any);
  });

  describe("getQuotes", () => {
    it("should return paginated result with correct shape", async () => {
      const quotes = [buildQuote({ id: 1 }), buildQuote({ id: 2 })];
      quoteRepo.findPaginated.mockResolvedValue([quotes, 25]);

      const result = await quoteService.getQuotes(2, 10);

      expect(result).toEqual({
        quotes,
        page: 2,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
      });
    });

    it("should calculate totalPages correctly for exact division", async () => {
      quoteRepo.findPaginated.mockResolvedValue([[], 20]);

      const result = await quoteService.getQuotes(1, 10);

      expect(result.totalPages).toBe(2);
    });

    it("should return totalPages of 0 when there are no items", async () => {
      quoteRepo.findPaginated.mockResolvedValue([[], 0]);

      const result = await quoteService.getQuotes(1, 10);

      expect(result.totalPages).toBe(0);
    });

    it("should calculate skip as (page-1) * limit", async () => {
      quoteRepo.findPaginated.mockResolvedValue([[], 0]);

      await quoteService.getQuotes(3, 5);

      expect(quoteRepo.findPaginated).toHaveBeenCalledWith(10, 5);
    });

    it("should pass limit to repository unchanged", async () => {
      quoteRepo.findPaginated.mockResolvedValue([[], 0]);

      await quoteService.getQuotes(4, 17);

      expect(quoteRepo.findPaginated).toHaveBeenCalledWith(expect.any(Number), 17);
    });
  });

  describe("createQuote", () => {
    it("should return saved quote with owner attached", async () => {
      const owner = buildUser({ id: 7 });
      const savedQuote = buildQuote({ owner: undefined, ownerId: 7, text: "Hello world" });
      userRepo.findById.mockResolvedValue(owner);
      quoteRepo.save.mockResolvedValue(savedQuote);

      const result = await quoteService.createQuote(" Hello world ", 7);

      expect(result.owner).toBe(owner);
    });

    it("should throw User not found when owner does not exist", async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(quoteService.createQuote("Hello world", 7)).rejects.toThrow("User not found");
    });

    it("should trim whitespace from text before saving", async () => {
      const owner = buildUser({ id: 7 });
      userRepo.findById.mockResolvedValue(owner);
      quoteRepo.save.mockResolvedValue(buildQuote({ owner }));

      await quoteService.createQuote("  Hello world  ", 7);

      expect(quoteRepo.save).toHaveBeenCalledWith(expect.objectContaining({ text: "Hello world" }));
    });

    it("should not call save when user is not found", async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(quoteService.createQuote("Hello world", 7)).rejects.toThrow("User not found");

      expect(quoteRepo.save).not.toHaveBeenCalled();
    });
  });

  describe("deleteQuote", () => {
    it("should delete quote when requester is the owner", async () => {
      quoteRepo.findById.mockResolvedValue(buildQuote({ ownerId: 9 }));
      quoteRepo.delete.mockResolvedValue(undefined as any);

      await expect(quoteService.deleteQuote(42, 9)).resolves.toBeUndefined();

      expect(quoteRepo.delete).toHaveBeenCalledWith(42);
    });

    it("should throw Quote not found when quote does not exist", async () => {
      quoteRepo.findById.mockResolvedValue(null);

      await expect(quoteService.deleteQuote(42, 9)).rejects.toThrow("Quote not found");
    });

    it("should throw when requester is not the owner", async () => {
      quoteRepo.findById.mockResolvedValue(buildQuote({ ownerId: 9 }));

      await expect(quoteService.deleteQuote(42, 10)).rejects.toThrow("You can only delete your own quotes");
    });

    it("should not call delete when quote is not found", async () => {
      quoteRepo.findById.mockResolvedValue(null);

      await expect(quoteService.deleteQuote(42, 9)).rejects.toThrow("Quote not found");

      expect(quoteRepo.delete).not.toHaveBeenCalled();
    });

    it("should not call delete when requester is not the owner", async () => {
      quoteRepo.findById.mockResolvedValue(buildQuote({ ownerId: 9 }));

      await expect(quoteService.deleteQuote(42, 10)).rejects.toThrow("You can only delete your own quotes");

      expect(quoteRepo.delete).not.toHaveBeenCalled();
    });
  });
});