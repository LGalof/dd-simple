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
  ["blind-fighting", "Blind Fighting"],
  ["defense", "Defense"],
  ["dueling", "Dueling"],
  ["great-weapon-fighting", "Great Weapon Fighting"],
  ["interception", "Interception"],
  ["protection", "Protection"],
  ["thrown-weapon-fighting", "Thrown Weapon Fighting"],
  ["two-weapon-fighting", "Two-Weapon Fighting"],
  ["unarmed-fighting", "Unarmed Fighting"],
] as const satisfies readonly CuratedReferenceTuple[];

const RANGER_FIGHTING_STYLE_OPTIONS = [
  ["archery", "Archery"],
  ["blind-fighting", "Blind Fighting"],
  ["defense", "Defense"],
  ["dueling", "Dueling"],
  ["thrown-weapon-fighting", "Thrown Weapon Fighting"],
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
    "You can Channel Nature to assume animal forms, using transformation as exploration, utility, and survival magic.",
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
  createSimpleFeature(
    "druid-elemental-fury",
    7,
    "Elemental Fury",
    "Choose a path for your nature magic to hit harder, either enhancing your cantrips or empowering your weapon strikes with primal force.",
  ),
  createAbilityScoreImprovementFeature("druid-ability-score-improvement-2", 8, CASTER_FEAT_OPTIONS),
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
    ],
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
  createSimpleFeature(
    "paladin-weapon-mastery",
    1,
    "Weapon Mastery",
    "You learn mastery properties that let your chosen weapons express more control, pressure, or battlefield utility.",
  ),
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
  createAbilityScoreImprovementFeature("paladin-ability-score-improvement-2", 8, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "abjure-foes",
    9,
    "Abjure Foes",
    "Your divine authority can restrain enemy movement and confidence, forcing hostile creatures to contend with sacred pressure.",
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
  createSimpleFeature(
    "ranger-weapon-mastery",
    1,
    "Weapon Mastery",
    "You learn weapon mastery properties that enhance your practical hunting and skirmishing tactics.",
  ),
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
  createAbilityScoreImprovementFeature("ranger-ability-score-improvement-1", 4, MARTIAL_FEAT_OPTIONS),
  createSimpleFeature(
    "ranger-expertise",
    6,
    "Expertise",
    "Choose one of your proficient skills and double your Proficiency Bonus for checks that use it.",
  ),
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
  createSimpleFeature(
    "rogue-weapon-mastery",
    1,
    "Weapon Mastery",
    "You learn mastery properties that help your favored weapons create cleaner openings for rogue tactics and precision damage.",
  ),
  createSimpleFeature(
    "rogue-steady-aim",
    2,
    "Steady Aim",
    "By sacrificing movement, you can line up an especially reliable attack and improve the odds that Sneak Attack lands when it matters.",
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
  createEpicBoonFeature("rogue-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of the Night Spirit is especially thematic for many rogues."),
];

const SORCERER_FEATURE_REFERENCES: CuratedFeatureReference[] = [
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
  createAbilityScoreImprovementFeature("sorcerer-ability-score-improvement-1", 4, CASTER_FEAT_OPTIONS),
  createSimpleFeature(
    "sorcerer-sorcerous-restoration",
    5,
    "Sorcerous Restoration",
    "A short period of rest lets you regain a portion of your Sorcery Points, helping your magic stay online across longer adventuring days.",
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
  createSimpleFeature(
    "sorcerer-sorcery-incarnate",
    7,
    "Sorcery Incarnate",
    "Your Innate Sorcery becomes easier to access and maintain, pushing you closer to a state where spellcraft and self are almost indistinguishable.",
  ),
  createAbilityScoreImprovementFeature("sorcerer-ability-score-improvement-2", 8, CASTER_FEAT_OPTIONS),
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
  createAbilityScoreImprovementFeature("sorcerer-ability-score-improvement-3", 12, CASTER_FEAT_OPTIONS),
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
  createAbilityScoreImprovementFeature("sorcerer-ability-score-improvement-4", 16, CASTER_FEAT_OPTIONS),
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
  createEpicBoonFeature("sorcerer-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Spell Recall is a natural fit for many sorcerers."),
  createSimpleFeature(
    "arcane-apotheosis",
    20,
    "Arcane Apotheosis",
    "You reach the peak of innate magic, entering a final state where your sorcerous nature expresses itself with overwhelming ease and force.",
  ),
];

const WARLOCK_FEATURE_REFERENCES: CuratedFeatureReference[] = [
  createSimpleFeature(
    "warlock-magical-cunning",
    2,
    "Magical Cunning",
    "You can recover magical power through a brief, focused rite, helping Pact Magic stay relevant across multiple encounters.",
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
  createAbilityScoreImprovementFeature("warlock-ability-score-improvement-1", 4, CASTER_FEAT_OPTIONS),
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
  createAbilityScoreImprovementFeature("warlock-ability-score-improvement-2", 8, CASTER_FEAT_OPTIONS),
  createSimpleFeature(
    "contact-patron",
    9,
    "Contact Patron",
    "Your bond with your patron deepens, allowing direct guidance or support that reflects the supernatural relationship at the core of the class.",
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
  createAbilityScoreImprovementFeature("warlock-ability-score-improvement-3", 12, CASTER_FEAT_OPTIONS),
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
  createAbilityScoreImprovementFeature("warlock-ability-score-improvement-4", 16, CASTER_FEAT_OPTIONS),
  createEpicBoonFeature("warlock-epic-boon", 19, "You gain an Epic Boon feat or another qualifying feat; Boon of Spell Recall and Boon of Dimensional Travel both suit many warlocks."),
];

const WIZARD_FEATURE_REFERENCES: CuratedFeatureReference[] = [
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
    "scholar",
    2,
    "Scholar",
    "Choose an area of academic mastery that reflects the branch of knowledge your magical training leans on most heavily.",
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
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-1", 4, CASTER_FEAT_OPTIONS),
  createSimpleFeature(
    "memorize-spell",
    5,
    "Memorize Spell",
    "With focused study, you can swap a prepared spell more fluidly than other prepared casters, reflecting the wizard's command of spell theory.",
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
  createAbilityScoreImprovementFeature("wizard-ability-score-improvement-2", 8, CASTER_FEAT_OPTIONS),
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
  { index: "druid-1", level: 1, features: ["druid-spellcasting", "druidic", "druid-primal-order"] },
  { index: "druid-2", level: 2, features: ["druid-wild-shape", "druid-wild-companion"] },
  { index: "druid-3", level: 3, features: ["druid-subclass", "druid-subclass-feature-3"] },
  { index: "druid-4", level: 4, features: ["druid-ability-score-improvement-1"] },
  { index: "druid-5", level: 5, features: ["druid-wild-resurgence"] },
  { index: "druid-6", level: 6, features: ["druid-subclass-feature-6"] },
  { index: "druid-7", level: 7, features: ["druid-elemental-fury"] },
  { index: "druid-8", level: 8, features: ["druid-ability-score-improvement-2"] },
  { index: "druid-10", level: 10, features: ["druid-subclass-feature-10"] },
  { index: "druid-11", level: 11, features: ["druid-improved-elemental-fury"] },
  { index: "druid-12", level: 12, features: ["druid-ability-score-improvement-3"] },
  { index: "druid-14", level: 14, features: ["druid-subclass-feature-14"] },
  { index: "druid-16", level: 16, features: ["druid-ability-score-improvement-4"] },
  { index: "druid-18", level: 18, features: ["druid-beast-spells"] },
  { index: "druid-19", level: 19, features: ["druid-epic-boon"] },
  { index: "druid-20", level: 20, features: ["druid-archdruid"] },
];

const FIGHTER_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "fighter-1", level: 1, features: ["fighter-fighting-style", "second-wind", "fighter-weapon-mastery"] },
  { index: "fighter-2", level: 2, features: ["action-surge-1-use", "fighter-tactical-mind"] },
  { index: "fighter-3", level: 3, features: ["fighter-subclass", "fighter-subclass-feature-3"] },
  { index: "fighter-4", level: 4, features: ["fighter-ability-score-improvement-1"] },
  { index: "fighter-5", level: 5, features: ["extra-attack-1", "fighter-tactical-shift"] },
  { index: "fighter-6", level: 6, features: ["fighter-ability-score-improvement-2"] },
  { index: "fighter-7", level: 7, features: ["fighter-subclass-feature-7"] },
  { index: "fighter-8", level: 8, features: ["fighter-ability-score-improvement-3"] },
  { index: "fighter-9", level: 9, features: ["fighter-tactical-master", "indomitable-1-use"] },
  { index: "fighter-10", level: 10, features: ["fighter-subclass-feature-10"] },
  { index: "fighter-11", level: 11, features: ["fighter-two-extra-attacks"] },
  { index: "fighter-12", level: 12, features: ["fighter-ability-score-improvement-4"] },
  { index: "fighter-13", level: 13, features: ["indomitable-2-uses", "fighter-studied-attacks"] },
  { index: "fighter-14", level: 14, features: ["fighter-ability-score-improvement-5"] },
  { index: "fighter-15", level: 15, features: ["fighter-subclass-feature-15"] },
  { index: "fighter-16", level: 16, features: ["fighter-ability-score-improvement-6"] },
  { index: "fighter-17", level: 17, features: ["action-surge-2-uses", "indomitable-3-uses"] },
  { index: "fighter-18", level: 18, features: ["fighter-subclass-feature-18"] },
  { index: "fighter-19", level: 19, features: ["fighter-epic-boon"] },
  { index: "fighter-20", level: 20, features: ["fighter-three-extra-attacks"] },
];

const MONK_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "monk-1", level: 1, features: ["monk-unarmored-defense", "martial-arts"] },
  { index: "monk-2", level: 2, features: ["monks-focus", "monk-unarmored-movement", "monk-uncanny-metabolism"] },
  { index: "monk-3", level: 3, features: ["monk-subclass", "monk-subclass-feature-3", "deflect-attacks"] },
  { index: "monk-4", level: 4, features: ["monk-ability-score-improvement-1", "slow-fall"] },
  { index: "monk-5", level: 5, features: ["monk-extra-attack", "stunning-strike"] },
  { index: "monk-6", level: 6, features: ["monk-empowered-strikes", "monk-subclass-feature-6"] },
  { index: "monk-7", level: 7, features: ["monk-evasion"] },
  { index: "monk-8", level: 8, features: ["monk-ability-score-improvement-2"] },
  { index: "monk-9", level: 9, features: ["monk-acrobatic-movement"] },
  { index: "monk-10", level: 10, features: ["monk-heightened-focus"] },
  { index: "monk-11", level: 11, features: ["monk-subclass-feature-11"] },
  { index: "monk-12", level: 12, features: ["monk-ability-score-improvement-3"] },
  { index: "monk-13", level: 13, features: ["monk-self-restoration"] },
  { index: "monk-14", level: 14, features: ["monk-disciplined-survivor"] },
  { index: "monk-15", level: 15, features: ["monk-perfect-focus"] },
  { index: "monk-16", level: 16, features: ["monk-ability-score-improvement-4"] },
  { index: "monk-17", level: 17, features: ["monk-subclass-feature-17"] },
  { index: "monk-18", level: 18, features: ["monk-superior-defense"] },
  { index: "monk-19", level: 19, features: ["monk-epic-boon"] },
  { index: "monk-20", level: 20, features: ["monk-body-and-mind"] },
];

const PALADIN_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "paladin-1", level: 1, features: ["lay-on-hands", "paladin-spellcasting", "paladin-weapon-mastery"] },
  { index: "paladin-2", level: 2, features: ["paladin-fighting-style", "paladins-smite"] },
  { index: "paladin-3", level: 3, features: ["paladin-channel-divinity", "paladin-subclass", "paladin-subclass-feature-3"] },
  { index: "paladin-4", level: 4, features: ["paladin-ability-score-improvement-1"] },
  { index: "paladin-5", level: 5, features: ["paladin-extra-attack", "faithful-steed"] },
  { index: "paladin-6", level: 6, features: ["aura-of-protection"] },
  { index: "paladin-7", level: 7, features: ["paladin-subclass-feature-7"] },
  { index: "paladin-8", level: 8, features: ["paladin-ability-score-improvement-2"] },
  { index: "paladin-9", level: 9, features: ["abjure-foes"] },
  { index: "paladin-10", level: 10, features: ["aura-of-courage"] },
  { index: "paladin-11", level: 11, features: ["radiant-strikes"] },
  { index: "paladin-12", level: 12, features: ["paladin-ability-score-improvement-3"] },
  { index: "paladin-14", level: 14, features: ["restoring-touch"] },
  { index: "paladin-15", level: 15, features: ["paladin-subclass-feature-15"] },
  { index: "paladin-16", level: 16, features: ["paladin-ability-score-improvement-4"] },
  { index: "paladin-18", level: 18, features: ["aura-expansion"] },
  { index: "paladin-19", level: 19, features: ["paladin-epic-boon"] },
  { index: "paladin-20", level: 20, features: ["paladin-subclass-feature-20"] },
];

