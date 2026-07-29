import {
  compareSpellEntries,
  dedupeSpellEntries,
  getRuleDescription,
} from "./shared.js";
import type {
  CharacterSpellEntry,
  ClassSourceJson,
  ResolvedFeatureSource,
} from "./types.js";

const CORE_CANTRIP_NAMES = new Set(
  [
    "Acid Splash",
    "Blade Ward",
    "Chill Touch",
    "Control Flames",
    "Create Bonfire",
    "Dancing Lights",
    "Druidcraft",
    "Eldritch Blast",
    "Fire Bolt",
    "Friends",
    "Frostbite",
    "Guidance",
    "Gust",
    "Light",
    "Mage Hand",
    "Magic Stone",
    "Mending",
    "Message",
    "Minor Illusion",
    "Mold Earth",
    "Poison Spray",
    "Prestidigitation",
    "Produce Flame",
    "Ray of Frost",
    "Resistance",
    "Sacred Flame",
    "Shape Water",
    "Shillelagh",
    "Shocking Grasp",
    "Spare the Dying",
    "Thaumaturgy",
    "Thorn Whip",
    "Thunderclap",
    "True Strike",
    "Vicious Mockery",
  ].map(normalizeSpellLookupName),
);

const DOMAIN_SPELLS_BY_SOURCE_INDEX: Record<
  string,
  Array<{ characterLevel: number; spellLevel: number; spells: string[] }>
> = {
  "life-domain-spells": [
    { characterLevel: 3, spellLevel: 1, spells: ["Bless", "Cure Wounds"] },
    { characterLevel: 3, spellLevel: 2, spells: ["Aid", "Lesser Restoration"] },
    { characterLevel: 5, spellLevel: 3, spells: ["Mass Healing Word", "Revivify"] },
    { characterLevel: 7, spellLevel: 4, spells: ["Aura of Life", "Death Ward"] },
    { characterLevel: 9, spellLevel: 5, spells: ["Greater Restoration", "Mass Cure Wounds"] },
  ],
  "light-domain-spells": [
    { characterLevel: 3, spellLevel: 1, spells: ["Burning Hands", "Faerie Fire"] },
    { characterLevel: 3, spellLevel: 2, spells: ["Scorching Ray", "See Invisibility"] },
    { characterLevel: 5, spellLevel: 3, spells: ["Daylight", "Fireball"] },
    { characterLevel: 7, spellLevel: 4, spells: ["Arcane Eye", "Wall of Fire"] },
    { characterLevel: 9, spellLevel: 5, spells: ["Flame Strike", "Scrying"] },
  ],
  "trickery-domain-spells": [
    { characterLevel: 3, spellLevel: 1, spells: ["Charm Person", "Disguise Self"] },
    { characterLevel: 3, spellLevel: 2, spells: ["Invisibility", "Pass without Trace"] },
    { characterLevel: 5, spellLevel: 3, spells: ["Hypnotic Pattern", "Nondetection"] },
    { characterLevel: 7, spellLevel: 4, spells: ["Confusion", "Dimension Door"] },
    { characterLevel: 9, spellLevel: 5, spells: ["Dominate Person", "Modify Memory"] },
  ],
  "war-domain-spells": [
    { characterLevel: 3, spellLevel: 1, spells: ["Guiding Bolt", "Shield of Faith"] },
    { characterLevel: 3, spellLevel: 2, spells: ["Magic Weapon", "Spiritual Weapon"] },
    { characterLevel: 5, spellLevel: 3, spells: ["Crusader's Mantle", "Spirit Guardians"] },
    { characterLevel: 7, spellLevel: 4, spells: ["Fire Shield", "Freedom of Movement"] },
    { characterLevel: 9, spellLevel: 5, spells: ["Hold Monster", "Steel Wind Strike"] },
  ],
};

const ALWAYS_PREPARED_SPELLS_BY_SOURCE_INDEX: Record<
  string,
  Array<{ spellLevel: number; spells: string[] }>
