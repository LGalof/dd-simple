import {
  COMMON_ABILITY_SCORE_OPTIONS,
  COMMON_EPIC_BOON_OPTIONS,
  CORE_FEAT_OPTIONS,
  toReferenceOptions,
} from "./curatedClassHelpers.js";

const BARBARIAN_CLASS_REFERENCE = {
  index: "barbarian",
  name: "Barbarian",
  primary_ability: {
    desc: "Strength",
    ability_scores: [
      {
        index: "str",
        name: "STR",
        url: "/api/2024/ability-scores/str",
      },
    ],
  },
  hit_die: 12,
  proficiency_choices: [
    {
      desc: "Choose 2: Animal Handling, Athletics, Intimidation, Nature, Perception, or Survival",
      choose: 2,
      type: "proficiencies",
      from: {
        option_set_type: "options_array",
        options: [
          {
            option_type: "reference",
            item: {
              index: "skill-animal-handling",
              name: "Skill: Animal Handling",
              url: "/api/2024/proficiencies/skill-animal-handling",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-athletics",
              name: "Skill: Athletics",
              url: "/api/2024/proficiencies/skill-athletics",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-intimidation",
              name: "Skill: Intimidation",
              url: "/api/2024/proficiencies/skill-intimidation",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-nature",
              name: "Skill: Nature",
              url: "/api/2024/proficiencies/skill-nature",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-perception",
              name: "Skill: Perception",
              url: "/api/2024/proficiencies/skill-perception",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-survival",
              name: "Skill: Survival",
              url: "/api/2024/proficiencies/skill-survival",
            },
          },
        ],
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
      index: "medium-armor",
      name: "Medium Armor",
      url: "/api/2024/proficiencies/medium-armor",
    },
    {
      index: "shields",
      name: "Shields",
      url: "/api/2024/proficiencies/shields",
    },
    {
      index: "simple-weapons",
      name: "Simple Weapons",
      url: "/api/2024/proficiencies/simple-weapons",
    },
    {
      index: "martial-weapons",
      name: "Martial Weapons",
      url: "/api/2024/proficiencies/martial-weapons",
    },
    {
      index: "saving-throw-str",
      name: "Saving Throw: STR",
      url: "/api/2024/proficiencies/saving-throw-str",
    },
    {
      index: "saving-throw-con",
      name: "Saving Throw: CON",
      url: "/api/2024/proficiencies/saving-throw-con",
    },
  ],
  saving_throws: [
    {
      index: "str",
      name: "STR",
      url: "/api/2024/ability-scores/str",
    },
    {
      index: "con",
      name: "CON",
      url: "/api/2024/ability-scores/con",
    },
  ],
  starting_equipment_options: [
    {
      desc: "(a) Greataxe, 4 Handaxes, Explorer's Pack, and 15 GP or (b) 75 GP",
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
                  index: "greataxe",
                  name: "Greataxe",
                  url: "/api/2024/equipment/greataxe",
                },
              },
              {
                option_type: "counted_reference",
                count: 4,
                of: {
                  index: "handaxe",
                  name: "Handaxe",
                  url: "/api/2024/equipment/handaxe",
                },
              },
              {
                option_type: "counted_reference",
                count: 1,
                of: {
                  index: "explorers-pack",
                  name: "Explorer's Pack",
                  url: "/api/2024/equipment/explorers-pack",
                },
              },
              {
                option_type: "money",
                count: 15,
                unit: "gp",
              },
            ],
          },
          {
            option_type: "money",
            count: 75,
            unit: "gp",
          },
        ],
      },
    },
  ],
  class_levels: "/api/2024/classes/barbarian/levels",
  multi_classing: {
    prerequisites: [
      {
        ability_score: {
          index: "str",
          name: "STR",
          url: "/api/2024/ability-scores/str",
        },
        minimum_score: 13,
      },
    ],
    proficiencies: [
      {
        index: "shields",
        name: "Shields",
        url: "/api/2024/proficiencies/shields",
      },
      {
        index: "martial-weapons",
        name: "Martial Weapons",
        url: "/api/2024/proficiencies/martial-weapons",
      },
    ],
  },
  subclasses: [
    {
      index: "path-of-the-berserker",
      name: "Path of the Berserker",
      url: "/api/2024/subclasses/path-of-the-berserker",
    },
    {
      index: "path-of-the-wild-heart",
      name: "Path of the Wild Heart",
      url: "/api/2024/subclasses/path-of-the-wild-heart",
    },
    {
      index: "path-of-the-world-tree",
      name: "Path of the World Tree",
      url: "/api/2024/subclasses/path-of-the-world-tree",
    },
    {
      index: "path-of-the-zealot",
      name: "Path of the Zealot",
      url: "/api/2024/subclasses/path-of-the-zealot",
    },
  ],
  url: "/api/2024/classes/barbarian",
};