const RANGER_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "ranger-1", level: 1, features: ["ranger-deft-explorer", "ranger-favored-enemy", "ranger-spellcasting", "ranger-weapon-mastery"] },
  { index: "ranger-2", level: 2, features: ["ranger-fighting-style"] },
  { index: "ranger-3", level: 3, features: ["ranger-roving", "ranger-subclass", "ranger-subclass-feature-3"] },
  { index: "ranger-4", level: 4, features: ["ranger-ability-score-improvement-1"] },
  { index: "ranger-5", level: 5, features: ["ranger-extra-attack"] },
  { index: "ranger-6", level: 6, features: ["ranger-expertise"] },
  { index: "ranger-7", level: 7, features: ["ranger-subclass-feature-7"] },
  { index: "ranger-8", level: 8, features: ["ranger-ability-score-improvement-2"] },
  { index: "ranger-9", level: 9, features: ["ranger-tireless"] },
  { index: "ranger-10", level: 10, features: ["ranger-natures-veil"] },
  { index: "ranger-11", level: 11, features: ["ranger-subclass-feature-11"] },
  { index: "ranger-12", level: 12, features: ["ranger-ability-score-improvement-3"] },
  { index: "ranger-13", level: 13, features: ["ranger-relentless-hunter"] },
  { index: "ranger-14", level: 14, features: ["ranger-precise-hunter"] },
  { index: "ranger-15", level: 15, features: ["ranger-subclass-feature-15"] },
  { index: "ranger-16", level: 16, features: ["ranger-ability-score-improvement-4"] },
  { index: "ranger-18", level: 18, features: ["ranger-feral-senses"] },
  { index: "ranger-19", level: 19, features: ["ranger-epic-boon"] },
  { index: "ranger-20", level: 20, features: ["ranger-foe-slayer"] },
];

