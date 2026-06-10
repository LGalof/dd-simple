/// <reference types="node" />

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = {
  [key: string]: JsonValue;
};

type SourceType =
  | "CLASS"
  | "CLASS_LEVEL"
  | "FEATURE"
  | "SUBCLASS"
  | "SUBCLASS_LEVEL"
  | "PROFICIENCY"
  | "OTHER";

type ChoiceCategory =
  | "skill proficiency"
  | "tool proficiency"
  | "language proficiency"
  | "equipment choice"
  | "expertise"
  | "fighting style"
  | "metamagic"
  | "pact boon"
  | "favored enemy"
  | "terrain"
  | "subclass feature option"
  | "primary ability option"
  | "nested choice"
  | "other";

type OptionValueShape =
  | "reference"
  | "proficiency reference"
  | "feature reference"
  | "string"
  | "counted_reference"
  | "multiple"
  | "nested choice"
  | "object"
  | "mixed";

type MechanicalEffect =
  | "proficiency grant"
  | "expertise modifier"
  | "equipment/inventory"
  | "display only"
  | "complex rule-engine behavior";

type MvpHandling =
  | "fully apply"
  | "save and display only"
  | "defer inventory mechanics"
  | "defer rule-engine mechanics"
  | "unsupported/problematic";

type SourceFileConfig = {
  fileName: string;
  sourceType: SourceType;
};

type ChoiceRecord = {
  sourceFile: string;
  jsonPath: string;
  sourceType: SourceType;
  classIndex: string;
  className: string;
  subclassIndex: string;
  subclassName: string;
  level: string;
  featureIndex: string;
  featureName: string;
  choiceLabel: string;
  category: ChoiceCategory;
  chooseCount: string;
  optionCount: number;
  optionShape: OptionValueShape;
  optionSummary: string;
  mechanicalEffect: MechanicalEffect;
  mvpHandling: MvpHandling;
  isProblematic: boolean;
  problemNotes: string[];
};

type ContextMaps = {
  featureByIndex: Map<string, JsonObject>;
  proficiencyByIndex: Map<string, JsonObject>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../../..");
const dataDir = path.join(repoRoot, "apps", "api", "prisma", "seed-data", "5e", "mixed");
const reportPath = path.join(repoRoot, "docs", "reference", "class-feature-choice-audit.md");

const sourceFiles: SourceFileConfig[] = [
  { fileName: "5e-SRD-Classes.json", sourceType: "CLASS" },
  { fileName: "5e-SRD-Levels.json", sourceType: "CLASS_LEVEL" },
  { fileName: "5e-SRD-Features.json", sourceType: "FEATURE" },
  { fileName: "5e-SRD-Subclasses.json", sourceType: "SUBCLASS" },
  { fileName: "5e-SRD-Proficiencies.json", sourceType: "PROFICIENCY" },
];

function main() {
  const datasets = readDatasets();
  const maps = createContextMaps(datasets);
  const choices = sourceFiles.flatMap((sourceFile) =>
    scanDataset(sourceFile, datasets.get(sourceFile.fileName) ?? [], maps),
  );
  const report = buildReport(choices);

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf-8");

  validateReport(report, choices);

  console.log(`Class feature choice audit complete: ${reportPath}`);
  console.log(`Discovered ${choices.length} choice objects across ${sourceFiles.length} files.`);
}

function readDatasets() {
  const datasets = new Map<string, JsonObject[]>();

  for (const sourceFile of sourceFiles) {
    const filePath = path.join(dataDir, sourceFile.fileName);
    const parsed = readJsonArray(filePath);

    datasets.set(sourceFile.fileName, parsed);
  }

  return datasets;
}

function readJsonArray(filePath: string): JsonObject[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as JsonValue;

  if (!Array.isArray(parsed) || !parsed.every(isRecord)) {
    throw new Error(`Expected a JSON array of objects: ${filePath}`);
  }

  return parsed;
}

function createContextMaps(datasets: Map<string, JsonObject[]>): ContextMaps {
  return {
    featureByIndex: indexByItemIndex(datasets.get("5e-SRD-Features.json") ?? []),
    proficiencyByIndex: indexByItemIndex(datasets.get("5e-SRD-Proficiencies.json") ?? []),
  };
}

function indexByItemIndex(items: JsonObject[]) {
  const map = new Map<string, JsonObject>();

  for (const item of items) {
    const index = stringValue(item.index);

    if (index) {
      map.set(index, item);
    }
  }

  return map;
}

function scanDataset(
  sourceFile: SourceFileConfig,
  items: JsonObject[],
  maps: ContextMaps,
): ChoiceRecord[] {
  return items.flatMap((item, index) =>
    scanValue({
      maps,
      root: item,
      sourceFile,
      value: item,
      jsonPath: `$[${index}]`,
    }),
  );
}

function scanValue({
  maps,
  root,
  sourceFile,
  value,
  jsonPath,
}: {
  maps: ContextMaps;
  root: JsonObject;
  sourceFile: SourceFileConfig;
  value: JsonValue;
  jsonPath: string;
}): ChoiceRecord[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      scanValue({
        maps,
        root,
        sourceFile,
        value: entry,
        jsonPath: `${jsonPath}[${index}]`,
      }),
    );
  }

  if (!isRecord(value)) {
    return [];
  }

  const records = isChoiceObject(value)
    ? [createChoiceRecord(sourceFile, root, value, jsonPath, maps)]
    : [];

  return [
    ...records,
    ...Object.entries(value).flatMap(([key, nestedValue]) =>
      scanValue({
        maps,
        root,
        sourceFile,
        value: nestedValue,
        jsonPath: `${jsonPath}.${key}`,
      }),
    ),
  ];
}

