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

const BARBARIAN_ABILITY_SCORE_OPTIONS = [
  {
    option_type: "reference",
    item: {
      index: "str",
      name: "Strength",
      url: "/api/2024/ability-scores/str",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "dex",
      name: "Dexterity",
      url: "/api/2024/ability-scores/dex",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "con",
      name: "Constitution",
      url: "/api/2024/ability-scores/con",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "int",
      name: "Intelligence",
      url: "/api/2024/ability-scores/int",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "wis",
      name: "Wisdom",
      url: "/api/2024/ability-scores/wis",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "cha",
      name: "Charisma",
      url: "/api/2024/ability-scores/cha",
    },
  },
];

const BARBARIAN_ASI_AND_FEAT_OPTIONS = [
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
      index: "alert",
      name: "Alert",
      url: "/api/2024/feats/alert",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "grappler",
      name: "Grappler",
      url: "/api/2024/feats/grappler",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "magic-initiate",
      name: "Magic Initiate",
      url: "/api/2024/feats/magic-initiate",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "savage-attacker",
      name: "Savage Attacker",
      url: "/api/2024/feats/savage-attacker",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "skilled",
      name: "Skilled",
      url: "/api/2024/feats/skilled",
    },
  },
];

const BARBARIAN_EPIC_BOON_OPTIONS = [
  {
    option_type: "reference",
    item: {
      index: "boon-of-combat-prowess",
      name: "Boon of Combat Prowess",
      url: "/api/2024/feats/boon-of-combat-prowess",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "boon-of-dimensional-travel",
      name: "Boon of Dimensional Travel",
      url: "/api/2024/feats/boon-of-dimensional-travel",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "boon-of-fate",
      name: "Boon of Fate",
      url: "/api/2024/feats/boon-of-fate",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "boon-of-irresistible-offense",
      name: "Boon of Irresistible Offense",
      url: "/api/2024/feats/boon-of-irresistible-offense",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "boon-of-spell-recall",
      name: "Boon of Spell Recall",
      url: "/api/2024/feats/boon-of-spell-recall",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "boon-of-the-night-spirit",
      name: "Boon of the Night Spirit",
      url: "/api/2024/feats/boon-of-the-night-spirit",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "boon-of-truesight",
      name: "Boon of Truesight",
      url: "/api/2024/feats/boon-of-truesight",
    },
  },
];

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
    features: ["barbarian-primal-knowledge", "barbarian-subclass", "barbarian-subclass-feature-3"],
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
    features: ["barbarian-subclass-feature-6"],
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
    features: ["barbarian-subclass-feature-10"],
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
    features: ["barbarian-subclass-feature-14"],
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
      "You can enter a Rage as a Bonus Action. While raging, you gain a damage bonus on Strength-based attacks and resist bludgeoning, piercing, and slashing damage, subject to the normal class limits.",
      "Your Rage ends early if you wear Heavy Armor or if your turn ends without attacking, forcing a saving throw, or using a Bonus Action to keep the Rage going. The number of Rages you can use increases as you gain Barbarian levels.",
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
    index: "barbarian-ability-score-improvement-1",
    level: 4,
    name: "Ability Score Improvement",
    desc: [
      "You improve your abilities at this level. Use the character builder's ability score plan or feat rules to reflect your choice.",
    ],
    feature_specific: [
      {
        choose: 1,
        type: "feat or ability improvement",
        from: {
          option_set_type: "options_array",
          options: BARBARIAN_ASI_AND_FEAT_OPTIONS,
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: BARBARIAN_ABILITY_SCORE_OPTIONS,
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: [
            ...BARBARIAN_ABILITY_SCORE_OPTIONS,
            {
              option_type: "reference",
              item: {
                index: "no-second-increase",
                name: "No Second Increase",
                url: "/api/2024/feats/ability-score-improvement",
              },
            },
          ],
        },
      },
    ],
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
      "Your speed increases while you are not wearing Heavy Armor.",
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
    feature_specific: [
      {
        choose: 1,
        type: "feat or ability improvement",
        from: {
          option_set_type: "options_array",
          options: BARBARIAN_ASI_AND_FEAT_OPTIONS,
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: BARBARIAN_ABILITY_SCORE_OPTIONS,
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: [
            ...BARBARIAN_ABILITY_SCORE_OPTIONS,
            {
              option_type: "reference",
              item: {
                index: "no-second-increase",
                name: "No Second Increase",
                url: "/api/2024/feats/ability-score-improvement",
              },
            },
          ],
        },
      },
    ],
  },
  {
    index: "barbarian-brutal-strike",
    level: 9,
    name: "Brutal Strike",
    desc: [
      "When Reckless Attack is active, you can give up its advantage on one Strength-based attack roll to deliver an added effect if the attack hits. This feature replaces the old critical-only progression with a new tactical strike rider.",
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
    index: "relentless-rage",
    level: 11,
    name: "Relentless Rage",
    desc: [
      "When you would be reduced to 0 hit points while raging, you can make a Constitution saving throw to drop to 1 hit point instead.",
    ],
  },
  {
    index: "barbarian-ability-score-improvement-3",
    level: 12,
    name: "Ability Score Improvement",
    desc: [
      "You improve your abilities again at this level.",
    ],
    feature_specific: [
      {
        choose: 1,
        type: "feat or ability improvement",
        from: {
          option_set_type: "options_array",
          options: BARBARIAN_ASI_AND_FEAT_OPTIONS,
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: BARBARIAN_ABILITY_SCORE_OPTIONS,
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: [
            ...BARBARIAN_ABILITY_SCORE_OPTIONS,
            {
              option_type: "reference",
              item: {
                index: "no-second-increase",
                name: "No Second Increase",
                url: "/api/2024/feats/ability-score-improvement",
              },
            },
          ],
        },
      },
    ],
  },
  {
    index: "barbarian-improved-brutal-strike-1",
    level: 13,
    name: "Improved Brutal Strike",
    desc: [
      "Your Brutal Strike improves, giving you stronger results when you convert Reckless Attack into a devastating hit.",
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
    feature_specific: [
      {
        choose: 1,
        type: "feat or ability improvement",
        from: {
          option_set_type: "options_array",
          options: BARBARIAN_ASI_AND_FEAT_OPTIONS,
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: BARBARIAN_ABILITY_SCORE_OPTIONS,
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: [
            ...BARBARIAN_ABILITY_SCORE_OPTIONS,
            {
              option_type: "reference",
              item: {
                index: "no-second-increase",
                name: "No Second Increase",
                url: "/api/2024/feats/ability-score-improvement",
              },
            },
          ],
        },
      },
    ],
  },
  {
    index: "barbarian-improved-brutal-strike-2",
    level: 17,
    name: "Improved Brutal Strike",
    desc: [
      "Your Brutal Strike improves again, expanding the impact of your strongest hits.",
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
      "Your Strength and Constitution improve beyond ordinary limits, marking the peak of Barbarian power.",
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
          "If you use Reckless Attack while your Rage is active, you deal extra damage to the first target you hit on your turn with a Strength-based attack.",
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
          "As a Bonus Action, you can unleash terrifying primal menace that frightens creatures of your choice nearby.",
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
          "Your Rage takes on a primal bestial identity, granting a wilderness-focused combat expression tied to your chosen wild aspect.",
      },
      {
        name: "Aspect of the Wilds",
        level: 6,
        description:
          "Your spiritual bond to the wild deepens, sharpening your movement, instincts, or survival-focused primal benefits.",
      },
      {
        name: "Nature Speaker",
        level: 10,
        description:
          "Your connection to the natural world grows into a stronger primal utility feature and deeper communion with beast spirits.",
      },
      {
        name: "Power of the Wilds",
        level: 14,
        description:
          "Your primal form reaches its peak, expressing the full supernatural force of your chosen animal spirit.",
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
          "Your Rage channels the world tree's sustaining force, blending primal ferocity with restorative and rooting power.",
      },
      {
        name: "Branches of the Tree",
        level: 6,
        description:
          "Your connection to the world tree extends your reach and lets you interfere with foes through supernatural limbs and presence.",
      },
      {
        name: "Battering Roots",
        level: 10,
        description:
          "Your battlefield control becomes forceful and disruptive, letting world-tree power shove or reposition creatures.",
      },
      {
        name: "Travel Along the Tree",
        level: 14,
        description:
          "You bend the pathways of the world tree to reposition yourself and others in dramatic ways.",
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
