import { useEffect, useState } from "react";

type AbilityScore = {
  abilityIndex: string;
  score: number;
  ability: {
    name: string;
    fullName: string;
  };
};

type CharacterSkill = {
  skillIndex: string;
  isProficient: boolean;
  customBonus: number;
  skill: {
    name: string;
    ability: {
      index: string;
      name: string;
    };
  };
};

type InventoryItem = {
  id: string;
  quantity: number;
  equipped: boolean;
  equipment: {
    name: string;
  };
};

type DiceRoll = {
  id: string;
  rollType: string;
  formula: string;
  total: number;
  reason: string | null;
};

type Character = {
  id: string;
  name: string;
  level: number;
  experiencePoints: number;
  alignment: string | null;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;

  species: {
    name: string;
  };

  class: {
    name: string;
  };

  background: {
    name: string;
  };

  abilityScores: AbilityScore[];
  skills: CharacterSkill[];
  inventory: InventoryItem[];
  diceRolls: DiceRoll[];
};

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const response = await fetch("http://localhost:4000/characters");

        if (!response.ok) {
          throw new Error("Failed to load characters");
        }

        const data = (await response.json()) as Character[];
        setCharacters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadCharacters();
  }, []);

  const character = characters[0];
  const equippedItems = character?.inventory.filter((item) => item.equipped) ?? [];
  const inventoryItems = character?.inventory.filter((item) => !item.equipped) ?? [];

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">University Software Project</p>
        <h1>D&amp;D Simple</h1>
        <p className="subtitle">
          Digital toolkit for Dungeons &amp; Dragons sessions
        </p>
      </section>

      <section className="character-section">
        {loading && <p>Loading character...</p>}

        {error && <p className="error-message">Error: {error}</p>}

        {!loading && !error && !character && <p>No characters found.</p>}

        {character && (
          <div className="character-sheet">
            <header className="character-header">
              <div>
                <p className="eyebrow">Demo Character</p>
                <h2>{character.name}</h2>
                <p className="subtitle">
                  Level {character.level} {character.species.name}{" "}
                  {character.class.name} · {character.background.name}
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
                      <div
                        key={abilityScore.abilityIndex}
                        className="ability-card"
                      >
                        <strong>{abilityScore.ability.name}</strong>
                        <span className="ability-score">
                          {abilityScore.score}
                        </span>
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
                      (score) =>
                        score.abilityIndex ===
                        characterSkill.skill.ability.index
                    );

                    const baseModifier = abilityScore
                      ? abilityModifier(abilityScore.score)
                      : 0;

                    const proficiencyBonus = characterSkill.isProficient
                      ? 2
                      : 0;

                    const total =
                      baseModifier +
                      proficiencyBonus +
                      characterSkill.customBonus;

                    return (
                      <div key={characterSkill.skillIndex} className="list-row">
                        <span>
                          {characterSkill.skill.name}{" "}
                          <span className="muted">
                            ({characterSkill.skill.ability.name})
                          </span>
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
                {equippedItems.length === 0 && (
                  <p className="muted">No equipped items.</p>
                )}

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
                {inventoryItems.length === 0 && (
                  <p className="muted">Inventory is empty.</p>
                )}

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
        )}
      </section>
    </main>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="stat-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default App;