function isChoiceObject(value: JsonObject) {
  const from = isRecord(value.from) ? value.from : null;
  const options = Array.isArray(from?.options) ? from.options : null;

  return options !== null && (numberValue(value.choose) !== null || stringValue(value.type) !== null);
}

function createChoiceRecord(
  sourceFile: SourceFileConfig,
  root: JsonObject,
  choice: JsonObject,
  jsonPath: string,
  maps: ContextMaps,
): ChoiceRecord {
  const sourceType = resolveSourceType(sourceFile.sourceType, root);
  const optionDetails = getOptionDetails(choice, maps);
  const category = inferCategory(choice, jsonPath, root, optionDetails);
  const mechanicalEffect = inferMechanicalEffect(category);
  const mvpHandling = inferMvpHandling(category, optionDetails);
  const context = resolveContext(sourceType, root);
  const problemNotes = getProblemNotes(choice, category, optionDetails);

  return {
    sourceFile: sourceFile.fileName,
    jsonPath,
    sourceType,
    classIndex: context.classIndex,
    className: context.className,
    subclassIndex: context.subclassIndex,
    subclassName: context.subclassName,
    level: context.level,
    featureIndex: context.featureIndex,
    featureName: context.featureName,
    choiceLabel: resolveChoiceLabel(choice, jsonPath, context.featureName),
    category,
    chooseCount: formatUnknownNumber(numberValue(choice.choose)),
    optionCount: optionDetails.count,
    optionShape: optionDetails.shape,
    optionSummary: optionDetails.summary,
    mechanicalEffect,
    mvpHandling,
    isProblematic: problemNotes.length > 0,
    problemNotes,
  };
}

function resolveSourceType(sourceType: SourceType, root: JsonObject): SourceType {
  if (sourceType === "CLASS_LEVEL" && isRecord(root.subclass)) {
    return "SUBCLASS_LEVEL";
  }

  return sourceType;
}

function resolveContext(sourceType: SourceType, root: JsonObject) {
  const classReference = sourceType === "CLASS" ? root : asRecordOrNull(root.class);
  const subclassReference = sourceType === "SUBCLASS" ? root : asRecordOrNull(root.subclass);
  const isFeature = sourceType === "FEATURE";

  return {
    classIndex: stringValue(classReference?.index) ?? "",
    className: stringValue(classReference?.name) ?? "",
    subclassIndex: stringValue(subclassReference?.index) ?? "",
    subclassName: stringValue(subclassReference?.name) ?? "",
    level: formatUnknownNumber(numberValue(root.level)),
    featureIndex: isFeature ? stringValue(root.index) ?? "" : "",
    featureName: isFeature ? stringValue(root.name) ?? "" : "",
  };
}

