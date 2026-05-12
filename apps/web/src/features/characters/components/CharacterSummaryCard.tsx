import type { Character } from "../../../types/character";

type CharacterSummaryCardProps = {
  character: Character;
};

function CharacterSummaryCard({ character }: CharacterSummaryCardProps) {
  const initials = character.name.slice(0, 1).toUpperCase();
  const speciesName = character.species.name;
  const className = character.class.name;

  return (
    <article className="character-summary-card">
      <div className="character-summary-banner">
        <div className="character-summary-avatar" aria-hidden="true">
          {initials}
        </div>

        <div className="character-summary-copy">
          <h2>{character.name}</h2>
          <p className="character-summary-line">
            Level {character.level} | {speciesName} | {className}
          </p>
        </div>
      </div>

      <div className="character-summary-actions">
        <button type="button" className="secondary-button">
          View
        </button>
        <button type="button" className="secondary-button">
          Edit
        </button>
        <button type="button" className="secondary-button secondary-button-danger">
          Delete
        </button>
      </div>
    </article>
  );
}

export { CharacterSummaryCard };
