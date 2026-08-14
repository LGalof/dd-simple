import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CharacterResourceState } from "../../../../types/character";
import { FeaturesTab } from "./FeaturesTab";

const resourceState: CharacterResourceState = {
  customMaxByResourceKey: { "arcane-ward": 7 },
  usageByResourceKey: {
    "arcane-ward": 2,
    "second-wind": 1,
  },
};

const baseProps = {
  backgroundChoiceEntries: [],
  backgroundDescription: "You know how to uncover secrets.",
  backgroundFeature: "Researcher",
  backgroundName: "Sage",
  backgroundSectionEntries: [
    {
      details: ["Two languages of your choice."],
      id: "background-languages",
      selections: [{ label: "Language", value: "Draconic" }],
      subtitle: "Scholar",
      title: "Languages",
    },
  ],
  coreClassFeatureEntries: [
    {
      feature: {
        details: ["Regain hit points as a bonus action."],
        id: "second-wind-feature",
        level: 1,
        summary: "Use your stamina to recover.",
        title: "Second Wind",
      },
      selections: [{ label: "Choice", value: "Defense" }],
    },
  ],
  formatFeatureLevel: (level: number) => `Level ${level}`,
  onResourceStateChange: vi.fn(),
  resourceActionSummaries: [
    {
      automationNote: "Restores on a short or long rest.",
      category: "bonus action" as const,
      id: "second-wind-resource",
      level: 1,
      maxUses: "2 uses",
      maxUsesValue: 2,
      name: "Second Wind",
      recharge: "Short Rest",
      resourceKey: "second-wind",
      sourceFeature: "Second Wind",
      trackingMode: "uses" as const,
    },
    {
      automationNote: "Pool updates as the ward absorbs damage.",
      category: "resource" as const,
      id: "arcane-ward-resource",
      level: null,
      maxUsesValue: 6,
      name: "Arcane Ward Hit Points",
      resourceKey: "arcane-ward",
      sourceFeature: "Arcane Ward",
      trackingMode: "pool" as const,
    },
    {
      automationNote: "Passive feature.",
      category: "passive" as const,
      id: "passive-resource",
      level: null,
      name: "Passive",
      resourceKey: "passive",
      sourceFeature: "Passive",
      trackingMode: "none" as const,
    },
  ],
  resourceState,
  selectedHeritage: {
    damageType: "Fire",
    description: "A fiery ancestry.",
    index: "dragonborn-fire",
    name: "Fire Dragonborn",
  },
  selectedSubclassName: "Champion",
  speciesIdentityEntries: [
    {
      details: ["You have Darkvision."],
      id: "species-identity",
      selections: [],
      title: "Creature Type",
    },
  ],
  speciesTraitEntries: [
    {
      details: ["You can breathe fire."],
      id: "species-trait",
      selections: [{ label: "Damage", value: "Fire" }],
      subtitle: "Level 1",
      title: "Breath Weapon",
    },
  ],
  subclassFeatureEntries: [
    {
      feature: {
        id: "improved-critical",
        level: 3,
        summary: "Critical hits are easier.",
        title: "Improved Critical",
      },
      selections: [],
    },
  ],
};

describe("FeaturesTab", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders feature sections, filters views, and updates resource usage", () => {
    render(<FeaturesTab {...baseProps} />);

    expect(screen.getByText("Class & Subclass Features")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Species & Heritage" })).toBeTruthy();
    expect(screen.getByText("Background Benefits")).toBeTruthy();
    expect(screen.getByText("Resource Tracking")).toBeTruthy();
    expect(screen.getByText("Improved Critical")).toBeTruthy();
    expect(
      screen.getByText((_, element) => element?.textContent === "Level 3 - Champion"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Resources" }));

    expect(screen.queryByRole("heading", { name: "Species & Heritage" })).toBeNull();
    expect(screen.getByLabelText("Second Wind uses")).toBeTruthy();
    expect(screen.getByLabelText("Arcane Ward Hit Points pool")).toBeTruthy();
    expect(screen.getByText("/ 7 HP")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Restore Second Wind use 1" }));
    expect(baseProps.onResourceStateChange).toHaveBeenLastCalledWith({
      customMaxByResourceKey: { "arcane-ward": 7 },
      usageByResourceKey: {
        "arcane-ward": 2,
        "second-wind": 0,
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Reduce Arcane Ward Hit Points" }));
    expect(baseProps.onResourceStateChange).toHaveBeenLastCalledWith({
      customMaxByResourceKey: { "arcane-ward": 7 },
      usageByResourceKey: {
        "arcane-ward": 3,
        "second-wind": 1,
      },
    });
  });
});
