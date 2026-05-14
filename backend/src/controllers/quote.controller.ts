import { Request, Response } from "express";
import { Quote } from "../entities/Quote";
import { QuoteService } from "../services/quote.service";
import { QuoteListResponse, QuoteResponse } from "../types/quote.types";

export class QuoteController {
  private quoteService: QuoteService;

  constructor(quoteService: QuoteService) {
    this.quoteService = quoteService;
  }

  getQuotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      if (!Number.isInteger(page) || page <= 0 || !Number.isInteger(limit) || limit <= 0 || limit > 100) {
        res.status(400).json({
          status: "error",
          message: "Query params page and limit must be positive integers",
        });
        return;
      }

      const result = await this.quoteService.getQuotes(page, limit);

      const data: QuoteListResponse = {
        // TODO: We should ideally not return the entire Quote entity here, but rather a DTO that only includes the necessary fields. For simplicity, I'm returning the Quote entity directly, but this is something to consider for future refactoring.
        quotes: result.quotes.map((quote) => this.serializeQuote(quote)),
        pagination: {
          page: result.page,
          limit: result.limit,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
        },
      };

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      console.error("Get quotes error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };

  createQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const ownerId = (req as any).user?.sub;
      const { text } = req.body;

      if (!ownerId) {
        res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
        return;
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        res.status(400).json({
          status: "error",
          message: "Text is required",
        });
        return;
      }

      const quote = await this.quoteService.createQuote(text, ownerId);

      res.status(201).json({
        status: "success",
        // TODO: Similar to the getQuotes method, we should ideally return a DTO here instead of the entire Quote entity. For simplicity, I'm returning the Quote entity directly, but this is something to consider for future refactoring.
        data: this.serializeQuote(quote),
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
        return;
      }

      console.error("Create quote error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };

  deleteQuote = async (req: Request, res: Response): Promise<void> => {
    try {
      const requesterId = (req as any).user?.sub;
      const quoteId = Number(req.body?.id);

      if (!requesterId) {
        res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
        return;
      }

      if (!Number.isInteger(quoteId) || quoteId <= 0) {
        res.status(400).json({
          status: "error",
          message: "Quote id is required and must be a positive integer",
        });
        return;
      }

      await this.quoteService.deleteQuote(quoteId, requesterId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === "Quote not found") {
        res.status(404).json({
          status: "error",
          message: error.message,
        });
        return;
      }

      if (error instanceof Error && error.message === "You can only delete your own quotes") {
        res.status(403).json({
          status: "error",
          message: error.message,
        });
        return;
      }

      console.error("Delete quote error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };

  private serializeQuote(quote: Quote): QuoteResponse {
    return {
      id: quote.id,
      text: quote.text,
      owner: {
        id: quote.owner.id,
        name: quote.owner.name,
        email: quote.owner.email,
        role: quote.owner.role,
      },
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }
}
