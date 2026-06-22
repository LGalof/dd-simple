import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  FeatureChoiceField,
  FeatureChoiceOption,
  SpeciesPreviewSection,
  SpeciesOption,
} from "../types/characterBuilder";
import { getFeatAbilityChoiceFieldConfigs } from "../utils/featAbilityChoiceFields";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toOptions(values: string[]): FeatureChoiceOption[] {
  return values.map((value) => ({
    value: slugify(value),
    label: value,
  }));
}

const coreFeatNames = [
  "Alert",
  "Archery",
  "Defense",
  "Grappler",
  "Great Weapon Fighting",
  "Magic Initiate",
  "Savage Attacker",
  "Skilled",
  "Two Weapon Fighting",
];

function createChoiceField(
  id: string,
  label: string,
  values: Array<string | FeatureChoiceOption>,
  metadata: Partial<
    Pick<
      FeatureChoiceField,
      | "choiceGroupId"
      | "choiceGroupLabel"
      | "choiceGroupLimit"
      | "choiceKind"
      | "dependsOnFieldId"
      | "dependsOnValues"
    >
  > = {},
): FeatureChoiceField {
  return {
    ...metadata,
    id,
    label,
    options: values.map((value) =>
      typeof value === "string"
        ? {
            value: slugify(value),
            label: value,
          }
        : value,
    ),
  };
}

function createSpeciesSection({
  id,
  title,
  subtitle,
  details,
  choiceFields = [],
}: {
  id: string;
  title: string;
  subtitle?: string;
  details: string[];
  choiceFields?: FeatureChoiceField[];
}): SpeciesPreviewSection {
  return {
    id,
    title,
    subtitle,
    details,
    choiceFields,
  };
}

function createFeature({
  id,
  level,
  title,
  summary,
  details = [],
  choiceFields = [],
}: {
  id: string;
  level: number;
  title: string;
  summary: string;
  details?: string[];
  choiceFields?: FeatureChoiceField[];
}): ClassFeature {
  return {
    id,
    level,
    title,
    summary,
    details,
    choiceFields,
  };
}

function createAbilityScoreImprovement(level: number): ClassFeature {
  const featOptions = toOptions(coreFeatNames);

  return createFeature({
    id: `ability-score-improvement-${level}`,
    level,
    title: "Ability Score Improvement",
    summary: "Choose either Ability Score Improvement or a feat, similar to the D&D Beyond flow.",
    details: [
      "Use this step to shape the next breakpoint in your build.",
      "Your live sheet preview updates immediately, and the final character data is applied when you save the build.",
    ],
    choiceFields: [
      createChoiceField(
        "asi-mode",
        "Ability Score Improvement",
        ["Ability Score Improvement", "Feat"],
        {
          choiceGroupId: "asi-mode",
          choiceGroupLabel: "Choose 1 option",
          choiceGroupLimit: 1,
        },
      ),
      createChoiceField("asi-score-1", "Ability Score 1", [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma",
      ], {
        choiceGroupId: "asi-score",
        choiceGroupLabel: "Choose 2 ability scores",
        choiceGroupLimit: 2,
        dependsOnFieldId: "asi-mode",
        dependsOnValues: ["ability-score-improvement"],
      }),
      createChoiceField("asi-score-2", "Ability Score 2", [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma",
      ], {
        choiceGroupId: "asi-score",
        choiceGroupLabel: "Choose 2 ability scores",
        choiceGroupLimit: 2,
        dependsOnFieldId: "asi-mode",
        dependsOnValues: ["ability-score-improvement"],
      }),
      createChoiceField("asi-feat", "Feat", coreFeatNames, {
        choiceGroupId: "asi-feat",
        choiceGroupLabel: "Choose 1 feat",
        choiceGroupLimit: 1,
        dependsOnFieldId: "asi-mode",
        dependsOnValues: ["feat"],
      }),
      ...getFeatAbilityChoiceFieldConfigs("asi-feat", featOptions).map((fieldConfig) =>
        createChoiceField(fieldConfig.id, fieldConfig.label, fieldConfig.options, {
          choiceKind: fieldConfig.choiceKind,
          choiceGroupId: fieldConfig.choiceGroupId,
          choiceGroupLabel: fieldConfig.choiceGroupLabel,
          choiceGroupLimit: fieldConfig.choiceGroupLimit,
          dependsOnFieldId: fieldConfig.dependsOnFieldId,
          dependsOnValues: fieldConfig.dependsOnValues,
        }),
      ),
    ],
  });
}

const rogueSkills = [
  "Acrobatics",
  "Athletics",
  "Deception",
  "Insight",
  "Intimidation",
  "Investigation",
  "Perception",
  "Performance",
  "Persuasion",
  "Sleight of Hand",
  "Stealth",
];

const bardSkills = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];

const fighterSkills = [
  "Acrobatics",
  "Animal Handling",
  "Athletics",
  "History",
  "Insight",
  "Intimidation",
  "Perception",
  "Survival",
];

const wizardSkills = [
  "Arcana",
  "History",
  "Insight",
  "Investigation",
  "Medicine",
  "Religion",
];

const instruments = ["Flute", "Lute", "Lyre", "Harp", "Drum", "Viol", "Pan Flute"];
const commonSkillsAndTools = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "Forgery Kit",
  "Gaming Set",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
  "Thieves' Tools",
];

