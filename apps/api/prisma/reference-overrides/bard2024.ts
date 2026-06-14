import {
  COMMON_ABILITY_SCORE_OPTIONS,
  COMMON_EPIC_BOON_OPTIONS,
  CORE_FEAT_OPTIONS,
} from "./curatedClassHelpers.js";

const BARD_SKILL_OPTIONS = [
  ["skill-acrobatics", "Skill: Acrobatics"],
  ["skill-animal-handling", "Skill: Animal Handling"],
  ["skill-arcana", "Skill: Arcana"],
  ["skill-athletics", "Skill: Athletics"],
  ["skill-deception", "Skill: Deception"],
  ["skill-history", "Skill: History"],
  ["skill-insight", "Skill: Insight"],
  ["skill-intimidation", "Skill: Intimidation"],
  ["skill-investigation", "Skill: Investigation"],
  ["skill-medicine", "Skill: Medicine"],
  ["skill-nature", "Skill: Nature"],
  ["skill-perception", "Skill: Perception"],
  ["skill-performance", "Skill: Performance"],
  ["skill-persuasion", "Skill: Persuasion"],
  ["skill-religion", "Skill: Religion"],
  ["skill-sleight-of-hand", "Skill: Sleight of Hand"],
  ["skill-stealth", "Skill: Stealth"],
  ["skill-survival", "Skill: Survival"],
] as const;

const BARD_INSTRUMENT_OPTIONS = [
  ["bagpipes", "Bagpipes"],
  ["drum", "Drum"],
  ["dulcimer", "Dulcimer"],
  ["flute", "Flute"],
  ["lute", "Lute"],
  ["lyre", "Lyre"],
  ["horn", "Horn"],
  ["pan-flute", "Pan flute"],
  ["shawm", "Shawm"],
  ["viol", "Viol"],
] as const;

const BARD_ABILITY_SCORE_OPTIONS = COMMON_ABILITY_SCORE_OPTIONS;

const BARD_FEAT_OPTIONS = CORE_FEAT_OPTIONS;

const BARD_EPIC_BOON_OPTIONS = COMMON_EPIC_BOON_OPTIONS;

function toReferenceOptions(
  entries: readonly (readonly [string, string])[],
  category: "proficiencies" | "ability-scores" | "feats" | "subclasses",
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

function createAbilityScoreImprovementSpecific() {
  return {
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
        options: toReferenceOptions(BARD_ABILITY_SCORE_OPTIONS, "ability-scores"),
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
        options: toReferenceOptions(BARD_FEAT_OPTIONS, "feats"),
      },
    },
  };
}

