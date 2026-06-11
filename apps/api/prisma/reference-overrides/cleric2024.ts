const CLERIC_SKILL_OPTIONS = [
  ["skill-history", "Skill: History"],
  ["skill-insight", "Skill: Insight"],
  ["skill-medicine", "Skill: Medicine"],
  ["skill-persuasion", "Skill: Persuasion"],
  ["skill-religion", "Skill: Religion"],
] as const;

const CLERIC_ABILITY_SCORE_OPTIONS = [
  ["str", "Strength"],
  ["dex", "Dexterity"],
  ["con", "Constitution"],
  ["int", "Intelligence"],
  ["wis", "Wisdom"],
  ["cha", "Charisma"],
] as const;

const CLERIC_FEAT_OPTIONS = [
  ["ability-score-improvement", "Ability Score Improvement"],
  ["alert", "Alert"],
  ["magic-initiate", "Magic Initiate"],
  ["savage-attacker", "Savage Attacker"],
  ["skilled", "Skilled"],
  ["grappler", "Grappler"],
  ["archery", "Archery"],
  ["defense", "Defense"],
  ["great-weapon-fighting", "Great Weapon Fighting"],
  ["two-weapon-fighting", "Two-Weapon Fighting"],
] as const;

const CLERIC_EPIC_BOON_OPTIONS = [
  ["boon-of-combat-prowess", "Boon of Combat Prowess"],
  ["boon-of-dimensional-travel", "Boon of Dimensional Travel"],
  ["boon-of-fate", "Boon of Fate"],
  ["boon-of-irresistible-offense", "Boon of Irresistible Offense"],
  ["boon-of-spell-recall", "Boon of Spell Recall"],
  ["boon-of-the-night-spirit", "Boon of the Night Spirit"],
  ["boon-of-truesight", "Boon of Truesight"],
] as const;

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

const CLERIC_CLASS_REFERENCE = {
  index: "cleric",
  name: "Cleric",
  primary_ability: {
    desc: "Wisdom",
    ability_scores: [
      {
        index: "wis",
        name: "WIS",
        url: "/api/2024/ability-scores/wis",
      },
    ],
  },
  hit_die: 8,
  proficiency_choices: [
    {
      desc: "Choose 2: History, Insight, Medicine, Persuasion, or Religion",
      choose: 2,
      type: "proficiencies",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(CLERIC_SKILL_OPTIONS, "proficiencies"),
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
      index: "saving-throw-wis",
      name: "Saving Throw: WIS",
      url: "/api/2024/proficiencies/saving-throw-wis",
    },
    {
      index: "saving-throw-cha",
      name: "Saving Throw: CHA",
      url: "/api/2024/proficiencies/saving-throw-cha",
    },
  ],
  saving_throws: [
    {
      index: "wis",
      name: "WIS",
      url: "/api/2024/ability-scores/wis",
    },
    {
      index: "cha",
      name: "CHA",
      url: "/api/2024/ability-scores/cha",
    },
  ],
  starting_equipment_options: [
    {
      desc: "(a) Chain Shirt, Shield, Mace, Holy Symbol, Priest's Pack, and 7 GP; or (b) 110 GP",
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
                  index: "chain-shirt",
                  name: "Chain Shirt",
                  url: "/api/2024/equipment/chain-shirt",
                },
              },
              {
                option_type: "counted_reference",
                count: 1,
                of: {
                  index: "shield",
                  name: "Shield",
                  url: "/api/2024/equipment/shield",
                },
              },
              {
                option_type: "counted_reference",
                count: 1,
                of: {
                  index: "mace",
                  name: "Mace",
                  url: "/api/2024/equipment/mace",
                },
              },
              {
                option_type: "counted_reference",
                count: 1,
                of: {
                  index: "holy-symbols",
                  name: "Holy Symbols",
                  url: "/api/2024/equipment-categories/holy-symbols",
                },
              },
              {
                option_type: "counted_reference",
                count: 1,
                of: {
                  index: "priests-pack",
                  name: "Priest's Pack",
                  url: "/api/2024/equipment/priests-pack",
                },
              },
              {
                option_type: "money",
                count: 7,
                unit: "gp",
              },
            ],
          },
          {
            option_type: "money",
            count: 110,
            unit: "gp",
          },
        ],
      },
    },
  ],
  class_levels: "/api/2024/classes/cleric/levels",
  multi_classing: {
    prerequisites: [
      {
        ability_score: {
          index: "wis",
          name: "WIS",
          url: "/api/2024/ability-scores/wis",
        },
        minimum_score: 13,
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
    ],
  },
  spellcasting: {
    level: 1,
    spellcasting_ability: {
      index: "wis",
      name: "WIS",
      url: "/api/2024/ability-scores/wis",
    },
    info: [
      {
        name: "Cantrips",
        desc: [
          "You know three cantrips of your choice from the Cleric spell list.",
          "At Cleric levels 4 and 10, you learn another Cleric cantrip.",
        ],
      },
      {
        name: "Prepared Spells",
        desc: [
          "You prepare level 1+ Cleric spells from the Cleric spell list based on the Prepared Spells column of the Cleric progression.",
        ],
      },
      {
        name: "Spellcasting Focus",
        desc: [
          "You can use a Holy Symbol as a Spellcasting Focus for your Cleric spells.",
        ],
      },
    ],
  },
  spells: "/api/2024/classes/cleric/spells",
  subclasses: [
    {
      index: "life-domain",
      name: "Life Domain",
      url: "/api/2024/subclasses/life-domain",
    },
    {
      index: "light-domain",
      name: "Light Domain",
      url: "/api/2024/subclasses/light-domain",
    },
    {
      index: "trickery-domain",
      name: "Trickery Domain",
      url: "/api/2024/subclasses/trickery-domain",
    },
    {
      index: "war-domain",
      name: "War Domain",
      url: "/api/2024/subclasses/war-domain",
    },
  ],
  url: "/api/2024/classes/cleric",
};

