type CuratedFeatReference = {
  index: string;
  name: string;
  type: "origin" | "general" | "fighting-style" | "epic-boon";
  description: string;
  feature_specific?: unknown;
  repeatable?: string;
  prerequisites?: Record<string, unknown>;
  prerequisite_options?: Record<string, unknown>;
  url: string;
};

function featUrl(index: string) {
  return `/api/2024/feats/${index}`;
}

const ARTISAN_TOOL_NAMES = [
  "Alchemist's Supplies",
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cartographer's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Smith's Tools",
  "Tinker's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools",
];

const MUSICAL_INSTRUMENT_NAMES = [
  "Bagpipes",
  "Drum",
  "Dulcimer",
  "Flute",
  "Lute",
  "Lyre",
  "Horn",
  "Pan Flute",
  "Shawm",
  "Viol",
];

const SKILL_NAMES = [
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function referenceOption(name: string, category: string, label = name) {
  const index = category === "skills" ? `skill-${slugify(name)}` : slugify(name);

  return {
    option_type: "reference",
    item: {
      index,
      name: label,
      url: `/api/2024/proficiencies/${index}`,
    },
  };
}

function choiceSpecific(
  id: string,
  label: string,
  choose: number,
  options: Array<ReturnType<typeof referenceOption>>,
) {
  return {
    type: "proficiency choice",
    proficiency: {
      id,
      label,
      field_label: label,
      choose,
      from: {
        option_set_type: "options_array",
        options,
      },
    },
  };
}

const CURATED_2024_FEAT_REFERENCES: CuratedFeatReference[] = [
  {
    index: "alert",
    name: "Alert",
    type: "origin",
    description:
      "You gain the following benefits.\n\nInitiative Proficiency. When you roll Initiative, you can add your Proficiency Bonus to the roll.\n\nInitiative Swap. Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can't make this swap if you or the ally has the Incapacitated condition.",
    url: featUrl("alert"),
  },
  {
    index: "crafter",
    name: "Crafter",
    type: "origin",
    description:
      "You gain the following benefits.\n\nTool Proficiency. You gain proficiency with three different Artisan's Tools of your choice from the Fast Crafting table.\n\nDiscount. Whenever you buy a nonmagical item, you receive a 20 percent discount on it.\n\nFast Crafting. When you finish a Long Rest, you can craft one piece of gear from the Fast Crafting table, provided you have the Artisan's Tools associated with that item and have proficiency with those tools. The item lasts until you finish another Long Rest, at which point the item falls apart.",
    feature_specific: choiceSpecific(
      "crafter-tools",
      "Artisan's Tool",
      3,
      ARTISAN_TOOL_NAMES.map((name) => referenceOption(name, "tools", `Tool: ${name}`)),
    ),
    url: featUrl("crafter"),
  },
  {
    index: "healer",
    name: "Healer",
    type: "origin",
    description:
      "You gain the following benefits.\n\nBattle Medic. If you have Healer's kit, you can expend one use of it and tend to a creature within 5 feet of yourself as a Utilize action. That creature can expend one of its Hit Point Dice, and you then roll that die. The creature regains a number of Hit Points equal to the roll plus your Proficiency Bonus.\n\nHealing Rerolls. Whenever you roll a die to determine the number of Hit Points you restore with a spell or with this feat's Battle Medic benefit, you can reroll the die if it rolls a 1, and you must use the new roll.",
    url: featUrl("healer"),
  },
  {
    index: "lucky",
    name: "Lucky",
    type: "origin",
    description:
      "You gain the following benefits.\n\nLuck Points. You have a number of Luck Points equal to your Proficiency Bonus and can spend the points on the benefits below. You regain your expended Luck Points when you finish a Long Rest.\n\nAdvantage. When you roll a d20 for a D20 test, you can spend 1 Luck Point to give yourself Advantage on the roll.\n\nDisadvantage. When a creature rolls a d20 for an attack roll against you, you can spend 1 Luck Point to impose Disadvantage on that roll.",
    url: featUrl("lucky"),
  },
  {
    index: "magic-initiate",
    name: "Magic Initiate",
    type: "origin",
    description:
      "You gain the following benefits.\n\nTwo Cantrips. You learn two cantrips of your choice from the Cleric, Druid, or Wizard spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat's spells (choose when you select this feat).\n\nLevel 1 Spell. Choose a level 1 spell from the same list you selected for this feat's cantrips. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.\n\nSpell Change. Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.",
    repeatable:
      "You can take this feat more than once, but you must choose a different spell list each time.",
    url: featUrl("magic-initiate"),
  },
  {
    index: "musician",
    name: "Musician",
    type: "origin",
    description:
      "You gain the following benefits.\n\nInstrument Training. You gain proficiency with three Musical Instruments of your choice.\n\nEncouraging Song. As you finish a Short or Long Rest, you can play a song on a Musical Instrument with which you have proficiency and give Heroic inspiration to allies who hear the song. The number of allies you can affect in this way equals your Proficiency Bonus.",
    feature_specific: choiceSpecific(
      "musician-instruments",
      "Musical Instrument",
      3,
      MUSICAL_INSTRUMENT_NAMES.map((name) => referenceOption(name, "tools", `Tool: ${name}`)),
    ),
    url: featUrl("musician"),
  },
  {
    index: "savage-attacker",
    name: "Savage Attacker",
    type: "origin",
    description:
      "Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll against the target.",
    url: featUrl("savage-attacker"),
  },
  {
    index: "skilled",
    name: "Skilled",
    type: "origin",
    description:
      "You gain proficiency in any combination of three skills or tools of your choice.",
    feature_specific: choiceSpecific(
      "skilled-proficiencies",
      "Skill or Tool",
      3,
      [
        ...SKILL_NAMES.map((name) => referenceOption(name, "skills", `Skill: ${name}`)),
        ...ARTISAN_TOOL_NAMES.map((name) => referenceOption(name, "tools", `Tool: ${name}`)),
        ...MUSICAL_INSTRUMENT_NAMES.map((name) => referenceOption(name, "tools", `Tool: ${name}`)),
      ],
    ),
    repeatable: "You can take this feat more than once.",
    url: featUrl("skilled"),
  },
  {
    index: "tavern-brawler",
    name: "Tavern Brawler",
    type: "origin",
    description:
      "You gain the following benefits.\n\nEnhanced Unarmed Strike. When you hit with your Unarmed Strike and deal damage, you can deal Bludgeoning damage equal to 1d4 plus your Strength modifier instead of the normal damage of an Unarmed Strike.\n\nDamage Rerolls. Whenever you roll a damage die for your Unarmed Strike, you can reroll the die if it rolls a 1, and you must use the new roll.\n\nImprovised Weaponry. You have proficiency with improvised weapons.\n\nPush. When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can deal damage to the target and also push it 5 feet away from you. You can use this benefit only once per turn.",
    url: featUrl("tavern-brawler"),
  },
  {
    index: "ability-score-improvement",
    name: "Ability Score Improvement",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Increase one ability score of your choice by 2, or increase two ability scores of your choice by 1. This feat can't increase an ability score above 20.",
    repeatable: "You can take this feat more than once.",
    url: featUrl("ability-score-improvement"),
  },
  {
    index: "actor",
    name: "Actor",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You gain the following benefits.\n\nAbility Score Increase. Increase your Charisma score by 1, to a maximum of 20.\n\nImpersonation. While you're disguised as a real or fictional person, you have Advantage on Charisma (Deception or Performance) checks to convince others that you are that person.\n\nMimicry. You can mimic the sounds of other creatures, including speech. A creature that hears the mimicry must succeed on a Wisdom (Insight) check to determine the effect is faked (DC 8 plus your Charisma modifier and Proficiency Bonus).",
    url: featUrl("actor"),
  },
  {
    index: "athlete",
    name: "Athlete",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You gain the following benefits.\n\nAbility Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nClimb Speed. You gain a Climb Speed equal to your Speed.\n\nHop Up. When you have the Prone condition, you can right yourself with only 5 feet of movement.\n\nJumping. You can make a running Long or High Jump after moving only 5 feet.",
    url: featUrl("athlete"),
  },
  {
    index: "charger",
    name: "Charger",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You gain the following benefits.\n\nAbility Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nImproved Dash. When you take the Dash action, your Speed increases by 10 feet for that action.\n\nCharge Attack. If you move at least 10 feet in a straight line toward a target immediately before hitting it with a melee attack roll as part of the Attack action, choose one of the following effects: gain a 1d8 bonus to the attack's damage roll, or push the target up to 10 feet away if it is no more than one size larger than you. You can use this benefit only once on each of your turns.",
    url: featUrl("charger"),
  },
  {
    index: "durable",
    name: "Durable",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Ability Score Increase. Increase your Constitution score by 1, to a maximum of 20.\n\nDefy Death. You have Advantage on Death Saving Throws.\n\nSpeedy Recovery. As a Bonus Action, you can expend one of your Hit Point Dice, roll the die, and regain a number of Hit Points equal to the roll.",
    url: featUrl("durable"),
  },
  {
    index: "heavy-armor-master",
    name: "Heavy Armor Master",
    type: "general",
    prerequisites: {
      minimum_level: 4,
      proficiency_with: "heavy-armor",
    },
    description:
      "Ability Score Increase. Increase your Constitution or Strength score by 1, to a maximum of 20.\n\nDamage Reduction. When you're hit by an attack while you're wearing Heavy armor, any Bludgeoning, Piercing, and Slashing damage dealt to you by that attack is reduced by an amount equal to your Proficiency Bonus.",
    url: featUrl("heavy-armor-master"),
  },
  {
    index: "lightly-armored",
    name: "Lightly Armored",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20.\n\nArmor Training. You gain training with Light Armor and Shields.",
    url: featUrl("lightly-armored"),
  },
  {
    index: "resilient",
    name: "Resilient",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Choose one ability score to increase by 1 and gain proficiency in saving throws using that same ability.",
    repeatable:
      "You can take this feat more than once, choosing a different ability score each time.",
    url: featUrl("resilient"),
  },
  {
    index: "tough",
    name: "Tough",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Your Hit Point maximum increases by an amount equal to twice your character level when you gain this feat. Whenever you gain a character level thereafter, your Hit Point maximum increases by an additional 2 Hit Points.",
    url: featUrl("tough"),
  },
  {
    index: "archery",
    name: "Archery",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "You gain a +2 bonus to attack rolls you make with Ranged weapons.",
    url: featUrl("archery"),
  },
  {
    index: "defense",
    name: "Defense",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "While you're wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.",
    url: featUrl("defense"),
  },
  {
    index: "dueling",
    name: "Dueling",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "When you're holding a Melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.",
    url: featUrl("dueling"),
  },
  {
    index: "great-weapon-fighting",
    name: "Great Weapon Fighting",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "When you roll damage for an attack you make with a Melee weapon that you are holding with two hands, you can treat any 1 or 2 on a damage die as a 3. The weapon must have the Two-Handed or Versatile property to gain this benefit.",
    url: featUrl("great-weapon-fighting"),
  },
  {
    index: "protection",
    name: "Protection",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "When a creature you can see attacks a target other than you that is within 5 feet of you, you can take a Reaction to impose Disadvantage on the attack roll. You must be holding a Shield to use this Reaction.",
    url: featUrl("protection"),
  },
  {
    index: "two-weapon-fighting",
    name: "Two-Weapon Fighting",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "When you make an extra attack as a result of using a weapon that has the Light property, you can add your ability modifier to the damage of that attack if you aren't already adding it to the damage.",
    url: featUrl("two-weapon-fighting"),
  },
  {
    index: "boon-of-combat-prowess",
    name: "Boon of Combat Prowess",
    type: "epic-boon",
    prerequisites: {
      minimum_level: 19,
    },
    description:
      "Epic Boon Feat (Prerequisite: Level 19+)\n\nYou gain the following benefits.\n\nAbility Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nPeerless Aim. When you miss with an attack roll, you can hit instead. Once you use this benefit, you can't use it again until the start of your next turn.",
    url: featUrl("boon-of-combat-prowess"),
  },
  {
    index: "boon-of-dimensional-travel",
    name: "Boon of Dimensional Travel",
    type: "epic-boon",
    prerequisites: {
      minimum_level: 19,
    },
    description:
      "Increase one ability score by 1, up to 30, and after taking the Attack or Magic action you can teleport up to 30 feet.",
    url: featUrl("boon-of-dimensional-travel"),
  },
  {
    index: "boon-of-fate",
    name: "Boon of Fate",
    type: "epic-boon",
    prerequisites: {
      minimum_level: 19,
    },
    description:
      "Epic Boon Feat (Prerequisite: Level 19+)\n\nYou gain the following benefits.\n\nAbility Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nImprove Fate. When you or another creature within 60 feet of you succeeds on or fails a D20 Test, you can roll 2d4 and apply the total rolled as a bonus or penalty to the d20 roll. Once you use this benefit, you can't use it again until you roll Initiative or finish a Short or Long Rest.",
    url: featUrl("boon-of-fate"),
  },
  {
    index: "boon-of-irresistible-offense",
    name: "Boon of Irresistible Offense",
    type: "epic-boon",
    prerequisites: {
      minimum_level: 19,
    },
    description:
      "Epic Boon Feat (Prerequisite: Level 19+)\n\nYou gain the following benefits.\n\nAbility Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 30.\n\nOvercome Defenses. The Bludgeoning, Piercing, and Slashing damage you deal always ignores Resistance.\n\nOverwhelming Strike. When you roll a 20 on the d20 for an attack roll, you can deal extra damage to the target equal to the ability score increased by this feat. The extra damage's type is the same as the attack's type.",
    url: featUrl("boon-of-irresistible-offense"),
  },
  {
    index: "boon-of-spell-recall",
    name: "Boon of Spell Recall",
    type: "epic-boon",
    prerequisites: {
      minimum_level: 19,
      feature_named: "Spellcasting",
    },
    description:
      "Epic Boon Feat (Prerequisite: Level 19+)\n\nYou gain the following benefits.\n\nAbility Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 30.\n\nFree Casting. Whenever you cast a spell with a level 1-4 spell slot, roll 1d4. If the number you roll is the same as the slot's level, the slot isn't expended.",
    url: featUrl("boon-of-spell-recall"),
  },
  {
    index: "boon-of-the-night-spirit",
    name: "Boon of the Night Spirit",
    type: "epic-boon",
    prerequisites: {
      minimum_level: 19,
    },
    description:
      "Epic Boon Feat (Prerequisite: Level 19+)\n\nYou gain the following benefits.\n\nAbility Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nMerge with Shadows. While within Dim Light or Darkness, you can give yourself the Invisible condition as a Bonus Action. The condition ends on you immediately after you take an action, a Bonus Action, or a Reaction.\n\nShadowy Form. While within Dim Light or Darkness, you have Resistance to all damage except Psychic and Radiant.",
    url: featUrl("boon-of-the-night-spirit"),
  },
  {
    index: "boon-of-truesight",
    name: "Boon of Truesight",
    type: "epic-boon",
    prerequisites: {
      minimum_level: 19,
    },
    description:
      "Epic Boon Feat (Prerequisite: Level 19+)\n\nYou gain the following benefits.\n\nAbility Score Increase. Increase one ability score of your choice by 1, to a maximum of 30.\n\nTruesight. You have Truesight 60 ft.",
    url: featUrl("boon-of-truesight"),
  },
];

export { CURATED_2024_FEAT_REFERENCES };
export type { CuratedFeatReference };