const ROGUE_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "rogue-1", level: 1, features: ["rogue-expertise-1", "sneak-attack", "thieves-cant", "rogue-weapon-mastery"] },
  { index: "rogue-2", level: 2, features: ["cunning-action", "rogue-steady-aim"] },
  { index: "rogue-3", level: 3, features: ["rogue-subclass", "rogue-subclass-feature-3", "rogue-cunning-strike"] },
  { index: "rogue-4", level: 4, features: ["rogue-ability-score-improvement-1"] },
  { index: "rogue-5", level: 5, features: ["uncanny-dodge"] },
  { index: "rogue-6", level: 6, features: ["rogue-expertise-2"] },
  { index: "rogue-7", level: 7, features: ["rogue-evasion", "rogue-reliable-talent"] },
  { index: "rogue-8", level: 8, features: ["rogue-ability-score-improvement-2"] },
  { index: "rogue-9", level: 9, features: ["rogue-subclass-feature-9"] },
  { index: "rogue-10", level: 10, features: ["rogue-ability-score-improvement-3"] },
  { index: "rogue-11", level: 11, features: ["rogue-improved-cunning-strike"] },
  { index: "rogue-12", level: 12, features: ["rogue-ability-score-improvement-4"] },
  { index: "rogue-13", level: 13, features: ["rogue-subclass-feature-13"] },
  { index: "rogue-14", level: 14, features: ["rogue-devious-strikes"] },
  { index: "rogue-15", level: 15, features: ["slippery-mind"] },
  { index: "rogue-16", level: 16, features: ["rogue-ability-score-improvement-5"] },
  { index: "rogue-17", level: 17, features: ["rogue-subclass-feature-17"] },
  { index: "rogue-18", level: 18, features: ["elusive"] },
  { index: "rogue-19", level: 19, features: ["rogue-epic-boon"] },
  { index: "rogue-20", level: 20, features: ["stroke-of-luck"] },
];

