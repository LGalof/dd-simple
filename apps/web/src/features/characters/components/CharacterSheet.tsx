import { useMemo, useState } from "react";
import { Card } from "../../../components/ui/Card";
import type { Character } from "../../../types/character";
import { abilityModifier, formatModifier } from "../utils/characterFormat";

type CharacterSheetProps = {
  character: Character;
};

type AbilityIndex = "str" | "dex" | "con" | "int" | "wis" | "cha";
type WorkspaceTab =
  | "actions"
  | "spells"
  | "inventory"
  | "features"
  | "background"
  | "notes"
  | "extras";

type SkillWithTotal = {
  ability: string;
  isProficient: boolean;
  name: string;
  total: number;
};

const abilityOrder: AbilityIndex[] = ["str", "dex", "con", "int", "wis", "cha"];

function CharacterSheet({ character }: CharacterSheetProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("actions");
  const equippedItems = character.inventory.filter((item) => item.equipped);
  const inventoryItems = character.inventory.filter((item) => !item.equipped);
  const sortedAbilityScores = useMemo(
    () =>
      [...character.abilityScores].sort(
        (left, right) =>
          abilityOrder.indexOf(left.abilityIndex as AbilityIndex) -
          abilityOrder.indexOf(right.abilityIndex as AbilityIndex),
      ),
    [character.abilityScores],
  );
  const abilityScoreMap = useMemo(
    () =>
      new Map(
        sortedAbilityScores.map((abilityScore) => [abilityScore.abilityIndex, abilityScore]),
      ),
    [sortedAbilityScores],
  );
  const dexterityScore = abilityScoreMap.get("dex")?.score ?? 10;
  const strengthScore = abilityScoreMap.get("str")?.score ?? 10;
  const constitutionScore = abilityScoreMap.get("con")?.score ?? 10;
  const wisdomScore = abilityScoreMap.get("wis")?.score ?? 10;
  const dexterityModifier = abilityModifier(dexterityScore);
  const strengthModifier = abilityModifier(strengthScore);
  const constitutionModifier = abilityModifier(constitutionScore);
  const wisdomModifier = abilityModifier(wisdomScore);
  const proficiencyBonus =
    character.level <= 4
      ? 2
      : character.level <= 8
        ? 3
        : character.level <= 12
          ? 4
          : character.level <= 16
            ? 5
            : 6;
  const skillTotals = useMemo(
    () =>
      character.skills.map((characterSkill) => {
        const abilityScore = abilityScoreMap.get(characterSkill.skill.ability.index);
        const baseModifier = abilityScore ? abilityModifier(abilityScore.score) : 0;
        const proficiencyModifier = characterSkill.isProficient ? proficiencyBonus : 0;

        return {
          ability: characterSkill.skill.ability.index.toUpperCase(),
          isProficient: characterSkill.isProficient,
          name: characterSkill.skill.name,
          total: baseModifier + proficiencyModifier + characterSkill.customBonus,
        };
      }),
    [abilityScoreMap, character.skills, proficiencyBonus],
  );
  const sizeLabel = useMemo(() => getCreatureSize(character.species.name), [character.species.name]);
  const saveProficiencies = getSavingThrowProficiencies(character.class.name);
  const savingThrows = sortedAbilityScores.map((abilityScore) => {
    const modifier = abilityModifier(abilityScore.score);
    const hasSaveProficiency = saveProficiencies.includes(abilityScore.abilityIndex as AbilityIndex);

    return {
      shortLabel: abilityScore.ability.name,
      total: modifier + (hasSaveProficiency ? proficiencyBonus : 0),
    };
  });
  const defenseSummary = [
    {
      label: "Fortitude",
      value: formatModifier(constitutionModifier + proficiencyBonus),
    },
    {
      label: "Reflex",
      value: formatModifier(dexterityModifier + proficiencyBonus),
    },
    {
      label: "Will",
      value: formatModifier(wisdomModifier + proficiencyBonus),
    },
  ];
  const passiveStats = [
    { label: "Passive Perception", value: 10 + getSkillTotal(skillTotals, "Perception") },
    { label: "Passive Investigation", value: 10 + getSkillTotal(skillTotals, "Investigation") },
    { label: "Passive Insight", value: 10 + getSkillTotal(skillTotals, "Insight") },
  ];
  const training = getTrainingProfile(
    character.class.name,
    character.background.name,
    character.species.name,
  );
  const weaponActions = getWeaponActions(
    equippedItems,
    dexterityModifier,
    strengthModifier,
    proficiencyBonus,
  );
  const featureHighlights = getFeatureHighlights(
    character.class.name,
    character.background.name,
    character.species.name,
    character.level,
  );
  const workspaceTabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: "actions", label: "Actions" },
    { id: "spells", label: "Spells" },
    { id: "inventory", label: "Inventory" },
    { id: "features", label: "Features & Traits" },
    { id: "background", label: "Background" },
    { id: "notes", label: "Notes" },
    { id: "extras", label: "Extras" },
  ];

  return (
    <div className="character-sheet character-sheet-reference">
      <section className="character-dashboard-toolbar">
        <div className="character-dashboard-summary-row">
          <div className="character-dashboard-summary-chip">
            <span>Level</span>
            <strong>{character.level}</strong>
          </div>
          <div className="character-dashboard-summary-chip">
            <span>XP</span>
            <strong>{character.experiencePoints}</strong>
          </div>
          <div className="character-dashboard-summary-chip character-dashboard-summary-chip-name">
            <span>Character Name</span>
            <strong>{character.name}</strong>
          </div>
        </div>

        <div className="character-dashboard-toolbar-actions">
          <button type="button" className="character-hit-points-action">
            Rest
          </button>
          <button type="button" className="character-hit-points-action">
            Add Condition
          </button>
          <button
            type="button"
            className="character-hit-points-action character-hit-points-action-muted"
          >
            Add Custom Buff
          </button>
        </div>
      </section>

      <section className="character-dashboard-top-grid">
        <div className="character-primary-stats">
          <div className="character-primary-ability-grid">
            {sortedAbilityScores.map((abilityScore) => (
              <div key={abilityScore.abilityIndex} className="character-primary-stat-card">
                <span>{abilityScore.ability.fullName ?? abilityScore.ability.name}</span>
                <strong>{formatModifier(abilityModifier(abilityScore.score))}</strong>
                <em>{abilityScore.score}</em>
              </div>
            ))}
          </div>

          <div className="character-primary-utility-grid">
            <div className="character-primary-metric-card">
              <span>Proficiency</span>
              <strong>{formatModifier(proficiencyBonus)}</strong>
              <em>Bonus</em>
            </div>

            <div className="character-primary-metric-card">
              <span>Walking</span>
              <strong>{character.speed} ft</strong>
              <em>Speed</em>
            </div>

            <div className="character-primary-metric-card">
              <span>Heroic</span>
              <strong>Ready</strong>
              <em>Inspiration</em>
            </div>
          </div>
        </div>

        <div className="character-hit-points-panel">
          <div className="character-hit-points-actions">
            <button type="button" className="character-hit-points-action">
              Heal
            </button>
            <button type="button" className="character-hit-points-action">
              Damage
            </button>
          </div>

          <div className="character-hit-points-metrics">
            <div className="character-hit-points-stat">
              <span>Current</span>
              <strong>{character.currentHp}</strong>
            </div>
            <div className="character-hit-points-separator">/</div>
            <div className="character-hit-points-stat">
              <span>Max</span>
              <strong>{character.maxHp}</strong>
            </div>
            <div className="character-hit-points-stat character-hit-points-stat-muted">
              <span>Temp</span>
              <strong>--</strong>
            </div>
          </div>

          <div className="character-hit-points-footer">Hit Points</div>
        </div>
      </section>

      <section className="character-dashboard-main-grid">
        <aside className="character-dashboard-left-stack">
          <section className="character-reference-card">
            <div className="character-reference-card-header">
              <h3>Saving Throws</h3>
            </div>

            <div className="character-saving-throw-grid">
              {savingThrows.map((savingThrow) => (
                <div key={savingThrow.shortLabel} className="character-save-pill">
                  <span>{savingThrow.shortLabel}</span>
                  <strong>{formatModifier(savingThrow.total)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="character-reference-card">
            <div className="character-reference-card-header">
              <h3>Senses</h3>
            </div>

            <div className="character-passive-list">
              {passiveStats.map((stat) => (
                <div key={stat.label} className="character-passive-row">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            <p className="character-reference-note">{training.senses}</p>
          </section>

          <section className="character-reference-card">
            <div className="character-reference-card-header">
              <h3>Proficiencies &amp; Training</h3>
            </div>

            <div className="character-training-stack">
              <TrainingBlock label="Armor" values={training.armor} />
              <TrainingBlock label="Weapons" values={training.weapons} />
              <TrainingBlock label="Tools" values={training.tools} />
              <TrainingBlock label="Languages" values={training.languages} />
            </div>
          </section>
        </aside>

        <section className="character-skills-board">
          <div className="character-skills-board-header">
            <span>Prof</span>
            <span>Mod</span>
            <h3>Skill</h3>
            <span>Bonus</span>
          </div>

          <div className="character-skills-table">
            {skillTotals.map((skill) => (
              <div key={skill.name} className="character-skill-table-row">
                <span
                  className={
                    skill.isProficient
                      ? "character-skill-marker character-skill-marker-active"
                      : "character-skill-marker"
                  }
                />
                <em>{skill.ability}</em>
                <span className="character-skill-name">{skill.name}</span>
                <strong className="character-skill-bonus-pill">{formatModifier(skill.total)}</strong>
              </div>
            ))}
          </div>

          <div className="character-skills-board-footer">Additional Skills</div>
        </section>

        <section className="character-main-workspace">
          <div className="character-main-status-grid">
            <div className="character-status-badge">
              <span>Initiative</span>
              <strong>{formatModifier(dexterityModifier)}</strong>
            </div>

            <div className="character-status-badge">
              <span>Armor Class</span>
              <strong>{character.armorClass}</strong>
            </div>

            <div className="character-status-panel">
              <h3>Defenses</h3>
              <div className="character-status-list">
                {defenseSummary.map((entry) => (
                  <div key={entry.label} className="character-status-row">
                    <span>{entry.label}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="character-status-panel">
              <h3>Conditions</h3>
              <p className="muted">
                {character.alignment ? `${character.alignment} focus` : "No active conditions"}
              </p>
            </div>
          </div>

          <section className="character-workspace-panel character-workspace-panel-reference">
            <div className="character-tab-bar character-tab-bar-reference">
              {workspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={
                    activeTab === tab.id
                      ? "character-tab-button character-tab-button-active"
                      : "character-tab-button"
                  }
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="character-tab-panel character-tab-panel-reference">
              {activeTab === "actions" && (
                <div className="character-actions-stage">
                  <div className="character-action-filter-bar">
                    {["All", "Attack", "Action", "Bonus", "Reaction", "Other"].map((filter) => (
                      <span
                        key={filter}
                        className={
                          filter === "All"
                            ? "character-action-filter-pill character-action-filter-pill-active"
                            : "character-action-filter-pill"
                        }
                      >
                        {filter}
                      </span>
                    ))}
                  </div>

                  <div className="character-actions-meta">
                    <span>Actions · Attacks per Action: 1</span>
                    <button type="button" className="character-inline-button">
                      Manage Custom
                    </button>
                  </div>

                  <div className="character-actions-table">
                    <div className="character-actions-table-header">
                      <span>Attack</span>
                      <span>Range</span>
                      <span>Hit / DC</span>
                      <span>Damage</span>
                      <span>Notes</span>
                    </div>

                    {weaponActions.map((action) => (
                      <div key={action.name} className="character-actions-table-row">
                        <div className="character-actions-cell character-actions-cell-main">
                          <strong>{action.name}</strong>
                          <em>{action.type}</em>
                        </div>
                        <span>{action.range}</span>
                        <strong>{action.hit}</strong>
                        <strong>{action.damage}</strong>
                        <span>{action.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "spells" && (
                <Card title="Spells">
                  <p className="muted">
                    Spell management will live here later. This area is reserved for spell slots,
                    prepared spells, and casting references.
                  </p>
                </Card>
              )}

              {activeTab === "inventory" && (
                <div className="character-inventory-stage">
                  <Card title="Inventory List">
                    <div className="list">
                      {inventoryItems.length === 0 && <p className="muted">Inventory is empty.</p>}

                      {inventoryItems.map((item) => (
                        <div key={item.id} className="list-row">
                          <span>{item.equipment.name}</span>
                          <strong>x{item.quantity}</strong>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="character-grid-placeholder">
                    <div className="character-grid-placeholder-copy">
                      <strong>Inventory Grid Workspace</strong>
                      <p>
                        This reserved area is sized for the future drag-and-drop inventory grid.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "features" && (
                <div className="workspace-card-grid">
                  <Card title="Class Features">
                    <div className="list">
                      {featureHighlights.map((highlight) => (
                        <div key={highlight.title} className="character-feature-entry">
                          <strong>{highlight.title}</strong>
                          <p>{highlight.description}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Origin">
                    <div className="list">
                      <div className="list-row">
                        <span>Species</span>
                        <strong>{character.species.name}</strong>
                      </div>
                      <div className="list-row">
                        <span>Class</span>
                        <strong>{character.class.name}</strong>
                      </div>
                      <div className="list-row">
                        <span>Background</span>
                        <strong>{character.background.name}</strong>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "background" && (
                <div className="workspace-card-grid">
                  <Card title="Character Profile">
                    <div className="list">
                      <div className="list-row">
                        <span>Name</span>
                        <strong>{character.name}</strong>
                      </div>
                      <div className="list-row">
                        <span>Alignment</span>
                        <strong>{character.alignment ?? "Unaligned"}</strong>
                      </div>
                      <div className="list-row">
                        <span>Size</span>
                        <strong>{sizeLabel}</strong>
                      </div>
                    </div>
                  </Card>

                  <Card title="Background Hooks">
                    <p className="muted">
                      {character.background.name} informs tool access, social flavor, and quest
                      hooks. This panel is reserved for deeper campaign-facing notes later on.
                    </p>
                  </Card>
                </div>
              )}

              {activeTab === "notes" && (
                <Card title="Notes">
                  <p className="muted">
                    Use this area later for session notes, encounter reminders, and party plans.
                  </p>
                </Card>
              )}

              {activeTab === "extras" && (
                <div className="workspace-card-grid">
                  <Card title="Recent Dice Rolls">
                    <div className="list">
                      {character.diceRolls.map((roll) => (
                        <div key={roll.id} className="list-row">
                          <span>
                            {roll.reason ?? roll.rollType}{" "}
                            <span className="muted">({roll.formula})</span>
                          </span>
                          <strong>{roll.total}</strong>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Quick Summary">
                    <div className="list">
                      <div className="list-row">
                        <span>Speed</span>
                        <strong>{character.speed} ft</strong>
                      </div>
                      <div className="list-row">
                        <span>Proficiency</span>
                        <strong>{formatModifier(proficiencyBonus)}</strong>
                      </div>
                      <div className="list-row">
                        <span>Hit Points</span>
                        <strong>
                          {character.currentHp}/{character.maxHp}
                        </strong>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
    </div>
  );
}

type TrainingBlockProps = {
  label: string;
  values: string[];
};

function TrainingBlock({ label, values }: TrainingBlockProps) {
  return (
    <div className="character-training-block">
      <span>{label}</span>
      <p>{values.join(", ")}</p>
    </div>
  );
}

function getCreatureSize(speciesName: string) {
  switch (speciesName.toLowerCase()) {
    case "halfling":
      return "Small";
    case "dwarf":
    case "human":
    case "elf":
    case "tiefling":
    default:
      return "Medium";
  }
}

function getSavingThrowProficiencies(className: string): AbilityIndex[] {
  switch (className.toLowerCase()) {
    case "fighter":
      return ["str", "con"];
    case "rogue":
      return ["dex", "int"];
    case "wizard":
      return ["int", "wis"];
    case "cleric":
      return ["wis", "cha"];
    case "ranger":
      return ["str", "dex"];
    case "bard":
      return ["dex", "cha"];
    default:
      return ["str", "dex"];
  }
}

function getSkillTotal(skills: SkillWithTotal[], name: string) {
  return skills.find((skill) => skill.name === name)?.total ?? 0;
}

function getTrainingProfile(className: string, backgroundName: string, speciesName: string) {
  const classKey = className.toLowerCase();
  const backgroundKey = backgroundName.toLowerCase();
  const speciesKey = speciesName.toLowerCase();

  const armor =
    classKey === "fighter"
      ? ["All Armor", "Shields"]
      : classKey === "cleric"
        ? ["Light Armor", "Medium Armor", "Shields"]
        : classKey === "ranger"
          ? ["Light Armor", "Medium Armor", "Shields"]
          : ["Light Armor"];
  const weapons =
    classKey === "fighter"
      ? ["Simple Weapons", "Martial Weapons"]
      : classKey === "rogue"
        ? ["Simple Weapons", "Hand Crossbows", "Rapiers", "Shortswords"]
        : classKey === "wizard"
          ? ["Daggers", "Darts", "Slings", "Quarterstaffs"]
          : ["Simple Weapons"];
  const tools =
    backgroundKey === "criminal"
      ? ["Thieves' Tools", "Gaming Set"]
      : backgroundKey === "sage"
        ? ["Calligrapher's Supplies"]
        : backgroundKey === "soldier"
          ? ["Gaming Set", "Vehicles (Land)"]
          : ["Artisan's Tools"];
  const languages =
    speciesKey === "elf"
      ? ["Common", "Elvish"]
      : speciesKey === "dwarf"
        ? ["Common", "Dwarvish"]
        : speciesKey === "tiefling"
          ? ["Common", "Infernal"]
          : ["Common", "One Bonus Language"];
  const senses =
    speciesKey === "elf" || speciesKey === "dwarf" || speciesKey === "tiefling"
      ? "Darkvision 60 ft."
      : "Standard vision";

  return { armor, languages, senses, tools, weapons };
}

function getWeaponActions(
  equippedItems: Character["inventory"],
  dexterityModifier: number,
  strengthModifier: number,
  proficiencyBonus: number,
) {
  const attackItems = equippedItems.filter((item) => isAttackItem(item.equipment.name));
  const actions = attackItems.map((item) => {
    const profile = getAttackProfile(
      item.equipment.name,
      dexterityModifier,
      strengthModifier,
      proficiencyBonus,
    );

    return {
      damage: profile.damage,
      hit: formatModifier(profile.attackBonus),
      name: item.equipment.name,
      notes: profile.notes,
      range: profile.range,
      type: profile.type,
    };
  });

  if (actions.length > 0) {
    return actions;
  }

  return [
    {
      damage: `1 + ${Math.max(1, strengthModifier)}`,
      hit: formatModifier(strengthModifier + proficiencyBonus),
      name: "Unarmed Strike",
      notes: "Melee",
      range: "5 ft.",
      type: "Melee Attack",
    },
  ];
}

function isAttackItem(name: string) {
  const normalizedName = name.toLowerCase();

  return ["dagger", "sword", "bow", "staff", "mace", "axe", "crossbow", "sling"].some((keyword) =>
    normalizedName.includes(keyword),
  );
}

function getAttackProfile(
  itemName: string,
  dexterityModifier: number,
  strengthModifier: number,
  proficiencyBonus: number,
) {
  const normalizedName = itemName.toLowerCase();

  if (normalizedName.includes("shortbow") || normalizedName.includes("longbow")) {
    return {
      attackBonus: dexterityModifier + proficiencyBonus,
      damage: `1d6 ${formatInlineModifier(dexterityModifier)}`,
      notes: "Ranged weapon",
      range: "80/320 ft.",
      type: "Ranged Attack",
    };
  }

  if (normalizedName.includes("dagger")) {
    return {
      attackBonus: dexterityModifier + proficiencyBonus,
      damage: `1d4 ${formatInlineModifier(dexterityModifier)}`,
      notes: "Finesse, light, thrown",
      range: "20/60 ft.",
      type: "Melee / Thrown",
    };
  }

  if (normalizedName.includes("rapier") || normalizedName.includes("shortsword")) {
    return {
      attackBonus: dexterityModifier + proficiencyBonus,
      damage: `1d8 ${formatInlineModifier(dexterityModifier)}`,
      notes: "Finesse",
      range: "5 ft.",
      type: "Melee Attack",
    };
  }

  return {
    attackBonus: strengthModifier + proficiencyBonus,
    damage: `1d6 ${formatInlineModifier(strengthModifier)}`,
    notes: "Weapon attack",
    range: "5 ft.",
    type: "Melee Attack",
  };
}

function formatInlineModifier(value: number) {
  return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

function getFeatureHighlights(
  className: string,
  backgroundName: string,
  speciesName: string,
  level: number,
) {
  const classKey = className.toLowerCase();
  const backgroundKey = backgroundName.toLowerCase();
  const speciesKey = speciesName.toLowerCase();
  const entries = [];

  if (classKey === "rogue") {
    entries.push({
      description:
        "Deliver extra damage once per turn when you have advantage or an allied threat nearby.",
      title: `Sneak Attack ${Math.max(1, Math.ceil(level / 2))}d6`,
    });
    entries.push({
      description: "Dash, Disengage, or Hide as a bonus action to reposition safely.",
      title: "Cunning Action",
    });
  } else if (classKey === "fighter") {
    entries.push({
      description: "Take one additional action on your turn when the moment matters most.",
      title: "Action Surge",
    });
    entries.push({
      description: "Recover a small burst of hit points as a bonus action.",
      title: "Second Wind",
    });
  } else {
    entries.push({
      description: "Core class features will appear here as the rules layer expands.",
      title: `${className} Core Features`,
    });
  }

  entries.push({
    description: `${backgroundName} informs roleplay hooks, tool access, and narrative context.`,
    title: `${backgroundName} Background`,
  });

  entries.push({
    description:
      speciesKey === "elf" || speciesKey === "dwarf" || speciesKey === "tiefling"
        ? `${speciesName} grants ancestry flavor and a distinct exploration edge.`
        : `${speciesName} grants flexible ancestry flavor for this build.`,
    title: `${speciesName} Heritage`,
  });

  return entries;
}

export { CharacterSheet };
