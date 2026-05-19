import { Link } from "react-router-dom";

function CharactersEmptyState() {
  return (
    <div className="empty-state-card">
      <div className="empty-state-copy">
        <p className="eyebrow">No Characters Yet</p>
        <h2>Create your first adventurer</h2>
        <p className="muted">
          Start a new character to unlock the builder and begin organizing your
          party.
        </p>
      </div>

      <Link to="/characters/new" className="primary-button primary-button-uppercase">
        Create a Character
      </Link>
    </div>
  );
}

export { CharactersEmptyState };
