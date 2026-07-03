export type SharedConditionId =
  | "blinded"
  | "charmed"
  | "deafened"
  | "frightened"
  | "grappled"
  | "incapacitated"
  | "invisible"
  | "paralyzed"
  | "petrified"
  | "poisoned"
  | "prone"
  | "restrained"
  | "stunned"
  | "unconscious";

export type SharedConditionDefinition = {
  description: string;
  id: SharedConditionId;
  name: string;
};

const sharedConditionDefinitions: SharedConditionDefinition[] = [
  {
    id: "blinded",
    name: "Blinded",
    description:
      "You can't see, automatically fail sight-based checks, attacks against you have advantage, and your attack rolls have disadvantage.",
  },
  {
    id: "charmed",
    name: "Charmed",
    description:
      "You can't attack the charmer or target them with harmful abilities or magical effects, and they have advantage on social checks against you.",
  },
  {
    id: "deafened",
    name: "Deafened",
    description: "You can't hear and automatically fail hearing-based checks.",
  },
  {
    id: "frightened",
    name: "Frightened",
    description:
      "While the source of fear is in sight, you have disadvantage on checks and attack rolls, and you can't willingly move closer.",
  },
  {
    id: "grappled",
    name: "Grappled",
    description:
      "Your speed becomes 0, you gain no speed bonuses, and the effect ends if the grappler is incapacitated or you are moved away.",
  },
  {
    id: "incapacitated",
    name: "Incapacitated",
    description: "You can't take actions or reactions.",
  },
  {
    id: "invisible",
    name: "Invisible",
    description:
      "You can't be seen without magic or a special sense, attacks against you have disadvantage, and your attack rolls have advantage.",
  },
  {
    id: "paralyzed",
    name: "Paralyzed",
    description:
      "You are incapacitated, can't move or speak, fail Strength and Dexterity saves, attacks against you have advantage, and hits within 5 feet are critical.",
  },
  {
    id: "petrified",
    name: "Petrified",
    description:
      "You turn to stone, become incapacitated, can't move or speak, fail Strength and Dexterity saves, attacks against you have advantage, and you gain resistance to all damage.",
  },
  {
    id: "poisoned",
    name: "Poisoned",
    description: "You have disadvantage on attack rolls and ability checks.",
  },
  {
    id: "prone",
    name: "Prone",
    description:
      "Your only movement option is to crawl unless you stand up, you have disadvantage on attack rolls, and nearby attacks against you have advantage.",
  },
  {
    id: "restrained",
    name: "Restrained",
    description:
      "Your speed becomes 0, you gain no speed bonuses, attacks against you have advantage, your attack rolls have disadvantage, and you have disadvantage on Dexterity saves.",
  },
  {
    id: "stunned",
    name: "Stunned",
    description:
      "You are incapacitated, can't move, speak only falteringly, fail Strength and Dexterity saves, and attacks against you have advantage.",
  },
  {
    id: "unconscious",
    name: "Unconscious",
    description:
      "You are incapacitated, unaware of your surroundings, drop what you're holding, fall prone, fail Strength and Dexterity saves, and nearby hits are critical.",
  },
];

export { sharedConditionDefinitions };
