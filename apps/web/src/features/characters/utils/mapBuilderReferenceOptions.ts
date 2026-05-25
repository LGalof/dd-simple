import type {
  ReferenceBackground,
  ReferenceClass,
  ReferenceSpecies,
} from "../../../types/reference";
import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  FeatureChoiceField,
  SpeciesOption,
} from "../types/characterBuilder";

type ReferenceItem = {
  index?: unknown;
  name?: unknown;
};

type ChoiceOption = {
  item?: ReferenceItem;
};

type Choice = {
  choose?: unknown;
  desc?: unknown;
  from?: {
    options?: ChoiceOption[];
  };
};

type SpeciesSourceJson = {
  index?: unknown;
  name?: unknown;
  type?: unknown;
  size?: unknown;
  size_options?: {
    desc?: unknown;
    from?: {
      options?: Array<{
        size?: unknown;
      }>;
    };
  };
  speed?: unknown;
  traits?: ReferenceItem[];
  subspecies?: ReferenceItem[];
};

type BackgroundSourceJson = {
  ability_scores?: ReferenceItem[];
  equipment_options?: Array<{
    desc?: unknown;
  }>;
  feat?: ReferenceItem & {
    note?: unknown;
  };
  proficiencies?: ReferenceItem[];
  proficiency_choices?: Choice[];
};

type ClassSourceJson = {
  hit_die?: unknown;
  primary_ability?: {
    desc?: unknown;
  };
  proficiencies?: ReferenceItem[];
  proficiency_choices?: Choice[];
  saving_throws?: ReferenceItem[];
  starting_equipment_options?: Array<{
    desc?: unknown;
  }>;
};

function mapSpeciesReferences(
  references: ReferenceSpecies[],
  fallbackOptions: SpeciesOption[],
): SpeciesOption[] {
  if (references.length === 0) {
    return fallbackOptions;
  }

  return references.map((reference) => {
    const fallback = fallbackOptions.find((option) => option.index === reference.index);
    const sourceJson = asRecord(reference.sourceJson) as SpeciesSourceJson;
    const traitNames = (sourceJson.traits ?? []).map(referenceName).filter(isPresent);
    const subspeciesNames = (sourceJson.subspecies ?? []).map(referenceName).filter(isPresent);
    const sizeOptions = sourceJson.size_options?.from?.options
      ?.map((option) => stringValue(option.size))
      .filter(isPresent);
    const size = reference.size ?? stringValue(sourceJson.size) ?? sizeOptions?.join(" or ") ?? "Unknown";
    const sizeDescription = stringValue(sourceJson.size_options?.desc);
    const creatureType = stringValue(sourceJson.type) ?? fallback?.creatureType ?? "Unknown";
    const speed = reference.baseSpeed ?? numberValue(sourceJson.speed) ?? fallback?.speed ?? 30;
    const traits = traitNames.length > 0 ? traitNames : fallback?.traits ?? [];
    const languages = fallback?.languages ?? ["Common"];

    return {
      index: reference.index,
      name: reference.name,
      description:
        reference.description ??
        fallback?.description ??
        `${reference.name} rules are loaded from the D&D reference data.`,
      speed,
      traits,
      creatureType,
      size,
      languages,
      previewSections: [
        {
          id: `${reference.index}-creature-type`,
          title: "Creature Type",
          details: [`You are a ${creatureType}.`],
        },
        {
          id: `${reference.index}-languages`,
          title: "Languages",
          subtitle: "Origin",
          details: [`Languages are not normalized for ${reference.name}; using builder fallback values.`],
        },
        {
          id: `${reference.index}-size`,
          title: "Size",
          details: [sizeOptions?.length ? sizeDescription ?? `Choose ${size}.` : `You are ${size}.`],
        },
        {
          id: `${reference.index}-speed`,
          title: "Speed",
          details: [`Your walking speed is ${speed} feet.`],
        },
        ...(traits.length > 0
          ? [
              {
                id: `${reference.index}-traits`,
                title: "Traits",
                details: traits,
              },
            ]
          : []),
        ...(subspeciesNames.length > 0
          ? [
              {
                id: `${reference.index}-heritage`,
                title: "Heritage",
                subtitle: `${subspeciesNames.length} options`,
                details: subspeciesNames,
              },
            ]
          : []),
      ],
    };
  });
}

