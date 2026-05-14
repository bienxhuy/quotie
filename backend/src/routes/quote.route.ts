import { Router } from "express";
import { AppDataSource } from "../data-source";
import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshToken.repository";
import { QuoteRepository } from "../repositories/quote.repository";
import { AuthService } from "../services/auth.service";
import { QuoteService } from "../services/quote.service";
import { QuoteController } from "../controllers/quote.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

const userRepository = new UserRepository(AppDataSource);
const refreshTokenRepository = new RefreshTokenRepository(AppDataSource);
const quoteRepository = new QuoteRepository(AppDataSource);

const authService = new AuthService(userRepository, refreshTokenRepository);
const quoteService = new QuoteService(quoteRepository, userRepository);

const quoteController = new QuoteController(quoteService);

/**
 * @swagger
 * /api/quotes:
 *   get:
 *     summary: Get paginated quotes
 *     description: Public endpoint to list quotes with pagination and total amount
 *     tags: [Quotes]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Quotes fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuotesListResponse'
 *       400:
 *         description: Invalid pagination query params
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", quoteController.getQuotes);

/**
 * @swagger
 * /api/quotes:
 *   post:
 *     summary: Create a quote
 *     description: Authenticated users can create a new quote
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuoteRequest'
 *     responses:
 *       201:
 *         description: Quote created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuoteResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", authenticate(authService), quoteController.createQuote);

/**
 * @swagger
 * /api/quotes:
 *   delete:
 *     summary: Delete a quote
 *     description: Authenticated users can delete their own quote by id
 *     tags: [Quotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteQuoteRequest'
 *     responses:
 *       204:
 *         description: Quote deleted successfully
 *       400:
 *         description: Invalid quote id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not quote owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Quote not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/", authenticate(authService), quoteController.deleteQuote);

export default router;
