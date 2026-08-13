function getCrypto(): Crypto {
  if (globalThis.crypto === undefined) {
    throw new TypeError("A cryptographically secure random number generator is required.");
  }

  return globalThis.crypto;
}

function secureRandomFraction() {
  const values = new Uint32Array(1);
  getCrypto().getRandomValues(values);
  return values[0] / 2 ** 32;
}

function secureRandomInt(maxExclusive: number) {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("maxExclusive must be a positive safe integer.");
  }

  const maximumUint32Range = 2 ** 32;
  const unbiasedLimit = maximumUint32Range - (maximumUint32Range % maxExclusive);
  const values = new Uint32Array(1);

  do {
    getCrypto().getRandomValues(values);
  } while (values[0] >= unbiasedLimit);

  return values[0] % maxExclusive;
}

function secureRandomId() {
  return getCrypto().randomUUID();
}

export { secureRandomFraction, secureRandomId, secureRandomInt };
