const LOCAL_DEVELOPMENT_AUTH_SECRET = "dd-simple-local-development-secret";

type AuthEnvironment = {
  AUTH_SECRET?: string;
  NODE_ENV?: string;
};

function resolveAuthSecret(environment: AuthEnvironment) {
  const configuredSecret = environment.AUTH_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (environment.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set when NODE_ENV=production");
  }

  return LOCAL_DEVELOPMENT_AUTH_SECRET;
}

export { resolveAuthSecret };
