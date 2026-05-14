import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  FeatureChoiceField,
  FeatureChoiceOption,
  SpeciesOption,
} from "../types/characterBuilder";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toOptions(values: string[]): FeatureChoiceOption[] {
  return values.map((value) => ({
    value: slugify(value),
    label: value,
  }));
}

function createChoiceField(id: string, label: string, values: string[]): FeatureChoiceField {
  return {
    id,
    label,
    options: toOptions(values),
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
  return createFeature({
    id: `ability-score-improvement-${level}`,
    level,
    title: "Ability Score Improvement",
    summary: "Increase one ability by 2, increase two abilities by 1, or choose a feat.",
    details: [
      "Use this step to shape the next breakpoint in your build.",
      "In later iterations this will update your live sheet and derived modifiers automatically.",
    ],
    choiceFields: [
      createChoiceField("increase-a", "Increase 1", [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma",
        "Feat Instead",
      ]),
      createChoiceField("increase-b", "Increase 2", [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma",
        "No Second Increase",
      ]),
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
  },
  {
    index: "elf",
    name: "Elf",
    description: "Graceful, perceptive, and naturally attuned to keen senses.",
    speed: 30,
    traits: ["Darkvision", "Keen Senses", "Fey Ancestry"],
  },
  {
    index: "dwarf",
    name: "Dwarf",
    description: "Durable explorers known for resilience and stonewise intuition.",
    speed: 25,
    traits: ["Darkvision", "Dwarven Resilience", "Tool Proficiency"],
  },
  {
    index: "halfling",
    name: "Halfling",
    description: "Lucky wanderers who rely on agility and steady courage.",
    speed: 25,
    traits: ["Lucky", "Brave", "Halfling Nimbleness"],
  },
  {
    index: "tiefling",
    name: "Tiefling",
    description: "Infernal-blooded travelers with arcane potential and darkvision.",
    speed: 30,
    traits: ["Darkvision", "Hellish Resistance", "Thaumaturgy"],
  },
];

const backgroundOptions: BackgroundOption[] = [
  {
    index: "criminal",
    name: "Criminal",
    description: "A covert past shaped by underworld contacts and streetwise instincts.",
    proficiencies: ["Stealth", "Deception", "Thieves' Tools"],
    feature: "Criminal Contact",
  },
  {
    index: "soldier",
    name: "Soldier",
    description: "Military training, discipline, and experience with battlefield structure.",
    proficiencies: ["Athletics", "Intimidation", "Gaming Set"],
    feature: "Military Rank",
  },
  {
    index: "sage",
    name: "Sage",
    description: "Academic research and knowledge-driven problem solving.",
    proficiencies: ["Arcana", "History", "Research Supplies"],
    feature: "Researcher",
  },
  {
    index: "acolyte",
    name: "Acolyte",
    description: "Religious service with strong spiritual networks and ritual familiarity.",
    proficiencies: ["Insight", "Religion", "Holy Symbol"],
    feature: "Shelter of the Faithful",
  },
];

const classOptions: ClassOption[] = [
  {
    index: "rogue",
    name: "Rogue",
    description: "Precision, stealth, and tactical positioning define the rogue.",
    hitDie: 8,
    primaryAbility: "DEX",
    features: rogueFeatures,
  },
  {
    index: "fighter",
    name: "Fighter",
    description: "Martial specialists with strong defenses and reliable combat output.",
    hitDie: 10,
    primaryAbility: "STR / DEX",
    features: fighterFeatures,
  },
  {
    index: "wizard",
    name: "Wizard",
    description: "Scholarly spellcasters defined by spellbooks, rituals, and arcane study.",
    hitDie: 6,
    primaryAbility: "INT",
    features: wizardFeatures,
  },
  {
    index: "bard",
    name: "Bard",
    description: "Charismatic performers who support allies and wield flexible magic.",
    hitDie: 8,
    primaryAbility: "CHA",
    features: bardFeatures,
  },
];

export { backgroundOptions, classOptions, speciesOptions };
