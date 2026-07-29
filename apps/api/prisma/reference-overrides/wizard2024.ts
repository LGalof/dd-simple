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

const WIZARD_FEAT_OPTIONS = CORE_FEAT_OPTIONS satisfies readonly CuratedReferenceTuple[];

const WIZARD_SCHOLAR_OPTIONS = [
  ["skill-arcana", "Skill: Arcana"],
  ["skill-history", "Skill: History"],
  ["skill-investigation", "Skill: Investigation"],
  ["skill-medicine", "Skill: Medicine"],
  ["skill-nature", "Skill: Nature"],
  ["skill-religion", "Skill: Religion"],
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

const WIZARD_DIVINATION_LEVEL_2_SPELL_OPTIONS = [
  ["comprehend-languages", "Comprehend Languages"],
  ["detect-magic", "Detect Magic"],
  ["detect-thoughts", "Detect Thoughts"],
  ["see-invisibility", "See Invisibility"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_EVOCATION_LEVEL_2_SPELL_OPTIONS = [
  ["burning-hands", "Burning Hands"],
  ["chromatic-orb", "Chromatic Orb"],
  ["magic-missile", "Magic Missile"],
  ["thunderwave", "Thunderwave"],
  ["flaming-sphere", "Flaming Sphere"],
  ["scorching-ray", "Scorching Ray"],
  ["shatter", "Shatter"],
] as const satisfies readonly CuratedReferenceTuple[];

const WIZARD_ILLUSION_LEVEL_2_SPELL_OPTIONS = [
  ["disguise-self", "Disguise Self"],
  ["tasha-s-hideous-laughter", "Tasha's Hideous Laughter"],
  ["blur", "Blur"],
  ["invisibility", "Invisibility"],
  ["mirror-image", "Mirror Image"],
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

const WIZARD_SUBCLASSES = [
  ["abjurer", "Abjurer"],
  ["diviner", "Diviner"],
  ["evoker", "Evoker"],
  ["illusionist", "Illusionist"],
] as const satisfies readonly CuratedSubclassOptionTuple[];

const THIRD_EYE_OPTIONS = [
  {
    option_type: "reference",
    description: "You gain Darkvision with a range of 120 feet.",
    grants: {
      derivedSources: [
        {
          description: "You gain Darkvision with a range of 120 feet.",
          level: 10,
          sourceIndex: "the-third-eye-darkvision",
          sourceType: "subclass_feature",
          title: "The Third Eye: Darkvision",
        },
      ],
    },
    item: {
      index: "darkvision",
      name: "Darkvision",
      url: "/api/2024/features/the-third-eye/darkvision",
    },
  },
  {
    option_type: "reference",
    description: "You can read any language.",
    grants: {
      derivedSources: [
        {
          description: "You can read any language.",
          level: 10,
          sourceIndex: "the-third-eye-greater-comprehension",
          sourceType: "subclass_feature",
          title: "The Third Eye: Greater Comprehension",
        },
      ],
    },
    item: {
      index: "greater-comprehension",
      name: "Greater Comprehension",
      url: "/api/2024/features/the-third-eye/greater-comprehension",
    },
  },
  {
    option_type: "reference",
    description: "You can cast See Invisibility without expending a spell slot.",
    grants: {
      derivedSources: [
        {
          description: "You can cast See Invisibility without expending a spell slot.",
          level: 10,
          sourceIndex: "the-third-eye-see-invisibility",
          sourceType: "subclass_feature",
          title: "The Third Eye: See Invisibility",
        },
      ],
    },
    item: {
      index: "see-invisibility",
      name: "See Invisibility",
      url: "/api/2024/spells/see-invisibility",
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

function createSimpleFeature(
  index: string,
  level: number,
  name: string,
  description: string,
): CuratedFeatureReference {
  return {
    index,
    level,
    name,
    desc: [description],
  };
}

function createWizardSubclassFeature(
  index: string,
  level: number,
  name: string,
  description: string,
  subclassIndex: string,
  subclassName: string,
): CuratedFeatureReference {
  return {
    ...createSimpleFeature(index, level, name, description),
    subclass: {
      index: subclassIndex,
      name: subclassName,
      url: `/api/2024/subclasses/${subclassIndex}`,
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

function createDivinationSavantFeature(): CuratedFeatureReference {
  return {
    ...createWizardSpellChoiceFeature(
      "divination-savant",
      3,
      "Divination Savant",
      "Choose two Wizard spells from the Divination school, each of which must be no higher than level 2, and add them to your spellbook for free.\n\nIn addition, whenever you gain access to a new level of spell slots in this class, you can add one Wizard spell from the Divination school to your spellbook for free. The chosen spell must be of a level for which you have spell slots.",
      2,
      WIZARD_DIVINATION_LEVEL_2_SPELL_OPTIONS,
      "wizard spell",
    ),
    subclass: { index: "diviner", name: "Diviner", url: "/api/2024/subclasses/diviner" },
  };
}

function createEvocationSavantFeature(): CuratedFeatureReference {
  return {
    ...createWizardSpellChoiceFeature(
      "evocation-savant",
      3,
      "Evocation Savant",
      "Choose two Wizard spells from the Evocation school, each of which must be no higher than level 2, and add them to your spellbook for free.\n\nIn addition, whenever you gain access to a new level of spell slots in this class, you can add one Wizard spell from the Evocation school to your spellbook for free. The chosen spell must be of a level for which you have spell slots.",
      2,
      WIZARD_EVOCATION_LEVEL_2_SPELL_OPTIONS,
      "wizard spell",
    ),
    subclass: { index: "evoker", name: "Evoker", url: "/api/2024/subclasses/evoker" },
  };
}

function createIllusionSavantFeature(): CuratedFeatureReference {
  return {
    ...createWizardSpellChoiceFeature(
      "illusion-savant",
      3,
      "Illusion Savant",
      "Choose two Wizard spells from the Illusion school, each of which must be no higher than level 2, and add them to your spellbook for free.\n\nIn addition, whenever you gain access to a new level of spell slots in this class, you can add one Wizard spell from the Illusion school to your spellbook for free. The chosen spell must be of a level for which you have spell slots.",
      2,
      WIZARD_ILLUSION_LEVEL_2_SPELL_OPTIONS,
      "wizard spell",
    ),
    subclass: { index: "illusionist", name: "Illusionist", url: "/api/2024/subclasses/illusionist" },
  };
}

function createThirdEyeFeature(): CuratedFeatureReference {
  return {
    index: "the-third-eye",
    level: 10,
    name: "The Third Eye",
    desc: [
      "You can increase your powers of perception. As a Bonus Action, choose one of the following benefits, which lasts until you start a Short or Long Rest. You can't use this feature again until you finish a Short or Long Rest.",
    ],
    feature_specific: {
      id: "the-third-eye-option",
      label: "Choose 1 Level 10 Option",
      field_label: "Level 10 Option",
      choose: 1,
      type: "option",
      from: {
        option_set_type: "options_array",
        options: THIRD_EYE_OPTIONS,
      },
    },
    subclass: { index: "diviner", name: "Diviner", url: "/api/2024/subclasses/diviner" },
  };
}

const WIZARD_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createWizardSpellChoiceFeature("wizard-cantrips-1", 1, "Cantrips", "Choose three Wizard cantrips to begin your arcane training.", 3, WIZARD_CANTRIP_OPTIONS, "wizard cantrip"),
  createWizardSpellChoiceFeature("wizard-spellbook-1", 1, "Spellbook", "Choose six 1st-level Wizard spells to place in your spellbook at 1st level.", 6, WIZARD_LEVEL_1_SPELL_OPTIONS, "wizard spell"),
  createSimpleFeature("wizard-spellcasting", 1, "Spellcasting", "You prepare and cast Wizard spells through rigorous study, using Intelligence as the spellcasting ability behind your arcane formulas."),
  createSimpleFeature("ritual-adept", 1, "Ritual Adept", "You can cast any spell as a Ritual if that spell has the Ritual tag and the spell is in your spellbook. You needn't have the spell prepared, but you must read from the book to cast a spell in this way."),
  createSimpleFeature("arcane-recovery", 1, "Arcane Recovery", "You can regain some of your magical energy by studying your spellbook. When you finish a Short Rest, you can choose expended spell slots to recover. The spell slots can have a combined level equal to no more than half your Wizard level (round up), and none of the slots can be level 6 or higher. For example, if you're a level 4 Wizard, you can recover up to two levels' worth of spell slots, regaining either one level 2 spell slot or two level 1 spell slots.\n\nOnce you use this feature, you can't do so again until you finish a Long Rest."),
  createWizardSpellChoiceFeature("wizard-spellbook-2", 2, "Spellbook Additions", "Add two more Wizard spells to your spellbook. At this level you still choose from 1st-level Wizard spells.", 2, WIZARD_LEVEL_1_SPELL_OPTIONS, "wizard spell"),
  {
    index: "scholar",
    level: 2,
    name: "Scholar",
    desc: [
      "While studying magic, you also specialized in another field of study. Choose one of the following skills in which you have proficiency: Arcana, History, Investigation, Medicine, Nature, or Religion. You have Expertise in the chosen skill.",
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
  createWizardSpellChoiceFeature("wizard-spellbook-3", 3, "Spellbook Additions", "Add two more Wizard spells to your spellbook. You can now include 2nd-level Wizard spells.", 2, WIZARD_LEVEL_2_SPELL_OPTIONS, "wizard spell"),
  createSubclassChoiceFeature("wizard-subclass", 3, "Wizard", WIZARD_SUBCLASSES, "You gain a Wizard subclass of your choice. A subclass is a specialization that grants you features at certain Wizard levels. For the rest of your career, you gain each of your subclass's features that are of your Wizard level or lower."),
  createSimpleFeature("wizard-subclass-feature-3", 3, "Subclass Feature", "Your chosen magical discipline grants its defining 3rd-level features."),
  {
    ...createWizardSpellChoiceFeature("abjuration-savant", 3, "Abjuration Savant", "Choose two Wizard spells from the Abjuration school, each of which must be no higher than level 2, and add them to your spellbook for free.\n\nIn addition, whenever you gain access to a new level of spell slots in this class, you can add one Wizard spell from the Abjuration school to your spellbook for free. The chosen spell must be of a level for which you have spell slots.", 2, WIZARD_LEVEL_2_SPELL_OPTIONS, "wizard spell"),
    subclass: { index: "abjurer", name: "Abjurer", url: "/api/2024/subclasses/abjurer" },
  },
  {
    index: "arcane-ward",
    level: 3,
    name: "Arcane Ward",
    desc: [
      "You can weave magic around yourself for protection. When you cast an Abjuration spell with a spell slot, you can simultaneously use a strand of the spell's magic to create a magical ward on yourself that lasts until you finish a Long Rest. The ward has a Hit Point maximum equal to twice your Wizard level plus your Intelligence modifier. Whenever you take damage, the ward takes the damage instead, and if you have any Resistances or Vulnerabilities, apply them before reducing the ward's Hit Points. If the damage reduces the ward to 0 Hit Points, you take any remaining damage. While the ward has 0 Hit Points, it can't absorb damage, but its magic remains.\n\nWhenever you cast an Abjuration spell with a spell slot, the ward regains a number of Hit Points equal to twice the level of the spell slot. Alternatively, as a Bonus Action, you can expend a spell slot, and the ward regains a number of Hit Points equal to twice the level of the spell slot expended.\n\nOnce you create the ward, you can't create it again until you finish a Long Rest.",
    ],
    subclass: { index: "abjurer", name: "Abjurer", url: "/api/2024/subclasses/abjurer" },
  },
  createDivinationSavantFeature(),
  createWizardSubclassFeature("portent", 3, "Portent", "Glimpses of the future begin to press on your awareness. Whenever you finish a Long Rest, roll two d20s and record the numbers rolled. You can replace any D20 Test made by you or a creature that you can see with one of these foretelling rolls. You must choose to do so before the roll, and you can replace a roll in this way only once per turn.\n\nEach foretelling roll can be used only once. When you finish a Long Rest, you lose any unused foretelling rolls.", "diviner", "Diviner"),
  createEvocationSavantFeature(),
  createWizardSubclassFeature("potent-cantrip", 3, "Potent Cantrip", "Your damaging cantrips affect even creatures that avoid the brunt of the effect. When you cast a cantrip at a creature and you miss with the attack roll or the target succeeds on a saving throw against the cantrip, the target takes half the cantrip's damage (if any) but suffers no additional effect from the cantrip.", "evoker", "Evoker"),
  createIllusionSavantFeature(),
  createWizardSubclassFeature("improved-illusions", 3, "Improved Illusions", "You can cast Illusion spells without providing Verbal components, and if an Illusion spell you cast has a range of 10+ feet, the range increases by 60 feet.\n\nYou also know the Minor Illusion cantrip. If you already know it, you learn a different Wizard cantrip of your choice. The cantrip doesn't count against your number of cantrips known. You can create both a sound and an image with a single casting of Minor Illusion, and you can cast it as a Bonus Action.", "illusionist", "Illusionist"),
  createWizardSpellChoiceFeature("wizard-cantrips-2", 4, "Cantrip", "Choose one additional Wizard cantrip.", 1, WIZARD_CANTRIP_OPTIONS, "wizard cantrip"),
  createWizardSpellChoiceFeature("wizard-spellbook-4", 4, "Spellbook Additions", "Add two more Wizard spells to your spellbook.", 2, WIZARD_LEVEL_2_SPELL_OPTIONS, "wizard spell"),
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-1", 4, WIZARD_FEAT_OPTIONS),
  createSimpleFeature("memorize-spell", 5, "Memorize Spell", "Whenever you finish a Short Rest, you can study your spellbook and replace one of the level 1+ Wizard spells you have prepared for your Spellcasting feature with another level 1+ spell from the book."),
  createWizardSpellChoiceFeature("wizard-spellbook-5", 5, "Spellbook Additions", "Add two more Wizard spells to your spellbook. You can now include 3rd-level Wizard spells.", 2, WIZARD_LEVEL_3_SPELL_OPTIONS, "wizard spell"),
  createSimpleFeature("wizard-subclass-feature-6", 6, "Subclass Feature", "Your magical discipline grants a stronger technical expression at this level."),
  {
    index: "projected-ward",
    level: 6,
    name: "Projected Ward",
    desc: [
      "When a creature that you can see within 30 feet of yourself takes damage, you can take a Reaction to cause your Arcane Ward to absorb that damage. If this damage reduces the ward to 0 Hit Points, the warded creature takes any remaining damage. If that creature has any Resistances or Vulnerabilities, apply them before reducing the ward's Hit Points.",
    ],
    subclass: { index: "abjurer", name: "Abjurer", url: "/api/2024/subclasses/abjurer" },
  },
  createWizardSubclassFeature("expert-divination", 6, "Expert Divination", "Casting Divination spells comes so easily to you that it expends only a fraction of your spellcasting efforts. When you cast a Divination spell using a level 2+ spell slot, you regain one expended spell slot. The slot you regain must be of a level lower than the slot you expended and can't be higher than level 5.", "diviner", "Diviner"),
  createWizardSubclassFeature("sculpt-spells", 6, "Sculpt Spells", "You can create pockets of relative safety within the effects of your evocations. When you cast an Evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 plus the spell's level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save.", "evoker", "Evoker"),
  createWizardSubclassFeature("phantasmal-creatures", 6, "Phantasmal Creatures", "You always have the Summon Beast and Summon Fey spells prepared. Whenever you cast either spell, you can change its school to Illusion, which causes the summoned creature to appear spectral. You can cast the Illusion version of each spell without expending a spell slot, but casting it without a slot halves the creature's Hit Points. Once you cast either spell without a spell slot, you must finish a Long Rest before you can cast the spell in that way again.", "illusionist", "Illusionist"),
  createWizardSpellChoiceFeature("wizard-spellbook-6", 6, "Spellbook Additions", "Add two more Wizard spells to your spellbook.", 2, WIZARD_LEVEL_3_SPELL_OPTIONS, "wizard spell"),
  createWizardSpellChoiceFeature("wizard-spellbook-7", 7, "Spellbook Additions", "Add two more Wizard spells to your spellbook. You can now include 4th-level Wizard spells.", 2, WIZARD_LEVEL_4_SPELL_OPTIONS, "wizard spell"),
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-2", 8, WIZARD_FEAT_OPTIONS),
  createWizardSpellChoiceFeature("wizard-spellbook-8", 8, "Spellbook Additions", "Add two more Wizard spells to your spellbook.", 2, WIZARD_LEVEL_4_SPELL_OPTIONS, "wizard spell"),
  createWizardSpellChoiceFeature("wizard-spellbook-9", 9, "Spellbook Additions", "Add two more Wizard spells to your spellbook. You can now include 5th-level Wizard spells.", 2, WIZARD_LEVEL_5_SPELL_OPTIONS, "wizard spell"),
  createSimpleFeature("wizard-subclass-feature-10", 10, "Subclass Feature", "Your magical discipline grants a powerful mid-tier specialization feature."),
  {
    index: "improved-abjuration",
    level: 10,
    name: "Spell Breaker",
    desc: [
      "You always have the Counterspell and Dispel Magic spells prepared. In addition, you can cast Dispel Magic as a Bonus Action, and you can add your Proficiency Bonus to its ability check.\n\nWhen you cast either spell with a spell slot, that slot isn't expended if the spell fails to stop a spell.",
    ],
    subclass: { index: "abjurer", name: "Abjurer", url: "/api/2024/subclasses/abjurer" },
  },
  createThirdEyeFeature(),
  createWizardSubclassFeature("empowered-evocation", 10, "Empowered Evocation", "Whenever you cast a Wizard spell from the Evocation school, you can add your Intelligence modifier to one damage roll of that spell.", "evoker", "Evoker"),
  createWizardSubclassFeature("illusory-self", 10, "Illusory Self", "When a creature hits you with an attack roll, you can take a Reaction to interpose an illusory duplicate of yourself between the attacker and yourself. The attack automatically misses you, then the illusion dissipates.\n\nOnce you use this feature, you can't use it again until you finish a Short or Long Rest. You can also restore your use of it by expending a level 2+ spell slot (no action required).", "illusionist", "Illusionist"),
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-3", 12, WIZARD_FEAT_OPTIONS),
  createSimpleFeature("wizard-subclass-feature-14", 14, "Subclass Feature", "Your magical discipline reaches its capstone expression."),
  {
    index: "spell-resistance",
    level: 14,
    name: "Spell Resistance",
    desc: ["You have Advantage on saving throws against spells, and you have Resistance to the damage of spells."],
    subclass: { index: "abjurer", name: "Abjurer", url: "/api/2024/subclasses/abjurer" },
  },
  createWizardSubclassFeature("greater-portent", 14, "Greater Portent", "The visions in your dreams intensify and paint a more accurate picture in your mind of what is to come. Roll three d20s for your Portent feature rather than two.", "diviner", "Diviner"),
  createWizardSubclassFeature("overchannel", 14, "Overchannel", "You can increase the power of your spells. When you cast a Wizard spell with a spell slot of levels 1-5 that deals damage, you can deal maximum damage with that spell on the turn you cast it.\n\nThe first time you do so, you suffer no adverse effect. If you use this feature again before you finish a Long Rest, you take 2d12 Necrotic damage for each level of the spell slot immediately after you cast it. This damage ignores Resistance and Immunity.\n\nEach time you use this feature again before finishing a Long Rest, the Necrotic damage per spell level increases by 1d12.", "evoker", "Evoker"),
  createWizardSubclassFeature("illusory-reality", 14, "Illusory Reality", "You have learned to weave shadow magic into your illusions to give them a semi-reality. When you cast an Illusion spell with a spell slot, you can choose one inanimate, nonmagical object that is part of the illusion and make that object real. You can do this on your turn as a Bonus Action while the spell is ongoing. The object remains real for 1 minute, during which it can't deal damage or give any conditions. For example, you can create an illusion of a bridge over a chasm and then make it real and cross it.", "illusionist", "Illusionist"),
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-4", 16, WIZARD_FEAT_OPTIONS),
  createWizardSpellChoiceFeature("spell-mastery", 18, "Spell Mastery", "You have achieved such mastery over certain spells that you can cast them at will. Choose a level 1 and a level 2 spell in your spellbook that have a casting time of an action. You always have those spells prepared, and you can cast them at their lowest level without expending a spell slot. To cast either spell at a higher level, you must expend a spell slot.\n\nWhenever you finish a Long Rest, you can study your spellbook and replace one of those spells with an eligible spell of the same level from the book.", 2, WIZARD_LEVEL_2_SPELL_OPTIONS, "wizard spell"),
  createEpicBoonFeature("wizard-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat for which you qualify."),
  createWizardSpellChoiceFeature("wizard-signature-spells", 20, "Signature Spells", "Choose two level 3 spells in your spellbook as your signature spells. You always have these spells prepared, and you can cast each of them once at level 3 without expending a spell slot. When you do so, you can't cast them in this way again until you finish a Short or Long Rest. To cast either spell at a higher level, you must expend a spell slot.", 2, WIZARD_LEVEL_3_SPELL_OPTIONS, "wizard spell"),
];

const WIZARD_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "wizard-1", level: 1, features: ["wizard-cantrips-1", "wizard-spellbook-1", "wizard-spellcasting", "ritual-adept", "arcane-recovery"] },
  { index: "wizard-2", level: 2, features: ["wizard-spellbook-2", "scholar"] },
  { index: "wizard-3", level: 3, features: ["wizard-spellbook-3", "wizard-subclass", "wizard-subclass-feature-3", "abjuration-savant", "arcane-ward", "divination-savant", "portent", "evocation-savant", "potent-cantrip", "illusion-savant", "improved-illusions"] },
  { index: "wizard-4", level: 4, features: ["wizard-cantrips-2", "wizard-spellbook-4", "wizard-ability-score-improvement-1"] },
  { index: "wizard-5", level: 5, features: ["memorize-spell", "wizard-spellbook-5"] },
  { index: "wizard-6", level: 6, features: ["wizard-subclass-feature-6", "wizard-spellbook-6", "projected-ward", "expert-divination", "sculpt-spells", "phantasmal-creatures"] },
  { index: "wizard-7", level: 7, features: ["wizard-spellbook-7"] },
  { index: "wizard-8", level: 8, features: ["wizard-spellbook-8", "wizard-ability-score-improvement-2"] },
  { index: "wizard-9", level: 9, features: ["wizard-spellbook-9"] },
  { index: "wizard-10", level: 10, features: ["wizard-subclass-feature-10", "improved-abjuration", "the-third-eye", "empowered-evocation", "illusory-self"] },
  { index: "wizard-12", level: 12, features: ["wizard-ability-score-improvement-3"] },
  { index: "wizard-14", level: 14, features: ["wizard-subclass-feature-14", "spell-resistance", "greater-portent", "overchannel", "illusory-reality"] },
  { index: "wizard-16", level: 16, features: ["wizard-ability-score-improvement-4"] },
  { index: "wizard-18", level: 18, features: ["spell-mastery"] },
  { index: "wizard-19", level: 19, features: ["wizard-epic-boon"] },
  { index: "wizard-20", level: 20, features: ["wizard-signature-spells"] },
];

const WIZARD_SUBCLASS_REFERENCES: CuratedSubclassReference[] = [
  {
    index: "abjurer",
    name: "Abjurer",
    subclass_flavor: "Abjurer",
    summary: "Stand between the party and hostile magic",
    description: "Shield Companions and Banish Foes\n\nYour study of magic is focused on spells that block, banish, or protect-ending harmful effects, banishing evil influences, and protecting the weak.",
    features: [
      { name: "Abjuration Savant", level: 3, description: "Choose two Wizard spells from the Abjuration school, each of which must be no higher than level 2, and add them to your spellbook for free." },
      { name: "Arcane Ward", level: 3, description: "You create a magical ward when you cast Abjuration magic, and the ward absorbs damage for you." },
      { name: "Projected Ward", level: 6, description: "You can take a Reaction to have your Arcane Ward absorb damage for another creature you can see within 30 feet." },
      { name: "Spell Breaker", level: 10, description: "You always have Counterspell and Dispel Magic prepared, and you can cast Dispel Magic as a Bonus Action." },
      { name: "Spell Resistance", level: 14, description: "You have Advantage on saving throws against spells, and you have Resistance to the damage of spells." },
    ],
  },
  {
    index: "diviner",
    name: "Diviner",
    subclass_flavor: "Diviner",
    summary: "Read fate and turn probability into power",
    description: "Diviners study possibility itself, leveraging omens and foresight to decide which moments matter most.",
    features: [
      { name: "Divination Savant", level: 3, description: "Choose two Wizard spells from the Divination school, each of which must be no higher than level 2, and add them to your spellbook for free." },
      { name: "Portent", level: 3, description: "Roll two d20s after a Long Rest and use them to replace later D20 Tests you can foresee." },
      { name: "Expert Divination", level: 6, description: "When you cast a Divination spell using a level 2+ spell slot, you regain a lower-level expended spell slot." },
      { name: "The Third Eye", level: 10, description: "As a Bonus Action, choose a perception benefit until your next Short or Long Rest." },
      { name: "Greater Portent", level: 14, description: "Roll three d20s for your Portent feature rather than two." },
    ],
  },
  {
    index: "evoker",
    name: "Evoker",
    subclass_flavor: "Evoker",
    summary: "Unleash destruction without losing control",
    description: "Evokers shape raw magical force into devastating attacks while preserving allies and squeezing every ounce of value from offense.",
    features: [
      { name: "Evocation Savant", level: 3, description: "Choose two Wizard spells from the Evocation school, each of which must be no higher than level 2, and add them to your spellbook for free." },
      { name: "Potent Cantrip", level: 3, description: "Your damaging cantrips affect even creatures that avoid the brunt of the effect. When you cast a cantrip at a creature and you miss with the attack roll or the target succeeds on a saving throw against the cantrip, the target takes half the cantrip's damage (if any) but suffers no additional effect from the cantrip." },
      { name: "Sculpt Spells", level: 6, description: "You can create pockets of relative safety within the effects of your evocations." },
      { name: "Empowered Evocation", level: 10, description: "Whenever you cast a Wizard spell from the Evocation school, you can add your Intelligence modifier to one damage roll of that spell." },
      { name: "Overchannel", level: 14, description: "You can deal maximum damage with certain damaging Wizard spells, risking Necrotic backlash when used repeatedly." },
    ],
  },
  {
    index: "illusionist",
    name: "Illusionist",
    subclass_flavor: "Illusionist",
    summary: "Turn falsehood into your sharpest magical weapon",
    description: "Illusionists manipulate senses, assumptions, and perception itself, blurring the line between fiction and reality.",
    features: [
      { name: "Illusion Savant", level: 3, description: "Choose two Wizard spells from the Illusion school, each of which must be no higher than level 2, and add them to your spellbook for free." },
      { name: "Improved Illusions", level: 3, description: "You can cast Illusion spells without Verbal components, extend many Illusion spell ranges, and improve Minor Illusion." },
      { name: "Phantasmal Creatures", level: 6, description: "You always have Summon Beast and Summon Fey prepared, and you can cast spectral Illusion versions of them." },
      { name: "Illusory Self", level: 10, description: "You can take a Reaction to interpose an illusory duplicate and cause an attack to miss you." },
      { name: "Illusory Reality", level: 14, description: "You can briefly make an inanimate, nonmagical object from an illusion real." },
    ],
  },
];

const WIZARD_CURATED_2024_CLASS_OVERRIDE = {
  classIndex: "wizard",
  className: "Wizard",
  subclasses: WIZARD_SUBCLASSES,
  featureReferences: WIZARD_FEATURE_REFERENCES,
  levelReferences: WIZARD_LEVEL_REFERENCES,
  subclassReferences: WIZARD_SUBCLASS_REFERENCES,
};

export { WIZARD_CURATED_2024_CLASS_OVERRIDE };
