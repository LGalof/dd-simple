import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { CreateCharacterInput, UpdateCharacterInput } from "./character.types.js";

async function getAllCharacters() {
  return prisma.character.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getCharacterById(id: string) {
  return prisma.character.findUnique({
    where: { id },
  });
}

async function createCharacter(data: CreateCharacterInput) {
  return prisma.character.create({
    data,
  });
}

async function updateCharacter(id: string, data: UpdateCharacterInput) {
  return prisma.character.update({
    where: { id },
    data,
  });
}

async function deleteCharacter(id: string) {
  return prisma.character.delete({
    where: { id },
  });
}

function isPrismaNotFoundError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

function isPrismaForeignKeyError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}

export {
  createCharacter,
  deleteCharacter,
  getAllCharacters,
  getCharacterById,
  isPrismaForeignKeyError,
  isPrismaNotFoundError,
  updateCharacter,
};

