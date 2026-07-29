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

export { CharacterDashboardRightRail };
