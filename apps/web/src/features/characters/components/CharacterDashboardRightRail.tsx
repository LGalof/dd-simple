import { useState } from "react";
import {
  ConditionsSidebar,
  type ConditionId,
  type ConditionState,
} from "./ConditionsSidebar";
import {
  LocalRollsPanel,
  type LocalRollEntry,
} from "./LocalRollsPanel";
import { ManualDiceRoller } from "./ManualDiceRoller";
import type { RollableResult } from "./Rollable";
import { SpellLibrarySidebar } from "./SpellLibrarySidebar";
import type { SpellcastingSummary } from "./CharacterSheet";
import type { CharacterSpellcastingState } from "../../../types/character";
import type { CharacterSpellEntry } from "../../../types/characterDerived";
import {
  findSpellLibraryRecordByName,
  type SpellLibraryRecord,
} from "../utils/spellLibrary";
import {
  InventoryDetailsSidebar,
  type InventorySandboxController,
} from "../../../pages/InventorySandboxPage";

type CharacterDashboardRightRailProps = {
  conditionState: ConditionState;
  diceRollSaveError: string | null;
  inventoryController: InventorySandboxController;
  localRolls: LocalRollEntry[];
  onDismissLocalRoll: (id: string) => void;
  onManualRoll: (result: RollableResult) => void;
  onSetExhaustionLevel: (level: number) => void;
  onSpellcastingStateChange: (state: CharacterSpellcastingState) => void;
  onToggleCondition: (conditionId: ConditionId) => void;
  rightRailMode: "conditions" | "inventory" | "spells" | null;
  selectedSpellEntry: CharacterSpellEntry | null;
  selectedClassIndex: string;
  selectedClassName: string;
  spellEntries: CharacterSpellEntry[];
  spellcastingState: CharacterSpellcastingState;
  spellcastingSummary: SpellcastingSummary | null;
};

function CharacterDashboardRightRail({
  conditionState,
  diceRollSaveError,
  inventoryController,
  localRolls,
  onDismissLocalRoll,
  onManualRoll,
  onSetExhaustionLevel,
  onSpellcastingStateChange,
  onToggleCondition,
  rightRailMode,
  selectedSpellEntry,
  selectedClassIndex,
  selectedClassName,
  spellEntries,
  spellcastingState,
  spellcastingSummary,
}: CharacterDashboardRightRailProps) {
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);

  return (
    <aside className="dashboard-utility-rail">
      <div className="manual-dice-roller-toggle-shell">
        <button
          type="button"
          className={
            isDiceRollerOpen
              ? "manual-dice-roller-toggle manual-dice-roller-toggle-active"
              : "manual-dice-roller-toggle"
          }
          aria-expanded={isDiceRollerOpen}
          aria-controls="manual-dice-roller-panel"
          onClick={() => setIsDiceRollerOpen((currentValue) => !currentValue)}
        >
          <span>Dice Roller</span>
          <strong>{isDiceRollerOpen ? "Close" : "Open"}</strong>
        </button>

        {isDiceRollerOpen ? (
          <div id="manual-dice-roller-panel">
            <ManualDiceRoller onRoll={onManualRoll} />
          </div>
        ) : null}
      </div>

      {localRolls.length > 0 ? (
        <LocalRollsPanel
          rolls={localRolls}
          onDismiss={onDismissLocalRoll}
          syncMessage={diceRollSaveError}
        />
      ) : null}

      {rightRailMode === "conditions" ? (
        <ConditionsSidebar
          conditionState={conditionState}
          isOpen
          onSetExhaustionLevel={onSetExhaustionLevel}
          onToggleCondition={onToggleCondition}
        />
      ) : rightRailMode === "spells" && selectedSpellEntry ? (
        <SpellDetailSidebar
          className={selectedClassName}
          entry={selectedSpellEntry}
          spellcastingSummary={spellcastingSummary}
        />
      ) : rightRailMode === "spells" ? (
        <SpellLibrarySidebar
          isOpen
          onSpellcastingStateChange={onSpellcastingStateChange}
          selectedClassIndex={selectedClassIndex}
          selectedClassName={selectedClassName}
          spellEntries={spellEntries}
          spellcastingState={spellcastingState}
          spellcastingSummary={spellcastingSummary}
        />
      ) : (
        <InventoryDetailsSidebar
          controller={inventoryController}
          isOpen={rightRailMode === "inventory"}
        />
      )}
    </aside>
  );
}

