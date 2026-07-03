import {
  CORE_FEAT_OPTIONS,
  createAbilityScoreImprovementFeature,
  createEpicBoonFeature,
  createSubclassChoiceFeature,
  toReferenceOptions,
  type CuratedFeatureReference,
  type CuratedLevelReference,
  type CuratedReferenceTuple,
  type CuratedSubclassOptionTuple,
  type CuratedSubclassReference,
} from "./curatedClassHelpers.js";

type CuratedClassOverride = {
  classIndex: string;
  className: string;
  subclasses: readonly CuratedSubclassOptionTuple[];
  featureReferences: CuratedFeatureReference[];
  levelReferences: CuratedLevelReference[];
  subclassReferences: CuratedSubclassReference[];
};

const MARTIAL_FEAT_OPTIONS = CORE_FEAT_OPTIONS satisfies readonly CuratedReferenceTuple[];
const CASTER_FEAT_OPTIONS = CORE_FEAT_OPTIONS satisfies readonly CuratedReferenceTuple[];
const EXPERT_FEAT_OPTIONS = CORE_FEAT_OPTIONS satisfies readonly CuratedReferenceTuple[];

const FIGHTING_STYLE_OPTIONS = [
  ["archery", "Archery"],
  ["defense", "Defense"],
  ["dueling", "Dueling"],
  ["great-weapon-fighting", "Great Weapon Fighting"],
  ["protection", "Protection"],
  ["two-weapon-fighting", "Two-Weapon Fighting"],
] as const satisfies readonly CuratedReferenceTuple[];

const RANGER_FIGHTING_STYLE_OPTIONS = [
  ["archery", "Archery"],
  ["defense", "Defense"],
  ["dueling", "Dueling"],
  ["great-weapon-fighting", "Great Weapon Fighting"],
  ["protection", "Protection"],
  ["two-weapon-fighting", "Two-Weapon Fighting"],
] as const satisfies readonly CuratedReferenceTuple[];

const ROGUE_SKILL_OPTIONS = [
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
  ["thieves-tools", "Thieves' Tools"],
] as const satisfies readonly CuratedReferenceTuple[];

const METAMAGIC_OPTIONS = [
  ["careful-spell", "Careful Spell"],
  ["distant-spell", "Distant Spell"],
  ["empowered-spell", "Empowered Spell"],
  ["extended-spell", "Extended Spell"],
  ["heightened-spell", "Heightened Spell"],
  ["quickened-spell", "Quickened Spell"],
  ["subtle-spell", "Subtle Spell"],
  ["twinned-spell", "Twinned Spell"],
] as const satisfies readonly CuratedReferenceTuple[];

