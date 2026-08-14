import { useState } from "react";
import { Card } from "../../../../components/ui/Card";
import type { CharacterResourceState } from "../../../../types/character";
import type { SpeciesHeritageOption } from "../../types/characterBuilder";

type DisplaySelection = {
  label: string;
  value: string;
};

type FeatureCardEntry = {
  feature: {
    details?: string[];
    id: string;
    level: number;
    summary: string;
    title: string;
  };
  selections: DisplaySelection[];
};

type SectionEntry = {
  details: string[];
  id: string;
  selections: DisplaySelection[];
  subtitle?: string | null;
  title: string;
};

type BackgroundChoiceEntry = {
  id: string;
  selections: DisplaySelection[];
  title: string;
};

type ResourceActionSummary = {
  automationNote: string;
  category: "action" | "bonus action" | "reaction" | "passive" | "resource";
  id: string;
  level: number | null;
  longRestBehavior?: "empty" | "restore";
  maxUsesValue?: number | null;
  maxUses?: string;
  name: string;
  recharge?: string;
  resourceKey: string;
  sourceFeature: string;
  trackingMode: "none" | "pool" | "uses";
};

type FeaturesTabProps = {
  backgroundChoiceEntries: BackgroundChoiceEntry[];
  backgroundDescription: string;
  backgroundFeature: string;
  backgroundName: string;
  backgroundSectionEntries: SectionEntry[];
  coreClassFeatureEntries: FeatureCardEntry[];
  formatFeatureLevel: (level: number) => string;
  onResourceStateChange: (state: CharacterResourceState) => void;
  resourceState: CharacterResourceState;
  resourceActionSummaries: ResourceActionSummary[];
  selectedHeritage?: SpeciesHeritageOption | null;
  selectedSubclassName?: string | null;
  speciesIdentityEntries: SectionEntry[];
  speciesTraitEntries: SectionEntry[];
  subclassFeatureEntries: FeatureCardEntry[];
};

type FeatureInfoFilter = "all" | "class" | "species" | "background" | "resources";

