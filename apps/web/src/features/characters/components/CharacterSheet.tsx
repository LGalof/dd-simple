import { Card } from "../../../components/ui/Card";
import { StatBox } from "../../../components/ui/StatBox";
import type { Character } from "../../../types/character";
import { abilityModifier, formatModifier } from "../utils/characterFormat";

type CharacterSheetProps = {
  character: Character;
};

function CharacterSheet({ character }: CharacterSheetProps) {
  const equippedItems = character.inventory.filter((item) => item.equipped);
  const inventoryItems = character.inventory.filter((item) => !item.equipped);

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
      </header>

      <div className="stat-grid">
        <StatBox label="HP" value={`${character.currentHp}/${character.maxHp}`} />
        <StatBox label="AC" value={character.armorClass} />
        <StatBox label="Speed" value={`${character.speed} ft`} />
        <StatBox label="XP" value={character.experiencePoints} />
        <StatBox label="Alignment" value={character.alignment ?? "-"} />
      </div>

      <div className="content-grid">
        <Card title="Ability Scores">
          <div className="ability-grid">
            {character.abilityScores.map((abilityScore) => {
              const modifier = abilityModifier(abilityScore.score);

              return (
                <div key={abilityScore.abilityIndex} className="ability-card">
                  <strong>{abilityScore.ability.name}</strong>
                  <span className="ability-score">{abilityScore.score}</span>
                  <span>{formatModifier(modifier)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Skills">
          <div className="list">
            {character.skills.map((characterSkill) => {
              const abilityScore = character.abilityScores.find(
                (score) => score.abilityIndex === characterSkill.skill.ability.index,
              );
              const baseModifier = abilityScore ? abilityModifier(abilityScore.score) : 0;
              const proficiencyBonus = characterSkill.isProficient ? 2 : 0;
              const total = baseModifier + proficiencyBonus + characterSkill.customBonus;

              return (
                <div key={characterSkill.skillIndex} className="list-row">
                  <span>
                    {characterSkill.skill.name}{" "}
                    <span className="muted">({characterSkill.skill.ability.name})</span>
                    {characterSkill.isProficient && (
                      <strong className="tag">proficient</strong>
                    )}
                  </span>
                  <strong>{formatModifier(total)}</strong>
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