function mapBackgroundReferences(
  references: ReferenceBackground[],
  fallbackOptions: BackgroundOption[],
): BackgroundOption[] {
  if (references.length === 0) {
    return fallbackOptions;
  }

  return references.map((reference) => {
    const fallback = fallbackOptions.find((option) => option.index === reference.index);
    const sourceJson = asRecord(reference.sourceJson) as BackgroundSourceJson;
    const proficiencies = (sourceJson.proficiencies ?? []).map(referenceName).filter(isPresent);
    const skillProficiencies = proficiencies.filter((name) => name.startsWith("Skill: ")).map(stripReferencePrefix);
    const toolProficiencies = [
      ...proficiencies.filter((name) => name.startsWith("Tool: ")).map(stripReferencePrefix),
      ...(sourceJson.proficiency_choices ?? [])
        .map((choice) => stringValue(choice.desc))
        .filter(isPresent),
    ];
    const abilityScoreOptions = (sourceJson.ability_scores ?? [])
      .map(referenceName)
      .filter(isPresent)
      .map((name) => `${abilityLabel(name)} Score`);
    const featName = sourceJson.feat
      ? [referenceName(sourceJson.feat), stringValue(sourceJson.feat.note)]
          .filter(isPresent)
          .join(": ")
      : fallback?.feature ?? "Origin Feature";
    const equipmentDetails = (sourceJson.equipment_options ?? [])
      .map((option) => stringValue(option.desc))
      .filter(isPresent);

    return {
      index: reference.index,
      name: reference.name,
      description:
        reference.description ??
        fallback?.description ??
        `${reference.name} background rules are loaded from the D&D reference data.`,
      proficiencies: proficiencies.map(stripReferencePrefix),
      feature: featName,
      skillProficiencies,
      toolProficiencies,
      previewSections: [
        {
          id: `${reference.index}-origin-feat`,
          title: featName,
          subtitle: "Granted Feat",
          details: [`${reference.name} grants ${featName}.`, ...equipmentDetails],
        },
        {
          id: `${reference.index}-ability-scores`,
          title: "Ability Scores",
          subtitle: `${abilityScoreOptions.length} Choices`,
          details: [
            abilityScoreOptions.length > 0
              ? `${reference.name} supports ${abilityScoreOptions.join(", ")}.`
              : "Ability score options are not available for this background.",
            "Increase one score by 2 and another by 1, or increase all three by 1.",
          ],
          choiceFields: createAbilityScoreChoiceFields(abilityScoreOptions),
        },
      ],
    };
  });
}

