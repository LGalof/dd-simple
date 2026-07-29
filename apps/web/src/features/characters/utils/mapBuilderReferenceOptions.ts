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
  ClassSpellcastingInfo,
  ClassSpellcastingLevelSummary,
  ClassSubclassOption,
  FeatureChoiceField,
  FeatureChoiceKind,
  FeatureChoiceOption,
  SpeciesOption,
  SpeciesHeritageOption,
} from "../types/characterBuilder";
import {
  getFeatAbilityChoiceFieldConfigs,
  getMagicInitiateFixedSpellChoiceFieldConfigs,
} from "./featAbilityChoiceFields";

type ReferenceItem = {
  description?: unknown;
  index?: unknown;
  name?: unknown;
  url?: unknown;
};

type SpellcastingInfoSource = {
  desc?: unknown;
  name?: unknown;
};

type SpellcastingSourceJson = {
  info?: SpellcastingInfoSource[];
  level?: unknown;
  spellcasting_ability?: ReferenceItem;
};

type ChoiceOption = {
  choice?: Choice;
  count?: unknown;
  description?: unknown;
  item?: ReferenceItem;
  items?: ChoiceOption[];
  of?: ReferenceItem;
  unit?: unknown;
};

type ChoiceOptionData = {
  description?: string | null;
  label: string;
  nestedChoice?: Choice;
  nestedChoicePath?: string;
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

const HUMAN_SKILL_OPTIONS: ChoiceOptionData[] = [
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
].map((name) => ({
  label: name,
  selectedOptionIndex: `skill-${slugify(name)}`,
  selectedOptionName: name,
  selectedOptionType: "reference",
  selectedOptionUrl: `/api/2024/proficiencies/skill-${slugify(name)}`,
  value: slugify(name),
}));

const HUMAN_FEAT_OPTIONS: ChoiceOptionData[] = [
  "Alert",
  "Crafter",
  "Healer",
  "Lucky",
  "Magic Initiate",
  "Musician",
  "Savage Attacker",
  "Skilled",
  "Tavern Brawler",
  "Actor",
  "Athlete",
  "Charger",
  "Durable",
  "Heavy Armor Master",
  "Lightly Armored",
  "Protection",
  "Resilient",
  "Tough",
].map((name) => ({
  label: name,
  selectedOptionIndex: slugify(name),
  selectedOptionName: name,
  selectedOptionType: "reference",
  selectedOptionUrl: `/api/2024/feats/${slugify(name)}`,
  value: slugify(name),
}));

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

const WEAPON_MASTERY_OPTION_DESCRIPTIONS: Record<string, string> = {
  cleave:
    "If you hit a creature with this weapon, you can make a melee attack roll with it against a second creature within 5 feet of the first and within your reach.",
  graze:
    "If your attack roll misses a creature, you can still deal damage to that creature equal to the ability modifier used to make the attack roll.",
  nick:
    "When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can still make only one extra attack from Light weapons each turn.",
  push:
    "If you hit a Large or smaller creature with this weapon, you can push it up to 10 feet straight away from yourself.",
  sap:
    "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
  slow:
    "If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn.",
  topple:
    "If you hit a Large or smaller creature with this weapon, you can force it to make a Constitution saving throw or have the Prone condition.",
  vex:
    "If you hit a creature with this weapon and deal damage to it, you have Advantage on your next attack roll against that creature before the end of your next turn.",
};

type ClassSourceJson = {
  hit_die?: unknown;
  primary_ability?: {
    desc?: unknown;
  };
  proficiencies?: ReferenceItem[];
  proficiency_choices?: Choice[];
  saving_throws?: ReferenceItem[];
  spellcasting?: SpellcastingSourceJson;
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
  class_specific?: Record<string, unknown>;
  features?: ReferenceItem[];
  level?: unknown;
  spellcasting?: Record<string, unknown>;
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
                title: speciesHeritageChoiceTitle(reference.index),
                subtitle: "1 Choice",
                details: speciesHeritageChoiceDetails(reference.index, heritageOptions),
                choiceFields: [
                  createChoiceField(
                    "heritage",
                    speciesHeritageChoiceLabel(reference.index),
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
                  "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot Line that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 damage of the type determined by your Draconic Ancestry trait. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).",
                  "You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
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
        ...(reference.index === "human"
          ? createHumanChoiceSections(reference.index)
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

function speciesHeritageChoiceTitle(speciesIndex: string) {
  if (speciesIndex === "dragonborn") {
    return "Draconic Ancestry";
  }

  if (speciesIndex === "elf") {
    return "Elven Lineages";
  }

  if (speciesIndex === "gnome") {
    return "Gnomish Lineage";
  }

  if (speciesIndex === "tiefling") {
    return "Fiendish Legacy";
  }

  return "Heritage";
}

function speciesHeritageChoiceLabel(speciesIndex: string) {
  if (speciesIndex === "dragonborn") {
    return "Dragon Heritage";
  }

  if (speciesIndex === "elf") {
    return "Elven Lineage";
  }

  if (speciesIndex === "gnome") {
    return "Gnomish Lineage";
  }

  if (speciesIndex === "tiefling") {
    return "Fiendish Legacy";
  }

  return "Heritage";
}

function speciesHeritageChoiceDetails(
  speciesIndex: string,
  heritageOptions: SpeciesHeritageOption[],
) {
  if (speciesIndex === "dragonborn") {
    return [
      "Choose the dragon lineage that defines your Breath Weapon and Damage Resistance.",
      ...heritageOptions.map((option) => `${shortHeritageName(option.name)} -> ${option.damageType}`),
    ];
  }

  if (speciesIndex === "elf") {
    return [
      "Choose the elven lineage that grants your lineage magic and special traits.",
      "Drow -> Darkvision 120 ft., Dancing Lights, Faerie Fire, Darkness",
      "High Elf -> Prestidigitation, Detect Magic, Misty Step",
      "Wood Elf -> Speed 35 ft., Druidcraft, Longstrider, Pass without Trace",
    ];
  }

  if (speciesIndex === "gnome") {
    return [
      "Choose the gnomish lineage that grants your supernatural abilities.",
      "Forest Gnome -> Minor Illusion, always-prepared Speak with Animals, and slot-free uses equal to your Proficiency Bonus.",
      "Rock Gnome -> Mending, Prestidigitation, and tiny clockwork devices.",
    ];
  }

  if (speciesIndex === "tiefling") {
    return [
      "Choose the fiendish legacy that grants your resistance and legacy spells.",
      "Abyssal -> Poison resistance, Poison Spray, Ray of Sickness, Hold Person",
      "Chthonic -> Necrotic resistance, Chill Touch, False Life, Ray of Enfeeblement",
      "Infernal -> Fire resistance, Fire Bolt, Hellish Rebuke, Darkness",
    ];
  }

  return ["Choose the heritage that shapes this species-specific feature set."];
}

function createHumanChoiceSections(speciesIndex: string) {
  return [
    {
      id: `${speciesIndex}-skillful`,
      title: "Skillful",
      subtitle: "1 Choice",
      details: ["You gain proficiency in one skill of your choice."],
      choiceFields: [
        createChoiceField("skillful-skill", "Skill Proficiency", HUMAN_SKILL_OPTIONS, {
          choiceKey: "feat-proficiency-skillful",
          choiceKind: "skill-proficiency",
          choiceLabel: "Skillful",
          choicePath: "species.skillful",
          sourceIndex: speciesIndex,
          sourceType: "SPECIES",
        }),
      ],
    },
    {
      id: `${speciesIndex}-versatile`,
      title: "Versatile",
      subtitle: "1 Choice",
      details: ["You gain one Origin feat of your choice."],
      choiceFields: [
        createChoiceField("versatile-feat", "Origin Feat", HUMAN_FEAT_OPTIONS, {
          choiceKey: "feat-selection-versatile",
          choiceKind: "feat",
          choiceLabel: "Versatile",
          choicePath: "species.versatile",
          sourceIndex: speciesIndex,
          sourceType: "SPECIES",
        }),
      ],
    },
  ];
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
    const featSubtitleParts = ["Granted Feat"];
    const originFeatChoiceFields = createBackgroundOriginFeatChoiceFields(
      reference.index,
      featName,
      featNote,
    );

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
          choiceFields: originFeatChoiceFields.length > 0 ? originFeatChoiceFields : undefined,
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
      ],
    };
  });
}

function createBackgroundOriginFeatChoiceFields(
  backgroundIndex: string,
  featName: string,
  featNote: string | null,
): FeatureChoiceField[] {
  const magicInitiateSpellList = getBackgroundMagicInitiateSpellList(backgroundIndex, featName, featNote);

  if (!magicInitiateSpellList) {
    return [];
  }

  return getMagicInitiateFixedSpellChoiceFieldConfigs(
    magicInitiateSpellList.value,
    magicInitiateSpellList.label,
  ).map((fieldConfig) =>
    createChoiceField(fieldConfig.id, fieldConfig.label, fieldConfig.options, {
      choiceGroupId: fieldConfig.choiceGroupId,
      choiceGroupLabel: fieldConfig.choiceGroupLabel,
      choiceGroupLimit: fieldConfig.choiceGroupLimit,
      choiceKind: fieldConfig.choiceKind,
      choicePath: `feat.magicInitiate.${fieldConfig.id}`,
      sourceIndex: backgroundIndex,
      sourceType: "BACKGROUND",
    }),
  );
}

function getBackgroundMagicInitiateSpellList(
  backgroundIndex: string,
  featName: string,
  featNote: string | null,
) {
  const normalizedFeat = slugify([featName, featNote].filter(isPresent).join(" "));

  if (!normalizedFeat.includes("magic-initiate")) {
    return null;
  }

  if (backgroundIndex === "acolyte" || normalizedFeat.includes("cleric")) {
    return {
      label: "Cleric",
      value: "cleric",
    };
  }

  if (backgroundIndex === "sage" || normalizedFeat.includes("wizard")) {
    return {
      label: "Wizard",
      value: "wizard",
    };
  }

  return null;
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
  featDocuments: ReferenceRuleDocument[] = [],
): ClassOption[] {
  if (references.length === 0) {
    return fallbackOptions;
  }

  const featDocumentMap = new Map(featDocuments.map((document) => [document.index, document]));

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
    const normalizedFeatures = createNormalizedClassFeatures(
      reference.features ?? [],
      reference.index,
    );
    const classChoiceFeature = createClassChoiceFeature(reference, sourceJson, normalizedFeatures);
    const subclasses = getClassSubclasses(
      reference.index,
      sourceJson,
      subclassDocuments,
      featureDocuments,
    );
    const rawFeatures =
      normalizedFeatures.length > 0
        ? [...classChoiceFeature, ...normalizedFeatures]
        : createReferenceBackedClassFeatures(
            reference,
            sourceJson,
            levelDocuments,
            featureDocuments,
          );
    const features = enrichFeatureChoiceOptionDescriptions(rawFeatures, featDocumentMap);

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
      ],
      savingThrows,
      skillChoices: {
        choose: normalizedSkillChoice?.choose ?? numberValue(proficiencyChoice?.choose) ?? fallback?.skillChoices.choose ?? 0,
        options: skillOptions,
      },
      proficiencies: groupedProficiencies,
      spellcasting: createClassSpellcastingInfo(reference, sourceJson),
      startingEquipment,
      subclasses,
      features,
    };
  });
}

