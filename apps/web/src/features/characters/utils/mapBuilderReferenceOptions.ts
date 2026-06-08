import type {
  ReferenceBackground,
  ReferenceClass,
  ReferenceClassFeature,
  ReferenceRuleDocument,
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
  choice?: Choice;
  count?: unknown;
  item?: ReferenceItem;
  items?: ChoiceOption[];
  of?: ReferenceItem;
  unit?: unknown;
};

type ChoiceOptionData = {
  label: string;
  value: string;
};

type Choice = {
  choose?: unknown;
  desc?: unknown;
  from?: {
    options?: ChoiceOption[];
  };
  type?: unknown;
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
  starting_equipment_options?: Choice[];
};

type FeatureSourceJson = {
  desc?: unknown;
  feature_specific?: unknown;
  level?: unknown;
  name?: unknown;
};

type LevelSourceJson = {
  class?: {
    index?: unknown;
  };
  features?: ReferenceItem[];
  level?: unknown;
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
  levelDocuments: ReferenceRuleDocument[] = [],
  featureDocuments: ReferenceRuleDocument[] = [],
): ClassOption[] {
  if (references.length === 0) {
    return fallbackOptions;
  }

  return references.map((reference) => {
    const fallback = fallbackOptions.find((option) => option.index === reference.index);
    const sourceJson = asRecord(reference.sourceJson) as ClassSourceJson;
    const hitDie = reference.hitDie ?? numberValue(sourceJson.hit_die) ?? fallback?.hitDie ?? 8;
    const primaryAbility =
      formatPrimaryAbilities(reference.primaryAbilities) ??
      stringValue(sourceJson.primary_ability?.desc) ??
      fallback?.primaryAbility ??
      "Unknown";
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
    const classChoiceFeature = createClassChoiceFeature(reference, sourceJson);
    const normalizedFeatures = createNormalizedClassFeatures(reference.features ?? []);
    const features =
      normalizedFeatures.length > 0
        ? [...classChoiceFeature, ...normalizedFeatures]
        : createReferenceBackedClassFeatures(
            reference,
            sourceJson,
            levelDocuments,
            featureDocuments,
          );

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

function formatPrimaryAbilities(primaryAbilities: ReferenceClass["primaryAbilities"]) {
  const labels = (primaryAbilities ?? [])
    .map((primaryAbility) =>
      primaryAbility.abilityScore?.fullName ??
      primaryAbility.abilityScore?.name ??
      primaryAbility.abilityScoreIndex,
    )
    .filter(isPresent);

  return labels.length > 0 ? labels.join(" / ") : null;
}

function createClassChoiceFeature(reference: ReferenceClass, sourceJson: ClassSourceJson): ClassFeature[] {
  const classChoiceFields = [
    ...(sourceJson.proficiency_choices ?? []).flatMap((choice, index) =>
      createChoiceFieldsFromChoice(choice, `class-proficiency-${index}`, "Proficiency Choices"),
    ),
    ...(sourceJson.starting_equipment_options ?? []).flatMap((choice, index) =>
      createChoiceFieldsFromChoice(choice, `class-equipment-${index}`, "Starting Equipment"),
    ),
  ];

  return classChoiceFields.length > 0
    ? [
        createFeature({
          id: `${reference.index}-class-choices`,
          level: 1,
          title: `${reference.name} Choices`,
          summary: "Choose class options from the reference data.",
          choiceFields: classChoiceFields,
        }),
      ]
    : [];
}

function createNormalizedClassFeatures(features: ReferenceClassFeature[]): ClassFeature[] {
  return features
    .map((feature) => {
      const featureSourceJson = asRecord(feature.sourceJson) as FeatureSourceJson;
      const choiceFields = createChoiceFieldsFromChoice(
        featureSourceJson.feature_specific,
        `feature-${feature.index ?? feature.id}`,
        "Feature Choice",
      );

      return createFeature({
        id: feature.index ?? feature.id,
        level: feature.level,
        title: feature.title ?? feature.name ?? feature.index ?? feature.id,
        summary:
          feature.summary ??
          feature.description ??
          "No description available from reference data.",
        details: feature.details,
        choiceFields: choiceFields.length > 0 ? choiceFields : undefined,
      });
    })
    .sort((left, right) => left.level - right.level || left.title.localeCompare(right.title));
}

function createReferenceBackedClassFeatures(
  reference: ReferenceClass,
  sourceJson: ClassSourceJson,
  levelDocuments: ReferenceRuleDocument[],
  featureDocuments: ReferenceRuleDocument[],
): ClassFeature[] {
  const featureDocumentMap = new Map(featureDocuments.map((document) => [document.index, document]));
  const classChoiceFeature = createClassChoiceFeature(reference, sourceJson);
  const levelFeatures = levelDocuments
    .map((document) => ({
      document,
      sourceJson: asRecord(document.sourceJson) as LevelSourceJson,
    }))
    .filter(({ sourceJson }) => sourceJson.class?.index === reference.index)
    .sort((left, right) => {
      const leftLevel = numberValue(left.sourceJson.level) ?? 0;
      const rightLevel = numberValue(right.sourceJson.level) ?? 0;

      return leftLevel - rightLevel || left.document.index.localeCompare(right.document.index);
    })
    .flatMap(({ sourceJson }) => {
      const level = numberValue(sourceJson.level) ?? 1;
      const featureReferences = Array.isArray(sourceJson.features) ? sourceJson.features : [];

      return featureReferences
        .map((featureReference) => {
          const featureIndex = stringValue(featureReference.index);

          if (!featureIndex) {
            return null;
          }

          const featureDocument = featureDocumentMap.get(featureIndex);
          const featureSourceJson = asRecord(featureDocument?.sourceJson) as FeatureSourceJson;
          const descriptions = Array.isArray(featureSourceJson.desc)
            ? featureSourceJson.desc.filter((entry): entry is string => typeof entry === "string")
            : [];
          const choiceFields = createChoiceFieldsFromChoice(
            featureSourceJson.feature_specific,
            `feature-${featureIndex}`,
            "Feature Choice",
          );

          return createFeature({
            id: featureIndex,
            level: numberValue(featureSourceJson.level) ?? level,
            title:
              stringValue(featureSourceJson.name) ??
              featureDocument?.name ??
              stringValue(featureReference.name) ??
              featureIndex,
            summary: trimDescription(
              descriptions[0] ?? "No description available from reference data.",
            ),
            details: descriptions.slice(1).map(trimDescription).filter(isPresent),
            choiceFields: choiceFields.length > 0 ? choiceFields : undefined,
          });
        })
        .filter(isPresent);
    });
  return levelFeatures.length > 0
    ? [...classChoiceFeature, ...levelFeatures]
    : [
        ...classChoiceFeature,
        createFeature({
          id: `${reference.index}-reference-unavailable`,
          level: 1,
          title: "Class features are not available from reference data.",
          summary: "Class features are not available from reference data.",
        }),
      ];
}

function createFeature(feature: ClassFeature): ClassFeature {
  return {
    ...feature,
    details: feature.details?.length ? feature.details : undefined,
    choiceFields: feature.choiceFields?.length ? feature.choiceFields : undefined,
  };
}

function createChoiceFieldsFromChoice(
  value: unknown,
  baseId: string,
  fallbackLabel: string,
): FeatureChoiceField[] {
  const groups: Array<{
    choose: number;
    id: string;
    label: string;
    options: ChoiceOptionData[];
    optionKind: string;
  }> = [];

  collectChoiceGroups(value, baseId, fallbackLabel, groups);

  return groups.flatMap((group) =>
    Array.from({ length: group.choose }, (_, index) =>
      createChoiceField(
        group.choose === 1 ? group.id : `${group.id}-${index + 1}`,
        group.choose === 1
          ? singleChoiceFieldLabel(group.optionKind)
          : `${capitalize(group.optionKind)} ${index + 1}`,
        group.options,
        {
          choiceGroupId: group.id,
          choiceGroupLabel: group.label,
          choiceGroupLimit: group.choose,
        },
      ),
    ),
  );
}

function collectChoiceGroups(
  value: unknown,
  baseId: string,
  fallbackLabel: string,
  groups: Array<{
    choose: number;
    id: string;
    label: string;
    options: ChoiceOptionData[];
    optionKind: string;
  }>,
) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectChoiceGroups(entry, `${baseId}-${index}`, fallbackLabel, groups),
    );
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const choose = numberValue(value.choose);
  const options = getChoiceOptions(value);

  if (choose && options.length > 0) {
    const optionKind = inferChoiceOptionKind(options.map((option) => option.rawLabel), fallbackLabel);

    groups.push({
      choose,
      id: baseId,
      label: choiceGroupLabel(choose, optionKind, fallbackLabel),
      options: options.map((option) => ({
        label: cleanChoiceOptionLabel(option.rawLabel),
        value: option.value,
      })),
      optionKind,
    });
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    if (key === "from") {
      return;
    }

    collectChoiceGroups(nestedValue, `${baseId}-${key}`, toTitle(key), groups);
  });
}

