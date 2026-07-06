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

function sendAuthenticationRequiredResponse(req: Request, res: Response, message: string) {
  if (req.accepts(["html", "json"]) === "html") {
    res.status(401).type("html").send(`<!doctype html>
<html lang="sl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Prijava potrebna</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(135deg, #020617 0%, #111827 100%);
        color: #f8fafc;
        min-height: 100vh;
        display: grid;
        place-items: center;
      }
      main {
        max-width: 32rem;
        padding: 2rem;
        border-radius: 1rem;
        background: rgba(15, 23, 42, 0.88);
        box-shadow: 0 24px 60px rgba(2, 6, 23, 0.42);
      }
      h1 { margin-top: 0; font-size: 1.8rem; }
      p { line-height: 1.6; color: #cbd5e1; }
      a {
        display: inline-block;
        margin-top: 0.75rem;
        color: #38bdf8;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Prijava potrebna</h1>
      <p>${message}</p>
      <p>Za dostop do te strani se prijavi v D&D Simple aplikacijo.</p>
      <a href="/registracija">Ustvari račun</a>
      <br />
      <a href="/prijava">Že imaš račun? Prijavi se</a>
    </main>
  </body>
</html>`);
    return;
  }

  res.status(401).json({
    error: message,
  });
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      sendAuthenticationRequiredResponse(req, res, "Authentication required");
      return;
    }

    (req as AuthenticatedRequest).user = await findUserByToken(token);
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      sendAuthenticationRequiredResponse(req, res, error.message);
      return;
    }

    next(error);
  }
}

function getAuthenticatedUser(req: Request) {
  return (req as AuthenticatedRequest).user;
}

export { getAuthenticatedUser, requireAuth };
