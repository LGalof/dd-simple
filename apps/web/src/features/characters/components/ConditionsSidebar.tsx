import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  EarOff,
  EyeOff,
  Ghost,
  Hand,
  HandMetal,
  HeartCrack,
  PersonStanding,
  Skull,
  Sparkles,
  UserRoundX,
} from "lucide-react";

type ConditionId =
  | "blinded"
  | "charmed"
  | "deafened"
  | "frightened"
  | "grappled"
  | "incapacitated"
  | "invisible"
  | "paralyzed"
  | "petrified"
  | "poisoned"
  | "prone"
  | "restrained"
  | "stunned"
  | "unconscious";

type ConditionState = {
  activeConditions: Record<ConditionId, boolean>;
  exhaustionLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

type ConditionSummaryEntry = {
  label: string;
  value: string;
};

type ConditionsSidebarProps = {
  conditionState: ConditionState;
  isOpen: boolean;
  onSetExhaustionLevel: (level: ConditionState["exhaustionLevel"]) => void;
  onToggleCondition: (conditionId: ConditionId) => void;
};

type ConditionDefinition = {
  description: string;
  icon: ReactNode;
  id: ConditionId;
  name: string;
};

const conditionDefinitions: ConditionDefinition[] = [
  {
    id: "blinded",
    name: "Blinded",
    icon: <EyeOff size={16} />,
    description:
      "You can't see, automatically fail sight-based checks, attacks against you have advantage, and your attack rolls have disadvantage.",
  },
  {
    id: "charmed",
    name: "Charmed",
    icon: <Sparkles size={16} />,
    description:
      "You can't attack the charmer or target them with harmful abilities or magical effects, and they have advantage on social checks against you.",
  },
  {
    id: "deafened",
    name: "Deafened",
    icon: <EarOff size={16} />,
    description: "You can't hear and automatically fail hearing-based checks.",
  },
  {
    id: "frightened",
    name: "Frightened",
    icon: <AlertTriangle size={16} />,
    description:
      "While the source of fear is in sight, you have disadvantage on checks and attack rolls, and you can't willingly move closer.",
  },
  {
    id: "grappled",
    name: "Grappled",
    icon: <Hand size={16} />,
    description:
      "Your speed becomes 0, you gain no speed bonuses, and the effect ends if the grappler is incapacitated or you are moved away.",
  },
  {
    id: "incapacitated",
    name: "Incapacitated",
    icon: <Ban size={16} />,
    description: "You can't take actions or reactions.",
  },
  {
    id: "invisible",
    name: "Invisible",
    icon: <Ghost size={16} />,
    description:
      "You can't be seen without magic or a special sense, attacks against you have disadvantage, and your attack rolls have advantage.",
  },
  {
    id: "paralyzed",
    name: "Paralyzed",
    icon: <UserRoundX size={16} />,
    description:
      "You are incapacitated, can't move or speak, fail Strength and Dexterity saves, attacks against you have advantage, and hits within 5 feet are critical.",
  },
  {
    id: "petrified",
    name: "Petrified",
    icon: <Skull size={16} />,
    description:
      "You turn to stone, become incapacitated, can't move or speak, fail Strength and Dexterity saves, attacks against you have advantage, and you gain resistance to all damage.",
  },
  {
    id: "poisoned",
    name: "Poisoned",
    icon: <HeartCrack size={16} />,
    description: "You have disadvantage on attack rolls and ability checks.",
  },
  {
    id: "prone",
    name: "Prone",
    icon: <PersonStanding size={16} />,
    description:
      "Your only movement option is to crawl unless you stand up, you have disadvantage on attack rolls, and nearby attacks against you have advantage.",
  },
  {
    id: "restrained",
    name: "Restrained",
    icon: <HandMetal size={16} />,
    description:
      "Your speed becomes 0, you gain no speed bonuses, attacks against you have advantage, your attack rolls have disadvantage, and you have disadvantage on Dexterity saves.",
  },
  {
    id: "stunned",
    name: "Stunned",
    icon: <Sparkles size={16} />,
    description:
      "You are incapacitated, can't move, speak only falteringly, fail Strength and Dexterity saves, and attacks against you have advantage.",
  },
  {
    id: "unconscious",
    name: "Unconscious",
    icon: <Skull size={16} />,
    description:
      "You are incapacitated, unaware of your surroundings, drop what you're holding, fall prone, fail Strength and Dexterity saves, and nearby hits are critical.",
  },
];

function ConditionsSidebar({
  conditionState,
  isOpen,
  onSetExhaustionLevel,
  onToggleCondition,
}: ConditionsSidebarProps) {
  const [expandedConditionIds, setExpandedConditionIds] = useState<ConditionId[]>([]);

  const activeConditionCount = useMemo(
    () =>
      conditionDefinitions.filter((condition) => conditionState.activeConditions[condition.id]).length +
      (conditionState.exhaustionLevel > 0 ? 1 : 0),
    [conditionState.activeConditions, conditionState.exhaustionLevel],
  );

  function toggleExpanded(conditionId: ConditionId) {
    setExpandedConditionIds((currentIds) =>
      currentIds.includes(conditionId)
        ? currentIds.filter((entryId) => entryId !== conditionId)
        : [...currentIds, conditionId],
    );
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
      <section className="inventory-details-panel inventory-details-panel-rail conditions-side-panel">
        <header className="conditions-side-panel-header">
          <div>
            <h3>Conditions</h3>
            <p>
              {activeConditionCount > 0
                ? `${activeConditionCount} active effect${activeConditionCount === 1 ? "" : "s"}`
                : "Toggle character conditions and exhaustion."}
            </p>
          </div>
        </header>

        <div className="conditions-side-panel-list">
          {conditionDefinitions.map((condition) => {
            const isActive = conditionState.activeConditions[condition.id];
            const isExpanded = expandedConditionIds.includes(condition.id);

            return (
              <article
                key={condition.id}
                className={[
                  "conditions-side-panel-item",
                  isActive ? "conditions-side-panel-item-active" : "",
                  isExpanded ? "conditions-side-panel-item-expanded" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="conditions-side-panel-item-header">
                  <button
                    type="button"
                    className="conditions-side-panel-item-copy"
                    onClick={() => toggleExpanded(condition.id)}
                  >
                    <span className="conditions-side-panel-item-icon">{condition.icon}</span>
                    <span className="conditions-side-panel-item-label">{condition.name}</span>
                  </button>

                  <div className="conditions-side-panel-item-actions">
                    <button
                      type="button"
                      aria-pressed={isActive}
                      className={[
                        "conditions-side-panel-toggle",
                        isActive ? "conditions-side-panel-toggle-active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => onToggleCondition(condition.id)}
                    >
                      <span className="conditions-side-panel-toggle-thumb" />
                    </button>

                    <button
                      type="button"
                      className="conditions-side-panel-expand"
                      aria-label={`Toggle ${condition.name} details`}
                      onClick={() => toggleExpanded(condition.id)}
                    >
                      <ChevronDown
                        size={16}
                        className={
                          isExpanded
                            ? "conditions-side-panel-expand-icon conditions-side-panel-expand-icon-open"
                            : "conditions-side-panel-expand-icon"
                        }
                      />
                    </button>
                  </div>
                </div>

                {isExpanded ? <p>{condition.description}</p> : null}
              </article>
            );
          })}
        </div>

        <section className="conditions-side-panel-exhaustion">
          <div className="conditions-side-panel-item-header">
            <div className="conditions-side-panel-item-copy conditions-side-panel-item-copy-static">
              <span className="conditions-side-panel-item-icon">
                <AlertTriangle size={16} />
              </span>
              <span className="conditions-side-panel-item-label">Exhaustion</span>
            </div>

            <span className="conditions-side-panel-exhaustion-label">
              Level {conditionState.exhaustionLevel > 0 ? conditionState.exhaustionLevel : "--"}
            </span>
          </div>

          <div className="conditions-side-panel-exhaustion-scale">
            <button
              type="button"
              className={
                conditionState.exhaustionLevel === 0
                  ? "conditions-side-panel-level-button conditions-side-panel-level-button-active"
                  : "conditions-side-panel-level-button"
              }
              onClick={() => onSetExhaustionLevel(0)}
            >
              --
            </button>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                type="button"
                className={
                  conditionState.exhaustionLevel === level
                    ? "conditions-side-panel-level-button conditions-side-panel-level-button-active"
                    : "conditions-side-panel-level-button"
                }
                onClick={() => onSetExhaustionLevel(level as ConditionState["exhaustionLevel"])}
              >
                {level}
              </button>
            ))}
          </div>
        </section>
      </section>
    </aside>
  );
}

function createDefaultConditionState(): ConditionState {
  return {
    activeConditions: {
      blinded: false,
      charmed: false,
      deafened: false,
      frightened: false,
      grappled: false,
      incapacitated: false,
      invisible: false,
      paralyzed: false,
      petrified: false,
      poisoned: false,
      prone: false,
      restrained: false,
      stunned: false,
      unconscious: false,
    },
    exhaustionLevel: 0,
  };
}

function getConditionSummaryEntries(conditionState: ConditionState): ConditionSummaryEntry[] {
  const activeConditions = conditionDefinitions
    .filter((condition) => conditionState.activeConditions[condition.id])
    .map((condition) => ({
      label: condition.name,
      value: "Active",
    }));

  if (conditionState.exhaustionLevel > 0) {
    activeConditions.push({
      label: "Exhaustion",
      value: `Level ${conditionState.exhaustionLevel}`,
    });
  }

  return activeConditions;
}

export { ConditionsSidebar, createDefaultConditionState, getConditionSummaryEntries };
export type { ConditionId, ConditionState, ConditionSummaryEntry };
