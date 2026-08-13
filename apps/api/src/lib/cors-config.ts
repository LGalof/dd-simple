const DEFAULT_DEVELOPMENT_ORIGINS = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
];
const DEFAULT_PRODUCTION_ORIGINS = ["https://dd-simple.onrender.com"];

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    return new Set(configuredOrigins);
  }

  return new Set(
    process.env.NODE_ENV === "production"
      ? DEFAULT_PRODUCTION_ORIGINS
      : DEFAULT_DEVELOPMENT_ORIGINS,
  );
}

function isAllowedOrigin(origin: string | undefined, allowedOrigins = getAllowedOrigins()) {
  return origin === undefined || allowedOrigins.has(origin);
}

export { getAllowedOrigins, isAllowedOrigin };
