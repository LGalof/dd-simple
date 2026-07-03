import {
  allAbilityScoreKeys,
  getFeatAbilityChoiceFieldIds,
  getFeatAbilityRule,
} from "@dd-simple/shared";
import referenceSpellLibrary from "../data/spells/reference-spells.json";
import type {
  FeatureChoiceField,
  FeatureChoiceOption,
} from "../types/characterBuilder";

type FeatChoiceOption = {
  label: string;
  value: string;
};

type FeatAbilityChoiceFieldConfig = {
  choiceGroupId: string;
  choiceGroupLabel: string;
  choiceGroupLimit: number;
  choiceKind?: FeatureChoiceField["choiceKind"];
  dependsOnFieldId?: string;
  dependsOnValues?: string[];
  id: string;
  label: string;
  options: FeatureChoiceOption[];
};

type ReferenceSpellRecord = {
  classes?: unknown;
  level?: unknown;
  name?: unknown;
};

const abilityScoreLabels: Record<(typeof allAbilityScoreKeys)[number], string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

const artisanToolOptions = [
  "Alchemist's Supplies",
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cartographer's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Smith's Tools",
  "Tinker's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools",
];

const musicalInstrumentOptions = [
  "Bagpipes",
  "Drum",
  "Dulcimer",
  "Flute",
  "Lute",
  "Lyre",
  "Horn",
  "Pan Flute",
  "Shawm",
  "Viol",
];

const skillOptions = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];

const magicInitiateSpellListOptions = ["Cleric", "Druid", "Wizard"].map((name) => ({
  label: name,
  value: slugify(name),
}));

const magicInitiateClassSpellListOptions = [
  "Bard",
  "Cleric",
  "Druid",
  "Paladin",
  "Ranger",
  "Sorcerer",
  "Warlock",
  "Wizard",
].map((name) => ({
  label: name,
  value: slugify(name),
}));

const magicInitiateAbilityOptions = ["Intelligence", "Wisdom", "Charisma"].map((name) => ({
  label: name,
  value: slugify(name).slice(0, 3),
}));

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createReferenceOption({
  index,
  label,
  name,
  type,
  url = `/api/2024/proficiencies/${index}`,
  value,
}: {
  index: string;
  label: string;
  name: string;
  type: string;
  url?: string;
  value?: string;
}): FeatureChoiceOption {
  return {
    label,
    selectedOptionIndex: index,
    selectedOptionName: name,
    selectedOptionType: type,
    selectedOptionUrl: url,
    selectedRawJson: {
      item: {
        index,
        name,
        url,
      },
    },
    value: value ?? index,
  };
}

function getFeatAbilityChoiceFieldConfigs(
  featFieldId: string,
  featOptions: FeatChoiceOption[],
) {
  const fieldConfigs: FeatAbilityChoiceFieldConfig[] = [];

  for (const featOption of featOptions) {
    const rule = getFeatAbilityRule(featOption.value);

    if (!rule?.selectableAbilities?.length) {
      continue;
    }

    const selectableAbilities = rule.selectableAbilities;

    const fieldIds = getFeatAbilityChoiceFieldIds(
      featOption.value,
      rule.selectableCount ?? 1,
    );

    fieldIds.forEach((fieldId, index) => {
      fieldConfigs.push({
        choiceGroupId: `feat-ability-${featOption.value}`,
        choiceGroupLabel:
          (rule.selectableCount ?? 1) > 1
            ? `Choose ${(rule.selectableCount ?? 1)} ability scores for ${featOption.label}`
            : `Choose 1 ability score for ${featOption.label}`,
        choiceGroupLimit: rule.selectableCount ?? 1,
        choiceKind: "option",
        dependsOnFieldId: featFieldId,
        dependsOnValues: [featOption.value],
        id: fieldId,
        label:
          (rule.selectableCount ?? 1) > 1
            ? `Ability Score ${index + 1}`
            : "Ability Score",
        options: selectableAbilities.map((abilityIndex) => ({
          label: abilityScoreLabels[abilityIndex] ?? abilityIndex.toUpperCase(),
          value: abilityIndex,
        })),
      });
    });
  }

  addMagicInitiateChoiceFields(fieldConfigs, featFieldId, featOptions);
  addRepeatedToolChoiceFields(fieldConfigs, featFieldId, "crafter", "Artisan's Tool", artisanToolOptions, 3);
  addRepeatedToolChoiceFields(
    fieldConfigs,
    featFieldId,
    "musician",
    "Musical Instrument",
    musicalInstrumentOptions,
    3,
  );

  if (featOptions.some((featOption) => featOption.value === "skilled")) {
    const options = [
      ...skillOptions.map((name) =>
        createReferenceOption({
          index: `skill-${slugify(name)}`,
          label: `Skill: ${name}`,
          name: `Skill: ${name}`,
          type: "proficiency reference",
          url: `/api/2024/proficiencies/skill-${slugify(name)}`,
          value: `skill-${slugify(name)}`,
        }),
      ),
      ...artisanToolOptions.map((name) =>
        createReferenceOption({
          index: slugify(name),
          label: `Tool: ${name}`,
          name: `Tool: ${name}`,
          type: "proficiency reference",
          value: slugify(name),
        }),
      ),
      ...musicalInstrumentOptions.map((name) =>
        createReferenceOption({
          index: slugify(name),
          label: `Tool: ${name}`,
          name: `Tool: ${name}`,
          type: "proficiency reference",
          value: slugify(name),
        }),
      ),
    ];

    for (let index = 0; index < 3; index += 1) {
      fieldConfigs.push({
        choiceGroupId: "feat-proficiency-skilled",
        choiceGroupLabel: "Choose 3 skill or tool proficiencies for Skilled",
        choiceGroupLimit: 3,
        choiceKind: "skill-proficiency",
        dependsOnFieldId: featFieldId,
        dependsOnValues: ["skilled"],
        id: `feat-proficiency-skilled-${index + 1}`,
        label: `Skill or Tool ${index + 1}`,
        options,
      });
    }
  }

  return fieldConfigs;
}