const RANGER_SKILL_OPTIONS = [
  ["skill-animal-handling", "Skill: Animal Handling"],
  ["skill-athletics", "Skill: Athletics"],
  ["skill-insight", "Skill: Insight"],
  ["skill-investigation", "Skill: Investigation"],
  ["skill-nature", "Skill: Nature"],
  ["skill-perception", "Skill: Perception"],
  ["skill-stealth", "Skill: Stealth"],
  ["skill-survival", "Skill: Survival"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_SCHOLAR_OPTIONS = [
  ["skill-arcana", "Skill: Arcana"],
  ["skill-history", "Skill: History"],
  ["skill-investigation", "Skill: Investigation"],
  ["skill-medicine", "Skill: Medicine"],
  ["skill-nature", "Skill: Nature"],
  ["skill-religion", "Skill: Religion"],
] as const satisfies readonly CuratedReferenceTuple[];

const WARLOCK_CANTRIP_OPTIONS = [
  ["chill-touch", "Chill Touch"],
  ["eldritch-blast", "Eldritch Blast"],
  ["friends", "Friends"],
  ["mage-hand", "Mage Hand"],
  ["minor-illusion", "Minor Illusion"],
  ["poison-spray", "Poison Spray"],
  ["prestidigitation", "Prestidigitation"],
  ["true-strike", "True Strike"],
] as const satisfies readonly CuratedReferenceTuple[];

const WARLOCK_LEVEL_1_SPELL_OPTIONS = [
  ["armor-of-agathys", "Armor of Agathys"],
  ["charm-person", "Charm Person"],
  ["comprehend-languages", "Comprehend Languages"],
  ["hellish-rebuke", "Hellish Rebuke"],
  ["hex", "Hex"],
  ["illusory-script", "Illusory Script"],
  ["protection-from-evil-and-good", "Protection from Evil and Good"],
  ["unseen-servant", "Unseen Servant"],
  ["witch-bolt", "Witch Bolt"],
] as const satisfies readonly CuratedReferenceTuple[];

const WARLOCK_LEVEL_2_SPELL_OPTIONS = [
  ...WARLOCK_LEVEL_1_SPELL_OPTIONS,
  ["cloud-of-daggers", "Cloud of Daggers"],
  ["darkness", "Darkness"],
  ["enthrall", "Enthrall"],
  ["hold-person", "Hold Person"],
  ["invisibility", "Invisibility"],
  ["misty-step", "Misty Step"],
  ["ray-of-enfeeblement", "Ray of Enfeeblement"],
  ["shatter", "Shatter"],
  ["spider-climb", "Spider Climb"],
  ["suggestion", "Suggestion"],
] as const satisfies readonly CuratedReferenceTuple[];

const WARLOCK_LEVEL_3_SPELL_OPTIONS = [
  ...WARLOCK_LEVEL_2_SPELL_OPTIONS,
  ["counterspell", "Counterspell"],
  ["dispel-magic", "Dispel Magic"],
  ["fear", "Fear"],
  ["fly", "Fly"],
  ["gaseous-form", "Gaseous Form"],
  ["hunger-of-hadar", "Hunger of Hadar"],
  ["magic-circle", "Magic Circle"],
  ["major-image", "Major Image"],
  ["remove-curse", "Remove Curse"],
  ["tongues", "Tongues"],
  ["vampiric-touch", "Vampiric Touch"],
] as const satisfies readonly CuratedReferenceTuple[];

const WARLOCK_LEVEL_4_SPELL_OPTIONS = [
  ...WARLOCK_LEVEL_3_SPELL_OPTIONS,
  ["banishment", "Banishment"],
  ["blight", "Blight"],
  ["dimension-door", "Dimension Door"],
  ["hallucinatory-terrain", "Hallucinatory Terrain"],
] as const satisfies readonly CuratedReferenceTuple[];

const WARLOCK_LEVEL_5_SPELL_OPTIONS = [
  ...WARLOCK_LEVEL_4_SPELL_OPTIONS,
  ["contact-other-plane", "Contact Other Plane"],
  ["dream", "Dream"],
  ["hold-monster", "Hold Monster"],
  ["scrying", "Scrying"],
] as const satisfies readonly CuratedReferenceTuple[];

const PACT_OF_THE_TOME_CANTRIP_OPTIONS = [
  ["acid-splash", "Acid Splash"],
  ["chill-touch", "Chill Touch"],
  ["dancing-lights", "Dancing Lights"],
  ["druidcraft", "Druidcraft"],
  ["eldritch-blast", "Eldritch Blast"],
  ["fire-bolt", "Fire Bolt"],
  ["friends", "Friends"],
  ["guidance", "Guidance"],
  ["light", "Light"],
  ["mage-hand", "Mage Hand"],
  ["mending", "Mending"],
  ["message", "Message"],
  ["minor-illusion", "Minor Illusion"],
  ["poison-spray", "Poison Spray"],
  ["prestidigitation", "Prestidigitation"],
  ["ray-of-frost", "Ray of Frost"],
  ["resistance", "Resistance"],
  ["sacred-flame", "Sacred Flame"],
  ["shocking-grasp", "Shocking Grasp"],
  ["thaumaturgy", "Thaumaturgy"],
  ["true-strike", "True Strike"],
  ["vicious-mockery", "Vicious Mockery"],
] as const satisfies readonly CuratedReferenceTuple[];

const BOOK_OF_ANCIENT_SECRETS_RITUAL_OPTIONS = [
  ["alarm", "Alarm"],
  ["comprehend-languages", "Comprehend Languages"],
  ["detect-magic", "Detect Magic"],
  ["find-familiar", "Find Familiar"],
  ["identify", "Identify"],
  ["illusory-script", "Illusory Script"],
  ["purify-food-and-drink", "Purify Food and Drink"],
  ["speak-with-animals", "Speak with Animals"],
  ["tensers-floating-disk", "Tenser's Floating Disk"],
  ["unseen-servant", "Unseen Servant"],
] as const satisfies readonly CuratedReferenceTuple[];

const SORCERER_CANTRIP_OPTIONS = [
  ["acid-splash", "Acid Splash"],
  ["blade-ward", "Blade Ward"],
  ["chill-touch", "Chill Touch"],
  ["dancing-lights", "Dancing Lights"],
  ["fire-bolt", "Fire Bolt"],
  ["light", "Light"],
  ["mage-hand", "Mage Hand"],
  ["mending", "Mending"],
  ["message", "Message"],
  ["minor-illusion", "Minor Illusion"],
  ["poison-spray", "Poison Spray"],
  ["prestidigitation", "Prestidigitation"],
  ["ray-of-frost", "Ray of Frost"],
  ["shocking-grasp", "Shocking Grasp"],
  ["sorcerous-burst", "Sorcerous Burst"],
  ["true-strike", "True Strike"],
] as const satisfies readonly CuratedReferenceTuple[];

const SORCERER_LEVEL_1_SPELL_OPTIONS = [
  ["burning-hands", "Burning Hands"],
  ["charm-person", "Charm Person"],
  ["chromatic-orb", "Chromatic Orb"],
  ["color-spray", "Color Spray"],
  ["disguise-self", "Disguise Self"],
  ["expeditious-retreat", "Expeditious Retreat"],
  ["false-life", "False Life"],
  ["feather-fall", "Feather Fall"],
  ["fog-cloud", "Fog Cloud"],
  ["jump", "Jump"],
  ["mage-armor", "Mage Armor"],
  ["magic-missile", "Magic Missile"],
  ["shield", "Shield"],
  ["sleep", "Sleep"],
  ["thunderwave", "Thunderwave"],
  ["witch-bolt", "Witch Bolt"],
] as const satisfies readonly CuratedReferenceTuple[];

const SORCERER_LEVEL_2_SPELL_OPTIONS = [
  ...SORCERER_LEVEL_1_SPELL_OPTIONS,
  ["alter-self", "Alter Self"],
  ["blur", "Blur"],
  ["darkness", "Darkness"],
  ["darkvision", "Darkvision"],
  ["detect-thoughts", "Detect Thoughts"],
  ["dragon-s-breath", "Dragon's Breath"],
  ["gust-of-wind", "Gust of Wind"],
  ["hold-person", "Hold Person"],
  ["invisibility", "Invisibility"],
  ["knock", "Knock"],
  ["levitate", "Levitate"],
  ["mirror-image", "Mirror Image"],
  ["misty-step", "Misty Step"],
  ["scorching-ray", "Scorching Ray"],
  ["see-invisibility", "See Invisibility"],
  ["shatter", "Shatter"],
  ["spider-climb", "Spider Climb"],
  ["suggestion", "Suggestion"],
] as const satisfies readonly CuratedReferenceTuple[];

const SORCERER_LEVEL_3_SPELL_OPTIONS = [
  ...SORCERER_LEVEL_2_SPELL_OPTIONS,
  ["blink", "Blink"],
  ["counterspell", "Counterspell"],
  ["daylight", "Daylight"],
  ["dispel-magic", "Dispel Magic"],
  ["fear", "Fear"],
  ["fireball", "Fireball"],
  ["fly", "Fly"],
  ["gaseous-form", "Gaseous Form"],
  ["haste", "Haste"],
  ["lightning-bolt", "Lightning Bolt"],
  ["major-image", "Major Image"],
  ["slow", "Slow"],
  ["stinking-cloud", "Stinking Cloud"],
] as const satisfies readonly CuratedReferenceTuple[];

const SORCERER_LEVEL_4_SPELL_OPTIONS = [
  ...SORCERER_LEVEL_3_SPELL_OPTIONS,
  ["banishment", "Banishment"],
  ["blight", "Blight"],
  ["confusion", "Confusion"],
  ["dimension-door", "Dimension Door"],
  ["greater-invisibility", "Greater Invisibility"],
  ["ice-storm", "Ice Storm"],
  ["polymorph", "Polymorph"],
  ["stoneskin", "Stoneskin"],
  ["wall-of-fire", "Wall of Fire"],
] as const satisfies readonly CuratedReferenceTuple[];

const SORCERER_LEVEL_5_SPELL_OPTIONS = [
  ...SORCERER_LEVEL_4_SPELL_OPTIONS,
  ["animate-objects", "Animate Objects"],
  ["cloudkill", "Cloudkill"],
  ["cone-of-cold", "Cone of Cold"],
  ["creation", "Creation"],
  ["dominate-person", "Dominate Person"],
  ["hold-monster", "Hold Monster"],
  ["immolation", "Immolation"],
  ["insect-plague", "Insect Plague"],
  ["seeming", "Seeming"],
  ["telekinesis", "Telekinesis"],
  ["wall-of-stone", "Wall of Stone"],
] as const satisfies readonly CuratedReferenceTuple[];

const DRACONIC_ANCESTRY_OPTIONS = [
  ["black-dragon", "Black Dragon (Acid)"],
  ["blue-dragon", "Blue Dragon (Lightning)"],
  ["brass-dragon", "Brass Dragon (Fire)"],
  ["bronze-dragon", "Bronze Dragon (Lightning)"],
  ["copper-dragon", "Copper Dragon (Acid)"],
  ["gold-dragon", "Gold Dragon (Fire)"],
  ["green-dragon", "Green Dragon (Poison)"],
  ["red-dragon", "Red Dragon (Fire)"],
  ["silver-dragon", "Silver Dragon (Cold)"],
  ["white-dragon", "White Dragon (Cold)"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_CANTRIP_OPTIONS = [
  ["acid-splash", "Acid Splash"],
  ["blade-ward", "Blade Ward"],
  ["chill-touch", "Chill Touch"],
  ["dancing-lights", "Dancing Lights"],
  ["fire-bolt", "Fire Bolt"],
  ["light", "Light"],
  ["mage-hand", "Mage Hand"],
  ["mending", "Mending"],
  ["message", "Message"],
  ["minor-illusion", "Minor Illusion"],
  ["poison-spray", "Poison Spray"],
  ["prestidigitation", "Prestidigitation"],
  ["ray-of-frost", "Ray of Frost"],
  ["shocking-grasp", "Shocking Grasp"],
  ["true-strike", "True Strike"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_LEVEL_1_SPELL_OPTIONS = [
  ["alarm", "Alarm"],
  ["burning-hands", "Burning Hands"],
  ["charm-person", "Charm Person"],
  ["chromatic-orb", "Chromatic Orb"],
  ["comprehend-languages", "Comprehend Languages"],
  ["detect-magic", "Detect Magic"],
  ["disguise-self", "Disguise Self"],
  ["false-life", "False Life"],
  ["feather-fall", "Feather Fall"],
  ["find-familiar", "Find Familiar"],
  ["fog-cloud", "Fog Cloud"],
  ["grease", "Grease"],
  ["jump", "Jump"],
  ["longstrider", "Longstrider"],
  ["mage-armor", "Mage Armor"],
  ["magic-missile", "Magic Missile"],
  ["protection-from-evil-and-good", "Protection from Evil and Good"],
  ["shield", "Shield"],
  ["sleep", "Sleep"],
  ["tasha-s-hideous-laughter", "Tasha's Hideous Laughter"],
  ["thunderwave", "Thunderwave"],
  ["unseen-servant", "Unseen Servant"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_LEVEL_2_SPELL_OPTIONS = [
  ...WIZARD_LEVEL_1_SPELL_OPTIONS,
  ["arcane-lock", "Arcane Lock"],
  ["blur", "Blur"],
  ["darkvision", "Darkvision"],
  ["detect-thoughts", "Detect Thoughts"],
  ["enlarge-reduce", "Enlarge/Reduce"],
  ["flaming-sphere", "Flaming Sphere"],
  ["hold-person", "Hold Person"],
  ["invisibility", "Invisibility"],
  ["knock", "Knock"],
  ["levitate", "Levitate"],
  ["mirror-image", "Mirror Image"],
  ["misty-step", "Misty Step"],
  ["rope-trick", "Rope Trick"],
  ["scorching-ray", "Scorching Ray"],
  ["see-invisibility", "See Invisibility"],
  ["shatter", "Shatter"],
  ["spider-climb", "Spider Climb"],
  ["web", "Web"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_LEVEL_3_SPELL_OPTIONS = [
  ...WIZARD_LEVEL_2_SPELL_OPTIONS,
  ["counterspell", "Counterspell"],
  ["dispel-magic", "Dispel Magic"],
  ["fear", "Fear"],
  ["fireball", "Fireball"],
  ["fly", "Fly"],
  ["gaseous-form", "Gaseous Form"],
  ["haste", "Haste"],
  ["hypnotic-pattern", "Hypnotic Pattern"],
  ["lightning-bolt", "Lightning Bolt"],
  ["major-image", "Major Image"],
  ["sending", "Sending"],
  ["slow", "Slow"],
  ["tiny-hut", "Tiny Hut"],
  ["tongues", "Tongues"],
  ["water-breathing", "Water Breathing"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_LEVEL_4_SPELL_OPTIONS = [
  ...WIZARD_LEVEL_3_SPELL_OPTIONS,
  ["arcane-eye", "Arcane Eye"],
  ["banishment", "Banishment"],
  ["blight", "Blight"],
  ["confusion", "Confusion"],
  ["dimension-door", "Dimension Door"],
  ["fabricate", "Fabricate"],
  ["greater-invisibility", "Greater Invisibility"],
  ["ice-storm", "Ice Storm"],
  ["polymorph", "Polymorph"],
  ["stoneskin", "Stoneskin"],
  ["wall-of-fire", "Wall of Fire"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_LEVEL_5_SPELL_OPTIONS = [
  ...WIZARD_LEVEL_4_SPELL_OPTIONS,
  ["animate-objects", "Animate Objects"],
  ["bigby-s-hand", "Bigby's Hand"],
  ["cloudkill", "Cloudkill"],
  ["cone-of-cold", "Cone of Cold"],
  ["contact-other-plane", "Contact Other Plane"],
  ["dominate-person", "Dominate Person"],
  ["hold-monster", "Hold Monster"],
  ["legend-lore", "Legend Lore"],
  ["scrying", "Scrying"],
  ["telekinesis", "Telekinesis"],
  ["wall-of-force", "Wall of Force"],
] as const satisfies readonly CuratedReferenceTuple[];

const DRUID_CANTRIP_OPTIONS = [
  ["druidcraft", "Druidcraft"],
  ["elementalism", "Elementalism"],
  ["guidance", "Guidance"],
  ["mending", "Mending"],
  ["message", "Message"],
  ["poison-spray", "Poison Spray"],
  ["produce-flame", "Produce Flame"],
  ["resistance", "Resistance"],
  ["shillelagh", "Shillelagh"],
  ["starry-wisp", "Starry Wisp"],
  ["thorn-whip", "Thorn Whip"],
] as const satisfies readonly CuratedReferenceTuple[];

const CIRCLE_OF_THE_LAND_TERRAIN_OPTIONS = [
  ["arid-land", "Arid Land"],
  ["polar-land", "Polar Land"],
  ["temperate-land", "Temperate Land"],
  ["tropical-land", "Tropical Land"],
] as const satisfies readonly CuratedReferenceTuple[];

const DRUID_ELEMENTAL_FURY_OPTIONS = [
  {
    option_type: "reference",
    item: {
      index: "potent-spellcasting",
      name: "Potent Spellcasting",
      url: "/api/2024/features/druid-elemental-fury#potent-spellcasting",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "primal-strike",
      name: "Primal Strike",
      url: "/api/2024/features/druid-elemental-fury#primal-strike",
    },
  },
] as const;

const WEAPON_MASTERY_PROPERTY_OPTIONS = [
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
] as const;

function toSpellOptions(entries: readonly CuratedReferenceTuple[]) {
  return entries.map(([index, name]) => ({
    option_type: "reference",
    item: {
      index,
      name,
      url: `/api/2024/spells/${index}`,
    },
  }));
}

function createWarlockSpellChoiceFeature(
  index: string,
  level: number,
  name: string,
  description: string,
  choose: number,
  spellOptions: readonly CuratedReferenceTuple[],
  type: "warlock cantrip" | "warlock spell" | "sorcerer cantrip" | "sorcerer spell",
): CuratedFeatureReference {
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

function createSorcererSpellChoiceFeature(
  index: string,
  level: number,
  name: string,
  description: string,
  choose: number,
  spellOptions: readonly CuratedReferenceTuple[],
  type: "sorcerer cantrip" | "sorcerer spell",
): CuratedFeatureReference {
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

function createWizardSpellChoiceFeature(
  index: string,
  level: number,
  name: string,
  description: string,
  choose: number,
  spellOptions: readonly CuratedReferenceTuple[],
  type: "wizard cantrip" | "wizard spell",
): CuratedFeatureReference {
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

function createDruidSpellChoiceFeature(
  index: string,
  level: number,
  name: string,
  description: string,
  choose: number,
  spellOptions: readonly CuratedReferenceTuple[],
  type: "druid cantrip",
): CuratedFeatureReference {
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

const WARLOCK_MYSTIC_ARCANUM_6_OPTIONS = [
  {
    option_type: "reference",
    item: { index: "arcane-gate", name: "Arcane Gate", url: "/api/2024/features/mystic-arcanum-6th-level#arcane-gate" },
  },
  {
    option_type: "reference",
    item: { index: "circle-of-death", name: "Circle of Death", url: "/api/2024/features/mystic-arcanum-6th-level#circle-of-death" },
  },
  {
    option_type: "reference",
    item: { index: "conjure-fey", name: "Conjure Fey", url: "/api/2024/features/mystic-arcanum-6th-level#conjure-fey" },
  },
  {
    option_type: "reference",
    item: { index: "create-undead", name: "Create Undead", url: "/api/2024/features/mystic-arcanum-6th-level#create-undead" },
  },
  {
    option_type: "reference",
    item: { index: "eyebite", name: "Eyebite", url: "/api/2024/features/mystic-arcanum-6th-level#eyebite" },
  },
  {
    option_type: "reference",
    item: { index: "flesh-to-stone", name: "Flesh to Stone", url: "/api/2024/features/mystic-arcanum-6th-level#flesh-to-stone" },
  },
  {
    option_type: "reference",
    item: { index: "mass-suggestion", name: "Mass Suggestion", url: "/api/2024/features/mystic-arcanum-6th-level#mass-suggestion" },
  },
  {
    option_type: "reference",
    item: { index: "true-seeing", name: "True Seeing", url: "/api/2024/features/mystic-arcanum-6th-level#true-seeing" },
  },
] as const;

const WARLOCK_PACT_BOON_OPTIONS = [
  {
    option_type: "reference",
    item: {
      index: "pact-of-the-blade",
      name: "Pact of the Blade",
      url: "/api/2024/features/pact-boon#pact-of-the-blade",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "pact-of-the-chain",
      name: "Pact of the Chain",
      url: "/api/2024/features/pact-boon#pact-of-the-chain",
    },
  },
  {
    option_type: "reference",
    item: {
      index: "pact-of-the-tome",
      name: "Pact of the Tome",
      url: "/api/2024/features/pact-boon#pact-of-the-tome",
    },
    choice: {
      choose: 3,
      type: "warlock cantrip",
      desc: "Choose three additional cantrips for your Book of Shadows",
      from: {
        option_set_type: "options_array",
        options: toSpellOptions(PACT_OF_THE_TOME_CANTRIP_OPTIONS),
      },
    },
  },
] as const;

const WARLOCK_ELDRITCH_INVOCATION_OPTIONS = [
  { index: "eldritch-invocation-agonizing-blast", name: "Agonizing Blast", minimumLevel: 2, requiredSpellIndex: "eldritch-blast" },
  { index: "eldritch-invocation-armor-of-shadows", name: "Armor of Shadows", minimumLevel: 2 },
  { index: "eldritch-invocation-ascendant-step", name: "Ascendant Step", minimumLevel: 9 },
  { index: "eldritch-invocation-beast-speech", name: "Beast Speech", minimumLevel: 2 },
  { index: "eldritch-invocation-beguiling-influence", name: "Beguiling Influence", minimumLevel: 2 },
  { index: "eldritch-invocation-bewitching-whispers", name: "Bewitching Whispers", minimumLevel: 7 },
  {
    index: "eldritch-invocation-book-of-ancient-secrets",
    name: "Book of Ancient Secrets",
    minimumLevel: 2,
    requiredPactBoonIndex: "pact-of-the-tome",
    choice: {
      choose: 2,
      type: "ritual spell",
      desc: "Choose two 1st-level ritual spells for your Book of Ancient Secrets",
      from: {
        option_set_type: "options_array",
        options: toSpellOptions(BOOK_OF_ANCIENT_SECRETS_RITUAL_OPTIONS),
      },
    },
  },
  { index: "eldritch-invocation-chains-of-carceri", name: "Chains of Carceri", minimumLevel: 15, requiredPactBoonIndex: "pact-of-the-chain" },
  { index: "eldritch-invocation-devils-sight", name: "Devil's Sight", minimumLevel: 2 },
  { index: "eldritch-invocation-dreadful-word", name: "Dreadful Word", minimumLevel: 7 },
  { index: "eldritch-invocation-eldritch-sight", name: "Eldritch Sight", minimumLevel: 2 },
  { index: "eldritch-invocation-eldritch-spear", name: "Eldritch Spear", minimumLevel: 2, requiredSpellIndex: "eldritch-blast" },
  { index: "eldritch-invocation-eyes-of-the-rune-keeper", name: "Eyes of the Rune Keeper", minimumLevel: 2 },
  { index: "eldritch-invocation-fiendish-vigor", name: "Fiendish Vigor", minimumLevel: 2 },
  { index: "eldritch-invocation-gaze-of-two-minds", name: "Gaze of Two Minds", minimumLevel: 2 },
  { index: "eldritch-invocation-lifedrinker", name: "Lifedrinker", minimumLevel: 12, requiredPactBoonIndex: "pact-of-the-blade" },
  { index: "eldritch-invocation-mask-of-many-faces", name: "Mask of Many Faces", minimumLevel: 2 },
  { index: "eldritch-invocation-master-of-myriad-forms", name: "Master of Myriad Forms", minimumLevel: 15 },
  { index: "eldritch-invocation-minions-of-chaos", name: "Minions of Chaos", minimumLevel: 9 },
  { index: "eldritch-invocation-mire-the-mind", name: "Mire the Mind", minimumLevel: 5 },
  { index: "eldritch-invocation-misty-visions", name: "Misty Visions", minimumLevel: 2 },
  { index: "eldritch-invocation-one-with-shadows", name: "One with Shadows", minimumLevel: 5 },
  { index: "eldritch-invocation-otherworldly-leap", name: "Otherworldly Leap", minimumLevel: 9 },
  { index: "eldritch-invocation-repelling-blast", name: "Repelling Blast", minimumLevel: 2, requiredSpellIndex: "eldritch-blast" },
  { index: "eldritch-invocation-sculptor-of-flesh", name: "Sculptor of Flesh", minimumLevel: 7 },
  { index: "eldritch-invocation-sign-of-ill-omen", name: "Sign of Ill Omen", minimumLevel: 5 },
  { index: "eldritch-invocation-thief-of-five-fates", name: "Thief of Five Fates", minimumLevel: 2 },
  { index: "eldritch-invocation-thirsting-blade", name: "Thirsting Blade", minimumLevel: 5, requiredPactBoonIndex: "pact-of-the-blade" },
  { index: "eldritch-invocation-visions-of-distant-realms", name: "Visions of Distant Realms", minimumLevel: 15 },
  { index: "eldritch-invocation-voice-of-the-chain-master", name: "Voice of the Chain Master", minimumLevel: 2, requiredPactBoonIndex: "pact-of-the-chain" },
  { index: "eldritch-invocation-whispers-of-the-grave", name: "Whispers of the Grave", minimumLevel: 9 },
  { index: "eldritch-invocation-witch-sight", name: "Witch Sight", minimumLevel: 15 },
] as const;

const WARLOCK_MYSTIC_ARCANUM_7_OPTIONS = [
  {
    option_type: "reference",
    item: { index: "etherealness", name: "Etherealness", url: "/api/2024/features/mystic-arcanum-7th-level#etherealness" },
  },
  {
    option_type: "reference",
    item: { index: "finger-of-death", name: "Finger of Death", url: "/api/2024/features/mystic-arcanum-7th-level#finger-of-death" },
  },
  {
    option_type: "reference",
    item: { index: "forcecage", name: "Forcecage", url: "/api/2024/features/mystic-arcanum-7th-level#forcecage" },
  },
  {
    option_type: "reference",
    item: { index: "plane-shift", name: "Plane Shift", url: "/api/2024/features/mystic-arcanum-7th-level#plane-shift" },
  },
  {
    option_type: "reference",
    item: { index: "power-word-pain", name: "Power Word Pain", url: "/api/2024/features/mystic-arcanum-7th-level#power-word-pain" },
  },
] as const;

const WARLOCK_MYSTIC_ARCANUM_8_OPTIONS = [
  {
    option_type: "reference",
    item: { index: "demiplane", name: "Demiplane", url: "/api/2024/features/mystic-arcanum-8th-level#demiplane" },
  },
  {
    option_type: "reference",
    item: { index: "dominate-monster", name: "Dominate Monster", url: "/api/2024/features/mystic-arcanum-8th-level#dominate-monster" },
  },
  {
    option_type: "reference",
    item: { index: "feeblemind", name: "Feeblemind", url: "/api/2024/features/mystic-arcanum-8th-level#feeblemind" },
  },
  {
    option_type: "reference",
    item: { index: "glibness", name: "Glibness", url: "/api/2024/features/mystic-arcanum-8th-level#glibness" },
  },
  {
    option_type: "reference",
    item: { index: "power-word-stun", name: "Power Word Stun", url: "/api/2024/features/mystic-arcanum-8th-level#power-word-stun" },
  },
] as const;

const WARLOCK_MYSTIC_ARCANUM_9_OPTIONS = [
  {
    option_type: "reference",
    item: { index: "astral-projection", name: "Astral Projection", url: "/api/2024/features/mystic-arcanum-9th-level#astral-projection" },
  },
  {
    option_type: "reference",
    item: { index: "foresight", name: "Foresight", url: "/api/2024/features/mystic-arcanum-9th-level#foresight" },
  },
  {
    option_type: "reference",
    item: { index: "imprisonment", name: "Imprisonment", url: "/api/2024/features/mystic-arcanum-9th-level#imprisonment" },
  },
  {
    option_type: "reference",
    item: { index: "power-word-kill", name: "Power Word Kill", url: "/api/2024/features/mystic-arcanum-9th-level#power-word-kill" },
  },
  {
    option_type: "reference",
    item: { index: "true-polymorph", name: "True Polymorph", url: "/api/2024/features/mystic-arcanum-9th-level#true-polymorph" },
  },
] as const;

function createWarlockEldritchInvocationFeature(
  index: string,
  level: number,
  description: string,
): CuratedFeatureReference {
  return {
    index,
    level,
    name: "Eldritch Invocations",
    desc: [description],
    feature_specific: {
      choose: 1,
      type: "eldritch invocation",
      from: {
        option_set_type: "options_array",
        options: WARLOCK_ELDRITCH_INVOCATION_OPTIONS.map((invocation) => ({
          option_type: "reference",
          item: {
            index: invocation.index,
            name: invocation.name,
            url: `/api/2024/features/${invocation.index}`,
          },
          choice: "choice" in invocation ? invocation.choice : undefined,
          prerequisites: {
            minimumLevel: invocation.minimumLevel,
            requiredPactBoonIndex: invocation.requiredPactBoonIndex ?? null,
            requiredSpellIndex: invocation.requiredSpellIndex ?? null,
          },
        })),
      },
    },
  };
}

const DRUID_SUBCLASSES = [
  ["circle-of-the-land", "Circle of the Land"],
  ["circle-of-the-moon", "Circle of the Moon"],
  ["circle-of-the-sea", "Circle of the Sea"],
  ["circle-of-the-stars", "Circle of the Stars"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const FIGHTER_SUBCLASSES = [
  ["battle-master", "Battle Master"],
  ["champion", "Champion"],
  ["eldritch-knight", "Eldritch Knight"],
  ["psi-warrior", "Psi Warrior"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const MONK_SUBCLASSES = [
  ["warrior-of-mercy", "Warrior of Mercy"],
  ["warrior-of-the-elements", "Warrior of the Elements"],
  ["warrior-of-the-hand", "Warrior of the Open Hand"],
  ["warrior-of-shadow", "Warrior of Shadow"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const PALADIN_SUBCLASSES = [
  ["oath-of-devotion", "Oath of Devotion"],
  ["oath-of-glory", "Oath of Glory"],
  ["oath-of-the-ancients", "Oath of the Ancients"],
  ["oath-of-vengeance", "Oath of Vengeance"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const RANGER_SUBCLASSES = [
  ["beast-master", "Beast Master"],
  ["fey-wanderer", "Fey Wanderer"],
  ["gloom-stalker", "Gloom Stalker"],
  ["hunter", "Hunter"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const ROGUE_SUBCLASSES = [
  ["arcane-trickster", "Arcane Trickster"],
  ["assassin", "Assassin"],
  ["soulknife", "Soulknife"],
  ["thief", "Thief"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const SORCERER_SUBCLASSES = [
  ["aberrant-sorcery", "Aberrant Sorcery"],
  ["clockwork-sorcery", "Clockwork Sorcery"],
  ["draconic-sorcery", "Draconic Sorcery"],
  ["wild-magic-sorcery", "Wild Magic Sorcery"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const WARLOCK_SUBCLASSES = [
  ["archfey-patron", "Archfey Patron"],
  ["celestial-patron", "Celestial Patron"],
  ["fiend-patron", "Fiend Patron"],
  ["great-old-one-patron", "Great Old One Patron"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const WIZARD_SUBCLASSES = [
  ["abjurer", "Abjurer"],
  ["diviner", "Diviner"],
  ["evoker", "Evoker"],
  ["illusionist", "Illusionist"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

function createSimpleFeature(
  index: string,
  level: number,
  name: string,
  ...desc: string[]
): CuratedFeatureReference {
  return {
    index,
    level,
    name,
    desc,
  };
}

const DRUID_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createDruidSpellChoiceFeature(
    "druid-cantrips-1",
    1,
    "Cantrips",
    "Choose two Druid cantrips that reflect the first natural magic you learn to shape.",
    2,
    DRUID_CANTRIP_OPTIONS,
    "druid cantrip",
  ),
  createSimpleFeature(
    "druid-spellcasting",
    1,
    "Spellcasting",
    "You prepare and cast Druid spells through your bond with nature, using Wisdom as your spellcasting ability.",
  ),
  createSimpleFeature(
    "druidic",
    1,
    "Druidic",
    "You know Druidic, the secret language used by Druids to pass meaning, warning, and hidden signs among their circles.",
  ),
  {
    index: "druid-primal-order",
    level: 1,
    name: "Primal Order",
    desc: [
      "You commit to a foundational druidic path that shapes your role in the party.",
      "Magician emphasizes wisdom, cantrips, and lore. Warden emphasizes armor, weapons, and front-line resilience.",
    ],
    feature_specific: {
      choose: 1,
      type: "primal order",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(
          [
            ["magician", "Magician"],
            ["warden", "Warden"],
          ],
          "feats",
        ),
      },
    },
  },
  createSimpleFeature(
    "druid-wild-shape",
    2,
    "Wild Shape",
    "As a Bonus Action, you can expend a use of Channel Nature to assume an animal form. Wild Shape supports exploration, utility, and survival magic.",
  ),
  createSimpleFeature(
    "druid-wild-companion",
    2,
    "Wild Companion",
    "You can Channel Nature to magically summon a familiar-like beast companion that assists you for a short time.",
  ),
  createSubclassChoiceFeature(
    "druid-subclass",
    3,
    "Druid",
    DRUID_SUBCLASSES,
    "Choose the circle that shapes your bond to the natural world and your later subclass features.",
  ),
  {
    index: "circle-spells",
    level: 3,
    name: "Circle Spells",
    desc: [
      "Your chosen land grants always-prepared spells that reflect its terrain and magical character.",
    ],
    subclass: {
      index: "circle-of-the-land",
      name: "Circle of the Land",
      url: "/api/2024/subclasses/circle-of-the-land",
    },
  },
  {
    index: "lands-aid",
    level: 3,
    name: "Land's Aid",
    desc: [
      "You channel restorative or bolstering terrain magic to support allies while shaping the battlefield.",
    ],
    subclass: {
      index: "circle-of-the-land",
      name: "Circle of the Land",
      url: "/api/2024/subclasses/circle-of-the-land",
    },
  },
  {
    index: "circle-forms",
    level: 3,
    name: "Circle Forms",
    desc: [
      "Your Wild Shape becomes sturdier, deadlier, and better suited for combat.",
    ],
    subclass: {
      index: "circle-of-the-moon",
      name: "Circle of the Moon",
      url: "/api/2024/subclasses/circle-of-the-moon",
    },
  },
  {
    index: "moonlight-step",
    level: 3,
    name: "Moonlight Step",
    desc: [
      "Lunar magic helps you reposition with sudden radiant mobility.",
    ],
    subclass: {
      index: "circle-of-the-moon",
      name: "Circle of the Moon",
      url: "/api/2024/subclasses/circle-of-the-moon",
    },
  },
  {
    index: "wrath-of-the-sea",
    level: 3,
    name: "Wrath of the Sea",
    desc: [
      "Sea magic lashes nearby foes with moving water, force, or lightning-like pressure.",
    ],
    subclass: {
      index: "circle-of-the-sea",
      name: "Circle of the Sea",
      url: "/api/2024/subclasses/circle-of-the-sea",
    },
  },
  {
    index: "watery-aegis",
    level: 3,
    name: "Watery Aegis",
    desc: [
      "You can sheath yourself or allies in moving sea-born protection.",
    ],
    subclass: {
      index: "circle-of-the-sea",
      name: "Circle of the Sea",
      url: "/api/2024/subclasses/circle-of-the-sea",
    },
  },
  {
    index: "star-map",
    level: 3,
    name: "Star Map",
    desc: [
      "A celestial focus helps you cast guiding magic and draw on astrological insight.",
    ],
    subclass: {
      index: "circle-of-the-stars",
      name: "Circle of the Stars",
      url: "/api/2024/subclasses/circle-of-the-stars",
    },
  },
  {
    index: "starry-form",
    level: 3,
    name: "Starry Form",
    desc: [
      "You take on a luminous constellation form that changes how your magic expresses itself.",
    ],
    subclass: {
      index: "circle-of-the-stars",
      name: "Circle of the Stars",
      url: "/api/2024/subclasses/circle-of-the-stars",
    },
  },
  {
    index: "druid-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen druid circle grants its defining 3rd-level features.",
      "Circle of the Land: Circle Spells and Land's Aid deepen your connection to a chosen biome.",
      "Circle of the Moon: Circle Forms turns Wild Shape into a stronger battle form.",
      "Circle of the Sea: Wrath of the Sea and oceanic magic let you strike with storm and tide.",
      "Circle of the Stars: a Star Map and Starry Form connect your magic to celestial patterns.",
    ],
  },
  {
    index: "circle-of-the-land-terrain",
    level: 3,
    name: "Circle of the Land Terrain",
    desc: [
      "Choose the kind of land your circle is bound to. This terrain shapes the flavor and spell identity of your Circle of the Land features.",
    ],
    subclass: {
      index: "circle-of-the-land",
      name: "Circle of the Land",
      url: "/api/2024/subclasses/circle-of-the-land",
    },
    feature_specific: {
      choose: 1,
      type: "land terrain",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(CIRCLE_OF_THE_LAND_TERRAIN_OPTIONS, "subclasses"),
      },
    },
  },
  createDruidSpellChoiceFeature(
    "druid-cantrips-2",
    4,
    "Cantrip",
    "Choose one additional Druid cantrip.",
    1,
    DRUID_CANTRIP_OPTIONS,
    "druid cantrip",
  ),
  createAbilityScoreImprovementFeature("druid-ability-score-improvement-1", 4, CASTER_FEAT_OPTIONS),
  createSimpleFeature(
    "druid-wild-resurgence",
    5,
    "Wild Resurgence",
    "When your spellcasting and transformation needs overlap, you can trade magical resources for more uses of Wild Shape or Channel Nature.",
  ),
  {
    index: "druid-subclass-feature-6",
    level: 6,
    name: "Subclass Feature",
    desc: [
      "Your druid circle grants a stronger signature feature at this level.",
      "Circle of the Land: Natural Recovery sustains your spellcasting across the adventuring day.",
      "Circle of the Moon: your beast shapes grow stronger and more flexible.",
      "Circle of the Sea: your ocean magic enhances mobility and battlefield control.",
      "Circle of the Stars: Cosmic Omen lets you weave favorable or unfavorable celestial signs.",
    ],
  },
  {
    index: "natural-recovery",
    level: 6,
    name: "Natural Recovery",
    desc: [
      "You recover magical power more efficiently through communion with the natural world.",
    ],
    subclass: {
      index: "circle-of-the-land",
      name: "Circle of the Land",
      url: "/api/2024/subclasses/circle-of-the-land",
    },
  },
  {
    index: "improved-circle-forms",
    level: 6,
    name: "Improved Circle Forms",
    desc: [
      "Your transformed shapes gain stronger combat presence and more reliable staying power.",
    ],
    subclass: {
      index: "circle-of-the-moon",
      name: "Circle of the Moon",
      url: "/api/2024/subclasses/circle-of-the-moon",
    },
  },
  {
    index: "oceanic-gift",
    level: 6,
    name: "Oceanic Gift",
    desc: [
      "Your control over water and storm deepens, enhancing movement and environmental command.",
    ],
    subclass: {
      index: "circle-of-the-sea",
      name: "Circle of the Sea",
      url: "/api/2024/subclasses/circle-of-the-sea",
    },
  },
  {
    index: "cosmic-omen",
    level: 6,
    name: "Cosmic Omen",
    desc: [
      "The stars whisper favorable and unfavorable signs that can bend key rolls.",
    ],
    subclass: {
      index: "circle-of-the-stars",
      name: "Circle of the Stars",
      url: "/api/2024/subclasses/circle-of-the-stars",
    },
  },
  {
    index: "druid-elemental-fury",
    level: 7,
    name: "Elemental Fury",
    desc: [
      "Choose a path for your nature magic to hit harder, either enhancing your cantrips or empowering your weapon strikes with primal force.",
      "Potent Spellcasting improves the damage of your Druid cantrips, while Primal Strike empowers weapon attacks with elemental force.",
    ],
    feature_specific: {
      choose: 1,
      type: "elemental fury",
      from: {
        option_set_type: "options_array",
        options: DRUID_ELEMENTAL_FURY_OPTIONS,
      },
    },
  },
  createAbilityScoreImprovementFeature("druid-ability-score-improvement-2", 8, CASTER_FEAT_OPTIONS),
  createDruidSpellChoiceFeature(
    "druid-cantrips-3",
    10,
    "Cantrip",
    "Choose one additional Druid cantrip.",
    1,
    DRUID_CANTRIP_OPTIONS,
    "druid cantrip",
  ),
  {
    index: "druid-subclass-feature-10",
    level: 10,
    name: "Subclass Feature",
    desc: [
      "Your druid circle grants a powerful mid-tier expression of its magic.",
      "Circle of the Land: Nature's Ward protects you against elemental and natural hazards.",
      "Circle of the Moon: your movement and transformation become more fluid and supernatural.",
      "Circle of the Sea: storm-soaked power turns you into a mobile force of sea and wind.",
      "Circle of the Stars: your constellations shine brighter and last with greater reliability.",
    ],
  },
  {
    index: "natures-ward",
    level: 10,
    name: "Nature's Ward",
    desc: [
      "The wild protects you from certain elemental, environmental, or natural hazards.",
    ],
    subclass: {
      index: "circle-of-the-land",
      name: "Circle of the Land",
      url: "/api/2024/subclasses/circle-of-the-land",
    },
  },
  {
    index: "moonlit-passage",
    level: 10,
    name: "Moonlit Passage",
    desc: [
      "You move through battle with supernatural lunar grace and improved transformational flexibility.",
    ],
    subclass: {
      index: "circle-of-the-moon",
      name: "Circle of the Moon",
      url: "/api/2024/subclasses/circle-of-the-moon",
    },
  },
  {
    index: "stormborn",
    level: 10,
    name: "Stormborn",
    desc: [
      "You gain exceptional mobility and battlefield presence through sea and storm magic.",
    ],
    subclass: {
      index: "circle-of-the-sea",
      name: "Circle of the Sea",
      url: "/api/2024/subclasses/circle-of-the-sea",
    },
  },
  {
    index: "twinkling-constellations",
    level: 10,
    name: "Twinkling Constellations",
    desc: [
      "Your Starry Form becomes more stable, flexible, and powerful.",
    ],
    subclass: {
      index: "circle-of-the-stars",
      name: "Circle of the Stars",
      url: "/api/2024/subclasses/circle-of-the-stars",
    },
  },
  createSimpleFeature(
    "druid-improved-elemental-fury",
    11,
    "Improved Elemental Fury",
    "Your chosen expression of Elemental Fury becomes significantly stronger, letting your primal offense scale into higher tiers of play.",
  ),
  createAbilityScoreImprovementFeature("druid-ability-score-improvement-3", 12, CASTER_FEAT_OPTIONS),
  {
    index: "druid-subclass-feature-14",
    level: 14,
    name: "Subclass Feature",
    desc: [
      "Your druid circle reaches its capstone expression.",
      "Circle of the Land: Nature's Sanctuary lets the wild itself shield and favor you.",
      "Circle of the Moon: lunar transformation peaks in a powerful apex form.",
      "Circle of the Sea: you become a devastating living current of storm and surf.",
      "Circle of the Stars: Full of Stars cloaks you in resilient celestial light.",
    ],
  },
  {
    index: "natures-sanctuary",
    level: 14,
    name: "Nature's Sanctuary",
    desc: [
      "Creatures of the natural world become less willing or less able to strike you directly.",
    ],
    subclass: {
      index: "circle-of-the-land",
      name: "Circle of the Land",
      url: "/api/2024/subclasses/circle-of-the-land",
    },
  },
  {
    index: "lunar-form",
    level: 14,
    name: "Lunar Form",
    desc: [
      "At your peak, moon-charged transformation becomes a defining and overwhelming expression of your magic.",
    ],
    subclass: {
      index: "circle-of-the-moon",
      name: "Circle of the Moon",
      url: "/api/2024/subclasses/circle-of-the-moon",
    },
  },
  {
    index: "seas-fury",
    level: 14,
    name: "Sea's Fury",
    desc: [
      "You become a devastating vessel of oceanic power, overwhelming foes with relentless elemental force.",
    ],
    subclass: {
      index: "circle-of-the-sea",
      name: "Circle of the Sea",
      url: "/api/2024/subclasses/circle-of-the-sea",
    },
  },
  {
    index: "full-of-stars",
    level: 14,
    name: "Full of Stars",
    desc: [
      "At your peak, celestial light wraps you in remarkable resilience.",
    ],
    subclass: {
      index: "circle-of-the-stars",
      name: "Circle of the Stars",
      url: "/api/2024/subclasses/circle-of-the-stars",
    },
  },
  createAbilityScoreImprovementFeature("druid-ability-score-improvement-4", 16, CASTER_FEAT_OPTIONS),
  createSimpleFeature(
    "druid-beast-spells",
    18,
    "Beast Spells",
    "You can cast many of your spells while transformed, letting Wild Shape and spellcasting work together much more naturally.",
  ),
  createEpicBoonFeature("druid-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Spell Recall is especially thematic for many druids."),
  createSimpleFeature(
    "druid-archdruid",
    20,
    "Archdruid",
    "Your mastery of nature peaks, greatly improving your access to Wild Shape and making your primal magic feel effortless.",
  ),
];

const FIGHTER_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  {
    index: "fighter-fighting-style",
    level: 1,
    name: "Fighting Style",
    desc: [
      "You adopt a martial style that shapes the way you approach battle.",
    ],
    feature_specific: {
      choose: 1,
      type: "fighting style",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(FIGHTING_STYLE_OPTIONS, "feats"),
      },
    },
  },
  {
    index: "fighter-weapon-mastery",
    level: 1,
    name: "Weapon Mastery",
    desc: [
      "You learn mastery properties that unlock special tactical benefits on weapons you know how to use.",
      "Choose three mastery properties to represent the weapons you currently understand best.",
    ],
    feature_specific: {
      choose: 3,
      type: "weapon mastery",
      from: {
        option_set_type: "options_array",
        options: WEAPON_MASTERY_PROPERTY_OPTIONS,
      },
    },
  },
  {
    index: "fighter-tactical-mind",
    level: 2,
    name: "Tactical Mind",
    desc: [
      "You can push yourself with disciplined focus when a critical ability check has to succeed.",
    ],
  },
  createSubclassChoiceFeature(
    "fighter-subclass",
    3,
    "Fighter",
    FIGHTER_SUBCLASSES,
    "Choose the martial path that defines your advanced battlefield training and subclass features.",
  ),
  {
    index: "fighter-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen fighter subclass grants its defining 3rd-level features.",
      "Battle Master learns maneuvers and superiority dice.",
      "Champion sharpens fundamental athleticism and critical accuracy.",
      "Eldritch Knight blends martial discipline with wizardry.",
      "Psi Warrior channels psionic force into defense, movement, and offense.",
    ],
  },
  {
    index: "combat-superiority",
    level: 3,
    name: "Combat Superiority",
    desc: [
      "You learn maneuvers fueled by superiority dice that let you push, trip, threaten, and control the field with tactical precision.",
    ],
    subclass: {
      index: "battle-master",
      name: "Battle Master",
      url: "/api/2024/subclasses/battle-master",
    },
  },
  {
    index: "student-of-war",
    level: 3,
    name: "Student of War",
    desc: [
      "Your martial studies grant a scholar-warrior edge outside direct attacks, reinforcing the Battle Master's analytical discipline.",
    ],
    subclass: {
      index: "battle-master",
      name: "Battle Master",
      url: "/api/2024/subclasses/battle-master",
    },
  },
  {
    index: "improved-critical",
    level: 3,
    name: "Improved Critical",
    desc: [
      "Your weapon attacks score a critical hit on a roll of 19 or 20 on the d20.",
    ],
    subclass: {
      index: "champion",
      name: "Champion",
      url: "/api/2024/subclasses/champion",
    },
  },
  {
    index: "eldritch-knight-spellcasting",
    level: 3,
    name: "Spellcasting",
    desc: [
      "You learn wizard spells that complement your martial role, adding protective magic and control to your fighting discipline.",
    ],
    subclass: {
      index: "eldritch-knight",
      name: "Eldritch Knight",
      url: "/api/2024/subclasses/eldritch-knight",
    },
  },
  {
    index: "war-bond",
    level: 3,
    name: "War Bond",
    desc: [
      "A bonded weapon remains part of your fighting identity and returns to your command when battle or distance would separate you.",
    ],
    subclass: {
      index: "eldritch-knight",
      name: "Eldritch Knight",
      url: "/api/2024/subclasses/eldritch-knight",
    },
  },
  {
    index: "fighter-psi-warrior-psionic-power",
    level: 3,
    name: "Psionic Power",
    desc: [
      "You gain a pool of psionic energy for protective bursts, forceful strikes, and subtle movement driven by disciplined will.",
    ],
    subclass: {
      index: "psi-warrior",
      name: "Psi Warrior",
      url: "/api/2024/subclasses/psi-warrior",
    },
  },
  {
    index: "telekinetic-adept",
    level: 3,
    name: "Telekinetic Adept",
    desc: [
      "Your control over movement and force sharpens into a defining combat tool, making telekinesis part of your martial style.",
    ],
    subclass: {
      index: "psi-warrior",
      name: "Psi Warrior",
      url: "/api/2024/subclasses/psi-warrior",
    },
  },
  createAbilityScoreImprovementFeature("fighter-ability-score-improvement-1", 4, MARTIAL_FEAT_OPTIONS),
  {
    index: "fighter-tactical-shift",
    level: 5,
    name: "Tactical Shift",
    desc: [
      "When you use Second Wind, you can reposition more effectively and keep pressure on the battlefield.",
    ],
  },
  createAbilityScoreImprovementFeature("fighter-ability-score-improvement-2", 6, MARTIAL_FEAT_OPTIONS),
  {
    index: "fighter-subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    desc: [
      "Your fighter subclass grants a stronger tactical benefit at this level.",
      "Battle Master adds a knowledge- and awareness-driven edge to combat assessment.",
      "Champion reinforces broad athletic excellence and heroism.",
      "Eldritch Knight develops weapon-and-spell synergy.",
      "Psi Warrior strengthens mental resilience and telekinetic control.",
    ],
  },
  {
    index: "know-your-enemy",
    level: 7,
    name: "Know Your Enemy",
    desc: [
      "You assess opposing combatants with a veteran's eye for strengths and weaknesses, helping you size up threats before committing.",
    ],
    subclass: {
      index: "battle-master",
      name: "Battle Master",
      url: "/api/2024/subclasses/battle-master",
    },
  },
  {
    index: "remarkable-athlete",
    level: 7,
    name: "Remarkable Athlete",
    desc: [
      "You develop broad athletic excellence that improves physical feats and mobility, reinforcing the Champion's mastery of fundamentals.",
    ],
    subclass: {
      index: "champion",
      name: "Champion",
      url: "/api/2024/subclasses/champion",
    },
  },
  {
    index: "war-magic",
    level: 7,
    name: "War Magic",
    desc: [
      "You weave spells and weapon attacks together in the same combat rhythm, tightening the Eldritch Knight's spell-and-steel cadence.",
    ],
    subclass: {
      index: "eldritch-knight",
      name: "Eldritch Knight",
      url: "/api/2024/subclasses/eldritch-knight",
    },
  },
  {
    index: "guarded-mind",
    level: 7,
    name: "Guarded Mind",
    desc: [
      "Your disciplined psyche resists hostile mental influence, helping your psionic focus remain intact under pressure.",
    ],
    subclass: {
      index: "psi-warrior",
      name: "Psi Warrior",
      url: "/api/2024/subclasses/psi-warrior",
    },
  },
  createAbilityScoreImprovementFeature("fighter-ability-score-improvement-3", 8, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "fighter-tactical-master",
    9,
    "Tactical Master",
    "Your weapon mastery options become more flexible in battle, letting you adapt your weapon techniques to the situation in front of you.",
  ),
  {
    index: "fighter-subclass-feature-10",
    level: 10,
    name: "Subclass Feature",
    desc: [
      "Your fighter subclass deepens its signature style.",
      "Battle Master expands maneuver expertise.",
      "Champion gains a second layer of specialized physical prowess.",
      "Eldritch Knight punishes foes opened up by spell-and-steel pressure.",
      "Psi Warrior gains a more forceful protective presence.",
    ],
  },
  {
    index: "improved-combat-superiority",
    level: 10,
    name: "Improved Combat Superiority",
    desc: [
      "Your superiority techniques become broader and more potent, pushing Battle Master control toward elite tactical mastery.",
    ],
    subclass: {
      index: "battle-master",
      name: "Battle Master",
      url: "/api/2024/subclasses/battle-master",
    },
  },
  {
    index: "heroic-warrior",
    level: 10,
    name: "Heroic Warrior",
    desc: [
      "You embody the ideal battle hero and gain stronger staying power or momentum in a fight through pure martial excellence.",
    ],
    subclass: {
      index: "champion",
      name: "Champion",
      url: "/api/2024/subclasses/champion",
    },
  },
  {
    index: "eldritch-strike",
    level: 10,
    name: "Eldritch Strike",
    desc: [
      "Your weapon pressure helps open enemies up to your magic, tightening the interaction between swordplay and spellcasting.",
    ],
    subclass: {
      index: "eldritch-knight",
      name: "Eldritch Knight",
      url: "/api/2024/subclasses/eldritch-knight",
    },
  },
  {
    index: "bulwark-of-force",
    level: 10,
    name: "Bulwark of Force",
    desc: [
      "You project a shield of psionic power to defend the party, making your discipline feel protective as well as offensive.",
    ],
    subclass: {
      index: "psi-warrior",
      name: "Psi Warrior",
      url: "/api/2024/subclasses/psi-warrior",
    },
  },
  createSimpleFeature(
    "fighter-two-extra-attacks",
    11,
    "Two Extra Attacks",
    "When you take the Attack action, you can make three attacks instead of two.",
  ),
  {
    index: "fighter-studied-attacks",
    level: 13,
    name: "Studied Attacks",
    desc: [
      "When you pressure a target over repeated attacks, your training helps you turn near misses into sharper later strikes.",
    ],
  },
  createAbilityScoreImprovementFeature("fighter-ability-score-improvement-4", 12, MARTIAL_FEAT_OPTIONS),
  createAbilityScoreImprovementFeature("fighter-ability-score-improvement-5", 14, MARTIAL_FEAT_OPTIONS),
  {
    index: "fighter-subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    desc: [
      "Your fighter subclass reaches a late-game tactical milestone.",
      "Battle Master gains staying power when maneuvers are most needed.",
      "Champion turns consistency into elite battlefield reliability.",
      "Eldritch Knight adds magical repositioning to martial pressure.",
      "Psi Warrior masters higher-order psionic technique.",
    ],
  },
  {
    index: "relentless",
    level: 15,
    name: "Relentless",
    desc: [
      "When the battle runs long, you regain enough focus to keep maneuvering, sustaining the Battle Master's control under pressure.",
    ],
    subclass: {
      index: "battle-master",
      name: "Battle Master",
      url: "/api/2024/subclasses/battle-master",
    },
  },
  {
    index: "superior-critical",
    level: 15,
    name: "Superior Critical",
    desc: [
      "Your weapon attacks score a critical hit on a roll of 18, 19, or 20 on the d20.",
    ],
    subclass: {
      index: "champion",
      name: "Champion",
      url: "/api/2024/subclasses/champion",
    },
  },
  {
    index: "arcane-charge",
    level: 15,
    name: "Arcane Charge",
    desc: [
      "You reposition through battle with forceful magical movement, making your offense and mobility feel increasingly arcane.",
    ],
    subclass: {
      index: "eldritch-knight",
      name: "Eldritch Knight",
      url: "/api/2024/subclasses/eldritch-knight",
    },
  },
  {
    index: "psi-powered-leap",
    level: 15,
    name: "Psi-Powered Leap",
    desc: [
      "You move through the field with startling telekinetic control and presence, turning mental force into mobility.",
    ],
    subclass: {
      index: "psi-warrior",
      name: "Psi Warrior",
      url: "/api/2024/subclasses/psi-warrior",
    },
  },
  createAbilityScoreImprovementFeature("fighter-ability-score-improvement-6", 16, MARTIAL_FEAT_OPTIONS),
  {
    index: "fighter-subclass-feature-18",
    level: 18,
    name: "Subclass Feature",
    desc: [
      "Your fighter subclass reaches its capstone expression.",
      "Battle Master perfects maneuver superiority.",
      "Champion becomes exceptionally hard to wear down.",
      "Eldritch Knight fully fuses arcane and martial mastery.",
      "Psi Warrior manifests its most powerful telekinetic force.",
    ],
  },
  {
    index: "supreme-combat-superiority",
    level: 18,
    name: "Supreme Combat Superiority",
    desc: [
      "Your maneuvers reach a capstone level of elite tactical mastery, letting the Battle Master dominate complex fights.",
    ],
    subclass: {
      index: "battle-master",
      name: "Battle Master",
      url: "/api/2024/subclasses/battle-master",
    },
  },
  {
    index: "survivor",
    level: 18,
    name: "Survivor",
    desc: [
      "At your peak, you recover from punishment with exceptional battlefield endurance, becoming very hard to wear down.",
    ],
    subclass: {
      index: "champion",
      name: "Champion",
      url: "/api/2024/subclasses/champion",
    },
  },
  {
    index: "improved-war-magic",
    level: 18,
    name: "Improved War Magic",
    desc: [
      "Your spell-and-steel engine reaches its capstone state, letting the Eldritch Knight blend arcane power and weapon pressure seamlessly.",
    ],
    subclass: {
      index: "eldritch-knight",
      name: "Eldritch Knight",
      url: "/api/2024/subclasses/eldritch-knight",
    },
  },
  {
    index: "telekinetic-master",
    level: 18,
    name: "Telekinetic Master",
    desc: [
      "Your psionic combat style reaches a capstone of overwhelming force and control, shaping the battlefield through sheer disciplined will.",
    ],
    subclass: {
      index: "psi-warrior",
      name: "Psi Warrior",
      url: "/api/2024/subclasses/psi-warrior",
    },
  },
  createEpicBoonFeature("fighter-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Combat Prowess is a natural fit for many fighters."),
  createSimpleFeature(
    "fighter-three-extra-attacks",
    20,
    "Three Extra Attacks",
    "When you take the Attack action, you can make four attacks instead of two.",
  ),
];

const MONK_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createSimpleFeature(
    "monks-focus",
    2,
    "Monk's Focus",
    "You gain Focus Points and the disciplined options powered by them, including Flurry of Blows, Patient Defense, and Step of the Wind.",
  ),
  createSimpleFeature(
    "monk-unarmored-movement",
    2,
    "Unarmored Movement",
    "Your speed increases while you aren't wearing armor or using a shield, letting your movement define your combat style.",
  ),
  createSimpleFeature(
    "monk-uncanny-metabolism",
    2,
    "Uncanny Metabolism",
    "Your disciplined body can rapidly recover inner energy, helping you regain Focus when a fight or rest demands it.",
  ),
  createSubclassChoiceFeature(
    "monk-subclass",
    3,
    "Monk",
    MONK_SUBCLASSES,
    "Choose the warrior tradition that shapes your higher-level discipline and subclass features.",
  ),
  {
    index: "monk-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen monk tradition grants its defining 3rd-level features.",
      "Warrior of Mercy balances healing and harmful strikes.",
      "Warrior of the Elements channels elemental force through disciplined motion.",
      "Warrior of the Open Hand perfects direct physical technique.",
      "Warrior of Shadow turns stealth and darkness into combat tools.",
    ],
  },
  {
    index: "mercy-hand-of-healing",
    level: 3,
    name: "Hand of Healing",
    desc: [
      "Your Warrior of Mercy training lets you turn restorative technique into swift battlefield aid, channeling healing through a disciplined touch.",
    ],
    subclass: {
      index: "warrior-of-mercy",
      name: "Warrior of Mercy",
      url: "/api/2024/subclasses/warrior-of-mercy",
    },
  },
  {
    index: "mercy-hand-of-harm",
    level: 3,
    name: "Hand of Harm",
    desc: [
      "Your Warrior of Mercy discipline also teaches lethal precision, letting you inflict extra necrotic pain when your strikes land cleanly.",
    ],
    subclass: {
      index: "warrior-of-mercy",
      name: "Warrior of Mercy",
      url: "/api/2024/subclasses/warrior-of-mercy",
    },
  },
  {
    index: "elements-elemental-attunement",
    level: 3,
    name: "Elemental Attunement",
    desc: [
      "As a Warrior of the Elements, you attune your Focus to elemental force, preparing your body to shape wind, flame, stone, water, and thunder through martial technique.",
    ],
    subclass: {
      index: "warrior-of-the-elements",
      name: "Warrior of the Elements",
      url: "/api/2024/subclasses/warrior-of-the-elements",
    },
  },
  {
    index: "elements-elemental-expression",
    level: 3,
    name: "Elemental Expression",
    desc: [
      "Your elemental discipline gives your strikes and movement a supernatural expression, extending your reach and letting your martial arts carry elemental pressure.",
    ],
    subclass: {
      index: "warrior-of-the-elements",
      name: "Warrior of the Elements",
      url: "/api/2024/subclasses/warrior-of-the-elements",
    },
  },
  {
    index: "open-hand-technique",
    level: 3,
    name: "Open Hand Technique",
    desc: [
      "Your Warrior of the Open Hand training lets your flurry manipulate balance and positioning, pushing, staggering, or denying reactions through precise strikes.",
    ],
    subclass: {
      index: "warrior-of-the-hand",
      name: "Warrior of the Open Hand",
      url: "/api/2024/subclasses/warrior-of-the-hand",
    },
  },
  {
    index: "shadow-arts",
    level: 3,
    name: "Shadow Arts",
    desc: [
      "Your Warrior of Shadow discipline grants magical techniques for darkness, silence, and concealment, turning stealth into a direct combat tool.",
    ],
    subclass: {
      index: "warrior-of-shadow",
      name: "Warrior of Shadow",
      url: "/api/2024/subclasses/warrior-of-shadow",
    },
  },
  createSimpleFeature(
    "deflect-attacks",
    3,
    "Deflect Attacks",
    "You can use your reaction and martial training to sharply reduce incoming weapon damage and sometimes redirect that pressure back at the attacker.",
  ),
  createAbilityScoreImprovementFeature("monk-ability-score-improvement-1", 4, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "monk-empowered-strikes",
    6,
    "Empowered Strikes",
    "Your unarmed strikes count as magically empowered, helping your martial arts break through foes that resist mundane attacks.",
  ),
  {
    index: "monk-subclass-feature-6",
    level: 6,
    name: "Subclass Feature",
    desc: [
      "Your monk tradition grants a stronger technique at this level.",
      "Mercy gains more dangerous and restorative touch techniques.",
      "Elements expands reach and elemental expression.",
      "Open Hand gains a stronger restorative or movement-focused discipline.",
      "Shadow refines movement through darkness and concealment.",
    ],
  },
  {
    index: "mercy-physicians-touch",
    level: 6,
    name: "Physician's Touch",
    desc: [
      "Your Warrior of Mercy techniques sharpen so that your healing and harming touch can also steady allies or debilitate enemies with precise pressure-point mastery.",
    ],
    subclass: {
      index: "warrior-of-mercy",
      name: "Warrior of Mercy",
      url: "/api/2024/subclasses/warrior-of-mercy",
    },
  },
  {
    index: "reach-of-the-elements",
    level: 6,
    name: "Reach of the Elements",
    desc: [
      "Your Warrior of the Elements discipline stretches farther across the battlefield, increasing the range and force with which elemental technique shapes a fight.",
    ],
    subclass: {
      index: "warrior-of-the-elements",
      name: "Warrior of the Elements",
      url: "/api/2024/subclasses/warrior-of-the-elements",
    },
  },
  {
    index: "wholeness-of-body",
    level: 6,
    name: "Wholeness of Body",
    desc: [
      "Your Warrior of the Open Hand training lets you restore yourself through disciplined focus, turning inner balance into practical endurance.",
    ],
    subclass: {
      index: "warrior-of-the-hand",
      name: "Warrior of the Open Hand",
      url: "/api/2024/subclasses/warrior-of-the-hand",
    },
  },
  {
    index: "shadow-step",
    level: 6,
    name: "Shadow Step",
    desc: [
      "Your Warrior of Shadow technique lets you move between dim light and darkness with startling speed, repositioning before enemies can answer.",
    ],
    subclass: {
      index: "warrior-of-shadow",
      name: "Warrior of Shadow",
      url: "/api/2024/subclasses/warrior-of-shadow",
    },
  },
  createSimpleFeature(
    "monk-acrobatic-movement",
    9,
    "Acrobatic Movement",
    "Your mobility improves further, letting you run across surfaces and move through environments that would stop most combatants.",
  ),
  createSimpleFeature(
    "monk-heightened-focus",
    10,
    "Heightened Focus",
    "Your mastery of Focus improves, making your discipline techniques more reliable and rewarding when they land cleanly.",
  ),
  createAbilityScoreImprovementFeature("monk-ability-score-improvement-2", 8, MARTIAL_FEAT_OPTIONS),
  {
    index: "monk-subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    desc: [
      "Your monk tradition gains a mature signature feature.",
      "Mercy blends healing and harm into flurries of precise pressure.",
      "Elements empowers motion, reach, and elemental control.",
      "Open Hand reaches a high expression of speed, poise, and pressure.",
      "Shadow becomes far more elusive and threatening from concealment.",
    ],
  },
  {
    index: "mercy-flurry-of-healing-and-harm",
    level: 11,
    name: "Flurry of Healing and Harm",
    desc: [
      "Your Warrior of Mercy flurries can blend restoration and devastation in a single flowing sequence, making your signature techniques faster and more efficient.",
    ],
    subclass: {
      index: "warrior-of-mercy",
      name: "Warrior of Mercy",
      url: "/api/2024/subclasses/warrior-of-mercy",
    },
  },
  {
    index: "stride-of-the-elements",
    level: 11,
    name: "Stride of the Elements",
    desc: [
      "Your Warrior of the Elements movement becomes more supernatural, letting you cut through the battlefield with elemental speed and presence.",
    ],
    subclass: {
      index: "warrior-of-the-elements",
      name: "Warrior of the Elements",
      url: "/api/2024/subclasses/warrior-of-the-elements",
    },
  },
  {
    index: "fleet-step",
    level: 11,
    name: "Fleet Step",
    desc: [
      "Your Warrior of the Open Hand footwork reaches a new level of poise, making it even easier to control tempo and positioning in battle.",
    ],
    subclass: {
      index: "warrior-of-the-hand",
      name: "Warrior of the Open Hand",
      url: "/api/2024/subclasses/warrior-of-the-hand",
    },
  },
  {
    index: "cloak-of-shadows",
    level: 11,
    name: "Cloak of Shadows",
    desc: [
      "Your Warrior of Shadow discipline lets you fade from easy sight, controlling the engagement through concealment and perfect timing.",
    ],
    subclass: {
      index: "warrior-of-shadow",
      name: "Warrior of Shadow",
      url: "/api/2024/subclasses/warrior-of-shadow",
    },
  },
  createAbilityScoreImprovementFeature("monk-ability-score-improvement-3", 12, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "monk-self-restoration",
    13,
    "Self-Restoration",
    "You can turn inward to end certain conditions on yourself and restore control over your body and focus.",
  ),
  createSimpleFeature(
    "monk-disciplined-survivor",
    14,
    "Disciplined Survivor",
    "Your discipline strengthens all of your saving throws and gives you tools to push through danger that would break others.",
  ),
  createSimpleFeature(
    "monk-perfect-focus",
    15,
    "Perfect Focus",
    "When initiative begins and your reserves are low, your discipline restores enough Focus to keep your techniques online.",
  ),
  createAbilityScoreImprovementFeature("monk-ability-score-improvement-4", 16, MARTIAL_FEAT_OPTIONS),
  {
    index: "monk-subclass-feature-17",
    level: 17,
    name: "Subclass Feature",
    desc: [
      "Your monk tradition reaches its capstone technique.",
      "Mercy masters life-and-death pressure points.",
      "Elements becomes a nearly unstoppable force of elemental motion.",
      "Open Hand culminates in a legendary finishing technique.",
      "Shadow reaches apex stealth and lethal timing.",
    ],
  },
  {
    index: "hand-of-ultimate-mercy",
    level: 17,
    name: "Hand of Ultimate Mercy",
    desc: [
      "Your Warrior of Mercy mastery reaches a miraculous peak, allowing your healing touch to pull an ally back from death with extraordinary restorative force.",
    ],
    subclass: {
      index: "warrior-of-mercy",
      name: "Warrior of Mercy",
      url: "/api/2024/subclasses/warrior-of-mercy",
    },
  },
  {
    index: "elemental-epitome",
    level: 17,
    name: "Elemental Epitome",
    desc: [
      "Your Warrior of the Elements training culminates in a near-perfect union of body and elemental power, dramatically increasing your battlefield presence.",
    ],
    subclass: {
      index: "warrior-of-the-elements",
      name: "Warrior of the Elements",
      url: "/api/2024/subclasses/warrior-of-the-elements",
    },
  },
  {
    index: "quivering-palm",
    level: 17,
    name: "Quivering Palm",
    desc: [
      "Your Warrior of the Open Hand training grants a legendary finishing technique that can leave a foe reeling or bring them down with a single precise touch.",
    ],
    subclass: {
      index: "warrior-of-the-hand",
      name: "Warrior of the Open Hand",
      url: "/api/2024/subclasses/warrior-of-the-hand",
    },
  },
  {
    index: "opportunist",
    level: 17,
    name: "Opportunist",
    desc: [
      "Your Warrior of Shadow mastery lets you punish enemy openings with sudden strikes, turning distraction and poor positioning into immediate harm.",
    ],
    subclass: {
      index: "warrior-of-shadow",
      name: "Warrior of Shadow",
      url: "/api/2024/subclasses/warrior-of-shadow",
    },
  },
  createSimpleFeature(
    "monk-superior-defense",
    18,
    "Superior Defense",
    "You can spend Focus to become extraordinarily hard to harm, pairing resilience with the speed and poise of a grandmaster.",
  ),
  createEpicBoonFeature("monk-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Combat Prowess and Boon of the Night Spirit are both strong monk fits."),
  createSimpleFeature(
    "monk-body-and-mind",
    20,
    "Body and Mind",
    "Your body and spirit reach a perfected state, heightening both your physical capability and your core mental discipline.",
  ),
];

const PALADIN_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createSimpleFeature(
    "paladin-spellcasting",
    1,
    "Spellcasting",
    "You prepare and cast Paladin spells through devotion and conviction, using Charisma as your spellcasting ability.",
  ),
  {
    index: "paladin-weapon-mastery",
    level: 1,
    name: "Weapon Mastery",
    desc: [
      "You learn mastery properties that let your chosen weapons express more control, pressure, or battlefield utility.",
      "Choose two mastery properties to represent the weapons you currently understand best.",
    ],
    feature_specific: {
      choose: 2,
      type: "weapon mastery",
      from: {
        option_set_type: "options_array",
        options: WEAPON_MASTERY_PROPERTY_OPTIONS,
      },
    },
  },
  {
    index: "paladin-fighting-style",
    level: 2,
    name: "Fighting Style",
    desc: [
      "You adopt a martial style that complements your sacred calling.",
    ],
    feature_specific: {
      choose: 1,
      type: "fighting style",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(FIGHTING_STYLE_OPTIONS, "feats"),
      },
    },
  },
  createSimpleFeature(
    "paladins-smite",
    2,
    "Paladin's Smite",
    "Your divine magic fuels special Smite spells, giving your weapon attacks holy burst damage and tactical radiant pressure.",
  ),
  createSimpleFeature(
    "paladin-channel-divinity",
    3,
    "Channel Divinity",
    "You channel sacred power to fuel divine effects, including oath-based options once you commit to a subclass.",
  ),
  createSubclassChoiceFeature(
    "paladin-subclass",
    3,
    "Paladin",
    PALADIN_SUBCLASSES,
    "Choose the oath that guides your divine ideals and your later subclass features.",
  ),
  {
    index: "paladin-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your sacred oath grants its defining 3rd-level features, usually Oath Spells and Channel Divinity options.",
      "Devotion stands for honesty, virtue, and radiant purity.",
      "Glory celebrates heroic excellence and inspirational might.",
      "The Ancients protects life, beauty, and enduring light.",
      "Vengeance hunts down dangerous foes with relentless purpose.",
    ],
  },
  {
    index: "devotion-oath-spells",
    level: 3,
    name: "Oath Spells",
    desc: [
      "Your Oath of Devotion always prepares a set of radiant and protective spells that reinforce honesty, courage, and holy resolve.",
    ],
    subclass: {
      index: "oath-of-devotion",
      name: "Oath of Devotion",
      url: "/api/2024/subclasses/oath-of-devotion",
    },
  },
  {
    index: "devotion-sacred-weapon",
    level: 3,
    name: "Sacred Weapon",
    desc: [
      "Your Channel Divinity can turn your weapon into a beacon of holy accuracy, letting devotion guide your blows with divine certainty.",
    ],
    subclass: {
      index: "oath-of-devotion",
      name: "Oath of Devotion",
      url: "/api/2024/subclasses/oath-of-devotion",
    },
  },
  {
    index: "devotion-turn-the-unholy",
    level: 3,
    name: "Turn the Unholy",
    desc: [
      "Your faith can repel fiends and undead, forcing impure foes to yield before the strength of your devotion.",
    ],
    subclass: {
      index: "oath-of-devotion",
      name: "Oath of Devotion",
      url: "/api/2024/subclasses/oath-of-devotion",
    },
  },
  {
    index: "glory-oath-spells",
    level: 3,
    name: "Oath Spells",
    desc: [
      "Your Oath of Glory always prepares heroic, momentum-driven spells that support athletic excellence and legendary exploits.",
    ],
    subclass: {
      index: "oath-of-glory",
      name: "Oath of Glory",
      url: "/api/2024/subclasses/oath-of-glory",
    },
  },
  {
    index: "glory-inspiring-smite",
    level: 3,
    name: "Inspiring Smite",
    desc: [
      "Your smites can be transformed into bursts of encouragement, turning divine offense into a source of resilience for allies.",
    ],
    subclass: {
      index: "oath-of-glory",
      name: "Oath of Glory",
      url: "/api/2024/subclasses/oath-of-glory",
    },
  },
  {
    index: "glory-peerless-athlete",
    level: 3,
    name: "Peerless Athlete",
    desc: [
      "Your Channel Divinity heightens athletic greatness beyond ordinary mortal limits, making heroic movement and force feel effortless.",
    ],
    subclass: {
      index: "oath-of-glory",
      name: "Oath of Glory",
      url: "/api/2024/subclasses/oath-of-glory",
    },
  },
  {
    index: "ancients-oath-spells",
    level: 3,
    name: "Oath Spells",
    desc: [
      "Your Oath of the Ancients always prepares nature- and light-themed spells that defend life, beauty, and hope.",
    ],
    subclass: {
      index: "oath-of-the-ancients",
      name: "Oath of the Ancients",
      url: "/api/2024/subclasses/oath-of-the-ancients",
    },
  },
  {
    index: "ancients-natures-wrath",
    level: 3,
    name: "Nature's Wrath",
    desc: [
      "Your Channel Divinity can bind an enemy in restraining natural force, turning the living world itself against those who threaten it.",
    ],
    subclass: {
      index: "oath-of-the-ancients",
      name: "Oath of the Ancients",
      url: "/api/2024/subclasses/oath-of-the-ancients",
    },
  },
  {
    index: "ancients-turn-the-faithless",
    level: 3,
    name: "Turn the Faithless",
    desc: [
      "Your oath can drive away certain fey and fiends, forcing hostile supernatural creatures to recoil from your ancient light.",
    ],
    subclass: {
      index: "oath-of-the-ancients",
      name: "Oath of the Ancients",
      url: "/api/2024/subclasses/oath-of-the-ancients",
    },
  },
  {
    index: "vengeance-oath-spells",
    level: 3,
    name: "Oath Spells",
    desc: [
      "Your Oath of Vengeance always prepares pursuit, control, and punishing strike spells that keep dangerous foes under pressure.",
    ],
    subclass: {
      index: "oath-of-vengeance",
      name: "Oath of Vengeance",
      url: "/api/2024/subclasses/oath-of-vengeance",
    },
  },
  {
    index: "vengeance-abjure-enemy",
    level: 3,
    name: "Abjure Enemy",
    desc: [
      "Your Channel Divinity can terrify or pin down a chosen foe, helping you control the enemy you are sworn to hunt.",
    ],
    subclass: {
      index: "oath-of-vengeance",
      name: "Oath of Vengeance",
      url: "/api/2024/subclasses/oath-of-vengeance",
    },
  },
  {
    index: "vengeance-vow-of-enmity",
    level: 3,
    name: "Vow of Enmity",
    desc: [
      "You focus your wrath on a chosen enemy with relentless accuracy, making it far harder for that target to escape your judgment.",
    ],
    subclass: {
      index: "oath-of-vengeance",
      name: "Oath of Vengeance",
      url: "/api/2024/subclasses/oath-of-vengeance",
    },
  },
  createAbilityScoreImprovementFeature("paladin-ability-score-improvement-1", 4, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "faithful-steed",
    5,
    "Faithful Steed",
    "You can call a loyal magical mount whose presence reinforces the classic mounted-paladin fantasy and battlefield reach.",
  ),
  {
    index: "paladin-subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    desc: [
      "Your sacred oath deepens with an aura or battlefield-support feature at this level.",
      "Devotion radiates faith and resistance to corrupting influence.",
      "Glory inspires motion and heroic momentum.",
      "The Ancients wards against hostile magic.",
      "Vengeance turns pursuit into tactical pressure.",
    ],
  },
  {
    index: "devotion-aura-of-devotion",
    level: 7,
    name: "Aura of Devotion",
    desc: [
      "Your holy presence helps shield nearby allies from charm and corruption. While in your aura, you and allies can't be Charmed.",
    ],
    subclass: {
      index: "oath-of-devotion",
      name: "Oath of Devotion",
      url: "/api/2024/subclasses/oath-of-devotion",
    },
  },
  {
    index: "glory-aura-of-alacrity",
    level: 7,
    name: "Aura of Alacrity",
    desc: [
      "Your heroic momentum spills outward, helping allies near you move with greater urgency and confidence.",
    ],
    subclass: {
      index: "oath-of-glory",
      name: "Oath of Glory",
      url: "/api/2024/subclasses/oath-of-glory",
    },
  },
  {
    index: "ancients-aura-of-warding",
    level: 7,
    name: "Aura of Warding",
    desc: [
      "Your ancient light helps shield allies from hostile spell damage. While in your aura, you and allies have resistance to all damage from spells.",
    ],
    subclass: {
      index: "oath-of-the-ancients",
      name: "Oath of the Ancients",
      url: "/api/2024/subclasses/oath-of-the-ancients",
    },
  },
  {
    index: "vengeance-relentless-avenger",
    level: 7,
    name: "Relentless Avenger",
    desc: [
      "You pursue enemies with supernatural tenacity after striking them, staying on the heels of the foe you mean to end.",
    ],
    subclass: {
      index: "oath-of-vengeance",
      name: "Oath of Vengeance",
      url: "/api/2024/subclasses/oath-of-vengeance",
    },
  },
  createAbilityScoreImprovementFeature("paladin-ability-score-improvement-2", 8, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "abjure-foes",
    9,
    "Abjure Foes",
    "Your divine authority can restrain enemy movement and confidence, forcing hostile creatures to contend with sacred pressure.",
  ),
  createSimpleFeature(
    "aura-of-courage",
    10,
    "Aura of Courage",
    "Your courage radiates outward. While in your aura, you and allies can't be Frightened.",
  ),
  createSimpleFeature(
    "radiant-strikes",
    11,
    "Radiant Strikes",
    "Your weapon hits naturally carry radiant force, adding holy damage to your attacks without needing a separate Smite spell each time.",
  ),
  createAbilityScoreImprovementFeature("paladin-ability-score-improvement-3", 12, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "restoring-touch",
    14,
    "Restoring Touch",
    "You can spend energy from Lay On Hands to remove harmful conditions and restore allies more flexibly in the middle of danger.",
  ),
  {
    index: "paladin-subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    desc: [
      "Your sacred oath grants a powerful late-game expression of its ideals.",
      "Devotion becomes purer and harder to corrupt.",
      "Glory adds a heroic defensive or countering flourish.",
      "The Ancients gains strong staying power against defeat.",
      "Vengeance becomes harder to escape and deadlier to oppose.",
    ],
  },
  {
    index: "devotion-smite-of-protection",
    level: 15,
    name: "Smite of Protection",
    desc: [
      "Your smites can wrap you or an ally in extra divine safety, blending offense and guardianship in a single holy answer.",
    ],
    subclass: {
      index: "oath-of-devotion",
      name: "Oath of Devotion",
      url: "/api/2024/subclasses/oath-of-devotion",
    },
  },
  {
    index: "glory-glorious-defense",
    level: 15,
    name: "Glorious Defense",
    desc: [
      "You answer enemy attacks with a heroic protective flourish, turning danger into a moment for legendary intervention.",
    ],
    subclass: {
      index: "oath-of-glory",
      name: "Oath of Glory",
      url: "/api/2024/subclasses/oath-of-glory",
    },
  },
  {
    index: "ancients-undying-sentinel",
    level: 15,
    name: "Undying Sentinel",
    desc: [
      "Your oath makes you exceptionally hard to kill, helping you remain standing when others would fall.",
    ],
    subclass: {
      index: "oath-of-the-ancients",
      name: "Oath of the Ancients",
      url: "/api/2024/subclasses/oath-of-the-ancients",
    },
  },
  {
    index: "vengeance-soul-of-vengeance",
    level: 15,
    name: "Soul of Vengeance",
    desc: [
      "Your vow lets you answer the sworn enemy's actions with punishing follow-through, tightening your grip on the hunt.",
    ],
    subclass: {
      index: "oath-of-vengeance",
      name: "Oath of Vengeance",
      url: "/api/2024/subclasses/oath-of-vengeance",
    },
  },
  createAbilityScoreImprovementFeature("paladin-ability-score-improvement-4", 16, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "aura-expansion",
    18,
    "Aura Expansion",
    "The range of your Paladin auras expands, letting your sacred presence protect or empower allies across a much larger space.",
  ),
  {
    index: "paladin-subclass-feature-20",
    level: 20,
    name: "Subclass Feature",
    desc: [
      "Your sacred oath reaches its capstone transformation.",
      "Devotion blazes with holy radiance.",
      "Glory embodies legendary heroic perfection.",
      "The Ancients manifests primal ancient power.",
      "Vengeance becomes an unstoppable angel of pursuit.",
    ],
  },
  {
    index: "devotion-holy-nimbus",
    level: 20,
    name: "Holy Nimbus",
    desc: [
      "You blaze with divine radiance that burns enemies and magnifies your sacred presence at the height of your devotion.",
    ],
    subclass: {
      index: "oath-of-devotion",
      name: "Oath of Devotion",
      url: "/api/2024/subclasses/oath-of-devotion",
    },
  },
  {
    index: "glory-living-legend",
    level: 20,
    name: "Living Legend",
    desc: [
      "You become a near-mythic champion whose deeds inspire allies and overwhelm opposition.",
    ],
    subclass: {
      index: "oath-of-glory",
      name: "Oath of Glory",
      url: "/api/2024/subclasses/oath-of-glory",
    },
  },
  {
    index: "ancients-elder-champion",
    level: 20,
    name: "Elder Champion",
    desc: [
      "Ancient primal light transforms you into a radiant guardian whose endurance and presence embody the old ways of life and hope.",
    ],
    subclass: {
      index: "oath-of-the-ancients",
      name: "Oath of the Ancients",
      url: "/api/2024/subclasses/oath-of-the-ancients",
    },
  },
  {
    index: "vengeance-avenging-angel",
    level: 20,
    name: "Avenging Angel",
    desc: [
      "You become a terrifying winged instrument of divine judgment, making escape and resistance far harder for your quarry.",
    ],
    subclass: {
      index: "oath-of-vengeance",
      name: "Oath of Vengeance",
      url: "/api/2024/subclasses/oath-of-vengeance",
    },
  },
  createEpicBoonFeature("paladin-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Fate and Boon of Combat Prowess are especially paladin-like choices."),
];

const RANGER_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createSimpleFeature(
    "ranger-deft-explorer",
    1,
    "Deft Explorer",
    "Your training makes you an adaptable wilderness specialist, improving the way you travel, survive, and work with the world around you.",
  ),
  createSimpleFeature(
    "ranger-favored-enemy",
    1,
    "Favored Enemy",
    "You become especially dangerous to marked foes and learn to treat Hunter's Mark as a core part of your hunting style.",
  ),
  createSimpleFeature(
    "ranger-spellcasting",
    1,
    "Spellcasting",
    "You prepare and cast Ranger spells tied to primal skill, awareness, and pursuit, using Wisdom as your spellcasting ability.",
  ),
  {
    index: "ranger-weapon-mastery",
    level: 1,
    name: "Weapon Mastery",
    desc: [
      "You learn weapon mastery properties that enhance your practical hunting and skirmishing tactics.",
      "Choose two mastery properties to reflect the weapons you rely on most in the field.",
    ],
    feature_specific: {
      choose: 2,
      type: "weapon mastery",
      from: {
        option_set_type: "options_array",
        options: WEAPON_MASTERY_PROPERTY_OPTIONS,
      },
    },
  },
  {
    index: "ranger-fighting-style",
    level: 2,
    name: "Fighting Style",
    desc: [
      "You adopt a martial style that supports the way you hunt and survive.",
    ],
    feature_specific: {
      choose: 1,
      type: "fighting style",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(RANGER_FIGHTING_STYLE_OPTIONS, "feats"),
      },
    },
  },
  createSimpleFeature(
    "ranger-roving",
    3,
    "Roving",
    "Your movement improves across the battlefield and the wilderness, helping you stay mobile over rough ground and long pursuits.",
  ),
  createSubclassChoiceFeature(
    "ranger-subclass",
    3,
    "Ranger",
    RANGER_SUBCLASSES,
    "Choose the archetype that shapes your specialized hunting style and later subclass features.",
  ),
  {
    index: "ranger-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen ranger archetype grants its defining 3rd-level features.",
      "Beast Master bonds with an animal companion.",
      "Fey Wanderer blends wandering steel with fey glamour.",
      "Gloom Stalker thrives in darkness, ambushes, and unseen pressure.",
      "Hunter perfects practical battlefield techniques against prey.",
    ],
  },
  {
    index: "beast-master-rangers-companion",
    level: 3,
    name: "Ranger's Companion",
    desc: [
      "You gain a trusted beast ally that fights, scouts, and survives beside you as a core part of your hunting style.",
    ],
    subclass: {
      index: "beast-master",
      name: "Beast Master",
      url: "/api/2024/subclasses/beast-master",
    },
  },
  {
    index: "beast-master-primal-bond",
    level: 3,
    name: "Primal Bond",
    desc: [
      "Your teamwork with the companion shapes how you command and support it, making the bond itself a tactical advantage.",
    ],
    subclass: {
      index: "beast-master",
      name: "Beast Master",
      url: "/api/2024/subclasses/beast-master",
    },
  },
  {
    index: "fey-wanderer-dreadful-strikes",
    level: 3,
    name: "Dreadful Strikes",
    desc: [
      "Your attacks carry a sting of otherworldly force, letting your weapon pressure feel distinctly fey and unsettling.",
    ],
    subclass: {
      index: "fey-wanderer",
      name: "Fey Wanderer",
      url: "/api/2024/subclasses/fey-wanderer",
    },
  },
  {
    index: "fey-wanderer-magic",
    level: 3,
    name: "Fey Wanderer Magic",
    desc: [
      "You always have a suite of fey-themed spells prepared, reinforcing your identity as a ranger touched by the Feywild.",
    ],
    subclass: {
      index: "fey-wanderer",
      name: "Fey Wanderer",
      url: "/api/2024/subclasses/fey-wanderer",
    },
  },
  {
    index: "fey-wanderer-otherworldly-glamour",
    level: 3,
    name: "Otherworldly Glamour",
    desc: [
      "Your presence gains a compelling supernatural edge, helping your charm and confidence feel unmistakably fey.",
    ],
    subclass: {
      index: "fey-wanderer",
      name: "Fey Wanderer",
      url: "/api/2024/subclasses/fey-wanderer",
    },
  },
  {
    index: "gloom-stalker-dread-ambusher",
    level: 3,
    name: "Dread Ambusher",
    desc: [
      "You dominate the opening moments of combat with speed, damage, and initiative pressure from the shadows.",
    ],
    subclass: {
      index: "gloom-stalker",
      name: "Gloom Stalker",
      url: "/api/2024/subclasses/gloom-stalker",
    },
  },
  {
    index: "gloom-stalker-umbral-sight",
    level: 3,
    name: "Umbral Sight",
    desc: [
      "Darkness becomes an ally rather than an obstacle, supporting your role as a hunter who thrives where others lose certainty.",
    ],
    subclass: {
      index: "gloom-stalker",
      name: "Gloom Stalker",
      url: "/api/2024/subclasses/gloom-stalker",
    },
  },
  {
    index: "hunters-lore",
    level: 3,
    name: "Hunter's Lore",
    desc: [
      "Your knowledge of quarry helps you pick the right tactic at the right time, making you a practical expert against dangerous prey.",
    ],
    subclass: {
      index: "hunter",
      name: "Hunter",
      url: "/api/2024/subclasses/hunter",
    },
  },
  {
    index: "hunters-prey",
    level: 3,
    name: "Hunter's Prey",
    desc: [
      "You choose a signature offensive technique tailored to wearing prey down and punishing the enemies you study best.",
    ],
    subclass: {
      index: "hunter",
      name: "Hunter",
      url: "/api/2024/subclasses/hunter",
    },
  },
  createAbilityScoreImprovementFeature("ranger-ability-score-improvement-1", 4, MARTIAL_FEAT_OPTIONS),
  {
    index: "ranger-expertise",
    level: 6,
    name: "Expertise",
    desc: [
      "Choose one of your proficient Ranger skills and double your Proficiency Bonus for checks that use it.",
    ],
    feature_specific: {
      choose: 1,
      type: "expertise",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(RANGER_SKILL_OPTIONS, "proficiencies"),
      },
    },
  },
  {
    index: "ranger-subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    desc: [
      "Your ranger archetype grants a stronger tactical feature at this level.",
      "Beast Master sharpens coordination with the companion.",
      "Fey Wanderer twists failed effects back onto the enemy.",
      "Gloom Stalker fortifies the mind against magical pressure.",
      "Hunter gains stronger defensive hunting technique.",
    ],
  },
  {
    index: "beast-master-exceptional-training",
    level: 7,
    name: "Exceptional Training",
    desc: [
      "Your companion becomes better trained, more responsive, and more useful in complex situations, reflecting the depth of your bond.",
    ],
    subclass: {
      index: "beast-master",
      name: "Beast Master",
      url: "/api/2024/subclasses/beast-master",
    },
  },
  {
    index: "fey-wanderer-beguiling-twist",
    level: 7,
    name: "Beguiling Twist",
    desc: [
      "You can redirect failed charm and fear effects back through fey mischief, turning enemy control into your own advantage.",
    ],
    subclass: {
      index: "fey-wanderer",
      name: "Fey Wanderer",
      url: "/api/2024/subclasses/fey-wanderer",
    },
  },
  {
    index: "gloom-stalker-iron-mind",
    level: 7,
    name: "Iron Mind",
    desc: [
      "Your resolve hardens against mental interference, making you far harder to bend or distract in dangerous darkness.",
    ],
    subclass: {
      index: "gloom-stalker",
      name: "Gloom Stalker",
      url: "/api/2024/subclasses/gloom-stalker",
    },
  },
  {
    index: "hunter-defensive-tactics",
    level: 7,
    name: "Defensive Tactics",
    desc: [
      "Experience in dangerous hunts teaches you how to survive brutal counterattacks and stay alive against stronger prey.",
    ],
    subclass: {
      index: "hunter",
      name: "Hunter",
      url: "/api/2024/subclasses/hunter",
    },
  },
  createAbilityScoreImprovementFeature("ranger-ability-score-improvement-2", 8, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "ranger-tireless",
    9,
    "Tireless",
    "Your endurance improves, letting you push through exhaustion and recover with stubborn frontier resilience.",
  ),
  createSimpleFeature(
    "ranger-natures-veil",
    10,
    "Nature's Veil",
    "You can fade from sight using primal magic, briefly becoming difficult to track or target when you need to reposition.",
  ),
  {
    index: "ranger-subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    desc: [
      "Your ranger archetype reaches a potent mid-tier milestone.",
      "Beast Master's companion becomes deadlier and more autonomous in battle.",
      "Fey Wanderer calls on fey assistance or stronger magical pressure.",
      "Gloom Stalker punishes missed attacks with relentless follow-through.",
      "Hunter refines its most dangerous prey-specific offense.",
    ],
  },
  {
    index: "beast-master-bestial-fury",
    level: 11,
    name: "Bestial Fury",
    desc: [
      "Your companion's offensive pressure improves dramatically, letting your two-creature teamwork hit much harder in battle.",
    ],
    subclass: {
      index: "beast-master",
      name: "Beast Master",
      url: "/api/2024/subclasses/beast-master",
    },
  },
  {
    index: "fey-wanderer-fey-reinforcements",
    level: 11,
    name: "Fey Reinforcements",
    desc: [
      "You can call on stronger fey aid and magical companionship, deepening the support your subclass brings to the field.",
    ],
    subclass: {
      index: "fey-wanderer",
      name: "Fey Wanderer",
      url: "/api/2024/subclasses/fey-wanderer",
    },
  },
  {
    index: "gloom-stalker-stalkers-flurry",
    level: 11,
    name: "Stalker's Flurry",
    desc: [
      "Missed attacks become harder for your prey to escape, letting you keep pressure high even when a strike goes astray.",
    ],
    subclass: {
      index: "gloom-stalker",
      name: "Gloom Stalker",
      url: "/api/2024/subclasses/gloom-stalker",
    },
  },
  {
    index: "hunter-superior-hunters-prey",
    level: 11,
    name: "Superior Hunter's Prey",
    desc: [
      "Your preferred offensive hunting technique becomes deadlier and more flexible, sharpening the identity of your chosen prey answer.",
    ],
    subclass: {
      index: "hunter",
      name: "Hunter",
      url: "/api/2024/subclasses/hunter",
    },
  },
  createAbilityScoreImprovementFeature("ranger-ability-score-improvement-3", 12, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "ranger-relentless-hunter",
    13,
    "Relentless Hunter",
    "You can pursue marked prey with even less friction, keeping pressure up without sacrificing movement or action economy.",
  ),
  createSimpleFeature(
    "ranger-precise-hunter",
    14,
    "Precise Hunter",
    "Your attacks against marked foes become even more consistent, reflecting a hunter who almost never wastes a clean opening.",
  ),
  {
    index: "ranger-subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    desc: [
      "Your ranger archetype reaches its late-game defensive or mobility expression.",
      "Beast Master shares magic or synergy directly with the companion.",
      "Fey Wanderer moves through space with fey grace.",
      "Gloom Stalker becomes extremely difficult to pin down in battle.",
      "Hunter perfects its top-end defensive response to enemy attacks.",
    ],
  },
  {
    index: "beast-master-share-spells",
    level: 15,
    name: "Share Spells",
    desc: [
      "Your magic and your companion's presence become tightly intertwined, letting spells and bond work as one seamless hunting tool.",
    ],
    subclass: {
      index: "beast-master",
      name: "Beast Master",
      url: "/api/2024/subclasses/beast-master",
    },
  },
  {
    index: "fey-wanderer-misty-wanderer",
    level: 15,
    name: "Misty Wanderer",
    desc: [
      "You reposition with effortless fey motion and protect allies through that movement, bringing Feywild grace directly into combat.",
    ],
    subclass: {
      index: "fey-wanderer",
      name: "Fey Wanderer",
      url: "/api/2024/subclasses/fey-wanderer",
    },
  },
  {
    index: "gloom-stalker-shadowy-dodge",
    level: 15,
    name: "Shadowy Dodge",
    desc: [
      "At your peak, incoming attacks falter against your darkness-shrouded reflexes, making you extremely difficult to pin down.",
    ],
    subclass: {
      index: "gloom-stalker",
      name: "Gloom Stalker",
      url: "/api/2024/subclasses/gloom-stalker",
    },
  },
  {
    index: "hunter-superior-hunters-defense",
    level: 15,
    name: "Superior Hunter's Defense",
    desc: [
      "You culminate in a top-end defensive answer to the deadliest threats, turning hard-won experience into survival instinct.",
    ],
    subclass: {
      index: "hunter",
      name: "Hunter",
      url: "/api/2024/subclasses/hunter",
    },
  },
  createAbilityScoreImprovementFeature("ranger-ability-score-improvement-4", 16, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "ranger-feral-senses",
    18,
    "Feral Senses",
    "Your awareness becomes so sharp that hidden or unseen creatures struggle to escape your notice in the middle of combat.",
  ),
  createEpicBoonFeature("ranger-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of the Night Spirit and Boon of Combat Prowess fit many rangers well."),
  createSimpleFeature(
    "ranger-foe-slayer",
    20,
    "Foe Slayer",
    "At the height of your path, your signature hunting magic and marked strikes become especially punishing against your quarry.",
  ),
];

const ROGUE_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  {
    index: "rogue-expertise-1",
    level: 1,
    name: "Expertise",
    desc: [
      "Choose two of your skill or tool proficiencies and double your Proficiency Bonus for checks that use them.",
    ],
    feature_specific: {
      choose: 2,
      type: "expertise",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(ROGUE_SKILL_OPTIONS, "proficiencies"),
      },
    },
  },
  {
    index: "rogue-weapon-mastery",
    level: 1,
    name: "Weapon Mastery",
    desc: [
      "You learn mastery properties that help your favored weapons create cleaner openings for rogue tactics and precision damage.",
      "Choose two mastery properties to reflect the weapons you have practiced most extensively.",
    ],
    feature_specific: {
      choose: 2,
      type: "weapon mastery",
      from: {
        option_set_type: "options_array",
        options: WEAPON_MASTERY_PROPERTY_OPTIONS,
      },
    },
  },
  createSimpleFeature(
    "rogue-steady-aim",
    2,
    "Steady Aim",
    "As a Bonus Action, you can give yourself Advantage on your next attack roll on the current turn if you haven't moved during the turn. After you use this Bonus Action, your Speed is 0 until the end of the current turn.",
  ),
  createSubclassChoiceFeature(
    "rogue-subclass",
    3,
    "Rogue",
    ROGUE_SUBCLASSES,
    "Choose the rogue path that defines your advanced tricks, tools, or supernatural edge.",
  ),
  {
    index: "rogue-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen rogue subclass grants its defining 3rd-level features.",
      "Arcane Trickster adds deceptive wizardry.",
      "Assassin perfects ambush, infiltration, and elimination.",
      "Soulknife manifests psionic blades and telepathic utility.",
      "Thief thrives on speed, utility, and impossible opportunism.",
    ],
  },
  {
    index: "arcane-trickster-spellcasting",
    level: 3,
    name: "Spellcasting",
    desc: [
      "You learn wizard spells tailored toward trickery, deception, and control, adding selective arcane tools to your rogue kit.",
    ],
    subclass: {
      index: "arcane-trickster",
      name: "Arcane Trickster",
      url: "/api/2024/subclasses/arcane-trickster",
    },
  },
  {
    index: "arcane-trickster-mage-hand-legerdemain",
    level: 3,
    name: "Mage Hand Legerdemain",
    desc: [
      "Your mage hand becomes a refined tool for roguish manipulation, making sleight-of-hand trickery feel magical and precise.",
    ],
    subclass: {
      index: "arcane-trickster",
      name: "Arcane Trickster",
      url: "/api/2024/subclasses/arcane-trickster",
    },
  },
  {
    index: "assassinate",
    level: 3,
    name: "Assassinate",
    desc: [
      "You excel at the opening strike against creatures that are off balance, surprised, or not yet ready for your attack.",
    ],
    subclass: {
      index: "assassin",
      name: "Assassin",
      url: "/api/2024/subclasses/assassin",
    },
  },
  {
    index: "envenom-weapons",
    level: 3,
    name: "Envenom Weapons",
    desc: [
      "You learn to prepare your tools for especially dangerous finishing pressure, sharpening the assassin's identity as a decisive eliminator.",
    ],
    subclass: {
      index: "assassin",
      name: "Assassin",
      url: "/api/2024/subclasses/assassin",
    },
  },
  {
    index: "psychic-blades",
    level: 3,
    name: "Psychic Blades",
    desc: [
      "You can conjure psionic weapons directly from thought, giving your attacks an eerie and unmistakably supernatural edge.",
    ],
    subclass: {
      index: "soulknife",
      name: "Soulknife",
      url: "/api/2024/subclasses/soulknife",
    },
  },
  {
    index: "psionic-power",
    level: 3,
    name: "Psionic Power",
    desc: [
      "Your discipline grants a pool of subtle mental talents for skill, mobility, and precision, turning psionics into practical rogue utility.",
    ],
    subclass: {
      index: "soulknife",
      name: "Soulknife",
      url: "/api/2024/subclasses/soulknife",
    },
  },
  {
    index: "fast-hands",
    level: 3,
    name: "Fast Hands",
    desc: [
      "You use objects, tools, and opportunistic movement with exceptional speed, making your turns feel faster and more flexible than most rogues.",
    ],
    subclass: {
      index: "thief",
      name: "Thief",
      url: "/api/2024/subclasses/thief",
    },
  },
  {
    index: "second-story-work",
    level: 3,
    name: "Second-Story Work",
    desc: [
      "Climbing, jumping, and urban movement all become part of your professional toolkit, reinforcing the thief's mobility and nerve.",
    ],
    subclass: {
      index: "thief",
      name: "Thief",
      url: "/api/2024/subclasses/thief",
    },
  },
  createSimpleFeature(
    "rogue-cunning-strike",
    3,
    "Cunning Strike",
    "When your Sneak Attack lands, you can convert some of that precision into disruptive tactical riders that hinder or reposition the target.",
  ),
  createAbilityScoreImprovementFeature("rogue-ability-score-improvement-1", 4, EXPERT_FEAT_OPTIONS),
  {
    index: "rogue-expertise-2",
    level: 6,
    name: "Expertise",
    desc: [
      "Choose two more of your skill or tool proficiencies and double your Proficiency Bonus for them.",
    ],
    feature_specific: {
      choose: 2,
      type: "expertise",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(ROGUE_SKILL_OPTIONS, "proficiencies"),
      },
    },
  },
  createSimpleFeature(
    "rogue-reliable-talent",
    7,
    "Reliable Talent",
    "Your practiced technique turns many middling checks into dependable successes whenever you use a proficiency you know well.",
  ),
  createAbilityScoreImprovementFeature("rogue-ability-score-improvement-2", 8, EXPERT_FEAT_OPTIONS),
  {
    index: "rogue-subclass-feature-9",
    level: 9,
    name: "Subclass Feature",
    desc: [
      "Your rogue subclass grants a stronger specialty feature at this level.",
      "Arcane Trickster becomes harder to foil with magic and stealth combined.",
      "Assassin deepens infiltration and lethal setup.",
      "Soulknife's psionic focus improves versatility and consistency.",
      "Thief becomes even stealthier and more efficient at opportunistic movement.",
    ],
  },
  {
    index: "magical-ambush",
    level: 9,
    name: "Magical Ambush",
    desc: [
      "Hidden spellcasting becomes especially hard for enemies to resist, rewarding the arcane trickster for striking from deception.",
    ],
    subclass: {
      index: "arcane-trickster",
      name: "Arcane Trickster",
      url: "/api/2024/subclasses/arcane-trickster",
    },
  },
  {
    index: "infiltration-expertise",
    level: 9,
    name: "Infiltration Expertise",
    desc: [
      "You become exceptionally skilled at entering dangerous places under false identities or subtle covers.",
    ],
    subclass: {
      index: "assassin",
      name: "Assassin",
      url: "/api/2024/subclasses/assassin",
    },
  },
  {
    index: "soul-blades",
    level: 9,
    name: "Soul Blades",
    desc: [
      "Your psychic weapons and psionic tools become more reliable and more dangerous, reinforcing the soulknife's mental precision.",
    ],
    subclass: {
      index: "soulknife",
      name: "Soulknife",
      url: "/api/2024/subclasses/soulknife",
    },
  },
  {
    index: "supreme-sneak",
    level: 9,
    name: "Supreme Sneak",
    desc: [
      "You become even better at slipping unseen through dangerous territory, making your stealth feel almost effortless.",
    ],
    subclass: {
      index: "thief",
      name: "Thief",
      url: "/api/2024/subclasses/thief",
    },
  },
  createAbilityScoreImprovementFeature("rogue-ability-score-improvement-3", 10, EXPERT_FEAT_OPTIONS),
  createSimpleFeature(
    "rogue-improved-cunning-strike",
    11,
    "Improved Cunning Strike",
    "Your Sneak Attack riders improve, letting you spend precision damage more efficiently or apply stronger tactical pressure.",
  ),
  createAbilityScoreImprovementFeature("rogue-ability-score-improvement-4", 12, EXPERT_FEAT_OPTIONS),
  {
    index: "rogue-subclass-feature-13",
    level: 13,
    name: "Subclass Feature",
    desc: [
      "Your rogue subclass gains a major late-midgame feature.",
      "Arcane Trickster turns distraction into advantage against enemies.",
      "Assassin masters identity and deception work.",
      "Soulknife gains stronger stealth and psionic concealment.",
      "Thief bends magic items and improvised tools to its will.",
    ],
  },
  {
    index: "versatile-trickster",
    level: 13,
    name: "Versatile Trickster",
    desc: [
      "Your magical misdirection turns your spectral helper into a setup tool for advantage, deepening the trickster's control over positioning.",
    ],
    subclass: {
      index: "arcane-trickster",
      name: "Arcane Trickster",
      url: "/api/2024/subclasses/arcane-trickster",
    },
  },
  {
    index: "impostor",
    level: 13,
    name: "Impostor",
    desc: [
      "Your ability to mimic and replace others reaches a frightening level of precision, making infiltration far more believable.",
    ],
    subclass: {
      index: "assassin",
      name: "Assassin",
      url: "/api/2024/subclasses/assassin",
    },
  },
  {
    index: "psychic-veil",
    level: 13,
    name: "Psychic Veil",
    desc: [
      "You can vanish behind psionic concealment when timing matters most, turning thought itself into stealth.",
    ],
    subclass: {
      index: "soulknife",
      name: "Soulknife",
      url: "/api/2024/subclasses/soulknife",
    },
  },
  {
    index: "use-magic-device",
    level: 13,
    name: "Use Magic Device",
    desc: [
      "You can coax value out of magic items others cannot easily exploit, making your opportunism extend even to enchanted tools.",
    ],
    subclass: {
      index: "thief",
      name: "Thief",
      url: "/api/2024/subclasses/thief",
    },
  },
  createSimpleFeature(
    "rogue-devious-strikes",
    14,
    "Devious Strikes",
    "Your weapon attacks can deliver nastier, more specialized tactical effects, further sharpening the rogue's control over a fight.",
  ),
  createAbilityScoreImprovementFeature("rogue-ability-score-improvement-5", 16, EXPERT_FEAT_OPTIONS),
  {
    index: "rogue-subclass-feature-17",
    level: 17,
    name: "Subclass Feature",
    desc: [
      "Your rogue subclass reaches its capstone trick.",
      "Arcane Trickster can steal or repurpose hostile spellcraft.",
      "Assassin becomes brutally decisive when the setup succeeds.",
      "Soulknife unleashes a devastating psionic assault on the mind.",
      "Thief acts with incredible speed at the opening of battle.",
    ],
  },
  {
    index: "spell-thief",
    level: 17,
    name: "Spell Thief",
    desc: [
      "At your peak, hostile magic itself can become part of your arsenal, letting the arcane trickster repurpose enemy spellcraft.",
    ],
    subclass: {
      index: "arcane-trickster",
      name: "Arcane Trickster",
      url: "/api/2024/subclasses/arcane-trickster",
    },
  },
  {
    index: "death-strike",
    level: 17,
    name: "Death Strike",
    desc: [
      "When the setup is perfect, your opening attack becomes devastating, rewarding the assassin's patience with lethal payoff.",
    ],
    subclass: {
      index: "assassin",
      name: "Assassin",
      url: "/api/2024/subclasses/assassin",
    },
  },
  {
    index: "rend-mind",
    level: 17,
    name: "Rend Mind",
    desc: [
      "A successful psychic assault can leave an enemy mentally shattered, turning the soulknife's psionic offense into a terrifying finisher.",
    ],
    subclass: {
      index: "soulknife",
      name: "Soulknife",
      url: "/api/2024/subclasses/soulknife",
    },
  },
  {
    index: "thiefs-reflexes",
    level: 17,
    name: "Thief's Reflexes",
    desc: [
      "At the start of a fight, your speed and readiness can feel supernatural, letting the thief seize momentum before others react.",
    ],
    subclass: {
      index: "thief",
      name: "Thief",
      url: "/api/2024/subclasses/thief",
    },
  },
  createEpicBoonFeature("rogue-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of the Night Spirit is especially thematic for many rogues."),
];

const SORCERER_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createSorcererSpellChoiceFeature(
    "sorcerer-cantrips-1",
    1,
    "Cantrips",
    "Choose four Sorcerer cantrips to reflect the shape of your innate magic at the start of your career.",
    4,
    SORCERER_CANTRIP_OPTIONS,
    "sorcerer cantrip",
  ),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-1",
    1,
    "Sorcerer Spells",
    "Choose two 1st-level Sorcerer spells.",
    2,
    SORCERER_LEVEL_1_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  createSimpleFeature(
    "sorcerer-spellcasting",
    1,
    "Spellcasting",
    "You cast spells through innate talent rather than study or prayer, using Charisma as the force behind your magic.",
  ),
  {
    index: "sorcerer-innate-sorcery",
    level: 1,
    name: "Innate Sorcery",
    desc: [
      "Magic wells up from within you, and you can briefly heighten your personal sorcerous presence to sharpen your spells.",
    ],
  },
  createSimpleFeature(
    "sorcerer-font-of-magic",
    2,
    "Font of Magic",
    "Sorcery Points become the flexible fuel for many of your class features, letting you reshape how and when your magic is expressed.",
  ),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-2",
    2,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell. At this level your available spell choices still come from 1st-level Sorcerer spells.",
    1,
    SORCERER_LEVEL_1_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  {
    index: "metamagic-1",
    level: 2,
    name: "Metamagic",
    desc: [
      "Choose two Metamagic options that let you reshape the form and function of your spells.",
    ],
    feature_specific: {
      choose: 2,
      type: "metamagic",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(METAMAGIC_OPTIONS, "feats"),
      },
    },
  },
  createSubclassChoiceFeature(
    "sorcerer-subclass",
    3,
    "Sorcerer",
    SORCERER_SUBCLASSES,
    "Choose the magical lineage or anomaly that defines your deeper sorcerous power and later subclass features.",
  ),
  {
    index: "sorcerer-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen sorcerous origin grants its defining 3rd-level features.",
      "Aberrant Sorcery adds telepathy and psionic spell pressure.",
      "Clockwork Sorcery balances magic through cosmic order.",
      "Draconic Sorcery hardens the body and channels draconic power.",
      "Wild Magic Sorcery bends reality through chaos and surges.",
    ],
  },
  {
    index: "aberrant-psionic-spells",
    level: 3,
    name: "Psionic Spells",
    desc: [
      "You always have unsettling psionic-themed spells prepared, reinforcing the alien character of your aberrant magic.",
    ],
    subclass: {
      index: "aberrant-sorcery",
      name: "Aberrant Sorcery",
      url: "/api/2024/subclasses/aberrant-sorcery",
    },
  },
  {
    index: "telepathic-speech",
    level: 3,
    name: "Telepathic Speech",
    desc: [
      "Your mind reaches outward in wordless communication, making psychic contact part of your everyday magical presence.",
    ],
    subclass: {
      index: "aberrant-sorcery",
      name: "Aberrant Sorcery",
      url: "/api/2024/subclasses/aberrant-sorcery",
    },
  },
  {
    index: "clockwork-spells",
    level: 3,
    name: "Clockwork Spells",
    desc: [
      "You always have ordered, protective, and balancing spells prepared, reflecting the precise logic of cosmic law.",
    ],
    subclass: {
      index: "clockwork-sorcery",
      name: "Clockwork Sorcery",
      url: "/api/2024/subclasses/clockwork-sorcery",
    },
  },
  {
    index: "restore-balance",
    level: 3,
    name: "Restore Balance",
    desc: [
      "You can cancel key advantages or disadvantages when precise balance is needed, imposing order on a chaotic moment.",
    ],
    subclass: {
      index: "clockwork-sorcery",
      name: "Clockwork Sorcery",
      url: "/api/2024/subclasses/clockwork-sorcery",
    },
  },
  {
    index: "draconic-resilience",
    level: 3,
    name: "Draconic Resilience",
    desc: [
      "Your body hardens with draconic toughness and improved natural protection, making your magic feel physically inherited.",
    ],
    subclass: {
      index: "draconic-sorcery",
      name: "Draconic Sorcery",
      url: "/api/2024/subclasses/draconic-sorcery",
    },
  },
  {
    index: "wild-magic-surge",
    level: 3,
    name: "Wild Magic Surge",
    desc: [
      "Unstable power can erupt around your spells in dramatic and surprising ways, making each cast feel charged with possibility.",
    ],
    subclass: {
      index: "wild-magic-sorcery",
      name: "Wild Magic Sorcery",
      url: "/api/2024/subclasses/wild-magic-sorcery",
    },
  },
  {
    index: "tides-of-chaos",
    level: 3,
    name: "Tides of Chaos",
    desc: [
      "You manipulate luck and invite volatility in return, turning chaos itself into a tactical resource.",
    ],
    subclass: {
      index: "wild-magic-sorcery",
      name: "Wild Magic Sorcery",
      url: "/api/2024/subclasses/wild-magic-sorcery",
    },
  },
  {
    index: "draconic-ancestor",
    level: 3,
    name: "Dragon Ancestor",
    desc: [
      "Choose the dragon ancestor that defines the elemental theme of your Draconic Sorcery.",
      "This ancestry informs the flavor of your subclass and the damage type tied to later Draconic Sorcery features.",
    ],
    subclass: {
      index: "draconic-sorcery",
      name: "Draconic Sorcery",
      url: "/api/2024/subclasses/draconic-sorcery",
    },
    feature_specific: {
      choose: 1,
      type: "draconic ancestry",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(DRACONIC_ANCESTRY_OPTIONS, "subclasses"),
      },
    },
  },
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-3",
    3,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell. You can now choose from 1st- or 2nd-level Sorcerer spells.",
    1,
    SORCERER_LEVEL_2_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  createSorcererSpellChoiceFeature(
    "sorcerer-cantrips-2",
    4,
    "Cantrip",
    "Choose one additional Sorcerer cantrip.",
    1,
    SORCERER_CANTRIP_OPTIONS,
    "sorcerer cantrip",
  ),
  createAbilityScoreImprovementFeature("sorcerer-ability-score-improvement-1", 4, CASTER_FEAT_OPTIONS),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-4",
    4,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell.",
    1,
    SORCERER_LEVEL_2_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  createSimpleFeature(
    "sorcerer-sorcerous-restoration",
    5,
    "Sorcerous Restoration",
    "A short period of rest lets you regain a portion of your Sorcery Points, helping your magic stay online across longer adventuring days.",
  ),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-5",
    5,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell. You can now choose from 1st- through 3rd-level Sorcerer spells.",
    1,
    SORCERER_LEVEL_3_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  {
    index: "sorcerer-subclass-feature-6",
    level: 6,
    name: "Subclass Feature",
    desc: [
      "Your sorcerous origin grants a stronger magical expression at this level.",
      "Aberrant Sorcery expands psionic spellcraft and mental pressure.",
      "Clockwork Sorcery reinforces order, protection, and reliability.",
      "Draconic Sorcery infuses spells with elemental power.",
      "Wild Magic Sorcery turns chance into a sharper tactical resource.",
    ],
  },
  {
    index: "psionic-sorcery",
    level: 6,
    name: "Psionic Sorcery",
    desc: [
      "You can cast certain spells through sorcery rather than ordinary spellcasting methods, deepening the psychic identity of your magic.",
    ],
    subclass: {
      index: "aberrant-sorcery",
      name: "Aberrant Sorcery",
      url: "/api/2024/subclasses/aberrant-sorcery",
    },
  },
  {
    index: "bastion-of-law",
    level: 6,
    name: "Bastion of Law",
    desc: [
      "You shape protective order into a ward that absorbs harm, turning clockwork precision into practical defense.",
    ],
    subclass: {
      index: "clockwork-sorcery",
      name: "Clockwork Sorcery",
      url: "/api/2024/subclasses/clockwork-sorcery",
    },
  },
  {
    index: "elemental-affinity",
    level: 6,
    name: "Elemental Affinity",
    desc: [
      "Spells tied to your draconic element grow stronger and more resonant, letting your ancestry push through your spell damage.",
    ],
    subclass: {
      index: "draconic-sorcery",
      name: "Draconic Sorcery",
      url: "/api/2024/subclasses/draconic-sorcery",
    },
  },
  {
    index: "bend-luck",
    level: 6,
    name: "Bend Luck",
    desc: [
      "Your sorcery can tilt a key roll toward success or failure, sharpening wild magic into a direct influence on outcomes.",
    ],
    subclass: {
      index: "wild-magic-sorcery",
      name: "Wild Magic Sorcery",
      url: "/api/2024/subclasses/wild-magic-sorcery",
    },
  },
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-6",
    6,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell.",
    1,
    SORCERER_LEVEL_3_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  createSimpleFeature(
    "sorcerer-sorcery-incarnate",
    7,
    "Sorcery Incarnate",
    "Your Innate Sorcery becomes easier to access and maintain, pushing you closer to a state where spellcraft and self are almost indistinguishable.",
  ),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-7",
    7,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell. You can now choose from 1st- through 4th-level Sorcerer spells.",
    1,
    SORCERER_LEVEL_4_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  createAbilityScoreImprovementFeature("sorcerer-ability-score-improvement-2", 8, CASTER_FEAT_OPTIONS),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-8",
    8,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell.",
    1,
    SORCERER_LEVEL_4_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-9",
    9,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell. You can now choose from 1st- through 5th-level Sorcerer spells.",
    1,
    SORCERER_LEVEL_5_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  {
    index: "metamagic-2",
    level: 10,
    name: "Metamagic",
    desc: [
      "Choose one additional Metamagic option.",
    ],
    feature_specific: {
      choose: 1,
      type: "metamagic",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(METAMAGIC_OPTIONS, "feats"),
      },
    },
  },
  createSorcererSpellChoiceFeature(
    "sorcerer-cantrips-3",
    10,
    "Cantrip",
    "Choose one additional Sorcerer cantrip.",
    1,
    SORCERER_CANTRIP_OPTIONS,
    "sorcerer cantrip",
  ),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-10",
    10,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell.",
    1,
    SORCERER_LEVEL_5_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  createAbilityScoreImprovementFeature("sorcerer-ability-score-improvement-3", 12, CASTER_FEAT_OPTIONS),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-11",
    11,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell.",
    1,
    SORCERER_LEVEL_5_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  {
    index: "sorcerer-subclass-feature-14",
    level: 14,
    name: "Subclass Feature",
    desc: [
      "Your sorcerous origin grants a dramatic late-game transformation or power spike.",
      "Aberrant Sorcery twists body and spell into alien flexibility.",
      "Clockwork Sorcery stabilizes the battlefield with near-perfect magical order.",
      "Draconic Sorcery manifests draconic wings and overwhelming presence.",
      "Wild Magic Sorcery becomes even harder to predict or contain.",
    ],
  },
  {
    index: "revelation-in-flesh",
    level: 14,
    name: "Revelation in Flesh",
    desc: [
      "Your body twists into useful alien adaptations, letting aberrant power reshape you for the moment at hand.",
    ],
    subclass: {
      index: "aberrant-sorcery",
      name: "Aberrant Sorcery",
      url: "/api/2024/subclasses/aberrant-sorcery",
    },
  },
  {
    index: "trance-of-order",
    level: 14,
    name: "Trance of Order",
    desc: [
      "For a brief time, your spellcasting and focus become exceptionally consistent, as cosmic order suppresses instability.",
    ],
    subclass: {
      index: "clockwork-sorcery",
      name: "Clockwork Sorcery",
      url: "/api/2024/subclasses/clockwork-sorcery",
    },
  },
  {
    index: "dragon-wings",
    level: 14,
    name: "Dragon Wings",
    desc: [
      "You manifest draconic wings and command the air directly, making your ancestry physically undeniable.",
    ],
    subclass: {
      index: "draconic-sorcery",
      name: "Draconic Sorcery",
      url: "/api/2024/subclasses/draconic-sorcery",
    },
  },
  {
    index: "controlled-chaos",
    level: 14,
    name: "Controlled Chaos",
    desc: [
      "You gain better leverage over the strange currents of wild magic, making chaos more useful without fully taming it.",
    ],
    subclass: {
      index: "wild-magic-sorcery",
      name: "Wild Magic Sorcery",
      url: "/api/2024/subclasses/wild-magic-sorcery",
    },
  },
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-12",
    13,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell.",
    1,
    SORCERER_LEVEL_5_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  createAbilityScoreImprovementFeature("sorcerer-ability-score-improvement-4", 16, CASTER_FEAT_OPTIONS),
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-13",
    15,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell.",
    1,
    SORCERER_LEVEL_5_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  {
    index: "metamagic-3",
    level: 17,
    name: "Metamagic",
    desc: [
      "Choose one additional Metamagic option.",
    ],
    feature_specific: {
      choose: 1,
      type: "metamagic",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(METAMAGIC_OPTIONS, "feats"),
      },
    },
  },
  createSorcererSpellChoiceFeature(
    "sorcerer-spells-14",
    17,
    "Sorcerer Spells",
    "Choose one additional Sorcerer spell.",
    1,
    SORCERER_LEVEL_5_SPELL_OPTIONS,
    "sorcerer spell",
  ),
  {
    index: "sorcerer-subclass-feature-18",
    level: 18,
    name: "Subclass Feature",
    desc: [
      "Your sorcerous origin reaches its capstone expression.",
      "Aberrant Sorcery becomes a peak psionic aberration.",
      "Clockwork Sorcery asserts flawless cosmic order.",
      "Draconic Sorcery radiates majestic draconic dominance.",
      "Wild Magic Sorcery bends chaos into spectacular endgame power.",
    ],
  },
  {
    index: "warping-implosion",
    level: 18,
    name: "Warping Implosion",
    desc: [
      "Warped psychic gravity lets you collapse foes toward a chosen point, culminating in a dramatic aberrant battlefield effect.",
    ],
    subclass: {
      index: "aberrant-sorcery",
      name: "Aberrant Sorcery",
      url: "/api/2024/subclasses/aberrant-sorcery",
    },
  },
  {
    index: "clockwork-cavalcade",
    level: 18,
    name: "Clockwork Cavalcade",
    desc: [
      "Ordered magic sweeps the battlefield and restores structure around you, expressing cosmic law on a grand scale.",
    ],
    subclass: {
      index: "clockwork-sorcery",
      name: "Clockwork Sorcery",
      url: "/api/2024/subclasses/clockwork-sorcery",
    },
  },
  {
    index: "draconic-presence",
    level: 18,
    name: "Draconic Presence",
    desc: [
      "You overwhelm the battlefield with a dragon's terrifying majesty, making your presence itself part of the attack.",
    ],
    subclass: {
      index: "draconic-sorcery",
      name: "Draconic Sorcery",
      url: "/api/2024/subclasses/draconic-sorcery",
    },
  },
  {
    index: "spell-bombardment",
    level: 18,
    name: "Spell Bombardment",
    desc: [
      "Wild power adds explosive extra force when your spells strike hard, turning peak chaos into devastating payoff.",
    ],
    subclass: {
      index: "wild-magic-sorcery",
      name: "Wild Magic Sorcery",
      url: "/api/2024/subclasses/wild-magic-sorcery",
    },
  },
  createEpicBoonFeature("sorcerer-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Spell Recall is a natural fit for many sorcerers."),
  createSimpleFeature(
    "arcane-apotheosis",
    20,
    "Arcane Apotheosis",
    "You reach the peak of innate magic, entering a final state where your sorcerous nature expresses itself with overwhelming ease and force.",
  ),
];

const WARLOCK_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createWarlockSpellChoiceFeature(
    "warlock-cantrips-1",
    1,
    "Cantrips",
    "Choose two Warlock cantrips you know at 1st level. Eldritch Blast and Prestidigitation are common starting picks, but any option here can define your early pact magic.",
    2,
    WARLOCK_CANTRIP_OPTIONS,
    "warlock cantrip",
  ),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-1",
    1,
    "Prepared Spells",
    "Choose two 1st-level Warlock spells to begin your Pact Magic preparation.",
    2,
    WARLOCK_LEVEL_1_SPELL_OPTIONS,
    "warlock spell",
  ),
  createWarlockEldritchInvocationFeature(
    "eldritch-invocations-1",
    1,
    "Choose one Eldritch Invocation to define your first supernatural pact trick.",
  ),
  createSimpleFeature(
    "pact-magic",
    1,
    "Pact Magic",
    "Your patron grants you a compact spellcasting system fueled by Pact Magic slots that recharge on a Short Rest.",
  ),
  createSimpleFeature(
    "warlock-magical-cunning",
    2,
    "Magical Cunning",
    "You can recover magical power through a brief, focused rite, helping Pact Magic stay relevant across multiple encounters.",
  ),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-2",
    2,
    "Prepared Spells",
    "Choose one additional Warlock spell. At this level your spell list is still limited to 1st-level options.",
    1,
    WARLOCK_LEVEL_1_SPELL_OPTIONS,
    "warlock spell",
  ),
  createWarlockEldritchInvocationFeature(
    "eldritch-invocations-2",
    2,
    "Choose one additional Eldritch Invocation.",
  ),
  {
    index: "pact-boon",
    level: 3,
    name: "Pact Boon",
    desc: [
      "Your patron grants a supernatural gift that shapes how your pact expresses itself in play.",
      "Pact of the Blade turns your bargain toward summoned or bonded weapons, Pact of the Chain deepens familiar magic, and Pact of the Tome grants a Book of Shadows filled with extra magical study.",
    ],
    feature_specific: {
      choose: 1,
      type: "pact boon",
      from: {
        option_set_type: "options_array",
        options: WARLOCK_PACT_BOON_OPTIONS,
      },
    },
  },
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-3",
    3,
    "Prepared Spells",
    "Choose one additional Warlock spell. You can now pick from 1st- and 2nd-level Warlock spells.",
    1,
    WARLOCK_LEVEL_2_SPELL_OPTIONS,
    "warlock spell",
  ),
  createSubclassChoiceFeature(
    "warlock-subclass",
    3,
    "Warlock",
    WARLOCK_SUBCLASSES,
    "Choose the patron whose bargain shapes your magic, your flavor, and your later subclass features.",
  ),
  {
    index: "warlock-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen patron grants its defining 3rd-level features.",
      "Archfey Patron brings glamour, escape, and manipulation.",
      "Celestial Patron grants radiant aid and healing support.",
      "Fiend Patron rewards aggression and infernal durability.",
      "Great Old One Patron twists perception, minds, and psychic influence.",
    ],
  },
  {
    index: "fey-presence",
    level: 3,
    name: "Fey Presence",
    desc: [
      "A flash of fey glamour can charm or frighten those around you, making the Archfey pact feel theatrical and dangerous.",
    ],
    subclass: {
      index: "archfey-patron",
      name: "Archfey Patron",
      url: "/api/2024/subclasses/archfey-patron",
    },
  },
  {
    index: "healing-light",
    level: 3,
    name: "Healing Light",
    desc: [
      "Your patron grants a reservoir of radiant healing to aid allies in need, giving your pact a direct restorative outlet.",
    ],
    subclass: {
      index: "celestial-patron",
      name: "Celestial Patron",
      url: "/api/2024/subclasses/celestial-patron",
    },
  },
  {
    index: "dark-ones-blessing",
    level: 3,
    name: "Dark One's Blessing",
    desc: [
      "Defeating enemies rewards you with infernal vitality, turning fiendish aggression into immediate staying power.",
    ],
    subclass: {
      index: "fiend-patron",
      name: "Fiend Patron",
      url: "/api/2024/subclasses/fiend-patron",
    },
  },
  {
    index: "awakened-mind",
    level: 3,
    name: "Awakened Mind",
    desc: [
      "Your thoughts can reach outward in unsettling telepathic contact, making the Great Old One's influence impossible to mistake.",
    ],
    subclass: {
      index: "great-old-one-patron",
      name: "Great Old One Patron",
      url: "/api/2024/subclasses/great-old-one-patron",
    },
  },
  createWarlockSpellChoiceFeature(
    "warlock-cantrips-2",
    4,
    "Cantrip",
    "Choose one additional Warlock cantrip at 4th level.",
    1,
    WARLOCK_CANTRIP_OPTIONS,
    "warlock cantrip",
  ),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-4",
    4,
    "Prepared Spells",
    "Choose one additional Warlock spell. Your available spell levels remain capped by your Pact Magic progression.",
    1,
    WARLOCK_LEVEL_2_SPELL_OPTIONS,
    "warlock spell",
  ),
  createAbilityScoreImprovementFeature("warlock-ability-score-improvement-1", 4, CASTER_FEAT_OPTIONS),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-5",
    5,
    "Prepared Spells",
    "Choose one additional Warlock spell. You can now select 3rd-level Warlock spells.",
    1,
    WARLOCK_LEVEL_3_SPELL_OPTIONS,
    "warlock spell",
  ),
  createWarlockEldritchInvocationFeature(
    "eldritch-invocations-3",
    5,
    "Choose one additional Eldritch Invocation.",
  ),
  {
    index: "warlock-subclass-feature-6",
    level: 6,
    name: "Subclass Feature",
    desc: [
      "Your patron grants a stronger magical benefit at this level.",
      "Archfey sharpens escape and battlefield trickery.",
      "Celestial expands radiant resilience and life-giving power.",
      "Fiend grants infernal luck or survival tools.",
      "Great Old One deepens telepathic, deceptive, or mind-bending influence.",
    ],
  },
  {
    index: "misty-escape",
    level: 6,
    name: "Misty Escape",
    desc: [
      "Danger can trigger a sudden vanishing step into protective fey motion, making escape itself part of your pact defense.",
    ],
    subclass: {
      index: "archfey-patron",
      name: "Archfey Patron",
      url: "/api/2024/subclasses/archfey-patron",
    },
  },
  {
    index: "radiant-soul",
    level: 6,
    name: "Radiant Soul",
    desc: [
      "Your radiant and fire magic carries stronger celestial force, making your pact's holy power hit harder.",
    ],
    subclass: {
      index: "celestial-patron",
      name: "Celestial Patron",
      url: "/api/2024/subclasses/celestial-patron",
    },
  },
  {
    index: "dark-ones-own-luck",
    level: 6,
    name: "Dark One's Own Luck",
    desc: [
      "Your patron's favor can rescue a crucial failed roll, turning infernal fortune into a practical survival tool.",
    ],
    subclass: {
      index: "fiend-patron",
      name: "Fiend Patron",
      url: "/api/2024/subclasses/fiend-patron",
    },
  },
  {
    index: "entropic-ward",
    level: 6,
    name: "Entropic Ward",
    desc: [
      "Alien distortion can foil an attack and create an opening for you, translating incomprehensible influence into defense.",
    ],
    subclass: {
      index: "great-old-one-patron",
      name: "Great Old One Patron",
      url: "/api/2024/subclasses/great-old-one-patron",
    },
  },
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-6",
    6,
    "Prepared Spells",
    "Choose one additional Warlock spell. At this level, your Pact Magic lets you learn from the 1st- through 3rd-level Warlock list.",
    1,
    WARLOCK_LEVEL_3_SPELL_OPTIONS,
    "warlock spell",
  ),
  createWarlockEldritchInvocationFeature(
    "eldritch-invocations-4",
    7,
    "Choose one additional Eldritch Invocation.",
  ),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-7",
    7,
    "Prepared Spells",
    "Choose one additional Warlock spell. You can now include 4th-level Warlock spells in your preparation options.",
    1,
    WARLOCK_LEVEL_4_SPELL_OPTIONS,
    "warlock spell",
  ),
  createAbilityScoreImprovementFeature("warlock-ability-score-improvement-2", 8, CASTER_FEAT_OPTIONS),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-8",
    8,
    "Prepared Spells",
    "Choose one additional Warlock spell from the spells your Pact Magic can currently support.",
    1,
    WARLOCK_LEVEL_4_SPELL_OPTIONS,
    "warlock spell",
  ),
  createSimpleFeature(
    "contact-patron",
    9,
    "Contact Patron",
    "Your bond with your patron deepens, allowing direct guidance or support that reflects the supernatural relationship at the core of the class.",
  ),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-9",
    9,
    "Prepared Spells",
    "Choose one additional Warlock spell. 5th-level Warlock spells are now available to you.",
    1,
    WARLOCK_LEVEL_5_SPELL_OPTIONS,
    "warlock spell",
  ),
  createWarlockEldritchInvocationFeature(
    "eldritch-invocations-5",
    9,
    "Choose one additional Eldritch Invocation.",
  ),
  {
    index: "warlock-subclass-feature-10",
    level: 10,
    name: "Subclass Feature",
    desc: [
      "Your patron reshapes your defenses or special utility at this level.",
      "Archfey leans into beguilement and misdirection.",
      "Celestial becomes harder to overwhelm with darkness or death.",
      "Fiend adapts to hostile punishment through infernal resilience.",
      "Great Old One gains stronger control over perception and reality distortions.",
    ],
  },
  {
    index: "beguiling-defenses",
    level: 10,
    name: "Beguiling Defenses",
    desc: [
      "Your pact hardens you against enchantment and helps turn such magic against others, deepening your fey glamour defenses.",
    ],
    subclass: {
      index: "archfey-patron",
      name: "Archfey Patron",
      url: "/api/2024/subclasses/archfey-patron",
    },
  },
  {
    index: "celestial-resilience",
    level: 10,
    name: "Celestial Resilience",
    desc: [
      "You and your allies can gain protective endurance from your patron's favor, making your pact feel actively sustaining.",
    ],
    subclass: {
      index: "celestial-patron",
      name: "Celestial Patron",
      url: "/api/2024/subclasses/celestial-patron",
    },
  },
  {
    index: "fiendish-resilience",
    level: 10,
    name: "Fiendish Resilience",
    desc: [
      "You adapt to punishment through infernal hardiness, becoming much harder to put down with repeated damage.",
    ],
    subclass: {
      index: "fiend-patron",
      name: "Fiend Patron",
      url: "/api/2024/subclasses/fiend-patron",
    },
  },
  {
    index: "thought-shield",
    level: 10,
    name: "Thought Shield",
    desc: [
      "Your mind becomes a hostile and resistant place for outside influence, reflecting the strange defenses of alien patronage.",
    ],
    subclass: {
      index: "great-old-one-patron",
      name: "Great Old One Patron",
      url: "/api/2024/subclasses/great-old-one-patron",
    },
  },
  createWarlockSpellChoiceFeature(
    "warlock-cantrips-3",
    10,
    "Cantrip",
    "Choose one additional Warlock cantrip at 10th level.",
    1,
    WARLOCK_CANTRIP_OPTIONS,
    "warlock cantrip",
  ),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-10",
    11,
    "Prepared Spells",
    "Choose one additional Warlock spell to keep your Pact Magic list growing alongside Mystic Arcanum.",
    1,
    WARLOCK_LEVEL_5_SPELL_OPTIONS,
    "warlock spell",
  ),
  createAbilityScoreImprovementFeature("warlock-ability-score-improvement-3", 12, CASTER_FEAT_OPTIONS),
  createWarlockEldritchInvocationFeature(
    "eldritch-invocations-6",
    12,
    "Choose one additional Eldritch Invocation.",
  ),
  {
    index: "mystic-arcanum-6th-level",
    level: 11,
    name: "Mystic Arcanum (6th-Level Spell)",
    desc: [
      "Choose one 6th-level Warlock spell as your Mystic Arcanum so you can cast it once without expending a Pact Magic slot, regaining that use after a Long Rest.",
    ],
    feature_specific: {
      choose: 1,
      type: "mystic arcanum",
      from: {
        option_set_type: "options_array",
        options: WARLOCK_MYSTIC_ARCANUM_6_OPTIONS,
      },
    },
  },
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-11",
    13,
    "Prepared Spells",
    "Choose one additional Warlock spell. Your Pact Magic list still caps at 5th-level spells, while Mystic Arcanum covers your higher-circle magic.",
    1,
    WARLOCK_LEVEL_5_SPELL_OPTIONS,
    "warlock spell",
  ),
  {
    index: "mystic-arcanum-7th-level",
    level: 13,
    name: "Mystic Arcanum (7th-Level Spell)",
    desc: [
      "Choose one 7th-level Warlock spell as your Mystic Arcanum so you can cast it once without expending a Pact Magic slot, regaining that use after a Long Rest.",
    ],
    feature_specific: {
      choose: 1,
      type: "mystic arcanum",
      from: {
        option_set_type: "options_array",
        options: WARLOCK_MYSTIC_ARCANUM_7_OPTIONS,
      },
    },
  },
  {
    index: "warlock-subclass-feature-14",
    level: 14,
    name: "Subclass Feature",
    desc: [
      "Your patron grants a capstone expression of its bargain.",
      "Archfey becomes a master of fey displacement and glamour.",
      "Celestial shines with overwhelming restorative or radiant force.",
      "Fiend hurls foes through terrifying infernal punishment.",
      "Great Old One reaches an apex of psychic invasion and alien pressure.",
    ],
  },
  {
    index: "dark-delirium",
    level: 14,
    name: "Dark Delirium",
    desc: [
      "You trap a creature in a haunting fey unreality, making the Archfey pact culminate in bewildering isolation and fear.",
    ],
    subclass: {
      index: "archfey-patron",
      name: "Archfey Patron",
      url: "/api/2024/subclasses/archfey-patron",
    },
  },
  {
    index: "searing-vengeance",
    level: 14,
    name: "Searing Vengeance",
    desc: [
      "Falling does not stop you from answering with blazing celestial reprisal, turning defeat into one last burst of holy fire.",
    ],
    subclass: {
      index: "celestial-patron",
      name: "Celestial Patron",
      url: "/api/2024/subclasses/celestial-patron",
    },
  },
  {
    index: "hurl-through-hell",
    level: 14,
    name: "Hurl Through Hell",
    desc: [
      "You can briefly cast an enemy into a hellish nightmare, making the fiend's capstone as cruel as it is dramatic.",
    ],
    subclass: {
      index: "fiend-patron",
      name: "Fiend Patron",
      url: "/api/2024/subclasses/fiend-patron",
    },
  },
  {
    index: "create-thrall",
    level: 14,
    name: "Create Thrall",
    desc: [
      "Your patron's influence can leave another creature mentally bound to your will, culminating the Great Old One's psychic control.",
    ],
    subclass: {
      index: "great-old-one-patron",
      name: "Great Old One Patron",
      url: "/api/2024/subclasses/great-old-one-patron",
    },
  },
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-12",
    15,
    "Prepared Spells",
    "Choose one additional Warlock spell to round out the 5th-level side of your pact list.",
    1,
    WARLOCK_LEVEL_5_SPELL_OPTIONS,
    "warlock spell",
  ),
  {
    index: "mystic-arcanum-8th-level",
    level: 15,
    name: "Mystic Arcanum (8th-Level Spell)",
    desc: [
      "Choose one 8th-level Warlock spell as your Mystic Arcanum so you can cast it once without expending a Pact Magic slot, regaining that use after a Long Rest.",
    ],
    feature_specific: {
      choose: 1,
      type: "mystic arcanum",
      from: {
        option_set_type: "options_array",
        options: WARLOCK_MYSTIC_ARCANUM_8_OPTIONS,
      },
    },
  },
  createWarlockEldritchInvocationFeature(
    "eldritch-invocations-7",
    15,
    "Choose one additional Eldritch Invocation.",
  ),
  createAbilityScoreImprovementFeature("warlock-ability-score-improvement-4", 16, CASTER_FEAT_OPTIONS),
  createWarlockSpellChoiceFeature(
    "warlock-prepared-spells-13",
    17,
    "Prepared Spells",
    "Choose one additional Warlock spell. Your regular Pact Magic list remains separate from your 9th-level Mystic Arcanum choice.",
    1,
    WARLOCK_LEVEL_5_SPELL_OPTIONS,
    "warlock spell",
  ),
  {
    index: "mystic-arcanum-9th-level",
    level: 17,
    name: "Mystic Arcanum (9th-Level Spell)",
    desc: [
      "Choose one 9th-level Warlock spell as your Mystic Arcanum so you can cast it once without expending a Pact Magic slot, regaining that use after a Long Rest.",
    ],
    feature_specific: {
      choose: 1,
      type: "mystic arcanum",
      from: {
        option_set_type: "options_array",
        options: WARLOCK_MYSTIC_ARCANUM_9_OPTIONS,
      },
    },
  },
  createWarlockEldritchInvocationFeature(
    "eldritch-invocations-8",
    18,
    "Choose one additional Eldritch Invocation.",
  ),
  createEpicBoonFeature("warlock-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Spell Recall and Boon of Dimensional Travel both suit many warlocks."),
  createSimpleFeature(
    "eldritch-master",
    20,
    "Eldritch Master",
    "Your command of pact magic reaches its peak, letting you draw on your patron's power with exceptional efficiency.",
  ),
];

