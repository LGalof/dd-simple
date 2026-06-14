import { CURATED_2024_FEAT_REFERENCES } from "./feats2024.js";

type CuratedFeatureReference = {
  index: string;
  level: number;
  name: string;
  desc: string[];
  feature_specific?: unknown;
};

type CuratedLevelReference = {
  index: string;
  level: number;
  features: string[];
};

type CuratedSubclassFeatureReference = {
  name: string;
  level: number;
  description: string;
};

type CuratedSubclassReference = {
  index: string;
  name: string;
  subclass_flavor: string;
  summary: string;
  description: string;
  features: CuratedSubclassFeatureReference[];
};

type CuratedSubclassOptionTuple = readonly [string, string];
type CuratedReferenceTuple = readonly [string, string];

const COMMON_ABILITY_SCORE_OPTIONS = [
  ["str", "Strength"],
  ["dex", "Dexterity"],
  ["con", "Constitution"],
  ["int", "Intelligence"],
  ["wis", "Wisdom"],
  ["cha", "Charisma"],
] as const;

const CORE_FEAT_OPTIONS = CURATED_2024_FEAT_REFERENCES.filter(
  (feat) => feat.type !== "epic-boon" && feat.index !== "ability-score-improvement",
).map((feat) => [feat.index, feat.name] as const);

const COMMON_EPIC_BOON_OPTIONS = CURATED_2024_FEAT_REFERENCES.filter(
  (feat) => feat.type === "epic-boon",
).map((feat) => [feat.index, feat.name] as const);

function toReferenceOptions(
  entries: readonly CuratedReferenceTuple[],
  category: "ability-scores" | "feats" | "proficiencies" | "subclasses",
) {
  return entries.map(([index, name]) => ({
    option_type: "reference",
    item: {
      index,
      name,
      url: `/api/2024/${category}/${index}`,
    },
  }));
}

function createAbilityScoreImprovementFeature(
  index: string,
  level: number,
  featOptions: readonly CuratedReferenceTuple[] = CORE_FEAT_OPTIONS,
  description = "Increase one ability by 2, increase two abilities by 1, or choose a feat.",
): CuratedFeatureReference {
  return {
    index,
    level,
    name: "Ability Score Improvement",
    desc: [description],
    feature_specific: {
      type: "ability score improvement",
      mode: {
        id: "asi-mode",
        label: "Choose 1 option",
        field_label: "Ability Score Improvement",
        choose: 1,
        from: {
          option_set_type: "options_array",
          options: [
            {
              option_type: "reference",
              item: {
                index: "ability-score-improvement",
                name: "Ability Score Improvement",
                url: "/api/2024/feats/ability-score-improvement",
              },
            },
            {
              option_type: "reference",
              item: {
                index: "feat",
                name: "Feat",
                url: "/api/2024/feats",
              },
            },
          ],
        },
      },
      ability_scores: {
        id: "asi-score",
        label: "Choose 2 ability scores",
        field_label: "Ability Score",
        choose: 2,
        visible_when: {
          field: "asi-mode",
          values: ["ability-score-improvement"],
        },
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(COMMON_ABILITY_SCORE_OPTIONS, "ability-scores"),
        },
      },
      feat: {
        id: "asi-feat",
        label: "Choose 1 feat",
        field_label: "Feat",
        choose: 1,
        visible_when: {
          field: "asi-mode",
          values: ["feat"],
        },
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(featOptions, "feats"),
        },
      },
    },
  };
}

function createEpicBoonFeature(
  index: string,
  level: number,
  description = "You gain an Epic Boon feat or another qualifying feat.",
): CuratedFeatureReference {
  return {
    index,
    level,
    name: "Epic Boon",
    desc: [description],
    feature_specific: {
      choose: 1,
      type: "epic boon",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(COMMON_EPIC_BOON_OPTIONS, "feats"),
      },
    },
  };
}

