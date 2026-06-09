import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createRoomController,
  getRoomController,
  joinRoomController,
} from "../controllers/room.controller.js";

const roomsRouter = Router();

roomsRouter.use(requireAuth);
roomsRouter.post("/rooms", createRoomController);
roomsRouter.post("/rooms/:roomCode/join", joinRoomController);
roomsRouter.get("/rooms/:roomCode", getRoomController);

export { roomsRouter };
