import { useMemo, useState } from "react";

type InventoryLibrarySidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type InventoryLibraryItem = {
  id: string;
  isCommon: boolean;
  isContainer: boolean;
  isMagical: boolean;
  isProficient: boolean;
  name: string;
  type:
    | "armor"
    | "other-gear"
    | "potion"
    | "ring"
    | "rod"
    | "scroll"
    | "staff"
    | "wand"
    | "weapon"
    | "wondrous";
};

const inventoryTypes = [
  { label: "Armor", value: "armor" },
  { label: "Potion", value: "potion" },
  { label: "Ring", value: "ring" },
  { label: "Rod", value: "rod" },
  { label: "Scroll", value: "scroll" },
  { label: "Staff", value: "staff" },
  { label: "Wand", value: "wand" },
  { label: "Weapon", value: "weapon" },
  { label: "Wondrous", value: "wondrous" },
  { label: "Other Gear", value: "other-gear" },
] as const;

const inventoryCatalog: InventoryLibraryItem[] = [
  {
    id: "longsword",
    isCommon: true,
    isContainer: false,
    isMagical: false,
    isProficient: true,
    name: "Longsword",
    type: "weapon",
  },
  {
    id: "shortbow",
    isCommon: true,
    isContainer: false,
    isMagical: false,
    isProficient: true,
    name: "Shortbow",
    type: "weapon",
  },
  {
    id: "leather-armor",
    isCommon: true,
    isContainer: false,
    isMagical: false,
    isProficient: true,
    name: "Leather Armor",
    type: "armor",
  },
  {
    id: "healing-potion",
    isCommon: true,
    isContainer: false,
    isMagical: true,
    isProficient: false,
    name: "Potion of Healing",
    type: "potion",
  },
  {
    id: "rope",
    isCommon: true,
    isContainer: false,
    isMagical: false,
    isProficient: false,
    name: "Silk Rope",
    type: "other-gear",
  },
  {
    id: "backpack",
    isCommon: true,
    isContainer: true,
    isMagical: false,
    isProficient: false,
    name: "Backpack",
    type: "other-gear",
  },
  {
    id: "wand-magic-missiles",
    isCommon: false,
    isContainer: false,
    isMagical: true,
    isProficient: false,
    name: "Wand of Magic Missiles",
    type: "wand",
  },
  {
    id: "ring-protection",
    isCommon: false,
    isContainer: false,
    isMagical: true,
    isProficient: false,
    name: "Ring of Protection",
    type: "ring",
  },
];

function InventoryLibrarySidebar({ isOpen, onClose }: InventoryLibrarySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<string>("weapon");
  const [filters, setFilters] = useState({
    common: false,
    container: false,
    magical: false,
    proficient: false,
  });

  const visibleItems = useMemo(() => {
    return inventoryCatalog.filter((item) => {
      if (activeType && item.type !== activeType) {
        return false;
      }

      if (filters.proficient && !item.isProficient) {
        return false;
      }

      if (filters.common && !item.isCommon) {
        return false;
      }

      if (filters.magical && !item.isMagical) {
        return false;
      }

      if (filters.container && !item.isContainer) {
        return false;
      }

      if (!searchQuery.trim()) {
        return true;
      }

      return item.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    });
  }, [activeType, filters, searchQuery]);

  function toggleFlag(flag: keyof typeof filters) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [flag]: !currentFilters[flag],
    }));
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

      <section
        className="inventory-library-panel"
        aria-hidden={!isOpen}
      >
          <div className="inventory-library-header">
            <div>
              <h3>Filter</h3>
              <p>Browse and narrow down inventory items before adding them.</p>
            </div>

            <button type="button" className="inventory-library-close" onClick={onClose}>
              Close
            </button>
          </div>

          <label className="inventory-library-search">
            <span className="inventory-library-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Weapon, Longsword, Vorpal Longsword, etc."
            />
          </label>

          <div className="inventory-library-group">
            <h4>Filter By Type</h4>
            <div className="inventory-library-chip-grid">
              {inventoryTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={
                    activeType === type.value
                      ? "inventory-library-chip inventory-library-chip-active"
                      : "inventory-library-chip"
                  }
                  onClick={() => setActiveType(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="inventory-library-checkbox-row">
            <label className="inventory-library-checkbox">
              <input
                type="checkbox"
                checked={filters.proficient}
                onChange={() => toggleFlag("proficient")}
              />
              <span>Proficient</span>
            </label>

            <label className="inventory-library-checkbox">
              <input
                type="checkbox"
                checked={filters.common}
                onChange={() => toggleFlag("common")}
              />
              <span>Common</span>
            </label>

            <label className="inventory-library-checkbox">
              <input
                type="checkbox"
                checked={filters.magical}
                onChange={() => toggleFlag("magical")}
              />
              <span>Magical</span>
            </label>

            <label className="inventory-library-checkbox">
              <input
                type="checkbox"
                checked={filters.container}
                onChange={() => toggleFlag("container")}
              />
              <span>Container</span>
            </label>
          </div>

          <div className="inventory-library-results">
            <div className="inventory-library-results-header">
              <strong>Matching Items</strong>
              <span>{visibleItems.length}</span>
            </div>

            <div className="inventory-library-result-list">
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="inventory-library-result"
                  onClick={() => void 0}
                >
                  <strong>{item.name}</strong>
                  <span>{inventoryTypes.find((type) => type.value === item.type)?.label}</span>
                </button>
              ))}

              {visibleItems.length === 0 && (
                <div className="inventory-library-empty-state">
                  No items match the current search and filter combination.
                </div>
              )}
            </div>
          </div>
        </section>
    </aside>
  );
}

export { InventoryLibrarySidebar };
