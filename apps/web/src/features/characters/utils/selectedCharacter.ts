const SELECTED_CHARACTER_STORAGE_KEY = "dd-simple:lastSelectedCharacterId";

function getSelectedCharacterId() {
  return localStorage.getItem(SELECTED_CHARACTER_STORAGE_KEY);
}

function setSelectedCharacterId(characterId: string) {
  localStorage.setItem(SELECTED_CHARACTER_STORAGE_KEY, characterId);
}

function clearSelectedCharacterId(characterId?: string) {
  const selectedCharacterId = getSelectedCharacterId();

  if (!characterId || selectedCharacterId === characterId) {
    localStorage.removeItem(SELECTED_CHARACTER_STORAGE_KEY);
  }
}

export {
  clearSelectedCharacterId,
  getSelectedCharacterId,
  setSelectedCharacterId,
};