const WIZARD_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createWizardSpellChoiceFeature(
    "wizard-cantrips-1",
    1,
    "Cantrips",
    "Choose three Wizard cantrips to begin your arcane training.",
    3,
    WIZARD_CANTRIP_OPTIONS,
    "wizard cantrip",
  ),
  createWizardSpellChoiceFeature(
    "wizard-spellbook-1",
    1,
    "Spellbook",
    "Choose six 1st-level Wizard spells to place in your spellbook at 1st level.",
    6,
    WIZARD_LEVEL_1_SPELL_OPTIONS,
    "wizard spell",
  ),
  createSimpleFeature(
    "wizard-spellcasting",
    1,
    "Spellcasting",
    "You prepare and cast Wizard spells through rigorous study, using Intelligence as the spellcasting ability behind your arcane formulas.",
  ),
  createSimpleFeature(
    "ritual-adept",
    1,
    "Ritual Adept",
    "Your study of ritual magic lets you handle ritual spells with greater efficiency, reinforcing the wizard's identity as the prepared arcane scholar.",
  ),
  createSimpleFeature(
    "arcane-recovery",
    1,
    "Arcane Recovery",
    "You can recover some expended spell power during a short rest, reflecting disciplined arcane study and efficient magical pacing.",
  ),
  createWizardSpellChoiceFeature(
    "wizard-spellbook-2",
    2,
    "Spellbook Additions",
    "Add two more Wizard spells to your spellbook. At this level you still choose from 1st-level Wizard spells.",
    2,
    WIZARD_LEVEL_1_SPELL_OPTIONS,
    "wizard spell",
  ),
  {
    index: "scholar",
    level: 2,
    name: "Scholar",
    desc: [
      "Choose an area of academic mastery that reflects the branch of knowledge your magical training leans on most heavily.",
      "You gain Expertise in the scholarly skill you choose.",
    ],
    feature_specific: {
      choose: 1,
      type: "scholar",
      from: {
        option_set_type: "options_array",
        options: toReferenceOptions(WIZARD_SCHOLAR_OPTIONS, "proficiencies"),
      },
    },
  },
  createWizardSpellChoiceFeature(
    "wizard-spellbook-3",
    3,
    "Spellbook Additions",
    "Add two more Wizard spells to your spellbook. You can now include 2nd-level Wizard spells.",
    2,
    WIZARD_LEVEL_2_SPELL_OPTIONS,
    "wizard spell",
  ),
  createSubclassChoiceFeature(
    "wizard-subclass",
    3,
    "Wizard",
    WIZARD_SUBCLASSES,
    "Choose the magical discipline that defines your scholarly specialization and later subclass features.",
  ),
  {
    index: "wizard-subclass-feature-3",
    level: 3,
    name: "Subclass Feature",
    desc: [
      "Your chosen magical discipline grants its defining 3rd-level features.",
      "Abjurer focuses on wards and magical protection.",
      "Diviner studies fate, omens, and probability.",
      "Evoker specializes in raw destructive spell power.",
      "Illusionist bends perception and false reality.",
    ],
  },
  {
    index: "arcane-ward",
    level: 3,
    name: "Arcane Ward",
    desc: [
      "Your abjurations create a protective ward that absorbs incoming harm, making your defensive study tangible in battle.",
    ],
    subclass: {
      index: "abjurer",
      name: "Abjurer",
      url: "/api/2024/subclasses/abjurer",
    },
  },
  {
    index: "portent",
    level: 3,
    name: "Portent",
    desc: [
      "You prepare foretold dice that can replace later rolls at crucial moments, letting foresight reshape the most important outcomes.",
    ],
    subclass: {
      index: "diviner",
      name: "Diviner",
      url: "/api/2024/subclasses/diviner",
    },
  },
  {
    index: "evocation-savant",
    level: 3,
    name: "Evocation Savant",
    desc: [
      "Your formal study makes evocation spells easier and more natural to master, sharpening the efficiency of your destructive magic.",
    ],
    subclass: {
      index: "evoker",
      name: "Evoker",
      url: "/api/2024/subclasses/evoker",
    },
  },
  {
    index: "sculpt-spells",
    level: 3,
    name: "Sculpt Spells",
    desc: [
      "You can spare allies from the worst of your area effects, letting your biggest blasts remain practical in a crowded fight.",
    ],
    subclass: {
      index: "evoker",
      name: "Evoker",
      url: "/api/2024/subclasses/evoker",
    },
  },
  {
    index: "improved-minor-illusion",
    level: 3,
    name: "Improved Minor Illusion",
    desc: [
      "Your simplest illusions become more useful and more convincing, giving falsehood an immediately practical edge.",
    ],
    subclass: {
      index: "illusionist",
      name: "Illusionist",
      url: "/api/2024/subclasses/illusionist",
    },
  },
  createWizardSpellChoiceFeature(
    "wizard-cantrips-2",
    4,
    "Cantrip",
    "Choose one additional Wizard cantrip.",
    1,
    WIZARD_CANTRIP_OPTIONS,
    "wizard cantrip",
  ),
  createWizardSpellChoiceFeature(
    "wizard-spellbook-4",
    4,
    "Spellbook Additions",
    "Add two more Wizard spells to your spellbook.",
    2,
    WIZARD_LEVEL_2_SPELL_OPTIONS,
    "wizard spell",
  ),
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-1", 4, CASTER_FEAT_OPTIONS),
  createSimpleFeature(
    "memorize-spell",
    5,
    "Memorize Spell",
    "With focused study, you can swap a prepared spell more fluidly than other prepared casters, reflecting the wizard's command of spell theory.",
  ),
  createWizardSpellChoiceFeature(
    "wizard-spellbook-5",
    5,
    "Spellbook Additions",
    "Add two more Wizard spells to your spellbook. You can now include 3rd-level Wizard spells.",
    2,
    WIZARD_LEVEL_3_SPELL_OPTIONS,
    "wizard spell",
  ),
  {
    index: "wizard-subclass-feature-6",
    level: 6,
    name: "Subclass Feature",
    desc: [
      "Your magical discipline grants a stronger technical expression at this level.",
      "Abjurer improves wards and magic-denial tools.",
      "Diviner manipulates outcomes through foresight.",
      "Evoker extracts more efficiency from offensive spells.",
      "Illusionist gains deeper control over believable unreality.",
    ],
  },
  {
    index: "projected-ward",
    level: 6,
    name: "Projected Ward",
    desc: [
      "Your ward can extend outward to shield allies as well as yourself, turning abjuration study into party-wide protection.",
    ],
    subclass: {
      index: "abjurer",
      name: "Abjurer",
      url: "/api/2024/subclasses/abjurer",
    },
  },
  {
    index: "expert-divination",
    level: 6,
    name: "Expert Divination",
    desc: [
      "Divination magic becomes a more efficient and sustainable part of your practice, rewarding a wizard who leans into foresight.",
    ],
    subclass: {
      index: "diviner",
      name: "Diviner",
      url: "/api/2024/subclasses/diviner",
    },
  },
  {
    index: "potent-cantrip",
    level: 6,
    name: "Potent Cantrip",
    desc: [
      "Even partial spell resistance is not enough to fully blunt your basic offense, making your at-will damage more dependable.",
    ],
    subclass: {
      index: "evoker",
      name: "Evoker",
      url: "/api/2024/subclasses/evoker",
    },
  },
  {
    index: "malleable-illusions",
    level: 6,
    name: "Malleable Illusions",
    desc: [
      "You can reshape your active illusions without starting from scratch, making your deception more adaptive and reactive.",
    ],
    subclass: {
      index: "illusionist",
      name: "Illusionist",
      url: "/api/2024/subclasses/illusionist",
    },
  },
  createWizardSpellChoiceFeature(
    "wizard-spellbook-6",
    6,
    "Spellbook Additions",
    "Add two more Wizard spells to your spellbook.",
    2,
    WIZARD_LEVEL_3_SPELL_OPTIONS,
    "wizard spell",
  ),
  createWizardSpellChoiceFeature(
    "wizard-spellbook-7",
    7,
    "Spellbook Additions",
    "Add two more Wizard spells to your spellbook. You can now include 4th-level Wizard spells.",
    2,
    WIZARD_LEVEL_4_SPELL_OPTIONS,
    "wizard spell",
  ),
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-2", 8, CASTER_FEAT_OPTIONS),
  createWizardSpellChoiceFeature(
    "wizard-spellbook-8",
    8,
    "Spellbook Additions",
    "Add two more Wizard spells to your spellbook.",
    2,
    WIZARD_LEVEL_4_SPELL_OPTIONS,
    "wizard spell",
  ),
  createWizardSpellChoiceFeature(
    "wizard-spellbook-9",
    9,
    "Spellbook Additions",
    "Add two more Wizard spells to your spellbook. You can now include 5th-level Wizard spells.",
    2,
    WIZARD_LEVEL_5_SPELL_OPTIONS,
    "wizard spell",
  ),
  {
    index: "wizard-subclass-feature-10",
    level: 10,
    name: "Subclass Feature",
    desc: [
      "Your magical discipline grants a powerful mid-tier specialization feature.",
      "Abjurer becomes a sturdier anchor of magical defense.",
      "Diviner sees farther into possibility and consequence.",
      "Evoker empowers destructive spells without losing control.",
      "Illusionist makes falsehood more flexible and convincing.",
    ],
  },
  {
    index: "improved-abjuration",
    level: 10,
    name: "Improved Abjuration",
    desc: [
      "You are especially effective at breaking hostile magic and magical effects, reinforcing the abjurer's role as an arcane bulwark.",
    ],
    subclass: {
      index: "abjurer",
      name: "Abjurer",
      url: "/api/2024/subclasses/abjurer",
    },
  },
  {
    index: "the-third-eye",
    level: 10,
    name: "The Third Eye",
    desc: [
      "Your senses sharpen through magical perception and supernatural sight, widening what you can notice before others do.",
    ],
    subclass: {
      index: "diviner",
      name: "Diviner",
      url: "/api/2024/subclasses/diviner",
    },
  },
  {
    index: "empowered-evocation",
    level: 10,
    name: "Empowered Evocation",
    desc: [
      "Your Intelligence intensifies the damage of key evocation spells, squeezing even more value out of raw magical force.",
    ],
    subclass: {
      index: "evoker",
      name: "Evoker",
      url: "/api/2024/subclasses/evoker",
    },
  },
  {
    index: "illusory-self",
    level: 10,
    name: "Illusory Self",
    desc: [
      "A false version of you can absorb a critical blow or turn an attack aside, making your deception directly defensive.",
    ],
    subclass: {
      index: "illusionist",
      name: "Illusionist",
      url: "/api/2024/subclasses/illusionist",
    },
  },
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-3", 12, CASTER_FEAT_OPTIONS),
  {
    index: "wizard-subclass-feature-14",
    level: 14,
    name: "Subclass Feature",
    desc: [
      "Your magical discipline reaches its capstone expression.",
      "Abjurer becomes exceptionally difficult to break through.",
      "Diviner turns foresight into decisive certainty.",
      "Evoker pushes destructive magic to its safe limits.",
      "Illusionist blurs the line between illusion and reality.",
    ],
  },
  {
    index: "spell-resistance",
    level: 14,
    name: "Spell Resistance",
    desc: [
      "At your peak, magic itself has a harder time harming you, making the abjurer exceptionally difficult to break through.",
    ],
    subclass: {
      index: "abjurer",
      name: "Abjurer",
      url: "/api/2024/subclasses/abjurer",
    },
  },
  {
    index: "greater-portent",
    level: 14,
    name: "Greater Portent",
    desc: [
      "At your peak, you influence even more key moments through prepared omens, turning foresight into decisive certainty.",
    ],
    subclass: {
      index: "diviner",
      name: "Diviner",
      url: "/api/2024/subclasses/diviner",
    },
  },
  {
    index: "overchannel",
    level: 14,
    name: "Overchannel",
    desc: [
      "You can force a spell beyond safe limits for devastating effect, pushing evocation power to its dangerous edge.",
    ],
    subclass: {
      index: "evoker",
      name: "Evoker",
      url: "/api/2024/subclasses/evoker",
    },
  },
  {
    index: "illusory-reality",
    level: 14,
    name: "Illusory Reality",
    desc: [
      "Part of an illusion can briefly become tangibly real, blurring the line between deception and actual force.",
    ],
    subclass: {
      index: "illusionist",
      name: "Illusionist",
      url: "/api/2024/subclasses/illusionist",
    },
  },
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-4", 16, CASTER_FEAT_OPTIONS),
  createEpicBoonFeature("wizard-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Spell Recall is especially appropriate for many wizards."),
  createSimpleFeature(
    "wizard-signature-spells",
    20,
    "Signature Spells",
    "Two favored spells become such a natural part of your repertoire that you can produce them with exceptional efficiency every day.",
  ),
];