const commonLanguages = [
  "Common",
  "Elvish",
  "Dwarvish",
  "Halfling",
  "Infernal",
  "Draconic",
  "Celestial",
  "Sylvan",
  "Gnomish",
  "Goblin",
];

const rogueFeatures: ClassFeature[] = [
  createFeature({
    id: "rogue-core-traits",
    level: 1,
    title: "Core Rogue Traits",
    summary: "As a level 1 rogue you lock in your early skill edge and criminal toolkit.",
    details: [
      "Choose the proficiencies and expertise picks that define how this rogue solves problems.",
      "These selections are shown in preview mode now and will later feed directly into the live character sheet.",
    ],
    choiceFields: [
      createChoiceField("expertise-1", "Expertise 1", rogueSkills),
      createChoiceField("expertise-2", "Expertise 2", rogueSkills),
      createChoiceField("skill-1", "Skill Proficiency 1", rogueSkills),
      createChoiceField("skill-2", "Skill Proficiency 2", rogueSkills),
      createChoiceField("tool", "Tool Proficiency", [
        "Thieves' Tools",
        "Disguise Kit",
        "Forgery Kit",
        "Poisoner's Kit",
      ]),
    ],
  }),
  createFeature({
    id: "rogue-sneak-attack",
    level: 1,
    title: "Sneak Attack",
    summary: "Deal extra damage once per turn when you attack with precision or exploit a distracted target.",
    details: [
      "This feature defines the rogue's combat identity and will later be surfaced directly in the Actions tab.",
    ],
  }),
  createFeature({
    id: "rogue-thieves-cant",
    level: 1,
    title: "Thieves' Cant",
    summary: "You learn the secret mix of slang, signs, and coded phrases shared by rogues.",
  }),
  createFeature({
    id: "rogue-cunning-action",
    level: 2,
    title: "Cunning Action",
    summary: "Gain Dash, Disengage, or Hide as a bonus action to keep your turns fluid and evasive.",
  }),
  createFeature({
    id: "rogue-roguish-archetype",
    level: 3,
    title: "Roguish Archetype",
    summary: "Choose the rogue path that shapes your long-term playstyle.",
    details: [
      "Your archetype opens a different branch of future class features.",
    ],
    choiceFields: [
      createChoiceField("archetype", "Subclass", [
        "Thief",
        "Assassin",
        "Arcane Trickster",
        "Swashbuckler",
      ]),
    ],
  }),
  createAbilityScoreImprovement(4),
  createFeature({
    id: "rogue-uncanny-dodge",
    level: 5,
    title: "Uncanny Dodge",
    summary: "Use your reaction to halve the damage from an attacker you can see.",
  }),
  createFeature({
    id: "rogue-expertise-2",
    level: 6,
    title: "Expertise",
    summary: "Choose two additional proficiencies to elevate into signature strengths.",
    choiceFields: [
      createChoiceField("expertise-3", "Expertise 3", rogueSkills),
      createChoiceField("expertise-4", "Expertise 4", rogueSkills),
    ],
  }),
  createFeature({
    id: "rogue-evasion",
    level: 7,
    title: "Evasion",
    summary: "When you make a Dexterity saving throw against area effects, you slip through the danger.",
  }),
  createAbilityScoreImprovement(8),
  createFeature({
    id: "rogue-supreme-sneak",
    level: 9,
    title: "Supreme Sneak",
    summary: "Your stealth game evolves, letting you set up infiltration and ambushes more confidently.",
  }),
  createAbilityScoreImprovement(10),
  createFeature({
    id: "rogue-reliable-talent",
    level: 11,
    title: "Reliable Talent",
    summary: "Your practiced proficiencies become dependable even under pressure.",
  }),
  createAbilityScoreImprovement(12),
  createFeature({
    id: "rogue-subclass-feature-13",
    level: 13,
    title: "Subclass Feature",
    summary: "Your archetype grants a defining midgame feature at this level.",
  }),
  createFeature({
    id: "rogue-blindsense",
    level: 14,
    title: "Blindsense",
    summary: "You notice hidden threats nearby even when direct sight fails you.",
  }),
  createFeature({
    id: "rogue-slippery-mind",
    level: 15,
    title: "Slippery Mind",
    summary: "Your mental defenses sharpen, making it harder for enemies to control you.",
  }),
  createAbilityScoreImprovement(16),
  createFeature({
    id: "rogue-subclass-feature-17",
    level: 17,
    title: "Subclass Feature",
    summary: "Your archetype capstone approaches with a major playstyle payoff.",
  }),
  createFeature({
    id: "rogue-elusive",
    level: 18,
    title: "Elusive",
    summary: "Enemies struggle to pin you down when you stay mobile and aware.",
  }),
  createAbilityScoreImprovement(19),
  createFeature({
    id: "rogue-stroke-of-luck",
    level: 20,
    title: "Stroke of Luck",
    summary: "You can turn a crucial miss or failed check into a dramatic success.",
  }),
];

