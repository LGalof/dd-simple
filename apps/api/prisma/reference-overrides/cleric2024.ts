import {
  COMMON_ABILITY_SCORE_OPTIONS,
  COMMON_EPIC_BOON_OPTIONS,
  CORE_FEAT_OPTIONS,
} from "./curatedClassHelpers.js";

const CLERIC_SKILL_OPTIONS = [
  ["skill-history", "Skill: History"],
  ["skill-insight", "Skill: Insight"],
  ["skill-medicine", "Skill: Medicine"],
  ["skill-persuasion", "Skill: Persuasion"],
  ["skill-religion", "Skill: Religion"],
] as const;

const CLERIC_CANTRIP_OPTIONS = [
  ["guidance", "Guidance"],
  ["light", "Light"],
  ["mending", "Mending"],
  ["resistance", "Resistance"],
  ["sacred-flame", "Sacred Flame"],
  ["spare-the-dying", "Spare the Dying"],
  ["thaumaturgy", "Thaumaturgy"],
  ["toll-the-dead", "Toll the Dead"],
  ["word-of-radiance", "Word of Radiance"],
] as const;

const CLERIC_ABILITY_SCORE_OPTIONS = COMMON_ABILITY_SCORE_OPTIONS;

const CLERIC_FEAT_OPTIONS = CORE_FEAT_OPTIONS;

const CLERIC_EPIC_BOON_OPTIONS = COMMON_EPIC_BOON_OPTIONS;

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

function toSpellOptions(entries: readonly (readonly [string, string])[]) {
  return entries.map(([index, name]) => ({
    option_type: "reference",
    item: {
      index,
      name,
      url: `/api/2024/spells/${index}`,
    },
  }));
}

function createClericSpellChoiceFeature(
  index: string,
  level: number,
  name: string,
  description: string,
  choose: number,
  spellOptions: readonly (readonly [string, string])[],
) {
  return {
    index,
    level,
    name,
    desc: [description],
    feature_specific: {
      choose,
      type: "cleric cantrip",
      from: {
        option_set_type: "options_array",
        options: toSpellOptions(spellOptions),
      },
    },
  };
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
        options: toReferenceOptions(CLERIC_ABILITY_SCORE_OPTIONS, "ability-scores"),
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
        options: toReferenceOptions(CLERIC_FEAT_OPTIONS, "feats"),
      },
    },
  };
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
  { index: "cleric-1", level: 1, features: ["cleric-cantrips-1", "cleric-spellcasting", "divine-order"] },
  { index: "cleric-2", level: 2, features: ["channel-divinity"] },
  {
    index: "cleric-3",
    level: 3,
    features: [
      "cleric-subclass-feature-3",
      "cleric-subclass",
      "disciple-of-life",
      "life-domain-spells",
      "preserve-life",
      "light-domain-spells",
      "warding-flare",
      "radiance-of-the-dawn",
      "trickery-domain-spells",
      "blessing-of-the-trickster",
      "invoke-duplicity",
      "war-domain-spells",
      "guided-strike",
      "war-priest",
    ],
  },
  { index: "cleric-4", level: 4, features: ["cleric-cantrips-2", "cleric-ability-score-improvement-1"] },
  { index: "cleric-5", level: 5, features: ["sear-undead"] },
  {
    index: "cleric-6",
    level: 6,
    features: [
      "cleric-subclass-feature-6",
      "blessed-healer",
      "improved-warding-flare",
      "tricksters-transposition",
      "war-gods-blessing",
    ],
  },
  { index: "cleric-7", level: 7, features: ["blessed-strikes"] },
  { index: "cleric-8", level: 8, features: ["cleric-ability-score-improvement-2"] },
  { index: "cleric-10", level: 10, features: ["cleric-cantrips-3", "divine-intervention"] },
  { index: "cleric-12", level: 12, features: ["cleric-ability-score-improvement-3"] },
  { index: "cleric-14", level: 14, features: ["improved-blessed-strikes"] },
  { index: "cleric-16", level: 16, features: ["cleric-ability-score-improvement-4"] },
  {
    index: "cleric-17",
    level: 17,
    features: [
      "cleric-subclass-feature-17",
      "supreme-healing",
      "corona-of-light",
      "improved-duplicity",
      "avatar-of-battle",
    ],
  },
  { index: "cleric-19", level: 19, features: ["cleric-epic-boon"] },
  { index: "cleric-20", level: 20, features: ["greater-divine-intervention"] },
];