const DRUID_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "druid-1", level: 1, features: ["druid-cantrips-1", "druid-spellcasting", "druidic", "druid-primal-order"] },
  { index: "druid-2", level: 2, features: ["druid-wild-shape", "druid-wild-companion"] },
  {
    index: "druid-3",
    level: 3,
    features: [
      "druid-subclass",
      "druid-subclass-feature-3",
      "circle-spells",
      "lands-aid",
      "circle-forms",
      "moonlight-step",
      "wrath-of-the-sea",
      "watery-aegis",
      "star-map",
      "starry-form",
      "circle-of-the-land-terrain",
    ],
  },
  { index: "druid-4", level: 4, features: ["druid-cantrips-2", "druid-ability-score-improvement-1"] },
  { index: "druid-5", level: 5, features: ["druid-wild-resurgence"] },
  {
    index: "druid-6",
    level: 6,
    features: [
      "druid-subclass-feature-6",
      "natural-recovery",
      "improved-circle-forms",
      "oceanic-gift",
      "cosmic-omen",
    ],
  },
  { index: "druid-7", level: 7, features: ["druid-elemental-fury"] },
  { index: "druid-8", level: 8, features: ["druid-ability-score-improvement-2"] },
  {
    index: "druid-10",
    level: 10,
    features: [
      "druid-cantrips-3",
      "druid-subclass-feature-10",
      "natures-ward",
      "moonlit-passage",
      "stormborn",
      "twinkling-constellations",
    ],
  },
  { index: "druid-11", level: 11, features: ["druid-improved-elemental-fury"] },
  { index: "druid-12", level: 12, features: ["druid-ability-score-improvement-3"] },
  {
    index: "druid-14",
    level: 14,
    features: [
      "druid-subclass-feature-14",
      "natures-sanctuary",
      "lunar-form",
      "seas-fury",
      "full-of-stars",
    ],
  },
  { index: "druid-16", level: 16, features: ["druid-ability-score-improvement-4"] },
  { index: "druid-18", level: 18, features: ["druid-beast-spells"] },
  { index: "druid-19", level: 19, features: ["druid-epic-boon"] },
  { index: "druid-20", level: 20, features: ["druid-archdruid"] },
];