function getChoiceOptions(value: Record<string, unknown>) {
  const from = isRecord(value.from) ? value.from : null;
  const rawOptions = Array.isArray(from?.options) ? from.options : [];

  return rawOptions.map(choiceOptionData).filter(isPresent);
}

function choiceOptionData(value: unknown): (ChoiceOptionData & { rawLabel: string }) | null {
  if (!isRecord(value)) {
    return null;
  }

  const item = isRecord(value.item) ? value.item : null;
  const of = isRecord(value.of) ? value.of : null;
  const choice = isRecord(value.choice) ? value.choice as Choice : null;
  const items = Array.isArray(value.items) ? value.items : null;
  const count = numberValue(value.count);
  const unit = stringValue(value.unit);
  const reference = referenceLabel(item) ?? referenceLabel(of);
  const referenceIndex = stringValue(item?.index) ?? stringValue(of?.index);

  if (reference) {
    const rawLabel = count && count > 1 ? `${count} ${reference}` : reference;

    return {
      label: cleanChoiceOptionLabel(rawLabel),
      rawLabel,
      value: referenceIndex ?? slugify(rawLabel),
    };
  }

  if (choice) {
    const choose = numberValue(choice.choose);
    const type = stringValue(choice.type) ?? "option";
    const rawLabel = choose ? `Choose ${choose} ${type}` : stringValue(choice.desc);

    return rawLabel
      ? {
          label: cleanChoiceOptionLabel(rawLabel),
          rawLabel,
          value: slugify(rawLabel),
        }
      : null;
  }

  if (items) {
    const options = items.map(choiceOptionData).filter(isPresent);

    if (options.length === 0) {
      return null;
    }

    const rawLabel = options.map((option) => option.rawLabel).join(", ");

    return {
      label: options.map((option) => option.label).join(", "),
      rawLabel,
      value: options.map((option) => option.value).join("+"),
    };
  }

  if (count !== null && unit) {
    const rawLabel = `${count} ${unit}`;

    return {
      label: rawLabel,
      rawLabel,
      value: slugify(rawLabel),
    };
  }

  return null;
}