const fighterFeatures: ClassFeature[] = [
  createFeature({
    id: "fighter-core-traits",
    level: 1,
    title: "Core Fighter Traits",
    summary: "Pick the combat style and proficiencies that shape your front-line identity.",
    choiceFields: [
      createChoiceField("fighting-style", "Fighting Style", [
        "Archery",
        "Defense",
        "Dueling",
        "Great Weapon Fighting",
        "Protection",
        "Two-Weapon Fighting",
      ]),
      createChoiceField("skill-1", "Skill Proficiency 1", fighterSkills),
      createChoiceField("skill-2", "Skill Proficiency 2", fighterSkills),
    ],
  }),
  createFeature({
    id: "fighter-second-wind",
    level: 1,
    title: "Second Wind",
    summary: "Recover a burst of hit points in the middle of a fight.",
  }),
  createFeature({
    id: "fighter-action-surge",
    level: 2,
    title: "Action Surge",
    summary: "Explode into a key turn by taking one additional action.",
  }),
  createFeature({
    id: "fighter-martial-archetype",
    level: 3,
    title: "Martial Archetype",
    summary: "Choose the subclass that drives your signature combat engine.",
    choiceFields: [
      createChoiceField("archetype", "Subclass", [
        "Champion",
        "Battle Master",
        "Eldritch Knight",
        "Samurai",
      ]),
    ],
  }),
  createAbilityScoreImprovement(4),
  createFeature({
    id: "fighter-extra-attack",
    level: 5,
    title: "Extra Attack",
    summary: "Make two attacks when you take the Attack action.",
  }),
  createAbilityScoreImprovement(6),
  createFeature({
    id: "fighter-subclass-feature-7",
    level: 7,
    title: "Subclass Feature",
    summary: "Your archetype unlocks a new tactical edge.",
  }),
  createAbilityScoreImprovement(8),
  createFeature({
    id: "fighter-indomitable",
    level: 9,
    title: "Indomitable",
    summary: "Push through a failed saving throw when the fight cannot be lost.",
  }),
  createFeature({
    id: "fighter-subclass-feature-10",
    level: 10,
    title: "Subclass Feature",
    summary: "Your archetype deepens with a stronger combat identity.",
  }),
  createFeature({
    id: "fighter-extra-attack-2",
    level: 11,
    title: "Extra Attack (2)",
    summary: "Your Attack action now includes three attacks.",
  }),
  createAbilityScoreImprovement(12),
  createFeature({
    id: "fighter-indomitable-2",
    level: 13,
    title: "Indomitable (2)",
    summary: "You can shrug off critical failed saves more than once between rests.",
  }),
  createAbilityScoreImprovement(14),
  createFeature({
    id: "fighter-subclass-feature-15",
    level: 15,
    title: "Subclass Feature",
    summary: "Your archetype enters its late-game power band.",
  }),
  createAbilityScoreImprovement(16),
  createFeature({
    id: "fighter-action-surge-2",
    level: 17,
    title: "Action Surge (2) and Indomitable (3)",
    summary: "Your decisive turns become even more explosive and resilient.",
  }),
  createFeature({
    id: "fighter-subclass-feature-18",
    level: 18,
    title: "Subclass Feature",
    summary: "A high-level archetype feature adds a defining twist to your build.",
  }),
  createAbilityScoreImprovement(19),
  createFeature({
    id: "fighter-extra-attack-3",
    level: 20,
    title: "Extra Attack (3)",
    summary: "You now make four attacks with the Attack action.",
  }),
];

const wizardFeatures: ClassFeature[] = [
  createFeature({
    id: "wizard-spellcasting",
    level: 1,
    title: "Spellcasting",
    summary: "Begin your spellbook with cantrips and essential prepared spells.",
    details: [
      "In a later iteration this block will drive spell preparation and slot tracking.",
    ],
    choiceFields: [
      createChoiceField("cantrip-1", "Cantrip 1", [
        "Mage Hand",
        "Fire Bolt",
        "Ray of Frost",
        "Prestidigitation",
        "Minor Illusion",
        "Light",
      ]),
      createChoiceField("cantrip-2", "Cantrip 2", [
        "Mage Hand",
        "Fire Bolt",
        "Ray of Frost",
        "Prestidigitation",
        "Minor Illusion",
        "Light",
      ]),
      createChoiceField("cantrip-3", "Cantrip 3", [
        "Mage Hand",
        "Fire Bolt",
        "Ray of Frost",
        "Prestidigitation",
        "Minor Illusion",
        "Light",
      ]),
    ],
  }),
  createFeature({
    id: "wizard-arcane-recovery",
    level: 1,
    title: "Arcane Recovery",
    summary: "Recover a portion of your spellcasting fuel during a short rest.",
  }),
  createFeature({
    id: "wizard-arcane-tradition",
    level: 2,
    title: "Arcane Tradition",
    summary: "Choose the school that defines your wizardly specialty.",
    choiceFields: [
      createChoiceField("tradition", "Arcane School", [
        "Abjuration",
        "Conjuration",
        "Divination",
        "Enchantment",
        "Evocation",
        "Illusion",
        "Necromancy",
        "Transmutation",
      ]),
    ],
  }),
  createFeature({
    id: "wizard-level-3",
    level: 3,
    title: "Spellbook Expansion",
    summary: "Add more utility and combat flexibility to your prepared options.",
  }),
  createAbilityScoreImprovement(4),
  createFeature({
    id: "wizard-level-5",
    level: 5,
    title: "Arcane Focus Mastery",
    summary: "Your spellcasting rhythm becomes more reliable and controlled.",
  }),
  createFeature({
    id: "wizard-level-6",
    level: 6,
    title: "Tradition Feature",
    summary: "Your chosen school grants a signature tool at this level.",
  }),
  createFeature({
    id: "wizard-level-7",
    level: 7,
    title: "Spellcraft Expansion",
    summary: "Your repertoire grows with stronger arcane options.",
  }),
  createAbilityScoreImprovement(8),
  createFeature({
    id: "wizard-level-9",
    level: 9,
    title: "Tradition Feature",
    summary: "Your school specialization deepens with a stronger arcane identity.",
  }),
  createFeature({
    id: "wizard-level-10",
    level: 10,
    title: "Cantrip Improvement",
    summary: "Your signature magical fundamentals scale into reliable tools.",
  }),
  createFeature({
    id: "wizard-level-11",
    level: 11,
    title: "Spell Mastery Prep",
    summary: "You begin shaping the spells that define your high-level routine.",
  }),
  createAbilityScoreImprovement(12),
  createFeature({
    id: "wizard-level-13",
    level: 13,
    title: "Tradition Feature",
    summary: "Your school grants another powerful feature in the late midgame.",
  }),
  createFeature({
    id: "wizard-level-14",
    level: 14,
    title: "Arcane Research",
    summary: "Downtime study and spell refinement become core to your power curve.",
  }),
  createFeature({
    id: "wizard-level-15",
    level: 15,
    title: "Signature Practice",
    summary: "You settle into a repeatable pattern of your strongest battlefield magic.",
  }),
  createAbilityScoreImprovement(16),
  createFeature({
    id: "wizard-level-17",
    level: 17,
    title: "Tradition Feature",
    summary: "A defining subclass feature arrives as you enter top-tier magic.",
  }),
  createFeature({
    id: "wizard-level-18",
    level: 18,
    title: "Spell Mastery",
    summary: "Your command of select spells becomes almost effortless.",
  }),
  createAbilityScoreImprovement(19),
  createFeature({
    id: "wizard-level-20",
    level: 20,
    title: "Signature Spells",
    summary: "Choose the spells that represent your arcane identity at the highest tier.",
  }),
];