function createClassSpellcastingInfo(
  reference: ReferenceClass,
  sourceJson: ClassSourceJson,
): ClassSpellcastingInfo | undefined {
  const levelSummaries = createSpellcastingLevelSummaries(reference.levels ?? []);
  const spellcastingAbility = sourceJson.spellcasting?.spellcasting_ability;
  const abilityIndex = stringValue(spellcastingAbility?.index);
  const abilityName = stringValue(spellcastingAbility?.name);

  if (!abilityIndex && levelSummaries.length === 0) {
    return undefined;
  }

  return {
    abilityIndex,
    abilityName,
    castingType: inferClassCastingType(reference.index),
    levels: levelSummaries,
    notes: getSpellcastingNotes(sourceJson.spellcasting),
    source: sourceJson.spellcasting ? "reference" : "level-reference",
  };
}

function createSpellcastingLevelSummaries(
  levels: NonNullable<ReferenceClass["levels"]>,
): ClassSpellcastingLevelSummary[] {
  return levels
    .map((levelReference) => {
      const sourceJson = asRecord(levelReference.sourceJson) as LevelSourceJson;
      const spellcasting = asRecord(sourceJson.spellcasting);

      if (!Object.keys(spellcasting).length) {
        return null;
      }

      const level = numberValue(sourceJson.level) ?? levelReference.level;
      const spellSlots = Object.entries(spellcasting)
        .map(([key, value]) => {
          const match = key.match(/^spell_slots_level_(\d+)$/);
          const slots = numberValue(value);

          return match && slots !== null && slots > 0
            ? {
                level: Number(match[1]),
                slots,
              }
            : null;
        })
        .filter(isPresent);
      const cantripsKnown = numberValue(spellcasting.cantrips_known) ?? undefined;
      const spellsKnown = numberValue(spellcasting.spells_known) ?? undefined;
      const preparedSpells =
        numberValue(spellcasting.prepared_spells) ??
        numberValue(sourceJson.class_specific?.prepared_spells) ??
        undefined;

      if (
        spellSlots.length === 0 &&
        cantripsKnown === undefined &&
        spellsKnown === undefined &&
        preparedSpells === undefined
      ) {
        return null;
      }

      return {
        cantripsKnown,
        level,
        preparedSpells,
        spellSlots,
        spellsKnown,
      };
    })
    .filter(isPresent)
    .sort((left, right) => left.level - right.level);
}