const FIGHTER_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "fighter-1", level: 1, features: ["fighter-fighting-style", "second-wind", "fighter-weapon-mastery"] },
  { index: "fighter-2", level: 2, features: ["action-surge-1-use", "fighter-tactical-mind"] },
  {
    index: "fighter-3",
    level: 3,
    features: [
      "fighter-subclass",
      "fighter-subclass-feature-3",
      "combat-superiority",
      "student-of-war",
      "improved-critical",
      "eldritch-knight-spellcasting",
      "war-bond",
      "fighter-psi-warrior-psionic-power",
      "telekinetic-adept",
    ],
  },
  { index: "fighter-4", level: 4, features: ["fighter-ability-score-improvement-1"] },
  { index: "fighter-5", level: 5, features: ["extra-attack-1", "fighter-tactical-shift"] },
  { index: "fighter-6", level: 6, features: ["fighter-ability-score-improvement-2"] },
  {
    index: "fighter-7",
    level: 7,
    features: [
      "fighter-subclass-feature-7",
      "know-your-enemy",
      "remarkable-athlete",
      "war-magic",
      "guarded-mind",
    ],
  },
  { index: "fighter-8", level: 8, features: ["fighter-ability-score-improvement-3"] },
  { index: "fighter-9", level: 9, features: ["fighter-tactical-master", "indomitable-1-use"] },
  {
    index: "fighter-10",
    level: 10,
    features: [
      "fighter-subclass-feature-10",
      "improved-combat-superiority",
      "heroic-warrior",
      "eldritch-strike",
      "bulwark-of-force",
    ],
  },
  { index: "fighter-11", level: 11, features: ["fighter-two-extra-attacks"] },
  { index: "fighter-12", level: 12, features: ["fighter-ability-score-improvement-4"] },
  { index: "fighter-13", level: 13, features: ["indomitable-2-uses", "fighter-studied-attacks"] },
  { index: "fighter-14", level: 14, features: ["fighter-ability-score-improvement-5"] },
  {
    index: "fighter-15",
    level: 15,
    features: [
      "fighter-subclass-feature-15",
      "relentless",
      "superior-critical",
      "arcane-charge",
      "psi-powered-leap",
    ],
  },
  { index: "fighter-16", level: 16, features: ["fighter-ability-score-improvement-6"] },
  { index: "fighter-17", level: 17, features: ["action-surge-2-uses", "indomitable-3-uses"] },
  {
    index: "fighter-18",
    level: 18,
    features: [
      "fighter-subclass-feature-18",
      "supreme-combat-superiority",
      "survivor",
      "improved-war-magic",
      "telekinetic-master",
    ],
  },
  { index: "fighter-19", level: 19, features: ["fighter-epic-boon"] },
  { index: "fighter-20", level: 20, features: ["fighter-three-extra-attacks"] },
];