const BARD_CLASS_REFERENCE = {
  index: "bard",
  name: "Bard",
  primary_ability: {
    desc: "Charisma",
    ability_scores: [
      {
        index: "cha",
        name: "CHA",
        url: "/api/2024/ability-scores/cha",
      },
    ],
  },
  hit_die: 8,
  proficiency_choices: [
    {
      desc: "Choose any 3 skills",
      choose: 3,
      type: "proficiencies",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(BARD_SKILL_OPTIONS, "proficiencies"),
      },
    },
    {
      desc: "Three musical instruments of your choice",
      choose: 3,
      type: "proficiencies",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(BARD_INSTRUMENT_OPTIONS, "proficiencies"),
      },
    },
  ],
  proficiencies: [
    {
      index: "light-armor",
      name: "Light Armor",
      url: "/api/2024/proficiencies/light-armor",
    },
    {
      index: "simple-weapons",
      name: "Simple Weapons",
      url: "/api/2024/proficiencies/simple-weapons",
    },
    {
      index: "saving-throw-dex",
      name: "Saving Throw: DEX",
      url: "/api/2024/proficiencies/saving-throw-dex",
    },
    {
      index: "saving-throw-cha",
      name: "Saving Throw: CHA",
      url: "/api/2024/proficiencies/saving-throw-cha",
    },
  ],
  saving_throws: [
    {
      index: "dex",
      name: "DEX",
      url: "/api/2024/ability-scores/dex",
    },
    {
      index: "cha",
      name: "CHA",
      url: "/api/2024/ability-scores/cha",
    },
  ],
  starting_equipment_options: [
    {
      desc: "(a) Leather Armor, 2 Daggers, Musical Instrument of your choice, Entertainer's Pack, and 19 GP; or (b) 90 GP",
      choose: 1,
      type: "equipment",
      from: {
        option_set_type: "options_array",
        options: [
          {
            option_type: "multiple",
            items: [
              {
                option_type: "counted_reference",
                count: 1,
                of: {
                  index: "leather-armor",
                  name: "Leather Armor",
                  url: "/api/2024/equipment/leather-armor",
                },
              },
              {
                option_type: "counted_reference",
                count: 2,
                of: {
                  index: "dagger",
                  name: "Dagger",
                  url: "/api/2024/equipment/dagger",
                },
              },
              {
                option_type: "counted_reference",
                count: 1,
                of: {
                  index: "entertainers-pack",
                  name: "Entertainer's Pack",
                  url: "/api/2024/equipment/entertainers-pack",
                },
              },
              {
                option_type: "money",
                count: 19,
                unit: "gp",
              },
            ],
          },
          {
            option_type: "money",
            count: 90,
            unit: "gp",
          },
        ],
      },
    },
  ],
  spellcasting: {
    level: 1,
    spellcasting_ability: {
      index: "cha",
      name: "CHA",
      url: "/api/2024/ability-scores/cha",
    },
    info: [
      {
        name: "Cantrips",
        desc: [
          "You know two cantrips of your choice from the Bard spell list.",
          "When you gain Bard levels, you can replace one of your cantrips and learn more as shown by the class progression.",
        ],
      },
      {
        name: "Prepared Spells",
        desc: [
          "You prepare level 1+ Bard spells from the Bard spell list, following the prepared spell limits shown in the Bard progression.",
        ],
      },
      {
        name: "Spellcasting Focus",
        desc: [
          "You can use a Musical Instrument as a Spellcasting Focus for your Bard spells.",
        ],
      },
    ],
  },
  spells: "/api/2024/classes/bard/spells",
  subclasses: [
    {
      index: "college-of-dance",
      name: "College of Dance",
      url: "/api/2024/subclasses/college-of-dance",
    },
    {
      index: "college-of-glamour",
      name: "College of Glamour",
      url: "/api/2024/subclasses/college-of-glamour",
    },
    {
      index: "college-of-lore",
      name: "College of Lore",
      url: "/api/2024/subclasses/college-of-lore",
    },
    {
      index: "college-of-valor",
      name: "College of Valor",
      url: "/api/2024/subclasses/college-of-valor",
    },
  ],
  url: "/api/2024/classes/bard",
};

const BARD_LEVEL_REFERENCES = [
  { index: "bard-1", level: 1, features: ["bard-spellcasting", "bardic-inspiration"] },
  { index: "bard-2", level: 2, features: ["bard-expertise-1", "jack-of-all-trades"] },
  { index: "bard-3", level: 3, features: ["bard-subclass-feature-3", "bard-subclass"] },
  { index: "bard-4", level: 4, features: ["bard-ability-score-improvement-1"] },
  { index: "bard-5", level: 5, features: ["font-of-inspiration"] },
  { index: "bard-6", level: 6, features: ["bard-subclass-feature-6"] },
  { index: "bard-7", level: 7, features: ["countercharm"] },
  { index: "bard-8", level: 8, features: ["bard-ability-score-improvement-2"] },
  { index: "bard-9", level: 9, features: ["bard-expertise-2"] },
  { index: "bard-10", level: 10, features: ["magical-secrets"] },
  { index: "bard-12", level: 12, features: ["bard-ability-score-improvement-3"] },
  { index: "bard-14", level: 14, features: ["bard-subclass-feature-14"] },
  { index: "bard-16", level: 16, features: ["bard-ability-score-improvement-4"] },
  { index: "bard-18", level: 18, features: ["superior-inspiration"] },
  { index: "bard-19", level: 19, features: ["bard-epic-boon"] },
  { index: "bard-20", level: 20, features: ["words-of-creation"] },
];

