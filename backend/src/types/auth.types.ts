import { UserRole } from "../entities/User";

/** Payload embedded in every access token */
export interface AccessTokenPayload {
  sub: number;   // user id
  role: UserRole;
}

/** Augment Express Request with the verified user */
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}
