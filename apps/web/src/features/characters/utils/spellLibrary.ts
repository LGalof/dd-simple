import referenceSpellLibrary from "../data/spells/reference-spells.json";
import type { CharacterSpellcastingState } from "../../../types/character";
import type { CharacterSpellEntry } from "../../../types/characterDerived";
import type { ActionActivationType } from "../../../types/characterAction";

type ReferenceSpellLibraryRecord = {
  casting_time?: unknown;
  classes?: unknown;
  components?: {
    raw?: unknown;
  } | null;
  description?: unknown;
  duration?: unknown;
  higher_levels?: unknown;
  level?: unknown;
  name?: unknown;
  range?: unknown;
  ritual?: unknown;
  school?: unknown;
  tags?: unknown;
  type?: unknown;
};

type SpellLibraryRecord = {
  castingTime: string;
  classIndexes: string[];
  components: string;
  description: string;
  duration: string;
  higherLevels: string;
  id: string;
  level: number;
  name: string;
  range: string;
  ritual: boolean;
  school: string;
  sourceCategory: string;
  tags: string[];
  type: string;
};

type SpellManagementMode = "known" | "prepared";

const spellLibraryRecords = (referenceSpellLibrary as ReferenceSpellLibraryRecord[])
  .map(normalizeSpellLibraryRecord)
  .filter((entry): entry is SpellLibraryRecord => entry !== null);

function normalizeSpellLibraryRecord(entry: ReferenceSpellLibraryRecord): SpellLibraryRecord | null {
  const name = stringValue(entry.name)?.trim();

  if (!name) {
    return null;
  }

  return {
    castingTime: stringValue(entry.casting_time) ?? "",
    classIndexes: Array.isArray(entry.classes)
      ? entry.classes
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim().toLowerCase())
          .filter((value) => value.length > 0)
      : [],
    components: stringValue(entry.components?.raw) ?? "",
    description: stringValue(entry.description) ?? "",
    duration: stringValue(entry.duration) ?? "",
    higherLevels: stringValue(entry.higher_levels) ?? "",
    id: buildSpellId(name),
    level: normalizeSpellLevel(entry.level),
    name,
    range: stringValue(entry.range) ?? "",
    ritual: Boolean(entry.ritual),
    school: stringValue(entry.school) ?? "",
    sourceCategory: "5.5E Core Rules",
    tags: Array.isArray(entry.tags)
      ? entry.tags.filter((value): value is string => typeof value === "string")
      : [],
    type: stringValue(entry.type) ?? "",
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeSpellLevel(value: unknown) {
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === "cantrip") {
      return 0;
    }

    const parsedValue = Number.parseInt(normalizedValue, 10);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  return 0;
}

