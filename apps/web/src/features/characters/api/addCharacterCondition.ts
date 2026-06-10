import { api } from "../../../lib/api";
import type { Character } from "../../../types/character";

async function addCharacterCondition(
  characterId: string,
  conditionIndex: string,
  token: string,
) {
  return api.post<Character>(
    `/characters/${characterId}/conditions`,
    {
      conditionIndex,
    },
    {
      token,
    },
  );
}

export { addCharacterCondition };
