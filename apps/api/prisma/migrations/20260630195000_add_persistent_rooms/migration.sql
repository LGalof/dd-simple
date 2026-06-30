CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "creatorUserId" UUID NOT NULL,
    "creatorCharacterId" UUID NOT NULL,
    "boardState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "room_players" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "characterName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_players_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");
CREATE UNIQUE INDEX "room_players_roomId_userId_characterId_key" ON "room_players"("roomId", "userId", "characterId");

ALTER TABLE "rooms" ADD CONSTRAINT "rooms_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_creatorCharacterId_fkey" FOREIGN KEY ("creatorCharacterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
