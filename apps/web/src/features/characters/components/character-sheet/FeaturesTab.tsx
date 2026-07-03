import { Card } from "../../../../components/ui/Card";
import type { CharacterResourceState } from "../../../../types/character";
import type { CharacterDerivedSource } from "../../../../types/characterDerived";
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

type SavedFeatureChoiceRow = {
  id: string;
  label: string;
  status: string;
  value: string;
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
  maxUsesValue?: number | null;
  maxUses?: string;
  name: string;
  recharge?: string;
  resourceKey: string;
  sourceFeature: string;
  trackingMode: "none" | "pool" | "uses";
};

type ProgressionChoiceSummary = {
  id: string;
  label: string;
  level: number;
  status: "missing" | "selected";
  value: string;
};

type FeaturesTabProps = {
  backgroundChoiceEntries: BackgroundChoiceEntry[];
  backgroundDescription: string;
  backgroundFeature: string;
  backgroundName: string;
  backgroundSectionEntries: SectionEntry[];
  coreClassFeatureEntries: FeatureCardEntry[];
  formatDerivedSourceSubtitle: (source: CharacterDerivedSource) => string;
  formatFeatureLevel: (level: number) => string;
  onResourceStateChange: (state: CharacterResourceState) => void;
  passiveDerivedSources: CharacterDerivedSource[];
  progressionChoiceSummaries: ProgressionChoiceSummary[];
  resourceState: CharacterResourceState;
  resourceActionSummaries: ResourceActionSummary[];
  savedFeatureChoiceRows: SavedFeatureChoiceRow[];
  selectedHeritage?: SpeciesHeritageOption | null;
  selectedSubclassName?: string | null;
  speciesIdentityEntries: SectionEntry[];
  speciesTraitEntries: SectionEntry[];
  subclassFeatureEntries: FeatureCardEntry[];
};

function FeaturesTab({
  backgroundDescription,
  backgroundFeature,
  backgroundName,
  backgroundSectionEntries,
  coreClassFeatureEntries,
  formatDerivedSourceSubtitle,
  formatFeatureLevel,
  onResourceStateChange,
  passiveDerivedSources,
  resourceState,
  resourceActionSummaries,
  selectedHeritage,
  selectedSubclassName,
  speciesIdentityEntries,
  speciesTraitEntries,
  subclassFeatureEntries,
}: FeaturesTabProps) {
  const uniquePassiveDerivedSources = dedupePassiveDerivedSources(passiveDerivedSources);

  return (
    <div className="character-tab-scroll-stage">
      <div className="workspace-card-grid workspace-card-grid-masonry">
        {coreClassFeatureEntries.length > 0 ? (
          <Card title="Class Features">
            <div className="list">
              {coreClassFeatureEntries.map(({ feature, selections }) => (
                <div key={feature.id} className="character-feature-entry">
                  <strong>{feature.title}</strong>
                  <p className="muted">{formatFeatureLevel(feature.level)}</p>
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

        {subclassFeatureEntries.length > 0 ? (
          <Card title={selectedSubclassName ? `${selectedSubclassName} Features` : "Subclass Features"}>
            <div className="list">
              {subclassFeatureEntries.map(({ feature, selections }) => (
                <div key={feature.id} className="character-feature-entry">
                  <strong>{feature.title}</strong>
                  <p className="muted">
                    {formatFeatureLevel(feature.level)}
                    {selectedSubclassName ? ` - ${selectedSubclassName}` : ""}
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

        <Card title="Species & Heritage">
          <div className="list">
            {selectedHeritage ? (
              <div className="character-feature-entry">
                <strong>{selectedHeritage.name}</strong>
                {selectedHeritage.traits?.length ? (
                  selectedHeritage.traits.map((trait) => (
                    <p key={trait.index}>
                      {trait.name}
                      {trait.description ? ` - ${trait.description}` : ""}
                    </p>
                  ))
                ) : selectedHeritage.damageType && selectedHeritage.damageType !== "Unknown" ? (
                  <p>{selectedHeritage.damageType} ancestry traits are selected.</p>
                ) : null}
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

        <Card title="Passive Effects">
          <div className="list">
            {uniquePassiveDerivedSources.length > 0 ? (
              uniquePassiveDerivedSources.map((source) => (
                <div
                  key={`${source.sourceType}:${source.sourceIndex}`}
                  className="character-feature-entry"
                >
                  <strong>{source.title}</strong>
                  <p className="muted">{formatDerivedSourceSubtitle(source)}</p>
                  <p>{source.description}</p>
                </div>
              ))
            ) : (
              <p className="muted">
                No passive feature descriptions are available for the current build.
              </p>
            )}
          </div>
        </Card>

        {resourceActionSummaries.length > 0 ? (
          <Card title="Resource Tracking">
            <div className="list">
              {resourceActionSummaries.map((resource) => (
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
                  {resource.trackingMode !== "none" ? (
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
                      <button
                        type="button"
                        className="character-inline-button"
                        onClick={() =>
                          onResourceStateChange(resetResourceUsage(resourceState, resource))
                        }
                      >
                        Reset
                      </button>
                    </div>
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

function getResourceMaximum(
  resource: ResourceActionSummary,
  resourceState: CharacterResourceState,
) {
  return (
    resourceState.customMaxByResourceKey[resource.resourceKey] ??
    resource.maxUsesValue ??
    0
  );
}

function getResourceRemaining(
  resource: ResourceActionSummary,
  resourceState: CharacterResourceState,
) {
  const max = getResourceMaximum(resource, resourceState);
  const used = resourceState.usageByResourceKey[resource.resourceKey] ?? 0;
  return Math.max(0, max - used);
}

function updateResourceUsage(
  resourceState: CharacterResourceState,
  resource: ResourceActionSummary,
  delta: number,
) {
  const currentUsage = resourceState.usageByResourceKey[resource.resourceKey] ?? 0;
  const max = getResourceMaximum(resource, resourceState);
  const nextUsage = Math.max(0, Math.min(max, currentUsage + delta));

  return {
    ...resourceState,
    usageByResourceKey: {
      ...resourceState.usageByResourceKey,
      [resource.resourceKey]: nextUsage,
    },
  };
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

function resetResourceUsage(
  resourceState: CharacterResourceState,
  resource: ResourceActionSummary,
) {
  return {
    ...resourceState,
    usageByResourceKey: {
      ...resourceState.usageByResourceKey,
      [resource.resourceKey]: 0,
    },
  };
}

function dedupePassiveDerivedSources(sources: CharacterDerivedSource[]) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    const key = `${source.title}:${source.description}`.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export { FeaturesTab };