const MONK_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "monk-1", level: 1, features: ["monk-unarmored-defense", "martial-arts"] },
  { index: "monk-2", level: 2, features: ["monks-focus", "monk-unarmored-movement", "monk-uncanny-metabolism"] },
  {
    index: "monk-3",
    level: 3,
    features: [
      "monk-subclass",
      "monk-subclass-feature-3",
      "mercy-hand-of-healing",
      "mercy-hand-of-harm",
      "elements-elemental-attunement",
      "elements-elemental-expression",
      "open-hand-technique",
      "shadow-arts",
      "deflect-attacks",
    ],
  },
  { index: "monk-4", level: 4, features: ["monk-ability-score-improvement-1", "slow-fall"] },
  { index: "monk-5", level: 5, features: ["monk-extra-attack", "stunning-strike"] },
  {
    index: "monk-6",
    level: 6,
    features: [
      "monk-empowered-strikes",
      "monk-subclass-feature-6",
      "mercy-physicians-touch",
      "reach-of-the-elements",
      "wholeness-of-body",
      "shadow-step",
    ],
  },
  { index: "monk-7", level: 7, features: ["monk-evasion"] },
  { index: "monk-8", level: 8, features: ["monk-ability-score-improvement-2"] },
  { index: "monk-9", level: 9, features: ["monk-acrobatic-movement"] },
  { index: "monk-10", level: 10, features: ["monk-heightened-focus"] },
  {
    index: "monk-11",
    level: 11,
    features: [
      "monk-subclass-feature-11",
      "mercy-flurry-of-healing-and-harm",
      "stride-of-the-elements",
      "fleet-step",
      "cloak-of-shadows",
    ],
  },
  { index: "monk-12", level: 12, features: ["monk-ability-score-improvement-3"] },
  { index: "monk-13", level: 13, features: ["monk-self-restoration"] },
  { index: "monk-14", level: 14, features: ["monk-disciplined-survivor"] },
  { index: "monk-15", level: 15, features: ["monk-perfect-focus"] },
  { index: "monk-16", level: 16, features: ["monk-ability-score-improvement-4"] },
  {
    index: "monk-17",
    level: 17,
    features: [
      "monk-subclass-feature-17",
      "hand-of-ultimate-mercy",
      "elemental-epitome",
      "quivering-palm",
      "opportunist",
    ],
  },
  { index: "monk-18", level: 18, features: ["monk-superior-defense"] },
  { index: "monk-19", level: 19, features: ["monk-epic-boon"] },
  { index: "monk-20", level: 20, features: ["monk-body-and-mind"] },
];