function buildSpellId(name: string) {
  return `spell:${name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

function normalizeSpellLookupName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function getSpellManagementMode(classIndex: string): SpellManagementMode {
  return classIndex.toLowerCase() === "wizard" ? "known" : "prepared";
}

function getReferenceSpellsForClass(classIndex: string, maxSpellLevel: number | null) {
  return spellLibraryRecords
    .filter((entry) => entry.classIndexes.includes(classIndex.toLowerCase()))
    .filter((entry) => maxSpellLevel === null || entry.level === 0 || entry.level <= maxSpellLevel)
    .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
}

function findSpellLibraryRecordByName(name: string) {
  const normalizedName = normalizeSpellLookupName(name);

  return (
    spellLibraryRecords.find((entry) => normalizeSpellLookupName(entry.name) === normalizedName) ??
    null
  );
}

function getManagedSpellEntriesForClass(
  classIndex: string,
  spellcastingState: CharacterSpellcastingState,
) {
  // The right sidebar stores only learned/prepared spell ids. This helper expands
  // those ids back into full dashboard spell entries using the local JSON library.
  const learnedIds = new Set(spellcastingState.learnedSpellIds ?? []);
  const preparedIds = new Set(spellcastingState.preparedSpellIds ?? []);
  const managementMode = getSpellManagementMode(classIndex);

  return getReferenceSpellsForClass(classIndex, null)
    .filter((spell) => {
      if (spell.level === 0) {
        return learnedIds.has(spell.id);
      }

      return managementMode === "known"
        ? learnedIds.has(spell.id)
        : preparedIds.has(spell.id);
    })
    .map((spell) => buildCharacterSpellEntry(spell, classIndex, managementMode, preparedIds));
}

function buildCharacterSpellEntry(
  spell: SpellLibraryRecord,
  classIndex: string,
  managementMode: SpellManagementMode,
  preparedSpellIds: Set<string>,
): CharacterSpellEntry {
  return {
    description: formatSpellLibraryDescription(spell),
    id: spell.id,
    isCantrip: spell.level === 0,
    kind: "spell_feature",
    level: null,
    preparationMode:
      spell.level === 0
        ? "known"
        : managementMode === "known"
          ? "known"
          : preparedSpellIds.has(spell.id)
            ? "prepared"
            : "known",
    spellLevel: spell.level,
    sourceIndex: `${classIndex}:spell-library`,
    sourceType: "class_feature",
    title: spell.name,
  };
}

function buildSpellMetaLine(spell: Pick<SpellLibraryRecord, "castingTime" | "components" | "duration" | "range">) {
  const parts = [
    spell.castingTime ? `Casting Time: ${spell.castingTime}` : "",
    spell.range ? `Range: ${spell.range}` : "",
    spell.components ? `Components: ${spell.components}` : "",
    spell.duration ? `Duration: ${spell.duration}` : "",
  ].filter((value) => value.length > 0);

  return parts.join(" | ");
}

function formatSpellLibraryDescription(
  spell: Pick<
    SpellLibraryRecord,
    "castingTime" | "components" | "description" | "duration" | "higherLevels" | "range"
  >,
) {
  return [
    spell.description,
    spell.higherLevels ? `At Higher Levels: ${spell.higherLevels}` : "",
    buildSpellMetaLine(spell),
  ]
    .filter((value) => value.length > 0)
    .join("\n\n");
}

function isAttackRollSpell(spell: Pick<SpellLibraryRecord, "description">) {
  const description = spell.description.toLowerCase();

  return (
    description.includes("make a ranged spell attack") ||
    description.includes("make a melee spell attack") ||
    description.includes("make a spell attack")
  );
}

function inferSpellActionActivationType(
  spell: Pick<SpellLibraryRecord, "castingTime">,
): ActionActivationType {
  const castingTime = spell.castingTime.toLowerCase();

  if (castingTime.includes("bonus action")) {
    return "bonus_action";
  }

  if (castingTime.includes("reaction")) {
    return "reaction";
  }

  if (castingTime.includes("action")) {
    return "action";
  }

  return "attack";
}

function extractSpellAttackDamage(description: string) {
  const normalizedDescription = description.replace(/\s+/g, " ").trim();
  const attackHitMatch = normalizedDescription.match(
    /On a hit, the target takes ([^.]+?) damage/i,
  );

  if (attackHitMatch?.[1]) {
    return normalizeSpellAttackDamageText(attackHitMatch[1]);
  }

  const directHitMatch = normalizedDescription.match(
    /On a hit, it takes ([^.]+?) damage/i,
  );

  if (directHitMatch?.[1]) {
    return normalizeSpellAttackDamageText(directHitMatch[1]);
  }

  return "--";
}

function normalizeSpellAttackDamageText(value: string) {
  return value
    .replace(/\byour spellcasting ability modifier\b/gi, "MOD")
    .replace(/\byour spellcasting modifier\b/gi, "MOD")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSpellAttackRange(range: string) {
  return range
    .replace(/\bfeet\b/gi, "ft.")
    .replace(/\bfoot\b/gi, "ft.")
    .trim();
}

function formatSpellAttackNotes(
  spell: Pick<SpellLibraryRecord, "components" | "ritual" | "school">,
) {
  const noteParts = [];

  if (spell.components.length > 0) {
    noteParts.push(spell.components.replace(/,\s*/g, "/"));
  }

  if (spell.ritual) {
    noteParts.push("Ritual");
  }

  return noteParts.join(" ") || spell.school || "--";
}

function formatSpellAttackSubtitle(
  entry: Pick<CharacterSpellEntry, "spellLevel">,
  className: string,
) {
  const levelLabel =
    entry.spellLevel === 0
      ? "Cantrip"
      : entry.spellLevel === null
        ? "Spell"
        : `${formatOrdinal(entry.spellLevel)} Level`;

  return `${levelLabel} - ${className}`;
}

function formatOrdinal(level: number) {
  if (level === 1) {
    return "1st";
  }

  if (level === 2) {
    return "2nd";
  }

  if (level === 3) {
    return "3rd";
  }

  return `${level}th`;
}

export {
  buildSpellId,
  extractSpellAttackDamage,
  findSpellLibraryRecordByName,
  formatSpellLibraryDescription,
  formatSpellAttackNotes,
  formatSpellAttackRange,
  formatSpellAttackSubtitle,
  getManagedSpellEntriesForClass,
  getReferenceSpellsForClass,
  getSpellManagementMode,
  inferSpellActionActivationType,
  isAttackRollSpell,
  normalizeSpellLookupName,
  spellLibraryRecords,
};
export type { SpellLibraryRecord, SpellManagementMode };