function resolveChoiceLabel(choice: JsonObject, jsonPath: string, featureName: string) {
  return (
    stringValue(choice.name) ??
    stringValue(choice.desc) ??
    humanizePathSegment(jsonPath.split(".").at(-1) ?? "") ??
    featureName ??
    "Choice"
  );
}

type OptionDetails = {
  count: number;
  shape: OptionValueShape;
  summary: string;
  indexes: string[];
  names: string[];
  urls: string[];
  rawShapes: Set<OptionValueShape>;
};

type OptionDescription = {
  shape: Exclude<OptionValueShape, "mixed">;
  indexes: string[];
  names: string[];
  urls: string[];
  summary: string;
};

function getOptionDetails(choice: JsonObject, maps: ContextMaps): OptionDetails {
  const from = isRecord(choice.from) ? choice.from : null;
  const rawOptions = Array.isArray(from?.options) ? from.options : [];
  const optionData = rawOptions.map((option) => describeOption(option, maps));
  const rawShapes = new Set(optionData.map((option) => option.shape));
  const indexes = unique(optionData.flatMap((option) => option.indexes));
  const names = unique(optionData.flatMap((option) => option.names));
  const urls = unique(optionData.flatMap((option) => option.urls));
  const summaryItems = optionData.map((option) => option.summary).filter(Boolean);

  return {
    count: rawOptions.length,
    shape: rawShapes.size === 1 ? [...rawShapes][0] ?? "object" : "mixed",
    summary: truncateList(summaryItems, 12),
    indexes,
    names,
    urls,
    rawShapes,
  };
}

function describeOption(option: JsonValue, maps: ContextMaps): OptionDescription {
  if (typeof option === "string") {
    return {
      shape: "string" as const,
      indexes: [option],
      names: [option],
      urls: [],
      summary: option,
    };
  }

  if (!isRecord(option)) {
    const label = String(option);

    return {
      shape: "object" as const,
      indexes: [],
      names: [label],
      urls: [],
      summary: label,
    };
  }

  const optionType = stringValue(option.option_type);

  if (optionType === "choice" || isRecord(option.choice)) {
    const nestedChoice = asRecordOrNull(option.choice);
    const nestedLabel = nestedChoice
      ? `nested choice: ${stringValue(nestedChoice.type) ?? "option"} choose ${formatUnknownNumber(numberValue(nestedChoice.choose))}`
      : "nested choice";

    return {
      shape: "nested choice" as const,
      indexes: [],
      names: [nestedLabel],
      urls: [],
      summary: nestedLabel,
    };
  }

  if (optionType === "multiple" || Array.isArray(option.items)) {
    const items = Array.isArray(option.items) ? option.items : [];
    const itemDetails: OptionDescription[] = items.map((item) => describeOption(item, maps));

    return {
      shape: "multiple" as const,
      indexes: unique(itemDetails.flatMap((item) => item.indexes)),
      names: unique(itemDetails.flatMap((item) => item.names)),
      urls: unique(itemDetails.flatMap((item) => item.urls)),
      summary: itemDetails.map((item) => item.summary).filter(Boolean).join(" + "),
    };
  }

  if (optionType === "counted_reference") {
    const reference = asRecordOrNull(option.of) ?? asRecordOrNull(option.item);
    const count = numberValue(option.count);

    return {
      shape: "counted_reference" as const,
      indexes: stringValue(reference?.index) ? [stringValue(reference?.index) as string] : [],
      names: stringValue(reference?.name) ? [stringValue(reference?.name) as string] : [],
      urls: stringValue(reference?.url) ? [stringValue(reference?.url) as string] : [],
      summary: `${count ? `${count} x ` : ""}${referenceLabel(reference)}`,
    };
  }

  if (optionType === "reference" || isRecord(option.item) || isRecord(option.of)) {
    const reference = asRecordOrNull(option.item) ?? asRecordOrNull(option.of);
    const index = stringValue(reference?.index);
    const name = stringValue(reference?.name);
    const url = stringValue(reference?.url);
    const shape = referenceShape(index, name, url, maps);

    return {
      shape,
      indexes: index ? [index] : [],
      names: name ? [name] : [],
      urls: url ? [url] : [],
      summary: [index, name, url].filter(isPresent).join(" / "),
    };
  }

  if (optionType === "string" || typeof option.string === "string") {
    const label = stringValue(option.string) ?? stringValue(option.name) ?? JSON.stringify(option);

    return {
      shape: "string" as const,
      indexes: label ? [label] : [],
      names: label ? [label] : [],
      urls: [],
      summary: label ?? "string option",
    };
  }

  if (optionType === "money") {
    const count = numberValue(option.count);
    const unit = stringValue(option.unit);
    const label = [count, unit].filter(isPresent).join(" ");

    return {
      shape: "object" as const,
      indexes: [],
      names: label ? [label] : [],
      urls: [],
      summary: label || "money",
    };
  }

  if (optionType === "size") {
    const size = stringValue(option.size) ?? "size";

    return {
      shape: "string" as const,
      indexes: [size],
      names: [size],
      urls: [],
      summary: size,
    };
  }

  const summary = stringValue(option.name) ?? stringValue(option.index) ?? optionType ?? "object option";

  return {
    shape: "object" as const,
    indexes: stringValue(option.index) ? [stringValue(option.index) as string] : [],
    names: [summary],
    urls: stringValue(option.url) ? [stringValue(option.url) as string] : [],
    summary,
  };
}

