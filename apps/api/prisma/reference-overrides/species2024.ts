type SpeciesIndex = "dragonborn" | "elf" | "gnome" | "human" | "orc" | "tiefling";

type CuratedSpeciesTraitReference = {
  desc: string[];
  index: string;
  level?: number;
  name: string;
  speciesIndex: SpeciesIndex;
};

type CuratedSubspeciesReference = {
  description: string;
  index: string;
  name: string;
  speciesIndex: SpeciesIndex;
  traits: Array<{
    index: string;
    level: number;
    name: string;
  }>;
};

const speciesNames: Record<SpeciesIndex, string> = {
  dragonborn: "Dragonborn",
  elf: "Elf",
  gnome: "Gnome",
  human: "Human",
  orc: "Orc",
  tiefling: "Tiefling",
};

const BREATH_WEAPON_DESCRIPTION = [
  "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot Line that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 damage of the type determined by your Draconic Ancestry trait. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).",
  "You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
];

const ELF_LINEAGE_DESCRIPTION = [
  "Choose an elven lineage: Drow, High Elf, or Wood Elf. Your choice grants lineage traits at levels 1, 3, and 5.",
  "Drow. Your Darkvision range increases to 120 feet, and you know the Dancing Lights cantrip. At level 3, you learn Faerie Fire. At level 5, you learn Darkness.",
  "High Elf. You know the Prestidigitation cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Wizard spell list. At level 3, you learn Detect Magic. At level 5, you learn Misty Step.",
  "Wood Elf. Your Speed increases to 35 feet, and you know the Druidcraft cantrip. At level 3, you learn Longstrider. At level 5, you learn Pass without Trace.",
];

const GNOMISH_LINEAGE_DESCRIPTION = [
  "You are part of a lineage that grants you supernatural abilities. Choose Forest Gnome or Rock Gnome. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait; choose the ability when you select the lineage.",
  "Forest Gnome. You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest. You can also use any spell slots you have to cast the spell.",
  "Rock Gnome. You know the Mending and Prestidigitation cantrips. In addition, you can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP), such as a toy, fire starter, or music box. When you create the device, you determine its function by choosing one effect from Prestidigitation; the device produces that effect whenever you or another creature takes a Bonus Action to activate it with a touch. If the chosen effect has options within it, you choose one of those options for the device when you create it. For example, if you choose the spell's ignite-extinguish effect, you determine whether the device ignites or extinguishes fire; the device doesn't do both. You can have three such devices in existence at a time, and each falls apart 8 hours after its creation or when you dismantle it with a touch as a Utilize action.",
];

const FIENDISH_LEGACY_DESCRIPTION = [
  "You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy from the Fiendish Legacies table. You gain the level 1 benefit of the chosen legacy.",
  "When you reach character levels 3 and 5, you learn a higher-level spell, as shown on the table. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the legacy).",
  "Abyssal. You have Resistance to Poison damage and know the Poison Spray cantrip. At level 3, you learn Ray of Sickness. At level 5, you learn Hold Person.",
  "Chthonic. You have Resistance to Necrotic damage and know the Chill Touch cantrip. At level 3, you learn False Life. At level 5, you learn Ray of Enfeeblement.",
  "Infernal. You have Resistance to Fire damage and know the Fire Bolt cantrip. At level 3, you learn Hellish Rebuke. At level 5, you learn Darkness.",
];

const DRAGONBORN_TRAIT_REFERENCES: CuratedSpeciesTraitReference[] = [
  {
    index: "draconic-breath-weapon-acid",
    name: "Breath Weapon: Acid",
    speciesIndex: "dragonborn",
    level: 1,
    desc: BREATH_WEAPON_DESCRIPTION,
  },
  {
    index: "draconic-breath-weapon-cold",
    name: "Breath Weapon: Cold",
    speciesIndex: "dragonborn",
    level: 1,
    desc: BREATH_WEAPON_DESCRIPTION,
  },
  {
    index: "draconic-breath-weapon-fire",
    name: "Breath Weapon: Fire",
    speciesIndex: "dragonborn",
    level: 1,
    desc: BREATH_WEAPON_DESCRIPTION,
  },
  {
    index: "draconic-breath-weapon-lightning",
    name: "Breath Weapon: Lightning",
    speciesIndex: "dragonborn",
    level: 1,
    desc: BREATH_WEAPON_DESCRIPTION,
  },
  {
    index: "draconic-breath-weapon-poison",
    name: "Breath Weapon: Poison",
    speciesIndex: "dragonborn",
    level: 1,
    desc: BREATH_WEAPON_DESCRIPTION,
  },
];