const SORCERER_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "sorcerer-1", level: 1, features: ["sorcerer-spellcasting", "sorcerer-innate-sorcery"] },
  { index: "sorcerer-2", level: 2, features: ["sorcerer-font-of-magic", "metamagic-1"] },
  { index: "sorcerer-3", level: 3, features: ["sorcerer-subclass", "sorcerer-subclass-feature-3"] },
  { index: "sorcerer-4", level: 4, features: ["sorcerer-ability-score-improvement-1"] },
  { index: "sorcerer-5", level: 5, features: ["sorcerer-sorcerous-restoration"] },
  { index: "sorcerer-6", level: 6, features: ["sorcerer-subclass-feature-6"] },
  { index: "sorcerer-7", level: 7, features: ["sorcerer-sorcery-incarnate"] },
  { index: "sorcerer-8", level: 8, features: ["sorcerer-ability-score-improvement-2"] },
  { index: "sorcerer-10", level: 10, features: ["metamagic-2"] },
  { index: "sorcerer-12", level: 12, features: ["sorcerer-ability-score-improvement-3"] },
  { index: "sorcerer-14", level: 14, features: ["sorcerer-subclass-feature-14"] },
  { index: "sorcerer-16", level: 16, features: ["sorcerer-ability-score-improvement-4"] },
  { index: "sorcerer-17", level: 17, features: ["metamagic-3"] },
  { index: "sorcerer-18", level: 18, features: ["sorcerer-subclass-feature-18"] },
  { index: "sorcerer-19", level: 19, features: ["sorcerer-epic-boon"] },
  { index: "sorcerer-20", level: 20, features: ["arcane-apotheosis"] },
];