const PALADIN_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "paladin-1", level: 1, features: ["lay-on-hands", "paladin-spellcasting", "paladin-weapon-mastery"] },
  { index: "paladin-2", level: 2, features: ["paladin-fighting-style", "paladins-smite"] },
  {
    index: "paladin-3",
    level: 3,
    features: [
      "paladin-channel-divinity",
      "paladin-subclass",
      "paladin-subclass-feature-3",
      "devotion-oath-spells",
      "devotion-sacred-weapon",
      "devotion-turn-the-unholy",
      "glory-oath-spells",
      "glory-inspiring-smite",
      "glory-peerless-athlete",
      "ancients-oath-spells",
      "ancients-natures-wrath",
      "ancients-turn-the-faithless",
      "vengeance-oath-spells",
      "vengeance-abjure-enemy",
      "vengeance-vow-of-enmity",
    ],
  },
  { index: "paladin-4", level: 4, features: ["paladin-ability-score-improvement-1"] },
  { index: "paladin-5", level: 5, features: ["paladin-extra-attack", "faithful-steed"] },
  { index: "paladin-6", level: 6, features: ["aura-of-protection"] },
  {
    index: "paladin-7",
    level: 7,
    features: [
      "paladin-subclass-feature-7",
      "devotion-aura-of-devotion",
      "glory-aura-of-alacrity",
      "ancients-aura-of-warding",
      "vengeance-relentless-avenger",
    ],
  },
  { index: "paladin-8", level: 8, features: ["paladin-ability-score-improvement-2"] },
  { index: "paladin-9", level: 9, features: ["abjure-foes"] },
  { index: "paladin-10", level: 10, features: ["aura-of-courage"] },
  { index: "paladin-11", level: 11, features: ["radiant-strikes"] },
  { index: "paladin-12", level: 12, features: ["paladin-ability-score-improvement-3"] },
  { index: "paladin-14", level: 14, features: ["restoring-touch"] },
  {
    index: "paladin-15",
    level: 15,
    features: [
      "paladin-subclass-feature-15",
      "devotion-smite-of-protection",
      "glory-glorious-defense",
      "ancients-undying-sentinel",
      "vengeance-soul-of-vengeance",
    ],
  },
  { index: "paladin-16", level: 16, features: ["paladin-ability-score-improvement-4"] },
  { index: "paladin-18", level: 18, features: ["aura-expansion"] },
  { index: "paladin-19", level: 19, features: ["paladin-epic-boon"] },
  {
    index: "paladin-20",
    level: 20,
    features: [
      "paladin-subclass-feature-20",
      "devotion-holy-nimbus",
      "glory-living-legend",
      "ancients-elder-champion",
      "vengeance-avenging-angel",
    ],
  },
];

const RANGER_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "ranger-1", level: 1, features: ["ranger-deft-explorer", "ranger-favored-enemy", "ranger-spellcasting", "ranger-weapon-mastery"] },
  { index: "ranger-2", level: 2, features: ["ranger-fighting-style"] },
  {
    index: "ranger-3",
    level: 3,
    features: [
      "ranger-roving",
      "ranger-subclass",
      "ranger-subclass-feature-3",
      "beast-master-rangers-companion",
      "beast-master-primal-bond",
      "fey-wanderer-dreadful-strikes",
      "fey-wanderer-magic",
      "fey-wanderer-otherworldly-glamour",
      "gloom-stalker-dread-ambusher",
      "gloom-stalker-umbral-sight",
      "hunters-lore",
      "hunters-prey",
    ],
  },
  { index: "ranger-4", level: 4, features: ["ranger-ability-score-improvement-1"] },
  { index: "ranger-5", level: 5, features: ["ranger-extra-attack"] },
  { index: "ranger-6", level: 6, features: ["ranger-expertise"] },
  {
    index: "ranger-7",
    level: 7,
    features: [
      "ranger-subclass-feature-7",
      "beast-master-exceptional-training",
      "fey-wanderer-beguiling-twist",
      "gloom-stalker-iron-mind",
      "hunter-defensive-tactics",
    ],
  },
  { index: "ranger-8", level: 8, features: ["ranger-ability-score-improvement-2"] },
  { index: "ranger-9", level: 9, features: ["ranger-tireless"] },
  { index: "ranger-10", level: 10, features: ["ranger-natures-veil"] },
  {
    index: "ranger-11",
    level: 11,
    features: [
      "ranger-subclass-feature-11",
      "beast-master-bestial-fury",
      "fey-wanderer-fey-reinforcements",
      "gloom-stalker-stalkers-flurry",
      "hunter-superior-hunters-prey",
    ],
  },
  { index: "ranger-12", level: 12, features: ["ranger-ability-score-improvement-3"] },
  { index: "ranger-13", level: 13, features: ["ranger-relentless-hunter"] },
  { index: "ranger-14", level: 14, features: ["ranger-precise-hunter"] },
  {
    index: "ranger-15",
    level: 15,
    features: [
      "ranger-subclass-feature-15",
      "beast-master-share-spells",
      "fey-wanderer-misty-wanderer",
      "gloom-stalker-shadowy-dodge",
      "hunter-superior-hunters-defense",
    ],
  },
  { index: "ranger-16", level: 16, features: ["ranger-ability-score-improvement-4"] },
  { index: "ranger-18", level: 18, features: ["ranger-feral-senses"] },
  { index: "ranger-19", level: 19, features: ["ranger-epic-boon"] },
  { index: "ranger-20", level: 20, features: ["ranger-foe-slayer"] },
];

const ROGUE_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "rogue-1", level: 1, features: ["rogue-expertise-1", "sneak-attack", "thieves-cant", "rogue-weapon-mastery"] },
  { index: "rogue-2", level: 2, features: ["cunning-action", "rogue-steady-aim"] },
  {
    index: "rogue-3",
    level: 3,
    features: [
      "rogue-subclass",
      "rogue-subclass-feature-3",
      "arcane-trickster-spellcasting",
      "arcane-trickster-mage-hand-legerdemain",
      "assassinate",
      "envenom-weapons",
      "psychic-blades",
      "psionic-power",
      "fast-hands",
      "second-story-work",
      "rogue-cunning-strike",
    ],
  },
  { index: "rogue-4", level: 4, features: ["rogue-ability-score-improvement-1"] },
  { index: "rogue-5", level: 5, features: ["uncanny-dodge"] },
  { index: "rogue-6", level: 6, features: ["rogue-expertise-2"] },
  { index: "rogue-7", level: 7, features: ["rogue-evasion", "rogue-reliable-talent"] },
  { index: "rogue-8", level: 8, features: ["rogue-ability-score-improvement-2"] },
  {
    index: "rogue-9",
    level: 9,
    features: [
      "rogue-subclass-feature-9",
      "magical-ambush",
      "infiltration-expertise",
      "soul-blades",
      "supreme-sneak",
    ],
  },
  { index: "rogue-10", level: 10, features: ["rogue-ability-score-improvement-3"] },
  { index: "rogue-11", level: 11, features: ["rogue-improved-cunning-strike"] },
  { index: "rogue-12", level: 12, features: ["rogue-ability-score-improvement-4"] },
  {
    index: "rogue-13",
    level: 13,
    features: [
      "rogue-subclass-feature-13",
      "versatile-trickster",
      "impostor",
      "psychic-veil",
      "use-magic-device",
    ],
  },
  { index: "rogue-14", level: 14, features: ["rogue-devious-strikes"] },
  { index: "rogue-15", level: 15, features: ["slippery-mind"] },
  { index: "rogue-16", level: 16, features: ["rogue-ability-score-improvement-5"] },
  {
    index: "rogue-17",
    level: 17,
    features: [
      "rogue-subclass-feature-17",
      "spell-thief",
      "death-strike",
      "rend-mind",
      "thiefs-reflexes",
    ],
  },
  { index: "rogue-18", level: 18, features: ["elusive"] },
  { index: "rogue-19", level: 19, features: ["rogue-epic-boon"] },
  { index: "rogue-20", level: 20, features: ["stroke-of-luck"] },
];

const SORCERER_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "sorcerer-1", level: 1, features: ["sorcerer-cantrips-1", "sorcerer-spellcasting", "sorcerer-spells-1", "sorcerer-innate-sorcery"] },
  { index: "sorcerer-2", level: 2, features: ["sorcerer-font-of-magic", "sorcerer-spells-2", "metamagic-1"] },
  {
    index: "sorcerer-3",
    level: 3,
    features: [
      "sorcerer-subclass",
      "sorcerer-subclass-feature-3",
      "aberrant-psionic-spells",
      "telepathic-speech",
      "clockwork-spells",
      "restore-balance",
      "draconic-resilience",
      "draconic-ancestor",
      "wild-magic-surge",
      "tides-of-chaos",
      "sorcerer-spells-3",
    ],
  },
  { index: "sorcerer-4", level: 4, features: ["sorcerer-cantrips-2", "sorcerer-spells-4", "sorcerer-ability-score-improvement-1"] },
  { index: "sorcerer-5", level: 5, features: ["sorcerer-sorcerous-restoration", "sorcerer-spells-5"] },
  {
    index: "sorcerer-6",
    level: 6,
    features: [
      "sorcerer-subclass-feature-6",
      "psionic-sorcery",
      "bastion-of-law",
      "elemental-affinity",
      "bend-luck",
      "sorcerer-spells-6",
    ],
  },
  { index: "sorcerer-7", level: 7, features: ["sorcerer-sorcery-incarnate", "sorcerer-spells-7"] },
  { index: "sorcerer-8", level: 8, features: ["sorcerer-spells-8", "sorcerer-ability-score-improvement-2"] },
  { index: "sorcerer-9", level: 9, features: ["sorcerer-spells-9"] },
  { index: "sorcerer-10", level: 10, features: ["sorcerer-cantrips-3", "sorcerer-spells-10", "metamagic-2"] },
  { index: "sorcerer-11", level: 11, features: ["sorcerer-spells-11"] },
  { index: "sorcerer-12", level: 12, features: ["sorcerer-ability-score-improvement-3"] },
  { index: "sorcerer-13", level: 13, features: ["sorcerer-spells-12"] },
  {
    index: "sorcerer-14",
    level: 14,
    features: [
      "sorcerer-subclass-feature-14",
      "revelation-in-flesh",
      "trance-of-order",
      "dragon-wings",
      "controlled-chaos",
    ],
  },
  { index: "sorcerer-15", level: 15, features: ["sorcerer-spells-13"] },
  { index: "sorcerer-16", level: 16, features: ["sorcerer-ability-score-improvement-4"] },
  { index: "sorcerer-17", level: 17, features: ["sorcerer-spells-14", "metamagic-3"] },
  {
    index: "sorcerer-18",
    level: 18,
    features: [
      "sorcerer-subclass-feature-18",
      "warping-implosion",
      "clockwork-cavalcade",
      "draconic-presence",
      "spell-bombardment",
    ],
  },
  { index: "sorcerer-19", level: 19, features: ["sorcerer-epic-boon"] },
  { index: "sorcerer-20", level: 20, features: ["arcane-apotheosis"] },
];

const WARLOCK_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "warlock-1", level: 1, features: ["warlock-cantrips-1", "warlock-prepared-spells-1", "eldritch-invocations-1", "pact-magic"] },
  { index: "warlock-2", level: 2, features: ["warlock-magical-cunning", "warlock-prepared-spells-2", "eldritch-invocations-2"] },
  {
    index: "warlock-3",
    level: 3,
    features: [
      "pact-boon",
      "warlock-prepared-spells-3",
      "warlock-subclass",
      "warlock-subclass-feature-3",
      "fey-presence",
      "healing-light",
      "dark-ones-blessing",
      "awakened-mind",
    ],
  },
  { index: "warlock-4", level: 4, features: ["warlock-cantrips-2", "warlock-prepared-spells-4", "warlock-ability-score-improvement-1"] },
  { index: "warlock-5", level: 5, features: ["warlock-prepared-spells-5", "eldritch-invocations-3"] },
  {
    index: "warlock-6",
    level: 6,
    features: [
      "warlock-prepared-spells-6",
      "warlock-subclass-feature-6",
      "misty-escape",
      "radiant-soul",
      "dark-ones-own-luck",
      "entropic-ward",
    ],
  },
  { index: "warlock-7", level: 7, features: ["warlock-prepared-spells-7", "eldritch-invocations-4"] },
  { index: "warlock-8", level: 8, features: ["warlock-prepared-spells-8", "warlock-ability-score-improvement-2"] },
  { index: "warlock-9", level: 9, features: ["contact-patron", "warlock-prepared-spells-9", "eldritch-invocations-5"] },
  {
    index: "warlock-10",
    level: 10,
    features: [
      "warlock-cantrips-3",
      "warlock-subclass-feature-10",
      "beguiling-defenses",
      "celestial-resilience",
      "fiendish-resilience",
      "thought-shield",
    ],
  },
  { index: "warlock-11", level: 11, features: ["warlock-prepared-spells-10", "mystic-arcanum-6th-level"] },
  { index: "warlock-12", level: 12, features: ["warlock-ability-score-improvement-3", "eldritch-invocations-6"] },
  { index: "warlock-13", level: 13, features: ["warlock-prepared-spells-11", "mystic-arcanum-7th-level"] },
  {
    index: "warlock-14",
    level: 14,
    features: [
      "warlock-subclass-feature-14",
      "dark-delirium",
      "searing-vengeance",
      "hurl-through-hell",
      "create-thrall",
    ],
  },
  { index: "warlock-15", level: 15, features: ["warlock-prepared-spells-12", "mystic-arcanum-8th-level", "eldritch-invocations-7"] },
  { index: "warlock-16", level: 16, features: ["warlock-ability-score-improvement-4"] },
  { index: "warlock-17", level: 17, features: ["warlock-prepared-spells-13", "mystic-arcanum-9th-level"] },
  { index: "warlock-18", level: 18, features: ["eldritch-invocations-8"] },
  { index: "warlock-19", level: 19, features: ["warlock-epic-boon"] },
  { index: "warlock-20", level: 20, features: ["eldritch-master"] },
];

const WIZARD_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "wizard-1", level: 1, features: ["wizard-cantrips-1", "wizard-spellbook-1", "wizard-spellcasting", "ritual-adept", "arcane-recovery"] },
  { index: "wizard-2", level: 2, features: ["wizard-spellbook-2", "scholar"] },
  {
    index: "wizard-3",
    level: 3,
    features: [
      "wizard-spellbook-3",
      "wizard-subclass",
      "wizard-subclass-feature-3",
      "arcane-ward",
      "portent",
      "evocation-savant",
      "sculpt-spells",
      "improved-minor-illusion",
    ],
  },
  { index: "wizard-4", level: 4, features: ["wizard-cantrips-2", "wizard-spellbook-4", "wizard-ability-score-improvement-1"] },
  { index: "wizard-5", level: 5, features: ["memorize-spell", "wizard-spellbook-5"] },
  {
    index: "wizard-6",
    level: 6,
    features: [
      "wizard-subclass-feature-6",
      "wizard-spellbook-6",
      "projected-ward",
      "expert-divination",
      "potent-cantrip",
      "malleable-illusions",
    ],
  },
  { index: "wizard-7", level: 7, features: ["wizard-spellbook-7"] },
  { index: "wizard-8", level: 8, features: ["wizard-spellbook-8", "wizard-ability-score-improvement-2"] },
  { index: "wizard-9", level: 9, features: ["wizard-spellbook-9"] },
  {
    index: "wizard-10",
    level: 10,
    features: [
      "wizard-subclass-feature-10",
      "improved-abjuration",
      "the-third-eye",
      "empowered-evocation",
      "illusory-self",
    ],
  },
  { index: "wizard-12", level: 12, features: ["wizard-ability-score-improvement-3"] },
  {
    index: "wizard-14",
    level: 14,
    features: [
      "wizard-subclass-feature-14",
      "spell-resistance",
      "greater-portent",
      "overchannel",
      "illusory-reality",
    ],
  },
  { index: "wizard-16", level: 16, features: ["wizard-ability-score-improvement-4"] },
  { index: "wizard-18", level: 18, features: ["spell-mastery"] },
  { index: "wizard-19", level: 19, features: ["wizard-epic-boon"] },
  { index: "wizard-20", level: 20, features: ["wizard-signature-spells"] },
];

const DRUID_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "circle-of-the-land",
    name: "Circle of the Land",
    subclass_flavor: "Land",
    summary: "Draw power from a chosen biome and its old magic",
    description: "Druids of the Circle of the Land bind themselves to a specific landscape and draw from the terrain's oldest magical patterns.",
    features: [
      { name: "Circle Spells", level: 3, description: "Your chosen land grants always-prepared spells that reflect its terrain and magical character." },
      { name: "Land's Aid", level: 3, description: "You channel restorative or bolstering terrain magic to support allies while shaping the battlefield." },
      { name: "Natural Recovery", level: 6, description: "You recover magical power more efficiently through communion with the natural world." },
      { name: "Nature's Ward", level: 10, description: "The wild protects you from certain elemental, environmental, or natural threats." },
      { name: "Nature's Sanctuary", level: 14, description: "Creatures of the natural world become less willing or less able to strike you directly." },
    ],
  },
  {
    index: "circle-of-the-moon",
    name: "Circle of the Moon",
    subclass_flavor: "Moon",
    summary: "Turn Wild Shape into a frontline lunar battle form",
    description: "Druids of the Circle of the Moon embrace transformation as a primary path to power, becoming fearsome shapeshifters and lunar guardians.",
    features: [
      { name: "Circle Forms", level: 3, description: "Your Wild Shape becomes sturdier, deadlier, and better suited for combat." },
      { name: "Moonlight Step", level: 3, description: "Lunar magic helps you reposition with sudden radiant mobility." },
      { name: "Improved Circle Forms", level: 6, description: "Your transformed shapes gain stronger combat presence and more reliable staying power." },
      { name: "Moonlit Passage", level: 10, description: "You move through battle with supernatural lunar grace and improved transformational flexibility." },
      { name: "Lunar Form", level: 14, description: "At your peak, moon-charged transformation becomes a defining and overwhelming expression of your magic." },
    ],
  },
  {
    index: "circle-of-the-sea",
    name: "Circle of the Sea",
    subclass_flavor: "Sea",
    summary: "Strike with storm, tide, and salt-soaked fury",
    description: "Druids of the Circle of the Sea channel oceanic motion, storm winds, and crashing surf into restless battlefield control.",
    features: [
      { name: "Wrath of the Sea", level: 3, description: "Sea magic lashes nearby foes with moving water, force, or lightning-like pressure." },
      { name: "Watery Aegis", level: 3, description: "You can sheath yourself or allies in moving sea-born protection." },
      { name: "Oceanic Gift", level: 6, description: "Your control over water and storm deepens, enhancing movement and environmental command." },
      { name: "Stormborn", level: 10, description: "You gain exceptional mobility and battlefield presence through sea and storm magic." },
      { name: "Sea's Fury", level: 14, description: "You become a devastating vessel of oceanic power, overwhelming foes with relentless elemental force." },
    ],
  },
  {
    index: "circle-of-the-stars",
    name: "Circle of the Stars",
    subclass_flavor: "Stars",
    summary: "Read the constellations and become their vessel",
    description: "Druids of the Circle of the Stars treat the night sky as a sacred map, blending prophecy, guidance, and radiant celestial transformation.",
    features: [
      { name: "Star Map", level: 3, description: "A celestial focus helps you cast guiding magic and draw on astrological insight." },
      { name: "Starry Form", level: 3, description: "You take on a luminous constellation form that changes how your magic expresses itself." },
      { name: "Cosmic Omen", level: 6, description: "The stars whisper favorable and unfavorable signs that can bend key rolls." },
      { name: "Twinkling Constellations", level: 10, description: "Your Starry Form becomes more stable, flexible, and powerful." },
      { name: "Full of Stars", level: 14, description: "At your peak, celestial light wraps you in remarkable resilience." },
    ],
  },
];

const FIGHTER_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "battle-master",
    name: "Battle Master",
    subclass_flavor: "Battle Master",
    summary: "Command the fight with maneuvers and precision",
    description: "Battle Masters treat combat as an art of timing, leverage, and disciplined battlefield judgment.",
    features: [
      { name: "Combat Superiority", level: 3, description: "You learn maneuvers fueled by superiority dice that let you push, trip, threaten, and control the field." },
      { name: "Student of War", level: 3, description: "Your martial studies grant a scholar-warrior edge outside direct attacks." },
      { name: "Know Your Enemy", level: 7, description: "You assess opposing combatants with a veteran's eye for strengths and weaknesses." },
      { name: "Improved Combat Superiority", level: 10, description: "Your superiority techniques become broader and more potent." },
      { name: "Relentless", level: 15, description: "When the battle runs long, you regain enough focus to keep maneuvering." },
      { name: "Supreme Combat Superiority", level: 18, description: "Your maneuvers reach a capstone level of elite tactical mastery." },
    ],
  },
  {
    index: "champion",
    name: "Champion",
    subclass_flavor: "Champion",
    summary: "Perfect the fundamentals until they become legendary",
    description: "Champions thrive through relentless consistency, physical excellence, and brutally efficient fundamentals.",
    features: [
      { name: "Improved Critical", level: 3, description: "Your weapon attacks score critical hits more often, rewarding relentless pressure." },
      { name: "Remarkable Athlete", level: 7, description: "You develop broad athletic excellence that improves physical feats and mobility." },
      { name: "Heroic Warrior", level: 10, description: "You embody the ideal battle hero and gain stronger staying power or momentum in a fight." },
      { name: "Superior Critical", level: 15, description: "Your chance to land devastating blows improves again." },
      { name: "Survivor", level: 18, description: "At your peak, you recover from punishment with exceptional battlefield endurance." },
    ],
  },
  {
    index: "eldritch-knight",
    name: "Eldritch Knight",
    subclass_flavor: "Eldritch Knight",
    summary: "Fuse wizardry and weapon skill into one discipline",
    description: "Eldritch Knights marry arcane study with martial rigor, using spells to control tempo, defense, and steel-to-steel exchanges.",
    features: [
      { name: "Spellcasting", level: 3, description: "You learn wizard spells that complement your martial role." },
      { name: "War Bond", level: 3, description: "A bonded weapon remains part of your fighting identity and returns to your command." },
      { name: "War Magic", level: 7, description: "You weave spells and weapon attacks together in the same combat rhythm." },
      { name: "Eldritch Strike", level: 10, description: "Your weapon pressure helps open enemies up to your magic." },
      { name: "Arcane Charge", level: 15, description: "You reposition through battle with forceful magical movement." },
      { name: "Improved War Magic", level: 18, description: "Your spell-and-steel engine reaches its capstone state." },
    ],
  },
  {
    index: "psi-warrior",
    name: "Psi Warrior",
    subclass_flavor: "Psi Warrior",
    summary: "Turn disciplined will into force and protection",
    description: "Psi Warriors channel psionic power through martial training, shaping the battlefield with telekinetic defense and focused mental force.",
    features: [
      { name: "Psionic Power", level: 3, description: "You gain a pool of psionic energy for protective bursts, forceful strikes, and subtle movement." },
      { name: "Telekinetic Adept", level: 3, description: "Your control over movement and force sharpens into a defining combat tool." },
      { name: "Guarded Mind", level: 7, description: "Your disciplined psyche resists hostile mental influence." },
      { name: "Bulwark of Force", level: 10, description: "You project a shield of psionic power to defend the party." },
      { name: "Psi-Powered Leap", level: 15, description: "You move through the field with startling telekinetic control and presence." },
      { name: "Telekinetic Master", level: 18, description: "Your psionic combat style reaches a capstone of overwhelming force and control." },
    ],
  },
];

