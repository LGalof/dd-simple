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

const BARD_CANTRIP_OPTIONS = [
  ["blade-ward", "Blade Ward"],
  ["dancing-lights", "Dancing Lights"],
  ["friends", "Friends"],
  ["light", "Light"],
  ["mage-hand", "Mage Hand"],
  ["mending", "Mending"],
  ["message", "Message"],
  ["minor-illusion", "Minor Illusion"],
  ["prestidigitation", "Prestidigitation"],
  ["starry-wisp", "Starry Wisp"],
  ["thunderclap", "Thunderclap"],
  ["true-strike", "True Strike"],
  ["vicious-mockery", "Vicious Mockery"],
] as const;

const BARD_MAGICAL_DISCOVERIES_SPELL_OPTIONS = [
  ["acid-splash", "Acid Splash"],
  ["blade-ward", "Blade Ward"],
  ["chill-touch", "Chill Touch"],
  ["dancing-lights", "Dancing Lights"],
  ["druidcraft", "Druidcraft"],
  ["fire-bolt", "Fire Bolt"],
  ["guidance", "Guidance"],
  ["light", "Light"],
  ["mage-hand", "Mage Hand"],
  ["mending", "Mending"],
  ["message", "Message"],
  ["minor-illusion", "Minor Illusion"],
  ["poison-spray", "Poison Spray"],
  ["prestidigitation", "Prestidigitation"],
  ["produce-flame", "Produce Flame"],
  ["ray-of-frost", "Ray of Frost"],
  ["resistance", "Resistance"],
  ["sacred-flame", "Sacred Flame"],
  ["shocking-grasp", "Shocking Grasp"],
  ["spare-the-dying", "Spare the Dying"],
  ["thaumaturgy", "Thaumaturgy"],
  ["thorn-whip", "Thorn Whip"],
  ["true-strike", "True Strike"],
  ["animal-friendship", "Animal Friendship"],
  ["bless", "Bless"],
  ["burning-hands", "Burning Hands"],
  ["charm-person", "Charm Person"],
  ["command", "Command"],
  ["comprehend-languages", "Comprehend Languages"],
  ["cure-wounds", "Cure Wounds"],
  ["detect-magic", "Detect Magic"],
  ["disguise-self", "Disguise Self"],
  ["entangle", "Entangle"],
  ["faerie-fire", "Faerie Fire"],
  ["feather-fall", "Feather Fall"],
  ["find-familiar", "Find Familiar"],
  ["fog-cloud", "Fog Cloud"],
  ["goodberry", "Goodberry"],
  ["guiding-bolt", "Guiding Bolt"],
  ["healing-word", "Healing Word"],
  ["inflict-wounds", "Inflict Wounds"],
  ["jump", "Jump"],
  ["longstrider", "Longstrider"],
  ["mage-armor", "Mage Armor"],
  ["magic-missile", "Magic Missile"],
  ["shield", "Shield"],
  ["sleep", "Sleep"],
  ["speak-with-animals", "Speak with Animals"],
  ["thunderwave", "Thunderwave"],
  ["aid", "Aid"],
  ["arcane-lock", "Arcane Lock"],
  ["augury", "Augury"],
  ["blur", "Blur"],
  ["darkvision", "Darkvision"],
  ["detect-thoughts", "Detect Thoughts"],
  ["enhance-ability", "Enhance Ability"],
  ["flaming-sphere", "Flaming Sphere"],
  ["hold-person", "Hold Person"],
  ["invisibility", "Invisibility"],
  ["knock", "Knock"],
  ["lesser-restoration", "Lesser Restoration"],
  ["levitate", "Levitate"],
  ["mirror-image", "Mirror Image"],
  ["misty-step", "Misty Step"],
  ["moonbeam", "Moonbeam"],
  ["pass-without-trace", "Pass without Trace"],
  ["prayer-of-healing", "Prayer of Healing"],
  ["scorching-ray", "Scorching Ray"],
  ["see-invisibility", "See Invisibility"],
  ["shatter", "Shatter"],
  ["spike-growth", "Spike Growth"],
  ["spiritual-weapon", "Spiritual Weapon"],
  ["web", "Web"],
  ["call-lightning", "Call Lightning"],
  ["counterspell", "Counterspell"],
  ["daylight", "Daylight"],
  ["dispel-magic", "Dispel Magic"],
  ["fear", "Fear"],
  ["fireball", "Fireball"],
  ["fly", "Fly"],
  ["gaseous-form", "Gaseous Form"],
  ["haste", "Haste"],
  ["hypnotic-pattern", "Hypnotic Pattern"],
  ["lightning-bolt", "Lightning Bolt"],
  ["major-image", "Major Image"],
  ["mass-healing-word", "Mass Healing Word"],
  ["plant-growth", "Plant Growth"],
  ["revivify", "Revivify"],
  ["sending", "Sending"],
  ["sleet-storm", "Sleet Storm"],
  ["slow", "Slow"],
  ["speak-with-dead", "Speak with Dead"],
  ["spirit-guardians", "Spirit Guardians"],
  ["water-breathing", "Water Breathing"],
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

function createBardSpellChoiceFeature(
  index: string,
  level: number,
  name: string,
  description: string,
  choose: number,
  spellOptions: readonly (readonly [string, string])[],
  type: "bard cantrip",
) {
  return {
    index,
    level,
    name,
    desc: [description],
    feature_specific: {
      choose,
      type,
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
  { index: "bard-1", level: 1, features: ["bard-cantrips-1", "bard-spellcasting", "bardic-inspiration"] },
  { index: "bard-2", level: 2, features: ["bard-expertise-1", "jack-of-all-trades"] },
  {
    index: "bard-3",
    level: 3,
    features: [
      "bard-subclass-feature-3",
      "bard-subclass",
      "dazzling-footwork",
      "mantle-of-inspiration",
      "beguiling-magic",
      "college-of-lore-bonus-proficiencies",
      "cutting-words",
      "combat-inspiration",
      "martial-training",
    ],
  },
  { index: "bard-4", level: 4, features: ["bard-cantrips-2", "bard-ability-score-improvement-1"] },
  { index: "bard-5", level: 5, features: ["font-of-inspiration"] },
  {
    index: "bard-6",
    level: 6,
    features: [
      "bard-subclass-feature-6",
      "inspiring-movement",
      "tandem-footwork",
      "mantle-of-majesty",
      "magical-discoveries",
      "valor-extra-attack",
    ],
  },
  { index: "bard-7", level: 7, features: ["countercharm"] },
  { index: "bard-8", level: 8, features: ["bard-ability-score-improvement-2"] },
  { index: "bard-9", level: 9, features: ["bard-expertise-2"] },
  { index: "bard-10", level: 10, features: ["bard-cantrips-3", "magical-secrets"] },
  { index: "bard-12", level: 12, features: ["bard-ability-score-improvement-3"] },
  {
    index: "bard-14",
    level: 14,
    features: [
      "bard-subclass-feature-14",
      "leading-evasion",
      "unbreakable-majesty",
      "peerless-skill",
      "battle-magic",
    ],
  },
  { index: "bard-16", level: 16, features: ["bard-ability-score-improvement-4"] },
  { index: "bard-18", level: 18, features: ["superior-inspiration"] },
  { index: "bard-19", level: 19, features: ["bard-epic-boon"] },
  { index: "bard-20", level: 20, features: ["words-of-creation"] },
];

const BARD_FEATURE_REFERENCES = [
  createBardSpellChoiceFeature(
    "bard-cantrips-1",
    1,
    "Cantrips",
    "Choose two cantrips from the Bard spell list.",
    2,
    BARD_CANTRIP_OPTIONS,
    "bard cantrip",
  ),
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
      "You can supernaturally inspire others through words, music, or dance. This inspiration is represented by your Bardic Inspiration die, which is a d6.",
      "Using Bardic Inspiration. As a Bonus Action, you can inspire another creature within 60 feet of yourself who can see or hear you. That creature gains one of your Bardic Inspiration dice. A creature can have only one Bardic Inspiration die at a time.",
      "Once within the next hour when the creature fails a D20 Test, the creature can roll the Bardic Inspiration die and add the number rolled to the d20, potentially turning the failure into a success. A Bardic Inspiration die is expended when it's rolled.",
      "Number of Uses. You can confer a Bardic Inspiration die a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.",
      "At Higher Levels. Your Bardic Inspiration die changes when you reach certain Bard levels, as shown in the Bardic Die column of the Bard Features table. The die becomes a d8 at level 5, a d10 at level 10, and a d12 at level 15.",
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
      type: "expertise",
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
    index: "dazzling-footwork",
    level: 3,
    name: "Dazzling Footwork",
    desc: [
      "You have Advantage on any Charisma (Performance) check you make that involves you dancing. Your base Armor Class equals 10 plus your Dexterity and Charisma modifiers.",
      "When you expend a use of your Bardic Inspiration as part of an action, a Bonus Action, or a Reaction, you can make one Unarmed Strike as part of that action, Bonus Action, or Reaction.",
      "You can use Dexterity instead of Strength for the attack rolls of your Unarmed Strikes. When you deal damage with an Unarmed Strike, you can deal Bludgeoning damage equal to a roll of your Bardic Inspiration die plus your Dexterity modifier, instead of the strike's normal damage. This roll doesn't expend the die.",
    ],
    subclass: {
      index: "college-of-dance",
      name: "College of Dance",
      url: "/api/2024/subclasses/college-of-dance",
    },
  },
  {
    index: "inspiring-movement",
    level: 6,
    name: "Inspiring Movement",
    desc: [
      "When an enemy you can see ends its turn within 5 feet of you, you can take a Reaction and expend one use of your Bardic Inspiration to move up to half your Speed. Then one ally of your choice within 30 feet of you can also move up to half their Speed using their Reaction. None of this feature's movement provokes Opportunity Attacks.",
    ],
    subclass: {
      index: "college-of-dance",
      name: "College of Dance",
      url: "/api/2024/subclasses/college-of-dance",
    },
  },
  {
    index: "mantle-of-inspiration",
    level: 3,
    name: "Mantle of Inspiration",
    desc: [
      "You can weave fey magic into a song or dance to fill others with vigor. As a Bonus Action, you can expend a use of Bardic Inspiration, rolling a Bardic Inspiration die. When you do so, choose a number of other creatures within 60 feet of yourself, up to a number equal to your Charisma modifier (minimum of one creature). Each of those creatures gains a number of Temporary Hit Points equal to two times the number rolled on the Bardic Inspiration die, and then each can use its Reaction to move up to its Speed without provoking Opportunity Attacks.",
    ],
    subclass: {
      index: "college-of-glamour",
      name: "College of Glamour",
      url: "/api/2024/subclasses/college-of-glamour",
    },
  },
  {
    index: "beguiling-magic",
    level: 3,
    name: "Beguiling Magic",
    desc: [
      "You always have the Charm Person and Mirror Image spells prepared.",
      "In addition, immediately after you cast an Enchantment or Illusion spell using a spell slot, you can cause a creature you can see within 60 feet of yourself to make a Wisdom saving throw against your spell save DC. On a failed save, the target has the Charmed or Frightened condition (your choice) until the end of your next turn.",
      "Once you use this benefit, you can't use it again until you finish a Long Rest unless you expend a use of Bardic Inspiration to use it again.",
    ],
    subclass: {
      index: "college-of-glamour",
      name: "College of Glamour",
      url: "/api/2024/subclasses/college-of-glamour",
    },
  },
  createBardSpellChoiceFeature(
    "bard-cantrips-2",
    4,
    "Cantrip",
    "Choose one additional Bard cantrip.",
    1,
    BARD_CANTRIP_OPTIONS,
    "bard cantrip",
  ),
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
      "You now regain all your expended uses of Bardic Inspiration when you finish a Short or Long Rest.",
      "In addition, you can expend a spell slot (no action required) to regain one expended use of Bardic Inspiration.",
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
      "College of Lore grants Magical Discoveries and expands your prepared spells with magic from Cleric, Druid, or Wizard traditions.",
      "College of Valor deepens your battlefield support and martial presence.",
    ],
  },
  {
    index: "tandem-footwork",
    level: 6,
    name: "Tandem Footwork",
    desc: [
      "When you roll Initiative, you can expend one use of your Bardic Inspiration if you don't have the Incapacitated condition. When you do so, roll your Bardic Inspiration die; you and each ally within 30 feet of you who can see or hear you gains a bonus to Initiative equal to the number rolled.",
    ],
    subclass: {
      index: "college-of-dance",
      name: "College of Dance",
      url: "/api/2024/subclasses/college-of-dance",
    },
  },
  {
    index: "mantle-of-majesty",
    level: 6,
    name: "Mantle of Majesty",
    desc: [
      "You always have the Command spell prepared.",
      "As a Bonus Action, you cast Command without expending a spell slot, and you take on an unearthly appearance for 1 minute or until your Concentration ends. During this time, you can cast Command as a Bonus Action without expending a spell slot.",
      "Any creature Charmed by you automatically fails its saving throw against the Command you cast with this feature.",
      "Once you use this feature, you can't use it again until you finish a Long Rest.",
    ],
    subclass: {
      index: "college-of-glamour",
      name: "College of Glamour",
      url: "/api/2024/subclasses/college-of-glamour",
    },
  },
  {
    index: "magical-discoveries",
    level: 6,
    name: "Magical Discoveries",
    desc: [
      "You learn two spells of your choice. These spells can come from the Cleric, Druid, or Wizard spell list or any combination thereof. A spell you choose must be a cantrip or a spell for which you have spell slots, as shown in the Bard Features table.",
      "You always have the chosen spells prepared, and whenever you gain a Bard level, you can replace one of the spells with another spell that meets these requirements.",
    ],
    subclass: {
      index: "college-of-lore",
      name: "College of Lore",
      url: "/api/2024/subclasses/college-of-lore",
    },
    feature_specific: {
      choose: 2,
      type: "spell",
      label: "Choose 2 spells",
      field_label: "Spell",
      from: {
        option_set_type: "options_array",
        options: toSpellOptions(BARD_MAGICAL_DISCOVERIES_SPELL_OPTIONS),
      },
    },
  },
  {
    index: "valor-extra-attack",
    level: 6,
    name: "Extra Attack",
    desc: [
      "You can attack twice when you take the Attack action, strengthening the college's role as a battle-ready bard.",
    ],
    subclass: {
      index: "college-of-valor",
      name: "College of Valor",
      url: "/api/2024/subclasses/college-of-valor",
    },
  },
  {
    index: "countercharm",
    level: 7,
    name: "Countercharm",
    desc: [
      "You can use musical notes or words of power to disrupt mind-influencing effects. If you or a creature within 30 feet of you fails a saving throw against an effect that applies the Charmed or Frightened condition, you can take a Reaction to cause the save to be rerolled, and the new roll has Advantage.",
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
      type: "expertise",
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
  createBardSpellChoiceFeature(
    "bard-cantrips-3",
    10,
    "Cantrip",
    "Choose one additional Bard cantrip.",
    1,
    BARD_CANTRIP_OPTIONS,
    "bard cantrip",
  ),
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
    index: "leading-evasion",
    level: 14,
    name: "Leading Evasion",
    desc: [
      "When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail. If any creatures within 5 feet of you are making the same Dexterity saving throw, you can share this benefit with them for that save. You can't use this feature if you have the Incapacitated condition.",
    ],
    subclass: {
      index: "college-of-dance",
      name: "College of Dance",
      url: "/api/2024/subclasses/college-of-dance",
    },
  },
  {
    index: "unbreakable-majesty",
    level: 14,
    name: "Unbreakable Majesty",
    desc: [
      "As a Bonus Action, you can assume a magically majestic presence for 1 minute or until you have the Incapacitated condition. For the duration, whenever any creature hits you with an attack roll for the first time on a turn, the attacker must succeed on a Charisma saving throw against your spell save DC, or the attack misses instead, as the creature recoils from your majesty.",
      "Once you assume this majestic presence, you can't do so again until you finish a Short or Long Rest.",
    ],
    subclass: {
      index: "college-of-glamour",
      name: "College of Glamour",
      url: "/api/2024/subclasses/college-of-glamour",
    },
  },
  {
    index: "peerless-skill",
    level: 14,
    name: "Peerless Skill",
    desc: [
      "You can spend Bardic Inspiration on your own failed efforts, turning personal talent and broad mastery into clutch success.",
    ],
    subclass: {
      index: "college-of-lore",
      name: "College of Lore",
      url: "/api/2024/subclasses/college-of-lore",
    },
  },
  {
    index: "battle-magic",
    level: 14,
    name: "Battle Magic",
    desc: [
      "After you cast a spell that has a casting time of an action, you can make one attack with a weapon as a Bonus Action.",
    ],
    subclass: {
      index: "college-of-valor",
      name: "College of Valor",
      url: "/api/2024/subclasses/college-of-valor",
    },
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
      "When you roll Initiative, you regain expended uses of Bardic Inspiration until you have two if you have fewer than that.",
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
      "You have mastered two of the Words of Creation: the words of life and death. You therefore always have the Power Word Heal and Power Word Kill spells prepared. When you cast either spell, you can target a second creature with it if that creature is within 10 feet of the first target.",
    ],
  },
  {
    index: "college-of-lore-bonus-proficiencies",
    level: 3,
    name: "Bonus Proficiencies",
    desc: [
      "You gain proficiency with three skills of your choice.",
    ],
    subclass: {
      index: "college-of-lore",
      name: "College of Lore",
      url: "/api/2024/subclasses/college-of-lore",
    },
    feature_specific: {
      choose: 3,
      type: "proficiencies",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(BARD_SKILL_OPTIONS, "proficiencies"),
      },
    },
  },
  {
    index: "cutting-words",
    level: 3,
    name: "Cutting Words",
    desc: [
      "You learn to use your wit to supernaturally distract, confuse, and otherwise sap the confidence and competence of others. When a creature that you can see within 60 feet of yourself makes a damage roll or succeeds on an ability check or attack roll, you can take a Reaction to expend one use of your Bardic Inspiration; roll your Bardic Inspiration die, and subtract the number rolled from the creature's roll, reducing the damage or potentially turning the success into a failure.",
    ],
    subclass: {
      index: "college-of-lore",
      name: "College of Lore",
      url: "/api/2024/subclasses/college-of-lore",
    },
  },
  {
    index: "combat-inspiration",
    level: 3,
    name: "Combat Inspiration",
    desc: [
      "You can use your wit to turn the tide of battle. A creature that has a Bardic Inspiration die from you can use it for one of the following effects.",
      "Defense. When the creature is hit by an attack roll, that creature can use its Reaction to roll the Bardic Inspiration die and add the number rolled to its AC against that attack, potentially causing the attack to miss.",
      "Offense. Immediately after the creature hits a target with an attack roll, the creature can roll the Bardic Inspiration die and add the number rolled to the attack's damage against the target.",
    ],
    subclass: {
      index: "college-of-valor",
      name: "College of Valor",
      url: "/api/2024/subclasses/college-of-valor",
    },
  },
  {
    index: "martial-training",
    level: 3,
    name: "Martial Training",
    desc: [
      "You gain proficiency with Martial weapons and training with Medium armor and Shields.",
      "In addition, you can use a Simple or Martial weapon as a Spellcasting Focus to cast spells from your Bard spell list.",
    ],
    subclass: {
      index: "college-of-valor",
      name: "College of Valor",
      url: "/api/2024/subclasses/college-of-valor",
    },
  },
];