const WARLOCK_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "warlock-1", level: 1, features: ["eldritch-invocations", "pact-magic"] },
  { index: "warlock-2", level: 2, features: ["warlock-magical-cunning"] },
  { index: "warlock-3", level: 3, features: ["warlock-subclass", "warlock-subclass-feature-3"] },
  { index: "warlock-4", level: 4, features: ["warlock-ability-score-improvement-1"] },
  { index: "warlock-6", level: 6, features: ["warlock-subclass-feature-6"] },
  { index: "warlock-8", level: 8, features: ["warlock-ability-score-improvement-2"] },
  { index: "warlock-9", level: 9, features: ["contact-patron"] },
  { index: "warlock-10", level: 10, features: ["warlock-subclass-feature-10"] },
  { index: "warlock-11", level: 11, features: ["mystic-arcanum-6th-level"] },
  { index: "warlock-12", level: 12, features: ["warlock-ability-score-improvement-3"] },
  { index: "warlock-13", level: 13, features: ["mystic-arcanum-7th-level"] },
  { index: "warlock-14", level: 14, features: ["warlock-subclass-feature-14"] },
  { index: "warlock-15", level: 15, features: ["mystic-arcanum-8th-level"] },
  { index: "warlock-16", level: 16, features: ["warlock-ability-score-improvement-4"] },
  { index: "warlock-17", level: 17, features: ["mystic-arcanum-9th-level"] },
  { index: "warlock-19", level: 19, features: ["warlock-epic-boon"] },
  { index: "warlock-20", level: 20, features: ["eldritch-master"] },
];

const WIZARD_LEVEL_REFERENCES: CuratedLevelReference[] = [
  { index: "wizard-1", level: 1, features: ["wizard-spellcasting", "ritual-adept", "arcane-recovery"] },
  { index: "wizard-2", level: 2, features: ["scholar"] },
  { index: "wizard-3", level: 3, features: ["wizard-subclass", "wizard-subclass-feature-3"] },
  { index: "wizard-4", level: 4, features: ["wizard-ability-score-improvement-1"] },
  { index: "wizard-5", level: 5, features: ["memorize-spell"] },
  { index: "wizard-6", level: 6, features: ["wizard-subclass-feature-6"] },
  { index: "wizard-8", level: 8, features: ["wizard-ability-score-improvement-2"] },
  { index: "wizard-10", level: 10, features: ["wizard-subclass-feature-10"] },
  { index: "wizard-12", level: 12, features: ["wizard-ability-score-improvement-3"] },
  { index: "wizard-14", level: 14, features: ["wizard-subclass-feature-14"] },
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