const MONK_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "warrior-of-mercy",
    name: "Warrior of Mercy",
    subclass_flavor: "Mercy",
    summary: "Heal allies and punish foes with the same precise touch",
    description: "Warriors of Mercy study suffering and relief together, turning disciplined touch into either restoration or ruin.",
    features: [
      { name: "Hand of Healing", level: 3, description: "Your touch can mend wounds quickly and efficiently during a fight." },
      { name: "Hand of Harm", level: 3, description: "Your strikes can inject extra debilitating force into a target." },
      { name: "Physician's Touch", level: 6, description: "Your healing and harmful techniques gain stronger restorative and hindering effects." },
      { name: "Flurry of Healing and Harm", level: 11, description: "You can weave healing and punishing touch into the same burst of motion." },
      { name: "Hand of Ultimate Mercy", level: 17, description: "You gain a capstone expression of lifesaving and life-ending precision." },
    ],
  },
  {
    index: "warrior-of-the-elements",
    name: "Warrior of the Elements",
    subclass_flavor: "Elements",
    summary: "Project elemental force through body and movement",
    description: "Warriors of the Elements turn disciplined motion into a channel for wind, flame, stone, water, and thunderous force.",
    features: [
      { name: "Elemental Attunement", level: 3, description: "You begin shaping elemental force through your strikes and techniques." },
      { name: "Elemental Expression", level: 3, description: "Your body becomes a conduit for elemental reach, motion, or damage." },
      { name: "Reach of the Elements", level: 6, description: "Your elemental influence stretches farther and hits harder." },
      { name: "Stride of the Elements", level: 11, description: "You move through battle with a supernatural elemental flow." },
      { name: "Elemental Epitome", level: 17, description: "At your peak, you become a near-perfect vessel of disciplined elemental force." },
    ],
  },
  {
    index: "warrior-of-the-hand",
    name: "Warrior of the Open Hand",
    subclass_flavor: "Open Hand",
    summary: "Perfect the classic unarmed path through pure technique",
    description: "Warriors of the Open Hand devote themselves to direct mastery of body, balance, and pressure-point precision.",
    features: [
      { name: "Open Hand Technique", level: 3, description: "Your flurry can shove, stagger, or deny enemy reactions through perfect positioning." },
      { name: "Wholeness of Body", level: 6, description: "You can restore yourself through focused inner balance." },
      { name: "Fleet Step", level: 11, description: "Your movement and tempo become even more difficult to answer in combat." },
      { name: "Quivering Palm", level: 17, description: "You learn a legendary finishing technique that can end a fight with a single precise touch." },
    ],
  },
  {
    index: "warrior-of-shadow",
    name: "Warrior of Shadow",
    subclass_flavor: "Shadow",
    summary: "Fight from darkness, silence, and sudden displacement",
    description: "Warriors of Shadow treat concealment, darkness, and timing as the truest expressions of disciplined combat.",
    features: [
      { name: "Shadow Arts", level: 3, description: "You gain magical tools that support concealment, infiltration, and dramatic battlefield setup." },
      { name: "Shadow Step", level: 6, description: "You move between patches of darkness with startling speed and positioning." },
      { name: "Cloak of Shadows", level: 11, description: "You can vanish from easy sight and control the terms of engagement." },
      { name: "Opportunist", level: 17, description: "At your peak, openings in the enemy line become chances for devastating shadow-fast strikes." },
    ],
  },
];

const PALADIN_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "oath-of-devotion",
    name: "Oath of Devotion",
    subclass_flavor: "Devotion",
    summary: "Radiate honesty, courage, and holy resolve",
    description: "Paladins of Devotion embody virtue and radiant steadfastness, standing as exemplars of honesty and justice.",
    features: [
      { name: "Oath Spells", level: 3, description: "You always have a devoted set of radiant, protective, and virtuous spells prepared." },
      { name: "Sacred Weapon", level: 3, description: "Your Channel Divinity can turn your weapon into a beacon of holy accuracy." },
      { name: "Turn the Unholy", level: 3, description: "Your faith can drive away fiends and undead." },
      { name: "Aura of Devotion", level: 7, description: "Your aura helps shield nearby allies from corruption and charm." },
      { name: "Smite of Protection", level: 15, description: "Your smites can wrap allies or yourself in added divine safety." },
      { name: "Holy Nimbus", level: 20, description: "At your peak, you blaze with divine radiance that burns enemies and empowers your presence." },
    ],
  },
  {
    index: "oath-of-glory",
    name: "Oath of Glory",
    subclass_flavor: "Glory",
    summary: "Turn heroic excellence into divine momentum",
    description: "Paladins of Glory seek to become legendary examples of courage, athleticism, and inspirational triumph.",
    features: [
      { name: "Oath Spells", level: 3, description: "You always have heroic and momentum-driven spells prepared." },
      { name: "Inspiring Smite", level: 3, description: "Your smites can be transformed into bursts of encouragement and support." },
      { name: "Peerless Athlete", level: 3, description: "Channel Divinity sharpens athletic greatness beyond ordinary mortal limits." },
      { name: "Aura of Alacrity", level: 7, description: "Allies near you move with greater urgency and confidence." },
      { name: "Glorious Defense", level: 15, description: "You answer enemy attacks with a heroic protective flourish." },
      { name: "Living Legend", level: 20, description: "You become a near-mythic champion whose deeds inspire and overwhelm." },
    ],
  },
  {
    index: "oath-of-the-ancients",
    name: "Oath of the Ancients",
    subclass_flavor: "Ancients",
    summary: "Defend life, beauty, and the old light of the world",
    description: "Paladins of the Ancients protect hope, beauty, and the deep natural light that opposes despair and corruption.",
    features: [
      { name: "Oath Spells", level: 3, description: "You always have nature- and light-themed spells prepared." },
      { name: "Nature's Wrath", level: 3, description: "Your Channel Divinity can bind a foe in restraining natural force." },
      { name: "Turn the Faithless", level: 3, description: "You can drive away certain fey and fiends with sacred conviction." },
      { name: "Aura of Warding", level: 7, description: "Your aura helps shield allies from hostile spell damage." },
      { name: "Undying Sentinel", level: 15, description: "Your oath makes you difficult to kill and harder to wear down." },
      { name: "Elder Champion", level: 20, description: "At your peak, ancient primal light transforms you into a radiant guardian." },
    ],
  },
  {
    index: "oath-of-vengeance",
    name: "Oath of Vengeance",
    subclass_flavor: "Vengeance",
    summary: "Pursue dangerous foes with relentless divine pressure",
    description: "Paladins of Vengeance are sworn to bring terrible enemies to justice no matter how long the chase takes.",
    features: [
      { name: "Oath Spells", level: 3, description: "You always have pursuit, control, and punishing strike spells prepared." },
      { name: "Abjure Enemy", level: 3, description: "Your Channel Divinity can terrify or pin down an enemy you have marked for judgment." },
      { name: "Vow of Enmity", level: 3, description: "You focus your wrath on a chosen foe with relentless accuracy." },
      { name: "Relentless Avenger", level: 7, description: "You pursue enemies with supernatural tenacity after striking them." },
      { name: "Soul of Vengeance", level: 15, description: "Your vow lets you answer the sworn enemy's actions with punishing responses." },
      { name: "Avenging Angel", level: 20, description: "You become a terrifying winged instrument of divine judgment." },
    ],
  },
];

const RANGER_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "beast-master",
    name: "Beast Master",
    subclass_flavor: "Beast Master",
    summary: "Hunt beside a trusted primal companion",
    description: "Beast Masters bond with an animal companion and learn to fight as a tightly coordinated team.",
    features: [
      { name: "Ranger's Companion", level: 3, description: "You gain a trusted beast ally that fights, scouts, and survives beside you." },
      { name: "Primal Bond", level: 3, description: "Your teamwork with the companion shapes how you command and support it." },
      { name: "Exceptional Training", level: 7, description: "Your companion becomes better trained, more responsive, and more useful in complex situations." },
      { name: "Bestial Fury", level: 11, description: "Your companion's offensive pressure improves dramatically." },
      { name: "Share Spells", level: 15, description: "Your magic and your companion's presence become tightly intertwined." },
    ],
  },
  {
    index: "fey-wanderer",
    name: "Fey Wanderer",
    subclass_flavor: "Fey Wanderer",
    summary: "Carry the wild glamour of the Feywild into every fight",
    description: "Fey Wanderers walk between the mortal world and the Feywild, mixing blade work with haunting charm and elusive movement.",
    features: [
      { name: "Dreadful Strikes", level: 3, description: "Your attacks carry a sting of otherworldly force that wears down prey." },
      { name: "Fey Wanderer Magic", level: 3, description: "You always have a suite of fey-themed spells prepared." },
      { name: "Otherworldly Glamour", level: 3, description: "Your presence gains a compelling supernatural edge." },
      { name: "Beguiling Twist", level: 7, description: "You can redirect failed charm and fear effects back through fey mischief." },
      { name: "Fey Reinforcements", level: 11, description: "You can call on stronger fey aid and magical companionship." },
      { name: "Misty Wanderer", level: 15, description: "You reposition with effortless fey motion and protect allies through that movement." },
    ],
  },
  {
    index: "gloom-stalker",
    name: "Gloom Stalker",
    subclass_flavor: "Gloom Stalker",
    summary: "Own the darkness before enemies know the fight has started",
    description: "Gloom Stalkers hunt from shadow, fear, and first-strike pressure, excelling where light and certainty fail.",
    features: [
      { name: "Dread Ambusher", level: 3, description: "You dominate the opening moments of combat with speed, damage, and initiative pressure." },
      { name: "Umbral Sight", level: 3, description: "Darkness becomes an ally rather than an obstacle." },
      { name: "Iron Mind", level: 7, description: "Your resolve hardens against mental interference." },
      { name: "Stalker's Flurry", level: 11, description: "Missed attacks become harder for your prey to escape." },
      { name: "Shadowy Dodge", level: 15, description: "At your peak, incoming attacks falter against your darkness-shrouded reflexes." },
    ],
  },
  {
    index: "hunter",
    name: "Hunter",
    subclass_flavor: "Hunter",
    summary: "Refine practical solutions for every kind of prey",
    description: "Hunters specialize through adaptable anti-monster techniques, practical battlefield experience, and relentless hunting discipline.",
    features: [
      { name: "Hunter's Lore", level: 3, description: "Your knowledge of quarry helps you pick the right tactic at the right time." },
      { name: "Hunter's Prey", level: 3, description: "You choose a signature offensive technique tailored to wearing prey down." },
      { name: "Defensive Tactics", level: 7, description: "Experience in dangerous hunts teaches you how to survive brutal counterattacks." },
      { name: "Superior Hunter's Prey", level: 11, description: "Your preferred offensive technique becomes deadlier and more flexible." },
      { name: "Superior Hunter's Defense", level: 15, description: "You culminate in a top-end defensive answer to the deadliest threats." },
    ],
  },
];

const ROGUE_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "arcane-trickster",
    name: "Arcane Trickster",
    subclass_flavor: "Arcane Trickster",
    summary: "Mix stealth, wit, and wizardry into one toolkit",
    description: "Arcane Tricksters use magic for deception, infiltration, and precision timing rather than open battlefield spellcasting.",
    features: [
      { name: "Spellcasting", level: 3, description: "You learn wizard spells tailored toward trickery, deception, and control." },
      { name: "Mage Hand Legerdemain", level: 3, description: "Your mage hand becomes a refined tool for roguish manipulation." },
      { name: "Magical Ambush", level: 9, description: "Hidden spellcasting becomes especially hard for enemies to resist." },
      { name: "Versatile Trickster", level: 13, description: "Your magical misdirection turns your spectral helper into a setup tool for advantage." },
      { name: "Spell Thief", level: 17, description: "At your peak, hostile magic itself can become part of your arsenal." },
    ],
  },
  {
    index: "assassin",
    name: "Assassin",
    subclass_flavor: "Assassin",
    summary: "Perfect ambush, infiltration, and decisive elimination",
    description: "Assassins shape the battlefield before combat begins through disguise, patience, and merciless execution of key targets.",
    features: [
      { name: "Assassinate", level: 3, description: "You excel at the opening strike against creatures that are off balance, surprised, or not yet ready." },
      { name: "Envenom Weapons", level: 3, description: "You learn to prepare your tools for especially dangerous finishing pressure." },
      { name: "Infiltration Expertise", level: 9, description: "You become exceptionally skilled at entering dangerous places under false identities or subtle covers." },
      { name: "Impostor", level: 13, description: "Your ability to mimic and replace others reaches a frightening level of precision." },
      { name: "Death Strike", level: 17, description: "When the setup is perfect, your opening attack becomes devastating." },
    ],
  },
  {
    index: "soulknife",
    name: "Soulknife",
    subclass_flavor: "Soulknife",
    summary: "Manifest psionic blades and strike mind-first",
    description: "Soulknives shape psychic force into invisible tools, telepathic coordination, and sudden impossible attacks.",
    features: [
      { name: "Psychic Blades", level: 3, description: "You can conjure psionic weapons directly from thought." },
      { name: "Psionic Power", level: 3, description: "Your discipline grants a pool of subtle mental talents for skill, mobility, and precision." },
      { name: "Soul Blades", level: 9, description: "Your psychic weapons and psionic tools become more reliable and more dangerous." },
      { name: "Psychic Veil", level: 13, description: "You can vanish behind psionic concealment when timing matters most." },
      { name: "Rend Mind", level: 17, description: "A successful psychic assault can leave an enemy mentally shattered." },
    ],
  },
  {
    index: "thief",
    name: "Thief",
    subclass_flavor: "Thief",
    summary: "Do the impossible through speed, utility, and nerve",
    description: "Thieves are consummate opportunists who solve problems through movement, improvisation, and audacious use of gear and space.",
    features: [
      { name: "Fast Hands", level: 3, description: "You use objects, tools, and opportunistic movement with exceptional speed." },
      { name: "Second-Story Work", level: 3, description: "Climbing, jumping, and urban movement all become part of your professional toolkit." },
      { name: "Supreme Sneak", level: 9, description: "You become even better at slipping unseen through dangerous territory." },
      { name: "Use Magic Device", level: 13, description: "You can coax value out of magic items others cannot easily exploit." },
      { name: "Thief's Reflexes", level: 17, description: "At the start of a fight, your speed and readiness can feel supernatural." },
    ],
  },
];

const SORCERER_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "aberrant-sorcery",
    name: "Aberrant Sorcery",
    subclass_flavor: "Aberrant",
    summary: "Shape psionic anomaly into spellcraft",
    description: "Aberrant Sorcerers channel alien thought, unstable psychic resonance, and strange mental geometry through their magic.",
    features: [
      { name: "Psionic Spells", level: 3, description: "You always have unsettling psionic-themed spells prepared." },
      { name: "Telepathic Speech", level: 3, description: "Your mind reaches outward in wordless communication." },
      { name: "Psionic Sorcery", level: 6, description: "You can cast certain spells through sorcery rather than ordinary spellcasting methods." },
      { name: "Revelation in Flesh", level: 14, description: "Your body twists into useful alien adaptations." },
      { name: "Warping Implosion", level: 18, description: "At your peak, warped psychic gravity lets you collapse foes toward a chosen point." },
    ],
  },
  {
    index: "clockwork-sorcery",
    name: "Clockwork Sorcery",
    subclass_flavor: "Clockwork",
    summary: "Impose order, balance, and inevitability on magic",
    description: "Clockwork Sorcerers draw from cosmic law and perfect mechanism, using sorcery to stabilize, suppress, and command magical disorder.",
    features: [
      { name: "Clockwork Spells", level: 3, description: "You always have ordered, protective, and balancing spells prepared." },
      { name: "Restore Balance", level: 3, description: "You can cancel key advantages or disadvantages when precise balance is needed." },
      { name: "Bastion of Law", level: 6, description: "You shape protective order into a ward that absorbs harm." },
      { name: "Trance of Order", level: 14, description: "For a brief time, your spellcasting and focus become exceptionally consistent." },
      { name: "Clockwork Cavalcade", level: 18, description: "At your peak, ordered magic sweeps the battlefield and restores structure around you." },
    ],
  },
  {
    index: "draconic-sorcery",
    name: "Draconic Sorcery",
    subclass_flavor: "Draconic",
    summary: "Awaken the body and majesty of dragonkind",
    description: "Draconic Sorcerers manifest scales, elemental force, and the imposing magical legacy of a dragon ancestor.",
    features: [
      { name: "Draconic Resilience", level: 3, description: "Your body hardens with draconic toughness and improved natural protection." },
      { name: "Dragon Ancestor", level: 3, description: "Your magical lineage defines your elemental flavor and draconic identity." },
      { name: "Elemental Affinity", level: 6, description: "Spells tied to your draconic element grow stronger and more resonant." },
      { name: "Dragon Wings", level: 14, description: "You manifest draconic wings and command the air directly." },
      { name: "Draconic Presence", level: 18, description: "You overwhelm the battlefield with a dragon's terrifying majesty." },
    ],
  },
  {
    index: "wild-magic-sorcery",
    name: "Wild Magic Sorcery",
    subclass_flavor: "Wild Magic",
    summary: "Turn instability into spectacle, risk, and opportunity",
    description: "Wild Magic Sorcerers surf raw magical instability, unleashing unpredictable surges and bending luck at crucial moments.",
    features: [
      { name: "Wild Magic Surge", level: 3, description: "Unstable power can erupt around your spells in dramatic and surprising ways." },
      { name: "Tides of Chaos", level: 3, description: "You manipulate luck and invite volatility in return." },
      { name: "Bend Luck", level: 6, description: "Your sorcery can tilt a key roll toward success or failure." },
      { name: "Controlled Chaos", level: 14, description: "You gain better leverage over the strange currents of wild magic." },
      { name: "Spell Bombardment", level: 18, description: "Wild power adds explosive extra force when your spells strike hard." },
    ],
  },
];

const WARLOCK_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "archfey-patron",
    name: "Archfey Patron",
    subclass_flavor: "Archfey",
    summary: "Make glamour, escape, and enchantment part of the bargain",
    description: "Warlocks bound to the Archfey blend beguilement, mobility, and cruel mirth into an elegant but dangerous pact.",
    features: [
      { name: "Fey Presence", level: 3, description: "A flash of fey glamour can charm or frighten those around you." },
      { name: "Misty Escape", level: 6, description: "Danger can trigger a sudden vanishing step into protective fey motion." },
      { name: "Beguiling Defenses", level: 10, description: "Your pact hardens you against enchantment and helps turn such magic against others." },
      { name: "Dark Delirium", level: 14, description: "At your peak, you trap a creature in a haunting fey unreality." },
    ],
  },
  {
    index: "celestial-patron",
    name: "Celestial Patron",
    subclass_flavor: "Celestial",
    summary: "Balance radiant power, healing, and pact magic",
    description: "Warlocks bound to Celestial patrons wield pact magic that heals, protects, and burns with holy light.",
    features: [
      { name: "Healing Light", level: 3, description: "Your patron grants a reservoir of radiant healing to aid allies in need." },
      { name: "Radiant Soul", level: 6, description: "Your radiant and fire magic carries stronger celestial force." },
      { name: "Celestial Resilience", level: 10, description: "You and your allies can gain protective endurance from your patron's favor." },
      { name: "Searing Vengeance", level: 14, description: "At your peak, falling does not stop you from answering with blazing celestial reprisal." },
    ],
  },
  {
    index: "fiend-patron",
    name: "Fiend Patron",
    subclass_flavor: "Fiend",
    summary: "Trade with hellfire for ruthless staying power",
    description: "Warlocks of the Fiend turn infernal bargains into survivability, explosive punishment, and cruel momentum.",
    features: [
      { name: "Dark One's Blessing", level: 3, description: "Defeating enemies rewards you with infernal vitality." },
      { name: "Dark One's Own Luck", level: 6, description: "Your patron's favor can rescue a crucial failed roll." },
      { name: "Fiendish Resilience", level: 10, description: "You adapt to punishment through infernal hardiness." },
      { name: "Hurl Through Hell", level: 14, description: "At your peak, you can briefly cast an enemy into a hellish nightmare." },
    ],
  },
  {
    index: "great-old-one-patron",
    name: "Great Old One Patron",
    subclass_flavor: "Great Old One",
    summary: "Turn alien thought into a terrifying pact advantage",
    description: "Warlocks of the Great Old One channel incomprehensible influence, mind pressure, and reality-bending unease.",
    features: [
      { name: "Awakened Mind", level: 3, description: "Your thoughts can reach outward in unsettling telepathic contact." },
      { name: "Entropic Ward", level: 6, description: "Alien distortion can foil an attack and create an opening for you." },
      { name: "Thought Shield", level: 10, description: "Your mind becomes a hostile and resistant place for outside influence." },
      { name: "Create Thrall", level: 14, description: "At your peak, your patron's influence can leave another creature mentally bound to your will." },
    ],
  },
];

const WIZARD_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "abjurer",
    name: "Abjurer",
    subclass_flavor: "Abjurer",
    summary: "Stand between the party and hostile magic",
    description: "Abjurers specialize in wards, negation, and magical protection, turning study into resilient defense.",
    features: [
      { name: "Arcane Ward", level: 3, description: "Your abjurations create a protective ward that absorbs incoming harm." },
      { name: "Projected Ward", level: 6, description: "Your ward can extend outward to shield allies as well as yourself." },
      { name: "Improved Abjuration", level: 10, description: "You are especially effective at breaking hostile magic and magical effects." },
      { name: "Spell Resistance", level: 14, description: "At your peak, magic itself has a harder time harming you." },
    ],
  },
  {
    index: "diviner",
    name: "Diviner",
    subclass_flavor: "Diviner",
    summary: "Read fate and turn probability into power",
    description: "Diviners study possibility itself, leveraging omens and foresight to decide which moments matter most.",
    features: [
      { name: "Portent", level: 3, description: "You prepare foretold dice that can replace later rolls at crucial moments." },
      { name: "Expert Divination", level: 6, description: "Divination magic becomes a more efficient and sustainable part of your practice." },
      { name: "The Third Eye", level: 10, description: "Your senses sharpen through magical perception and supernatural sight." },
      { name: "Greater Portent", level: 14, description: "At your peak, you influence even more key moments through prepared omens." },
    ],
  },
  {
    index: "evoker",
    name: "Evoker",
    subclass_flavor: "Evoker",
    summary: "Unleash destruction without losing control",
    description: "Evokers shape raw magical force into devastating attacks while preserving allies and squeezing every ounce of value from offense.",
    features: [
      { name: "Evocation Savant", level: 3, description: "Your formal study makes evocation spells easier and more natural to master." },
      { name: "Sculpt Spells", level: 3, description: "You can spare allies from the worst of your area effects." },
      { name: "Potent Cantrip", level: 6, description: "Even partial spell resistance is not enough to fully blunt your basic offense." },
      { name: "Empowered Evocation", level: 10, description: "Your Intelligence intensifies the damage of key evocation spells." },
      { name: "Overchannel", level: 14, description: "At your peak, you can force a spell beyond safe limits for devastating effect." },
    ],
  },
  {
    index: "illusionist",
    name: "Illusionist",
    subclass_flavor: "Illusionist",
    summary: "Turn falsehood into your sharpest magical weapon",
    description: "Illusionists manipulate senses, assumptions, and perception itself, blurring the line between fiction and reality.",
    features: [
      { name: "Improved Minor Illusion", level: 3, description: "Your simplest illusions become more useful and more convincing." },
      { name: "Malleable Illusions", level: 6, description: "You can reshape your active illusions without starting from scratch." },
      { name: "Illusory Self", level: 10, description: "A false version of you can absorb a critical blow or turn an attack aside." },
      { name: "Illusory Reality", level: 14, description: "At your peak, part of an illusion can briefly become tangibly real." },
    ],
  },
];

const REMAINING_CURATED_2024_CLASS_OVERRIDES: CuratedClassOverride[] = [
  {
    classIndex: "druid",
    className: "Druid",
    subclasses: DRUID_SUBCLASSES,
    featureReferences: DRUID_FEATURE_REFERENCES,
    levelReferences: DRUID_LEVEL_REFERENCES,
    subclassReferences: DRUID_SUBCLASS_REFERENCES,
  },
  {
    classIndex: "fighter",
    className: "Fighter",
    subclasses: FIGHTER_SUBCLASSES,
    featureReferences: FIGHTER_FEATURE_REFERENCES,
    levelReferences: FIGHTER_LEVEL_REFERENCES,
    subclassReferences: FIGHTER_SUBCLASS_REFERENCES,
  },
  {
    classIndex: "monk",
    className: "Monk",
    subclasses: MONK_SUBCLASSES,
    featureReferences: MONK_FEATURE_REFERENCES,
    levelReferences: MONK_LEVEL_REFERENCES,
    subclassReferences: MONK_SUBCLASS_REFERENCES,
  },
  {
    classIndex: "paladin",
    className: "Paladin",
    subclasses: PALADIN_SUBCLASSES,
    featureReferences: PALADIN_FEATURE_REFERENCES,
    levelReferences: PALADIN_LEVEL_REFERENCES,
    subclassReferences: PALADIN_SUBCLASS_REFERENCES,
  },
  {
    classIndex: "ranger",
    className: "Ranger",
    subclasses: RANGER_SUBCLASSES,
    featureReferences: RANGER_FEATURE_REFERENCES,
    levelReferences: RANGER_LEVEL_REFERENCES,
    subclassReferences: RANGER_SUBCLASS_REFERENCES,
  },
  {
    classIndex: "rogue",
    className: "Rogue",
    subclasses: ROGUE_SUBCLASSES,
    featureReferences: ROGUE_FEATURE_REFERENCES,
    levelReferences: ROGUE_LEVEL_REFERENCES,
    subclassReferences: ROGUE_SUBCLASS_REFERENCES,
  },
  {
    classIndex: "sorcerer",
    className: "Sorcerer",
    subclasses: SORCERER_SUBCLASSES,
    featureReferences: SORCERER_FEATURE_REFERENCES,
    levelReferences: SORCERER_LEVEL_REFERENCES,
    subclassReferences: SORCERER_SUBCLASS_REFERENCES,
  },
  {
    classIndex: "warlock",
    className: "Warlock",
    subclasses: WARLOCK_SUBCLASSES,
    featureReferences: WARLOCK_FEATURE_REFERENCES,
    levelReferences: WARLOCK_LEVEL_REFERENCES,
    subclassReferences: WARLOCK_SUBCLASS_REFERENCES,
  },
  {
    classIndex: "wizard",
    className: "Wizard",
    subclasses: WIZARD_SUBCLASSES,
    featureReferences: WIZARD_FEATURE_REFERENCES,
    levelReferences: WIZARD_LEVEL_REFERENCES,
    subclassReferences: WIZARD_SUBCLASS_REFERENCES,
  },
];

export { REMAINING_CURATED_2024_CLASS_OVERRIDES };
export type { CuratedClassOverride };