> = {
  "beguiling-magic": [
    { spellLevel: 1, spells: ["Charm Person"] },
    { spellLevel: 2, spells: ["Mirror Image"] },
  ],
  "improved-abjuration": [
    { spellLevel: 3, spells: ["Counterspell", "Dispel Magic"] },
  ],
  "mantle-of-majesty": [
    { spellLevel: 1, spells: ["Command"] },
  ],
  "phantasmal-creatures": [
    { spellLevel: 2, spells: ["Summon Beast"] },
    { spellLevel: 3, spells: ["Summon Fey"] },
  ],
  "words-of-creation": [
    { spellLevel: 9, spells: ["Power Word Heal", "Power Word Kill"] },
  ],
};

const SPELL_DESCRIPTIONS_BY_SOURCE_AND_NAME: Record<string, Record<string, string>> = {
  "beguiling-magic": {
    "Charm Person":
      "Casting Time: 1 action | Range/Area: 30 ft. | Components: V, S | Duration: 1 hour\n\nYou attempt to charm a Humanoid you can see within range. It must make a Wisdom saving throw, and does so with Advantage if you or your companions are fighting it. If it fails the save, it has the Charmed condition until the spell ends or until you or your companions do anything harmful to it. The Charmed creature regards you as a friendly acquaintance. When the spell ends, the creature knows it was Charmed by you.\n\nUsing a Higher-Level Spell Slot. You can target one additional creature for each spell slot level above 1.",
    "Mirror Image":
      "Casting Time: 1 action | Range/Area: Self | Components: V, S | Duration: 1 minute\n\nThree illusory duplicates of yourself appear in your space. Until the spell ends, the duplicates move with you and mimic your actions, shifting position so it's impossible to track which image is real. You can use your action to dismiss the illusory duplicates.\n\nEach time a creature targets you with an attack during the spell's duration, roll a d20 to determine whether the attack instead targets one of your duplicates.\n\nIf you have three duplicates, you must roll a 6 or higher to change the attack's target to a duplicate. With two duplicates, you must roll an 8 or higher. With one duplicate, you must roll an 11 or higher.\n\nA duplicate's AC equals 10 + your Dexterity modifier. If an attack hits a duplicate, the duplicate is destroyed. A duplicate can be destroyed only by an attack that hits it. It ignores all other damage and effects. The spell ends when all three duplicates are destroyed.\n\nA creature is unaffected by this spell if it can't see, if it relies on senses other than sight, such as blindsight, or if it can perceive illusions as false, as with truesight.",
  },
  "mantle-of-majesty": {
    "Command":
      "Casting Time: 1 action | Range/Area: 60 ft. | Components: V | Duration: 1 round\n\nYou speak a one-word command to a creature you can see within range. The target must succeed on a Wisdom saving throw or follow the command on its next turn. The spell has no effect if the target is undead, if it doesn't understand your language, or if your command is directly harmful to it.\n\nSome typical commands and their effects follow. You might issue a command other than one described here. If you do so, the DM determines how the target behaves. If the target can't follow your command, the spell ends.\n\nApproach. The target moves toward you by the shortest and most direct route, ending its turn if it moves within 5 feet of you.\n\nDrop. The target drops whatever it is holding and then ends its turn.\n\nFlee. The target spends its turn moving away from you by the fastest available means.\n\nGrovel. The target falls prone and then ends its turn.\n\nHalt. The target doesn't move and takes no actions. A flying creature stays aloft, provided that it is able to do so. If it must move to stay aloft, it flies the minimum distance needed to remain in the air.\n\nAt Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, you can affect one additional creature for each slot level above 1. The creatures must be within 30 feet of each other when you target them.",
  },
  "phantasmal-creatures": {
    "Summon Beast":
      "Casting Time: 1 action | Range/Area: 90 ft. | Components: V, S, M | Duration: Concentration, up to 1 hour\n\nYou call forth a Bestial Spirit. It manifests in an unoccupied space that you can see within range and uses the Bestial Spirit stat block. When you cast the spell, choose an environment: Air, Land, or Water. The creature resembles an animal of your choice that is native to the chosen environment. The creature disappears when it drops to 0 Hit Points or when the spell ends.\n\nThe creature is an ally to you and your allies. In combat, it shares your Initiative count, but it takes its turn immediately after yours. It obeys your verbal commands. If you don't issue any commands, it takes the Dodge action and uses its movement to avoid danger.\n\nUsing a Higher-Level Spell Slot. Use the spell slot's level for the spell's level in the stat block.",
    "Summon Fey":
      "Casting Time: 1 action | Range/Area: 90 ft. | Components: V, S, M | Duration: Concentration, up to 1 hour\n\nYou call forth a Fey Spirit. It manifests in an unoccupied space that you can see within range and uses the Fey Spirit stat block. When you cast the spell, choose a mood: Fuming, Mirthful, or Tricksy. The creature resembles a Fey creature of your choice, which determines certain details in its stat block. The creature disappears when it drops to 0 Hit Points or when the spell ends.\n\nThe creature is an ally to you and your allies. In combat, it shares your Initiative count, but it takes its turn immediately after yours. It obeys your verbal commands. If you don't issue any commands, it takes the Dodge action and uses its movement to avoid danger.\n\nUsing a Higher-Level Spell Slot. Use the spell slot's level for the spell's level in the stat block.",
  },
};

