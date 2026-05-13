import { api } from "../../../lib/api";

async function deleteCharacter(characterId: string) {
  await api.delete(`/characters/${characterId}`);
}

export { deleteCharacter };
