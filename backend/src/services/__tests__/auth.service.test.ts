import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthService } from "../auth.service";
import { UserRole } from "../../entities/User";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");

function mockUserRepo() {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };
}

function mockRefreshTokenRepo() {
  return {
    findValidByTokenHash: jest.fn(),
    revokeAllForUser: jest.fn(),
    revoke: jest.fn(),
    revokeByTokenHash: jest.fn(),
    create: jest.fn(),
  };
}

function buildUser(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: "hashed_password",
    role: UserRole.REGULAR,
    ...overrides,
  };
}

function buildRefreshTokenRecord(overrides: Record<string, any> = {}) {
  return {
    id: 10,
    userId: 1,
    tokenHash: "abc123hash",
    revoked: false,
    expiresAt: new Date("2026-01-08T00:00:00.000Z"),
    user: buildUser(),
    ...overrides,
  };
}

describe("AuthService", () => {
  let userRepo: ReturnType<typeof mockUserRepo>;
  let refreshTokenRepo: ReturnType<typeof mockRefreshTokenRepo>;
  let authService: AuthService;
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  const mockedJwt = jwt as jest.Mocked<typeof jwt>;

  beforeEach(() => {
    userRepo = mockUserRepo();
    refreshTokenRepo = mockRefreshTokenRepo();
    authService = new AuthService(userRepo as any, refreshTokenRepo as any);

    jest.spyOn(crypto, "randomBytes").mockReturnValue(Buffer.from("a".repeat(64)) as any);
    mockedJwt.sign.mockReturnValue("access-token" as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("login", () => {
    it("should return tokens when credentials are valid", async () => {
      const user = buildUser({ id: 7 });
      userRepo.findByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      refreshTokenRepo.create.mockResolvedValue({} as any);

      const result = await authService.login("test@example.com", "password123");

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe(Buffer.from("a".repeat(64)).toString("hex"));
    });

    it("should throw Invalid credentials when user is not found", async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(authService.login("test@example.com", "password123")).rejects.toThrow("Invalid credentials");
    });

    it("should throw Invalid credentials when password is wrong", async () => {
      userRepo.findByEmail.mockResolvedValue(buildUser());
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(authService.login("test@example.com", "wrong-password")).rejects.toThrow("Invalid credentials");
    });

    it("should use the same error message whether email or password is wrong", async () => {
      userRepo.findByEmail.mockResolvedValueOnce(null);
      await expect(authService.login("missing@example.com", "password123")).rejects.toThrow("Invalid credentials");

      userRepo.findByEmail.mockResolvedValueOnce(buildUser());
      mockedBcrypt.compare.mockResolvedValueOnce(false as never);
      await expect(authService.login("test@example.com", "wrong-password")).rejects.toThrow("Invalid credentials");
    });

    it("should normalize email before querying -- lowercase and trimmed", async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(authService.login("  USER@Example.COM  ", "password123")).rejects.toThrow("Invalid credentials");

      expect(userRepo.findByEmail).toHaveBeenCalledWith("user@example.com");
    });

    it("should not call bcrypt.compare when user is not found", async () => {
      userRepo.findByEmail.mockResolvedValue(null);

      await expect(authService.login("missing@example.com", "password123")).rejects.toThrow("Invalid credentials");

      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe("register", () => {
    it("should return tokens when registration succeeds", async () => {
      const savedUser = buildUser({ id: 11, email: "new@example.com" });
      userRepo.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as never);
      userRepo.save.mockResolvedValue(savedUser);
      refreshTokenRepo.create.mockResolvedValue({} as any);

      const result = await authService.register("New User", "new@example.com", "password123");

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe(Buffer.from("a".repeat(64)).toString("hex"));
    });

    it("should throw User already exists when email is already registered", async () => {
      userRepo.findByEmail.mockResolvedValue(buildUser());

      await expect(authService.register("New User", "test@example.com", "password123")).rejects.toThrow("User already exists");
    });

    it("should hash the password with salt rounds of 10 before saving", async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as never);
      userRepo.save.mockResolvedValue(buildUser({ id: 12, email: "new@example.com" }));
      refreshTokenRepo.create.mockResolvedValue({} as any);

      await authService.register("New User", "new@example.com", "password123");

      expect(mockedBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        email: "new@example.com",
        name: "New User",
        password: "hashed_password",
      }));
    });

    it("should not save user when email already exists", async () => {
      userRepo.findByEmail.mockResolvedValue(buildUser());

      await expect(authService.register("New User", "test@example.com", "password123")).rejects.toThrow("User already exists");

      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("should normalize email before checking existence -- lowercase and trimmed", async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue("hashed_password" as never);
      userRepo.save.mockResolvedValue(buildUser({ id: 13, email: "user@example.com" }));
      refreshTokenRepo.create.mockResolvedValue({} as any);

      await authService.register("New User", "  USER@Example.COM  ", "password123");

      expect(userRepo.findByEmail).toHaveBeenCalledWith("user@example.com");
    });
  });

  describe("refresh", () => {
    it("should return new tokens when refresh token is valid", async () => {
      const record = buildRefreshTokenRecord();
      refreshTokenRepo.findValidByTokenHash.mockResolvedValue(record);
      refreshTokenRepo.revoke.mockResolvedValue(undefined as any);
      refreshTokenRepo.create.mockResolvedValue({} as any);

      const result = await authService.refresh("valid-refresh-token");

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe(Buffer.from("a".repeat(64)).toString("hex"));
    });

    it("should throw when refresh token string is empty", async () => {
      await expect(authService.refresh("")).rejects.toThrow("Refresh token is required");
    });

    it("should throw when token is not found in database", async () => {
      refreshTokenRepo.findValidByTokenHash.mockResolvedValue(null);

      await expect(authService.refresh("missing-token")).rejects.toThrow("Invalid or expired refresh token");
    });

    it("should throw and revoke all sessions when a revoked token is reused", async () => {
      const record = buildRefreshTokenRecord({ revoked: true, userId: 42 });
      refreshTokenRepo.findValidByTokenHash.mockResolvedValue(record);

      await expect(authService.refresh("reused-token")).rejects.toThrow("Token reuse detected. All sessions revoked.");

      expect(refreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(42);
    });

    it("should revoke the current token before issuing a new one", async () => {
      const record = buildRefreshTokenRecord({ id: 99 });
      refreshTokenRepo.findValidByTokenHash.mockResolvedValue(record);
      refreshTokenRepo.revoke.mockResolvedValue(undefined as any);
      refreshTokenRepo.create.mockResolvedValue({} as any);

      await authService.refresh("valid-refresh-token");

      expect(refreshTokenRepo.revoke).toHaveBeenCalledWith(99);
    });

    it("should hash the incoming token string before querying", async () => {
      refreshTokenRepo.findValidByTokenHash.mockResolvedValue(null);
      const rawToken = "plain-refresh-token";
      const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await expect(authService.refresh(rawToken)).rejects.toThrow("Invalid or expired refresh token");

      expect(refreshTokenRepo.findValidByTokenHash).toHaveBeenCalledWith(expectedHash);
    });

    it("should preserve the original expiration date when rotating", async () => {
      const expiresAt = new Date("2026-02-01T00:00:00.000Z");
      const record = buildRefreshTokenRecord({ expiresAt });
      refreshTokenRepo.findValidByTokenHash.mockResolvedValue(record);
      refreshTokenRepo.revoke.mockResolvedValue(undefined as any);
      refreshTokenRepo.create.mockResolvedValue({} as any);

      await authService.refresh("valid-refresh-token");

      expect(refreshTokenRepo.create).toHaveBeenCalledWith(expect.objectContaining({ expiresAt }));
    });
  });

  describe("logout", () => {
    it("should revoke the token when a token string is provided", async () => {
      refreshTokenRepo.revokeByTokenHash.mockResolvedValue(undefined as any);

      await authService.logout("logout-token");

      expect(refreshTokenRepo.revokeByTokenHash).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when token string is empty", async () => {
      await expect(authService.logout("")).resolves.toBeUndefined();

      expect(refreshTokenRepo.revokeByTokenHash).not.toHaveBeenCalled();
    });

    it("should hash the token before revoking", async () => {
      refreshTokenRepo.revokeByTokenHash.mockResolvedValue(undefined as any);
      const rawToken = "logout-token";
      const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await authService.logout(rawToken);

      expect(refreshTokenRepo.revokeByTokenHash).toHaveBeenCalledWith(expectedHash);
    });
  });

  describe("logoutAll", () => {
    it("should revoke all tokens for the given user", async () => {
      refreshTokenRepo.revokeAllForUser.mockResolvedValue(undefined as any);

      await authService.logoutAll(55);

      expect(refreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(55);
    });
  });

  describe("verifyAccessToken", () => {
    it("should return decoded payload when token is valid", () => {
      mockedJwt.verify.mockReturnValue({ sub: 1, role: UserRole.REGULAR } as any);

      const result = authService.verifyAccessToken("valid-token");

      expect(result).toEqual({ sub: 1, role: UserRole.REGULAR });
    });

    it("should throw when jwt.verify throws", () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error("bad token");
      });

      expect(() => authService.verifyAccessToken("invalid-token")).toThrow("Invalid or expired access token");
    });

    it("should throw when decoded value is a plain string", () => {
      mockedJwt.verify.mockReturnValue("plain-string" as any);

      expect(() => authService.verifyAccessToken("string-token")).toThrow("Invalid or expired access token");
    });
  });
});