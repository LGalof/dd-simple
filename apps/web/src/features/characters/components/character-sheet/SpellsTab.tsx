import type { CharacterSpellEntry } from "../../../../types/characterDerived";

type SpellcastingSummary = {
  abilityLabel: string;
  attackBonus: number;
  castingType: string;
  knownPrepared: Array<{
    label: string;
    value: string;
  }>;
  notes: string[];
  proficiencyBonus: number;
  saveDc: number;
  slotLevels: Array<{
    level: number;
    max: number;
  }>;
  slotsAvailable: boolean;
  slotsUnavailableReason: string;
};

type SpellLevelSection = {
  entries: CharacterSpellEntry[];
  id: string;
  sortLevel: number;
  title: string;
};

type SpellSlotSummary = {
  level: number;
  max: number;
  remaining: number;
  used: number;
};

type SpellsTabProps = {
  activeSpellLevelFilter: "all" | number;
  derivedStateError: string | null;
  derivedStateLoading: boolean;
  filteredSpellFeatureEntries: CharacterSpellEntry[];
  filteredSpellLevelSections: SpellLevelSection[];
  formatModifier: (value: number) => string;
  formatSpellFilterLabel: (level: number) => string;
  formatSpellSlotTitle: (level: number) => string;
  getSpellEntrySubtitle: (entry: CharacterSpellEntry) => string;
  onActiveSpellLevelFilterChange: (filter: "all" | number) => void;
  onOpenSpellLibrary: () => void;
  onSpellSearchTextChange: (value: string) => void;
  onUseSpellSlot: (level: number, max: number) => void;
  onRestoreSpellSlot: (level: number, max: number) => void;
  onSetUsedSpellSlots: (level: number, used: number, max: number) => void;
  spellEntriesForDisplayCount: number;
  spellLevelFilterOptions: Array<"all" | number>;
  spellModifierValue: string;
  spellSearchText: string;
  spellSlotSummary: SpellSlotSummary[];
  spellcastingSummary: SpellcastingSummary | null;
};

