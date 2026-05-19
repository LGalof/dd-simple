const SELECTED_CHARACTER_STORAGE_KEY = "dd-simple.selectedCharacterId";

function getSelectedCharacterId() {
  return window.localStorage.getItem(SELECTED_CHARACTER_STORAGE_KEY);
}

function setSelectedCharacterId(characterId: string) {
  window.localStorage.setItem(SELECTED_CHARACTER_STORAGE_KEY, characterId);
}

function clearSelectedCharacterId(characterId?: string) {
  const selectedCharacterId = getSelectedCharacterId();

  if (!characterId || selectedCharacterId === characterId) {
    window.localStorage.removeItem(SELECTED_CHARACTER_STORAGE_KEY);
  }
}

export {
  clearSelectedCharacterId,
  getSelectedCharacterId,
  setSelectedCharacterId,
};