function FeaturesTab({
  backgroundDescription,
  backgroundFeature,
  backgroundName,
  backgroundSectionEntries,
  coreClassFeatureEntries,
  formatFeatureLevel,
  onResourceStateChange,
  resourceState,
  resourceActionSummaries,
  selectedHeritage,
  selectedSubclassName,
  speciesIdentityEntries,
  speciesTraitEntries,
  subclassFeatureEntries,
}: FeaturesTabProps) {
  const [activeInfoFilter, setActiveInfoFilter] = useState<FeatureInfoFilter>("all");
  const classAndSubclassFeatureEntries = mergeFeatureCardEntries(
    coreClassFeatureEntries,
    subclassFeatureEntries,
    selectedSubclassName,
  );
  const trackedResourceActionSummaries = resourceActionSummaries.filter(
    (resource) => resource.trackingMode !== "none",
  );
  const filters = getFeatureInfoFilters({
    hasBackground: Boolean(backgroundDescription || backgroundSectionEntries.length),
    hasClassFeatures: classAndSubclassFeatureEntries.length > 0,
    hasResources: trackedResourceActionSummaries.length > 0,
    hasSpecies: Boolean(
      selectedHeritage ||
        speciesIdentityEntries.length > 0 ||
        speciesTraitEntries.length > 0,
    ),
  });
  const showClassFeatures = activeInfoFilter === "all" || activeInfoFilter === "class";
  const showSpecies = activeInfoFilter === "all" || activeInfoFilter === "species";
  const showBackground = activeInfoFilter === "all" || activeInfoFilter === "background";
  const showResources = activeInfoFilter === "all" || activeInfoFilter === "resources";

  return (
    <div className="character-tab-scroll-stage">
      <div className="character-action-filter-bar">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={
              activeInfoFilter === filter.id
                ? "character-action-filter-pill character-action-filter-pill-active"
                : "character-action-filter-pill"
            }
            onClick={() => setActiveInfoFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="workspace-card-grid workspace-card-grid-wide">
        {showClassFeatures && classAndSubclassFeatureEntries.length > 0 ? (
          <Card title="Class & Subclass Features">
            <div className="list">
              {classAndSubclassFeatureEntries.map(({ feature, selections, subtitle }) => (
                <div key={feature.id} className="character-feature-entry">
                  <strong>{feature.title}</strong>
                  <p className="muted">
                    {formatFeatureLevel(feature.level)}
                    {subtitle ? ` - ${subtitle}` : ""}
                  </p>
                  <p>{feature.summary}</p>
                  {feature.details?.map((detail) => (
                    <p key={`${feature.id}-${detail}`}>{detail}</p>
                  ))}
                  {selections.length > 0 ? (
                    <div className="list">
                      {selections.map((selection) => (
                        <div
                          key={`${feature.id}-${selection.label}-${selection.value}`}
                          className="list-row"
                        >
                          <span>{selection.label}</span>
                          <strong>{selection.value}</strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {showSpecies ? (
        <Card title="Species & Heritage">
          <div className="list">
            {selectedHeritage ? (
              <div className="character-feature-entry">
                <strong>{selectedHeritage.name}</strong>
                {selectedHeritage.damageType && selectedHeritage.damageType !== "Unknown" ? (
                  <p>{selectedHeritage.damageType} ancestry traits are selected.</p>
                ) : (
                  <p className="muted">Currently unlocked traits from this choice are listed below.</p>
                )}
              </div>
            ) : null}

            {[...speciesIdentityEntries, ...speciesTraitEntries].map((section) => (
              <div key={section.id} className="character-feature-entry">
                <strong>{section.title}</strong>
                {section.subtitle ? <p className="muted">{section.subtitle}</p> : null}
                {section.details.map((detail) => (
                  <p key={`${section.id}-${detail}`}>{detail}</p>
                ))}
                {section.selections.length > 0 ? (
                  <div className="list">
                    {section.selections.map((selection) => (
                      <div
                        key={`${section.id}-${selection.label}-${selection.value}`}
                        className="list-row"
                      >
                        <span>{selection.label}</span>
                        <strong>{selection.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
        ) : null}

        {showBackground ? (
        <Card title="Background Benefits">
          <div className="list">
            <div className="character-feature-entry">
              <strong>{backgroundName}</strong>
              <p>{backgroundDescription}</p>
              <p className="muted">Signature feature: {backgroundFeature}</p>
            </div>

            {backgroundSectionEntries.map((section) => (
              <div key={section.id} className="character-feature-entry">
                <strong>{section.title}</strong>
                {section.subtitle ? <p className="muted">{section.subtitle}</p> : null}
                {section.details.map((detail) => (
                  <p key={`${section.id}-${detail}`}>{detail}</p>
                ))}
                {section.selections.length > 0 ? (
                  <div className="list">
                    {section.selections.map((selection) => (
                      <div
                        key={`${section.id}-${selection.label}-${selection.value}`}
                        className="list-row"
                      >
                        <span>{selection.label}</span>
                        <strong>{selection.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
        ) : null}

        {showResources && trackedResourceActionSummaries.length > 0 ? (
          <Card title="Resource Tracking">
            <div className="list">
              {trackedResourceActionSummaries.map((resource) => (
                <div key={resource.id} className="character-feature-entry">
                  <strong>
                    {resource.name}
                    {resource.level ? ` - Level ${resource.level}` : ""}
                  </strong>
                  <p>
                    {resource.category}
                    {resource.maxUses ? ` - ${resource.maxUses}` : ""}
                    {resource.recharge ? ` - ${resource.recharge}` : ""}
                  </p>
                  {resource.trackingMode === "uses" ? (
                    <div className="feature-resource-strip">
                      <div className="feature-resource-strip-copy">
                        <strong>Uses:</strong>
                        <div
                          className="feature-resource-track"
                          role="group"
                          aria-label={`${resource.name} uses`}
                        >
                          {Array.from(
                            { length: getResourceMaximum(resource, resourceState) },
                            (_, resourceIndex) => {
                              const used =
                                resourceIndex <
                                (resourceState.usageByResourceKey[resource.resourceKey] ?? 0);

                              return (
                                <button
                                  key={`${resource.id}-${resourceIndex}`}
                                  type="button"
                                  className={`feature-resource-dot ${
                                    used ? "feature-resource-dot-used" : ""
                                  }`}
                                  aria-pressed={used}
                                  onClick={() =>
                                    onResourceStateChange(
                                      setResourceUsage(
                                        resourceState,
                                        resource,
                                        used ? resourceIndex : resourceIndex + 1,
                                      ),
                                    )
                                  }
                                >
                                  <span className="sr-only">
                                    {used ? "Restore" : "Use"} {resource.name} use{" "}
                                    {resourceIndex + 1}
                                  </span>
                                </button>
                              );
                            },
                          )}
                        </div>
                        <span className="feature-resource-recharge">
                          / {resource.recharge ?? "Manual"}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {resource.trackingMode === "pool" ? (
                    <ResourcePoolTracker
                      onResourceStateChange={onResourceStateChange}
                      resource={resource}
                      resourceState={resourceState}
                    />
                  ) : null}
                  <p className="muted">Source: {resource.sourceFeature}</p>
                  <p className="muted">{resource.automationNote}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

type ResourcePoolTrackerProps = Readonly<{
  onResourceStateChange: (state: CharacterResourceState) => void;
  resource: ResourceActionSummary;
  resourceState: CharacterResourceState;
}>;

function ResourcePoolTracker({
  onResourceStateChange,
  resource,
  resourceState,
}: ResourcePoolTrackerProps) {
  const maximum = getResourceMaximum(resource, resourceState);
  const used = Math.min(
    maximum,
    Math.max(0, resourceState.usageByResourceKey[resource.resourceKey] ?? 0),
  );
  const current = maximum - used;
  const unit = resource.name.includes("Hit Points") ? "HP" : "remaining";

  function setCurrent(nextCurrent: number) {
    const normalizedCurrent = Math.max(0, Math.min(maximum, Math.floor(nextCurrent)));
    onResourceStateChange(setResourceUsage(resourceState, resource, maximum - normalizedCurrent));
  }

  return (
    <div className="feature-resource-pool" aria-label={`${resource.name} pool`}>
      <div className="feature-resource-pool-summary">
        <span>Current</span>
        <strong>{current}</strong>
        <span>/ {maximum} {unit}</span>
      </div>
      <div className="feature-resource-pool-controls">
        <button
          type="button"
          className="secondary-button"
          disabled={current === 0}
          onClick={() => setCurrent(current - 1)}
          aria-label={`Reduce ${resource.name}`}
        >
          −
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={current === maximum}
          onClick={() => setCurrent(current + 1)}
          aria-label={`Restore ${resource.name}`}
        >
          +
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={current === maximum}
          onClick={() => setCurrent(maximum)}
        >
          Restore full
        </button>
      </div>
    </div>
  );
}

function getFeatureInfoFilters({
  hasBackground,
  hasClassFeatures,
  hasResources,
  hasSpecies,
}: {
  hasBackground: boolean;
  hasClassFeatures: boolean;
  hasResources: boolean;
  hasSpecies: boolean;
}) {
  return [
    { id: "all" as const, label: "All" },
    hasClassFeatures ? { id: "class" as const, label: "Class & Subclass" } : null,
    hasSpecies ? { id: "species" as const, label: "Species & Heritage" } : null,
    hasBackground ? { id: "background" as const, label: "Background" } : null,
    hasResources ? { id: "resources" as const, label: "Resources" } : null,
  ].filter((filter): filter is { id: FeatureInfoFilter; label: string } => Boolean(filter));
}

function mergeFeatureCardEntries(
  classEntries: FeatureCardEntry[],
  subclassEntries: FeatureCardEntry[],
  selectedSubclassName?: string | null,
) {
  return [
    ...classEntries.map((entry) => ({
      ...entry,
      subtitle: null as string | null,
    })),
    ...subclassEntries.map((entry) => ({
      ...entry,
      subtitle: selectedSubclassName ?? "Subclass",
    })),
  ].sort((left, right) => {
    const levelDifference = left.feature.level - right.feature.level;

    if (levelDifference !== 0) {
      return levelDifference;
    }

    return left.feature.title.localeCompare(right.feature.title);
  });
}

function getResourceMaximum(
  resource: ResourceActionSummary,
  resourceState: CharacterResourceState,
) {
  if (isDerivedResourceMaximum(resource)) {
    return normalizeResourceMaximum(resource.maxUsesValue, resource.trackingMode);
  }

  const configuredMaximum =
    resourceState.customMaxByResourceKey[resource.resourceKey] ??
    resource.maxUsesValue;

  return normalizeResourceMaximum(configuredMaximum, resource.trackingMode);
}

function isDerivedResourceMaximum(resource: ResourceActionSummary) {
  const maxUses = resource.maxUses?.toLowerCase() ?? "";

  return (
    typeof resource.maxUsesValue === "number" &&
    (maxUses.includes("modifier") ||
      maxUses.includes("proficiency bonus") ||
      maxUses.includes("class progression") ||
      maxUses.includes("barbarian level") ||
      maxUses.includes("wizard level"))
  );
}

function normalizeResourceMaximum(
  value: number | null | undefined,
  trackingMode: ResourceActionSummary["trackingMode"],
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  return trackingMode === "uses" ? 1 : 0;
}

function setResourceUsage(
  resourceState: CharacterResourceState,
  resource: ResourceActionSummary,
  used: number,
) {
  const max = getResourceMaximum(resource, resourceState);
  const normalizedUsed = Math.max(0, Math.min(max, Math.floor(used)));

  return {
    ...resourceState,
    usageByResourceKey: {
      ...resourceState.usageByResourceKey,
      [resource.resourceKey]: normalizedUsed,
    },
  };
}

export { FeaturesTab };
