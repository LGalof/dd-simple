type CuratedFeatReference = {
  index: string;
  name: string;
  type: "origin" | "general" | "fighting-style" | "epic-boon";
  description: string;
  repeatable?: string;
  prerequisites?: Record<string, unknown>;
  prerequisite_options?: Record<string, unknown>;
  url: string;
};

function featUrl(index: string) {
  return `/api/2024/feats/${index}`;
}

const CURATED_2024_FEAT_REFERENCES: CuratedFeatReference[] = [
  {
    index: "alert",
    name: "Alert",
    type: "origin",
    description:
      "You gain Initiative Proficiency, and immediately after you roll Initiative you can swap your Initiative with a willing ally in the same combat if neither of you is Incapacitated.",
    url: featUrl("alert"),
  },
  {
    index: "crafter",
    name: "Crafter",
    type: "origin",
    description:
      "You gain proficiency with three different artisan's tools, receive a discount when buying nonmagical items, and can craft common equipment more efficiently during downtime.",
    url: featUrl("crafter"),
  },
  {
    index: "healer",
    name: "Healer",
    type: "origin",
    description:
      "You can quickly stabilize creatures, restore extra hit points with healing kits, and improve the recovery your allies get from your battlefield care.",
    url: featUrl("healer"),
  },
  {
    index: "lucky",
    name: "Lucky",
    type: "origin",
    description:
      "You gain Luck Points you can spend to give yourself Advantage on a d20 Test or to impose Disadvantage on an attack roll made against you.",
    url: featUrl("lucky"),
  },
  {
    index: "magic-initiate",
    name: "Magic Initiate",
    type: "origin",
    description:
      "You learn two cantrips and one 1st-level spell from the Cleric, Druid, or Wizard spell list, and you can cast the chosen 1st-level spell once per Long Rest without a spell slot.",
    repeatable:
      "You can take this feat more than once, but you must choose a different spell list each time.",
    url: featUrl("magic-initiate"),
  },
  {
    index: "musician",
    name: "Musician",
    type: "origin",
    description:
      "You gain proficiency with three musical instruments, and after a Short or Long Rest you can inspire allies so they begin the next day with Heroic Inspiration.",
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
    repeatable: "You can take this feat more than once.",
    url: featUrl("skilled"),
  },
  {
    index: "tavern-brawler",
    name: "Tavern Brawler",
    type: "origin",
    description:
      "Your unarmed strikes and improvised attacks become more dangerous, and after you hit a creature you can shove or grapple it as part of the same aggressive sequence.",
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
      "You sharpen your performance and impersonation skills, gaining a Charisma boost and a stronger ability to mimic voices, mannerisms, and dramatic delivery.",
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
      "You gain a physical ability score increase and improved mobility, letting you climb, jump, stand, and reposition more effectively in combat and exploration.",
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
      "When you Dash, you can follow with a forceful strike or shove, turning your movement into an explosive offensive burst.",
    url: featUrl("charger"),
  },
  {
    index: "crossbow-expert",
    name: "Crossbow Expert",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You ignore the Loading property of crossbows, fight effectively in close quarters with ranged weapons, and gain an extra attack pattern that rewards dedicated crossbow use.",
    url: featUrl("crossbow-expert"),
  },
  {
    index: "defensive-duelist",
    name: "Defensive Duelist",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "When you are wielding a finesse weapon and a creature hits you with a melee attack, you can use your Reaction to raise your Armor Class against that strike.",
    url: featUrl("defensive-duelist"),
  },
  {
    index: "dual-wielder",
    name: "Dual Wielder",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You become more effective with paired weapons, gaining additional weapon flexibility and stronger two-weapon offense.",
    url: featUrl("dual-wielder"),
  },
  {
    index: "durable",
    name: "Durable",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Your resilience improves, granting a Constitution increase and better recovery whenever you spend Hit Point Dice.",
    url: featUrl("durable"),
  },
  {
    index: "elemental-adept",
    name: "Elemental Adept",
    type: "general",
    prerequisites: {
      minimum_level: 4,
      feature_named: "Spellcasting",
    },
    description:
      "Choose one elemental damage type. Your spells with that damage type cut through resistance more reliably and deal steadier damage.",
    url: featUrl("elemental-adept"),
  },
  {
    index: "grappler",
    name: "Grappler",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    prerequisite_options: {
      desc: "Strength or Dexterity 13+",
      type: "ability-scores",
      choose: 1,
      from: {
        option_set_type: "options_array",
        options: [
          {
            option_type: "score_prerequisite",
            ability_score: {
              index: "str",
              name: "STR",
              url: "/api/2024/ability-scores/str",
            },
            minimum_score: 13,
          },
          {
            option_type: "score_prerequisite",
            ability_score: {
              index: "dex",
              name: "DEX",
              url: "/api/2024/ability-scores/dex",
            },
            minimum_score: 13,
          },
        ],
      },
    },
    description:
      "You gain a Strength or Dexterity increase and become much better at combining Unarmed Strikes, grapples, and pressure against restrained foes.",
    url: featUrl("grappler"),
  },
  {
    index: "great-weapon-master",
    name: "Great Weapon Master",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You deliver especially punishing heavy melee attacks and can press your advantage with brutal follow-through when you land decisive hits.",
    url: featUrl("great-weapon-master"),
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
      "You strengthen your body and armor training, reducing incoming physical damage while wearing Heavy Armor.",
    url: featUrl("heavy-armor-master"),
  },
  {
    index: "inspiring-leader",
    name: "Inspiring Leader",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You can deliver stirring words that grant Temporary Hit Points to your allies before danger begins.",
    url: featUrl("inspiring-leader"),
  },
  {
    index: "keen-mind",
    name: "Keen Mind",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Your mental precision sharpens, improving memory, recall, orientation, and the ability to quickly piece information together.",
    url: featUrl("keen-mind"),
  },
  {
    index: "lightly-armored",
    name: "Lightly Armored",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You gain training with Light Armor and an ability score increase that helps you start building toward armored defense.",
    url: featUrl("lightly-armored"),
  },
  {
    index: "mage-slayer",
    name: "Mage Slayer",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You specialize in disrupting enemy spellcasters, staying dangerous in their reach and punishing their attempts to cast under pressure.",
    url: featUrl("mage-slayer"),
  },
  {
    index: "medium-armor-master",
    name: "Medium Armor Master",
    type: "general",
    prerequisites: {
      minimum_level: 4,
      proficiency_with: "medium-armor",
    },
    description:
      "You move more effectively in Medium Armor and get better value from your Dexterity without sacrificing protection.",
    url: featUrl("medium-armor-master"),
  },
  {
    index: "moderately-armored",
    name: "Moderately Armored",
    type: "general",
    prerequisites: {
      minimum_level: 4,
      proficiency_with: "light-armor",
    },
    description:
      "You gain training with Medium Armor and Shields, broadening your defensive equipment options.",
    url: featUrl("moderately-armored"),
  },
  {
    index: "observant",
    name: "Observant",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Your awareness improves, granting a mental ability increase and heightened passive perception and investigation.",
    url: featUrl("observant"),
  },
  {
    index: "polearm-master",
    name: "Polearm Master",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You gain extra tactical attacks with polearms and can threaten enemies who close into your reach.",
    url: featUrl("polearm-master"),
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
    index: "ritual-caster",
    name: "Ritual Caster",
    type: "general",
    prerequisites: {
      minimum_level: 4,
      feature_named: "Spellcasting",
    },
    description:
      "You record magical rituals in a special book and can cast qualifying ritual spells without preparing them in the normal way.",
    url: featUrl("ritual-caster"),
  },
  {
    index: "sentinel",
    name: "Sentinel",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You are excellent at pinning enemies in place, stopping their movement and punishing them when they try to slip past or attack your allies.",
    url: featUrl("sentinel"),
  },
  {
    index: "shield-master",
    name: "Shield Master",
    type: "general",
    prerequisites: {
      minimum_level: 4,
      proficiency_with: "shields",
    },
    description:
      "You turn your shield into an aggressive defensive tool, improving shove options and helping you weather dangerous Dexterity-based effects.",
    url: featUrl("shield-master"),
  },
  {
    index: "skill-expert",
    name: "Skill Expert",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You improve one ability score, gain proficiency in a skill, and gain Expertise in a skill you already know.",
    url: featUrl("skill-expert"),
  },
  {
    index: "skulker",
    name: "Skulker",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You become harder to pin down while hiding, attacking from concealment more effectively and remaining elusive in dim conditions.",
    url: featUrl("skulker"),
  },
  {
    index: "speedy",
    name: "Speedy",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Your movement speed improves and you handle Dashes, Disengages, and battlefield mobility with greater efficiency.",
    url: featUrl("speedy"),
  },
  {
    index: "spell-sniper",
    name: "Spell Sniper",
    type: "general",
    prerequisites: {
      minimum_level: 4,
      feature_named: "Spellcasting",
    },
    description:
      "You extend the effective reach of attack spells and learn to land them more cleanly from a distance.",
    url: featUrl("spell-sniper"),
  },
  {
    index: "tough",
    name: "Tough",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "Your maximum Hit Points increase substantially, making you much harder to put down over a long adventuring day.",
    url: featUrl("tough"),
  },
  {
    index: "war-caster",
    name: "War Caster",
    type: "general",
    prerequisites: {
      minimum_level: 4,
      feature_named: "Spellcasting",
    },
    description:
      "You maintain concentration better under pressure and can weave spellcasting more naturally into armed combat.",
    url: featUrl("war-caster"),
  },
  {
    index: "weapon-master",
    name: "Weapon Master",
    type: "general",
    prerequisites: {
      minimum_level: 4,
    },
    description:
      "You expand your martial training, gaining proficiency with additional weapons and improving the ability score that supports your chosen combat style.",
    url: featUrl("weapon-master"),
  },
  {
    index: "archery",
    name: "Archery",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description: "You gain a +2 bonus to attack rolls you make with Ranged weapons.",
    url: featUrl("archery"),
  },
  {
    index: "blind-fighting",
    name: "Blind Fighting",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "You gain Blindsight with a short range, letting you better detect creatures you can't see directly.",
    url: featUrl("blind-fighting"),
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
      "When you roll damage for an attack made with a qualifying two-handed melee weapon, you can treat any 1 or 2 on a damage die as a 3.",
    url: featUrl("great-weapon-fighting"),
  },
  {
    index: "interception",
    name: "Interception",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "When a creature you can see hits a nearby target other than you, you can use your Reaction to reduce the damage by interposing your weapon or shield.",
    url: featUrl("interception"),
  },
  {
    index: "protection",
    name: "Protection",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "When a creature you can see attacks a nearby ally, you can impose disadvantage by using your shield to interfere.",
    url: featUrl("protection"),
  },
  {
    index: "thrown-weapon-fighting",
    name: "Thrown Weapon Fighting",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "You draw thrown weapons more fluidly, and thrown weapon attacks gain an extra damage bonus.",
    url: featUrl("thrown-weapon-fighting"),
  },
  {
    index: "two-weapon-fighting",
    name: "Two-Weapon Fighting",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "When you make an extra attack because of a Light weapon, you can add your ability modifier to that attack's damage if it isn't already included.",
    url: featUrl("two-weapon-fighting"),
  },
  {
    index: "unarmed-fighting",
    name: "Unarmed Fighting",
    type: "fighting-style",
    prerequisites: {
      feature_named: "Fighting Style",
    },
    description:
      "Your unarmed strikes deal stronger damage, and creatures you grapple take automatic pressure damage at the start of your turn.",
    url: featUrl("unarmed-fighting"),
  },
  {
    index: "boon-of-combat-prowess",
    name: "Boon of Combat Prowess",
    type: "epic-boon",
    prerequisites: {
      minimum_level: 19,
    },
    description:
      "Increase one ability score by 1, up to 30, and once between turns you can turn a missed attack into a hit.",
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
      "Increase one ability score by 1, up to 30, and twist fate by applying 2d4 as a bonus or penalty to a nearby creature's d20 Test.",
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
      "Increase one ability score by 1, up to 30, ignore resistance to your basic weapon damage, and add extra damage when you roll a 20 on an attack.",
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
      "Increase one ability score by 1, up to 30, and sometimes preserve low-level spell slots when you cast with them.",
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
      "Increase one ability score by 1, up to 30, gain powerful shadow movement and invisibility benefits, and become extremely resilient in darkness.",
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
      "Increase one ability score by 1, up to 30, and gain Truesight out to 60 feet.",
    url: featUrl("boon-of-truesight"),
  },
];

export { CURATED_2024_FEAT_REFERENCES };
export type { CuratedFeatReference };
