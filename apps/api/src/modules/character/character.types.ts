type CharacterBaseInput = {
  userId: string;
  name: string;
  race?: string | null;
  className?: string | null;
  level?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  maxHp?: number;
  currentHp?: number;
  armorClass?: number;
  initiative?: number;
};

type CreateCharacterInput = CharacterBaseInput;

type UpdateCharacterInput = Partial<CharacterBaseInput>;

const integerFields = [
  "level",
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
  "maxHp",
  "currentHp",
  "armorClass",
  "initiative",
] as const;

type IntegerField = (typeof integerFields)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalInteger(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function validateIntegerFields(
  source: Record<string, unknown>,
  errors: string[],
): Partial<Record<IntegerField, number>> {
  const normalized: Partial<Record<IntegerField, number>> = {};

  for (const field of integerFields) {
    const value = normalizeOptionalInteger(source[field]);

    if (value === null) {
      errors.push(`Field "${field}" must be an integer.`);
      continue;
    }

    if (value !== undefined) {
      normalized[field] = value;
    }
  }

  return normalized;
}

function validateCreateCharacterInput(body: unknown) {
  if (!isRecord(body)) {
    return {
      success: false as const,
      errors: ["Request body must be a JSON object."],
    };
  }

  const errors: string[] = [];
  const userId = normalizeRequiredString(body.userId);
  const name = normalizeRequiredString(body.name);
  const race = normalizeOptionalString(body.race);
  const className = normalizeOptionalString(body.className);
  const integerValues = validateIntegerFields(body, errors);

  if (!userId) {
    errors.push('Field "userId" is required.');
  }

  if (!name) {
    errors.push('Field "name" is required.');
  }

  if (race === null) {
    errors.push('Field "race" must be a string when provided.');
  }

  if (className === null) {
    errors.push('Field "className" must be a string when provided.');
  }

  if (errors.length > 0 || !userId || !name) {
    return {
      success: false as const,
      errors,
    };
  }

  const data: CreateCharacterInput = {
    userId,
    name,
    ...(typeof race === "string" ? { race } : {}),
    ...(typeof className === "string" ? { className } : {}),
    ...integerValues,
  };

  return {
    success: true as const,
    data,
  };
}

function validateUpdateCharacterInput(body: unknown) {
  if (!isRecord(body)) {
    return {
      success: false as const,
      errors: ["Request body must be a JSON object."],
    };
  }

  const errors: string[] = [];
  const data: UpdateCharacterInput = {};

  if ("userId" in body) {
    const userId = normalizeRequiredString(body.userId);

    if (!userId) {
      errors.push('Field "userId" must be a non-empty string.');
    } else {
      data.userId = userId;
    }
  }

  if ("name" in body) {
    const name = normalizeRequiredString(body.name);

    if (!name) {
      errors.push('Field "name" must be a non-empty string.');
    } else {
      data.name = name;
    }
  }

  if ("race" in body) {
    const race = normalizeOptionalString(body.race);

    if (race === null) {
      errors.push('Field "race" must be a string when provided.');
    } else {
      data.race = race;
    }
  }

  if ("className" in body) {
    const className = normalizeOptionalString(body.className);

    if (className === null) {
      errors.push('Field "className" must be a string when provided.');
    } else {
      data.className = className;
    }
  }

  const integerValues = validateIntegerFields(body, errors);
  Object.assign(data, integerValues);

  if (errors.length > 0) {
    return {
      success: false as const,
      errors,
    };
  }

  if (Object.keys(data).length === 0) {
    return {
      success: false as const,
      errors: ["Request body must contain at least one updatable field."],
    };
  }

  return {
    success: true as const,
    data,
  };
}

export type { CreateCharacterInput, UpdateCharacterInput };
export { validateCreateCharacterInput, validateUpdateCharacterInput };