const bardFeatures: ClassFeature[] = [
  createFeature({
    id: "bard-core-traits",
    level: 1,
    title: "Core Bard Traits",
    summary: "Lock in instruments and skills that define your bard's performance style.",
    choiceFields: [
      createChoiceField("instrument-1", "Instrument 1", instruments),
      createChoiceField("instrument-2", "Instrument 2", instruments),
      createChoiceField("instrument-3", "Instrument 3", instruments),
      createChoiceField("skill-1", "Skill Proficiency 1", bardSkills),
      createChoiceField("skill-2", "Skill Proficiency 2", bardSkills),
      createChoiceField("skill-3", "Skill Proficiency 3", bardSkills),
    ],
  }),
  createFeature({
    id: "bard-spellcasting",
    level: 1,
    title: "Spellcasting",
    summary: "You learn to cast spells through music, rhythm, and performance.",
    details: [
      "Choose the cantrips and opening spell picks that shape your first adventures.",
    ],
    choiceFields: [
      createChoiceField("cantrip-1", "Cantrip 1", [
        "Mage Hand",
        "Minor Illusion",
        "Prestidigitation",
        "Vicious Mockery",
      ]),
      createChoiceField("cantrip-2", "Cantrip 2", [
        "Mage Hand",
        "Minor Illusion",
        "Prestidigitation",
        "Vicious Mockery",
      ]),
    ],
  }),
  createFeature({
    id: "bard-bardic-inspiration",
    level: 1,
    title: "Bardic Inspiration",
    summary: "You can inspire allies and shift the flow of a scene with a single flourish.",
  }),
  createFeature({
    id: "bard-jack-of-all-trades",
    level: 2,
    title: "Jack of All Trades and Song of Rest",
    summary: "You become more versatile between encounters and more helpful during recovery.",
  }),
  createFeature({
    id: "bard-college",
    level: 3,
    title: "Bard College",
    summary: "Choose the performance tradition that defines your bardic identity.",
    choiceFields: [
      createChoiceField("college", "College", [
        "College of Lore",
        "College of Valor",
        "College of Glamour",
        "College of Swords",
      ]),
    ],
  }),
  createFeature({
    id: "bard-expertise",
    level: 3,
    title: "Expertise",
    summary: "Choose two proficiencies to become your standout specialties.",
    choiceFields: [
      createChoiceField("expertise-1", "Expertise 1", bardSkills),
      createChoiceField("expertise-2", "Expertise 2", bardSkills),
    ],
  }),
  createAbilityScoreImprovement(4),
  createFeature({
    id: "bard-font-of-inspiration",
    level: 5,
    title: "Font of Inspiration",
    summary: "Your inspiration comes back faster, enabling more active support play.",
  }),
  createFeature({
    id: "bard-level-6",
    level: 6,
    title: "Countercharm and College Feature",
    summary: "You support the party both defensively and through your chosen college path.",
  }),
  createFeature({
    id: "bard-level-7",
    level: 7,
    title: "Spellcraft Expansion",
    summary: "Your repertoire keeps growing with new magical answers.",
  }),
  createAbilityScoreImprovement(8),
  createFeature({
    id: "bard-level-9",
    level: 9,
    title: "Song of Rest Improvement",
    summary: "Your party recovers better between encounters under your care.",
  }),
  createFeature({
    id: "bard-level-10",
    level: 10,
    title: "Magical Secrets",
    summary: "Choose signature spells from beyond the bard list.",
  }),
  createFeature({
    id: "bard-level-11",
    level: 11,
    title: "College Feature",
    summary: "Your subclass delivers another defining feature.",
  }),
  createAbilityScoreImprovement(12),
  createFeature({
    id: "bard-level-13",
    level: 13,
    title: "Song of Rest Improvement",
    summary: "Your restorative support continues scaling with the campaign.",
  }),
  createFeature({
    id: "bard-level-14",
    level: 14,
    title: "Magical Secrets",
    summary: "Reach for broader spell options and customize your support package.",
  }),
  createFeature({
    id: "bard-level-15",
    level: 15,
    title: "College Feature",
    summary: "Your chosen college grants another meaningful late-game reward.",
  }),
  createAbilityScoreImprovement(16),
  createFeature({
    id: "bard-level-17",
    level: 17,
    title: "Song of Rest Improvement",
    summary: "Your recovery rhythm peaks in the high-level game.",
  }),
  createFeature({
    id: "bard-level-18",
    level: 18,
    title: "Magical Secrets",
    summary: "Add one more layer of cross-list magical identity.",
  }),
  createAbilityScoreImprovement(19),
  createFeature({
    id: "bard-level-20",
    level: 20,
    title: "Superior Inspiration",
    summary: "Your inspiration engine never stays empty for long.",
  }),
];

