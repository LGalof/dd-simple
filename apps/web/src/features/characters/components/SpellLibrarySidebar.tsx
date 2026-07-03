import { useMemo, useState } from "react";
import type { CharacterSpellcastingState } from "../../../types/character";
import type { SpellcastingSummary } from "./CharacterSheet";
import {
  findSpellLibraryRecordByName,
  formatSpellLibraryDescription,
  getManagedSpellEntriesForClass,
  getReferenceSpellsForClass,
  getSpellManagementMode,
  type SpellLibraryRecord,
} from "../utils/spellLibrary";

type SpellLibrarySidebarProps = {
  isOpen: boolean;
  selectedClassIndex: string;
  selectedClassName: string;
  spellcastingState: CharacterSpellcastingState;
  spellcastingSummary: SpellcastingSummary | null;
  onSpellcastingStateChange: (state: CharacterSpellcastingState) => void;
};

function SpellLibrarySidebar({
  isOpen,
  selectedClassIndex,
  selectedClassName,
  spellcastingState,
  spellcastingSummary,
  onSpellcastingStateChange,
}: SpellLibrarySidebarProps) {
  const [isAddSpellsOpen, setIsAddSpellsOpen] = useState(true);
  const [isPreparedSpellsOpen, setIsPreparedSpellsOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeLevelFilter, setActiveLevelFilter] = useState<"all" | number>("all");
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>("all");
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  const managementMode = useMemo(
    () => getSpellManagementMode(selectedClassIndex),
    [selectedClassIndex],
  );
  const learnedSpellIds = useMemo(
    () => new Set<string>(spellcastingState.learnedSpellIds ?? []),
    [spellcastingState.learnedSpellIds],
  );
  const preparedSpellIds = useMemo(
    () => new Set<string>(spellcastingState.preparedSpellIds ?? []),
    [spellcastingState.preparedSpellIds],
  );
  const maxSpellLevel = useMemo(() => {
    const slotLevels = spellcastingSummary?.slotLevels ?? [];

    if (slotLevels.length === 0) {
      return 0;
    }

    return slotLevels.reduce((highestLevel, slot) => Math.max(highestLevel, slot.level), 0);
  }, [spellcastingSummary?.slotLevels]);
  const classLibrarySpells = useMemo(
    () => getReferenceSpellsForClass(selectedClassIndex, maxSpellLevel),
    [maxSpellLevel, selectedClassIndex],
  );
  const selectedManagedSpells = useMemo(
    () => getManagedSpellEntriesForClass(selectedClassIndex, spellcastingState),
    [selectedClassIndex, spellcastingState],
  );
  const selectedManagedSpellIds = useMemo(
    () => new Set(selectedManagedSpells.map((entry) => entry.id)),
    [selectedManagedSpells],
  );
  const preparedEntries = useMemo(
    () => selectedManagedSpells.sort(compareManagedSpellEntries),
    [selectedManagedSpells],
  );
  const sourceCategories = useMemo(
    () => [
      "all",
      ...new Set(classLibrarySpells.map((entry) => entry.sourceCategory)),
    ],
    [classLibrarySpells],
  );
  const availableLevelFilters = useMemo(
    () => [
      "all" as const,
      ...new Set(classLibrarySpells.map((entry) => entry.level).sort((left, right) => left - right)),
    ],
    [classLibrarySpells],
  );
  const filteredLibrarySpells = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return classLibrarySpells.filter((entry) => {
      const matchesLevel =
        activeLevelFilter === "all" || entry.level === activeLevelFilter;
      const matchesSource =
        activeSourceFilter === "all" || entry.sourceCategory === activeSourceFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          entry.name,
          entry.description,
          entry.school,
          entry.type,
          entry.range,
          entry.components,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesLevel && matchesSource && matchesSearch;
    });
  }, [activeLevelFilter, activeSourceFilter, classLibrarySpells, searchText]);
  const cantripCount = useMemo(
    () =>
      preparedEntries.filter((entry) => entry.isCantrip).length,
    [preparedEntries],
  );
  const selectedSpellCount = useMemo(
    () => preparedEntries.filter((entry) => !entry.isCantrip).length,
    [preparedEntries],
  );

  function updateSpellSelection(spell: SpellLibraryRecord) {
    const nextLearnedIds = new Set(spellcastingState.learnedSpellIds ?? []);
    const nextPreparedIds = new Set(spellcastingState.preparedSpellIds ?? []);
    const isSelectedAsLearned = nextLearnedIds.has(spell.id);
    const isSelectedAsPrepared = nextPreparedIds.has(spell.id);

    if (spell.level === 0) {
      if (isSelectedAsLearned) {
        nextLearnedIds.delete(spell.id);
      } else {
        nextLearnedIds.add(spell.id);
      }
    } else if (managementMode === "known") {
      if (isSelectedAsLearned) {
        nextLearnedIds.delete(spell.id);
      } else {
        nextLearnedIds.add(spell.id);
      }
    } else if (isSelectedAsPrepared) {
      nextPreparedIds.delete(spell.id);
    } else {
      nextPreparedIds.add(spell.id);
    }

    onSpellcastingStateChange({
      ...spellcastingState,
      learnedSpellIds: [...nextLearnedIds].sort(),
      preparedSpellIds: [...nextPreparedIds].sort(),
    });
  }

  return (
    <aside
      className={
        isOpen
          ? "inventory-side-rail inventory-side-rail-open"
          : "inventory-side-rail inventory-side-rail-closed"
      }
    >
      <section className="inventory-side-placeholder" aria-hidden="true" />
      <section className="inventory-library-panel spells-library-panel" aria-hidden={!isOpen}>
        <div className="spells-library-slot-summary">
          <strong>Spell Slots</strong>
          <div className="spells-library-slot-summary-values">
            {spellcastingSummary?.slotLevels.length ? (
              spellcastingSummary.slotLevels.map((slot) => (
                <span key={slot.level}>
                  <em>{formatSpellLevelPillLabel(slot.level)}</em>
                  <strong>{slot.max}</strong>
                </span>
              ))
            ) : (
              <span className="muted">No spell slots</span>
            )}
          </div>
        </div>

        <div className="spells-library-class-heading">
          <strong>{selectedClassName.toUpperCase()}</strong>
        </div>

        <div className="inventory-library-shell">
          <section className="inventory-library-group">
            <button
              type="button"
              className="spells-library-section-toggle"
              onClick={() => setIsAddSpellsOpen((currentValue) => !currentValue)}
            >
              <strong>Add Spells</strong>
              <span aria-hidden="true">{isAddSpellsOpen ? "^" : "v"}</span>
            </button>

            {isAddSpellsOpen ? (
              <div className="inventory-library-shell">
                <div className="spells-library-copy-grid">
                  <p>Cantrips: {cantripCount}</p>
                  <p>
                    {managementMode === "known" ? "Known Spells" : "Prepared Spells"}: {selectedSpellCount}
                  </p>
                </div>

                <label className="inventory-library-group">
                  <h4>Filter</h4>
                  <div className="inventory-library-search">
                    <span className="inventory-library-search-icon" aria-hidden="true">
                      O
                    </span>
                    <input
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Enter Spell Name"
                    />
                  </div>
                </label>

                <div className="inventory-library-group">
                  <h4>Filter By Spell Level</h4>
                  <div className="inventory-library-chip-grid">
                    {availableLevelFilters.map((filter) => {
                      const isActive = activeLevelFilter === filter;

                      return (
                        <button
                          key={String(filter)}
                          type="button"
                          className={
                            isActive
                              ? "inventory-library-chip inventory-library-chip-active"
                              : "inventory-library-chip"
                          }
                          onClick={() => setActiveLevelFilter(filter)}
                        >
                          {filter === "all" ? "All" : formatSpellLevelPillLabel(filter)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="inventory-library-group">
                  <h4>Filter By Source Category</h4>
                  <div className="inventory-library-chip-grid">
                    {sourceCategories.map((category) => {
                      const isActive = activeSourceFilter === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          className={
                            isActive
                              ? "inventory-library-chip inventory-library-chip-active"
                              : "inventory-library-chip"
                          }
                          onClick={() => setActiveSourceFilter(category)}
                        >
                          {category === "all" ? "All Sources" : category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="inventory-library-results">
                  <div className="inventory-library-results-header">
                    <span>{filteredLibrarySpells.length} results</span>
                  </div>

                  {filteredLibrarySpells.length > 0 ? (
                    <div className="inventory-library-result-list">
                      {filteredLibrarySpells.map((spell) => {
                        const isExpanded = expandedSpellId === spell.id;
                        const actionLabel = getSpellActionLabel(
                          spell,
                          managementMode,
                          learnedSpellIds,
                          preparedSpellIds,
                        );

                        return (
                          <div
                            key={spell.id}
                            className="inventory-library-result-card spells-library-result-card"
                          >
                            <div className="inventory-library-result-main">
                              <button
                                type="button"
                                className="inventory-library-result-toggle"
                                onClick={() =>
                                  setExpandedSpellId((currentValue) =>
                                    currentValue === spell.id ? null : spell.id,
                                  )
                                }
                              >
                                <div className="inventory-library-result-copy">
                                  <strong>{spell.name}</strong>
                                  <span>{formatSpellSidebarLevelLabel(spell.level)}</span>
                                </div>
                                <span className="inventory-library-result-chevron" aria-hidden="true">
                                  {isExpanded ? "^" : "v"}
                                </span>
                              </button>

                              <button
                                type="button"
                                className="inventory-library-add-button"
                                onClick={() => updateSpellSelection(spell)}
                              >
                                {actionLabel}
                              </button>
                            </div>

                            {isExpanded ? (
                              <div className="inventory-library-result-expanded">
                                <p>{formatSpellLibraryDescription(spell) || "No spell description available yet."}</p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="inventory-library-empty-state">
                      No spells match the current filters.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          <section className="inventory-library-group">
            <button
              type="button"
              className="spells-library-section-toggle"
              onClick={() => setIsPreparedSpellsOpen((currentValue) => !currentValue)}
            >
              <strong>
                {managementMode === "known" ? "Known Spells" : "Prepared Spells"} ({preparedEntries.length})
              </strong>
              <span aria-hidden="true">{isPreparedSpellsOpen ? "^" : "v"}</span>
            </button>

            {isPreparedSpellsOpen ? (
              <div className="inventory-library-result-list">
                {preparedEntries.length > 0 ? (
                  preparedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="inventory-library-result-card spells-library-result-card"
                    >
                      <div className="inventory-library-result-main">
                        <div className="inventory-library-result-copy">
                          <strong>{entry.title}</strong>
                          <span>{formatSpellSidebarLevelLabel(entry.spellLevel ?? 0)}</span>
                        </div>
                        <button
                          type="button"
                          className="inventory-library-add-button"
                          onClick={() => {
                            const spellRecord = findSpellLibraryRecordByName(entry.title);

                            updateSpellSelection(
                              spellRecord ?? {
                                castingTime: "",
                                classIndexes: [selectedClassIndex],
                                components: "",
                                description: entry.description,
                                duration: "",
                                higherLevels: "",
                                id: entry.id,
                                level: entry.spellLevel ?? 0,
                                name: entry.title,
                                range: "",
                                ritual: false,
                                school: "",
                                sourceCategory: "5.5E Core Rules",
                                tags: [],
                                type: "",
                              },
                            );
                          }}
                        >
                          {entry.isCantrip || managementMode === "known" ? "Delete" : "Unprepare"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="inventory-library-empty-state">
                    {managementMode === "known"
                      ? "No known spells are currently selected."
                      : "No prepared spells are currently selected."}
                  </p>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </aside>
  );
}

function getSpellActionLabel(
  spell: SpellLibraryRecord,
  managementMode: "known" | "prepared",
  learnedSpellIds: Set<string>,
  preparedSpellIds: Set<string>,
) {
  if (spell.level === 0) {
    return learnedSpellIds.has(spell.id) ? "Delete" : "Learn";
  }

  if (managementMode === "known") {
    return learnedSpellIds.has(spell.id) ? "Delete" : "Learn";
  }

  return preparedSpellIds.has(spell.id) ? "Unprepare" : "Prepare";
}

function formatSpellLevelPillLabel(level: number) {
  if (level === 0) {
    return "-0-";
  }

  return `${level}${getOrdinalSuffix(level)}`;
}

function formatSpellSidebarLevelLabel(level: number) {
  if (level === 0) {
    return "(Cantrip)";
  }

  return `(${level}${getOrdinalSuffix(level)})`;
}

function getOrdinalSuffix(level: number) {
  if (level === 1) {
    return "st";
  }

  if (level === 2) {
    return "nd";
  }

  if (level === 3) {
    return "rd";
  }

  return "th";
}

function compareManagedSpellEntries(
  left: ReturnType<typeof getManagedSpellEntriesForClass>[number],
  right: ReturnType<typeof getManagedSpellEntriesForClass>[number],
) {
  return (left.spellLevel ?? 99) - (right.spellLevel ?? 99) || left.title.localeCompare(right.title);
}

export { SpellLibrarySidebar };
