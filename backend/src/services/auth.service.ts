import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserRepository } from "../repositories/user.repository";
import { RefreshTokenRepository } from "../repositories/refreshToken.repository";
import { User } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";

// Types for AuthService
// Reuse purpose
interface CustomJwtPayload {
  sub: number; // User ID
  role: string;
}

// Response type for login and refresh operations in AuthService
// Reuse purpose
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepo: UserRepository;
  private refreshTokenRepo: RefreshTokenRepository;
  private jwtAccessSecret: string;
  private jwtAccessExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor(
    userRepository: UserRepository,
    refreshTokenRepository: RefreshTokenRepository
  ) {
    this.userRepo = userRepository;
    this.refreshTokenRepo = refreshTokenRepository;
    this.jwtAccessSecret = process.env.JWT_ACCESS_SECRET || "default_access_secret";
    this.jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  }

  /**
   * Login user with email and password
   * Returns access token and refresh token
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateAndStoreRefreshToken(user);

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User(email, name, hashedPassword);
    const savedUser = await this.userRepo.save(user);

    // Generate tokens
    const accessToken = this.generateAccessToken(savedUser);
    const refreshToken = await this.generateAndStoreRefreshToken(savedUser);

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation (single-use refresh tokens)
   */
  async refresh(refreshTokenString: string): Promise<LoginResponse> {
    if (!refreshTokenString) {
      throw new Error("Refresh token is required");
    }

    // Hash the incoming refresh token
    const tokenHash = this.hashToken(refreshTokenString);

    // Find valid refresh token in database
    const refreshTokenRecord = await this.refreshTokenRepo.findValidByTokenHash(tokenHash);
    
    if (!refreshTokenRecord) {
      throw new Error("Invalid or expired refresh token");
    }

    // Check if token was already used (reuse detection)
    if (refreshTokenRecord.revoked) {
      // Token reuse detected - security event
      // Revoke all tokens for this user
      await this.refreshTokenRepo.revokeAllForUser(refreshTokenRecord.userId);
      throw new Error("Token reuse detected. All sessions revoked.");
    }

    // In case of valid token, proceed with rotation:
    // Mark current refresh token as revoked (single-use)
    await this.refreshTokenRepo.revoke(refreshTokenRecord.id);

    // Get user
    const user = refreshTokenRecord.user;

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    // Generate new refresh token with same expiration
    const newRefreshToken = await this.generateAndStoreRefreshToken(
      user,
      refreshTokenRecord.expiresAt
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshTokenString: string): Promise<void> {
    if (!refreshTokenString) {
      return; // No token to revoke
    }

    const tokenHash = this.hashToken(refreshTokenString);
    await this.refreshTokenRepo.revokeByTokenHash(tokenHash);
  }

  /**
   * Logout user from all devices by revoking all refresh tokens
   */
  async logoutAll(userId: number): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userId);
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): CustomJwtPayload {
    try {
      const decoded = jwt.verify(token, this.jwtAccessSecret);
      if (typeof decoded === 'string') {
        throw new Error("Invalid token format");
      }
      return decoded as unknown as CustomJwtPayload;
    } catch (error) {
      throw new Error("Invalid or expired access token");
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      role: user.role,
    };

    const options: jwt.SignOptions = {
      expiresIn: this.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
    };

    return jwt.sign(payload, this.jwtAccessSecret, options);
  }

  /**
   * Generate and store refresh token
   */
  async generateAndStoreRefreshToken(
    user: User,
    expiresAt?: Date
  ): Promise<string> {
    // Generate random refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // Hash the token for storage
    const tokenHash = this.hashToken(refreshToken);

    // Calculate expiration date if not provided
    if (!expiresAt) {
      const expiresInMs = this.parseExpiresIn(this.jwtRefreshExpiresIn);
      expiresAt = new Date(Date.now() + expiresInMs);
    }

    // Store hashed token in database
    const refreshTokenEntity = new RefreshToken(user.id, tokenHash, expiresAt);
    await this.refreshTokenRepo.create(refreshTokenEntity);

    // Return plain token to send to client
    return refreshToken;
  }

  /**
   * Hash token using SHA256
   */
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Parse expiration string to milliseconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const units: { [key: string]: number } = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error("Invalid expiration format");
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    return value * units[unit];
  }

  /**
   * Get user from access token
   */
  async getUserFromToken(accessToken: string): Promise<User> {
    const decoded = this.verifyAccessToken(accessToken);
    const user = await this.userRepo.findById(decoded.sub);
    
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}