const speciesOptions: SpeciesOption[] = [
  {
    index: "human",
    name: "Human",
    description: "Adaptable adventurers with flexible talents and balanced attributes.",
    speed: 30,
    traits: ["Versatile", "Ambitious", "Bonus skill-ready"],
    creatureType: "Humanoid",
    size: "Medium",
    languages: ["Common", "One extra language of your choice"],
    previewSections: [
      createSpeciesSection({
        id: "human-creature-type",
        title: "Creature Type",
        details: ["You are a Humanoid."],
      }),
      createSpeciesSection({
        id: "human-languages",
        title: "Languages",
        subtitle: "1 Choice - Origin",
        details: [
          "Your character can speak, read, and write Common and one extra language that fits their upbringing.",
        ],
        choiceFields: [createChoiceField("language", "Bonus Language", commonLanguages)],
      }),
      createSpeciesSection({
        id: "human-size",
        title: "Size",
        details: ["You are Medium."],
      }),
      createSpeciesSection({
        id: "human-speed",
        title: "Speed",
        details: ["Your walking speed is 30 feet."],
      }),
      createSpeciesSection({
        id: "human-versatile",
        title: "Versatile Heritage",
        details: [
          "Humans thrive in almost any environment and can grow into many kinds of adventurers.",
        ],
      }),
    ],
  },
  {
    index: "elf",
    name: "Elf",
    description: "Graceful, perceptive, and naturally attuned to keen senses.",
    speed: 30,
    traits: ["Darkvision", "Keen Senses", "Fey Ancestry"],
    creatureType: "Humanoid",
    size: "Medium",
    languages: ["Common", "Elvish"],
    previewSections: [
      createSpeciesSection({
        id: "elf-languages",
        title: "Languages",
        subtitle: "Origin",
        details: ["Your character can speak, read, and write Common and Elvish."],
      }),
      createSpeciesSection({
        id: "elf-creature-type",
        title: "Creature Type",
        details: ["You are a Humanoid."],
      }),
      createSpeciesSection({
        id: "elf-size",
        title: "Size",
        details: ["You are Medium."],
      }),
      createSpeciesSection({
        id: "elf-speed",
        title: "Speed",
        details: ["Your walking speed is 30 feet."],
      }),
      createSpeciesSection({
        id: "elf-fey-ancestry",
        title: "Fey Ancestry",
        details: [
          "You have advantage on saving throws you make to avoid or end the Charmed condition on yourself.",
        ],
      }),
      createSpeciesSection({
        id: "elf-darkvision",
        title: "Darkvision",
        details: ["You have Darkvision with a range of 60 feet."],
      }),
    ],
  },
  {
    index: "dwarf",
    name: "Dwarf",
    description: "Durable explorers known for resilience and stonewise intuition.",
    speed: 25,
    traits: ["Darkvision", "Dwarven Resilience", "Tool Proficiency"],
    creatureType: "Humanoid",
    size: "Medium",
    languages: ["Common", "Dwarvish"],
    previewSections: [
      createSpeciesSection({
        id: "dwarf-languages",
        title: "Languages",
        subtitle: "Origin",
        details: ["Your character can speak, read, and write Common and Dwarvish."],
      }),
      createSpeciesSection({
        id: "dwarf-tool-training",
        title: "Tool Training",
        subtitle: "1 Choice",
        details: [
          "Many dwarves grow up around a traditional craft and bring that training into their adventures.",
        ],
        choiceFields: [
          createChoiceField("tool-training", "Tool Training", [
            "Smith's Tools",
            "Brewer's Supplies",
            "Mason's Tools",
          ]),
        ],
      }),
      createSpeciesSection({
        id: "dwarf-creature-type",
        title: "Creature Type",
        details: ["You are a Humanoid."],
      }),
      createSpeciesSection({
        id: "dwarf-size",
        title: "Size",
        details: ["You are Medium."],
      }),
      createSpeciesSection({
        id: "dwarf-speed",
        title: "Speed",
        details: ["Your walking speed is 25 feet."],
      }),
      createSpeciesSection({
        id: "dwarf-resilience",
        title: "Dwarven Resilience",
        details: ["You have resistance to Poison damage and advantage on saves against Poison."],
      }),
    ],
  },
  {
    index: "halfling",
    name: "Halfling",
    description: "Lucky wanderers who rely on agility and steady courage.",
    speed: 25,
    traits: ["Lucky", "Brave", "Halfling Nimbleness"],
    creatureType: "Humanoid",
    size: "Small",
    languages: ["Common", "Halfling"],
    previewSections: [
      createSpeciesSection({
        id: "halfling-languages",
        title: "Languages",
        subtitle: "Origin",
        details: ["Your character can speak, read, and write Common and Halfling."],
      }),
      createSpeciesSection({
        id: "halfling-creature-type",
        title: "Creature Type",
        details: ["You are a Humanoid."],
      }),
      createSpeciesSection({
        id: "halfling-size",
        title: "Size",
        details: ["You are Small."],
      }),
      createSpeciesSection({
        id: "halfling-speed",
        title: "Speed",
        details: ["Your walking speed is 25 feet."],
      }),
      createSpeciesSection({
        id: "halfling-lucky",
        title: "Lucky",
        details: ["When you roll a 1 on the d20 of a D20 Test, you can reroll the die."],
      }),
      createSpeciesSection({
        id: "halfling-brave",
        title: "Brave",
        details: ["You have advantage on saving throws you make to avoid or end the Frightened condition."],
      }),
    ],
  },
  {
    index: "tiefling",
    name: "Tiefling",
    description: "Infernal-blooded travelers with arcane potential and darkvision.",
    speed: 30,
    traits: ["Darkvision", "Hellish Resistance", "Thaumaturgy"],
    creatureType: "Humanoid",
    size: "Medium",
    languages: ["Common", "Infernal"],
    previewSections: [
      createSpeciesSection({
        id: "tiefling-languages",
        title: "Languages",
        subtitle: "Origin",
        details: ["Your character can speak, read, and write Common and Infernal."],
      }),
      createSpeciesSection({
        id: "tiefling-creature-type",
        title: "Creature Type",
        details: ["You are a Humanoid."],
      }),
      createSpeciesSection({
        id: "tiefling-size",
        title: "Size",
        details: ["You are Medium."],
      }),
      createSpeciesSection({
        id: "tiefling-speed",
        title: "Speed",
        details: ["Your walking speed is 30 feet."],
      }),
      createSpeciesSection({
        id: "tiefling-darkvision",
        title: "Darkvision",
        details: ["You have Darkvision with a range of 60 feet."],
      }),
      createSpeciesSection({
        id: "tiefling-hellish-resistance",
        title: "Hellish Resistance",
        details: ["You have resistance to Fire damage."],
      }),
      createSpeciesSection({
        id: "tiefling-thaumaturgy",
        title: "Thaumaturgy",
        subtitle: "1 Choice",
        details: [
          "You know the thaumaturgy cantrip through your infernal legacy.",
          "Choose the spellcasting ability that powers this trait for your character.",
        ],
        choiceFields: [
          createChoiceField("legacy-ability", "Spellcasting Ability", [
            "Intelligence",
            "Wisdom",
            "Charisma",
          ]),
        ],
      }),
    ],
  },
];