function createSubclassChoiceFeature(
  index: string,
  level: number,
  className: string,
  subclasses: readonly CuratedSubclassOptionTuple[],
  description: string,
): CuratedFeatureReference {
  return {
    index,
    level,
    name: `${className} Subclass`,
    desc: [description],
    feature_specific: {
      choose: 1,
      type: "subclass",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(subclasses, "subclasses"),
      },
    },
  };
}

function createClassRuleDocument(classReference: Record<string, unknown>) {
  return {
    category: "classes",
    index: String(classReference.index),
    name: String(classReference.name),
    sourceJson: classReference,
  };
}

function createLevelRuleDocuments(
  classIndex: string,
  className: string,
  levelReferences: CuratedLevelReference[],
  featureReferences: CuratedFeatureReference[],
) {
  return levelReferences.map((levelReference) => ({
    category: "levels",
    index: levelReference.index,
    name: `${className} ${levelReference.level}`,
    sourceJson: {
      index: levelReference.index,
      class: {
        index: classIndex,
        name: className,
        url: `/api/2024/classes/${classIndex}`,
      },
      level: levelReference.level,
      url: `/api/2024/classes/${classIndex}/levels/${levelReference.level}`,
      features: levelReference.features.map((featureIndex) => {
        const feature = featureReferences.find((entry) => entry.index === featureIndex);

        return {
          index: featureIndex,
          name: feature?.name ?? featureIndex,
          url: `/api/2024/features/${featureIndex}`,
        };
      }),
    },
  }));
}

function createFeatureRuleDocuments(
  classIndex: string,
  className: string,
  featureReferences: CuratedFeatureReference[],
) {
  return featureReferences.map((featureReference) => ({
    category: "features",
    index: featureReference.index,
    name: featureReference.name,
    sourceJson: {
      index: featureReference.index,
      class: {
        index: classIndex,
        name: className,
        url: `/api/2024/classes/${classIndex}`,
      },
      level: featureReference.level,
      name: featureReference.name,
      desc: featureReference.desc,
      feature_specific: featureReference.feature_specific,
      url: `/api/2024/features/${featureReference.index}`,
    },
  }));
}

function createSubclassRuleDocuments(
  classIndex: string,
  className: string,
  subclassReferences: CuratedSubclassReference[],
) {
  return subclassReferences.map((subclassReference) => ({
    category: "subclasses",
    index: subclassReference.index,
    name: subclassReference.name,
    sourceJson: {
      ...subclassReference,
      class: {
        index: classIndex,
        name: className,
        url: `/api/2024/classes/${classIndex}`,
      },
      url: `/api/2024/subclasses/${subclassReference.index}`,
    },
  }));
}

function createSubclassReferences(subclasses: readonly CuratedSubclassOptionTuple[]) {
  return subclasses.map(([index, name]) => ({
    index,
    name,
    url: `/api/2024/subclasses/${index}`,
  }));
}

function mergeClassReference(
  baseClassReference: Record<string, any>,
  subclasses: readonly CuratedSubclassOptionTuple[],
) {
  return {
    ...baseClassReference,
    subclasses: createSubclassReferences(subclasses),
    url: `/api/2024/classes/${baseClassReference.index}`,
  };
}

export {
  COMMON_ABILITY_SCORE_OPTIONS,
  CORE_FEAT_OPTIONS,
  COMMON_EPIC_BOON_OPTIONS,
  createAbilityScoreImprovementFeature,
  createClassRuleDocument,
  createEpicBoonFeature,
  createFeatureRuleDocuments,
  createLevelRuleDocuments,
  createSubclassChoiceFeature,
  createSubclassRuleDocuments,
  mergeClassReference,
  toReferenceOptions,
};

export type {
  CuratedFeatureReference,
  CuratedLevelReference,
  CuratedReferenceTuple,
  CuratedSubclassOptionTuple,
  CuratedSubclassReference,
};
