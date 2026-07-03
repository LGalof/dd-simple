import type {
  ClassFeature,
  FeatureChoiceField,
  FeatureChoiceOption,
} from "../types/characterBuilder";
import { findSpellLibraryRecordByName } from "./spellLibrary";

type DerivedFeatureChoiceSource = {
  description: string;
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait" | "subclass_feature";
  title: string;
};

type FeatureChoiceGrants = {
  derivedSources?: DerivedFeatureChoiceSource[];
  expertiseSkillIndexes?: string[];
  expertiseToolNames?: string[];
  savingThrowProficiencyIndexes?: string[];
  skillProficiencyIndexes?: string[];
  toolNames?: string[];
};

const FIGHTING_STYLE_DESCRIPTIONS: Record<string, string> = {
  archery: "You gain a +2 bonus to attack rolls you make with Ranged weapons.",
  defense: "While you're wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.",
  dueling: "When you're holding a Melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.",
  "great-weapon-fighting":
    "When you roll damage for an attack you make with a Melee weapon that you are holding with two hands, you can treat any 1 or 2 on a damage die as a 3. The weapon must have the Two-Handed or Versatile property to gain this benefit.",
  protection: "When a creature you can see attacks a target other than you that is within 5 feet of you, you can take a Reaction to impose Disadvantage on the attack roll. You must be holding a Shield to use this Reaction.",
  "two-weapon-fighting":
    "When you make an extra attack as a result of using a weapon that has the Light property, you can add your ability modifier to the damage of that attack if you aren't already adding it to the damage.",
};

const WEAPON_MASTERY_DESCRIPTIONS: Record<string, string> = {
  cleave: "If you hit a creature with this weapon, you can make a melee attack roll with it against a second creature within 5 feet of the first and within your reach.",
  graze: "If your attack roll misses a creature, you can still deal damage to that creature equal to the ability modifier used to make the attack roll.",
  nick: "When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can still make only one extra attack from Light weapons each turn.",
  push: "If you hit a Large or smaller creature with this weapon, you can push it up to 10 feet straight away from yourself.",
  sap: "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
  slow: "If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn.",
  topple: "If you hit a Large or smaller creature with this weapon, you can force it to make a Constitution saving throw or have the Prone condition.",
  vex: "If you hit a creature with this weapon and deal damage to it, you have Advantage on your next attack roll against that creature before the end of your next turn.",
};

const METAMAGIC_DESCRIPTIONS: Record<string, string> = {
  "careful-spell": "Protect chosen creatures from the worst effects of one of your spells.",
  "distant-spell": "Extend the range of a spell, or let a Touch spell reach farther than normal.",
  "empowered-spell": "Reroll a number of damage dice on a spell when the result matters.",
  "extended-spell": "Double the duration of a spell that lasts at least 1 minute.",
  "heightened-spell": "Make one target more likely to fail its first saving throw against the spell.",
  "quickened-spell": "Cast a qualifying spell as a Bonus Action instead of a full Action.",
  "subtle-spell": "Cast without verbal or somatic components when stealth or restraint matters.",
  "twinned-spell": "Spend sorcery to affect an extra target when the spell qualifies for twinning.",
};

const PACT_BOON_DESCRIPTIONS: Record<string, string> = {
  "pact-of-the-blade": "Your pact manifests through a bonded weapon, letting your warlock magic lean into martial pressure.",
  "pact-of-the-chain": "Your pact deepens familiar magic and gives you a more potent supernatural companion.",
  "pact-of-the-tome": "Your patron grants a Book of Shadows filled with extra magical study, cantrips, and ritual potential.",
};