function referenceShape(
  index: string | null,
  name: string | null,
  url: string | null,
  maps: ContextMaps,
): Exclude<OptionValueShape, "mixed"> {
  if (
    (index && maps.proficiencyByIndex.has(index)) ||
    index?.startsWith("skill-") ||
    name?.startsWith("Skill:") ||
    name?.startsWith("Tool:")
  ) {
    return "proficiency reference";
  }

  if ((index && maps.featureByIndex.has(index)) || url?.includes("/features/")) {
    return "feature reference";
  }

  return "reference";
}

function referenceLabel(reference: JsonObject | null) {
  return (
    stringValue(reference?.name) ??
    stringValue(reference?.index) ??
    stringValue(reference?.url) ??
    "reference"
  );
}

function inferCategory(
  choice: JsonObject,
  jsonPath: string,
  root: JsonObject,
  optionDetails: OptionDetails,
): ChoiceCategory {
  const featureIndex = stringValue(root.index) ?? "";
  const featureName = stringValue(root.name) ?? "";
  const label = `${jsonPath} ${stringValue(choice.desc) ?? ""} ${featureIndex} ${featureName}`.toLowerCase();

  if (jsonPath.includes(".choice")) return "nested choice";
  if (label.includes("expertise")) return "expertise";
  if (label.includes("fighting-style") || label.includes("fighting style")) return "fighting style";
  if (label.includes("metamagic")) return "metamagic";
  if (label.includes("pact-boon") || label.includes("pact boon")) return "pact boon";
  if (label.includes("enemy_type") || label.includes("favored enemy")) return "favored enemy";
  if (label.includes("terrain_type") || label.includes("natural explorer")) return "terrain";
  if (label.includes("starting_equipment")) return "equipment choice";
  if (label.includes("primary_ability")) return "primary ability option";

  if (optionDetails.shape === "proficiency reference") {
    if (optionDetails.indexes.every((index) => index.startsWith("skill-"))) return "skill proficiency";
    if (optionDetails.names.every((name) => name.toLowerCase().includes("language"))) return "language proficiency";
    return "tool proficiency";
  }

  if (label.includes("subfeature_options")) {
    return "subclass feature option";
  }

  if (optionDetails.rawShapes.has("multiple") || optionDetails.rawShapes.has("counted_reference")) {
    return "equipment choice";
  }

  return "other";
}

function inferMechanicalEffect(category: ChoiceCategory): MechanicalEffect {
  switch (category) {
    case "skill proficiency":
    case "tool proficiency":
    case "language proficiency":
      return "proficiency grant";
    case "expertise":
      return "expertise modifier";
    case "equipment choice":
      return "equipment/inventory";
    case "fighting style":
    case "metamagic":
    case "pact boon":
      return "complex rule-engine behavior";
    case "favored enemy":
    case "terrain":
    case "subclass feature option":
    case "primary ability option":
    case "nested choice":
    case "other":
      return "display only";
  }
}