const backgroundOptions: BackgroundOption[] = [
  {
    index: "criminal",
    name: "Criminal",
    description:
      "You learned how to read a room fast, disappear when needed, and lean on the right contact when plans go sideways.",
    proficiencies: ["Stealth", "Deception", "Thieves' Tools"],
    feature: "Criminal Contact",
    skillProficiencies: ["Deception", "Stealth"],
    toolProficiencies: ["Thieves' Tools"],
    previewSections: [
      {
        id: "criminal-origin-feat",
        title: "Alert",
        subtitle: "Granted Feat • 1 Choice",
        details: [
          "Your criminal instincts keep you ready when trouble starts.",
          "Choose the specialization that best reflects how this background taught you to stay ahead of danger.",
        ],
        choiceFields: [
          createChoiceField("alert-focus", "Alert Focus", [
            "Ambush Scout",
            "Lookout",
            "Escape Planner",
          ]),
        ],
      },
      {
        id: "criminal-ability-scores",
        title: "Ability Scores",
        subtitle: "3 Choices",
        details: [
          "The Criminal background supports Dexterity, Constitution, and Charisma.",
          "Increase one of these scores by 2 and another by 1, or increase all three by 1.",
        ],
        choiceFields: [
          createChoiceField("score-plan", "Increase Plan", [
            "Increase two scores (+2 / +1)",
            "Increase all three by 1",
          ]),
          createChoiceField("score-a", "Primary Increase", [
            "Dexterity Score",
            "Constitution Score",
            "Charisma Score",
          ]),
          createChoiceField("score-b", "Secondary Increase", [
            "Dexterity Score",
            "Constitution Score",
            "Charisma Score",
          ]),
        ],
      },
    ],
  },
  {
    index: "soldier",
    name: "Soldier",
    description: "Military training, discipline, and experience with battlefield structure.",
    proficiencies: ["Athletics", "Intimidation", "Gaming Set"],
    feature: "Military Rank",
    skillProficiencies: ["Athletics", "Intimidation"],
    toolProficiencies: ["Gaming Set"],
    previewSections: [
      {
        id: "soldier-origin-feat",
        title: "Tough",
        subtitle: "Granted Feat • 1 Choice",
        details: [
          "Your training hardened you for long marches, close calls, and relentless pressure.",
        ],
        choiceFields: [
          createChoiceField("combat-focus", "Combat Focus", [
            "Frontline",
            "Recon",
            "Shield Wall",
          ]),
        ],
      },
      {
        id: "soldier-ability-scores",
        title: "Ability Scores",
        subtitle: "3 Choices",
        details: [
          "The Soldier background supports Strength, Constitution, and Wisdom.",
          "Choose the spread that matches your battlefield role.",
        ],
        choiceFields: [
          createChoiceField("score-plan", "Increase Plan", [
            "Increase two scores (+2 / +1)",
            "Increase all three by 1",
          ]),
          createChoiceField("score-a", "Primary Increase", [
            "Strength Score",
            "Constitution Score",
            "Wisdom Score",
          ]),
          createChoiceField("score-b", "Secondary Increase", [
            "Strength Score",
            "Constitution Score",
            "Wisdom Score",
          ]),
        ],
      },
    ],
  },
  {
    index: "sage",
    name: "Sage",
    description: "Academic research and knowledge-driven problem solving.",
    proficiencies: ["Arcana", "History", "Research Supplies"],
    feature: "Researcher",
    skillProficiencies: ["Arcana", "History"],
    toolProficiencies: ["Calligrapher's Supplies"],
    previewSections: [
      {
        id: "sage-origin-feat",
        title: "Skilled",
        subtitle: "Granted Feat • 3 Choices",
        details: [
          "Long study made you adaptable across libraries, archives, and debate halls.",
        ],
        choiceFields: [
          createChoiceField("skill-1", "Choice 1", commonSkillsAndTools),
          createChoiceField("skill-2", "Choice 2", commonSkillsAndTools),
          createChoiceField("skill-3", "Choice 3", commonSkillsAndTools),
        ],
      },
      {
        id: "sage-ability-scores",
        title: "Ability Scores",
        subtitle: "3 Choices",
        details: [
          "The Sage background supports Intelligence, Constitution, and Wisdom.",
          "Shape your academic strengths to match your role in the party.",
        ],
        choiceFields: [
          createChoiceField("score-plan", "Increase Plan", [
            "Increase two scores (+2 / +1)",
            "Increase all three by 1",
          ]),
          createChoiceField("score-a", "Primary Increase", [
            "Intelligence Score",
            "Constitution Score",
            "Wisdom Score",
          ]),
          createChoiceField("score-b", "Secondary Increase", [
            "Intelligence Score",
            "Constitution Score",
            "Wisdom Score",
          ]),
        ],
      },
    ],
  },
  {
    index: "acolyte",
    name: "Acolyte",
    description: "Religious service with strong spiritual networks and ritual familiarity.",
    proficiencies: ["Insight", "Religion", "Holy Symbol"],
    feature: "Shelter of the Faithful",
    skillProficiencies: ["Insight", "Religion"],
    toolProficiencies: ["Calligrapher's Supplies"],
    previewSections: [
      {
        id: "acolyte-origin-feat",
        title: "Magic Initiate",
        subtitle: "Granted Feat • 2 Choices",
        details: [
          "Your service introduced you to sacred rites and the first steps of formal spellcasting.",
        ],
        choiceFields: [
          createChoiceField("initiate-list", "Spell List", [
            "Cleric",
            "Druid",
            "Wizard",
          ]),
          createChoiceField("initiate-focus", "Sacred Focus", [
            "Healing",
            "Protection",
            "Guidance",
          ]),
        ],
      },
      {
        id: "acolyte-ability-scores",
        title: "Ability Scores",
        subtitle: "3 Choices",
        details: [
          "The Acolyte background supports Wisdom, Intelligence, and Charisma.",
          "Choose the spread that fits your spiritual training.",
        ],
        choiceFields: [
          createChoiceField("score-plan", "Increase Plan", [
            "Increase two scores (+2 / +1)",
            "Increase all three by 1",
          ]),
          createChoiceField("score-a", "Primary Increase", [
            "Wisdom Score",
            "Intelligence Score",
            "Charisma Score",
          ]),
          createChoiceField("score-b", "Secondary Increase", [
            "Wisdom Score",
            "Intelligence Score",
            "Charisma Score",
          ]),
        ],
      },
    ],
  },
];

