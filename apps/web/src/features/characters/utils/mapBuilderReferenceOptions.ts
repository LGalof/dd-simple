import type {
  ReferenceBackground,
  ReferenceClass,
  ReferenceClassFeature,
  ReferenceRuleDocument,
  ReferenceSpecies,
  ReferenceSubspecies,
} from "../../../types/reference";
import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  ClassSubclassOption,
  FeatureChoiceField,
  FeatureChoiceKind,
  SpeciesOption,
  SpeciesHeritageOption,
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
  selectedOptionIndex?: string | null;
  selectedOptionName?: string | null;
  selectedOptionType?: string;
  selectedOptionUrl?: string | null;
  selectedRawJson?: unknown;
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
  languages?: ReferenceItem[];
  language_options?: Choice;
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

type SubspeciesSourceJson = {
  damage_type?: {
    name?: unknown;
  };
  index?: unknown;
  name?: unknown;
  species?: {
    index?: unknown;
  };
  traits?: Array<{
    index?: unknown;
    name?: unknown;
  }>;
};

type BackgroundSourceJson = {
  ability_scores?: ReferenceItem[];
  equipment_options?: Array<{
    desc?: unknown;
    from?: {
      options?: ChoiceOption[];
    };
    choose?: unknown;
  }>;
  feat?: ReferenceItem & {
    note?: unknown;
  };
  proficiencies?: ReferenceItem[];
  proficiency_choices?: Choice[];
};

type FeatSourceJson = {
  description?: unknown;
  repeatable?: unknown;
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
  subclasses?: ReferenceItem[];
};

type FeatureSourceJson = {
  class?: {
    index?: unknown;
  };
  desc?: unknown;
  feature_specific?: unknown;
  level?: unknown;
  name?: unknown;
  subclass?: {
    index?: unknown;
  };
};

type LevelSourceJson = {
  class?: {
    index?: unknown;
  };
  features?: ReferenceItem[];
  level?: unknown;
};

type ChoicePersistenceContext = Pick<
  FeatureChoiceField,
  | "classIndex"
  | "featureIndex"
  | "level"
  | "sourceIndex"
  | "sourceType"
  | "subclassIndex"
> & {
  baseChoicePath?: string;
};

const fallbackSpeciesLanguageNames: Record<string, string[]> = {
  dragonborn: ["Common", "Draconic"],
  dwarf: ["Common", "Dwarvish"],
  elf: ["Common", "Elvish"],
  gnome: ["Common", "Gnomish"],
  goliath: ["Common", "Giant"],
  halfling: ["Common", "Halfling"],
  human: ["Common"],
  orc: ["Common", "Orc"],
  tiefling: ["Common", "Infernal"],
};

type SubclassSourceJson = {
  class?: {
    index?: unknown;
  };
  description?: unknown;
  desc?: unknown;
  features?: Array<{
    description?: unknown;
    level?: unknown;
    name?: unknown;
  }>;
  index?: unknown;
  name?: unknown;
  summary?: unknown;
};

