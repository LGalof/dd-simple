import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "../lib/prisma.js";

const scrypt = promisify(scryptCallback);
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

type TokenPayload = {
  sub: string;
  email: string;
  exp: number;
};

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? "dd-simple-local-development-secret";
}

function toAuthUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function createAuthToken(user: AuthUser) {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signTokenPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifyAuthToken(token: string): TokenPayload {
  try {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) {
      throw new AuthError("Invalid token");
    }

    const expectedSignature = signTokenPayload(encodedPayload);
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
      throw new AuthError("Invalid token");
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload;

    if (!payload.sub || !payload.email || payload.exp < Date.now()) {
      throw new AuthError("Invalid token");
    }

    return payload;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    throw new AuthError("Invalid token");
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("base64url")}`;
}

async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedHashBuffer = Buffer.from(storedHash, "base64url");

  return (
    derivedKey.length === storedHashBuffer.length &&
    timingSafeEqual(derivedKey, storedHashBuffer)
  );
}

async function registerUser(email: string, password: string, displayName?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      displayName: displayName?.trim() || null,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  return {
    token: createAuthToken(user),
    user: toAuthUser(user),
  };
}

async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw new AuthError("Invalid email or password");
  }

  return {
    token: createAuthToken(user),
    user: toAuthUser(user),
  };
}

async function findUserByToken(token: string) {
  const payload = verifyAuthToken(token);

  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  if (!user) {
    throw new AuthError("Invalid token");
  }

  return toAuthUser(user);
}

export { AuthError, findUserByToken, loginUser, registerUser };
export type { AuthUser };