const classOptions: ClassOption[] = [
  {
    index: "rogue",
    name: "Rogue",
    description: "Precision, stealth, and tactical positioning define the rogue.",
    hitDie: 8,
    primaryAbility: "DEX",
    previewOverview: [
      { label: "Primary Ability", value: "Dexterity" },
      { label: "Hit Point Die", value: "D8 per Rogue level" },
      { label: "Saving Throw Proficiencies", value: "Dexterity and Intelligence" },
      {
        label: "Skill Proficiencies",
        value:
          "Choose 4: Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Persuasion, Sleight of Hand, or Stealth",
      },
      {
        label: "Weapon Proficiencies",
        value: "Simple weapons and Martial weapons that have the Finesse or Light property",
      },
      { label: "Tool Proficiencies", value: "Thieves' Tools" },
      { label: "Armor Training", value: "Light armor" },
      {
        label: "Starting Equipment",
        value:
          "Choose A or B:\n(A) Leather Armor, 2 Daggers, Shortsword, Shortbow, 20 Arrows, Quiver, Thieves' Tools, Burglar's Pack, and 8 GP\n(B) 100 GP",
      },
    ],
    savingThrows: ["DEX", "INT"],
    skillChoices: {
      choose: 4,
      options: rogueSkills,
    },
    proficiencies: {
      armor: ["Light Armor"],
      weapons: [
        "Simple Weapons",
        "Hand Crossbows",
        "Longswords",
        "Rapiers",
        "Shortswords",
      ],
      tools: ["Thieves' Tools"],
    },
    startingEquipment: [
      "Leather Armor",
      "Two Daggers",
      "Thieves' Tools",
      "Choose a finesse weapon package or a ranged weapon package",
      "Choose a burglar's pack, dungeoneer's pack, or explorer's pack",
    ],
    features: rogueFeatures,
  },
  {
    index: "fighter",
    name: "Fighter",
    description: "Martial specialists with strong defenses and reliable combat output.",
    hitDie: 10,
    primaryAbility: "STR / DEX",
    previewOverview: [
      { label: "Primary Ability", value: "Strength or Dexterity" },
      { label: "Hit Point Die", value: "D10 per Fighter level" },
      { label: "Saving Throw Proficiencies", value: "Strength and Constitution" },
      {
        label: "Skill Proficiencies",
        value:
          "Choose 2: Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, or Survival",
      },
      { label: "Weapon Proficiencies", value: "Simple Weapons and Martial Weapons" },
      { label: "Tool Proficiencies", value: "None" },
      { label: "Armor Training", value: "All armor and Shields" },
      {
        label: "Starting Equipment",
        value:
          "Choose A or B:\n(A) Chain Mail, a Martial weapon and Shield or two Martial weapons, Light Crossbow with bolts or Handaxes, and a Dungeoneer's Pack or Explorer's Pack\n(B) 155 GP",
      },
    ],
    savingThrows: ["STR", "CON"],
    skillChoices: {
      choose: 2,
      options: fighterSkills,
    },
    proficiencies: {
      armor: ["All Armor", "Shields"],
      weapons: ["Simple Weapons", "Martial Weapons"],
      tools: [],
    },
    startingEquipment: [
      "Chain Mail",
      "Martial weapon and shield or two martial weapons",
      "Light crossbow with bolts or handaxes",
      "Dungeoneer's pack or explorer's pack",
    ],
    features: fighterFeatures,
  },
  {
    index: "wizard",
    name: "Wizard",
    description: "Scholarly spellcasters defined by spellbooks, rituals, and arcane study.",
    hitDie: 6,
    primaryAbility: "INT",
    previewOverview: [
      { label: "Primary Ability", value: "Intelligence" },
      { label: "Hit Point Die", value: "D6 per Wizard level" },
      { label: "Saving Throw Proficiencies", value: "Intelligence and Wisdom" },
      {
        label: "Skill Proficiencies",
        value:
          "Choose 2: Arcana, History, Insight, Investigation, Medicine, or Religion",
      },
      { label: "Weapon Proficiencies", value: "Simple Weapons" },
      { label: "Tool Proficiencies", value: "None" },
      { label: "Armor Training", value: "None" },
      {
        label: "Starting Equipment",
        value:
          "Choose A or B:\n(A) Spellbook, Arcane Focus or Component Pouch, Scholar's Pack or Explorer's Pack, and a Quarterstaff or Dagger\n(B) 55 GP",
      },
    ],
    savingThrows: ["INT", "WIS"],
    skillChoices: {
      choose: 2,
      options: wizardSkills,
    },
    proficiencies: {
      armor: [],
      weapons: [
        "Simple Weapons",
      ],
      tools: [],
    },
    startingEquipment: [
      "Spellbook",
      "Arcane Focus or Component Pouch",
      "Scholar's pack or explorer's pack",
      "Quarterstaff or dagger",
    ],
    features: wizardFeatures,
  },
  {
    index: "bard",
    name: "Bard",
    description: "Charismatic performers who support allies and wield flexible magic.",
    hitDie: 8,
    primaryAbility: "CHA",
    previewOverview: [
      { label: "Primary Ability", value: "Charisma" },
      { label: "Hit Point Die", value: "D8 per Bard level" },
      { label: "Saving Throw Proficiencies", value: "Dexterity and Charisma" },
      {
        label: "Skill Proficiencies",
        value:
          "Choose 3: Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, Sleight of Hand, Stealth, or Survival",
      },
      {
        label: "Weapon Proficiencies",
        value: "Simple weapons and Martial weapons that have the Finesse or Light property",
      },
      { label: "Tool Proficiencies", value: "Three Musical Instruments of your choice" },
      { label: "Armor Training", value: "Light armor" },
      {
        label: "Starting Equipment",
        value:
          "Choose A or B:\n(A) Leather Armor, Dagger, Musical Instrument, Entertainer's Pack or Diplomat's Pack\n(B) 90 GP",
      },
    ],
    savingThrows: ["DEX", "CHA"],
    skillChoices: {
      choose: 3,
      options: bardSkills,
    },
    proficiencies: {
      armor: ["Light Armor"],
      weapons: [
        "Simple Weapons",
        "Hand Crossbows",
        "Longswords",
        "Rapiers",
        "Shortswords",
      ],
      tools: ["Three Musical Instruments"],
    },
    startingEquipment: [
      "Leather Armor",
      "Dagger",
      "Choose a musical instrument",
      "Entertainer's pack or diplomat's pack",
    ],
    features: bardFeatures,
  },
];

export { backgroundOptions, classOptions, speciesOptions };