function SpellDetailSidebar({
  className,
  entry,
  spellcastingSummary,
}: {
  className: string;
  entry: CharacterSpellEntry;
  spellcastingSummary: SpellcastingSummary | null;
}) {
  const spellRecord = findSpellLibraryRecordByName(entry.title);
  const description = spellRecord?.description ?? stripSpellMetaLines(entry.description);
  const higherLevels = spellRecord?.higherLevels ?? extractMetaLine(entry.description, "At Higher Levels");
  const castingTime = spellRecord?.castingTime ?? extractMetaLine(entry.description, "Casting Time");
  const range = spellRecord?.range ?? extractMetaLine(entry.description, "Range");
  const components = spellRecord?.components ?? extractMetaLine(entry.description, "Components");
  const duration = spellRecord?.duration ?? extractMetaLine(entry.description, "Duration");
  const levelLabel = getSpellDetailLevelLabel(entry, spellRecord);
  const hitDcLabel = getSpellDetailHitDcLabel(description, spellcastingSummary);

  return (
    <section className="spell-detail-sidebar" aria-label={`${entry.title} spell details`}>
      <div className="spell-detail-sidebar-source">{className}</div>
      <header className="spell-detail-sidebar-header">
        <div>
          <p>{levelLabel}</p>
          <h2>{entry.title}</h2>
        </div>
        {entry.preparationMode ? (
          <span className="spell-detail-sidebar-mode">
            {formatPreparationMode(entry.preparationMode)}
          </span>
        ) : null}
      </header>

      <dl className="spell-detail-sidebar-stats">
        <div>
          <dt>Casting Time</dt>
          <dd>{castingTime || "--"}</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>{range || "--"}</dd>
        </div>
        <div>
          <dt>Hit / DC</dt>
          <dd>{hitDcLabel}</dd>
        </div>
        <div>
          <dt>Components</dt>
          <dd>{components || "--"}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{duration || "--"}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{entry.sourceType.replace("_", " ")}</dd>
        </div>
      </dl>

      <div className="spell-detail-sidebar-description">
        {splitDescriptionParagraphs(description).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {higherLevels ? (
          <p>
            <strong>At Higher Levels.</strong> {higherLevels.replace(/^At Higher Levels:\s*/i, "")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function getSpellDetailLevelLabel(
  entry: CharacterSpellEntry,
  spellRecord: SpellLibraryRecord | null,
) {
  const level = spellRecord?.level ?? entry.spellLevel;
  const school = spellRecord?.school;

  if (level === 0) {
    return ["Cantrip", school].filter(Boolean).join(" / ");
  }

  if (typeof level === "number") {
    return [`${formatOrdinal(level)} Level`, school].filter(Boolean).join(" / ");
  }

  return "Spell";
}

function getSpellDetailHitDcLabel(
  description: string,
  spellcastingSummary: SpellcastingSummary | null,
) {
  if (!spellcastingSummary) {
    return "--";
  }

  const saveMatch = description.match(
    /\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+saving throw\b/i,
  );

  if (saveMatch?.[1]) {
    return `${saveMatch[1].slice(0, 3).toUpperCase()} ${spellcastingSummary.saveDc}`;
  }

  if (/spell attack/i.test(description)) {
    return formatSignedModifier(spellcastingSummary.attackBonus);
  }

  return "--";
}

function extractMetaLine(description: string, label: string) {
  const match = description.match(new RegExp(`${label}:\\s*([^|\\n]+)`, "i"));

  return match?.[1]?.trim() ?? "";
}

function stripSpellMetaLines(description: string) {
  return description
    .split(/\n{2,}/)
    .filter((paragraph) => !/Casting Time:|Range:|Components:|Duration:/i.test(paragraph))
    .join("\n\n")
    .trim();
}

function splitDescriptionParagraphs(description: string) {
  return description
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function formatPreparationMode(mode: CharacterSpellEntry["preparationMode"]) {
  return mode.replace("_", " ");
}

function formatOrdinal(level: number) {
  if (level === 1) {
    return "1st";
  }

  if (level === 2) {
    return "2nd";
  }

  if (level === 3) {
    return "3rd";
  }

  return `${level}th`;
}

function formatSignedModifier(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

export { CharacterDashboardRightRail };