const KNOWN_CANTRIPS_BY_SOURCE_INDEX: Record<string, string[]> = {
  "improved-illusions": ["Minor Illusion"],
};

const IGNORED_SPELL_SOURCE_INDEXES = new Set([
  "elven-lineage",
  "fiendish-legacy",
  "gnomish-lineage",
  "spell-mastery",
  "wizard-signature-spells",
]);

const NON_SPELL_NAME_REFERENCES = new Set([
  "it",
  "one",
  "ones",
  "spell",
  "spells",
  "that",
  "the spell",
  "the spells",
  "these",
  "this",
  "those",
]);

const LINEAGE_SPELLS_BY_SOURCE_INDEX: Record<
  string,
  Array<{
    preparationMode?: "always_prepared" | "known";
    spellLevel: number;
    spellName: string;
  }>
> = {
  "high-elf-cantrip-versatility": [{ spellName: "Prestidigitation", spellLevel: 0 }],
  "lineage-spell-dancing-lights": [{ spellName: "Dancing Lights", spellLevel: 0 }],
  "lineage-spell-darkness": [{ spellName: "Darkness", spellLevel: 2 }],
  "lineage-spell-detect-magic": [{ spellName: "Detect Magic", spellLevel: 1 }],
  "lineage-spell-druidcraft": [{ spellName: "Druidcraft", spellLevel: 0 }],
  "lineage-spell-faerie-fire": [{ spellName: "Faerie Fire", spellLevel: 1 }],
  "lineage-spell-longstrider": [{ spellName: "Longstrider", spellLevel: 1 }],
  "lineage-spell-misty-step": [{ spellName: "Misty Step", spellLevel: 2 }],
  "lineage-spell-pass-without-trace": [{ spellName: "Pass without Trace", spellLevel: 2 }],
  "gnomish-lineage-forest-gnome": [
    { spellName: "Minor Illusion", spellLevel: 0 },
    { spellName: "Speak with Animals", spellLevel: 1, preparationMode: "always_prepared" },
  ],
  "gnomish-lineage-rock-gnome": [
    { spellName: "Mending", spellLevel: 0 },
    { spellName: "Prestidigitation", spellLevel: 0 },
  ],
  "fiendish-legacy-abyssal": [
    { spellName: "Poison Spray", spellLevel: 0 },
  ],
  "fiendish-legacy-chthonic": [
    { spellName: "Chill Touch", spellLevel: 0 },
  ],
  "fiendish-legacy-infernal": [
    { spellName: "Fire Bolt", spellLevel: 0 },
  ],
  "fiendish-spell-ray-of-sickness": [
    { spellName: "Ray of Sickness", spellLevel: 1, preparationMode: "always_prepared" },
  ],
  "fiendish-spell-false-life": [
    { spellName: "False Life", spellLevel: 1, preparationMode: "always_prepared" },
  ],
  "fiendish-spell-hellish-rebuke": [
    { spellName: "Hellish Rebuke", spellLevel: 1, preparationMode: "always_prepared" },
  ],
  "fiendish-spell-hold-person": [
    { spellName: "Hold Person", spellLevel: 2, preparationMode: "always_prepared" },
  ],
  "fiendish-spell-ray-of-enfeeblement": [
    { spellName: "Ray of Enfeeblement", spellLevel: 2, preparationMode: "always_prepared" },
  ],
  "fiendish-spell-darkness": [
    { spellName: "Darkness", spellLevel: 2, preparationMode: "always_prepared" },
  ],
};

