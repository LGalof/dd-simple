import { afterEach, describe, expect, it } from "vitest";

import {
  clearSelectedCharacterId,
  getSelectedCharacterId,
  setSelectedCharacterId,
} from "./selectedCharacter";

describe("selectedCharacter", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("stores, reads, and clears the selected character id", () => {
    expect(getSelectedCharacterId()).toBeNull();

    setSelectedCharacterId("char-1");
    expect(getSelectedCharacterId()).toBe("char-1");

    clearSelectedCharacterId("char-2");
    expect(getSelectedCharacterId()).toBe("char-1");

    clearSelectedCharacterId("char-1");
    expect(getSelectedCharacterId()).toBeNull();

    setSelectedCharacterId("char-3");
    clearSelectedCharacterId();
    expect(getSelectedCharacterId()).toBeNull();
  });
});