const ORC_TRAIT_REFERENCES: CuratedSpeciesTraitReference[] = [
  {
    index: "relentless-endurance",
    name: "Relentless Endurance",
    speciesIndex: "orc",
    level: 1,
    desc: [
      "When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can't use it again until you finish a Long Rest.",
    ],
  },
];

const ELF_LINEAGE_TRAIT_REFERENCES: CuratedSpeciesTraitReference[] = [
  {
    index: "elven-lineage",
    name: "Elven Lineage",
    speciesIndex: "elf",
    desc: ELF_LINEAGE_DESCRIPTION,
  },
  {
    index: "darkvision-120",
    name: "Darkvision 120 ft.",
    speciesIndex: "elf",
    level: 1,
    desc: ["The range of your Darkvision increases to 120 feet."],
  },
  {
    index: "lineage-spell-dancing-lights",
    name: "Dancing Lights",
    speciesIndex: "elf",
    level: 1,
    desc: ["You know the Dancing Lights cantrip through your Drow lineage."],
  },
  {
    index: "high-elf-cantrip-versatility",
    name: "High Elf Cantrip",
    speciesIndex: "elf",
    level: 1,
    desc: [
      "You know the Prestidigitation cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Wizard spell list.",
    ],
  },
  {
    index: "lineage-spell-druidcraft",
    name: "Druidcraft",
    speciesIndex: "elf",
    level: 1,
    desc: ["You know the Druidcraft cantrip through your Wood Elf lineage."],
  },
  {
    index: "wood-elf-speed-increase",
    name: "Wood Elf Speed",
    speciesIndex: "elf",
    level: 1,
    desc: ["Your Speed increases by 5 feet, to 35 feet."],
  },
  {
    index: "lineage-spell-faerie-fire",
    name: "Faerie Fire",
    speciesIndex: "elf",
    level: 3,
    desc: ["At character level 3, you learn the Faerie Fire spell through your Drow lineage."],
  },
  {
    index: "lineage-spell-detect-magic",
    name: "Detect Magic",
    speciesIndex: "elf",
    level: 3,
    desc: ["At character level 3, you learn the Detect Magic spell through your High Elf lineage."],
  },
  {
    index: "lineage-spell-longstrider",
    name: "Longstrider",
    speciesIndex: "elf",
    level: 3,
    desc: ["At character level 3, you learn the Longstrider spell through your Wood Elf lineage."],
  },
  {
    index: "lineage-spell-darkness",
    name: "Darkness",
    speciesIndex: "elf",
    level: 5,
    desc: ["At character level 5, you learn the Darkness spell through your Drow lineage."],
  },
  {
    index: "lineage-spell-misty-step",
    name: "Misty Step",
    speciesIndex: "elf",
    level: 5,
    desc: ["At character level 5, you learn the Misty Step spell through your High Elf lineage."],
  },
  {
    index: "lineage-spell-pass-without-trace",
    name: "Pass without Trace",
    speciesIndex: "elf",
    level: 5,
    desc: ["At character level 5, you learn the Pass without Trace spell through your Wood Elf lineage."],
  },
];

const GNOMISH_LINEAGE_TRAIT_REFERENCES: CuratedSpeciesTraitReference[] = [
  {
    index: "gnomish-lineage",
    name: "Gnomish Lineage",
    speciesIndex: "gnome",
    desc: GNOMISH_LINEAGE_DESCRIPTION,
  },
  {
    index: "gnomish-lineage-forest-gnome",
    name: "Gnomish Lineage: Forest Gnome",
    speciesIndex: "gnome",
    level: 1,
    desc: [
      "You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest. You can also use any spell slots you have to cast the spell.",
    ],
  },
  {
    index: "gnomish-lineage-rock-gnome",
    name: "Gnomish Lineage: Rock Gnome",
    speciesIndex: "gnome",
    level: 1,
    desc: [
      "You know the Mending and Prestidigitation cantrips. In addition, you can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP), such as a toy, fire starter, or music box. You can have three such devices in existence at a time, and each falls apart 8 hours after its creation or when you dismantle it with a touch as a Utilize action.",
    ],
  },
];