function referenceLabel(value: Record<string, unknown> | null) {
  return stringValue(value?.name);
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

function inferChoiceOptionKind(options: string[], fallbackLabel: string) {
  const normalizedOptions = options.map((option) => option.toLowerCase());
  const normalizedFallback = fallbackLabel.toLowerCase();

  if (normalizedOptions.every((option) => option.startsWith("skill: "))) {
    return "skill proficiency";
  }

  if (normalizedOptions.every((option) => option.startsWith("tool: "))) {
    return "tool proficiency";
  }

  if (normalizedOptions.every((option) => option.startsWith("weapon: "))) {
    return "weapon proficiency";
  }

  if (normalizedOptions.every((option) => option.startsWith("armor: "))) {
    return "armor proficiency";
  }

  if (normalizedFallback.includes("equipment")) {
    return "equipment choice";
  }

  return "option";
}

function choiceGroupLabel(choose: number, optionKind: string, fallbackLabel: string) {
  if (optionKind === "equipment choice") {
    return "Choose starting equipment";
  }

  if (optionKind === "option") {
    return choose === 1 ? `Choose ${choose} option` : `Choose ${choose} options`;
  }

  return `Choose ${choose} ${pluralize(optionKind, choose)}`;
}

function singleChoiceFieldLabel(optionKind: string) {
  return optionKind === "equipment choice" ? "Equipment choice" : capitalize(optionKind);
}

function cleanChoiceOptionLabel(value: string) {
  return value
    .replace(/^Skill: /, "")
    .replace(/^Tool: /, "")
    .replace(/^Weapon: /, "")
    .replace(/^Armor: /, "");
}

function pluralize(value: string, count: number) {
  if (count === 1) {
    return value;
  }

  return value.endsWith("y") ? `${value.slice(0, -1)}ies` : `${value}s`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createChoiceField(
  id: string,
  label: string,
  options: Array<string | ChoiceOptionData>,
  metadata: Pick<
    FeatureChoiceField,
    "choiceGroupId" | "choiceGroupLabel" | "choiceGroupLimit"
  > = {},
): FeatureChoiceField {
  return {
    ...metadata,
    id,
    label,
    options: options.map((option) => ({
      value: typeof option === "string" ? slugify(option) : option.value,
      label: typeof option === "string" ? option : option.label,
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
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function trimDescription(value: string) {
  const trimmedValue = value.replace(/\s+/g, " ").trim();

  return trimmedValue.length > 320 ? `${trimmedValue.slice(0, 317).trim()}...` : trimmedValue;
}

function toTitle(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