const ELDRITCH_INVOCATION_DESCRIPTIONS: Record<string, string> = {
  "eldritch-invocation-agonizing-blast": "Add your Charisma modifier to the damage of Eldritch Blast.",
  "eldritch-invocation-armor-of-shadows": "You can cast Mage Armor on yourself without expending a spell slot.",
  "eldritch-invocation-ascendant-step": "You can cast Levitate on yourself at will without expending a spell slot.",
  "eldritch-invocation-beast-speech": "You can cast Speak with Animals at will without expending a spell slot.",
  "eldritch-invocation-beguiling-influence": "You gain proficiency in Deception and Persuasion.",
  "eldritch-invocation-bewitching-whispers": "You can cast Compulsion using a warlock spell slot.",
  "eldritch-invocation-book-of-ancient-secrets": "Your Book of Shadows learns extra ritual magic that broadens your utility outside combat.",
  "eldritch-invocation-chains-of-carceri": "You can bind certain extraplanar creatures with powerful chain magic.",
  "eldritch-invocation-devils-sight": "You can see normally in Darkness, including magical Darkness, out to 120 feet.",
  "eldritch-invocation-dreadful-word": "You can cast Confusion using a warlock spell slot.",
  "eldritch-invocation-eldritch-sight": "You can cast Detect Magic at will without expending a spell slot.",
  "eldritch-invocation-eldritch-spear": "Eldritch Blast reaches much farther than normal.",
  "eldritch-invocation-eyes-of-the-rune-keeper": "You can read all writing.",
  "eldritch-invocation-fiendish-vigor": "You can cast False Life on yourself at will without expending a spell slot.",
  "eldritch-invocation-gaze-of-two-minds": "You can perceive through another willing creature's senses at range.",
  "eldritch-invocation-lifedrinker": "Your pact weapon strikes hit harder and carry necrotic force.",
  "eldritch-invocation-mask-of-many-faces": "You can cast Disguise Self at will without expending a spell slot.",
  "eldritch-invocation-master-of-myriad-forms": "You can cast Alter Self at will without expending a spell slot.",
  "eldritch-invocation-minions-of-chaos": "You can cast Conjure Elemental using a warlock spell slot.",
  "eldritch-invocation-mire-the-mind": "You can cast Slow using a warlock spell slot.",
  "eldritch-invocation-misty-visions": "You can cast Silent Image at will without expending a spell slot.",
  "eldritch-invocation-one-with-shadows": "You can turn Invisible in darkness or dim light while remaining still.",
  "eldritch-invocation-otherworldly-leap": "You can cast Jump on yourself at will without expending a spell slot.",
  "eldritch-invocation-repelling-blast": "Eldritch Blast can push creatures away when it hits.",
  "eldritch-invocation-sculptor-of-flesh": "You can cast Polymorph using a warlock spell slot.",
  "eldritch-invocation-sign-of-ill-omen": "You can cast Bestow Curse using a warlock spell slot.",
  "eldritch-invocation-thief-of-five-fates": "You can cast Bane using a warlock spell slot.",
  "eldritch-invocation-thirsting-blade": "Your pact weapon can strike more than once when you take the Attack action.",
  "eldritch-invocation-visions-of-distant-realms": "You can cast Arcane Eye at will without expending a spell slot.",
  "eldritch-invocation-voice-of-the-chain-master": "You command your familiar through a much stronger supernatural bond.",
  "eldritch-invocation-whispers-of-the-grave": "You can cast Speak with Dead at will without expending a spell slot.",
  "eldritch-invocation-witch-sight": "You can see the true form of shapechangers and disguised creatures.",
};

const ELEMENTAL_FURY_DESCRIPTIONS: Record<string, string> = {
  "potent-spellcasting": "Your Druid cantrips strike harder thanks to your sharpened elemental magic.",
  "primal-strike": "Your weapon attacks carry extra elemental force when you fight in person.",
};

