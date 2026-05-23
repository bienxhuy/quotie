import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { User } from "../entities/User";
import { parseExpiresIn } from "../utils/parse-expires-in";

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Register a new user
   * POST /auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      // Validate input
      if (!name || !email || !password) {
        res.status(400).json({
          status: "error",
          message: "Name, email, and password are required",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          status: "error",
          message: "Invalid email format",
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          status: "error",
          message: "Password must be at least 6 characters",
        });
        return;
      }

      // Register user
      const { accessToken, refreshToken } = await this.authService.register(
        name,
        email,
        password
      );

      // Set refresh token as HttpOnly cookie
      this.setRefreshTokenCookie(res, refreshToken);

      // Get user data
      const user = await this.authService.getUserFromToken(accessToken);

      // Return access token and user data
      res.status(201).json({
        status: "success",
        data: { 
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        res.status(409).json({
          status: "error",
          message: error.message,
        });
      } else {
        console.error("Register error:", error);
        res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Login user
   * POST /auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          status: "error",
          message: "Email and password are required",
        });
        return;
      }

      // Login user
      const { accessToken, refreshToken } = await this.authService.login(
        email,
        password
      );

      // Set refresh token as HttpOnly cookie
      this.setRefreshTokenCookie(res, refreshToken);

      // Get user data
      const user = await this.authService.getUserFromToken(accessToken);

      // Return access token and user data
      res.status(200).json({
        status: "success",
        data: { 
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        res.status(401).json({
          status: "error",
          message: error.message,
        });
      } else {
        console.error("Login error:", error);
        res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          status: "error",
          message: "Refresh token is required",
        });
        return;
      }

      // Refresh tokens
      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refresh(refreshToken);

      // Set new refresh token as HttpOnly cookie
      this.setRefreshTokenCookie(res, newRefreshToken);

      // Return new access token
      res.status(200).json({
        status: "success",
        data: { accessToken },
      });
    } catch (error) {
      // Clear cookie on any error
      this.clearRefreshTokenCookie(res);

      if (
        error instanceof Error &&
        (error.message.includes("Invalid or expired") ||
          error.message.includes("Token reuse detected"))
      ) {
        res.status(401).json({
          status: "error",
          message: error.message,
        });
      } else {
        console.error("Refresh error:", error);
        res.status(500).json({
          status: "error",
          message: "Internal server error",
        });
      }
    }
  };

  /**
   * Logout user
   * POST /auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      this.clearRefreshTokenCookie(res);

      res.status(204).send();
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear cookie even on error
      this.clearRefreshTokenCookie(res);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };

  /**
   * Logout from all devices
   * POST /auth/logout-all
   */
  logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user?.sub;

      if (!userId) {
        res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
        return;
      }

      await this.authService.logoutAll(userId);

      // Clear refresh token cookie
      this.clearRefreshTokenCookie(res);

      res.status(204).send();
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };

  /**
   * Set refresh token cookie
   */
  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    let maxAge: number;

    try {
      maxAge = parseExpiresIn(expiresIn);
    } catch {
      maxAge = 7 * 24 * 60 * 60 * 1000;
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge,
    });
  }

  /**
   * Clear refresh token cookie
   */
  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
    });
  }

  /**
   * Handle Google OAuth callback
   * GET /auth/google/callback
   */
  // googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const user = req.user as User;
  //     const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  //     if (!user) {
  //       res.redirect(clientUrl);
  //       return;
  //     }

  //     // Generate tokens for the authenticated user
  //     const accessToken = this.authService.generateAccessToken(user);
  //     const refreshToken = await this.authService.generateAndStoreRefreshToken(user);

  //     // Set refresh token as HttpOnly cookie
  //     this.setRefreshTokenCookie(res, refreshToken);

  //     // Set auth data in temporary cookie to be read by frontend
  //     res.cookie("google_auth_data", JSON.stringify({
  //       accessToken,
  //       user: {
  //         id: user.id,
  //         name: user.name,
  //         email: user.email,
  //         role: user.role,
  //       }
  //     }), {
  //       httpOnly: false,
  //       secure: process.env.NODE_ENV === "production",
  //       sameSite: "lax",
  //       maxAge: 30000, // 30 seconds
  //     });

  //     res.redirect(`${clientUrl}/auth/google/callback`);
  //   } catch (error) {
  //     console.error("Google callback error:", error);
  //     res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
  //   }
  // };
}