const TIEFLING_LEGACY_TRAIT_REFERENCES: CuratedSpeciesTraitReference[] = [
  {
    index: "fiendish-legacy",
    name: "Fiendish Legacy",
    speciesIndex: "tiefling",
    desc: FIENDISH_LEGACY_DESCRIPTION,
  },
  {
    index: "fiendish-legacy-abyssal",
    name: "Fiendish Legacy: Abyssal",
    speciesIndex: "tiefling",
    level: 1,
    desc: [
      "You have Resistance to Poison damage. You also know the Poison Spray cantrip.",
    ],
  },
  {
    index: "fiendish-legacy-chthonic",
    name: "Fiendish Legacy: Chthonic",
    speciesIndex: "tiefling",
    level: 1,
    desc: [
      "You have Resistance to Necrotic damage. You also know the Chill Touch cantrip.",
    ],
  },
  {
    index: "fiendish-legacy-infernal",
    name: "Fiendish Legacy: Infernal",
    speciesIndex: "tiefling",
    level: 1,
    desc: [
      "You have Resistance to Fire damage. You also know the Fire Bolt cantrip.",
    ],
  },
  {
    index: "fiendish-spell-ray-of-sickness",
    name: "Ray of Sickness",
    speciesIndex: "tiefling",
    level: 3,
    desc: ["At character level 3, you learn Ray of Sickness through your Abyssal legacy."],
  },
  {
    index: "fiendish-spell-hold-person",
    name: "Hold Person",
    speciesIndex: "tiefling",
    level: 5,
    desc: ["At character level 5, you learn Hold Person through your Abyssal legacy."],
  },
  {
    index: "fiendish-spell-false-life",
    name: "False Life",
    speciesIndex: "tiefling",
    level: 3,
    desc: ["At character level 3, you learn False Life through your Chthonic legacy."],
  },
  {
    index: "fiendish-spell-ray-of-enfeeblement",
    name: "Ray of Enfeeblement",
    speciesIndex: "tiefling",
    level: 5,
    desc: ["At character level 5, you learn Ray of Enfeeblement through your Chthonic legacy."],
  },
  {
    index: "fiendish-spell-hellish-rebuke",
    name: "Hellish Rebuke",
    speciesIndex: "tiefling",
    level: 3,
    desc: ["At character level 3, you learn Hellish Rebuke through your Infernal legacy."],
  },
  {
    index: "fiendish-spell-darkness",
    name: "Darkness",
    speciesIndex: "tiefling",
    level: 5,
    desc: ["At character level 5, you learn Darkness through your Infernal legacy."],
  },
];

const ELF_LINEAGE_SUBSPECIES_REFERENCES: CuratedSubspeciesReference[] = [
  {
    index: "elven-lineage-drow",
    name: "Elven Lineage: Drow",
    speciesIndex: "elf",
    description:
      "Drow elves gain extended Darkvision and lineage magic tied to shadow and faerie light.",
    traits: [
      { index: "darkvision-120", name: "Darkvision 120 ft.", level: 1 },
      { index: "lineage-spell-dancing-lights", name: "Dancing Lights", level: 1 },
      { index: "lineage-spell-faerie-fire", name: "Faerie Fire", level: 3 },
      { index: "lineage-spell-darkness", name: "Darkness", level: 5 },
    ],
  },
  {
    index: "elven-lineage-high-elf",
    name: "Elven Lineage: High Elf",
    speciesIndex: "elf",
    description:
      "High elves gain flexible arcane cantrip training and additional lineage magic.",
    traits: [
      { index: "high-elf-cantrip-versatility", name: "High Elf Cantrip", level: 1 },
      { index: "lineage-spell-detect-magic", name: "Detect Magic", level: 3 },
      { index: "lineage-spell-misty-step", name: "Misty Step", level: 5 },
    ],
  },
  {
    index: "elven-lineage-wood-elf",
    name: "Elven Lineage: Wood Elf",
    speciesIndex: "elf",
    description:
      "Wood elves move swiftly and gain nature-themed lineage magic.",
    traits: [
      { index: "wood-elf-speed-increase", name: "Wood Elf Speed", level: 1 },
      { index: "lineage-spell-druidcraft", name: "Druidcraft", level: 1 },
      { index: "lineage-spell-longstrider", name: "Longstrider", level: 3 },
      { index: "lineage-spell-pass-without-trace", name: "Pass without Trace", level: 5 },
    ],
  },
];

const GNOMISH_LINEAGE_SUBSPECIES_REFERENCES: CuratedSubspeciesReference[] = [
  {
    index: "gnomish-lineage-forest-gnome",
    name: "Gnomish Lineage: Forest Gnome",
    speciesIndex: "gnome",
    description:
      "Forest gnomes gain illusion magic and magical communication with animals.",
    traits: [
      { index: "gnomish-lineage-forest-gnome", name: "Gnomish Lineage: Forest Gnome", level: 1 },
    ],
  },
  {
    index: "gnomish-lineage-rock-gnome",
    name: "Gnomish Lineage: Rock Gnome",
    speciesIndex: "gnome",
    description:
      "Rock gnomes gain practical minor magic and the ability to craft tiny clockwork devices.",
    traits: [
      { index: "gnomish-lineage-rock-gnome", name: "Gnomish Lineage: Rock Gnome", level: 1 },
    ],
  },
];

