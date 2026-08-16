import { afterEach, describe, expect, it, vi } from "vitest";
import { secureRandomFraction, secureRandomId, secureRandomInt } from "./secureRandom";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("secureRandom", () => {
  it("generates bounded integers without modulo bias", () => {
    const values = [0xffff_ffff, 5];
    vi.stubGlobal("crypto", {
      getRandomValues(target: Uint32Array) {
        target[0] = values.shift() ?? 0;
        return target;
      },
      randomUUID: () => "test-uuid",
    });

    expect(secureRandomInt(6)).toBe(5);
  });

  it("generates fractions and UUIDs from the platform crypto API", () => {
    vi.stubGlobal("crypto", {
      getRandomValues(target: Uint32Array) {
        target[0] = 0x8000_0000;
        return target;
      },
      randomUUID: () => "test-uuid",
    });

    expect(secureRandomFraction()).toBe(0.5);
    expect(secureRandomId()).toBe("test-uuid");
  });

  it("rejects invalid integer bounds and missing platform crypto", () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);

    vi.stubGlobal("crypto", undefined);

    expect(() => secureRandomFraction()).toThrow(
      "A cryptographically secure random number generator is required.",
    );
  });
});