const BARBARIAN_WEAPON_MASTERY_OPTIONS = [
  {
    option_type: "reference",
    item: {
      index: "cleave",
      name: "Cleave",
      url: "/api/2024/weapon-mastery-properties/cleave",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "graze",
      name: "Graze",
      url: "/api/2024/weapon-mastery-properties/graze",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "nick",
      name: "Nick",
      url: "/api/2024/weapon-mastery-properties/nick",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "push",
      name: "Push",
      url: "/api/2024/weapon-mastery-properties/push",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "sap",
      name: "Sap",
      url: "/api/2024/weapon-mastery-properties/sap",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "slow",
      name: "Slow",
      url: "/api/2024/weapon-mastery-properties/slow",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "topple",
      name: "Topple",
      url: "/api/2024/weapon-mastery-properties/topple",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "vex",
      name: "Vex",
      url: "/api/2024/weapon-mastery-properties/vex",
    },
  },
];

const BARBARIAN_ABILITY_SCORE_OPTIONS = toReferenceOptions(
  COMMON_ABILITY_SCORE_OPTIONS,
  "ability-scores",
);

const BARBARIAN_ASI_AND_FEAT_OPTIONS = toReferenceOptions(CORE_FEAT_OPTIONS, "feats");

const BARBARIAN_EPIC_BOON_OPTIONS = toReferenceOptions(COMMON_EPIC_BOON_OPTIONS, "feats");

const WILD_HEART_ASPECT_OPTIONS = [
  {
    option_type: "reference",
    item: {
      index: "wild-heart-aspect-owl",
      name: "Owl",
      url: "/api/2024/features/wild-heart-aspect-owl",
      description:
        "Owl. You have Darkvision with a range of 60 feet. If you already have Darkvision, its range increases by 60 feet.",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "wild-heart-aspect-panther",
      name: "Panther",
      url: "/api/2024/features/wild-heart-aspect-panther",
      description: "Panther. You have a Climb Speed equal to your Speed.",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "wild-heart-aspect-salmon",
      name: "Salmon",
      url: "/api/2024/features/wild-heart-aspect-salmon",
      description: "Salmon. You have a Swim Speed equal to your Speed.",
    },
  },
];

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
        options: BARBARIAN_ABILITY_SCORE_OPTIONS,
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
        options: BARBARIAN_ASI_AND_FEAT_OPTIONS,
      },
    },
  };
}

const BARBARIAN_LEVEL_REFERENCES = [
  {
    index: "barbarian-1",
    level: 1,
    features: ["rage", "barbarian-unarmored-defense", "barbarian-weapon-mastery"],
  },
  {
    index: "barbarian-2",
    level: 2,
    features: ["reckless-attack", "danger-sense"],
  },
  {
    index: "barbarian-3",
    level: 3,
    features: [
      "barbarian-primal-knowledge",
      "barbarian-subclass",
      "barbarian-subclass-feature-3",
      "frenzy",
      "animal-speaker",
      "rage-of-the-wilds",
      "vitality-of-the-tree",
      "divine-fury",
    ],
  },
  {
    index: "barbarian-4",
    level: 4,
    features: ["barbarian-ability-score-improvement-1"],
  },
  {
    index: "barbarian-5",
    level: 5,
    features: ["barbarian-extra-attack", "fast-movement"],
  },
  {
    index: "barbarian-6",
    level: 6,
    features: [
      "barbarian-subclass-feature-6",
      "mindless-rage",
      "aspect-of-the-wilds",
      "branches-of-the-tree",
      "fanatical-focus",
    ],
  },
  {
    index: "barbarian-7",
    level: 7,
    features: ["feral-instinct", "barbarian-instinctive-pounce"],
  },
  {
    index: "barbarian-8",
    level: 8,
    features: ["barbarian-ability-score-improvement-2"],
  },
  {
    index: "barbarian-9",
    level: 9,
    features: ["barbarian-brutal-strike"],
  },
  {
    index: "barbarian-10",
    level: 10,
    features: [
      "barbarian-subclass-feature-10",
      "retaliation",
      "nature-speaker",
      "battering-roots",
      "zealous-presence",
    ],
  },
  {
    index: "barbarian-11",
    level: 11,
    features: ["relentless-rage"],
  },
  {
    index: "barbarian-12",
    level: 12,
    features: ["barbarian-ability-score-improvement-3"],
  },
  {
    index: "barbarian-13",
    level: 13,
    features: ["barbarian-improved-brutal-strike-1"],
  },
  {
    index: "barbarian-14",
    level: 14,
    features: [
      "barbarian-subclass-feature-14",
      "intimidating-presence",
      "power-of-the-wilds",
      "travel-along-the-tree",
      "rage-of-the-gods",
    ],
  },
  {
    index: "barbarian-15",
    level: 15,
    features: ["persistent-rage"],
  },
  {
    index: "barbarian-16",
    level: 16,
    features: ["barbarian-ability-score-improvement-4"],
  },
  {
    index: "barbarian-17",
    level: 17,
    features: ["barbarian-improved-brutal-strike-2"],
  },
  {
    index: "barbarian-18",
    level: 18,
    features: ["indomitable-might"],
  },
  {
    index: "barbarian-19",
    level: 19,
    features: ["barbarian-epic-boon"],
  },
  {
    index: "barbarian-20",
    level: 20,
    features: ["primal-champion"],
  },
];

