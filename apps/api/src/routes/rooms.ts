import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createRoomController,
  deleteRoomController,
  getRoomController,
  joinRoomController,
  leaveRoomController,
  listRoomsForUserController,
} from "../controllers/room.controller.js";

const roomsRouter = Router();

roomsRouter.use("/rooms", requireAuth);
roomsRouter.post("/rooms", createRoomController);
roomsRouter.get("/rooms", listRoomsForUserController);
roomsRouter.post("/rooms/:roomCode/join", joinRoomController);
roomsRouter.delete("/rooms/:roomCode/leave", leaveRoomController);
roomsRouter.get("/rooms/:roomCode", getRoomController);
roomsRouter.delete("/rooms/:roomCode", deleteRoomController);

export { roomsRouter };