const BARD_FEATURE_REFERENCES = [
  {
    index: "bard-spellcasting",
    level: 1,
    name: "Spellcasting",
    desc: [
      "You have learned to cast spells through performance, inspiration, and force of personality. Charisma is your spellcasting ability, and you can use a Musical Instrument as your spellcasting focus.",
    ],
  },
  {
    index: "bardic-inspiration",
    level: 1,
    name: "Bardic Inspiration",
    desc: [
      "You can inspire others through stirring words, music, or dance. As a Bonus Action, you can grant a Bardic Inspiration die to an ally who can hear or otherwise receive your performance.",
    ],
  },
  {
    index: "bard-expertise-1",
    level: 2,
    name: "Expertise",
    desc: [
      "Choose two of your skill proficiencies and gain doubled proficiency bonus with them.",
    ],
    feature_specific: {
      choose: 2,
      type: "proficiencies",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(BARD_SKILL_OPTIONS, "proficiencies"),
      },
    },
  },
  {
    index: "jack-of-all-trades",
    level: 2,
    name: "Jack of All Trades",
    desc: [
      "You can add half your Proficiency Bonus to ability checks that use a skill proficiency you lack and that otherwise don't use your Proficiency Bonus.",
    ],
  },
  {
    index: "bard-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your Bard college shapes the style of your art and magic.",
      "College of Dance emphasizes movement, rhythm, and battlefield grace.",
      "College of Glamour bends fey allure and stage presence into captivating magic.",
      "College of Lore focuses on knowledge, wit, and cutting commentary.",
      "College of Valor turns performance into martial heroism and battle inspiration.",
    ],
  },
  {
    index: "bard-subclass",
    level: 3,
    name: "Bard Subclass",
    desc: [
      "Choose the college that defines your performance style and your higher-level subclass features.",
    ],
    feature_specific: {
      choose: 1,
      type: "subclass",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(
          [
            ["college-of-dance", "College of Dance"],
            ["college-of-glamour", "College of Glamour"],
            ["college-of-lore", "College of Lore"],
            ["college-of-valor", "College of Valor"],
          ],
          "subclasses",
        ),
      },
    },
  },
  {
    index: "bard-ability-score-improvement-1",
    level: 4,
    name: "Ability Score Improvement",
    desc: [
      "Increase one ability by 2, increase two abilities by 1, or choose a feat.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "font-of-inspiration",
    level: 5,
    name: "Font of Inspiration",
    desc: [
      "You regain expended uses of Bardic Inspiration when you finish a Short or Long Rest.",
    ],
  },
  {
    index: "bard-subclass-feature-6",
    level: 6,
    name: "Subclass Feature",
    desc: [
      "Your Bard college grants a stronger signature feature at this level.",
      "College of Dance sharpens your movement-driven performance.",
      "College of Glamour heightens your beguiling stage magic and command over attention.",
      "College of Lore grants Magical Discoveries and expands your stolen magical repertoire.",
      "College of Valor deepens your battlefield support and martial presence.",
    ],
  },
  {
    index: "countercharm",
    level: 7,
    name: "Countercharm",
    desc: [
      "You can use musical or verbal performance to disrupt mind-affecting influence and protect allies from fear and charm.",
    ],
  },
  {
    index: "bard-ability-score-improvement-2",
    level: 8,
    name: "Ability Score Improvement",
    desc: [
      "Increase one ability by 2, increase two abilities by 1, or choose a feat.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "bard-expertise-2",
    level: 9,
    name: "Expertise",
    desc: [
      "Choose two more of your skill proficiencies and gain doubled proficiency bonus with them.",
    ],
    feature_specific: {
      choose: 2,
      type: "proficiencies",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(BARD_SKILL_OPTIONS, "proficiencies"),
      },
    },
  },
  {
    index: "magical-secrets",
    level: 10,
    name: "Magical Secrets",
    desc: [
      "You learn spells from across magical traditions, expanding what a Bard can prepare and cast beyond the normal Bard spell list.",
      "This project does not yet have a full spell-selection engine, so this feature is currently tracked as reference data only.",
    ],
  },
  {
    index: "bard-ability-score-improvement-3",
    level: 12,
    name: "Ability Score Improvement",
    desc: [
      "Increase one ability by 2, increase two abilities by 1, or choose a feat.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "bard-subclass-feature-14",
    level: 14,
    name: "Subclass Feature",
    desc: [
      "Your Bard college reaches its capstone feature.",
      "College of Dance culminates in mastery of rhythm, performance, and mobile control.",
      "College of Glamour reaches its highest expression of irresistible grandeur.",
      "College of Lore grants Peerless Skill and unmatched command of talent and knowledge.",
      "College of Valor peaks with a heroic combat-support feature worthy of epic sagas.",
    ],
  },
  {
    index: "bard-ability-score-improvement-4",
    level: 16,
    name: "Ability Score Improvement",
    desc: [
      "Increase one ability by 2, increase two abilities by 1, or choose a feat.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "superior-inspiration",
    level: 18,
    name: "Superior Inspiration",
    desc: [
      "When initiative is rolled and you have no uses of Bardic Inspiration left, you regain one use.",
    ],
  },
  {
    index: "bard-epic-boon",
    level: 19,
    name: "Epic Boon",
    desc: [
      "You gain an Epic Boon at this level.",
    ],
    feature_specific: {
      choose: 1,
      type: "epic boon",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(BARD_EPIC_BOON_OPTIONS, "feats"),
      },
    },
  },
  {
    index: "words-of-creation",
    level: 20,
    name: "Words of Creation",
    desc: [
      "You master the deepest creative magic of the Bard and can weave reality-shaping performance at the height of your power.",
    ],
  },
];

const BARD_SUBCLASS_REFERENCES = [
  {
    index: "college-of-dance",
    name: "College of Dance",
    subclass_flavor: "Dance",
    summary: "Turn Rhythm into Movement and Momentum",
    description:
      "Bards of the College of Dance turn rhythm, motion, and performance into a fluid magical fighting style.",
    features: [
      {
        name: "Dazzling Footwork",
        level: 3,
        description:
          "Your dance infuses your movement with distracting flair, letting graceful footwork pressure enemies while keeping you mobile.",
      },
      {
        name: "Inspiring Movement",
        level: 3,
        description:
          "Your rhythm helps nearby allies reposition with confidence, turning your performance into shared battlefield momentum.",
      },
      {
        name: "Leading Evasion",
        level: 6,
        description:
          "You guide allies through danger with practiced motion, helping the group slip through blasts, traps, and chaotic battle spaces.",
      },
      {
        name: "Tandem Footwork",
        level: 14,
        description:
          "Your mastery of movement peaks in coordinated dances that elevate both your own agility and the party's ability to move as one.",
      },
    ],
    class: {
      index: "bard",
      name: "Bard",
      url: "/api/2024/classes/bard",
    },
    url: "/api/2024/subclasses/college-of-dance",
  },
  {
    index: "college-of-glamour",
    name: "College of Glamour",
    subclass_flavor: "Glamour",
    summary: "Wrap Performance in Fey Splendor",
    description:
      "Bards of the College of Glamour wield fey beauty, captivating stagecraft, and commanding presence.",
    features: [
      {
        name: "Mantle of Inspiration",
        level: 3,
        description:
          "A flourish of fey glamour refreshes and repositions your allies, turning applause and admiration into immediate tactical support.",
      },
      {
        name: "Enthralling Performance",
        level: 3,
        description:
          "Your art can leave an audience spellbound, creating a social opening through admiration, fascination, and supernatural charm.",
      },
      {
        name: "Mantle of Majesty",
        level: 6,
        description:
          "Your presence becomes regal and irresistible, letting you project authority through performance and fey command.",
      },
      {
        name: "Unbreakable Majesty",
        level: 14,
        description:
          "Your glamour reaches a nearly untouchable pinnacle, making it difficult for enemies to challenge your poise and presence directly.",
      },
    ],
    class: {
      index: "bard",
      name: "Bard",
      url: "/api/2024/classes/bard",
    },
    url: "/api/2024/subclasses/college-of-glamour",
  },
  {
    index: "college-of-lore",
    name: "College of Lore",
    subclass_flavor: "Lore",
    summary: "Plumb the Depths of Magical Knowledge",
    description:
      "Bards of the College of Lore gather stories, secrets, and magic from every tradition, pairing scholarship with razor-sharp wit.",
    features: [
      {
        name: "Bonus Proficiencies",
        level: 3,
        description:
          "You broaden your expertise with three additional skill proficiencies, reinforcing the College of Lore's identity as the most learned bardic tradition.",
      },
      {
        name: "Cutting Words",
        level: 3,
        description:
          "Your wit can throw off a creature's confidence at a key moment, undermining attacks, checks, or damage with a sharp remark.",
      },
      {
        name: "Magical Discoveries",
        level: 6,
        description:
          "You uncover spells from other traditions and permanently fold them into your repertoire as part of your expanding command of magical knowledge.",
      },
      {
        name: "Peerless Skill",
        level: 14,
        description:
          "You can spend Bardic Inspiration on your own failed efforts, turning personal talent and broad mastery into clutch success.",
      },
    ],
    class: {
      index: "bard",
      name: "Bard",
      url: "/api/2024/classes/bard",
    },
    url: "/api/2024/subclasses/college-of-lore",
  },
  {
    index: "college-of-valor",
    name: "College of Valor",
    subclass_flavor: "Valor",
    summary: "Turn Song into Courage and Steel",
    description:
      "Bards of the College of Valor celebrate heroic deeds and turn song into courage, steel, and battlefield leadership.",
    features: [
      {
        name: "Combat Inspiration",
        level: 3,
        description:
          "Your inspiration becomes more martial, helping allies press an attack or answer danger with better-protected reactions.",
      },
      {
        name: "Martial Training",
        level: 3,
        description:
          "You train for front-line heroics, pairing bardic magic with the discipline needed to thrive in weapon-driven combat.",
      },
      {
        name: "Extra Attack",
        level: 6,
        description:
          "You can attack twice when you take the Attack action, strengthening the college's role as a battle-ready bard.",
      },
      {
        name: "Battle Magic",
        level: 14,
        description:
          "Your spellcasting and weapon play flow together in epic fashion, letting you blend bardic magic into decisive combat turns.",
      },
    ],
    class: {
      index: "bard",
      name: "Bard",
      url: "/api/2024/classes/bard",
    },
    url: "/api/2024/subclasses/college-of-valor",
  },
];

function createBardClassRuleDocument() {
  return {
    category: "classes",
    index: "bard",
    name: "Bard",
    sourceJson: BARD_CLASS_REFERENCE,
  };
}

function createBardLevelRuleDocuments() {
  return BARD_LEVEL_REFERENCES.map((levelReference) => ({
    category: "levels",
    index: levelReference.index,
    name: `Bard ${levelReference.level}`,
    sourceJson: {
      index: levelReference.index,
      class: {
        index: "bard",
        name: "Bard",
        url: "/api/2024/classes/bard",
      },
      level: levelReference.level,
      url: `/api/2024/classes/bard/levels/${levelReference.level}`,
      features: levelReference.features.map((featureIndex) => {
        const feature = BARD_FEATURE_REFERENCES.find((entry) => entry.index === featureIndex);

        return {
          index: featureIndex,
          name: feature?.name ?? featureIndex,
          url: `/api/2024/features/${featureIndex}`,
        };
      }),
    },
  }));
}

function createBardFeatureRuleDocuments() {
  return BARD_FEATURE_REFERENCES.map((featureReference) => ({
    category: "features",
    index: featureReference.index,
    name: featureReference.name,
    sourceJson: {
      index: featureReference.index,
      class: {
        index: "bard",
        name: "Bard",
        url: "/api/2024/classes/bard",
      },
      level: featureReference.level,
      name: featureReference.name,
      desc: featureReference.desc,
      feature_specific: featureReference.feature_specific,
      url: `/api/2024/features/${featureReference.index}`,
    },
  }));
}

function createBardSubclassRuleDocuments() {
  return BARD_SUBCLASS_REFERENCES.map((subclassReference) => ({
    category: "subclasses",
    index: subclassReference.index,
    name: subclassReference.name,
    sourceJson: subclassReference,
  }));
}

export {
  BARD_CLASS_REFERENCE,
  createBardClassRuleDocument,
  createBardFeatureRuleDocuments,
  createBardLevelRuleDocuments,
  createBardSubclassRuleDocuments,
};
