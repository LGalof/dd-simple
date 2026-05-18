import type { NextFunction, Request, Response } from "express";
import {
  AuthError,
  findUserByToken,
  type AuthUser,
} from "../services/auth.service.js";

type AuthenticatedRequest = Request & {
  user: AuthUser;
};

function getBearerToken(req: Request) {
  const authorizationHeader = req.header("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      res.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    (req as AuthenticatedRequest).user = await findUserByToken(token);
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(401).json({
        error: error.message,
      });
      return;
    }

    next(error);
  }
}

function getAuthenticatedUser(req: Request) {
  return (req as AuthenticatedRequest).user;
}

export { getAuthenticatedUser, requireAuth };