function deriveSpellEntries(
  activeSources: ResolvedFeatureSource[],
  classSourceJson: ClassSourceJson,
  characterLevel = 1,
) {
  const spellEntries: CharacterSpellEntry[] = [];
  const classSpellcastingEntry = createClassSpellcastingEntry(classSourceJson);

  if (classSpellcastingEntry) {
    spellEntries.push(classSpellcastingEntry);
  }

  for (const source of activeSources) {
    spellEntries.push(...inferSpellEntries(source, characterLevel));
  }

  return dedupeSpellEntries(spellEntries).sort(compareSpellEntries);
}

function createClassSpellcastingEntry(classSourceJson: ClassSourceJson) {
  const spellcastingInfo = classSourceJson.spellcasting?.info ?? [];
  const descriptions = spellcastingInfo
    .flatMap((entry) => getRuleDescription(entry.desc))
    .filter((description) => description.length > 0);

  if (descriptions.length === 0) {
    return null;
  }

  return {
    description: descriptions.join(" "),
    id: "class-spellcasting",
    isCantrip: false,
    kind: "spellcasting" as const,
    level: 1,
    preparationMode: "spellcasting" as const,
    spellLevel: null,
    sourceIndex: "class-spellcasting",
    sourceType: "class_feature" as const,
    title: "Spellcasting",
  };
}