const BARBARIAN_FEATURE_REFERENCES = [
  {
    index: "rage",
    level: 1,
    name: "Rage",
    desc: [
      "You can imbue yourself with a primal power called Rage, a force that grants you extraordinary might and resilience. You can enter it as a Bonus Action if you aren't wearing Heavy armor.",
      "You can enter your Rage the number of times shown for your Barbarian level in the Rages column of the Barbarian Features table. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.",
      "While active, your Rage follows the rules below.",
      "Damage Resistance. You have Resistance to Bludgeoning, Piercing, and Slashing damage.",
      "Rage Damage. When you make an attack using Strength-with either a weapon or an Unarmed Strike-and deal damage to the target, you gain a bonus to the damage that increases as you gain levels as a Barbarian, as shown in the Rage Damage column of the Barbarian Features table.",
      "Strength Advantage. You have Advantage on Strength checks and Strength saving throws.",
      "No Concentration or Spells. You can't maintain Concentration, and you can't cast spells.",
      "Duration. The Rage lasts until the end of your next turn, and it ends early if you don Heavy armor or have the Incapacitated condition. If your Rage is still active on your next turn, you can extend the Rage for another round by doing one of the following: make an attack roll against an enemy, force an enemy to make a saving throw, or take a Bonus Action to extend your Rage. Each time the Rage is extended, it lasts until the end of your next turn. You can maintain a Rage for up to 10 minutes.",
    ],
  },
  {
    index: "barbarian-unarmored-defense",
    level: 1,
    name: "Unarmored Defense",
    desc: [
      "While you are not wearing armor, your Armor Class equals 10 plus your Dexterity modifier and Constitution modifier. You can still benefit from a shield.",
    ],
  },
  {
    index: "barbarian-weapon-mastery",
    level: 1,
    name: "Weapon Mastery",
    desc: [
      "You learn weapon masteries that let you unlock special properties on weapons you know how to use. As a Barbarian, you begin with two mastery choices and gain more as you level up.",
      "The specific mastery options and the number of mastered weapons should be treated as 2024 class progression data.",
    ],
    feature_specific: {
      choose: 2,
      type: "weapon mastery",
      from: {
        option_set_type: "options_array",
        options: BARBARIAN_WEAPON_MASTERY_OPTIONS,
      },
    },
  },
  {
    index: "reckless-attack",
    level: 2,
    name: "Reckless Attack",
    desc: [
      "When you make your first attack roll on your turn, you can decide to attack recklessly. Doing so grants advantage on Strength-based attack rolls this turn, but attack rolls against you have advantage until your next turn.",
    ],
  },
  {
    index: "danger-sense",
    level: 2,
    name: "Danger Sense",
    desc: [
      "You gain advantage on Dexterity saving throws unless you have the Incapacitated condition.",
    ],
  },
  {
    index: "barbarian-primal-knowledge",
    level: 3,
    name: "Primal Knowledge",
    desc: [
      "You gain proficiency in an additional skill from the Barbarian skill list. While your Rage is active, you can channel primal force through several skills and use Strength for certain checks that normally rely on another ability.",
    ],
    feature_specific: {
      choose: 1,
      type: "proficiencies",
      from: {
        option_set_type: "options_array",
        options: [
          {
            option_type: "reference",
            item: {
              index: "skill-animal-handling",
              name: "Skill: Animal Handling",
              url: "/api/2024/proficiencies/skill-animal-handling",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-athletics",
              name: "Skill: Athletics",
              url: "/api/2024/proficiencies/skill-athletics",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-intimidation",
              name: "Skill: Intimidation",
              url: "/api/2024/proficiencies/skill-intimidation",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-nature",
              name: "Skill: Nature",
              url: "/api/2024/proficiencies/skill-nature",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-perception",
              name: "Skill: Perception",
              url: "/api/2024/proficiencies/skill-perception",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "skill-survival",
              name: "Skill: Survival",
              url: "/api/2024/proficiencies/skill-survival",
            },
          },
        ],
      },
    },
  },
  {
    index: "barbarian-subclass",
    level: 3,
    name: "Barbarian Subclass",
    desc: [
      "At this level, choose the path that shapes your Rage. Your subclass grants features now and at later Barbarian levels.",
    ],
    feature_specific: {
      choose: 1,
      type: "subclass",
      from: {
        option_set_type: "options_array",
        options: [
          {
            option_type: "reference",
            item: {
              index: "path-of-the-berserker",
              name: "Path of the Berserker",
              url: "/api/2024/subclasses/path-of-the-berserker",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "path-of-the-wild-heart",
              name: "Path of the Wild Heart",
              url: "/api/2024/subclasses/path-of-the-wild-heart",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "path-of-the-world-tree",
              name: "Path of the World Tree",
              url: "/api/2024/subclasses/path-of-the-world-tree",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "path-of-the-zealot",
              name: "Path of the Zealot",
              url: "/api/2024/subclasses/path-of-the-zealot",
            },
          },
        ],
      },
    },
  },
  {
    index: "barbarian-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen Barbarian path grants its defining 3rd-level feature.",
      "Path of the Berserker: Frenzy lets your Rage push your offense into a more reckless and punishing style.",
      "Path of the Wild Heart: a primal bond to the natural world grants a bestial combat identity and wilderness-focused benefits.",
      "Path of the World Tree: Vitality of the Tree ties your Rage to restorative and rooting world-tree power.",
      "Path of the Zealot: Divine Fury channels sacred wrath into your strikes and marks you as a relentless warrior of faith.",
    ],
  },
  {
    index: "frenzy",
    level: 3,
    name: "Frenzy",
    desc: [
      "If you use Reckless Attack while your Rage is active, you deal extra damage to the first target you hit on your turn with a Strength-based attack. To determine the extra damage, roll a number of d6s equal to your Rage Damage bonus, and add them together. The damage has the same type as the weapon or Unarmed Strike used for the attack.",
    ],
    subclass: {
      index: "path-of-the-berserker",
      name: "Path of the Berserker",
      url: "/api/2024/subclasses/path-of-the-berserker",
    },
  },
  {
    index: "animal-speaker",
    level: 3,
    name: "Animal Speaker",
    desc: [
      "You can cast Speak with Animals as a ritual, reflecting your kinship with beasts and the natural world.",
    ],
    subclass: {
      index: "path-of-the-wild-heart",
      name: "Path of the Wild Heart",
      url: "/api/2024/subclasses/path-of-the-wild-heart",
    },
  },
  {
    index: "rage-of-the-wilds",
    level: 3,
    name: "Rage of the Wilds",
    desc: [
      "Your Rage taps into the primal power of animals. Whenever you activate your Rage, you gain one of the following options of your choice.",
      "Bear. While your Rage is active, you have Resistance to every damage type except Force, Necrotic, Psychic, and Radiant.",
      "Eagle. When you activate your Rage, you can take the Disengage and Dash actions as part of that Bonus Action. While your Rage is active, you can take a Bonus Action to take both of those actions.",
      "Wolf. While your Rage is active, your allies have Advantage on attack rolls against any enemy of yours within 5 feet of you.",
    ],
    subclass: {
      index: "path-of-the-wild-heart",
      name: "Path of the Wild Heart",
      url: "/api/2024/subclasses/path-of-the-wild-heart",
    },
  },
  {
    index: "vitality-of-the-tree",
    level: 3,
    name: "Vitality of the Tree",
    desc: [
      "Vitality Surge. When you activate your Rage, you gain a number of Temporary Hit Points equal to your Barbarian level.",
      "Life-Giving Force. At the start of each of your turns while your Rage is active, you can choose another creature within 10 feet of yourself to gain Temporary Hit Points. To determine the number of Temporary Hit Points, roll a number of d6s equal to your Rage Damage bonus, and add them together. If any of these Temporary Hit Points remain when your Rage ends, they vanish.",
    ],
    subclass: {
      index: "path-of-the-world-tree",
      name: "Path of the World Tree",
      url: "/api/2024/subclasses/path-of-the-world-tree",
    },
  },
  {
    index: "divine-fury",
    level: 3,
    name: "Divine Fury",
    desc: [
      "Sacred wrath infuses your strikes, adding divine force to your attacks while your Rage is active.",
    ],
    subclass: {
      index: "path-of-the-zealot",
      name: "Path of the Zealot",
      url: "/api/2024/subclasses/path-of-the-zealot",
    },
  },
  {
    index: "barbarian-ability-score-improvement-1",
    level: 4,
    name: "Ability Score Improvement",
    desc: [
      "You improve your abilities at this level. Use the character builder's ability score plan or feat rules to reflect your choice.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "barbarian-extra-attack",
    level: 5,
    name: "Extra Attack",
    desc: [
      "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
    ],
  },
  {
    index: "fast-movement",
    level: 5,
    name: "Fast Movement",
    desc: [
      "Your speed increases by 10 feet while you aren't wearing Heavy armor.",
    ],
  },
  {
    index: "barbarian-subclass-feature-6",
    level: 6,
    name: "Subclass Feature",
    desc: [
      "Your chosen Barbarian path grants its 6th-level feature.",
      "Path of the Berserker: Mindless Rage protects you from being charmed or frightened while your Rage lasts.",
      "Path of the Wild Heart: your bond to the wild deepens with a mobility and survival-focused feature tied to your primal nature.",
      "Path of the World Tree: Branches of the Tree extends your control of the battlefield with supernatural reach and interception.",
      "Path of the Zealot: Fanatical Focus helps you push through failed saving throws through divine conviction.",
    ],
  },
  {
    index: "mindless-rage",
    level: 6,
    name: "Mindless Rage",
    desc: [
      "You have Immunity to the Charmed and Frightened conditions while your Rage is active, and those conditions end on you when you enter your Rage.",
    ],
    subclass: {
      index: "path-of-the-berserker",
      name: "Path of the Berserker",
      url: "/api/2024/subclasses/path-of-the-berserker",
    },
  },
  {
    index: "aspect-of-the-wilds",
    level: 6,
    name: "Aspect of the Wilds",
    desc: [
      "You gain one of the following options of your choice. Whenever you finish a Long Rest, you can change your choice.",
      "Owl. You have Darkvision with a range of 60 feet. If you already have Darkvision, its range increases by 60 feet.",
      "Panther. You have a Climb Speed equal to your Speed.",
      "Salmon. You have a Swim Speed equal to your Speed.",
    ],
    feature_specific: {
      choose: 1,
      type: "wild heart aspect",
      label: "Choose 1 level 6 option",
      field_label: "Level 6 Option",
      from: {
        option_set_type: "options_array",
        options: WILD_HEART_ASPECT_OPTIONS,
      },
    },
    subclass: {
      index: "path-of-the-wild-heart",
      name: "Path of the Wild Heart",
      url: "/api/2024/subclasses/path-of-the-wild-heart",
    },
  },
  {
    index: "branches-of-the-tree",
    level: 6,
    name: "Branches of the Tree",
    desc: [
      "Whenever a creature you can see starts its turn within 30 feet of you while your Rage is active, you can take a Reaction to summon spectral branches of the World Tree around it. The target must succeed on a Strength saving throw (DC 8 plus your Strength modifier and Proficiency Bonus) or be teleported to an unoccupied space you can see within 5 feet of yourself or in the nearest unoccupied space you can see. After the target teleports, you can reduce its Speed to 0 until the end of the current turn.",
    ],
    subclass: {
      index: "path-of-the-world-tree",
      name: "Path of the World Tree",
      url: "/api/2024/subclasses/path-of-the-world-tree",
    },
  },
  {
    index: "fanatical-focus",
    level: 6,
    name: "Fanatical Focus",
    desc: [
      "Your conviction helps you push through failure and endure effects that would stop a lesser warrior.",
    ],
    subclass: {
      index: "path-of-the-zealot",
      name: "Path of the Zealot",
      url: "/api/2024/subclasses/path-of-the-zealot",
    },
  },
  {
    index: "feral-instinct",
    level: 7,
    name: "Feral Instinct",
    desc: [
      "You gain Advantage on Initiative rolls.",
    ],
  },
  {
    index: "barbarian-instinctive-pounce",
    level: 7,
    name: "Instinctive Pounce",
    desc: [
      "When you enter your Rage, you can move part of your speed without provoking opportunity attacks in the normal way for this feature. This movement is tied to the same Bonus Action that starts your Rage.",
    ],
  },
  {
    index: "barbarian-ability-score-improvement-2",
    level: 8,
    name: "Ability Score Improvement",
    desc: [
      "You improve your abilities again at this level.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "barbarian-brutal-strike",
    level: 9,
    name: "Brutal Strike",
    desc: [
      "If you use Reckless Attack, you can forgo any Advantage on one Strength-based attack roll of your choice on your turn. The chosen attack roll mustn't have Disadvantage. If the chosen attack roll hits, the target takes an extra 1d10 damage of the same type dealt by the weapon or Unarmed Strike, and you can cause one Brutal Strike effect of your choice. You have the following effect options.",
      "Forceful Blow. The target is pushed 15 feet straight away from you. You can then move up to half your Speed straight toward the target without provoking Opportunity Attacks.",
      "Hamstring Blow. The target's Speed is reduced by 15 feet until the start of your next turn. A target can be affected by only one Hamstring Blow at a time-the most recent one.",
    ],
  },
  {
    index: "barbarian-subclass-feature-10",
    level: 10,
    name: "Subclass Feature",
    desc: [
      "Your chosen Barbarian path grants its 10th-level feature.",
      "Path of the Berserker: Retaliation lets you answer pain with an immediate counterattack.",
      "Path of the Wild Heart: your spiritual bond evolves into a stronger primal utility or aura-driven feature.",
      "Path of the World Tree: Battering Roots turns your battlefield control into forceful displacement and reach.",
      "Path of the Zealot: Zealous Presence lets you ignite your allies with holy battle fervor.",
    ],
  },
  {
    index: "retaliation",
    level: 10,
    name: "Retaliation",
    desc: [
      "When a creature within 5 feet damages you, you can use your Reaction to make a melee attack against it.",
    ],
    subclass: {
      index: "path-of-the-berserker",
      name: "Path of the Berserker",
      url: "/api/2024/subclasses/path-of-the-berserker",
    },
  },
  {
    index: "nature-speaker",
    level: 10,
    name: "Nature Speaker",
    desc: [
      "You can cast the Commune with Nature spell but only as a Ritual. Wisdom is your spellcasting ability for it.",
    ],
    subclass: {
      index: "path-of-the-wild-heart",
      name: "Path of the Wild Heart",
      url: "/api/2024/subclasses/path-of-the-wild-heart",
    },
  },
  {
    index: "battering-roots",
    level: 10,
    name: "Battering Roots",
    desc: [
      "During your turn, your reach is 10 feet greater with any Melee weapon that has the Heavy or Versatile property, as tendrils of the World Tree extend from you. When you hit with such a weapon on your turn, you can activate the Push or Topple mastery property in addition to a different mastery property you're using with that weapon.",
    ],
    subclass: {
      index: "path-of-the-world-tree",
      name: "Path of the World Tree",
      url: "/api/2024/subclasses/path-of-the-world-tree",
    },
  },
  {
    index: "zealous-presence",
    level: 10,
    name: "Zealous Presence",
    desc: [
      "You can ignite your allies with holy battle fervor, lending them offensive momentum in a crucial moment.",
    ],
    subclass: {
      index: "path-of-the-zealot",
      name: "Path of the Zealot",
      url: "/api/2024/subclasses/path-of-the-zealot",
    },
  },
  {
    index: "relentless-rage",
    level: 11,
    name: "Relentless Rage",
    desc: [
      "Your Rage can keep you fighting despite grievous wounds. If you drop to 0 Hit Points while your Rage is active and don't die outright, you can make a DC 10 Constitution saving throw. If you succeed, your Hit Points instead change to a number equal to twice your Barbarian level.",
      "Each time you use this feature after the first, the DC increases by 5. When you finish a Short or Long Rest, the DC resets to 10.",
    ],
  },
  {
    index: "barbarian-ability-score-improvement-3",
    level: 12,
    name: "Ability Score Improvement",
    desc: [
      "You improve your abilities again at this level.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "barbarian-improved-brutal-strike-1",
    level: 13,
    name: "Improved Brutal Strike",
    desc: [
      "You have honed new ways to attack furiously. The following effects are now among your Brutal Strike options.",
      "Staggering Blow. The target has Disadvantage on the next saving throw it makes, and it can't make Opportunity Attacks until the start of your next turn.",
      "Sundering Blow. Before the start of your next turn, the next attack roll made by another creature against the target gains a +5 bonus to the roll. An attack roll can gain only one Sundering Blow bonus.",
    ],
  },
  {
    index: "barbarian-subclass-feature-14",
    level: 14,
    name: "Subclass Feature",
    desc: [
      "Your chosen Barbarian path grants its capstone subclass feature.",
      "Path of the Berserker: Intimidating Presence lets you cow foes with overwhelming ferocity.",
      "Path of the Wild Heart: your primal form reaches its peak with a powerful expression of your animal spirit.",
      "Path of the World Tree: Travel Along the Tree lets you bend world-tree pathways for dramatic repositioning.",
      "Path of the Zealot: your divine fury reaches its apex and makes you even harder to stop in battle.",
    ],
  },
  {
    index: "intimidating-presence",
    level: 14,
    name: "Intimidating Presence",
    desc: [
      "As a Bonus Action, you can strike terror into others with your menacing presence and primal power. When you do so, each creature of your choice in a 30-foot Emanation originating from you must make a Wisdom saving throw (DC 8 plus your Strength modifier and Proficiency Bonus). On a failed save, a creature has the Frightened condition for 1 minute. At the end of each of the Frightened creature's turns, the creature repeats the save, ending the effect on itself on a success.",
      "Once you use this feature, you can't use it again until you finish a Long Rest unless you expend a use of your Rage (no action required) to restore your use of it.",
    ],
    subclass: {
      index: "path-of-the-berserker",
      name: "Path of the Berserker",
      url: "/api/2024/subclasses/path-of-the-berserker",
    },
  },
  {
    index: "power-of-the-wilds",
    level: 14,
    name: "Power of the Wilds",
    desc: [
      "Whenever you activate your Rage, you gain one of the following options of your choice.",
      "Falcon. While your Rage is active, you have a Fly Speed equal to your Speed if you aren't wearing any armor.",
      "Lion. While your Rage is active, any of your enemies within 5 feet of you have Disadvantage on attack rolls against targets other than you or another Barbarian who has this option active.",
      "Ram. While your Rage is active, you can cause a Large or smaller creature to have the Prone condition when you hit it with a melee attack.",
    ],
    subclass: {
      index: "path-of-the-wild-heart",
      name: "Path of the Wild Heart",
      url: "/api/2024/subclasses/path-of-the-wild-heart",
    },
  },
  {
    index: "travel-along-the-tree",
    level: 14,
    name: "Travel Along the Tree",
    desc: [
      "When you activate your Rage and as a Bonus Action while your Rage is active, you can teleport up to 60 feet to an unoccupied space you can see. In addition, once per Rage, you can increase the range of that teleport to 150 feet. When you do so, you can also bring up to six willing creatures who are within 10 feet of you. Each creature teleports to an unoccupied space of your choice within 10 feet of your destination space.",
    ],
    subclass: {
      index: "path-of-the-world-tree",
      name: "Path of the World Tree",
      url: "/api/2024/subclasses/path-of-the-world-tree",
    },
  },
  {
    index: "rage-of-the-gods",
    level: 14,
    name: "Rage of the Gods",
    desc: [
      "Your divine fury reaches its apex, making you even harder to stop when battle turns desperate.",
    ],
    subclass: {
      index: "path-of-the-zealot",
      name: "Path of the Zealot",
      url: "/api/2024/subclasses/path-of-the-zealot",
    },
  },
  {
    index: "persistent-rage",
    level: 15,
    name: "Persistent Rage",
    desc: [
      "Your Rage no longer ends early just because you failed to attack, force a save, or spend a Bonus Action during your turn.",
    ],
  },
  {
    index: "barbarian-ability-score-improvement-4",
    level: 16,
    name: "Ability Score Improvement",
    desc: [
      "You improve your abilities again at this level.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "barbarian-improved-brutal-strike-2",
    level: 17,
    name: "Improved Brutal Strike",
    desc: [
      "The extra damage of your Brutal Strike increases to 2d10. In addition, you can use two different Brutal Strike effects whenever you use your Brutal Strike feature.",
    ],
  },
  {
    index: "indomitable-might",
    level: 18,
    name: "Indomitable Might",
    desc: [
      "When your total for a Strength check is lower than your Strength score, you can use that score in place of the lower total.",
    ],
  },
  {
    index: "barbarian-epic-boon",
    level: 19,
    name: "Epic Boon",
    desc: [
      "You gain an Epic Boon at this level. Record the boon you choose using the feat and progression tools that apply to your campaign rules.",
    ],
    feature_specific: {
      choose: 1,
      type: "epic boon",
      from: {
        option_set_type: "options_array",
        options: BARBARIAN_EPIC_BOON_OPTIONS,
      },
    },
  },
  {
    index: "primal-champion",
    level: 20,
    name: "Primal Champion",
    desc: [
      "You embody primal power. Your Strength and Constitution scores increase by 4, and their maximum is now 25.",
    ],
  },
];

const BARBARIAN_SUBCLASS_REFERENCES = [
  {
    index: "path-of-the-berserker",
    name: "Path of the Berserker",
    subclass_flavor: "Berserker",
    summary: "Channel Rage into Violent Fury",
    description:
      "Barbarians who follow the Path of the Berserker let their Rage drive them into relentless violence and fearless aggression.",
    features: [
      {
        name: "Frenzy",
        level: 3,
        description:
          "If you use Reckless Attack while your Rage is active, you deal extra damage to the first target you hit on your turn with a Strength-based attack. To determine the extra damage, roll a number of d6s equal to your Rage Damage bonus, and add them together. The damage has the same type as the weapon or Unarmed Strike used for the attack.",
      },
      {
        name: "Mindless Rage",
        level: 6,
        description:
          "You have Immunity to the Charmed and Frightened conditions while your Rage is active, and those conditions end on you when you enter your Rage.",
      },
      {
        name: "Retaliation",
        level: 10,
        description:
          "When a creature within 5 feet damages you, you can use your Reaction to make a melee attack against it.",
      },
      {
        name: "Intimidating Presence",
        level: 14,
        description:
          "As a Bonus Action, you can strike terror into others with your menacing presence and primal power. When you do so, each creature of your choice in a 30-foot Emanation originating from you must make a Wisdom saving throw (DC 8 plus your Strength modifier and Proficiency Bonus). On a failed save, a creature has the Frightened condition for 1 minute. At the end of each of the Frightened creature's turns, the creature repeats the save, ending the effect on itself on a success. Once you use this feature, you can't use it again until you finish a Long Rest unless you expend a use of your Rage (no action required) to restore your use of it.",
      },
    ],
    class: {
      index: "barbarian",
      name: "Barbarian",
      url: "/api/2024/classes/barbarian",
    },
    url: "/api/2024/subclasses/path-of-the-berserker",
  },
  {
    index: "path-of-the-wild-heart",
    name: "Path of the Wild Heart",
    subclass_flavor: "Wild Heart",
    summary: "Walk in Community with the Animal World",
    description:
      "Barbarians who walk the Path of the Wild Heart draw on primal animal spirits and the raw instinct of the natural world.",
    features: [
      {
        name: "Animal Speaker",
        level: 3,
        description:
          "You can cast Speak with Animals as a ritual, reflecting your kinship with beasts and the natural world.",
      },
      {
        name: "Rage of the Wilds",
        level: 3,
        description:
          "Your Rage taps into the primal power of animals. Whenever you activate your Rage, you gain one of the following options of your choice. Bear. While your Rage is active, you have Resistance to every damage type except Force, Necrotic, Psychic, and Radiant. Eagle. When you activate your Rage, you can take the Disengage and Dash actions as part of that Bonus Action. While your Rage is active, you can take a Bonus Action to take both of those actions. Wolf. While your Rage is active, your allies have Advantage on attack rolls against any enemy of yours within 5 feet of you.",
      },
      {
        name: "Aspect of the Wilds",
        level: 6,
        description:
          "You gain one of the following options of your choice. Whenever you finish a Long Rest, you can change your choice. Owl. You have Darkvision with a range of 60 feet. If you already have Darkvision, its range increases by 60 feet. Panther. You have a Climb Speed equal to your Speed. Salmon. You have a Swim Speed equal to your Speed.",
      },
      {
        name: "Nature Speaker",
        level: 10,
        description:
          "You can cast the Commune with Nature spell but only as a Ritual. Wisdom is your spellcasting ability for it.",
      },
      {
        name: "Power of the Wilds",
        level: 14,
        description:
          "Whenever you activate your Rage, you gain one of the following options of your choice. Falcon. While your Rage is active, you have a Fly Speed equal to your Speed if you aren't wearing any armor. Lion. While your Rage is active, any of your enemies within 5 feet of you have Disadvantage on attack rolls against targets other than you or another Barbarian who has this option active. Ram. While your Rage is active, you can cause a Large or smaller creature to have the Prone condition when you hit it with a melee attack.",
      },
    ],
    class: {
      index: "barbarian",
      name: "Barbarian",
      url: "/api/2024/classes/barbarian",
    },
    url: "/api/2024/subclasses/path-of-the-wild-heart",
  },
  {
    index: "path-of-the-world-tree",
    name: "Path of the World Tree",
    subclass_flavor: "World Tree",
    summary: "Channel the Reach and Vitality of the World Tree",
    description:
      "Barbarians who follow the Path of the World Tree channel an ancient cosmic tree, mixing rage with protection, reach, and battlefield control.",
    features: [
      {
        name: "Vitality of the Tree",
        level: 3,
        description:
          "Vitality Surge. When you activate your Rage, you gain a number of Temporary Hit Points equal to your Barbarian level. Life-Giving Force. At the start of each of your turns while your Rage is active, you can choose another creature within 10 feet of yourself to gain Temporary Hit Points. To determine the number of Temporary Hit Points, roll a number of d6s equal to your Rage Damage bonus, and add them together. If any of these Temporary Hit Points remain when your Rage ends, they vanish.",
      },
      {
        name: "Branches of the Tree",
        level: 6,
        description:
          "Whenever a creature you can see starts its turn within 30 feet of you while your Rage is active, you can take a Reaction to summon spectral branches of the World Tree around it. The target must succeed on a Strength saving throw (DC 8 plus your Strength modifier and Proficiency Bonus) or be teleported to an unoccupied space you can see within 5 feet of yourself or in the nearest unoccupied space you can see. After the target teleports, you can reduce its Speed to 0 until the end of the current turn.",
      },
      {
        name: "Battering Roots",
        level: 10,
        description:
          "During your turn, your reach is 10 feet greater with any Melee weapon that has the Heavy or Versatile property, as tendrils of the World Tree extend from you. When you hit with such a weapon on your turn, you can activate the Push or Topple mastery property in addition to a different mastery property you're using with that weapon.",
      },
      {
        name: "Travel Along the Tree",
        level: 14,
        description:
          "When you activate your Rage and as a Bonus Action while your Rage is active, you can teleport up to 60 feet to an unoccupied space you can see. In addition, once per Rage, you can increase the range of that teleport to 150 feet. When you do so, you can also bring up to six willing creatures who are within 10 feet of you. Each creature teleports to an unoccupied space of your choice within 10 feet of your destination space.",
      },
    ],
    class: {
      index: "barbarian",
      name: "Barbarian",
      url: "/api/2024/classes/barbarian",
    },
    url: "/api/2024/subclasses/path-of-the-world-tree",
  },
  {
    index: "path-of-the-zealot",
    name: "Path of the Zealot",
    subclass_flavor: "Zealot",
    summary: "Become the Vessel of Divine Fury",
    description:
      "Barbarians on the Path of the Zealot embody divine wrath, fighting with fervor that borders on the supernatural.",
    features: [
      {
        name: "Divine Fury",
        level: 3,
        description:
          "Sacred wrath infuses your strikes, adding divine force to your attacks while your Rage is active.",
      },
      {
        name: "Fanatical Focus",
        level: 6,
        description:
          "Your conviction helps you push through failure and endure effects that would stop a lesser warrior.",
      },
      {
        name: "Zealous Presence",
        level: 10,
        description:
          "You can ignite your allies with holy battle fervor, lending them offensive momentum in a crucial moment.",
      },
      {
        name: "Zealot Capstone Feature",
        level: 14,
        description:
          "Your divine fury reaches its apex, making you even harder to stop when battle turns desperate.",
      },
    ],
    class: {
      index: "barbarian",
      name: "Barbarian",
      url: "/api/2024/classes/barbarian",
    },
    url: "/api/2024/subclasses/path-of-the-zealot",
  },
];

function createClassRuleDocument() {
  return {
    category: "classes",
    index: "barbarian",
    name: "Barbarian",
    sourceJson: BARBARIAN_CLASS_REFERENCE,
  };
}

function createLevelRuleDocuments() {
  return BARBARIAN_LEVEL_REFERENCES.map((levelReference) => ({
    category: "levels",
    index: levelReference.index,
    name: `Barbarian ${levelReference.level}`,
    sourceJson: {
      index: levelReference.index,
      class: {
        index: "barbarian",
        name: "Barbarian",
        url: "/api/2024/classes/barbarian",
      },
      level: levelReference.level,
      url: `/api/2024/classes/barbarian/levels/${levelReference.level}`,
      features: levelReference.features.map((featureIndex) => {
        const feature = BARBARIAN_FEATURE_REFERENCES.find((entry) => entry.index === featureIndex);

        return {
          index: featureIndex,
          name: feature?.name ?? featureIndex,
          url: `/api/2024/features/${featureIndex}`,
        };
      }),
    },
  }));
}

function createFeatureRuleDocuments() {
  return BARBARIAN_FEATURE_REFERENCES.map((featureReference) => ({
    category: "features",
    index: featureReference.index,
    name: featureReference.name,
    sourceJson: {
      index: featureReference.index,
      class: {
        index: "barbarian",
        name: "Barbarian",
        url: "/api/2024/classes/barbarian",
      },
      level: featureReference.level,
      name: featureReference.name,
      desc: featureReference.desc,
      feature_specific: featureReference.feature_specific,
      subclass: "subclass" in featureReference ? featureReference.subclass : undefined,
      url: `/api/2024/features/${featureReference.index}`,
    },
  }));
}

function createSubclassRuleDocuments() {
  return BARBARIAN_SUBCLASS_REFERENCES.map((subclassReference) => ({
    category: "subclasses",
    index: subclassReference.index,
    name: subclassReference.name,
    sourceJson: subclassReference,
  }));
}

export {
  BARBARIAN_CLASS_REFERENCE,
  createClassRuleDocument,
  createFeatureRuleDocuments,
  createLevelRuleDocuments,
  createSubclassRuleDocuments,
};
