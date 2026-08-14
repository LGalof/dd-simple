import { describe, expect, it } from "vitest";
import { buildFeatureChoiceGrants } from "./featureChoiceGrants";

const feature = {
  level: 4,
  title: "Magic Initiate",
};

function field(overrides = {}) {
  return {
    id: "choice",
    label: "Choose one option",
    level: 4,
    sourceType: "CLASS",
    choiceKind: "option",
    ...overrides,
  };
}

function option(overrides = {}) {
  return {
    label: "Arcana",
    value: "arcana",
    selectedOptionIndex: "skill-arcana",
    selectedOptionName: "Skill: Arcana",
    selectedOptionUrl: "/api/2024/proficiencies/skill-arcana",
    ...overrides,
  };
}

describe("buildFeatureChoiceGrants", () => {
  it("returns explicit grants from raw option data", () => {
    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field() as never,
        option({
          selectedRawJson: {
            grants: {
              languageNames: ["Draconic"],
              weaponNames: ["Longsword"],
            },
          },
        }) as never,
      ),
    ).toEqual({
      languageNames: ["Draconic"],
      weaponNames: ["Longsword"],
    });
  });

  it("creates derived sources from direct descriptions and weapon masteries", () => {
    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ sourceType: "SPECIES" }) as never,
        option({ description: "You can breathe fire.", selectedOptionName: "Fire Breath", value: "fire-breath" }) as never,
      )?.derivedSources,
    ).toEqual([
      {
        description: "You can breathe fire.",
        level: 4,
        sourceIndex: "skill-arcana",
        sourceType: "species_trait",
        title: "Fire Breath",
      },
    ]);

    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ choiceKind: "weapon-mastery", subclassIndex: "champion" }) as never,
        option({ label: "Cleave", value: "cleave", selectedOptionName: "Cleave", selectedOptionIndex: "cleave" }) as never,
      )?.derivedSources?.[0],
    ).toMatchObject({
      sourceIndex: "cleave",
      sourceType: "subclass_feature",
      title: "Cleave",
    });
  });

  it("builds scholar, expertise, skill, tool, and language grants", () => {
    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ choiceKind: "scholar" }) as never,
        option() as never,
      ),
    ).toMatchObject({
      expertiseSkillIndexes: ["arcana"],
      derivedSources: [{ title: "Scholar: Arcana" }],
    });

    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ choiceKind: "expertise" }) as never,
        option({ selectedOptionName: "Tool: Thieves' Tools", selectedOptionIndex: "tool-thieves-tools" }) as never,
      ),
    ).toMatchObject({
      expertiseToolNames: ["Thieves' Tools"],
      derivedSources: [{ title: "Expertise: Thieves' Tools" }],
    });

    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ choiceKind: "skill-proficiency" }) as never,
        option() as never,
      ),
    ).toMatchObject({
      skillProficiencyIndexes: ["arcana"],
      derivedSources: [{ title: "Proficiency: Arcana" }],
    });

    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ choiceKind: "tool-proficiency" }) as never,
        option({ selectedOptionName: "Tool: Smith's Tools", selectedOptionIndex: "tool-smiths-tools" }) as never,
      ),
    ).toMatchObject({
      toolNames: ["Smith's Tools"],
      derivedSources: [{ title: "Tool Proficiency: Smith's Tools" }],
    });

    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ choiceKind: "language" }) as never,
        option({ selectedOptionName: "Draconic", selectedOptionIndex: "draconic" }) as never,
      ),
    ).toMatchObject({
      languageNames: ["Draconic"],
      derivedSources: [{ title: "Language: Draconic" }],
    });
  });

  it("builds resilient saving throw grants", () => {
    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ id: "feat-ability-resilient" }) as never,
        option({ label: "Dexterity", value: "dex", selectedOptionName: "Dexterity" }) as never,
      ),
    ).toMatchObject({
      savingThrowProficiencyIndexes: ["saving-throw-dex"],
      derivedSources: [{ sourceIndex: "resilient-dex", title: "Resilient: Dexterity" }],
    });
  });

  it("creates spell access descriptions from spell URLs and choice labels", () => {
    expect(
      buildFeatureChoiceGrants(
        { title: "Magical Discoveries", level: 10 } as never,
        field({ label: "Choose a cantrip", choiceKind: "cantrip" }) as never,
        option({ selectedOptionName: "Fire Bolt", selectedOptionIndex: "fire-bolt", selectedOptionUrl: "/api/2024/spells/fire-bolt" }) as never,
      )?.derivedSources?.[0]?.description,
    ).toBe("You learn the cantrip Fire Bolt through Magical Discoveries.");

    expect(
      buildFeatureChoiceGrants(
        { title: "Spell Mastery", level: 18 } as never,
        field({ label: "Prepared spell", choiceKind: "prepared-spell" }) as never,
        option({ selectedOptionName: "Shield", selectedOptionIndex: "shield" }) as never,
      )?.derivedSources?.[0]?.description,
    ).toBe("You add the level 1 spell Shield to the spells prepared through Spell Mastery.");

    expect(
      buildFeatureChoiceGrants(
        feature as never,
        field({ choiceKind: "option", label: "Choose one option" }) as never,
        option({ selectedOptionName: "Nothing Special", selectedOptionUrl: null }) as never,
      ),
    ).toBeNull();
  });
});