function inferSpellEntries(source: ResolvedFeatureSource, characterLevel: number) {
  if (IGNORED_SPELL_SOURCE_INDEXES.has(source.sourceIndex.toLowerCase())) {
    return [];
  }

  const arcaneTricksterSpellEntries = inferArcaneTricksterSpellEntries(source);

  if (arcaneTricksterSpellEntries.length > 0) {
    return arcaneTricksterSpellEntries;
  }

  const lineageSpellEntries = inferLineageSpellEntries(source);

  if (lineageSpellEntries.length > 0) {
    return lineageSpellEntries;
  }

  const domainSpellEntries = inferDomainSpellEntries(source, characterLevel);

  if (domainSpellEntries.length > 0) {
    return domainSpellEntries;
  }

  const fixedAlwaysPreparedSpellEntries = inferFixedAlwaysPreparedSpellEntries(source);

  if (fixedAlwaysPreparedSpellEntries.length > 0) {
    return fixedAlwaysPreparedSpellEntries;
  }

  const fixedKnownCantripEntries = inferFixedKnownCantripEntries(source);

  if (fixedKnownCantripEntries.length > 0) {
    return fixedKnownCantripEntries;
  }

  const normalizedDescription = source.description.toLowerCase();
  const spellLevel = inferSpellLevel(source.title, source.description);
  const isCantrip = spellLevel === 0;

  if (
    normalizedDescription.includes("always have") &&
    normalizedDescription.includes("spells prepared")
  ) {
    const spellNames = extractAlwaysPreparedSpellNames(source.description);

    if (spellNames.length > 0) {
      return spellNames.map((spellName) => ({
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:spell:${slugify(spellName)}`,
        isCantrip,
        kind: "always_prepared" as const,
        level: source.level,
        preparationMode: "always_prepared" as const,
        spellLevel,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: spellName,
      }));
    }
  }

  const spellEntry = inferSpellEntry(source);
  return spellEntry ? [spellEntry] : [];
}

function inferArcaneTricksterSpellEntries(source: ResolvedFeatureSource) {
  const sourceIndex = source.sourceIndex.toLowerCase();

  if (sourceIndex === "arcane-trickster-spellcasting") {
    return [
      {
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:spellcasting`,
        isCantrip: false,
        kind: "spellcasting" as const,
        level: source.level,
        preparationMode: "spellcasting" as const,
        spellLevel: null,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: "Arcane Trickster Spellcasting",
      },
    ];
  }

  if (sourceIndex === "arcane-trickster-mage-hand-legerdemain") {
    return [
      {
        description:
          "You know the Mage Hand cantrip through Mage Hand Legerdemain. When you cast Mage Hand, you can cast it as a Bonus Action, make the spectral hand invisible, and use it for Dexterity (Sleight of Hand) checks.",
        id: `${source.sourceType}:${source.sourceIndex}:spell:mage-hand`,
        isCantrip: true,
        kind: "spell_feature" as const,
        level: source.level,
        preparationMode: "known" as const,
        spellLevel: 0,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: "Mage Hand",
      },
    ];
  }

  return [];
}

function inferLineageSpellEntries(source: ResolvedFeatureSource) {
  const rows = LINEAGE_SPELLS_BY_SOURCE_INDEX[source.sourceIndex.toLowerCase()];

  if (!rows) {
    return [];
  }

  return rows.map((row) => ({
    description: source.description,
    id: `${source.sourceType}:${source.sourceIndex}:lineage-spell:${slugify(row.spellName)}`,
    isCantrip: row.spellLevel === 0,
    kind:
      row.preparationMode === "always_prepared"
        ? ("always_prepared" as const)
        : ("spell_feature" as const),
    level: source.level,
    preparationMode: row.preparationMode ?? ("known" as const),
    spellLevel: row.spellLevel,
    sourceIndex: source.sourceIndex,
    sourceType: source.sourceType,
    title: row.spellName,
  }));
}

function inferFixedAlwaysPreparedSpellEntries(source: ResolvedFeatureSource) {
  const rows = ALWAYS_PREPARED_SPELLS_BY_SOURCE_INDEX[source.sourceIndex.toLowerCase()];

  if (!rows) {
    return [];
  }

  return rows.flatMap((row) =>
    row.spells.map((spellName) => ({
      description:
        SPELL_DESCRIPTIONS_BY_SOURCE_AND_NAME[source.sourceIndex.toLowerCase()]?.[spellName] ??
        source.description,
      id: `${source.sourceType}:${source.sourceIndex}:always-prepared:${slugify(spellName)}`,
      isCantrip: false,
      kind: "always_prepared" as const,
      level: source.level,
      preparationMode: "always_prepared" as const,
      spellLevel: row.spellLevel,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: spellName,
    })),
  );
}

function inferFixedKnownCantripEntries(source: ResolvedFeatureSource) {
  const cantrips = KNOWN_CANTRIPS_BY_SOURCE_INDEX[source.sourceIndex.toLowerCase()];

  if (!cantrips) {
    return [];
  }

  return cantrips.map((spellName) => ({
    description: source.description,
    id: `${source.sourceType}:${source.sourceIndex}:known-cantrip:${slugify(spellName)}`,
    isCantrip: true,
    kind: "spell_feature" as const,
    level: source.level,
    preparationMode: "known" as const,
    spellLevel: 0,
    sourceIndex: source.sourceIndex,
    sourceType: source.sourceType,
    title: spellName,
  }));
}

function inferDomainSpellEntries(source: ResolvedFeatureSource, characterLevel: number) {
  const domainSpellRows = DOMAIN_SPELLS_BY_SOURCE_INDEX[source.sourceIndex.toLowerCase()];

  if (!domainSpellRows) {
    return [];
  }

  return domainSpellRows
    .filter((row) => characterLevel >= row.characterLevel)
    .flatMap((row) =>
      row.spells.map((spellName) => ({
        description: source.description,
        id: `${source.sourceType}:${source.sourceIndex}:domain-spell:${slugify(spellName)}`,
        isCantrip: false,
        kind: "always_prepared" as const,
        level: source.level,
        preparationMode: "always_prepared" as const,
        spellLevel: row.spellLevel,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        title: spellName,
      })),
    );
}

function inferSpellEntry(source: ResolvedFeatureSource): CharacterSpellEntry | null {
  const normalizedTitle = source.title.toLowerCase();
  const normalizedDescription = source.description.toLowerCase();
  const extractedSpellName = extractSpellName(source.description);
  const spellLevel = inferSpellLevel(source.title, source.description);
  const isCantrip = spellLevel === 0;

  if (normalizedTitle.includes("spellcasting")) {
    return {
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:spell`,
      isCantrip: false,
      kind: "spellcasting",
      level: source.level,
      preparationMode: "spellcasting",
      spellLevel: null,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: source.title,
    };
  }

  if (
    normalizedDescription.includes("always have") &&
    normalizedDescription.includes("spells prepared")
  ) {
    return {
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:spell`,
      isCantrip,
      kind: "always_prepared",
      level: source.level,
      preparationMode: "always_prepared",
      spellLevel,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: extractedSpellName ?? source.title,
    };
  }

  if (
    /\b(cantrip|spell|spells)\b/.test(normalizedTitle) ||
    /\b(cantrip|spellcasting focus|cast spells|learn .* spells?|prepared spells?)\b/.test(
      normalizedDescription,
    ) ||
    normalizedDescription.includes("spells prepared") ||
    normalizedDescription.includes("learn the level") ||
    normalizedDescription.includes("learn or gain access to the spell") ||
    normalizedDescription.includes("gain access to the spell") ||
    normalizedDescription.includes("add the spell")
  ) {
    return {
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:spell`,
      isCantrip,
      kind: "spell_feature",
      level: source.level,
      preparationMode: inferPreparationMode(normalizedTitle, normalizedDescription),
      spellLevel,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: extractedSpellName ?? source.title,
    };
  }

  return null;
}

function extractSpellName(description: string) {
  const matchers = [
    /learn the cantrip ([^.]+?)(?: through|\.|$)/i,
    /learn the level \d+ spell ([^.]+?)(?: through|\.|$)/i,
    /add the level \d+ spell ([^.]+?)(?: to your spellbook| to the spells prepared| through|\.|$)/i,
    /add the spell ([^.]+?)(?: to your spellbook| to the spells prepared| through|\.|$)/i,
    /add ([^.]+?) to the spells prepared/i,
    /cast the spell ([^.]+?)(?: through| using| without|\.|$)/i,
    /gain access to the spell ([^.]+?)(?: through|\.|$)/i,
    /learn or gain access to the spell ([^.]+?)(?: through|\.|$)/i,
  ];

  for (const matcher of matchers) {
    const matchedName = cleanExtractedSpellName(description.match(matcher)?.[1]);

    if (matchedName) {
      return matchedName;
    }
  }

  return null;
}

function cleanExtractedSpellName(value: string | undefined) {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/\.$/, "")
    .replace(/^the\s+/i, "")
    .replace(/\bspells?\b/gi, "")
    .trim();

  return isConcreteSpellName(cleaned) ? cleaned : null;
}

function isConcreteSpellName(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0 && !NON_SPELL_NAME_REFERENCES.has(normalized);
}

function inferSpellLevel(title: string, description: string) {
  const searchableText = `${title} ${description}`.toLowerCase();

  if (
    searchableText.includes("cantrip") ||
    CORE_CANTRIP_NAMES.has(normalizeSpellLookupName(title))
  ) {
    return 0;
  }

  const ordinalMatch = searchableText.match(/\b([1-9])(st|nd|rd|th)[-\s]level spell\b/);

  if (ordinalMatch) {
    return Number(ordinalMatch[1]);
  }

  const plainLevelMatch = searchableText.match(/\blevel[\s-]+([1-9]) spell\b/);

  if (plainLevelMatch) {
    return Number(plainLevelMatch[1]);
  }

  return null;
}

function inferPreparationMode(normalizedTitle: string, normalizedDescription: string) {
  if (normalizedTitle.includes("cantrip") || normalizedDescription.includes("learn the cantrip")) {
    return "known" as const;
  }

  if (normalizedDescription.includes("learn the level") && normalizedDescription.includes(" spell ")) {
    return "known" as const;
  }

  if (
    normalizedDescription.includes("spells prepared") ||
    (normalizedDescription.includes("add ") &&
      normalizedDescription.includes("prepared"))
  ) {
    return "prepared" as const;
  }

  if (normalizedDescription.includes("spellbook")) {
    return "known" as const;
  }

  if (
    normalizedDescription.includes("learn or gain access to the spell") ||
    normalizedDescription.includes("gain access to the spell") ||
    normalizedDescription.includes("add the spell")
  ) {
    return "known" as const;
  }

  return "feature" as const;
}

function extractAlwaysPreparedSpellNames(description: string) {
  const match = description.match(/always have ([^.]+?) spells? prepared/i);

  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split(/,| and /i)
    .map((part) => cleanExtractedSpellName(part))
    .filter((part): part is string => Boolean(part));
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeSpellLookupName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export { deriveSpellEntries };
