import type { BoardToken } from "../types/board";

type TokenControlContext = {
  activeTokenId: string;
  isRoomDm: boolean;
  roomCharacterId: string | null;
  roomMode: boolean;
  ruleOverride: boolean;
};

type BoardEditContext = {
  isRoomDm: boolean;
  roomMode: boolean;
};

export function getTokenControlIssue(token: BoardToken, context: TokenControlContext) {
  if (context.roomMode) {
    if (context.isRoomDm || !context.activeTokenId) {
      return "";
    }

    if (token.id !== context.activeTokenId) {
      return `${token.name} is not the active turn.`;
    }

    if (!context.roomCharacterId || token.characterId !== context.roomCharacterId) {
      return `Only the DM or active player can control ${token.name}.`;
    }

    return "";
  }

  if (context.ruleOverride || !context.activeTokenId || token.id === context.activeTokenId) {
    return "";
  }

  return `${token.name} is not the active turn. Enable DM override to force it.`;
}

export function getDmOnlyBoardActionIssue(context: BoardEditContext, action: string) {
  if (!context.roomMode || context.isRoomDm) {
    return "";
  }

  return `Only the DM can ${action}.`;
}
