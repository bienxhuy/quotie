import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

/**
 * Authentication middleware
 * Verifies JWT access token from Authorization header
 */
export const authenticate = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          status: "error",
          message: "Access token is required",
        });
        return;
      }

      // Extract token
      const token = authHeader.substring(7);

      // Verify token
      const payload = authService.verifyAccessToken(token);

      // Attach user info to request
      (req as any).user = null;

      next();
    } catch (error) {
      res.status(401).json({
        status: "error",
        message: "Invalid or expired access token",
      });
    }
  };
};

/**
 * Authorization middleware for role-based access control
 * Need to be used after authentication middleware, which populates req.user
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        status: "error",
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};
