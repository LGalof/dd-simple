import { Link } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { StatBox } from "../../../components/ui/StatBox";
import type { Character } from "../../../types/character";
import {
  calculateAbilityModifier,
  calculateInitiative,
  calculatePassivePerception,
  calculateProficiencyBonus,
  calculateSavingThrowBonus,
  calculateSkillBonus,
  formatSignedModifier,
} from "../utils/characterCalculations";
import { formatAlignment } from "../utils/characterFormat";

type CharacterSheetProps = {
  character: Character;
};

const abilityOrder = ["str", "dex", "con", "int", "wis", "cha"];
const skillOrder = [
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

function CharacterSheet({ character }: CharacterSheetProps) {
  const equippedItems = character.inventory.filter((item) => item.equipped);
  const inventoryItems = character.inventory.filter((item) => !item.equipped);
  const characterProficiencyBonus = calculateProficiencyBonus(character.level);
  const dexterityScore = character.abilityScores.find(
    (abilityScore) => abilityScore.abilityIndex === "dex",
  );
  const perceptionSkill = character.skills.find(
    (characterSkill) => characterSkill.skillIndex === "perception",
  );
  const perceptionAbilityScore = character.abilityScores.find(
    (abilityScore) => abilityScore.abilityIndex === perceptionSkill?.skill.ability.index,
  );
  const proficiencyIndexes = character.proficiencies.map(
    (characterProficiency) => characterProficiency.proficiencyIndex,
  );
  const initiativeModifier = calculateInitiative(dexterityScore?.score ?? 10);
  const passivePerception = perceptionSkill
    ? calculatePassivePerception({
        abilityScore: perceptionAbilityScore?.score ?? 10,
        characterLevel: character.level,
        customBonus: perceptionSkill.customBonus,
        isProficient: perceptionSkill.isProficient,
      })
    : 10;
  const sortedAbilityScores = [...character.abilityScores].sort(
    (leftAbility, rightAbility) =>
      abilityOrder.indexOf(leftAbility.abilityIndex) -
      abilityOrder.indexOf(rightAbility.abilityIndex),
  );
  const sortedSkills = [...character.skills].sort(
    (leftSkill, rightSkill) =>
      skillOrder.indexOf(leftSkill.skill.name) -
      skillOrder.indexOf(rightSkill.skill.name),
  );

  return (
    <div className="character-sheet">
      <header className="character-header">
        <div>
          <p className="eyebrow">Demo Character</p>
          <h2>{character.name}</h2>
          <p className="subtitle">
            Level {character.level} {character.species.name} {character.class.name}{" "}
            - {character.background.name}
          </p>
        </div>

        <div className="character-header-actions">
          <Link to="/characters" className="secondary-button">
            Back to Characters
          </Link>
          <Link
            to={`/characters/${character.id}/edit`}
            className="primary-button primary-button-uppercase"
          >
            Edit
          </Link>
        </div>
      </header>

      <div className="stat-grid">
        <StatBox label="Level" value={character.level} />
        <StatBox label="HP" value={`${character.currentHp}/${character.maxHp}`} />
        <StatBox label="AC" value={character.armorClass} />
        <StatBox label="Initiative" value={formatSignedModifier(initiativeModifier)} />
        <StatBox label="Speed" value={`${character.speed} ft`} />
        <StatBox label="Proficiency" value={formatSignedModifier(characterProficiencyBonus)} />
        <StatBox label="Passive Perception" value={passivePerception} />
        <StatBox label="Alignment" value={formatAlignment(character.alignment)} />
      </div>

      <div className="content-grid">
        <Card title="Ability Scores">
          <div className="ability-grid">
            {sortedAbilityScores.map((abilityScore) => {
              const modifier = calculateAbilityModifier(abilityScore.score);
              const savingThrowBonus = calculateSavingThrowBonus({
                abilityIndex: abilityScore.abilityIndex,
                abilityScore: abilityScore.score,
                characterLevel: character.level,
                proficiencyIndexes,
              });
              const isSavingThrowProficient = proficiencyIndexes.includes(
                `saving-throw-${abilityScore.abilityIndex}`,
              );

              return (
                <div key={abilityScore.abilityIndex} className="ability-card">
                  <strong>{abilityScore.ability.name}</strong>
                  <span className="ability-score">{abilityScore.score}</span>
                  <span className="ability-card-detail">
                    Mod {formatSignedModifier(modifier)}
                  </span>
                  {savingThrowBonus !== modifier && (
                    <span className="ability-save">
                      Save {formatSignedModifier(savingThrowBonus)}
                      {isSavingThrowProficient && <span className="tag">Proficient</span>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Skills">
          <div className="list">
            {sortedSkills.map((characterSkill) => {
              const abilityScore = character.abilityScores.find(
                (score) => score.abilityIndex === characterSkill.skill.ability.index,
              );
              const total = calculateSkillBonus({
                abilityScore: abilityScore?.score ?? 10,
                characterLevel: character.level,
                customBonus: characterSkill.customBonus,
                isProficient: characterSkill.isProficient,
              });

              return (
                <div key={characterSkill.skillIndex} className="list-row">
                  <span>
                    {characterSkill.skill.name} {formatSignedModifier(total)}{" "}
                    <span className="muted">({characterSkill.skill.ability.name})</span>
                    {characterSkill.isProficient && (
                      <strong className="tag">Proficient</strong>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Equipped Items">
          <div className="list">
            {equippedItems.length === 0 && <p className="muted">No equipped items.</p>}

            {equippedItems.map((item) => (
              <div key={item.id} className="list-row">
                <span>{item.equipment.name}</span>
                <strong>x{item.quantity}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Inventory">
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
      </div>
    </div>
  );
}

export { CharacterSheet };