const CLERIC_FEATURE_REFERENCES = [
  createClericSpellChoiceFeature(
    "cleric-cantrips-1",
    1,
    "Cantrips",
    "Choose three Cleric cantrips to represent the first prayers and sacred signs you can invoke reliably.",
    3,
    CLERIC_CANTRIP_OPTIONS,
  ),
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
      "Protector. Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor.",
      "Thaumaturge. You know one extra cantrip from the Cleric spell list. In addition, your mystical connection to the divine gives you a bonus to your Intelligence (Arcana or Religion) checks. The bonus equals your Wisdom modifier (minimum of +1).",
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
              description:
                "Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor.",
              url: "/api/2024/features/divine-order/protector",
            },
            grants: {
              armorNames: ["Heavy Armor"],
              weaponNames: ["Martial Weapons"],
              derivedSources: [
                {
                  description:
                    "Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor.",
                  level: 1,
                  sourceIndex: "divine-order-protector",
                  sourceType: "class_feature",
                  title: "Divine Order: Protector",
                },
              ],
            },
          },
          {
            option_type: "reference",
            item: {
              index: "thaumaturge",
              name: "Thaumaturge",
              description:
                "You know one extra cantrip from the Cleric spell list. In addition, your mystical connection to the divine gives you a bonus to your Intelligence (Arcana or Religion) checks. The bonus equals your Wisdom modifier (minimum of +1).",
              url: "/api/2024/features/divine-order/thaumaturge",
            },
            grants: {
              skillAbilityModifierBonusByIndex: {
                arcana: "wis",
                religion: "wis",
              },
              derivedSources: [
                {
                  description:
                    "You know one extra cantrip from the Cleric spell list. In addition, your mystical connection to the divine gives you a bonus to your Intelligence (Arcana or Religion) checks. The bonus equals your Wisdom modifier (minimum of +1).",
                  level: 1,
                  sourceIndex: "divine-order-thaumaturge",
                  sourceType: "class_feature",
                  title: "Divine Order: Thaumaturge",
                },
              ],
            },
            choice: {
              choose: 1,
              type: "cleric cantrip",
              desc: "Choose one additional Cleric cantrip granted by Thaumaturge.",
              from: {
                option_set_type: "options_array",
                options: toSpellOptions(CLERIC_CANTRIP_OPTIONS),
              },
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
      "You can channel divine energy directly from the Outer Planes to fuel magical effects. You start with two such effects: Divine Spark and Turn Undead, each of which is described below. Each time you use this class's Channel Divinity, choose which Channel Divinity effect from this class to create. You gain additional effect options at higher Cleric levels.",
      "You can use this class's Channel Divinity twice. You regain one of its expended uses when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. You gain additional uses when you reach certain Cleric levels, as shown in the Channel Divinity column of the Cleric Features table.",
      "If a Channel Divinity effect requires a saving throw, the DC equals the spell save DC from this class's Spellcasting feature.",
      "Divine Spark. As a Magic action, you point your Holy Symbol at another creature you can see within 30 feet of yourself and focus divine energy at it. Roll 1d8 and add your Wisdom modifier. You either restore Hit Points to the creature equal to that total or force the creature to make a Constitution saving throw. On a failed save, the creature takes Necrotic or Radiant damage (your choice) equal to that total. On a successful save, the creature takes half as much damage (round down). You roll an additional d8 when you reach Cleric levels 7 (2d8), 13 (3d8), and 18 (4d8).",
      "Turn Undead. As a Magic action, you present your Holy Symbol and censure Undead creatures. Each Undead of your choice within 30 feet of you must make a Wisdom saving throw. If the creature fails its save, it has the Frightened and Incapacitated conditions for 1 minute. For that duration, it tries to move as far from you as it can on its turns. This effect ends early on the creature if it takes any damage, if you have the Incapacitated condition, or if you die.",
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
    index: "disciple-of-life",
    level: 3,
    name: "Disciple of Life",
    desc: [
      "When a spell you cast with a spell slot restores Hit Points to a creature, that creature regains additional Hit Points on the turn you cast the spell. The additional Hit Points equal 2 plus the spell slot's level.",
    ],
    subclass: {
      index: "life-domain",
      name: "Life Domain",
      url: "/api/2024/subclasses/life-domain",
    },
  },
  {
    index: "life-domain-spells",
    level: 3,
    name: "Life Domain Spells",
    desc: [
      "Your connection to this divine domain ensures you always have certain spells ready. When you reach a Cleric level specified in the Life Domain Spells table, you thereafter always have the listed spells prepared.",
      "You always have Aid, Bless, Cure Wounds, Lesser Restoration, Mass Healing Word, Revivify, Aura of Life, Death Ward, Greater Restoration, and Mass Cure Wounds spells prepared as you gain Cleric levels.",
      "Life Domain Spells. Cleric Level 3: Aid, Bless, Cure Wounds, Lesser Restoration. Cleric Level 5: Mass Healing Word, Revivify. Cleric Level 7: Aura of Life, Death Ward. Cleric Level 9: Greater Restoration, Mass Cure Wounds.",
    ],
    subclass: {
      index: "life-domain",
      name: "Life Domain",
      url: "/api/2024/subclasses/life-domain",
    },
  },
  {
    index: "preserve-life",
    level: 3,
    name: "Preserve Life",
    desc: [
      "As a Magic action, you present your Holy Symbol and expend a use of your Channel Divinity to evoke healing energy that can restore a number of Hit Points equal to five times your Cleric level. Choose Bloodied creatures within 30 feet of yourself (which can include you), and divide those Hit Points among them. This feature can restore a creature to no more than half its Hit Point maximum.",
    ],
    subclass: {
      index: "life-domain",
      name: "Life Domain",
      url: "/api/2024/subclasses/life-domain",
    },
  },
  {
    index: "light-domain-spells",
    level: 3,
    name: "Light Domain Spells",
    desc: [
      "Your connection to this divine domain ensures you always have certain spells ready. When you reach a Cleric level specified in the Light Domain Spells table, you thereafter always have the listed spells prepared.",
      "Light Domain Spells. Cleric Level 3: Burning Hands, Faerie Fire, Scorching Ray, See Invisibility. Cleric Level 5: Daylight, Fireball. Cleric Level 7: Arcane Eye, Wall of Fire. Cleric Level 9: Flame Strike, Scrying.",
    ],
    subclass: {
      index: "light-domain",
      name: "Light Domain",
      url: "/api/2024/subclasses/light-domain",
    },
  },
  {
    index: "warding-flare",
    level: 3,
    name: "Warding Flare",
    desc: [
      "When a creature that you can see within 30 feet of yourself makes an attack roll, you can take a Reaction to impose Disadvantage on the attack roll, causing light to flare before it hits or misses.",
      "You can use this feature a number of times equal to your Wisdom modifier (minimum of once). You regain all expended uses when you finish a Long Rest.",
    ],
    subclass: {
      index: "light-domain",
      name: "Light Domain",
      url: "/api/2024/subclasses/light-domain",
    },
  },
  {
    index: "radiance-of-the-dawn",
    level: 3,
    name: "Radiance of the Dawn",
    desc: [
      "As a Magic action, you present your Holy Symbol and expend a use of your Channel Divinity to emit a flash of light in a 30-foot Emanation originating from yourself. Any magical Darkness--such as that created by the Darkness spell--in that area is dispelled. Additionally, each creature of your choice in that area must make a Constitution saving throw, taking Radiant damage equal to 2d10 plus your Cleric level on a failed save or half as much damage on a successful one.",
    ],
    subclass: {
      index: "light-domain",
      name: "Light Domain",
      url: "/api/2024/subclasses/light-domain",
    },
  },
  {
    index: "trickery-domain-spells",
    level: 3,
    name: "Trickery Domain Spells",
    desc: [
      "Your connection to this divine domain ensures you always have certain spells ready. When you reach a Cleric level specified in the Trickery Domain Spells table, you thereafter always have the listed spells prepared.",
      "Trickery Domain Spells. Cleric Level 3: Charm Person, Disguise Self, Invisibility, Pass without Trace. Cleric Level 5: Hypnotic Pattern, Nondetection. Cleric Level 7: Confusion, Dimension Door. Cleric Level 9: Dominate Person, Modify Memory.",
    ],
    subclass: {
      index: "trickery-domain",
      name: "Trickery Domain",
      url: "/api/2024/subclasses/trickery-domain",
    },
  },
  {
    index: "blessing-of-the-trickster",
    level: 3,
    name: "Blessing of the Trickster",
    desc: [
      "As a Magic action, you can choose yourself or a willing creature within 30 feet of yourself to have Advantage on Dexterity (Stealth) checks. This blessing lasts until you finish a Long Rest or you use this feature again.",
    ],
    subclass: {
      index: "trickery-domain",
      name: "Trickery Domain",
      url: "/api/2024/subclasses/trickery-domain",
    },
  },
  {
    index: "invoke-duplicity",
    level: 3,
    name: "Invoke Duplicity",
    desc: [
      "As a Bonus Action, you can expend one use of your Channel Divinity to create a perfect visual illusion of yourself in an unoccupied space you can see within 30 feet of yourself. The illusion is intangible and doesn't occupy its space. It lasts for 1 minute, but it ends early if you dismiss it (no action required) or have the Incapacitated condition. The illusion is animated and mimics your expressions and gestures. While it persists, you gain the following benefits.",
      "Cast Spells. You can cast spells as though you were in the illusion's space, but you must use your own senses.",
      "Distract. When both you and your illusion are within 5 feet of a creature that can see the illusion, you have Advantage on attack rolls against that creature, given how distracting the illusion is to the target.",
      "Move. As a Bonus Action, you can move the illusion up to 30 feet to an unoccupied space you can see that is within 120 feet of yourself.",
    ],
    subclass: {
      index: "trickery-domain",
      name: "Trickery Domain",
      url: "/api/2024/subclasses/trickery-domain",
    },
  },
  {
    index: "war-domain-spells",
    level: 3,
    name: "War Domain Spells",
    desc: [
      "Your connection to this divine domain ensures you always have certain spells ready. When you reach a Cleric level specified in the War Domain Spells table, you thereafter always have the listed spells prepared.",
      "War Domain Spells. Cleric Level 3: Guiding Bolt, Magic Weapon, Shield of Faith, Spiritual Weapon. Cleric Level 5: Crusader's Mantle, Spirit Guardians. Cleric Level 7: Fire Shield, Freedom of Movement. Cleric Level 9: Hold Monster, Steel Wind Strike.",
    ],
    subclass: {
      index: "war-domain",
      name: "War Domain",
      url: "/api/2024/subclasses/war-domain",
    },
  },
  {
    index: "guided-strike",
    level: 3,
    name: "Guided Strike",
    desc: [
      "When you or a creature within 30 feet of you misses with an attack roll, you can expend one use of your Channel Divinity and give that roll a +10 bonus, potentially causing it to hit. When you use this feature to benefit another creature's attack roll, you must take a Reaction to do so.",
    ],
    subclass: {
      index: "war-domain",
      name: "War Domain",
      url: "/api/2024/subclasses/war-domain",
    },
  },
  {
    index: "war-priest",
    level: 3,
    name: "War Priest",
    desc: [
      "As a Bonus Action, you can make one attack with a weapon or an Unarmed Strike. You can use this Bonus Action a number of times equal to your Wisdom modifier (minimum of once). You regain all expended uses when you finish a Short or Long Rest.",
    ],
    subclass: {
      index: "war-domain",
      name: "War Domain",
      url: "/api/2024/subclasses/war-domain",
    },
  },
  {
    index: "cleric-ability-score-improvement-1",
    level: 4,
    name: "Ability Score Improvement",
    desc: [
      "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Cleric levels 8, 12, and 16.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  createClericSpellChoiceFeature(
    "cleric-cantrips-2",
    4,
    "Cantrip",
    "Choose one additional Cleric cantrip.",
    1,
    CLERIC_CANTRIP_OPTIONS,
  ),
  {
    index: "sear-undead",
    level: 5,
    name: "Sear Undead",
    desc: [
      "Whenever you use Turn Undead, you can roll a number of d8s equal to your Wisdom modifier (minimum of 1d8) and add the rolls together. Each Undead that fails its saving throw against that use of Turn Undead takes Radiant damage equal to the roll's total. This damage doesn't end the turn effect.",
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
    index: "blessed-healer",
    level: 6,
    name: "Blessed Healer",
    desc: [
      "The healing spells you cast on others heal you as well. Immediately after you cast a spell with a spell slot that restores Hit Points to one or more creatures other than yourself, you regain Hit Points equal to 2 plus the spell slot's level.",
    ],
    subclass: {
      index: "life-domain",
      name: "Life Domain",
      url: "/api/2024/subclasses/life-domain",
    },
  },
  {
    index: "improved-warding-flare",
    level: 6,
    name: "Improved Warding Flare",
    desc: [
      "You regain all expended uses of your Warding Flare when you finish a Short or Long Rest.",
      "In addition, whenever you use Warding Flare, you can give the target of the triggering attack a number of Temporary Hit Points equal to 2d6 plus your Wisdom modifier.",
    ],
    subclass: {
      index: "light-domain",
      name: "Light Domain",
      url: "/api/2024/subclasses/light-domain",
    },
  },
  {
    index: "tricksters-transposition",
    level: 6,
    name: "Trickster's Transposition",
    desc: [
      "Whenever you take the Bonus Action to create or move the illusion of your Invoke Duplicity, you can teleport, swapping places with the illusion.",
    ],
    subclass: {
      index: "trickery-domain",
      name: "Trickery Domain",
      url: "/api/2024/subclasses/trickery-domain",
    },
  },
  {
    index: "war-gods-blessing",
    level: 6,
    name: "War God's Blessing",
    desc: [
      "You can expend a use of your Channel Divinity to cast Shield of Faith or Spiritual Weapon rather than expending a spell slot. When you cast either spell in this way, the spell doesn't require Concentration. Instead the spell lasts for 1 minute, but it ends early if you cast that spell again, have the Incapacitated condition, or die.",
    ],
    subclass: {
      index: "war-domain",
      name: "War Domain",
      url: "/api/2024/subclasses/war-domain",
    },
  },
  {
    index: "blessed-strikes",
    level: 7,
    name: "Blessed Strikes",
    desc: [
      "Divine power infuses you in battle. You gain one of the following options of your choice.",
      "Divine Strike. Once on each of your turns when you hit a creature with an attack roll using a weapon, you can cause the target to take an extra 1d8 Necrotic or Radiant damage (your choice).",
      "Potent Spellcasting. Add your Wisdom modifier to the damage you deal with any Cleric cantrip.",
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
              description:
                "Once on each of your turns when you hit a creature with an attack roll using a weapon, you can cause the target to take an extra 1d8 Necrotic or Radiant damage (your choice).",
              index: "divine-strike",
              name: "Divine Strike",
              url: "/api/2024/features/blessed-strikes",
            },
            grants: {
              derivedSources: [
                {
                  description:
                    "Once on each of your turns when you hit a creature with an attack roll using a weapon, you can cause the target to take an extra 1d8 Necrotic or Radiant damage (your choice).",
                  level: 7,
                  sourceIndex: "divine-strike",
                  sourceType: "class_feature",
                  title: "Divine Strike",
                },
              ],
            },
          },
          {
            option_type: "reference",
            item: {
              description:
                "Add your Wisdom modifier to the damage you deal with any Cleric cantrip.",
              index: "potent-spellcasting",
              name: "Potent Spellcasting",
              url: "/api/2024/features/blessed-strikes",
            },
            grants: {
              derivedSources: [
                {
                  description:
                    "Add your Wisdom modifier to the damage you deal with any Cleric cantrip.",
                  level: 7,
                  sourceIndex: "potent-spellcasting",
                  sourceType: "class_feature",
                  title: "Potent Spellcasting",
                },
              ],
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
      "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Cleric levels 12 and 16.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "divine-intervention",
    level: 10,
    name: "Divine Intervention",
    desc: [
      "You can call on your deity or pantheon to intervene on your behalf. As a Magic action, choose any Cleric spell of level 5 or lower that doesn't require a Reaction to cast. As part of the same action, you cast that spell without expending a spell slot or needing Material components. You can't use this feature again until you finish a Long Rest.",
    ],
  },
  createClericSpellChoiceFeature(
    "cleric-cantrips-3",
    10,
    "Cantrip",
    "Choose one additional Cleric cantrip.",
    1,
    CLERIC_CANTRIP_OPTIONS,
  ),
  {
    index: "cleric-ability-score-improvement-3",
    level: 12,
    name: "Ability Score Improvement",
    desc: [
      "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify. You gain this feature again at Cleric level 16.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
  },
  {
    index: "improved-blessed-strikes",
    level: 14,
    name: "Improved Blessed Strikes",
    desc: [
      "The option you chose for Blessed Strikes grows stronger.",
      "Divine Strike. The extra damage of your Divine Strike increases to 2d8.",
      "Potent Spellcasting. When you cast a Cleric cantrip and deal damage to a creature with it, you can give vitality to yourself or another creature within 60 feet of yourself, granting a number of Temporary Hit Points equal to twice your Wisdom modifier.",
    ],
  },
  {
    index: "cleric-ability-score-improvement-4",
    level: 16,
    name: "Ability Score Improvement",
    desc: [
      "You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.",
    ],
    feature_specific: createAbilityScoreImprovementSpecific(),
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
    index: "supreme-healing",
    level: 17,
    name: "Supreme Healing",
    desc: [
      "When you would normally roll one or more dice to restore Hit Points to a creature with a spell or Channel Divinity, don't roll those dice for the healing; instead use the highest number possible for each die. For example, instead of restoring 2d6 Hit Points to a creature with a spell, you restore 12.",
    ],
    subclass: {
      index: "life-domain",
      name: "Life Domain",
      url: "/api/2024/subclasses/life-domain",
    },
  },
  {
    index: "corona-of-light",
    level: 17,
    name: "Corona of Light",
    desc: [
      "As a Magic action, you cause yourself to emit an aura of sunlight that lasts for 1 minute or until you dismiss it (no action required). You emit Bright Light in a 60-foot radius and Dim Light for an additional 30 feet. Your enemies in the Bright Light have Disadvantage on saving throws against your Radiance of the Dawn and any spell that deals Fire or Radiant damage.",
      "You can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.",
    ],
    subclass: {
      index: "light-domain",
      name: "Light Domain",
      url: "/api/2024/subclasses/light-domain",
    },
  },
  {
    index: "improved-duplicity",
    level: 17,
    name: "Improved Duplicity",
    desc: [
      "The illusion of your Invoke Duplicity has grown more powerful in the following ways.",
      "Shared Distraction. When you and your allies make attack rolls against a creature within 5 feet of the illusion, the attack rolls have Advantage.",
      "Healing Illusion. When the illusion ends, you or a creature of your choice within 5 feet of it regains a number of Hit Points equal to your Cleric level.",
    ],
    subclass: {
      index: "trickery-domain",
      name: "Trickery Domain",
      url: "/api/2024/subclasses/trickery-domain",
    },
  },
  {
    index: "avatar-of-battle",
    level: 17,
    name: "Avatar of Battle",
    desc: [
      "You gain Resistance to Bludgeoning, Piercing, and Slashing damage.",
    ],
    subclass: {
      index: "war-domain",
      name: "War Domain",
      url: "/api/2024/subclasses/war-domain",
    },
  },
  {
    index: "cleric-epic-boon",
    level: 19,
    name: "Epic Boon",
    desc: [
      "You gain an Epic Boon feat or another feat of your choice for which you qualify.",
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
      "You can call on even more powerful divine intervention. When you use your Divine Intervention feature, you can choose Wish when you select a spell. If you do so, you can't use Divine Intervention again until you finish 2d4 Long Rests.",
    ],
  },
];

function createClericSubclassFeatures(featureIndexes: string[]) {
  return featureIndexes.map((featureIndex) => {
    const feature = CLERIC_FEATURE_REFERENCES.find(
      (entry) => entry.index === featureIndex,
    );

    if (!feature) {
      throw new Error(`Missing Cleric subclass feature reference: ${featureIndex}`);
    }

    return {
      name: feature.name,
      level: feature.level,
      description: feature.desc.join(" "),
    };
  });
}

const CLERIC_SUBCLASS_REFERENCES = [
  {
    index: "life-domain",
    name: "Life Domain",
    subclass_flavor: "Life",
    description:
      "The Life Domain focuses on the positive energy that helps sustain all life in the multiverse. Clerics who tap into this domain are masters of healing, using that life force to cure many hurts. Existence itself relies on the positive energy associated with this domain, so a Cleric of almost any religious tradition might choose it. This domain is particularly associated with agricultural deities, gods of healing or endurance, and gods of home and community. Religious orders of healing also seek the magic of this domain.",
    summary: "Soothe the Hurts of the World",
    features: createClericSubclassFeatures([
      "disciple-of-life",
      "life-domain-spells",
      "preserve-life",
      "blessed-healer",
      "supreme-healing",
    ]),
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
    features: createClericSubclassFeatures([
      "light-domain-spells",
      "warding-flare",
      "radiance-of-the-dawn",
      "improved-warding-flare",
      "corona-of-light",
    ]),
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
    features: createClericSubclassFeatures([
      "trickery-domain-spells",
      "blessing-of-the-trickster",
      "invoke-duplicity",
      "tricksters-transposition",
      "improved-duplicity",
    ]),
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
    features: createClericSubclassFeatures([
      "war-domain-spells",
      "guided-strike",
      "war-priest",
      "war-gods-blessing",
      "avatar-of-battle",
    ]),
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
      subclass: "subclass" in featureReference ? featureReference.subclass : undefined,
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
