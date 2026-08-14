import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../lib/api";
import { addCharacterCondition } from "./addCharacterCondition";
import {
  fetchCharacterInventory,
  fetchCharacterInventoryState,
  saveCharacterFullInventory,
  saveCharacterInventory,
  saveCharacterInventoryState,
} from "./characterInventory";
import { buildCharacterPreviewQueryPath } from "./characterPreviewQuery";
import { createCharacter } from "./createCharacter";
import { createCharacterDiceRoll } from "./createCharacterDiceRoll";
import { deleteCharacter } from "./deleteCharacter";
import { fetchCharacter } from "./fetchCharacter";
import { fetchCharacterDerivedState } from "./fetchCharacterDerivedState";
import { fetchCharacters } from "./fetchCharacters";
import { removeCharacterCondition } from "./removeCharacterCondition";
import { updateCharacter } from "./updateCharacter";

vi.mock("../../../lib/api", () => ({
  api: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("characters api", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds preview query paths from simple URL params", () => {
    expect(
      buildCharacterPreviewQueryPath("/characters/1/derived", {
        backgroundIndex: "sage",
        classIndex: "wizard",
        featIndexes: ["alert", " ", "keen-mind"],
        level: 4,
        speciesIndex: "elf",
        subclassIndex: "evocation",
        subspeciesIndex: "high-elf",
      }),
    ).toBe(
      "/characters/1/derived?backgroundIndex=sage&classIndex=wizard&speciesIndex=elf&subspeciesIndex=high-elf&subclassIndex=evocation&level=4&featIndex=alert&featIndex=keen-mind",
    );
    expect(buildCharacterPreviewQueryPath("/characters/1/derived")).toBe(
      "/characters/1/derived",
    );
  });

  it("fetches character lists and details with tokens", async () => {
    mockedApi.get.mockResolvedValue([]);

    await fetchCharacters("token");
    await fetchCharacter("c1", "token");

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, "/characters", {
      token: "token",
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, "/characters/c1", {
      token: "token",
    });
  });

  it("creates, updates, and deletes characters", async () => {
    const payload = {
      abilityScores: {},
      alignmentIndex: null,
      backgroundIndex: "sage",
      classIndex: "wizard",
      level: 1,
      name: "Mira",
      speciesIndex: "elf",
    };
    mockedApi.post.mockResolvedValue({ id: "c1" });
    mockedApi.patch.mockResolvedValue({ id: "c1" });
    mockedApi.delete.mockResolvedValue(undefined);

    await createCharacter(payload, "token");
    await updateCharacter("c1", payload, "token", { keepalive: true });
    await deleteCharacter("c1", "token");

    expect(mockedApi.post).toHaveBeenCalledWith("/characters", payload, {
      token: "token",
    });
    expect(mockedApi.patch).toHaveBeenCalledWith("/characters/c1", payload, {
      keepalive: true,
      token: "token",
    });
    expect(mockedApi.delete).toHaveBeenCalledWith("/characters/c1", {
      token: "token",
    });
  });

  it("posts and removes character conditions", async () => {
    mockedApi.post.mockResolvedValue({ id: "c1" });
    mockedApi.delete.mockResolvedValue({ id: "c1" });

    await addCharacterCondition("c1", "poisoned", "token");
    await removeCharacterCondition("c1", "petrified/statue", "token");

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/characters/c1/conditions",
      { conditionIndex: "poisoned" },
      { token: "token" },
    );
    expect(mockedApi.delete).toHaveBeenCalledWith(
      "/characters/c1/conditions/petrified%2Fstatue",
      { token: "token" },
    );
  });

  it("switches derived-state requests between get and post previews", async () => {
    mockedApi.get.mockResolvedValueOnce({ armorClass: 12 });
    mockedApi.post.mockResolvedValueOnce({ armorClass: 15 });

    await fetchCharacterDerivedState("c1", "token");
    await fetchCharacterDerivedState("c1", "token", {
      abilityScores: { str: 18 },
      featureChoices: [{ key: "fighting-style", selection: "defense" }],
      resourceState: { actions: {} },
    });

    expect(mockedApi.get).toHaveBeenCalledWith("/characters/c1/derived", {
      token: "token",
    });
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/characters/c1/derived",
      {
        abilityScores: { str: 18 },
        featureChoices: [{ key: "fighting-style", selection: "defense" }],
        resourceState: { actions: {} },
      },
      { token: "token" },
    );
  });

  it("persists dice rolls", async () => {
    const payload = {
      formula: "1d20+3",
      modifier: 3,
      reason: "Stealth",
      rollMode: "advantage" as const,
      rollType: "skill",
      rollValues: [
        { discarded: true, sides: 20, value: 4 },
        { sides: 20, value: 17 },
      ],
      targetIndex: "stealth",
      targetType: "skill",
      total: 20,
      visibility: "public" as const,
    };
    mockedApi.post.mockResolvedValueOnce({ id: "r1" });

    await createCharacterDiceRoll("c1", payload, "token");

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/characters/c1/dice-rolls",
      payload,
      { token: "token" },
    );
  });

  it("loads and saves character inventory data", async () => {
    const items = [
      {
        equipmentIndex: "rope",
        equipped: false,
        quantity: 2,
      },
    ];
    mockedApi.get
      .mockResolvedValueOnce({ items })
      .mockResolvedValueOnce({ stateCode: "abc", updatedAt: "now" });
    mockedApi.put
      .mockResolvedValueOnce({ items })
      .mockResolvedValueOnce({ stateCode: "saved", updatedAt: "later" })
      .mockResolvedValueOnce({ items, stateCode: "full", updatedAt: "last" });

    await expect(fetchCharacterInventory("c1", "token")).resolves.toEqual(items);
    await expect(fetchCharacterInventoryState("c1", "token")).resolves.toEqual({
      stateCode: "abc",
      updatedAt: "now",
    });
    await expect(saveCharacterInventory("c1", items, "token")).resolves.toEqual(
      items,
    );
    await expect(
      saveCharacterInventoryState("c1", "saved", "token"),
    ).resolves.toEqual({
      stateCode: "saved",
      updatedAt: "later",
    });
    await expect(
      saveCharacterFullInventory("c1", items, "full", "token"),
    ).resolves.toEqual({
      items,
      stateCode: "full",
      updatedAt: "last",
    });

    expect(mockedApi.get).toHaveBeenNthCalledWith(
      1,
      "/characters/c1/inventory",
      { token: "token" },
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      "/characters/c1/inventory/state",
      { token: "token" },
    );
    expect(mockedApi.put).toHaveBeenNthCalledWith(
      1,
      "/characters/c1/inventory",
      { items },
      { token: "token" },
    );
    expect(mockedApi.put).toHaveBeenNthCalledWith(
      2,
      "/characters/c1/inventory/state",
      { stateCode: "saved" },
      { token: "token" },
    );
    expect(mockedApi.put).toHaveBeenNthCalledWith(
      3,
      "/characters/c1/inventory/full",
      { items, stateCode: "full" },
      { token: "token" },
    );
  });
});