function getSpellcastingNotes(sourceJson: SpellcastingSourceJson | undefined) {
  if (!sourceJson) {
    return [];
  }

  const notes: string[] = [];
  const focusText = (sourceJson.info ?? [])
    .find((entry) => stringValue(entry.name)?.toLowerCase().includes("focus"))
    ?.desc;
  const focusDescription = Array.isArray(focusText)
    ? focusText.find((entry): entry is string => typeof entry === "string")
    : null;

  if (focusDescription) {
    notes.push(focusDescription);
  }

  return notes;
}

function inferClassCastingType(classIndex: string): ClassSpellcastingInfo["castingType"] {
  if (["bard", "cleric", "wizard"].includes(classIndex)) {
    return "full-caster";
  }

  return "unknown";
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

function createClassChoiceFeature(
  reference: ReferenceClass,
  sourceJson: ClassSourceJson,
  existingFeatures: ClassFeature[] = [],
): ClassFeature[] {
  const normalizedSkillChoice = normalizedClassSkillChoice(reference);
  const hasCuratedSkillChoiceFeature = hasCuratedClassSkillChoiceFeature(existingFeatures);
  const sourceProficiencyChoices = (sourceJson.proficiency_choices ?? []).map((choice) =>
    normalizeClassProficiencyChoiceForBuilder(choice),
  );
  const sourceSkillChoiceIndex = normalizedSkillChoice
    ? sourceProficiencyChoices.findIndex((choice) => isSourceSkillChoice(choice))
    : -1;
  const sourceFallbackChoices = normalizedSkillChoice || hasCuratedSkillChoiceFeature
    ? sourceProficiencyChoices
        .map((choice, index) => ({ choice, index }))
        .filter(({ choice }) => !isSourceSkillChoice(choice))
    : sourceProficiencyChoices.map((choice, index) => ({ choice, index }));
  const classChoiceFields = [
    ...(normalizedSkillChoice && !hasCuratedSkillChoiceFeature
      ? createChoiceFieldsFromNormalizedSkillChoice(normalizedSkillChoice, {
          baseChoicePath:
            sourceSkillChoiceIndex >= 0
              ? `proficiency_choices[${sourceSkillChoiceIndex}]`
              : undefined,
          classIndex: reference.index,
          level: 1,
          sourceIndex: reference.index,
          sourceType: "CLASS",
        })
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

function hasCuratedClassSkillChoiceFeature(features: ClassFeature[]) {
  return features.some((feature) =>
    feature.level === 1 &&
    /^Core .+ Traits$/.test(feature.title) &&
    (feature.choiceFields ?? []).some((field) => field.choiceKind === "skill-proficiency"),
  );
}

function isSourceSkillChoice(choice: Choice) {
  const options = choice.from?.options ?? [];

  return options.length > 0 && options.every((option) => {
    const index = stringValue(option.item?.index);
    const name = stringValue(option.item?.name);

    return Boolean(index?.startsWith("skill-") || name?.startsWith("Skill: "));
  });
}

function normalizeClassProficiencyChoiceForBuilder(choice: Choice) {
  if (!isRecord(choice)) {
    return choice;
  }

  const choose = numberValue(choice.choose);
  const options = Array.isArray(choice.from?.options) ? choice.from.options : [];

  if (choose !== 1 || options.length === 0) {
    return choice;
  }

  const flattenedOptions = options.flatMap((option) => {
    if (!isRecord(option)) {
      return [];
    }

    const nestedChoice = isRecord(option.choice) ? option.choice : null;
    const nestedChoose = numberValue(nestedChoice?.choose);
    const nestedOptions = Array.isArray(nestedChoice?.from?.options) ? nestedChoice.from.options : [];

    if (nestedChoose !== 1 || nestedOptions.length === 0) {
      return [];
    }

    return nestedOptions.filter((nestedOption) => {
      if (!isRecord(nestedOption)) {
        return false;
      }

      const item = isRecord(nestedOption.item) ? nestedOption.item : null;
      const index = stringValue(item?.index);
      const name = stringValue(item?.name);

      return Boolean(
        item &&
          index &&
          name &&
          (name.startsWith("Tool: ") || isLikelyInstrumentName(name)),
      );
    });
  });

  if (flattenedOptions.length === 0) {
    return choice;
  }

  const dedupedOptions = Array.from(
    new Map(
      flattenedOptions.map((option) => {
        const item = isRecord(option.item) ? option.item : null;
        const key = stringValue(item?.index) ?? JSON.stringify(option);

        return [key, option] as const;
      }),
    ).values(),
  );

  return {
    ...choice,
    desc: "Choose one type of artisan's tools or one musical instrument.",
    field_label: "Tool proficiency",
    type: "tool proficiency",
    from: {
      option_set_type: "options_array",
      options: dedupedOptions,
    },
  };
}

function createChoiceFieldsFromNormalizedSkillChoice(
  choice: NonNullable<ReturnType<typeof normalizedClassSkillChoice>>,
  context: Pick<
    FeatureChoiceField,
    "classIndex" | "level" | "sourceIndex" | "sourceType"
  > & {
    baseChoicePath?: string;
  },
): FeatureChoiceField[] {
  return Array.from({ length: choice.choose }, (_, index) =>
    createChoiceField(
      choice.choose === 1 ? "class-skill-choice" : `class-skill-choice-${index + 1}`,
      choice.choose === 1 ? "Skill proficiency" : `Skill proficiency ${index + 1}`,
      choice.valueOptions.map((option) => ({
        ...option,
        selectedOptionIndex: option.value,
        selectedOptionName: option.label,
        selectedOptionType: "reference",
        selectedOptionUrl: `/api/2024/proficiencies/${option.value}`,
        selectedRawJson: {
          item: {
            index: option.value,
            name: option.label,
            url: `/api/2024/proficiencies/${option.value}`,
          },
          option_type: "reference",
        },
      })),
      {
        choiceKind: "skill-proficiency",
        choiceGroupId: "class-skill-choice",
        choiceGroupLabel: choice.description ?? `Choose ${choice.choose} skill proficiencies`,
        choiceGroupLimit: choice.choose,
        choicePath:
          choice.choose === 1
            ? context.baseChoicePath
            : appendChoicePath(context.baseChoicePath, `slot${index + 1}`),
        classIndex: context.classIndex,
        level: context.level,
        sourceIndex: context.sourceIndex,
        sourceType: context.sourceType,
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
      const subclassIndex = stringValue(featureSourceJson.subclass?.index);

      if (subclassIndex) {
        return null;
      }

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
          subclassIndex,
        },
      );
      const normalizedText = normalizeFeatureDisplayText({
        description: feature.description,
        details: feature.details,
        sourceDescriptions: featureSourceJson.desc,
        summary: feature.summary,
      });

      return createFeature({
        id: feature.index ?? feature.id,
        level: feature.level,
        title: feature.title ?? feature.name ?? feature.index ?? feature.id,
        summary: normalizedText.summary,
        details: normalizedText.details,
        choiceFields:
          choiceFields.length > 0
            ? augmentFeatAbilityChoiceFields(choiceFields)
            : undefined,
      });
    })
    .filter(isPresent)
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
          const subclassIndex = stringValue(featureSourceJson.subclass?.index) ?? undefined;

          if (subclassIndex) {
            return null;
          }

          const descriptions = Array.isArray(featureSourceJson.desc)
            ? featureSourceJson.desc.filter((entry): entry is string => typeof entry === "string")
            : [];
          const normalizedText = normalizeFeatureDisplayText({
            sourceDescriptions: descriptions,
          });
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
              subclassIndex,
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
            summary: normalizedText.summary,
            details: normalizedText.details,
            choiceFields:
              choiceFields.length > 0
                ? augmentFeatAbilityChoiceFields(choiceFields)
                : undefined,
            subclassIndex,
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

function normalizeFeatureDisplayText({
  description,
  details,
  sourceDescriptions,
  summary,
}: {
  description?: string | null;
  details?: string[];
  sourceDescriptions?: unknown;
  summary?: string | null;
}) {
  const sourceParagraphs = Array.isArray(sourceDescriptions)
    ? sourceDescriptions.filter((entry): entry is string => typeof entry === "string")
    : [];
  const combinedParagraphs = dedupeParagraphs([
    ...normalizePreviewParagraphs(sourceParagraphs),
    ...normalizePreviewParagraphs(details ?? []),
    ...normalizePreviewParagraphs(description ? [description] : []),
  ]);
  const preferredSummary = normalizePreviewParagraphs(summary ? [summary] : [])[0];
  const baseSummary = preferredSummary ?? combinedParagraphs[0] ?? "No description available from reference data.";

  if (combinedParagraphs.length === 0) {
    return {
      summary: trimDescription(baseSummary),
      details: undefined,
    };
  }

  const { summaryText, detailFromSummary } = splitSummarySentence(baseSummary);
  const remainingDetails = dedupeParagraphs([
    ...(detailFromSummary ? [detailFromSummary] : []),
    ...combinedParagraphs.filter((paragraph) => paragraph !== combinedParagraphs[0]),
  ]);

  return {
    summary: trimDescription(summaryText),
    details: remainingDetails.length > 0 ? remainingDetails : undefined,
  };
}

function normalizePreviewParagraphs(values: string[]) {
  return values
    .flatMap((value) => splitParagraphs(value))
    .map(cleanReferenceParagraph)
    .filter(isPresent);
}

function getRuleDescription(...values: unknown[]) {
  return normalizePreviewParagraphs(
    values.flatMap((value) =>
      Array.isArray(value)
        ? value.filter((entry): entry is string => typeof entry === "string")
        : typeof value === "string"
          ? [value]
          : [],
    ),
  ).join(" ");
}

function cleanReferenceParagraph(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*•\s*/g, " • ")
    .replace(/\s*-\s*/g, " - ")
    .trim();
}

function dedupeParagraphs(values: string[]) {
  return Array.from(new Set(values.filter(isPresent)));
}

function splitSummarySentence(value: string) {
  const cleaned = cleanReferenceParagraph(value);
  const sentenceMatch = cleaned.match(/^(.+?[.!?])(?:\s+|$)(.+)$/);

  if (!sentenceMatch || cleaned.length < 120) {
    return {
      summaryText: cleaned,
      detailFromSummary: null as string | null,
    };
  }

  return {
    summaryText: sentenceMatch[1].trim(),
    detailFromSummary: sentenceMatch[2].trim() || null,
  };
}

function augmentFeatAbilityChoiceFields(choiceFields: FeatureChoiceField[]) {
  const nextFields = [...choiceFields];

  for (const field of choiceFields) {
    if (field.choiceKind !== "asi-feat" && field.choiceKind !== "epic-boon") {
      continue;
    }

    const featOptions = field.options.map((option) => ({
      label: option.label,
      value: option.selectedOptionIndex ?? option.value,
    }));

    for (const fieldConfig of getFeatAbilityChoiceFieldConfigs(field.id, featOptions)) {
      nextFields.push(
        createChoiceField(fieldConfig.id, fieldConfig.label, fieldConfig.options, {
          choiceKind: fieldConfig.choiceKind,
          choiceGroupId: fieldConfig.choiceGroupId,
          choiceGroupLabel: fieldConfig.choiceGroupLabel,
          choiceGroupLimit: fieldConfig.choiceGroupLimit,
          dependsOnFieldId: fieldConfig.dependsOnFieldId,
          dependsOnValues: fieldConfig.dependsOnValues,
          choicePath: appendChoicePath(field.choicePath, fieldConfig.id),
          classIndex: field.classIndex,
          featureIndex: field.featureIndex,
          level: field.level,
          sourceIndex: field.sourceIndex,
          sourceType: field.sourceType,
          subclassIndex: field.subclassIndex,
        }),
      );
    }
  }

  return nextFields;
}

function getClassSubclasses(
  classIndex: string,
  sourceJson: ClassSourceJson,
  subclassDocuments: ReferenceRuleDocument[],
  featureDocuments: ReferenceRuleDocument[] = [],
): ClassSubclassOption[] {
  const subclassDocumentMap = new Map(subclassDocuments.map((document) => [document.index, document]));
  const subclassFeatureDocumentMap = createSubclassFeatureDocumentMap(featureDocuments);
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
              const level = numberValue(feature.level);

              if (!name || level === null) {
                return null;
              }

              const featureDocument = subclassFeatureDocumentMap.get(
                subclassFeatureDocumentKey(subclassIndex, level, name),
              );
              const featureIndex = featureDocument?.index;
              const featureSourceJson = asRecord(featureDocument?.sourceJson);
              const featureDocumentDescription = getRuleDescription(
                featureSourceJson.desc,
                featureSourceJson.description,
              );
              const fallbackDescription = stringValue(feature.description) ?? "";
              const description = featureDocumentDescription || fallbackDescription;
              const featureSpecific = asRecord(feature).feature_specific ?? featureSourceJson.feature_specific;

              if (!description) {
                return null;
              }

              const choiceFields = createChoiceFieldsFromChoice(
                featureSpecific,
                `feature-${featureIndex ?? `${subclassIndex}-${slugify(name)}`}`,
                "Feature Choice",
                {
                  baseChoicePath: "feature_specific",
                  classIndex,
                  featureIndex,
                  level,
                  sourceIndex: featureIndex ?? `${subclassIndex}-${slugify(name)}`,
                  sourceType: "FEATURE",
                  subclassIndex,
                },
              );

              return {
                name,
                description:
                  normalizePreviewParagraphs([description])[0] ?? trimDescription(description),
                level,
                choiceFields:
                  choiceFields.length > 0
                    ? augmentFeatAbilityChoiceFields(choiceFields)
                    : undefined,
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

function createSubclassFeatureDocumentMap(featureDocuments: ReferenceRuleDocument[]) {
  const featureMap = new Map<string, ReferenceRuleDocument>();

  for (const featureDocument of featureDocuments) {
    const sourceJson = asRecord(featureDocument.sourceJson) as FeatureSourceJson;
    const subclassIndex = stringValue(sourceJson.subclass?.index);
    const level = numberValue(sourceJson.level);
    const name = stringValue(sourceJson.name) ?? featureDocument.name;

    if (!subclassIndex || level === null || !name) {
      continue;
    }

    featureMap.set(subclassFeatureDocumentKey(subclassIndex, level, name), featureDocument);
  }

  return featureMap;
}

function subclassFeatureDocumentKey(subclassIndex: string, level: number, name: string) {
  return `${subclassIndex}:${level}:${slugify(name)}`;
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
  inheritedDependency?: {
    fieldId: string;
    values: string[];
  },
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
        inheritedDependency,
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
  const options = getChoiceOptions(value, choicePath);

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
    const explicitDependsOnFieldId = stringValue(visibleWhen?.field) ?? undefined;
    const explicitDependsOnValues = Array.isArray(visibleWhen?.values)
      ? visibleWhen.values.map((entry) => stringValue(entry)).filter(isPresent)
      : undefined;
    const dependsOnFieldId = explicitDependsOnFieldId ?? inheritedDependency?.fieldId;
    const dependsOnValues =
      explicitDependsOnValues?.length ? explicitDependsOnValues : inheritedDependency?.values;
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

    if (choose === 1) {
      for (const option of options) {
        if (!option.nestedChoice || !option.nestedChoicePath) {
          continue;
        }

        collectChoiceGroups(
          option.nestedChoice,
          `${choiceId}-${option.value}`,
          option.label,
          groups,
          option.nestedChoicePath,
          nextInheritedChoiceKind,
          {
            fieldId: choiceId,
            values: [option.value],
          },
        );
      }
    }
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
      inheritedDependency,
    );
  });
}

function getChoiceOptions(value: Record<string, unknown>, choicePath?: string) {
  const from = isRecord(value.from) ? value.from : null;
  const rawOptions = Array.isArray(from?.options) ? from.options : [];

  return rawOptions
    .map((option, index) =>
      choiceOptionData(option, appendChoicePath(choicePath, `from.options[${index}]`)),
    )
    .filter(isPresent);
}

function choiceOptionData(
  value: unknown,
  optionPath?: string,
): (ChoiceOptionData & { rawLabel: string }) | null {
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
  const description = stringValue(value.description) ?? stringValue(item?.description) ?? stringValue(of?.description);

  if (reference) {
    const rawLabel = count && count > 1 ? `${count} ${reference}` : reference;

    return {
      description,
      label: cleanChoiceOptionLabel(rawLabel),
      rawLabel,
      selectedOptionIndex: referenceIndex,
      selectedOptionName: referenceName ?? rawLabel,
      selectedOptionType: inferSelectedOptionType(value, referenceIndex),
      selectedOptionUrl: referenceUrl,
      selectedRawJson: value,
      value: referenceIndex ?? slugify(rawLabel),
      ...(choice
        ? {
            nestedChoice: choice,
            nestedChoicePath: appendChoicePath(optionPath, "choice"),
          }
        : {}),
    };
  }

  if (choice) {
    const choose = numberValue(choice.choose);
    const type = stringValue(choice.type) ?? "option";
    const rawLabel = stringValue(choice.desc) ?? (choose ? `Choose ${choose} ${type}` : null);

    return rawLabel
      ? {
          label: cleanChoiceOptionLabel(rawLabel),
          nestedChoice: choice,
          nestedChoicePath: appendChoicePath(optionPath, "choice"),
          rawLabel,
          selectedOptionName: rawLabel,
          selectedOptionType: "nested choice",
          selectedRawJson: value,
          value: slugify(rawLabel),
        }
      : null;
  }

  if (items) {
    const options = items.map((entry) => choiceOptionData(entry)).filter(isPresent);

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

  if (text.includes("scholar")) {
    return "scholar";
  }

  if (text.includes("elemental fury")) {
    return "elemental-fury";
  }

  if (text.includes("fighting style")) {
    return "fighting-style";
  }

  if (text.includes("metamagic")) {
    return "metamagic";
  }

  if (text.includes("mystic arcanum")) {
    return "mystic-arcanum";
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
    /\basi\b/.test(text) ||
    /\bfeat\b/.test(text)
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

function isLikelyInstrumentName(value: string) {
  const normalized = value.toLowerCase();

  return [
    "bagpipes",
    "drum",
    "dulcimer",
    "flute",
    "horn",
    "lute",
    "lyre",
    "pan flute",
    "shawm",
    "viol",
  ].includes(normalized);
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
      description: typeof option === "string" ? undefined : option.description ?? undefined,
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

  if (value.startsWith("Elven Lineage: ")) {
    return value.replace("Elven Lineage: ", "");
  }

  if (value.startsWith("Gnomish Lineage: ")) {
    return value.replace("Gnomish Lineage: ", "");
  }

  if (value.startsWith("Fiendish Legacy: ")) {
    return value.replace("Fiendish Legacy: ", "");
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

function enrichFeatureChoiceOptionDescriptions(
  features: ClassFeature[],
  featDocumentMap: Map<string, ReferenceRuleDocument>,
) {
  return features.map((feature) => ({
    ...feature,
    choiceFields: feature.choiceFields?.map((field) => ({
      ...field,
      options: field.options.map((option) => ({
        ...option,
        description:
          option.description ??
          resolveFeatureChoiceOptionDescription(field.choiceKind, option, featDocumentMap),
      })),
    })),
  }));
}

function resolveFeatureChoiceOptionDescription(
  choiceKind: FeatureChoiceField["choiceKind"],
  option: FeatureChoiceOption,
  featDocumentMap: Map<string, ReferenceRuleDocument>,
) {
  const optionIndex = option.selectedOptionIndex?.trim().toLowerCase();

  if (!optionIndex) {
    return null;
  }

  if (choiceKind === "weapon-mastery") {
    return WEAPON_MASTERY_OPTION_DESCRIPTIONS[optionIndex] ?? null;
  }

  const featLikeChoiceKinds = new Set<FeatureChoiceField["choiceKind"]>([
    "asi-feat",
    "epic-boon",
    "fighting-style",
  ]);

  if (
    featLikeChoiceKinds.has(choiceKind) ||
    option.selectedOptionUrl?.toLowerCase().includes("/feats/")
  ) {
    const featSourceJson = asRecord(featDocumentMap.get(optionIndex)?.sourceJson) as FeatSourceJson;
    const description = stringValue(featSourceJson.description);
    const repeatable = stringValue(featSourceJson.repeatable);

    if (!description && !repeatable) {
      return null;
    }

    return [description, repeatable ? `Repeatable: ${repeatable}` : null]
      .filter(isPresent)
      .join(" ");
  }

  return null;
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