function inferMvpHandling(category: ChoiceCategory, optionDetails: OptionDetails): MvpHandling {
  if (category === "nested choice" || optionDetails.rawShapes.has("nested choice")) {
    return "unsupported/problematic";
  }

  switch (category) {
    case "skill proficiency":
    case "tool proficiency":
    case "language proficiency":
    case "expertise":
      return "fully apply";
    case "equipment choice":
      return "defer inventory mechanics";
    case "fighting style":
    case "metamagic":
    case "pact boon":
      return "defer rule-engine mechanics";
    case "favored enemy":
    case "terrain":
    case "subclass feature option":
    case "primary ability option":
    case "other":
      return "save and display only";
  }
}

function getProblemNotes(
  choice: JsonObject,
  category: ChoiceCategory,
  optionDetails: OptionDetails,
): string[] {
  const notes: string[] = [];

  if (category === "nested choice" || optionDetails.rawShapes.has("nested choice")) {
    notes.push("Contains nested choice options that need a richer UI and persistence shape.");
  }

  if (optionDetails.rawShapes.has("multiple")) {
    notes.push("Contains bundled multiple-option entries.");
  }

  if (numberValue(choice.choose) === null) {
    notes.push("Missing numeric choose count.");
  }

  return notes;
}

function buildReport(choices: ChoiceRecord[]) {
  const sourceCounts = countBy(choices, (choice) => choice.sourceType);
  const categoryCounts = countBy(choices, (choice) => choice.category);
  const patternCounts = countOptionPatterns(choices);
  const nestedChoices = choices.filter((choice) => choice.isProblematic);

  return [
    "# Class Feature Choice Audit",
    "",
    "> Generated by `npm run audit:class-feature-choices`. This report is reproducible from local reference JSON and does not implement persistence, gameplay behavior, or rule-engine mechanics.",
    "",
    "## Executive Summary",
    "",
    `The scanner found ${choices.length} choice objects in the active local reference data under \`${relativePath(dataDir)}\`. The data contains class proficiency and equipment choices from class records plus feature-specific choices such as Bard Expertise, Fighter Fighting Style, Ranger Favored Enemy/Natural Explorer, Sorcerer Metamagic, Warlock Pact Boon, and Rogue Expertise. The scanner is audit-only: it reads JSON, classifies choices, writes this report, and leaves character persistence and gameplay logic unchanged.`,
    "",
    "## Discovered Files",
    "",
    ...sourceFiles.map((sourceFile) => `- \`${relativePath(path.join(dataDir, sourceFile.fileName))}\``),
    "",
    "## Discovered Choice Patterns",
    "",
    ...Object.entries(patternCounts).map(([pattern, count]) => `- \`${pattern}\`: ${count}`),
    "",
    "## Counts By Source Type",
    "",
    markdownCountTable(sourceCounts, "Source Type"),
    "",
    "## Counts By Category",
    "",
    markdownCountTable(categoryCounts, "Category"),
    "",
    "## Full Inventory",
    "",
    markdownInventoryTable(choices),
    "",
    "## Nested Or Problematic Choices",
    "",
    nestedChoices.length > 0
      ? markdownProblemList(nestedChoices)
      : "No nested or problematic choice structures were detected.",
    "",
    "## Stage 2 Persistence Recommendations",
    "",
    "- Store raw selected feature choices in a generic selection table keyed by character, source type, source index, class, subclass, level, feature index, and JSON choice path.",
    "- Preserve selected option index/name/url plus the selected raw JSON so mixed string/reference/nested option shapes can survive data changes.",
    "- Add derived grant tables only for easy mechanical outputs such as proficiencies and later expertise modifiers.",
    "- Validate submitted selections against the same local reference JSON paths discovered by this scanner.",
    "- Keep complex choices such as Fighting Style, Metamagic, Pact Boon, and many subclass feature options as saved/displayed selections until a rule engine exists.",
    "",
    "## Non-Goals",
    "",
    "This script does not modify Prisma schema, migrations, API endpoints, frontend behavior, character creation, character dashboard behavior, character sheet calculations, persistence, or gameplay logic.",
    "",
  ].join("\n");
}