function buildFeatureChoiceGrants(
  feature: ClassFeature,
  field: FeatureChoiceField,
  selectedOption: FeatureChoiceOption,
): FeatureChoiceGrants | null {
  const selectedIndex = (selectedOption.selectedOptionIndex ?? selectedOption.value ?? "").toLowerCase();
  const selectedName = selectedOption.selectedOptionName ?? selectedOption.label;
  const selectedUrl = selectedOption.selectedOptionUrl ?? null;
  const sourceType = resolveDerivedSourceType(field);
  const level = field.level ?? feature.level ?? null;
  const choiceKind = field.choiceKind ?? "option";

  const directDescription =
    selectedOption.description?.trim() ||
    (choiceKind === "fighting-style"
      ? FIGHTING_STYLE_DESCRIPTIONS[selectedIndex]
      : choiceKind === "weapon-mastery"
        ? WEAPON_MASTERY_DESCRIPTIONS[selectedIndex]
        : choiceKind === "metamagic"
          ? METAMAGIC_DESCRIPTIONS[selectedIndex]
          : choiceKind === "pact-boon"
            ? PACT_BOON_DESCRIPTIONS[selectedIndex]
            : choiceKind === "eldritch-invocation"
              ? ELDRITCH_INVOCATION_DESCRIPTIONS[selectedIndex]
              : choiceKind === "elemental-fury"
                ? ELEMENTAL_FURY_DESCRIPTIONS[selectedIndex]
                : null);

  if (directDescription) {
    const extraSkillProficiencies =
      selectedIndex === "eldritch-invocation-beguiling-influence"
        ? ["deception", "persuasion"]
        : undefined;

    return {
      derivedSources: [
        {
          description: directDescription,
          level,
          sourceIndex: selectedIndex || slugify(selectedName),
          sourceType,
          title: selectedName,
        },
      ],
      skillProficiencyIndexes: extraSkillProficiencies,
    };
  }

  if (choiceKind === "scholar") {
    return {
      derivedSources: [
        {
          description: `You gain Expertise in ${stripReferencePrefix(selectedName)}.`,
          level,
          sourceIndex: `scholar-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Scholar: ${stripReferencePrefix(selectedName)}`,
        },
      ],
      expertiseSkillIndexes: [toSkillIndex(selectedName)],
    };
  }

  if (choiceKind === "expertise") {
    const normalizedName = stripReferencePrefix(selectedName);
    const skillIndex = toSkillIndex(selectedName);

    return {
      derivedSources: [
        {
          description: `${normalizedName} gains Expertise for this character.`,
          level,
          sourceIndex: `expertise-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Expertise: ${normalizedName}`,
        },
      ],
      ...(skillIndex
        ? { expertiseSkillIndexes: [skillIndex] }
        : { expertiseToolNames: [normalizedName] }),
    };
  }

  if (choiceKind === "skill-proficiency") {
    const skillIndex = toSkillIndex(selectedName);
    const normalizedName = stripReferencePrefix(selectedName);
    const isToolChoice = selectedName.toLowerCase().startsWith("tool:");

    return {
      derivedSources: [
        {
          description: `You gain proficiency with ${normalizedName}.`,
          level,
          sourceIndex: `proficiency-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Proficiency: ${normalizedName}`,
        },
      ],
      ...(!isToolChoice && skillIndex
        ? { skillProficiencyIndexes: [skillIndex] }
        : { toolNames: [normalizedName] }),
    };
  }

  if (field.id === "feat-ability-resilient") {
    const abilityIndex = selectedOption.value.toLowerCase();

    return {
      derivedSources: [
        {
          description: `You increase ${selectedName} by 1 and gain proficiency in ${selectedName} saving throws.`,
          level,
          sourceIndex: `resilient-${abilityIndex}`,
          sourceType,
          title: `Resilient: ${selectedName}`,
        },
      ],
      savingThrowProficiencyIndexes: [`saving-throw-${abilityIndex}`],
    };
  }

  if (choiceKind === "tool-proficiency") {
    const normalizedName = stripReferencePrefix(selectedName);

    return {
      derivedSources: [
        {
          description: `You gain proficiency with ${normalizedName}.`,
          level,
          sourceIndex: `tool-proficiency-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Tool Proficiency: ${normalizedName}`,
        },
      ],
      toolNames: [normalizedName],
    };
  }

  if (shouldCreateSpellSource(field, selectedUrl, selectedName)) {
    return {
      derivedSources: [
        {
          description: buildSpellChoiceDescription(feature.title, selectedName, field.label),
          level,
          sourceIndex: selectedIndex || slugify(selectedName),
          sourceType,
          title: selectedName,
        },
      ],
    };
  }

  return null;
}