function mapSpeciesReferences(
  references: ReferenceSpecies[],
  subspeciesDocuments: ReferenceRuleDocument[] = [],
  fallbackOptions: SpeciesOption[],
  traitDocuments: ReferenceRuleDocument[] = [],
): SpeciesOption[] {
  if (references.length === 0) {
    return fallbackOptions;
  }

  const traitDocumentMap = new Map(traitDocuments.map((document) => [document.index, document]));

  return references.map((reference) => {
    const fallback = fallbackOptions.find((option) => option.index === reference.index);
    const sourceJson = asRecord(reference.sourceJson) as SpeciesSourceJson;
    const normalizedTraits = normalizedSpeciesTraits(reference);
    const fallbackTraitNames = (sourceJson.traits ?? []).map(referenceName).filter(isPresent);
    const traitNames = normalizedTraits.names.length > 0 ? normalizedTraits.names : fallbackTraitNames;
    const subspeciesNames =
      normalizedSpeciesSubspecies(reference) ??
      (sourceJson.subspecies ?? []).map(referenceName).filter(isPresent);
    const sizeOptions =
      normalizedSpeciesSizeOptions(reference) ??
      sourceJson.size_options?.from?.options
        ?.map((option) => stringValue(option.size))
        .filter(isPresent);
    const heritageOptions = normalizedSpeciesHeritageOptions(
      reference,
      subspeciesDocuments,
      traitDocumentMap,
    );
    const size = reference.size ?? stringValue(sourceJson.size) ?? sizeOptions?.join(" or ") ?? "Unknown";
    const sizeDescription = stringValue(sourceJson.size_options?.desc);
    const creatureType = stringValue(sourceJson.type) ?? fallback?.creatureType ?? "Unknown";
    const speed = reference.baseSpeed ?? numberValue(sourceJson.speed) ?? fallback?.speed ?? 30;
    const traits = traitNames.length > 0 ? traitNames : fallback?.traits ?? [];
    const fixedLanguages = normalizedLanguageNames(sourceJson.languages);
    const fallbackLanguages = getFallbackSpeciesLanguageNames(reference.index, fallback);
    const languages = fixedLanguages.length > 0 ? fixedLanguages : fallbackLanguages;
    const languageChoiceFields = createLanguageChoiceFields(sourceJson, fallback);
    const fallbackLanguageDetails = fallback?.previewSections.find(
      (section) => section.id === `${reference.index}-languages`,
    )?.details;
    const languageDetails =
      fixedLanguages.length > 0
        ? [`You can speak, read, and write ${formatLanguageList(fixedLanguages)}.`]
        : fallbackLanguageDetails && languageChoiceFields.length > 0
          ? fallbackLanguageDetails
        : fallbackLanguages.length > 0
          ? [`You can speak, read, and write ${formatLanguageList(fallbackLanguages)}.`]
        : fallbackLanguageDetails ?? [`Languages are not normalized for ${reference.name}; using builder fallback values.`];

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
      heritageOptions,
      previewSections: [
        ...(heritageOptions.length > 0
          ? [
              {
                id: `${reference.index}-heritage-choice`,
                title: reference.index === "dragonborn" ? "Draconic Ancestry" : "Heritage",
                subtitle: "1 Choice",
                details:
                  reference.index === "dragonborn"
                    ? [
                        "Choose the dragon lineage that defines your Breath Weapon and Damage Resistance.",
                        ...heritageOptions.map(
                          (option) => `${shortHeritageName(option.name)} -> ${option.damageType}`,
                        ),
                      ]
                    : [
                        "Choose the heritage that shapes this species-specific feature set.",
                      ],
                choiceFields: [
                  createChoiceField(
                    "heritage",
                    reference.index === "dragonborn" ? "Dragon Heritage" : "Heritage",
                    heritageOptions.map((option) => ({
                      label: shortHeritageName(option.name),
                      value: option.index,
                    })),
                  ),
                ],
              },
            ]
          : []),
        {
          id: `${reference.index}-creature-type`,
          title: "Creature Type",
          details: [`You are a ${creatureType}.`],
        },
        {
          id: `${reference.index}-languages`,
          title: "Languages",
          subtitle: languageChoiceFields.length > 0 ? "1 Choice - Origin" : "Origin",
          details: languageDetails,
          choiceFields: languageChoiceFields,
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
        ...(reference.index === "dragonborn"
          ? [
              {
                id: `${reference.index}-breath-weapon`,
                title: "Breath Weapon",
                details: [
                  "When you take the Attack action on your turn, you can replace one of your attacks with your selected Breath Weapon.",
                  "Its damage type comes from your chosen Draconic Ancestry.",
                ],
              },
              {
                id: `${reference.index}-damage-resistance`,
                title: "Damage Resistance",
                details: [
                  "You gain resistance to the damage type tied to your chosen Draconic Ancestry.",
                ],
              },
            ]
          : []),
        ...(traits.length > 0
          ? [
              {
                id: `${reference.index}-traits`,
                title: "Traits",
                details: normalizedTraits.details.length > 0 ? normalizedTraits.details : traits,
              },
            ]
          : []),
        ...(subspeciesNames.length > 0 && heritageOptions.length === 0
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

function normalizedLanguageNames(languages: ReferenceItem[] | undefined) {
  return (languages ?? []).map(referenceName).filter(isPresent);
}

function getFallbackSpeciesLanguageNames(
  speciesIndex: string,
  fallback: SpeciesOption | undefined,
) {
  return fallbackSpeciesLanguageNames[speciesIndex] ?? fallback?.languages ?? [];
}

function createLanguageChoiceFields(
  sourceJson: SpeciesSourceJson,
  fallback: SpeciesOption | undefined,
): FeatureChoiceField[] {
  const sourceOptions =
    sourceJson.language_options?.from?.options
      ?.reduce<ChoiceOptionData[]>((options, option) => {
        const optionData = choiceOptionData(option);

        return optionData ? [...options, optionData] : options;
      }, []) ?? [];

  if (sourceOptions.length > 0) {
    return [
      createChoiceField("language", "Bonus Language", sourceOptions),
    ];
  }

  return (
    fallback?.previewSections
      .find((section) => section.id === `${fallback.index}-languages`)
      ?.choiceFields ?? []
  );
}

function formatLanguageList(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function normalizedSpeciesTraits(reference: ReferenceSpecies) {
  const traits = reference.traits ?? [];

  return {
    details: traits
      .map((trait) =>
        trait.description ? `${trait.name}: ${trimDescription(trait.description)}` : trait.name,
      )
      .filter(isPresent),
    names: traits.map((trait) => trait.name).filter(isPresent),
  };
}

function normalizedSpeciesSubspecies(reference: ReferenceSpecies) {
  const names = (reference.subspecies ?? []).map((subspecies) => subspecies.name).filter(isPresent);

  return names.length > 0 ? names : null;
}

function normalizedSpeciesSizeOptions(reference: ReferenceSpecies) {
  const sizes = (reference.sizeOptions ?? []).map((sizeOption) => sizeOption.size).filter(isPresent);

  return sizes.length > 0 ? sizes : null;
}

function normalizedSpeciesHeritageOptions(
  reference: ReferenceSpecies,
  subspeciesDocuments: ReferenceRuleDocument[] = [],
  traitDocumentMap: Map<string, ReferenceRuleDocument>,
): SpeciesHeritageOption[] {
  const directHeritageOptions = (reference.subspecies ?? [])
    .map((subspecies) => speciesHeritageOption(subspecies, traitDocumentMap))
    .filter(isPresent);

  if (directHeritageOptions.length > 0) {
    return directHeritageOptions;
  }

  return getSpeciesHeritageOptions(reference.index, subspeciesDocuments);
}

function speciesHeritageOption(
  subspecies: ReferenceSubspecies,
  traitDocumentMap: Map<string, ReferenceRuleDocument>,
): SpeciesHeritageOption | null {
  const sourceJson = asRecord(subspecies.sourceJson) as SubspeciesSourceJson;
  const traits = (sourceJson.traits ?? [])
    .map((trait) => {
      const index = stringValue(trait.index);
      const name = stringValue(trait.name);

      if (!index || !name) {
        return null;
      }

      const traitDocument = traitDocumentMap.get(index);
      const traitSourceJson = asRecord(traitDocument?.sourceJson);

      return {
        description:
          stringValue(traitSourceJson.description) ?? null,
        index,
        name: traitDocument?.name ?? name,
      };
    })
    .filter(isPresent);
  const traitIndexes = traits.map((trait) => trait.index);

  if (!subspecies.index) {
    return null;
  }

  return {
    breathWeaponTraitIndex: traitIndexes.find((traitIndex) => traitIndex.includes("breath-weapon")),
    damageType: stringValue(sourceJson.damage_type?.name) ?? "Unknown",
    index: subspecies.index,
    name: subspecies.name,
    resistanceTraitIndex: traitIndexes.find((traitIndex) => traitIndex.includes("damage-resistance")),
    traits,
  };
}

function mapBackgroundReferences(
  references: ReferenceBackground[],
  featDocuments: ReferenceRuleDocument[] = [],
  fallbackOptions: BackgroundOption[],
): BackgroundOption[] {
  if (references.length === 0) {
    return fallbackOptions;
  }

  const featDocumentMap = new Map(featDocuments.map((document) => [document.index, document]));

  return references.map((reference) => {
    const fallback = fallbackOptions.find((option) => option.index === reference.index);
    const sourceJson = asRecord(reference.sourceJson) as BackgroundSourceJson;
    const normalizedProficiencies = normalizedBackgroundProficiencies(reference);
    const fallbackProficiencies = (sourceJson.proficiencies ?? []).map(referenceName).filter(isPresent);
    const proficiencies = normalizedProficiencies.all ?? fallbackProficiencies;
    const skillProficiencies =
      normalizedProficiencies.skills ??
      fallbackProficiencies.filter((name) => name.startsWith("Skill: ")).map(stripReferencePrefix);
    const fixedToolProficiencies =
      normalizedProficiencies.tools ??
      fallbackProficiencies.filter((name) => name.startsWith("Tool: ")).map(stripReferencePrefix);
    const proficiencyChoiceFields = (sourceJson.proficiency_choices ?? []).flatMap((choice, index) =>
      createChoiceFieldsFromChoice(
        choice,
        `${reference.index}-proficiency-choice-${index}`,
        "Tool Choice",
        {
          baseChoicePath: `proficiency_choices[${index}]`,
          sourceIndex: reference.index,
          sourceType: "BACKGROUND",
        },
      ),
    );
    const toolProficiencies = [
      ...fixedToolProficiencies,
      ...(sourceJson.proficiency_choices ?? [])
        .map((choice) => stringValue(choice.desc))
        .filter(isPresent),
    ];
    const abilityScoreOptions =
      normalizedBackgroundAbilityScoreOptions(reference) ??
      (sourceJson.ability_scores ?? [])
        .map((abilityScore) => {
          const index = stringValue(abilityScore.index);
          const name = referenceName(abilityScore);

          return index && name
            ? {
                label: `${abilityLabel(name)} Score`,
                value: index,
              }
            : null;
        })
        .filter(isPresent);
    const normalizedFeat = normalizedBackgroundFeat(reference);
    const featIndex = normalizedFeat?.index ?? stringValue(sourceJson.feat?.index);
    const featDocument = featIndex ? featDocumentMap.get(featIndex) : null;
    const featSourceJson = asRecord(featDocument?.sourceJson) as FeatSourceJson;
    const featName = normalizedFeat?.name ?? referenceName(sourceJson.feat) ?? fallback?.feature ?? "Origin Feature";
    const featNote = normalizedFeat?.note ?? stringValue(sourceJson.feat?.note);
    const featDetails = getFeatDetails(reference.name, featName, featNote, featSourceJson, fallback?.description);
    const equipmentDetails = (sourceJson.equipment_options ?? [])
      .map((option) => stringValue(option.desc))
      .filter(isPresent);
    const equipmentChoiceFields = (sourceJson.equipment_options ?? []).flatMap((choice, index) =>
      createChoiceFieldsFromChoice(
        choice,
        `${reference.index}-equipment-choice-${index}`,
        "Equipment Choice",
        {
          baseChoicePath: `equipment_options[${index}]`,
          sourceIndex: reference.index,
          sourceType: "BACKGROUND",
        },
      ),
    );
    const featSubtitleParts = ["Granted Feat"];

    if (featNote) {
      featSubtitleParts.push(featNote);
    }

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
          subtitle: featSubtitleParts.join(" - "),
          details: featDetails,
        },
        {
          id: `${reference.index}-ability-scores`,
          title: "Ability Scores",
          subtitle: `${abilityScoreOptions.length} Choices`,
          details: [
            abilityScoreOptions.length > 0
              ? `${reference.name} supports ${abilityScoreOptions.map((option) => option.label).join(", ")}.`
              : "Ability score options are not available for this background.",
            "Increase one score by 2 and another by 1, or increase all three by 1.",
          ],
          choiceFields: createAbilityScoreChoiceFields(abilityScoreOptions),
        },
        ...(proficiencyChoiceFields.length > 0
          ? [
              {
                id: `${reference.index}-origin-proficiencies`,
                title: "Origin Proficiencies",
                subtitle: formatChoiceCount(proficiencyChoiceFields.length),
                details: (sourceJson.proficiency_choices ?? [])
                  .map((choice) => stringValue(choice.desc))
                  .filter(isPresent),
                choiceFields: proficiencyChoiceFields,
              },
            ]
          : []),
        ...(equipmentDetails.length > 0
          ? [
              {
                id: `${reference.index}-starting-equipment`,
                title: "Starting Equipment",
                subtitle:
                  equipmentChoiceFields.length > 0
                    ? formatChoiceCount(equipmentChoiceFields.length)
                    : "Background Gear",
                details: equipmentDetails,
                choiceFields: equipmentChoiceFields.length > 0 ? equipmentChoiceFields : undefined,
              },
            ]
          : []),
      ],
    };
  });
}

function normalizedBackgroundProficiencies(reference: ReferenceBackground) {
  const grants = reference.proficiencyGrants ?? [];

  if (grants.length === 0) {
    return {};
  }

  return {
    all: grants
      .map((grant) => grant.sourceLabel ?? grant.proficiency?.name ?? grant.proficiencyIndex)
      .filter(isPresent),
    skills: backgroundGrantLabelsByType(grants, "SKILL"),
    tools: backgroundGrantLabelsByType(grants, "TOOL"),
  };
}

function backgroundGrantLabelsByType(
  grants: NonNullable<ReferenceBackground["proficiencyGrants"]>,
  grantType: string,
) {
  return grants
    .filter((grant) => grant.grantType === grantType)
    .map((grant) => grant.sourceLabel ?? grant.proficiency?.name ?? grant.proficiencyIndex)
    .filter(isPresent)
    .map(stripReferencePrefix);
}

function normalizedBackgroundAbilityScoreOptions(reference: ReferenceBackground) {
  const options = (reference.abilityOptions ?? [])
    .map((abilityOption) => {
      const label =
        abilityOption.abilityScore?.fullName ??
        abilityOption.abilityScore?.name ??
        abilityOption.abilityScoreIndex;

      return label
        ? {
            label: `${abilityLabel(label)} Score`,
            value: abilityOption.abilityScoreIndex,
          }
        : null;
    })
    .filter(isPresent);

  return options.length > 0 ? options : null;
}

function normalizedBackgroundFeat(reference: ReferenceBackground) {
  const featGrant = reference.featGrants?.[0];

  if (!featGrant) {
    return null;
  }

  const [name, note] = (featGrant.sourceLabel ?? featGrant.featIndex)
    .split(": ")
    .map((part) => part.trim());

  return {
    index: featGrant.featIndex,
    name: name.length > 0 ? name : featGrant.featIndex,
    note: note?.length ? note : null,
  };
}

function mapClassReferences(
  references: ReferenceClass[],
  fallbackOptions: ClassOption[],
  levelDocuments: ReferenceRuleDocument[] = [],
  featureDocuments: ReferenceRuleDocument[] = [],
  subclassDocuments: ReferenceRuleDocument[] = [],
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
    const fallbackSavingThrows = (sourceJson.saving_throws ?? []).map(referenceName).filter(isPresent);
    const savingThrows = normalizedGrantLabels(reference, "SAVING_THROW") ?? fallbackSavingThrows;
    const proficiencyChoice = sourceJson.proficiency_choices?.[0];
    const normalizedSkillChoice = normalizedClassSkillChoice(reference);
    const fallbackSkillOptions =
      proficiencyChoice?.from?.options
        ?.map((option) => referenceName(option.item))
        .filter(isPresent)
        .filter((name) => name.startsWith("Skill: "))
        .map(stripReferencePrefix) ?? fallback?.skillChoices.options ?? [];
    const skillOptions = normalizedSkillChoice?.options ?? fallbackSkillOptions;
    const fallbackProficiencies = (sourceJson.proficiencies ?? []).map(referenceName).filter(isPresent);
    const groupedProficiencies = normalizedGroupedProficiencies(reference) ?? groupClassProficiencies(fallbackProficiencies);
    const startingEquipment = (sourceJson.starting_equipment_options ?? [])
      .map((option) => stringValue(option.desc))
      .filter(isPresent);
    const classChoiceFeature = createClassChoiceFeature(reference, sourceJson);
    const normalizedFeatures = createNormalizedClassFeatures(
      reference.features ?? [],
      reference.index,
    );
    const subclasses = getClassSubclasses(reference.index, sourceJson, subclassDocuments);
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
          value:
            normalizedSkillChoice?.description ??
            stringValue(proficiencyChoice?.desc) ??
            formatChoose(skillOptions, normalizedSkillChoice?.choose ?? numberValue(proficiencyChoice?.choose)),
        },
        { label: "Weapon Proficiencies", value: formatList(groupedProficiencies.weapons) },
        { label: "Tool Proficiencies", value: formatList(groupedProficiencies.tools) },
        { label: "Armor Training", value: formatList(groupedProficiencies.armor) },
        { label: "Starting Equipment", value: startingEquipment[0] ?? "Starting equipment is not available." },
      ],
      savingThrows,
      skillChoices: {
        choose: normalizedSkillChoice?.choose ?? numberValue(proficiencyChoice?.choose) ?? fallback?.skillChoices.choose ?? 0,
        options: skillOptions,
      },
      proficiencies: groupedProficiencies,
      startingEquipment,
      subclasses,
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

function normalizedGrantLabels(reference: ReferenceClass, grantType: string): string[] | null {
  const labels = (reference.proficiencyGrants ?? [])
    .filter((grant) => grant.grantType === grantType)
    .map((grant) => grant.sourceLabel ?? grant.proficiency?.name ?? grant.proficiencyIndex)
    .filter(isPresent)
    .map(stripReferencePrefix);

  return labels.length > 0 ? labels : null;
}

function normalizedGroupedProficiencies(reference: ReferenceClass) {
  const grants = reference.proficiencyGrants ?? [];

  if (grants.length === 0) {
    return null;
  }

  return {
    armor: grantLabelsByType(grants, "ARMOR"),
    tools: grantLabelsByType(grants, "TOOL"),
    weapons: grantLabelsByType(grants, "WEAPON"),
  };
}

function grantLabelsByType(
  grants: NonNullable<ReferenceClass["proficiencyGrants"]>,
  grantType: string,
) {
  return grants
    .filter((grant) => grant.grantType === grantType)
    .map((grant) => grant.sourceLabel ?? grant.proficiency?.name ?? grant.proficiencyIndex)
    .filter(isPresent)
    .map(stripReferencePrefix);
}

function normalizedClassSkillChoice(reference: ReferenceClass) {
  const choice = (reference.skillChoices ?? []).find((classSkillChoice) => {
    const options = classSkillChoice.options ?? [];

    return options.length > 0;
  });

  if (!choice) {
    return null;
  }

  const options = (choice.options ?? [])
    .map((option) =>
      option.proficiency?.name ??
      option.skill?.name ??
      option.skillIndex ??
      option.proficiencyIndex,
    )
    .filter(isPresent)
    .map(stripReferencePrefix);

  return options.length > 0
    ? {
        choose: choice.chooseCount,
        description: choice.description ?? undefined,
        options,
        valueOptions: (choice.options ?? []).map((option) => ({
          label: stripReferencePrefix(
            option.proficiency?.name ??
            option.skill?.name ??
            option.skillIndex ??
            option.proficiencyIndex,
          ),
          value: option.proficiencyIndex,
        })),
      }
    : null;
}

function createClassChoiceFeature(reference: ReferenceClass, sourceJson: ClassSourceJson): ClassFeature[] {
  const normalizedSkillChoice = normalizedClassSkillChoice(reference);
  const sourceProficiencyChoices = sourceJson.proficiency_choices ?? [];
  const sourceFallbackChoices = normalizedSkillChoice
    ? sourceProficiencyChoices
        .map((choice, index) => ({ choice, index }))
        .filter(({ choice }) => !isSourceSkillChoice(choice))
    : sourceProficiencyChoices.map((choice, index) => ({ choice, index }));
  const classChoiceFields = [
    ...(normalizedSkillChoice
      ? createChoiceFieldsFromNormalizedSkillChoice(normalizedSkillChoice)
      : []),
    ...sourceFallbackChoices.flatMap(({ choice, index }) =>
      createChoiceFieldsFromChoice(
        choice,
        `class-proficiency-${index}`,
        "Proficiency Choices",
        {
          baseChoicePath: `proficiency_choices[${index}]`,
          classIndex: reference.index,
          level: 1,
          sourceIndex: reference.index,
          sourceType: "CLASS",
        },
      ),
    ),
    ...(sourceJson.starting_equipment_options ?? []).flatMap((choice, index) =>
      createChoiceFieldsFromChoice(
        choice,
        `class-equipment-${index}`,
        "Starting Equipment",
        {
          baseChoicePath: `starting_equipment_options[${index}]`,
          classIndex: reference.index,
          level: 1,
          sourceIndex: reference.index,
          sourceType: "CLASS",
        },
      ),
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

function isSourceSkillChoice(choice: Choice) {
  const options = choice.from?.options ?? [];

  return options.length > 0 && options.every((option) => {
    const index = stringValue(option.item?.index);
    const name = stringValue(option.item?.name);

    return Boolean(index?.startsWith("skill-") || name?.startsWith("Skill: "));
  });
}

function createChoiceFieldsFromNormalizedSkillChoice(
  choice: NonNullable<ReturnType<typeof normalizedClassSkillChoice>>,
): FeatureChoiceField[] {
  return Array.from({ length: choice.choose }, (_, index) =>
    createChoiceField(
      choice.choose === 1 ? "class-skill-choice" : `class-skill-choice-${index + 1}`,
      choice.choose === 1 ? "Skill proficiency" : `Skill proficiency ${index + 1}`,
      choice.valueOptions,
      {
        choiceKind: "skill-proficiency",
        choiceGroupId: "class-skill-choice",
        choiceGroupLabel: choice.description ?? `Choose ${choice.choose} skill proficiencies`,
        choiceGroupLimit: choice.choose,
      },
    ),
  );
}

function createNormalizedClassFeatures(
  features: ReferenceClassFeature[],
  classIndex: string,
): ClassFeature[] {
  return features
    .map((feature) => {
      const featureSourceJson = asRecord(feature.sourceJson) as FeatureSourceJson;
      const choiceFields = createChoiceFieldsFromChoice(
        featureSourceJson.feature_specific,
        `feature-${feature.index ?? feature.id}`,
        "Feature Choice",
        {
          baseChoicePath: "feature_specific",
          classIndex: stringValue(featureSourceJson.class?.index) ?? classIndex,
          featureIndex: feature.index ?? feature.id,
          level: feature.level ?? numberValue(featureSourceJson.level),
          sourceIndex: feature.index ?? feature.id,
          sourceType: "FEATURE",
          subclassIndex: stringValue(featureSourceJson.subclass?.index),
        },
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
            {
              baseChoicePath: "feature_specific",
              classIndex: stringValue(featureSourceJson.class?.index) ?? reference.index,
              featureIndex,
              level: numberValue(featureSourceJson.level) ?? level,
              sourceIndex: featureIndex,
              sourceType: "FEATURE",
              subclassIndex: stringValue(featureSourceJson.subclass?.index),
            },
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

function getClassSubclasses(
  classIndex: string,
  sourceJson: ClassSourceJson,
  subclassDocuments: ReferenceRuleDocument[],
): ClassSubclassOption[] {
  const subclassDocumentMap = new Map(subclassDocuments.map((document) => [document.index, document]));
  const sourceSubclasses = Array.isArray(sourceJson.subclasses) ? sourceJson.subclasses : [];

  return sourceSubclasses
    .map((subclassReference) => {
      const subclassIndex = stringValue(subclassReference.index);

      if (!subclassIndex) {
        return null;
      }

      const subclassDocument = subclassDocumentMap.get(subclassIndex);
      const subclassSourceJson = asRecord(subclassDocument?.sourceJson) as SubclassSourceJson;

      if (stringValue(subclassSourceJson.class?.index) !== classIndex) {
        return {
          index: subclassIndex,
          name: referenceName(subclassReference) ?? subclassDocument?.name ?? subclassIndex,
          description: undefined,
          summary: undefined,
          features: [],
        };
      }

      const features = Array.isArray(subclassSourceJson.features)
        ? subclassSourceJson.features
            .map((feature) => {
              const name = stringValue(feature.name);
              const description = stringValue(feature.description);
              const level = numberValue(feature.level);

              if (!name || !description || level === null) {
                return null;
              }

              return {
                name,
                description: trimDescription(description),
                level,
              };
            })
            .filter(isPresent)
        : [];

      return {
        index: subclassIndex,
        name:
          stringValue(subclassSourceJson.name) ??
          referenceName(subclassReference) ??
          subclassDocument?.name ??
          subclassIndex,
        description:
          stringValue(subclassSourceJson.description) ??
          stringValue(subclassSourceJson.desc) ??
          undefined,
        summary: stringValue(subclassSourceJson.summary) ?? undefined,
        features,
      };
    })
    .filter(isPresent);
}

function createChoiceFieldsFromChoice(
  value: unknown,
  baseId: string,
  fallbackLabel: string,
  context: ChoicePersistenceContext = {},
): FeatureChoiceField[] {
  const groups: Array<{
    choicePath?: string;
    choiceKind: FeatureChoiceKind;
    choose: number;
    dependsOnFieldId?: string;
    dependsOnValues?: string[];
    fieldLabel?: string;
    id: string;
    label: string;
    options: ChoiceOptionData[];
    optionKind: string;
  }> = [];

  collectChoiceGroups(value, baseId, fallbackLabel, groups, context.baseChoicePath);

  return groups.flatMap((group) =>
    Array.from({ length: group.choose }, (_, index) =>
      createChoiceField(
        group.choose === 1 ? group.id : `${group.id}-${index + 1}`,
        group.choose === 1
          ? (group.fieldLabel ?? singleChoiceFieldLabel(group.optionKind))
          : `${group.fieldLabel ?? capitalize(group.optionKind)} ${index + 1}`,
        group.options,
        {
          choiceKey: group.choose === 1 ? group.id : `${group.id}-${index + 1}`,
          choiceKind: group.choiceKind,
          choiceGroupId: group.id,
          choiceGroupLabel: group.label,
          choiceGroupLimit: group.choose,
          dependsOnFieldId: group.dependsOnFieldId,
          dependsOnValues: group.dependsOnValues,
          choiceLabel: group.label,
          choicePath:
            group.choose === 1
              ? group.choicePath
              : appendChoicePath(group.choicePath, `slot${index + 1}`),
          classIndex: context.classIndex,
          featureIndex: context.featureIndex,
          level: context.level,
          sourceIndex: context.sourceIndex,
          sourceType: context.sourceType,
          subclassIndex: context.subclassIndex,
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
    choicePath?: string;
    choiceKind: FeatureChoiceKind;
    choose: number;
    dependsOnFieldId?: string;
    dependsOnValues?: string[];
    fieldLabel?: string;
    id: string;
    label: string;
    options: ChoiceOptionData[];
    optionKind: string;
  }>,
  choicePath?: string,
  inheritedChoiceKind?: FeatureChoiceKind,
) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectChoiceGroups(
        entry,
        `${baseId}-${index}`,
        fallbackLabel,
        groups,
        appendChoicePath(choicePath, `[${index}]`),
        inheritedChoiceKind,
      ),
    );
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const recordChoiceKind = inferFeatureChoiceKind({
    fieldLabel: stringValue(value.field_label),
    fallbackLabel,
    groupLabel: stringValue(value.label),
    optionKind: "",
    optionLabels: [],
    typeLabel: stringValue(value.type),
  });
  const nextInheritedChoiceKind =
    recordChoiceKind === "option" ? inheritedChoiceKind : recordChoiceKind;
  const choose = numberValue(value.choose);
  const options = getChoiceOptions(value);

  if (choose && options.length > 0) {
    const optionKind = inferChoiceOptionKind(options.map((option) => option.rawLabel), fallbackLabel);
    const inferredChoiceKind = inferFeatureChoiceKind({
      fieldLabel: stringValue(value.field_label),
      fallbackLabel,
      groupLabel: stringValue(value.label),
      optionKind,
      optionLabels: options.map((option) => option.rawLabel),
      typeLabel: stringValue(value.type),
    });
    const choiceKind =
      inferredChoiceKind === "option"
        ? nextInheritedChoiceKind ?? "option"
        : inferredChoiceKind;
    const visibleWhen = isRecord(value.visible_when) ? value.visible_when : null;
    const dependsOnFieldId = stringValue(visibleWhen?.field) ?? undefined;
    const dependsOnValues = Array.isArray(visibleWhen?.values)
      ? visibleWhen.values.map((entry) => stringValue(entry)).filter(isPresent)
      : undefined;
    const fieldLabel = stringValue(value.field_label) ?? undefined;
    const choiceId = stringValue(value.id) ?? baseId;
    const groupLabel =
      stringValue(value.label) ?? choiceGroupLabel(choose, optionKind, fallbackLabel);

    groups.push({
      choicePath,
      choiceKind,
      choose,
      dependsOnFieldId,
      dependsOnValues: dependsOnValues?.length ? dependsOnValues : undefined,
      fieldLabel,
      id: choiceId,
      label: groupLabel,
      options: options.map((option) => ({
        ...option,
        label: cleanChoiceOptionLabel(option.rawLabel),
      })),
      optionKind,
    });
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    if (key === "from") {
      return;
    }

    collectChoiceGroups(
      nestedValue,
      `${baseId}-${key}`,
      toTitle(key),
      groups,
      appendChoicePath(choicePath, key),
      nextInheritedChoiceKind,
    );
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
  const referenceName = referenceLabel(item) ?? referenceLabel(of);
  const referenceUrl = stringValue(item?.url) ?? stringValue(of?.url);

  if (reference) {
    const rawLabel = count && count > 1 ? `${count} ${reference}` : reference;

    return {
      label: cleanChoiceOptionLabel(rawLabel),
      rawLabel,
      selectedOptionIndex: referenceIndex,
      selectedOptionName: referenceName ?? rawLabel,
      selectedOptionType: inferSelectedOptionType(value, referenceIndex),
      selectedOptionUrl: referenceUrl,
      selectedRawJson: value,
      value: referenceIndex ?? slugify(rawLabel),
    };
  }

  if (choice) {
    const choose = numberValue(choice.choose);
    const type = stringValue(choice.type) ?? "option";
    const rawLabel = stringValue(choice.desc) ?? (choose ? `Choose ${choose} ${type}` : null);

    return rawLabel
      ? {
          label: cleanChoiceOptionLabel(rawLabel),
          rawLabel,
          selectedOptionName: rawLabel,
          selectedOptionType: "nested choice",
          selectedRawJson: value,
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
      selectedOptionName: rawLabel,
      selectedOptionType: "multiple",
      selectedRawJson: value,
      value: options.map((option) => option.value).join("+"),
    };
  }

  if (count !== null && unit) {
    const rawLabel = `${count} ${unit}`;

    return {
      label: rawLabel,
      rawLabel,
      selectedOptionName: rawLabel,
      selectedOptionType: "object",
      selectedRawJson: value,
      value: slugify(rawLabel),
    };
  }

  return null;
}

function appendChoicePath(basePath: string | undefined, segment: string) {
  if (!basePath) {
    return segment;
  }

  return segment.startsWith("[") ? `${basePath}${segment}` : `${basePath}.${segment}`;
}

function inferSelectedOptionType(value: Record<string, unknown>, referenceIndex: string | null) {
  const optionType = stringValue(value.option_type);

  if (optionType) {
    return optionType;
  }

  if (referenceIndex?.startsWith("skill-")) {
    return "proficiency reference";
  }

  if (referenceIndex?.startsWith("expertise-")) {
    return "expertise modifier";
  }

  if (referenceIndex?.includes("feature") || referenceIndex?.includes("fighting-style")) {
    return "feature reference";
  }

  return "reference";
}

function referenceLabel(value: Record<string, unknown> | null) {
  return stringValue(value?.name);
}

function createAbilityScoreChoiceFields(options: ChoiceOptionData[]): FeatureChoiceField[] {
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

function getFeatDetails(
  backgroundName: string,
  featName: string,
  featNote: string | null,
  featSourceJson: FeatSourceJson,
  fallbackDescription?: string,
) {
  const description = stringValue(featSourceJson.description);
  const repeatable = stringValue(featSourceJson.repeatable);
  const details = [
    `${backgroundName} grants ${featNote ? `${featName}: ${featNote}` : featName}.`,
    ...splitParagraphs(description),
    ...(repeatable ? [`Repeatable: ${repeatable}`] : []),
  ].filter(isPresent);

  return details.length > 0
    ? details
    : [
        fallbackDescription ?? `${backgroundName} grants ${featName}.`,
      ];
}

function splitParagraphs(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\*\*/g, "").trim())
    .filter((paragraph) => paragraph.length > 0);
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

function inferFeatureChoiceKind({
  fieldLabel,
  fallbackLabel,
  groupLabel,
  optionKind,
  optionLabels,
  typeLabel,
}: {
  fieldLabel?: string | null;
  fallbackLabel: string;
  groupLabel?: string | null;
  optionKind: string;
  optionLabels: string[];
  typeLabel?: string | null;
}): FeatureChoiceKind {
  const text = [
    fieldLabel,
    fallbackLabel,
    groupLabel,
    optionKind,
    typeLabel,
    ...optionLabels,
  ]
    .filter(isPresent)
    .join(" ")
    .toLowerCase();

  if (text.includes("subclass")) {
    return "subclass";
  }

  if (text.includes("expertise")) {
    return "expertise";
  }

  if (text.includes("fighting style")) {
    return "fighting-style";
  }

  if (text.includes("metamagic")) {
    return "metamagic";
  }

  if (text.includes("pact boon")) {
    return "pact-boon";
  }

  if (text.includes("eldritch invocation") || text.includes("invocation")) {
    return "eldritch-invocation";
  }

  if (text.includes("weapon mastery")) {
    return "weapon-mastery";
  }

  if (text.includes("epic boon")) {
    return "epic-boon";
  }

  if (
    text.includes("ability score improvement") ||
    text.includes("ability score increase") ||
    text.includes("asi") ||
    text.includes("feat")
  ) {
    return "asi-feat";
  }

  if (optionKind === "skill proficiency") {
    return "skill-proficiency";
  }

  if (optionKind === "tool proficiency") {
    return "tool-proficiency";
  }

  if (optionKind === "armor proficiency") {
    return "armor-proficiency";
  }

  if (optionKind === "weapon proficiency") {
    return "weapon-proficiency";
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
    | "choiceGroupId"
    | "choiceGroupLabel"
    | "choiceGroupLimit"
    | "dependsOnFieldId"
    | "dependsOnValues"
    | "choiceKey"
    | "choiceKind"
    | "choiceLabel"
    | "choicePath"
    | "classIndex"
    | "featureIndex"
    | "level"
    | "sourceIndex"
    | "sourceType"
    | "subclassIndex"
  > = {},
): FeatureChoiceField {
  return {
    ...metadata,
    id,
    label,
    options: options.map((option) => ({
      value: typeof option === "string" ? slugify(option) : option.value,
      label: typeof option === "string" ? option : option.label,
      selectedOptionIndex: typeof option === "string" ? undefined : option.selectedOptionIndex,
      selectedOptionName: typeof option === "string" ? option : option.selectedOptionName,
      selectedOptionType: typeof option === "string" ? "string" : option.selectedOptionType,
      selectedOptionUrl: typeof option === "string" ? undefined : option.selectedOptionUrl,
      selectedRawJson: typeof option === "string" ? option : option.selectedRawJson,
    })),
  };
}

function getSpeciesHeritageOptions(
  speciesIndex: string,
  subspeciesDocuments: ReferenceRuleDocument[],
): SpeciesHeritageOption[] {
  return subspeciesDocuments
    .map((document) => asRecord(document.sourceJson) as SubspeciesSourceJson)
    .filter((sourceJson) => sourceJson.species?.index === speciesIndex)
    .map((sourceJson) => {
      const traitIndexes = (sourceJson.traits ?? [])
        .map((trait) => stringValue(trait.index))
        .filter(isPresent);

      return {
        breathWeaponTraitIndex: traitIndexes.find((traitIndex) => traitIndex.includes("breath-weapon")),
        damageType: stringValue(sourceJson.damage_type?.name) ?? "Unknown",
        index: stringValue(sourceJson.index) ?? "",
        name: stringValue(sourceJson.name) ?? "Unknown Heritage",
        resistanceTraitIndex: traitIndexes.find((traitIndex) => traitIndex.includes("damage-resistance")),
      };
    })
    .filter((option) => option.index.length > 0);
}

function shortHeritageName(value: string) {
  if (value.startsWith("Draconic Ancestor: ")) {
    const ancestor = value.replace("Draconic Ancestor: ", "");
    return `${ancestor} Dragon`;
  }

  return value;
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

function formatChoiceCount(count: number) {
  return `${count} ${count === 1 ? "choice" : "choices"}`;
}

export {
  mapBackgroundReferences,
  mapClassReferences,
  mapSpeciesReferences,
};