function SpellsTab({
  activeSpellLevelFilter,
  derivedStateError,
  derivedStateLoading,
  filteredSpellFeatureEntries,
  filteredSpellLevelSections,
  formatModifier,
  formatSpellFilterLabel,
  formatSpellSlotTitle,
  getSpellEntrySubtitle,
  onActiveSpellLevelFilterChange,
  onOpenSpellLibrary,
  onSpellSearchTextChange,
  onUseSpellSlot,
  onRestoreSpellSlot,
  onSetUsedSpellSlots,
  spellEntriesForDisplayCount,
  spellLevelFilterOptions,
  spellModifierValue,
  spellSearchText,
  spellSlotSummary,
  spellcastingSummary,
}: SpellsTabProps) {
  const spellSectionsByLevel = new Map<number, SpellLevelSection[]>();

  for (const section of filteredSpellLevelSections) {
    const sections = spellSectionsByLevel.get(section.sortLevel) ?? [];
    sections.push(section);
    spellSectionsByLevel.set(section.sortLevel, sections);
  }

  const slottedSpellSectionIds = new Set(
    spellSlotSummary.flatMap((slot) =>
      (spellSectionsByLevel.get(slot.level) ?? []).map((section) => section.id),
    ),
  );
  const cantripSectionIds = new Set(
    (spellSectionsByLevel.get(0) ?? []).map((section) => section.id),
  );
  const freeSpellLevelSections = filteredSpellLevelSections.filter(
    (section) => !slottedSpellSectionIds.has(section.id) && !cantripSectionIds.has(section.id),
  );
  const cantripSections = spellSectionsByLevel.get(0) ?? [];

  return (
    <div className="character-tab-scroll-stage">
      <div className="character-spell-sticky-controls">
        {spellcastingSummary ? (
          <div className="character-spell-summary-bar">
            <div className="character-spell-summary-stat">
              <strong>{spellModifierValue}</strong>
              <span>Modifier</span>
            </div>
            <div className="character-spell-summary-stat">
              <strong>{formatModifier(spellcastingSummary.attackBonus)}</strong>
              <span>Spell Attack</span>
            </div>
            <div className="character-spell-summary-stat">
              <strong>{spellcastingSummary.saveDc}</strong>
              <span>Save DC</span>
            </div>
          </div>
        ) : null}

        <div className="character-spell-toolbar">
          <label className="character-spell-search">
            <span aria-hidden="true">O</span>
            <input
              type="search"
              value={spellSearchText}
              onChange={(event) => onSpellSearchTextChange(event.target.value)}
              placeholder="Search Spell Names, Casting Times, Damage Types, Conditions or Tags"
            />
          </label>

          <button
            type="button"
            className="character-inline-button character-inline-button-strong"
            data-right-rail-trigger
            onClick={onOpenSpellLibrary}
          >
            Manage Spells
          </button>
        </div>

        <div className="character-action-filter-bar">
          {spellLevelFilterOptions.map((filter) => {
            const isActive = activeSpellLevelFilter === filter;

            return (
              <button
                key={String(filter)}
                type="button"
                className={
                  isActive
                    ? "character-action-filter-pill character-action-filter-pill-active"
                    : "character-action-filter-pill"
                }
                onClick={() => onActiveSpellLevelFilterChange(filter)}
              >
                {filter === "all" ? "All" : formatSpellFilterLabel(filter)}
              </button>
            );
          })}
        </div>
      </div>

      {cantripSections.length > 0 ? (
        <div className="character-spell-cantrip-block">
          {cantripSections.map((section) => (
            <SpellLevelSectionCard
              key={section.id}
              getSpellEntrySubtitle={getSpellEntrySubtitle}
              section={section}
            />
          ))}
        </div>
      ) : null}

      {spellcastingSummary?.slotsAvailable ? (
        <div className="character-spell-slot-strip">
          {spellSlotSummary.map((slot) => (
            <div key={slot.level} className="character-spell-slot-strip-row">
              <div className="character-spell-slot-copy">
                <strong>{formatSpellSlotTitle(slot.level)}</strong>
                <span>
                  {slot.remaining}/{slot.max} remaining
                </span>
              </div>
              <div className="character-spell-slot-actions">
                <button
                  type="button"
                  className="character-inline-button"
                  onClick={() => onRestoreSpellSlot(slot.level, slot.max)}
                  disabled={slot.used === 0}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="character-inline-button"
                  onClick={() => onUseSpellSlot(slot.level, slot.max)}
                  disabled={slot.remaining === 0}
                >
                  Use
                </button>
              </div>
              <div
                className="character-spell-slot-track"
                role="group"
                aria-label={`Level ${slot.level} spell slots`}
              >
                {Array.from({ length: slot.max }, (_, slotIndex) => {
                  const isUsed = slotIndex < slot.used;

                  return (
                    <button
                      key={`${slot.level}-${slotIndex}`}
                      type="button"
                      className={`character-spell-slot-dot ${
                        isUsed ? "character-spell-slot-dot-used" : ""
                      }`}
                      aria-pressed={isUsed}
                      onClick={() =>
                        onSetUsedSpellSlots(
                          slot.level,
                          isUsed ? slotIndex : slotIndex + 1,
                          slot.max,
                        )
                      }
                    >
                      <span className="sr-only">
                        {isUsed ? "Restore" : "Use"} level {slot.level} spell slot {slotIndex + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
              {(spellSectionsByLevel.get(slot.level) ?? []).map((section) => (
                <SpellLevelSectionCard
                  key={section.id}
                  getSpellEntrySubtitle={getSpellEntrySubtitle}
                  section={section}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {derivedStateLoading ? <p className="muted">Loading spell features...</p> : null}
      {derivedStateError ? (
        <p className="error-message">Spell data unavailable: {derivedStateError}</p>
      ) : null}
      {!derivedStateLoading && !derivedStateError && spellEntriesForDisplayCount === 0 ? (
        <p className="muted">No normalized spellcasting entries are available yet for this character.</p>
      ) : null}
      {!derivedStateLoading &&
      !derivedStateError &&
      (freeSpellLevelSections.length > 0 || filteredSpellFeatureEntries.length > 0) ? (
        <div className="list">
          {freeSpellLevelSections.map((section) => (
            <SpellLevelSectionCard
              key={section.id}
              getSpellEntrySubtitle={getSpellEntrySubtitle}
              section={section}
            />
          ))}

          {filteredSpellFeatureEntries.length > 0 ? (
            <div className="character-feature-entry">
              <strong>Spell Features</strong>
              <p className="muted">
                Spellcasting features, innate magic, and other supporting rules.
              </p>
              <div className="list">
                {filteredSpellFeatureEntries.map((entry) => (
                  <div key={entry.id} className="character-spell-entry">
                    <div className="character-spell-entry-header">
                      <div className="character-spell-entry-copy">
                        <strong>{entry.title}</strong>
                        <p>{getSpellEntrySubtitle(entry)}</p>
                      </div>
                    </div>
                    <p>{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!derivedStateLoading &&
      !derivedStateError &&
      filteredSpellLevelSections.length === 0 &&
      filteredSpellFeatureEntries.length === 0 &&
      spellEntriesForDisplayCount > 0 ? (
        <p className="muted">No spells match the current search and filter.</p>
      ) : null}
    </div>
  );
}

function SpellLevelSectionCard({
  getSpellEntrySubtitle,
  section,
}: {
  getSpellEntrySubtitle: (entry: CharacterSpellEntry) => string;
  section: SpellLevelSection;
}) {
  return (
    <div className="character-feature-entry">
      <strong>{section.title}</strong>
      <div className="list">
        {section.entries.map((entry) => (
          <div key={entry.id} className="character-spell-entry">
            <div className="character-spell-entry-header">
              <div className="character-spell-entry-copy">
                <strong>{entry.title}</strong>
                <p>{getSpellEntrySubtitle(entry)}</p>
              </div>
            </div>
            <p>{entry.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SpellsTab };
