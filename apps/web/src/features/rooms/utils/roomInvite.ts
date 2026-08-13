function buildRoomInviteUrl(roomCode: string, origin = window.location.origin) {
  const url = new URL("/rooms/join", origin);
  url.searchParams.set("roomCode", roomCode.trim().toUpperCase());
  return url.toString();
}

async function copyRoomInviteUrl(roomCode: string) {
  const inviteUrl = buildRoomInviteUrl(roomCode);
  await navigator.clipboard.writeText(inviteUrl);
  return inviteUrl;
}

export { buildRoomInviteUrl, copyRoomInviteUrl };