function countOptionPatterns(choices: ChoiceRecord[]) {
  return choices.reduce<Record<string, number>>((counts, choice) => {
    const pattern = `${choice.category} / ${choice.optionShape}`;
    counts[pattern] = (counts[pattern] ?? 0) + 1;
    return counts;
  }, {});
}

function markdownCountTable(counts: Record<string, number>, label: string) {
  const rows = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));

  return [
    `| ${label} | Count |`,
    "|---|---:|",
    ...rows.map(([key, count]) => `| ${escapeMarkdown(key)} | ${count} |`),
  ].join("\n");
}

function markdownInventoryTable(choices: ChoiceRecord[]) {
  const header = [
    "| Source | Class | Subclass | Level | Feature | Choice | Category | Choose | Options | Shape | Mechanical Effect | MVP Handling |",
    "|---|---|---|---:|---|---|---|---:|---:|---|---|---|",
  ];
  const rows = choices.map((choice) =>
    [
      choice.sourceType,
      formatCell(choice.classIndex, choice.className),
      formatCell(choice.subclassIndex, choice.subclassName),
      choice.level,
      formatCell(choice.featureIndex, choice.featureName),
      `\`${choice.sourceFile}:${choice.jsonPath}\`<br>${escapeMarkdown(choice.choiceLabel)}<br>${escapeMarkdown(choice.optionSummary)}`,
      choice.category,
      choice.chooseCount,
      String(choice.optionCount),
      choice.optionShape,
      choice.mechanicalEffect,
      choice.mvpHandling,
    ]
      .map((value) => escapeTableCell(value))
      .join(" | "),
  );

  return [...header, ...rows.map((row) => `| ${row} |`)].join("\n");
}

function markdownProblemList(choices: ChoiceRecord[]) {
  return choices
    .map((choice) => {
      const label = [
        choice.featureIndex || choice.featureName || choice.classIndex || choice.sourceType,
        choice.jsonPath,
      ].filter(Boolean).join(" - ");

      return `- ${escapeMarkdown(label)}: ${choice.problemNotes.map(escapeMarkdown).join(" ")}`;
    })
    .join("\n");
}

function validateReport(report: string, choices: ChoiceRecord[]) {
  const requiredTerms = [
    "Bard Expertise",
    "Fighter Fighting Style",
    "Ranger Favored Enemy",
    "Sorcerer Metamagic",
    "Warlock Pact Boon",
    "Rogue Expertise",
  ];
  const requiredFeatureIndexes = [
    "bard-expertise-1",
    "fighter-fighting-style",
    "favored-enemy-1-type",
    "metamagic-1",
    "pact-boon",
    "rogue-expertise-1",
  ];

  for (const featureIndex of requiredFeatureIndexes) {
    if (!choices.some((choice) => choice.featureIndex === featureIndex)) {
      throw new Error(`Expected audit to include ${featureIndex}`);
    }
  }

  for (const term of requiredTerms) {
    if (!report.includes(term)) {
      throw new Error(`Expected report to contain ${term}`);
    }
  }
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function formatCell(index: string, name: string) {
  if (index && name && index !== name) return `${index}<br>${name}`;
  return index || name || "-";
}

function truncateList(values: string[], limit: number) {
  const uniqueValues = unique(values).filter(Boolean);
  const visible = uniqueValues.slice(0, limit);
  const remainder = uniqueValues.length - visible.length;

  return remainder > 0 ? `${visible.join("; ")}; +${remainder} more` : visible.join("; ");
}

function unique(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function humanizePathSegment(segment: string) {
  const cleaned = segment.replace(/\[[0-9]+\]/g, "").replace(/_/g, " ");

  if (!cleaned) {
    return null;
  }

  return cleaned.replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatUnknownNumber(value: number | null) {
  return value === null ? "" : String(value);
}

function relativePath(value: string) {
  return path.relative(repoRoot, value);
}

function escapeTableCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function escapeMarkdown(value: string) {
  return value.replace(/\|/g, "\\|");
}

function asRecordOrNull(value: JsonValue | undefined): JsonObject | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: JsonValue | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

main();