function addMagicInitiateChoiceFields(
  fieldConfigs: FeatAbilityChoiceFieldConfig[],
  featFieldId: string,
  featOptions: FeatChoiceOption[],
) {
  addMagicInitiateVariantChoiceFields(fieldConfigs, featFieldId, featOptions);

  const magicInitiateDependencyValues = getFeatDependencyValues(featOptions, "magic-initiate");

  if (magicInitiateDependencyValues.length === 0) {
    return;
  }

  fieldConfigs.push({
    choiceGroupId: "feat-magic-initiate-list",
    choiceGroupLabel: "Choose 1 spell list for Magic Initiate",
    choiceGroupLimit: 1,
    choiceKind: "option",
    dependsOnFieldId: featFieldId,
    dependsOnValues: magicInitiateDependencyValues,
    id: "feat-magic-initiate-list",
    label: "Spell List",
    options: magicInitiateSpellListOptions,
  });

  fieldConfigs.push({
    choiceGroupId: "feat-magic-initiate-ability",
    choiceGroupLabel: "Choose 1 spellcasting ability for Magic Initiate",
    choiceGroupLimit: 1,
    choiceKind: "option",
    dependsOnFieldId: featFieldId,
    dependsOnValues: magicInitiateDependencyValues,
    id: "feat-magic-initiate-ability",
    label: "Spellcasting Ability",
    options: magicInitiateAbilityOptions,
  });

  for (const spellList of magicInitiateSpellListOptions) {
    const cantripOptions = getMagicInitiateSpellOptions(spellList.value, 0);
    const spellOptions = getMagicInitiateSpellOptions(spellList.value, 1);

    for (let index = 0; index < 2; index += 1) {
      fieldConfigs.push({
        choiceGroupId: `feat-magic-initiate-${spellList.value}-cantrips`,
        choiceGroupLabel: `Choose 2 ${spellList.label} cantrips for Magic Initiate`,
        choiceGroupLimit: 2,
        choiceKind: "option",
        dependsOnFieldId: "feat-magic-initiate-list",
        dependsOnValues: [spellList.value],
        id: `feat-magic-initiate-${spellList.value}-cantrip-${index + 1}`,
        label: `Cantrip ${index + 1}`,
        options: cantripOptions,
      });
    }

    fieldConfigs.push({
      choiceGroupId: `feat-magic-initiate-${spellList.value}-spell`,
      choiceGroupLabel: `Choose 1 level 1 ${spellList.label} spell for Magic Initiate`,
      choiceGroupLimit: 1,
      choiceKind: "option",
      dependsOnFieldId: "feat-magic-initiate-list",
      dependsOnValues: [spellList.value],
      id: `feat-magic-initiate-${spellList.value}-spell-1`,
      label: "Level 1 Spell",
      options: spellOptions,
    });
  }
}

function addMagicInitiateVariantChoiceFields(
  fieldConfigs: FeatAbilityChoiceFieldConfig[],
  featFieldId: string,
  featOptions: FeatChoiceOption[],
) {
  for (const spellList of magicInitiateClassSpellListOptions) {
    const dependencyValues = getMagicInitiateClassDependencyValues(featOptions, spellList.value);

    if (dependencyValues.length === 0) {
      continue;
    }

    addMagicInitiateSpellChoiceFields(fieldConfigs, {
      dependsOnFieldId: featFieldId,
      dependsOnValues: dependencyValues,
      spellList,
    });
  }
}