function mapClassReferences(
  references: ReferenceClass[],
  fallbackOptions: ClassOption[],
): ClassOption[] {
  if (references.length === 0) {
    return fallbackOptions;
  }

  return references.map((reference) => {
    const fallback = fallbackOptions.find((option) => option.index === reference.index);
    const sourceJson = asRecord(reference.sourceJson) as ClassSourceJson;
    const hitDie = reference.hitDie ?? numberValue(sourceJson.hit_die) ?? fallback?.hitDie ?? 8;
    const primaryAbility = stringValue(sourceJson.primary_ability?.desc) ?? fallback?.primaryAbility ?? "Unknown";
    const savingThrows = (sourceJson.saving_throws ?? []).map(referenceName).filter(isPresent);
    const proficiencyChoice = sourceJson.proficiency_choices?.[0];
    const skillOptions =
      proficiencyChoice?.from?.options
        ?.map((option) => referenceName(option.item))
        .filter(isPresent)
        .filter((name) => name.startsWith("Skill: "))
        .map(stripReferencePrefix) ?? fallback?.skillChoices.options ?? [];
    const proficiencies = (sourceJson.proficiencies ?? []).map(referenceName).filter(isPresent);
    const groupedProficiencies = groupClassProficiencies(proficiencies);
    const startingEquipment = (sourceJson.starting_equipment_options ?? [])
      .map((option) => stringValue(option.desc))
      .filter(isPresent);
    const features = fallback?.features ?? createDatabaseClassFeature(reference);

    return {
      index: reference.index,
      name: reference.name,
      description: fallback?.description ?? `${reference.name} class rules are loaded from the D&D reference data.`,
      hitDie,
      primaryAbility,
      previewOverview: [
        { label: "Primary Ability", value: primaryAbility },
        { label: "Hit Point Die", value: `D${hitDie} per ${reference.name} level` },
        { label: "Saving Throw Proficiencies", value: formatList(savingThrows) },
        {
          label: "Skill Proficiencies",
          value: stringValue(proficiencyChoice?.desc) ?? formatChoose(skillOptions, numberValue(proficiencyChoice?.choose)),
        },
        { label: "Weapon Proficiencies", value: formatList(groupedProficiencies.weapons) },
        { label: "Tool Proficiencies", value: formatList(groupedProficiencies.tools) },
        { label: "Armor Training", value: formatList(groupedProficiencies.armor) },
        { label: "Starting Equipment", value: startingEquipment[0] ?? "Starting equipment is not available." },
      ],
      savingThrows,
      skillChoices: {
        choose: numberValue(proficiencyChoice?.choose) ?? fallback?.skillChoices.choose ?? 0,
        options: skillOptions,
      },
      proficiencies: groupedProficiencies,
      startingEquipment,
      features,
    };
  });
}

function createDatabaseClassFeature(reference: ReferenceClass): ClassFeature[] {
  return [
    {
      id: `${reference.index}-database-overview`,
      level: 1,
      title: `${reference.name} Progression`,
      summary:
        "Class progression data is available from the rules database; feature choice handling is not wired into this modal yet.",
    },
  ];
}

function createAbilityScoreChoiceFields(options: string[]): FeatureChoiceField[] {
  if (options.length === 0) {
    return [];
  }

  return [
    createChoiceField("score-plan", "Increase Plan", [
      "Increase two scores (+2 / +1)",
      "Increase all three by 1",
    ]),
    createChoiceField("score-a", "Primary Increase", options),
    createChoiceField("score-b", "Secondary Increase", options),
  ];
}

function createChoiceField(id: string, label: string, options: string[]): FeatureChoiceField {
  return {
    id,
    label,
    options: options.map((option) => ({
      value: option.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      label: option,
    })),
  };
}

function groupClassProficiencies(proficiencies: string[]) {
  return proficiencies.reduce(
    (groups, proficiency) => {
      const normalizedName = stripReferencePrefix(proficiency);
      const normalizedIndex = normalizedName.toLowerCase();

      if (proficiency.startsWith("Saving Throw:")) {
        return groups;
      }

      if (proficiency.startsWith("Tool:")) {
        groups.tools.push(normalizedName);
        return groups;
      }

      if (normalizedIndex.includes("armor") || normalizedIndex === "shields") {
        groups.armor.push(normalizedName);
        return groups;
      }

      groups.weapons.push(normalizedName);
      return groups;
    },
    {
      armor: [] as string[],
      tools: [] as string[],
      weapons: [] as string[],
    },
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function referenceName(value: ReferenceItem | undefined): string | null {
  return stringValue(value?.name);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function stripReferencePrefix(value: string) {
  return value.replace(/^Skill: /, "").replace(/^Tool: /, "").replace(/^Saving Throw: /, "");
}

function abilityLabel(value: string) {
  const lookup: Record<string, string> = {
    CHA: "Charisma",
    CON: "Constitution",
    DEX: "Dexterity",
    INT: "Intelligence",
    STR: "Strength",
    WIS: "Wisdom",
  };

  return lookup[value] ?? value;
}

function formatList(values: string[]) {
  return values.length > 0 ? values.map(stripReferencePrefix).join(", ") : "None";
}

function formatChoose(options: string[], choose: number | null) {
  return options.length > 0 && choose !== null
    ? `Choose ${choose}: ${options.join(", ")}`
    : "Not available";
}

export {
  mapBackgroundReferences,
  mapClassReferences,
  mapSpeciesReferences,
};
