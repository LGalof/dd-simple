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
    const spellEntry = inferSpellEntry(source);

    if (spellEntry) {
      spellEntries.push(spellEntry);
    }
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
    kind: "spellcasting" as const,
    level: 1,
    sourceIndex: "class-spellcasting",
    sourceType: "class_feature" as const,
    title: "Spellcasting",
  };
}

function inferSpellEntry(source: ResolvedFeatureSource): CharacterSpellEntry | null {
  const normalizedTitle = source.title.toLowerCase();
  const normalizedDescription = source.description.toLowerCase();

  if (normalizedTitle.includes("spellcasting")) {
    return {
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:spell`,
      kind: "spellcasting",
      level: source.level,
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
      kind: "always_prepared",
      level: source.level,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: source.title,
    };
  }

  if (
    /\b(cantrip|spell|spells)\b/.test(normalizedTitle) ||
    /\b(cantrip|spellcasting focus|cast spells|learn .* spells|prepared spells?)\b/.test(
      normalizedDescription,
    )
  ) {
    return {
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:spell`,
      kind: "spell_feature",
      level: source.level,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: source.title,
    };
  }

  return null;
}

export { deriveSpellEntries };
