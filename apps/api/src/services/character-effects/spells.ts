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

function deriveSpellEntries(
  activeSources: ResolvedFeatureSource[],
  classSourceJson: ClassSourceJson,
) {
  const spellEntries: CharacterSpellEntry[] = [];
  const classSpellcastingEntry = createClassSpellcastingEntry(classSourceJson);

  if (classSpellcastingEntry) {
    spellEntries.push(classSpellcastingEntry);
  }

  for (const source of activeSources) {
    spellEntries.push(...inferSpellEntries(source));
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

function inferSpellEntries(source: ResolvedFeatureSource) {
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
    const matchedName = description.match(matcher)?.[1]?.trim();

    if (matchedName) {
      return matchedName.replace(/\.$/, "");
    }
  }

  return null;
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
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => part.replace(/\bspells?\b/gi, "").trim())
    .filter((part) => part.length > 0);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeSpellLookupName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export { deriveSpellEntries };