function createBardSubclassFeatureList(featureIndexes: string[]) {
  return featureIndexes.map((featureIndex) => {
    const feature = BARD_FEATURE_REFERENCES.find((entry) => entry.index === featureIndex);

    if (!feature) {
      throw new Error(`Missing Bard subclass feature reference: ${featureIndex}`);
    }

    return {
      name: feature.name,
      level: feature.level,
      description: feature.desc.join("\n\n"),
    };
  });
}

const BARD_SUBCLASS_REFERENCES = [
  {
    index: "college-of-dance",
    name: "College of Dance",
    subclass_flavor: "Dance",
    summary: "Turn Rhythm into Movement and Momentum",
    description:
      "Bards of the College of Dance turn rhythm, motion, and performance into a fluid magical fighting style.",
    features: createBardSubclassFeatureList([
      "dazzling-footwork",
      "inspiring-movement",
      "tandem-footwork",
      "leading-evasion",
    ]),
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
    summary: "Weave Beguiling Fey Magic",
    description:
      "The College of Glamour traces its origins to the beguiling magic of the Feywild. Bards who study this magic weave threads of beauty and terror into their songs and stories, and the mightiest among them can cloak themselves in otherworldly majesty. Their performances stir up wistful longing for forgotten innocence, evoke unconscious memories of long-held fears, and tug at the emotions of even the most hard-hearted listeners.",
    features: createBardSubclassFeatureList([
      "mantle-of-inspiration",
      "beguiling-magic",
      "mantle-of-majesty",
      "unbreakable-majesty",
    ]),
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
      "Bards of the College of Lore collect spells and secrets from diverse sources, such as scholarly tomes, mystical rites, and peasant tales. The college's members gather in libraries and universities to share their lore with one another. They also meet at festivals or affairs of state, where they can expose corruption, unravel lies, and poke fun at self-important figures of authority.",
    features: createBardSubclassFeatureList([
      "college-of-lore-bonus-proficiencies",
      "cutting-words",
      "magical-discoveries",
      "peerless-skill",
    ]),
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
    features: createBardSubclassFeatureList([
      "combat-inspiration",
      "martial-training",
      "valor-extra-attack",
      "battle-magic",
    ]),
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
      subclass: "subclass" in featureReference ? featureReference.subclass : undefined,
      url: `/api/2024/features/${featureReference.index}`,
    },
  }));
}

function createBardSubclassRuleDocuments() {
  return BARD_SUBCLASS_REFERENCES.map((subclassReference) => ({
    category: "subclasses",
    index: subclassReference.index,
    name: subclassReference.name,
    sourceJson: {
      ...subclassReference,
      features: subclassReference.features.map(({ description: _description, ...feature }) => feature),
    },
  }));
}

export {
  BARD_CLASS_REFERENCE,
  createBardClassRuleDocument,
  createBardFeatureRuleDocuments,
  createBardLevelRuleDocuments,
  createBardSubclassRuleDocuments,
};
