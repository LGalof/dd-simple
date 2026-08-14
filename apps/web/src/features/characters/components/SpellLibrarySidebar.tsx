import { useMemo, useState } from "react";
import type { CharacterSpellcastingState } from "../../../types/character";
import type { CharacterSpellEntry } from "../../../types/characterDerived";
import type { SpellcastingSummary } from "./CharacterSheet";
import {
  findSpellLibraryRecordByName,
  getManagedSpellEntriesForClass,
  getReferenceSpellsForClass,
  getSpellManagementMode,
  type SpellLibraryRecord,
} from "../utils/spellLibrary";

type SpellLibrarySidebarProps = {
  isOpen: boolean;
  selectedClassIndex: string;
  selectedClassName: string;
  spellEntries: CharacterSpellEntry[];
  spellcastingState: CharacterSpellcastingState;
  spellcastingSummary: SpellcastingSummary | null;
  onSpellcastingStateChange: (state: CharacterSpellcastingState) => void;
};

function SpellLibrarySidebar({
  isOpen,
  selectedClassIndex,
  selectedClassName,
  spellEntries,
  spellcastingState,
  spellcastingSummary,
  onSpellcastingStateChange,
}: SpellLibrarySidebarProps) {
  const [isAddSpellsOpen, setIsAddSpellsOpen] = useState(true);
  const [isPreparedSpellsOpen, setIsPreparedSpellsOpen] = useState(true);
  const [isSpellbookOpen, setIsSpellbookOpen] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeLevelFilter, setActiveLevelFilter] = useState<"all" | number>("all");
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>("all");
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  const managementMode = useMemo(
    () => getSpellManagementMode(selectedClassIndex),
    [selectedClassIndex],
  );
  const isWizardSpellbookMode = managementMode === "known";
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
  const baseClassLibrarySpells = useMemo(
    () => getReferenceSpellsForClass(selectedClassIndex, maxSpellLevel),
    [maxSpellLevel, selectedClassIndex],
  );
  const classLibrarySpells = useMemo(() => {
    const entriesById = new Map(
      baseClassLibrarySpells.map((entry) => [entry.id, entry]),
    );

    for (const entry of spellEntries) {
      if (entry.spellLevel === null || isPlaceholderSpellChoiceTitle(entry.title)) {
        continue;
      }

      const libraryRecord = findSpellLibraryRecordByName(entry.title);

      if (!libraryRecord) {
        continue;
      }

      entriesById.set(libraryRecord.id, libraryRecord);
    }

    return [...entriesById.values()].sort(compareSpellLibraryRecords);
  }, [baseClassLibrarySpells, spellEntries]);
  const selectedManagedSpells = useMemo(
    () => getManagedSpellEntriesForClass(selectedClassIndex, spellcastingState),
    [selectedClassIndex, spellcastingState],
  );
  const spellbookSourceByTitle = useMemo(() => {
    const sources = new Map<string, string>();

    for (const entry of spellEntries) {
      if (entry.spellLevel === null || isPlaceholderSpellChoiceTitle(entry.title)) {
        continue;
      }

      const sourceLabel = formatSpellbookSource(entry.sourceIndex);

      if (sourceLabel) {
        sources.set(entry.title.trim().toLowerCase(), sourceLabel);
      }
    }

    return sources;
  }, [spellEntries]);
  const spellbookEntries = useMemo(
    () =>
      isWizardSpellbookMode
        ? selectedManagedSpells.sort(compareManagedSpellEntries)
        : [],
    [isWizardSpellbookMode, selectedManagedSpells],
  );
  const preparedEntries = useMemo(
    () =>
      selectedManagedSpells
        .filter((entry) =>
          isWizardSpellbookMode
            ? !entry.isCantrip && preparedSpellIds.has(entry.id)
            : true,
        )
        .sort(compareManagedSpellEntries),
    [isWizardSpellbookMode, preparedSpellIds, selectedManagedSpells],
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
      (isWizardSpellbookMode ? spellbookEntries : preparedEntries).filter((entry) => entry.isCantrip).length,
    [isWizardSpellbookMode, preparedEntries, spellbookEntries],
  );
  const cantripLimit = useMemo(
    () =>
      spellcastingSummary?.knownPrepared.find((entry) => entry.label === "Cantrips Known")
        ?.value ?? null,
    [spellcastingSummary],
  );
  const selectedSpellCount = useMemo(
    () => preparedEntries.filter((entry) => !entry.isCantrip).length,
    [preparedEntries],
  );
  const knownLeveledSpellCount = useMemo(
    () => spellbookEntries.filter((entry) => !entry.isCantrip).length,
    [spellbookEntries],
  );
  const preparedSpellLimit = useMemo(
    () => getPreparedSpellLimit(spellcastingSummary),
    [spellcastingSummary],
  );

  function toggleLibrarySpell(spell: SpellLibraryRecord) {
    const nextLearnedIds = new Set(spellcastingState.learnedSpellIds ?? []);
    const nextPreparedIds = new Set(spellcastingState.preparedSpellIds ?? []);
    const isSelectedAsLearned = nextLearnedIds.has(spell.id);
    const isSelectedAsPrepared = nextPreparedIds.has(spell.id);

    if (isWizardSpellbookMode) {
      if (isSelectedAsLearned) {
        nextLearnedIds.delete(spell.id);
        nextPreparedIds.delete(spell.id);
      } else if (
        spell.level !== 0 ||
        cantripLimit === null ||
        cantripCount < Number(cantripLimit)
      ) {
        nextLearnedIds.add(spell.id);
      }
    } else if (spell.level === 0) {
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
      learnedSpellIds: [...nextLearnedIds].sort((left, right) => left.localeCompare(right)),
      preparedSpellIds: [...nextPreparedIds].sort((left, right) => left.localeCompare(right)),
    });
  }

  function toggleWizardPreparedSpell(spellId: string) {
    const nextPreparedIds = new Set(spellcastingState.preparedSpellIds ?? []);

    if (nextPreparedIds.has(spellId)) {
      nextPreparedIds.delete(spellId);
    } else if (preparedSpellLimit === null || nextPreparedIds.size < preparedSpellLimit) {
      nextPreparedIds.add(spellId);
    }

    onSpellcastingStateChange({
      ...spellcastingState,
      preparedSpellIds: [...nextPreparedIds].sort((left, right) => left.localeCompare(right)),
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

        <div
          className={
            isWizardSpellbookMode
              ? "inventory-library-shell spells-library-wizard-shell"
              : "inventory-library-shell"
          }
        >
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
                  <p>
                    Cantrips: {cantripCount}
                    {isWizardSpellbookMode && cantripLimit !== null ? `/${cantripLimit}` : ""}
                  </p>
                  <p>
                    {isWizardSpellbookMode
                      ? `Prepared Spells: ${selectedSpellCount} (${knownLeveledSpellCount} Known)`
                      : `Prepared Spells: ${selectedSpellCount}`}
                  </p>
                </div>

                {isWizardSpellbookMode ? (
                  <p className="muted">
                    {spellbookEntries.length === 0
                      ? "Start by adding Wizard cantrips and level 1 spells to your spellbook, then prepare the spells you want to cast."
                      : "Spellbook entries can be copied here. Prepare spells after a Long Rest; from level 5, Memorize Spell permits one prepared-spell swap after a Short Rest."}
                  </p>
                ) : null}

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
                        const isWizardCantripLimitReached =
                          isWizardSpellbookMode &&
                          spell.level === 0 &&
                          !learnedSpellIds.has(spell.id) &&
                          cantripLimit !== null &&
                          cantripCount >= Number(cantripLimit);

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
                                onClick={() => toggleLibrarySpell(spell)}
                                disabled={isWizardCantripLimitReached}
                              >
                                {isWizardCantripLimitReached ? "Limit reached" : actionLabel}
                              </button>
                            </div>

                            {isExpanded ? (
                              <div className="inventory-library-result-expanded">
                                <SpellLibraryDetail spell={spell} />
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

          <section
            className={
              isWizardSpellbookMode
                ? "inventory-library-group spells-library-prepared-group"
                : "inventory-library-group"
            }
          >
            <button
              type="button"
              className="spells-library-section-toggle"
              onClick={() => setIsPreparedSpellsOpen((currentValue) => !currentValue)}
            >
              <strong>
                Prepared Spells ({preparedEntries.length}
                {isWizardSpellbookMode && preparedSpellLimit !== null
                  ? `/${preparedSpellLimit}`
                  : ""}
                )
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
                            if (isWizardSpellbookMode) {
                              toggleWizardPreparedSpell(entry.id);
                            } else {
                              const spellRecord = findSpellLibraryRecordByName(entry.title);

                              toggleLibrarySpell(
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
                            }
                          }}
                        >
                          {isWizardSpellbookMode ? "Unprepare" : entry.isCantrip ? "Delete" : "Unprepare"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="inventory-library-empty-state">
                    No prepared spells are currently selected.
                  </p>
                )}
              </div>
            ) : null}
          </section>

          {isWizardSpellbookMode ? (
            <section className="inventory-library-group spells-library-spellbook-group">
              <button
                type="button"
                className="spells-library-section-toggle"
                onClick={() => setIsSpellbookOpen((currentValue) => !currentValue)}
              >
                <strong>Spellbook ({spellbookEntries.length})</strong>
                <span aria-hidden="true">{isSpellbookOpen ? "^" : "v"}</span>
              </button>

              {isSpellbookOpen ? (
                <div className="inventory-library-result-list">
                  {spellbookEntries.length > 0 ? (
                    spellbookEntries.map((entry) => {
                      const isPrepared = preparedSpellIds.has(entry.id);
                      const spellRecord = findSpellLibraryRecordByName(entry.title);
                      const sourceLabel =
                        spellbookSourceByTitle.get(entry.title.trim().toLowerCase()) ??
                        "Copied to spellbook";

                      return (
                        <div
                          key={entry.id}
                          className="inventory-library-result-card spells-library-result-card"
                        >
                          <div className="inventory-library-result-main">
                            <div className="inventory-library-result-copy">
                              <strong>{entry.title}</strong>
                              <span>{formatSpellSidebarLevelLabel(entry.spellLevel ?? 0)}</span>
                              <span>{sourceLabel}</span>
                            </div>
                            <div className="spells-library-inline-actions">
                              {!entry.isCantrip ? (
                                <button
                                  type="button"
                                  className="inventory-library-add-button"
                                  onClick={() => toggleWizardPreparedSpell(entry.id)}
                                  disabled={
                                    !isPrepared &&
                                    preparedSpellLimit !== null &&
                                    preparedEntries.length >= preparedSpellLimit
                                  }
                                >
                                  {isPrepared ? "Unprepare" : "Prepare"}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="inventory-library-add-button"
                                onClick={() => {
                                  if (spellRecord) {
                                    toggleLibrarySpell(spellRecord);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="inventory-library-empty-state">
                      No spells are currently written in your spellbook.
                    </p>
                  )}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>
    </aside>
  );
}

function SpellLibraryDetail({ spell }: { spell: SpellLibraryRecord }) {
  const detailRows = [
    ["Casting Time", spell.castingTime],
    ["Range/Area", spell.range],
    ["Components", spell.components],
    ["Duration", spell.duration],
    ["School", spell.school],
  ].filter(([, value]) => value.length > 0);

  return (
    <div className="spells-library-detail">
      <div className="spells-library-detail-heading">
        <strong>{spell.type || formatSpellSidebarLevelLabel(spell.level)}</strong>
        {spell.ritual ? <span>Ritual</span> : null}
      </div>

      {detailRows.length > 0 ? (
        <dl className="spells-library-detail-list">
          {detailRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {spell.description ? (
        <div className="spells-library-detail-copy">
          {spell.description.split(/\n{2,}/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="inventory-library-empty-state">No spell description available yet.</p>
      )}

      {spell.higherLevels ? (
        <div className="spells-library-detail-copy spells-library-detail-higher">
          <p>
            <strong>Using a Higher-Level Spell Slot.</strong> {spell.higherLevels}
          </p>
        </div>
      ) : null}
    </div>
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

function formatSpellbookSource(sourceIndex: string) {
  if (!sourceIndex || sourceIndex.endsWith(":spell-library")) {
    return null;
  }

  if (sourceIndex.startsWith("wizard-spellbook-")) {
    const level = sourceIndex.replace("wizard-spellbook-", "");
    return `Wizard level ${level} spellbook addition`;
  }

  if (sourceIndex.startsWith("wizard-cantrips-")) {
    return "Wizard cantrip choice";
  }

  if (sourceIndex.startsWith("spell-mastery-")) {
    return "Spell Mastery";
  }

  if (sourceIndex === "wizard-signature-spells") {
    return "Signature Spells";
  }

  return sourceIndex
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPreparedSpellLimit(spellcastingSummary: SpellcastingSummary | null) {
  const preparedValue = spellcastingSummary?.knownPrepared.find(
    (entry) => entry.label.toLowerCase().includes("prepared"),
  )?.value;
  const parsedValue = preparedValue ? Number.parseInt(preparedValue, 10) : NaN;

  return Number.isFinite(parsedValue) ? parsedValue : null;
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

function compareSpellLibraryRecords(left: SpellLibraryRecord, right: SpellLibraryRecord) {
  return left.level - right.level || left.name.localeCompare(right.name);
}

function isPlaceholderSpellChoiceTitle(title: string) {
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedTitle === "cantrip" || normalizedTitle === "spell";
}

export { SpellLibrarySidebar };