function shouldCreateSpellSource(
  field: FeatureChoiceField,
  selectedUrl: string | null,
  selectedName: string,
) {
  if (selectedUrl?.toLowerCase().includes("/spells/")) {
    return true;
  }

  const searchableText = [
    field.choiceKind,
    field.choiceGroupId,
    field.choiceGroupLabel,
    field.choiceKey,
    field.choiceLabel,
    field.label,
    selectedUrl,
    selectedName,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return (
    searchableText.includes(" cantrip") ||
    searchableText.includes("level 1 spell") ||
    searchableText.includes("prepared spell") ||
    searchableText.includes("mystic arcanum") ||
    searchableText.includes("ritual")
  );
}

function buildSpellChoiceDescription(
  featureTitle: string,
  selectedName: string,
  fieldLabel: string,
) {
  const normalizedField = fieldLabel.toLowerCase();
  const normalizedFeatureTitle = featureTitle.toLowerCase();
  const spellRecord = findSpellLibraryRecordByName(selectedName);

  if (normalizedFeatureTitle.includes("magical discoveries")) {
    if (spellRecord?.level === 0) {
      return `You learn the cantrip ${selectedName} through ${featureTitle}.`;
    }

    if (typeof spellRecord?.level === "number") {
      return `You add the level ${spellRecord.level} spell ${selectedName} to the spells prepared through ${featureTitle}.`;
    }

    return `You add the spell ${selectedName} to the spells prepared through ${featureTitle}.`;
  }

  if (normalizedFeatureTitle.includes("magic initiate")) {
    if (spellRecord?.level === 0) {
      return `You learn the cantrip ${selectedName} through ${featureTitle}.`;
    }

    if (typeof spellRecord?.level === "number") {
      return `You learn the level ${spellRecord.level} spell ${selectedName} through ${featureTitle}.`;
    }
  }

  if (normalizedField.includes("cantrip")) {
    return `You learn the cantrip ${selectedName} through ${featureTitle}.`;
  }

  if (typeof spellRecord?.level === "number") {
    return `You learn the level ${spellRecord.level} spell ${selectedName} through ${featureTitle}.`;
  }

  if (normalizedField.includes("prepared")) {
    return `You add ${selectedName} to the spells prepared through ${featureTitle}.`;
  }

  if (normalizedField.includes("spellbook")) {
    return `You add the spell ${selectedName} to your spellbook through ${featureTitle}.`;
  }

  if (normalizedField.includes("ritual")) {
    return `You add the ritual spell ${selectedName} through ${featureTitle}.`;
  }

  if (featureTitle.toLowerCase().includes("mystic arcanum")) {
    return `You can cast the spell ${selectedName} through ${featureTitle}.`;
  }

  return `You learn or gain access to the spell ${selectedName} through ${featureTitle}.`;
}

function resolveDerivedSourceType(
  field: FeatureChoiceField,
): DerivedFeatureChoiceSource["sourceType"] {
  if (field.sourceType === "SPECIES") {
    return "species_trait";
  }

  if (field.subclassIndex) {
    return "subclass_feature";
  }

  return "class_feature";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function stripReferencePrefix(value: string) {
  return value
    .replace(/^Skill: /, "")
    .replace(/^Tool: /, "")
    .replace(/^Saving Throw: /, "");
}

function toSkillIndex(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/^skill:\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized.length > 0 && !normalized.includes("tool") ? normalized : "";
}

export { buildFeatureChoiceGrants };
