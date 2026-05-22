import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middleware/auth.js";
import { AuthError, loginUser, registerUser } from "../services/auth.service.js";

type AuthRequestBody = {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
};

function isValidEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function register(req: Request, res: Response) {
  try {
    const body = req.body as AuthRequestBody;

    if (!isValidEmail(body.email) || !isValidPassword(body.password)) {
      res.status(400).json({
        error: "A valid email and password with at least 8 characters are required",
      });
      return;
    }

    if (body.displayName !== undefined && typeof body.displayName !== "string") {
      res.status(400).json({
        error: "Display name must be text",
      });
      return;
    }

    const result = await registerUser(body.email, body.password, body.displayName);

    res.status(201).json(result);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      res.status(409).json({
        error: "An account with this email already exists",
      });
      return;
    }

    console.error("Failed to register user:", error);

    res.status(500).json({
      error: "Failed to register user",
    });
  }
}

async function login(req: Request, res: Response) {
  try {
    const body = req.body as AuthRequestBody;

    if (!isValidEmail(body.email) || typeof body.password !== "string") {
      res.status(400).json({
        error: "Email and password are required",
      });
      return;
    }

    res.json(await loginUser(body.email, body.password));
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(401).json({
        error: error.message,
      });
      return;
    }

    console.error("Failed to log in user:", error);

    res.status(500).json({
      error: "Failed to log in user",
    });
  }
}

async function me(req: Request, res: Response) {
  res.json({
    user: getAuthenticatedUser(req),
  });
}

export { login, me, register };