const CLERIC_LEVEL_REFERENCES = [
  { index: "cleric-1", level: 1, features: ["cleric-spellcasting", "divine-order"] },
  { index: "cleric-2", level: 2, features: ["channel-divinity"] },
  { index: "cleric-3", level: 3, features: ["cleric-subclass-feature-3", "cleric-subclass"] },
  { index: "cleric-4", level: 4, features: ["cleric-ability-score-improvement-1"] },
  { index: "cleric-5", level: 5, features: ["sear-undead"] },
  { index: "cleric-6", level: 6, features: ["cleric-subclass-feature-6"] },
  { index: "cleric-7", level: 7, features: ["blessed-strikes"] },
  { index: "cleric-8", level: 8, features: ["cleric-ability-score-improvement-2"] },
  { index: "cleric-10", level: 10, features: ["divine-intervention"] },
  { index: "cleric-12", level: 12, features: ["cleric-ability-score-improvement-3"] },
  { index: "cleric-14", level: 14, features: ["improved-blessed-strikes"] },
  { index: "cleric-16", level: 16, features: ["cleric-ability-score-improvement-4"] },
  { index: "cleric-17", level: 17, features: ["cleric-subclass-feature-17"] },
  { index: "cleric-19", level: 19, features: ["cleric-epic-boon"] },
  { index: "cleric-20", level: 20, features: ["greater-divine-intervention"] },
];

