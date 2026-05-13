import { Link } from "react-router-dom";
import type { Character } from "../../../types/character";
import { formatAlignment } from "../utils/characterFormat";

type CharacterSummaryCardProps = {
  character: Character;
  deleting?: boolean;
  onDelete: (character: Character) => void;
};

function CharacterSummaryCard({
  character,
  deleting = false,
  onDelete,
}: CharacterSummaryCardProps) {
  const initials = character.name.slice(0, 1).toUpperCase();
  const speciesName = character.species.name;
  const className = character.class.name;
  const alignment = formatAlignment(character.alignment);

  function rememberSelectedCharacter() {
    localStorage.setItem("lastSelectedCharacterId", character.id);
  }

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
          <p className="character-summary-line">{alignment}</p>
        </div>
      </div>

      <div className="character-summary-stats">
        <span>
          HP <strong>{character.currentHp}/{character.maxHp}</strong>
        </span>
        <span>
          AC <strong>{character.armorClass}</strong>
        </span>
        <span>
          Speed <strong>{character.speed} ft</strong>
        </span>
      </div>

      <div className="character-summary-actions">
        <Link
          to={`/characters/${character.id}`}
          className="secondary-button"
          onClick={rememberSelectedCharacter}
        >
          Open Sheet
        </Link>
        <Link to={`/characters/${character.id}/edit`} className="secondary-button">
          Edit
        </Link>
        <button
          type="button"
          className="secondary-button secondary-button-danger"
          disabled={deleting}
          onClick={() => onDelete(character)}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

export { CharacterSummaryCard };
