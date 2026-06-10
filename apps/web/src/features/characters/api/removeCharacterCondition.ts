import { api } from "../../../lib/api";
import type { Character } from "../../../types/character";

async function removeCharacterCondition(
  characterId: string,
  conditionIndex: string,
  token: string,
) {
  return api.delete<Character>(
    `/characters/${characterId}/conditions/${encodeURIComponent(conditionIndex)}`,
    {
      token,
    },
  );
}

export { removeCharacterCondition };