const CLERIC_FEATURE_REFERENCES = [
  {
    index: "cleric-spellcasting",
    level: 1,
    name: "Spellcasting",
    desc: [
      "You have learned to cast spells through prayer and meditation. Wisdom is your spellcasting ability, and you can use a Holy Symbol as your spellcasting focus.",
    ],
  },
  {
    index: "divine-order",
    level: 1,
    name: "Divine Order",
    desc: [
      "You have dedicated yourself to one of the sacred roles of your faith.",
      "Protector grants training for battle, with Heavy Armor and Martial Weapon capability.",
      "Thaumaturge deepens your mystical connection and grants an extra Cleric cantrip plus a Wisdom-based bonus to Arcana and Religion checks.",
    ],
    feature_specific: {
      choose: 1,
      type: "divine order",
      from: {
        option_set_type: "options_array",
        options: [
          {
            option_type: "reference",
            item: {
              index: "protector",
              name: "Protector",
              url: "/api/2024/proficiencies/martial-weapons",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "thaumaturge",
              name: "Thaumaturge",
              url: "/api/2024/ability-scores/wis",
            },
          },
        ],
      },
    },
  },
  {
    index: "channel-divinity",
    level: 2,
    name: "Channel Divinity",
    desc: [
      "You can channel divine energy directly from the Outer Planes to fuel magical effects.",
      "Divine Spark: as a Magic action, restore hit points to a creature within 30 feet or force a creature to make a Constitution save against Radiant or Necrotic damage.",
      "Turn Undead: as a Magic action, present your Holy Symbol to frighten and incapacitate nearby Undead that fail a Wisdom saving throw.",
    ],
  },
  {
    index: "cleric-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen divine domain grants its defining gifts at this level.",
      "Life Domain: Disciple of Life, Life Domain Spells, and Preserve Life make you an exceptional healer and guardian of vitality.",
      "Light Domain: Light Domain Spells, Warding Flare, and Radiance of the Dawn let you defend allies and scour darkness with radiant fire.",
      "Trickery Domain: Trickery Domain Spells, Blessing of the Trickster, and Invoke Duplicity favor stealth, deception, and magical misdirection.",
      "War Domain: War Domain Spells, Guided Strike, and War Priest turn you into a direct battlefield champion of your faith.",
    ],
  },
  {
    index: "cleric-subclass",
    level: 3,
    name: "Cleric Subclass",
    desc: [
      "Choose the divine domain that shapes your miracles and higher-level subclass features.",
    ],
    feature_specific: {
      choose: 1,
      type: "subclass",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(
          [
            ["life-domain", "Life Domain"],
            ["light-domain", "Light Domain"],
            ["trickery-domain", "Trickery Domain"],
            ["war-domain", "War Domain"],
          ],
          "subclasses",
        ),
      },
    },
  },
  {
    index: "cleric-ability-score-improvement-1",
    level: 4,
    name: "Ability Score Improvement",
    desc: [
      "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.",
    ],
    feature_specific: [
      {
        choose: 1,
        type: "feat or ability improvement",
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(CLERIC_FEAT_OPTIONS, "feats"),
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: [
            ...toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
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
    index: "sear-undead",
    level: 5,
    name: "Sear Undead",
    desc: [
      "Whenever you use Turn Undead, each Undead that fails its save takes Radiant damage equal to a number of d8s based on your Wisdom modifier.",
    ],
  },
  {
    index: "cleric-subclass-feature-6",
    level: 6,
    name: "Subclass Feature",
    desc: [
      "Your divine domain grants a stronger signature feature at this level.",
      "Life Domain: Blessed Healer lets your healing magic restore you when you mend others.",
      "Light Domain: Improved Warding Flare lets you project your protective flash to shield nearby allies.",
      "Trickery Domain: Trickster's Transposition lets you swap places with your duplicate and deepen your battlefield deception.",
      "War Domain: War God's Blessing lets you share your martial divine favor to improve an ally's strike.",
    ],
  },
  {
    index: "blessed-strikes",
    level: 7,
    name: "Blessed Strikes",
    desc: [
      "Divine power infuses you in battle. Choose one option: Divine Strike or Potent Spellcasting.",
      "Divine Strike adds 1d8 Radiant or Necrotic damage once on each of your turns when you hit with a weapon attack.",
      "Potent Spellcasting adds your Wisdom modifier to the damage of your Cleric cantrips.",
    ],
    feature_specific: {
      choose: 1,
      type: "blessed strikes",
      from: {
        option_set_type: "options_array",
        options: [
          {
            option_type: "reference",
            item: {
              index: "divine-strike",
              name: "Divine Strike",
              url: "/api/2024/features/blessed-strikes",
            },
          },
          {
            option_type: "reference",
            item: {
              index: "potent-spellcasting",
              name: "Potent Spellcasting",
              url: "/api/2024/features/blessed-strikes",
            },
          },
        ],
      },
    },
  },
  {
    index: "cleric-ability-score-improvement-2",
    level: 8,
    name: "Ability Score Improvement",
    desc: [
      "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.",
    ],
    feature_specific: [
      {
        choose: 1,
        type: "feat or ability improvement",
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(CLERIC_FEAT_OPTIONS, "feats"),
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: [
            ...toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
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
    index: "divine-intervention",
    level: 10,
    name: "Divine Intervention",
    desc: [
      "As a Magic action, choose any Cleric spell of level 5 or lower that doesn't require a Reaction to cast, and cast it without expending a spell slot or material components. You can't use this feature again until you finish a Long Rest.",
    ],
  },
  {
    index: "cleric-ability-score-improvement-3",
    level: 12,
    name: "Ability Score Improvement",
    desc: [
      "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.",
    ],
    feature_specific: [
      {
        choose: 1,
        type: "feat or ability improvement",
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(CLERIC_FEAT_OPTIONS, "feats"),
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: [
            ...toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
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
    index: "improved-blessed-strikes",
    level: 14,
    name: "Improved Blessed Strikes",
    desc: [
      "The option you chose for Blessed Strikes grows stronger.",
      "Divine Strike increases to 2d8 extra damage.",
      "Potent Spellcasting lets your Cleric cantrip damage grant temporary hit points to you or an ally within 60 feet equal to twice your Wisdom modifier.",
    ],
  },
  {
    index: "cleric-ability-score-improvement-4",
    level: 16,
    name: "Ability Score Improvement",
    desc: [
      "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.",
    ],
    feature_specific: [
      {
        choose: 1,
        type: "feat or ability improvement",
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(CLERIC_FEAT_OPTIONS, "feats"),
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
        },
      },
      {
        choose: 1,
        type: "ability score",
        from: {
          option_set_type: "options_array",
          options: [
            ...toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
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
    index: "cleric-subclass-feature-17",
    level: 17,
    name: "Subclass Feature",
    desc: [
      "Your chosen domain reaches its capstone expression.",
      "Life Domain: Supreme Healing maximizes the healing dice of your restorative spells and Channel Divinity.",
      "Light Domain: Corona of Light surrounds you with overwhelming radiance that heightens the danger of your holy fire.",
      "Trickery Domain: Improved Duplicity increases the power and flexibility of your duplicate-driven misdirection.",
      "War Domain: Avatar of Battle turns you into a heavily protected engine of divine warfare.",
    ],
  },
  {
    index: "cleric-epic-boon",
    level: 19,
    name: "Epic Boon",
    desc: [
      "You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Fate is recommended.",
    ],
    feature_specific: {
      choose: 1,
      type: "epic boon",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(CLERIC_EPIC_BOON_OPTIONS, "feats"),
      },
    },
  },
  {
    index: "greater-divine-intervention",
    level: 20,
    name: "Greater Divine Intervention",
    desc: [
      "When you use Divine Intervention, you can choose Wish when you select a spell. If you do so, you can't use Divine Intervention again until you finish 2d4 Long Rests.",
    ],
  },
];

const CLERIC_SUBCLASS_REFERENCES = [
  {
    index: "life-domain",
    name: "Life Domain",
    subclass_flavor: "Life",
    description:
      "The Life Domain focuses on positive energy that sustains life and makes its clerics masters of healing magic.",
    summary: "Soothe the Hurts of the World",
    features: [
      {
        name: "Disciple of Life",
        level: 3,
        description:
          "Your healing spells restore additional hit points, reinforcing your role as the party's premier divine healer.",
      },
      {
        name: "Life Domain Spells",
        level: 3,
        description:
          "You always have healing- and protection-focused domain spells prepared as you gain Cleric levels.",
      },
      {
        name: "Preserve Life",
        level: 3,
        description:
          "You can channel divine vitality to distribute a pool of healing among injured creatures nearby.",
      },
      {
        name: "Blessed Healer",
        level: 6,
        description:
          "When you restore others with leveled magic, some of that restorative power rebounds to you.",
      },
      {
        name: "Supreme Healing",
        level: 17,
        description:
          "Your restorative magic becomes maximally efficient, turning healing dice into their highest possible values.",
      },
    ],
    class: {
      index: "cleric",
      name: "Cleric",
      url: "/api/2024/classes/cleric",
    },
    url: "/api/2024/subclasses/life-domain",
  },
  {
    index: "light-domain",
    name: "Light Domain",
    subclass_flavor: "Light",
    summary: "Wield Radiance Against Darkness",
    description:
      "The Light Domain channels revelation, fire, and radiant brilliance, empowering clerics who banish darkness and scorch enemies with holy illumination.",
    features: [
      {
        name: "Light Domain Spells",
        level: 3,
        description:
          "You always have domain spells prepared that emphasize radiance, fire, revelation, and magical sight.",
      },
      {
        name: "Warding Flare",
        level: 3,
        description:
          "A burst of divine light can foil an enemy's assault by dazzling the attacker at a crucial moment.",
      },
      {
        name: "Radiance of the Dawn",
        level: 3,
        description:
          "You unleash sunlight-like power that strips away darkness and burns hostile creatures with radiant energy.",
      },
      {
        name: "Improved Warding Flare",
        level: 6,
        description:
          "Your protective flare grows strong enough to defend your allies as well as yourself.",
      },
      {
        name: "Corona of Light",
        level: 17,
        description:
          "You blaze with overwhelming radiance that makes your light- and fire-based magic even more devastating.",
      },
    ],
    class: {
      index: "cleric",
      name: "Cleric",
      url: "/api/2024/classes/cleric",
    },
    url: "/api/2024/subclasses/light-domain",
  },
  {
    index: "trickery-domain",
    name: "Trickery Domain",
    subclass_flavor: "Trickery",
    summary: "Misdirect, Disguise, and Confound",
    description:
      "The Trickery Domain favors deception, stealth, disguise, and magical misdirection, empowering clerics who serve sly, secretive, or chaotic divine patrons.",
    features: [
      {
        name: "Trickery Domain Spells",
        level: 3,
        description:
          "You always have domain spells prepared that support stealth, illusions, infiltration, and deceit.",
      },
      {
        name: "Blessing of the Trickster",
        level: 3,
        description:
          "Your patron's subtle favor lets you enhance a creature's talent for stealth and covert movement.",
      },
      {
        name: "Invoke Duplicity",
        level: 3,
        description:
          "You create an illusory double that extends your trickery, positioning, and spell support in a fight.",
      },
      {
        name: "Trickster's Transposition",
        level: 6,
        description:
          "Your bond with your duplicate deepens, letting you reposition through it and confuse enemies more effectively.",
      },
      {
        name: "Improved Duplicity",
        level: 17,
        description:
          "Your illusion-based misdirection reaches its peak, making your duplicates far more threatening and tactically useful.",
      },
    ],
    class: {
      index: "cleric",
      name: "Cleric",
      url: "/api/2024/classes/cleric",
    },
    url: "/api/2024/subclasses/trickery-domain",
  },
  {
    index: "war-domain",
    name: "War Domain",
    subclass_flavor: "War",
    summary: "Lead the Faithful into Battle",
    description:
      "The War Domain embodies conflict, martial discipline, and divine victory, empowering clerics who march beside soldiers and champions.",
    features: [
      {
        name: "War Domain Spells",
        level: 3,
        description:
          "You always have domain spells prepared that strengthen your battlefield control, offense, and front-line presence.",
      },
      {
        name: "Guided Strike",
        level: 3,
        description:
          "Divine certainty lets you turn a crucial miss into a more accurate strike at the decisive moment.",
      },
      {
        name: "War Priest",
        level: 3,
        description:
          "You gain extra martial pressure in battle, reinforcing your role as a combat-ready cleric.",
      },
      {
        name: "War God's Blessing",
        level: 6,
        description:
          "Your divine favor can extend to allies, helping them land important weapon attacks when it matters most.",
      },
      {
        name: "Avatar of Battle",
        level: 17,
        description:
          "At your peak, divine war power hardens you against battlefield punishment and lets you endure prolonged conflict.",
      },
    ],
    class: {
      index: "cleric",
      name: "Cleric",
      url: "/api/2024/classes/cleric",
    },
    url: "/api/2024/subclasses/war-domain",
  },
];

function createClericClassRuleDocument() {
  return {
    category: "classes",
    index: "cleric",
    name: "Cleric",
    sourceJson: CLERIC_CLASS_REFERENCE,
  };
}

function createClericLevelRuleDocuments() {
  return CLERIC_LEVEL_REFERENCES.map((levelReference) => ({
    category: "levels",
    index: levelReference.index,
    name: `Cleric ${levelReference.level}`,
    sourceJson: {
      index: levelReference.index,
      class: {
        index: "cleric",
        name: "Cleric",
        url: "/api/2024/classes/cleric",
      },
      level: levelReference.level,
      url: `/api/2024/classes/cleric/levels/${levelReference.level}`,
      features: levelReference.features.map((featureIndex) => {
        const feature = CLERIC_FEATURE_REFERENCES.find((entry) => entry.index === featureIndex);

        return {
          index: featureIndex,
          name: feature?.name ?? featureIndex,
          url: `/api/2024/features/${featureIndex}`,
        };
      }),
    },
  }));
}

function createClericFeatureRuleDocuments() {
  return CLERIC_FEATURE_REFERENCES.map((featureReference) => ({
    category: "features",
    index: featureReference.index,
    name: featureReference.name,
    sourceJson: {
      index: featureReference.index,
      class: {
        index: "cleric",
        name: "Cleric",
        url: "/api/2024/classes/cleric",
      },
      level: featureReference.level,
      name: featureReference.name,
      desc: featureReference.desc,
      feature_specific: featureReference.feature_specific,
      url: `/api/2024/features/${featureReference.index}`,
    },
  }));
}

function createClericSubclassRuleDocuments() {
  return CLERIC_SUBCLASS_REFERENCES.map((subclassReference) => ({
    category: "subclasses",
    index: subclassReference.index,
    name: subclassReference.name,
    sourceJson: subclassReference,
  }));
}

export {
  CLERIC_CLASS_REFERENCE,
  createClericClassRuleDocument,
  createClericFeatureRuleDocuments,
  createClericLevelRuleDocuments,
  createClericSubclassRuleDocuments,
};
