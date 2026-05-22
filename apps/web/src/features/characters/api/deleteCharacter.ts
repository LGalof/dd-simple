import { api } from "../../../lib/api";

async function deleteCharacter(characterId: string, token: string) {
  await api.delete(`/characters/${characterId}`, {
    token,
  });
}

export { deleteCharacter };
