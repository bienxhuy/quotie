import { Request, Response } from "express";
import { authenticate, authorize } from "../auth.middleware";
import { UserRole } from "../../entities/User";

function mockAuthService() {
  return {
    verifyAccessToken: jest.fn(),
  };
}

function mockReq(overrides: Record<string, any> = {}): Partial<Request> {
  return { headers: {}, ...overrides };
}

function mockRes(): Partial<Response> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("authenticate", () => {
  let authService: ReturnType<typeof mockAuthService>;
  let middleware: ReturnType<typeof authenticate>;
  let next: jest.Mock;

  beforeEach(() => {
    authService = mockAuthService();
    middleware = authenticate(authService as any);
    next = jest.fn();
  });

  it("should call next and attach payload when token is valid", async () => {
    const req = mockReq({ headers: { authorization: "Bearer validtoken" } });
    const res = mockRes();
    const payload = { sub: 1, role: UserRole.REGULAR };
    authService.verifyAccessToken.mockReturnValue(payload);

    await middleware(req as any, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).user).toEqual(payload);
  });

  it("should return 401 when Authorization header is missing", async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();

    await middleware(req as any, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when Authorization header does not start with Bearer", async () => {
    const req = mockReq({ headers: { authorization: "Basic abc123" } });
    const res = mockRes();

    await middleware(req as any, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when Authorization header is Bearer with no token", async () => {
    const req = mockReq({ headers: { authorization: "Bearer " } });
    const res = mockRes();
    authService.verifyAccessToken.mockImplementation(() => {
      throw new Error("Invalid or expired access token");
    });

    await middleware(req as any, res as Response, next);

    expect(authService.verifyAccessToken).toHaveBeenCalledWith("");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when verifyAccessToken throws", async () => {
    const req = mockReq({ headers: { authorization: "Bearer badtoken" } });
    const res = mockRes();
    authService.verifyAccessToken.mockImplementation(() => {
      throw new Error("internal failure");
    });

    await middleware(req as any, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should not expose error details in the response", async () => {
    const req = mockReq({ headers: { authorization: "Bearer badtoken" } });
    const res = mockRes();
    authService.verifyAccessToken.mockImplementation(() => {
      throw new Error("very specific internal failure");
    });

    await middleware(req as any, res as Response, next);

    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Invalid or expired access token",
    });
  });
});

describe("authorize", () => {
  let next: jest.Mock;

  beforeEach(() => {
    next = jest.fn();
  });

  it("should call next when user role is in allowed list", () => {
    const req = mockReq({ user: { sub: 1, role: UserRole.ADMIN } });
    const res = mockRes();

    authorize(UserRole.ADMIN)(req as any, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should call next when user role matches one of multiple allowed roles", () => {
    const req = mockReq({ user: { sub: 1, role: UserRole.REGULAR } });
    const res = mockRes();

    authorize(UserRole.ADMIN, UserRole.REGULAR)(req as any, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should return 403 when user role is not in allowed list", () => {
    const req = mockReq({ user: { sub: 1, role: UserRole.REGULAR } });
    const res = mockRes();

    authorize(UserRole.ADMIN)(req as any, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when req.user is not set", () => {
    const req = mockReq();
    const res = mockRes();

    authorize(UserRole.ADMIN)(req as any, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 with correct message body", () => {
    const req = mockReq({ user: { sub: 1, role: UserRole.REGULAR } });
    const res = mockRes();

    authorize(UserRole.ADMIN)(req as any, res as Response, next);

    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Insufficient permissions",
    });
  });

  it("should return 401 with correct message body", () => {
    const req = mockReq();
    const res = mockRes();

    authorize(UserRole.ADMIN)(req as any, res as Response, next);

    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Authentication required",
    });
  });
});