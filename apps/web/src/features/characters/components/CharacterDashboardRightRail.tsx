import {
  ConditionsSidebar,
  type ConditionId,
  type ConditionState,
} from "./ConditionsSidebar";
import {
  LocalRollsPanel,
  type LocalRollEntry,
} from "./LocalRollsPanel";
import { SpellLibrarySidebar } from "./SpellLibrarySidebar";
import type { SpellcastingSummary } from "./CharacterSheet";
import type { CharacterSpellcastingState } from "../../../types/character";
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
  onSetExhaustionLevel: (level: number) => void;
  onSpellcastingStateChange: (state: CharacterSpellcastingState) => void;
  onToggleCondition: (conditionId: ConditionId) => void;
  rightRailMode: "conditions" | "inventory" | "spells" | null;
  selectedClassIndex: string;
  selectedClassName: string;
  spellcastingState: CharacterSpellcastingState;
  spellcastingSummary: SpellcastingSummary | null;
};

function CharacterDashboardRightRail({
  conditionState,
  diceRollSaveError,
  inventoryController,
  localRolls,
  onDismissLocalRoll,
  onSetExhaustionLevel,
  onSpellcastingStateChange,
  onToggleCondition,
  rightRailMode,
  selectedClassIndex,
  selectedClassName,
  spellcastingState,
  spellcastingSummary,
}: CharacterDashboardRightRailProps) {
  return (
    <aside className="dashboard-utility-rail">
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
