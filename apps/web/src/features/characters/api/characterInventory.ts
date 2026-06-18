import { api } from "../../../lib/api";
import type { InventoryItem } from "../../../types/character";

type CharacterInventoryResponse = {
  items: InventoryItem[];
};

type CharacterInventorySaveItem = {
  customName?: string | null;
  equipped: boolean;
  equipmentIndex: string;
  gridX?: number | null;
  gridY?: number | null;
  notes?: string | null;
  quantity: number;
};

type CharacterInventoryStateResponse = {
  stateCode: string | null;
  updatedAt: string | null;
};

async function fetchCharacterInventory(characterId: string, token: string) {
  const response = await api.get<CharacterInventoryResponse>(
    `/characters/${characterId}/inventory`,
    { token },
  );

  return response.items;
}

async function fetchCharacterInventoryState(characterId: string, token: string) {
  return api.get<CharacterInventoryStateResponse>(
    `/characters/${characterId}/inventory/state`,
    { token },
  );
}

async function saveCharacterInventory(
  characterId: string,
  items: CharacterInventorySaveItem[],
  token: string,
) {
  const response = await api.put<CharacterInventoryResponse>(
    `/characters/${characterId}/inventory`,
    { items },
    { token },
  );

  return response.items;
}

async function saveCharacterInventoryState(
  characterId: string,
  stateCode: string,
  token: string,
) {
  return api.put<CharacterInventoryStateResponse>(
    `/characters/${characterId}/inventory/state`,
    { stateCode },
    { token },
  );
}

export {
  fetchCharacterInventory,
  fetchCharacterInventoryState,
  saveCharacterInventory,
  saveCharacterInventoryState,
};
export type { CharacterInventorySaveItem };
