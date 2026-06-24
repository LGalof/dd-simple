import { api } from "../../../lib/api";
import type { DiceRoll } from "../../../types/character";

type CreateCharacterDiceRollPayload = {
  formula: string;
  modifier: number;
  reason: string | null;
  rollMode: "normal" | "advantage" | "disadvantage";
  rollType: string;
  rollValues: Array<{
    discarded?: boolean;
    sides: number;
    value: number;
  }>;
  targetIndex?: string | null;
  targetType?: string | null;
  total: number;
  visibility: "private" | "public";
};

async function createCharacterDiceRoll(
  characterId: string,
  payload: CreateCharacterDiceRollPayload,
  token: string,
) {
  return api.post<DiceRoll>(
    `/characters/${characterId}/dice-rolls`,
    payload,
    {
      token,
    },
  );
}

export { createCharacterDiceRoll };
export type { CreateCharacterDiceRollPayload };
