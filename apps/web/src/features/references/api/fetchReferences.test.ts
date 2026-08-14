import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../lib/api";
import {
  fetchAbilityScores,
  fetchAlignments,
  fetchBackgrounds,
  fetchCharacterCreatorReferences,
  fetchClasses,
  fetchConditions,
  fetchEquipment,
  fetchRuleDocuments,
  fetchSkills,
  fetchSpecies,
} from "./fetchReferences";

vi.mock("../../../lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("fetchReferences", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches individual reference collections", async () => {
    mockedApi.get.mockResolvedValue([]);

    await fetchAbilityScores({ token: "t" });
    await fetchSkills({ token: "t" });
    await fetchSpecies({ token: "t" });
    await fetchClasses({ token: "t" });
    await fetchBackgrounds({ token: "t" });
    await fetchConditions({ token: "t" });
    await fetchEquipment({ token: "t" });

    expect(mockedApi.get).toHaveBeenNthCalledWith(
      1,
      "/references/ability-scores",
      { token: "t" },
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, "/references/skills", {
      token: "t",
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(3, "/references/species", {
      token: "t",
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(4, "/references/classes", {
      token: "t",
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      5,
      "/references/backgrounds",
      { token: "t" },
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(6, "/references/conditions", {
      token: "t",
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(7, "/references/equipment", {
      token: "t",
    });
  });

  it("falls back to rule alignments when the primary endpoint fails", async () => {
    mockedApi.get
      .mockRejectedValueOnce(new Error("missing"))
      .mockResolvedValueOnce([{ index: "lawful-good" }]);

    await expect(fetchAlignments()).resolves.toEqual([
      { index: "lawful-good" },
    ]);

    expect(mockedApi.get).toHaveBeenNthCalledWith(
      1,
      "/references/alignments",
      {},
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      "/references/rules/alignments",
      {},
    );
  });

  it("encodes rule document categories", async () => {
    mockedApi.get.mockResolvedValueOnce([]);

    await fetchRuleDocuments("magic items");

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/references/rules/magic%20items",
      {},
    );
  });

  it("combines character creator references", async () => {
    mockedApi.get
      .mockResolvedValueOnce([{ index: "elf" }])
      .mockResolvedValueOnce([{ index: "wizard" }])
      .mockResolvedValueOnce([{ index: "sage" }])
      .mockResolvedValueOnce([{ index: "neutral" }]);

    await expect(fetchCharacterCreatorReferences({ token: "t" })).resolves.toEqual({
      alignments: [{ index: "neutral" }],
      backgrounds: [{ index: "sage" }],
      classes: [{ index: "wizard" }],
      species: [{ index: "elf" }],
    });
  });
});
