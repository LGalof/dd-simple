import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createRoomController,
  getRoomController,
  joinRoomController,
  listRoomsForUserController,
} from "../controllers/room.controller.js";

const roomsRouter = Router();

roomsRouter.use("/rooms", requireAuth);
roomsRouter.post("/rooms", createRoomController);
roomsRouter.get("/rooms", listRoomsForUserController);
roomsRouter.post("/rooms/:roomCode/join", joinRoomController);
roomsRouter.get("/rooms/:roomCode", getRoomController);

export { roomsRouter };