function addMagicInitiateSpellChoiceFields(
  fieldConfigs: FeatAbilityChoiceFieldConfig[],
  {
    dependsOnFieldId,
    dependsOnValues,
    spellList,
  }: {
    dependsOnFieldId?: string;
    dependsOnValues?: string[];
    spellList: { label: string; value: string };
  },
) {
  const cantripOptions = getMagicInitiateSpellOptions(spellList.value, 0);
  const spellOptions = getMagicInitiateSpellOptions(spellList.value, 1);

  for (let index = 0; index < 2; index += 1) {
    fieldConfigs.push({
      choiceGroupId: `feat-magic-initiate-${spellList.value}-cantrips`,
      choiceGroupLabel: `Choose 2 ${spellList.label} cantrips for Magic Initiate`,
      choiceGroupLimit: 2,
      choiceKind: "option",
      dependsOnFieldId,
      dependsOnValues,
      id: `feat-magic-initiate-${spellList.value}-cantrip-${index + 1}`,
      label: `Cantrip ${index + 1}`,
      options: cantripOptions,
    });
  }

  fieldConfigs.push({
    choiceGroupId: `feat-magic-initiate-${spellList.value}-spell`,
    choiceGroupLabel: `Choose 1 level 1 ${spellList.label} spell for Magic Initiate`,
    choiceGroupLimit: 1,
    choiceKind: "option",
    dependsOnFieldId,
    dependsOnValues,
    id: `feat-magic-initiate-${spellList.value}-spell-1`,
    label: "Level 1 Spell",
    options: spellOptions,
  });
}

function getMagicInitiateFixedSpellChoiceFieldConfigs(
  spellListValue: string,
  spellListLabel: string,
) {
  const fieldConfigs: FeatAbilityChoiceFieldConfig[] = [];

  addMagicInitiateSpellChoiceFields(fieldConfigs, {
    dependsOnValues: [],
    spellList: {
      label: spellListLabel,
      value: spellListValue,
    },
  });

  return fieldConfigs;
}

function getFeatDependencyValues(featOptions: FeatChoiceOption[], featIndex: string) {
  const values = new Set<string>();

  for (const featOption of featOptions) {
    const normalizedValue = normalizeFeatOptionValue(featOption.value);
    const normalizedLabel = slugify(featOption.label);

    if (normalizedValue !== featIndex && normalizedLabel !== featIndex) {
      continue;
    }

    values.add(featOption.value);
    values.add(normalizedValue);
    values.add(normalizedLabel);
  }

  return [...values];
}

function getMagicInitiateClassDependencyValues(featOptions: FeatChoiceOption[], classIndex: string) {
  const values = new Set<string>();
  const expectedIndex = `magic-initiate-${classIndex}`;

  for (const featOption of featOptions) {
    const normalizedValue = normalizeFeatOptionValue(featOption.value);
    const normalizedLabel = slugify(featOption.label);
    const labelClassMatch = featOption.label.match(/magic initiate\s*\(([^)]+)\)/i);
    const normalizedLabelClass = labelClassMatch?.[1] ? slugify(labelClassMatch[1]) : null;

    if (
      normalizedValue !== expectedIndex &&
      normalizedLabel !== expectedIndex &&
      normalizedLabelClass !== classIndex
    ) {
      continue;
    }

    values.add(featOption.value);
    values.add(normalizedValue);
    values.add(normalizedLabel);
  }

  return [...values];
}

function normalizeFeatOptionValue(value: string) {
  const trimmedValue = value.trim().toLowerCase();
  const lastPathSegment = trimmedValue.split("/").filter(Boolean).at(-1) ?? trimmedValue;

  return slugify(lastPathSegment);
}

function getMagicInitiateSpellOptions(classIndex: string, spellLevel: 0 | 1) {
  return (referenceSpellLibrary as ReferenceSpellRecord[])
    .filter((spell) => normalizeSpellLevel(spell.level) === spellLevel)
    .filter((spell) =>
      Array.isArray(spell.classes) &&
      spell.classes.some(
        (entry) => typeof entry === "string" && entry.trim().toLowerCase() === classIndex,
      ),
    )
    .map((spell) => {
      const name = typeof spell.name === "string" ? spell.name.trim() : "";
      return name;
    })
    .filter((name) => name.length > 0)
    .sort((left, right) => left.localeCompare(right))
    .map((name) =>
      createReferenceOption({
        index: slugify(name),
        label: name,
        name,
        type: "spell reference",
        url: `/api/2024/spells/${slugify(name)}`,
      }),
    );
}

function normalizeSpellLevel(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === "cantrip") {
      return 0;
    }

    const parsedValue = Number.parseInt(normalizedValue, 10);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

function addRepeatedToolChoiceFields(
  fieldConfigs: FeatAbilityChoiceFieldConfig[],
  featFieldId: string,
  featIndex: string,
  label: string,
  optionNames: string[],
  count: number,
) {
  const options = optionNames.map((name) =>
    createReferenceOption({
      index: slugify(name),
      label: name,
      name: `Tool: ${name}`,
      type: "proficiency reference",
      value: slugify(name),
    }),
  );

  for (let index = 0; index < count; index += 1) {
    fieldConfigs.push({
      choiceGroupId: `feat-tool-${featIndex}`,
      choiceGroupLabel: `Choose ${count} ${label.toLowerCase()} proficiencies for ${toTitle(featIndex)}`,
      choiceGroupLimit: count,
      choiceKind: "tool-proficiency",
      dependsOnFieldId: featFieldId,
      dependsOnValues: [featIndex],
      id: `feat-tool-${featIndex}-${index + 1}`,
      label: `${label} ${index + 1}`,
      options,
    });
  }
}

function toTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export {
  getFeatAbilityChoiceFieldConfigs,
  getMagicInitiateFixedSpellChoiceFieldConfigs,
};