const TIEFLING_LEGACY_SUBSPECIES_REFERENCES: CuratedSubspeciesReference[] = [
  {
    index: "fiendish-legacy-abyssal",
    name: "Fiendish Legacy: Abyssal",
    speciesIndex: "tiefling",
    description:
      "Abyssal tieflings gain poison resistance and legacy magic tied to sickness and compulsion.",
    traits: [
      { index: "fiendish-legacy-abyssal", name: "Fiendish Legacy: Abyssal", level: 1 },
      { index: "fiendish-spell-ray-of-sickness", name: "Ray of Sickness", level: 3 },
      { index: "fiendish-spell-hold-person", name: "Hold Person", level: 5 },
    ],
  },
  {
    index: "fiendish-legacy-chthonic",
    name: "Fiendish Legacy: Chthonic",
    speciesIndex: "tiefling",
    description:
      "Chthonic tieflings gain necrotic resistance and grim legacy magic.",
    traits: [
      { index: "fiendish-legacy-chthonic", name: "Fiendish Legacy: Chthonic", level: 1 },
      { index: "fiendish-spell-false-life", name: "False Life", level: 3 },
      { index: "fiendish-spell-ray-of-enfeeblement", name: "Ray of Enfeeblement", level: 5 },
    ],
  },
  {
    index: "fiendish-legacy-infernal",
    name: "Fiendish Legacy: Infernal",
    speciesIndex: "tiefling",
    description:
      "Infernal tieflings gain fire resistance and hellish legacy magic.",
    traits: [
      { index: "fiendish-legacy-infernal", name: "Fiendish Legacy: Infernal", level: 1 },
      { index: "fiendish-spell-hellish-rebuke", name: "Hellish Rebuke", level: 3 },
      { index: "fiendish-spell-darkness", name: "Darkness", level: 5 },
    ],
  },
];

const CURATED_SPECIES_TRAIT_REFERENCES = [
  ...DRAGONBORN_TRAIT_REFERENCES,
  ...ELF_LINEAGE_TRAIT_REFERENCES,
  ...GNOMISH_LINEAGE_TRAIT_REFERENCES,
  ...ORC_TRAIT_REFERENCES,
  ...TIEFLING_LEGACY_TRAIT_REFERENCES,
];

const CURATED_SUBSPECIES_REFERENCES = [
  ...ELF_LINEAGE_SUBSPECIES_REFERENCES,
  ...GNOMISH_LINEAGE_SUBSPECIES_REFERENCES,
  ...TIEFLING_LEGACY_SUBSPECIES_REFERENCES,
];

function createSpeciesTraitRuleDocuments() {
  return CURATED_SPECIES_TRAIT_REFERENCES.map((trait) => ({
    category: "traits",
    index: trait.index,
    name: trait.name,
    sourceJson: {
      desc: trait.desc,
      description: trait.desc.join("\n\n"),
      index: trait.index,
      name: trait.name,
      ...(trait.level ? { level: trait.level } : {}),
      species: [
        {
          index: trait.speciesIndex,
          name: speciesNames[trait.speciesIndex],
          url: `/api/2024/species/${trait.speciesIndex}`,
        },
      ],
      url: `/api/2024/traits/${trait.index}`,
    },
  }));
}

function createSubspeciesRuleDocuments() {
  return CURATED_SUBSPECIES_REFERENCES.map((subspecies) => ({
    category: "subspecies",
    index: subspecies.index,
    name: subspecies.name,
    sourceJson: {
      desc: [subspecies.description],
      description: subspecies.description,
      index: subspecies.index,
      name: subspecies.name,
      species: {
        index: subspecies.speciesIndex,
        name: speciesNames[subspecies.speciesIndex],
        url: `/api/2024/species/${subspecies.speciesIndex}`,
      },
      traits: subspecies.traits.map((trait) => ({
        index: trait.index,
        level: trait.level,
        name: trait.name,
        url: `/api/2024/traits/${trait.index}`,
      })),
      url: `/api/2024/subspecies/${subspecies.index}`,
    },
  }));
}

export {
  CURATED_SPECIES_TRAIT_REFERENCES,
  CURATED_SUBSPECIES_REFERENCES,
  DRAGONBORN_TRAIT_REFERENCES,
  ELF_LINEAGE_SUBSPECIES_REFERENCES,
  ELF_LINEAGE_TRAIT_REFERENCES,
  GNOMISH_LINEAGE_SUBSPECIES_REFERENCES,
  GNOMISH_LINEAGE_TRAIT_REFERENCES,
  ORC_TRAIT_REFERENCES,
  TIEFLING_LEGACY_SUBSPECIES_REFERENCES,
  TIEFLING_LEGACY_TRAIT_REFERENCES,
  createSpeciesTraitRuleDocuments,
  createSubspeciesRuleDocuments,
};
