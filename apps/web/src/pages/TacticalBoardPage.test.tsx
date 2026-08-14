import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { TacticalBoardPage } from "./TacticalBoardPage";

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => ({
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    token: null,
    user: { id: "user-1", email: "dm@example.com", displayName: "DM" },
  }),
}));

vi.mock("../features/rooms/hooks/useRoomSocket", () => ({
  useRoomSocket: () => ({
    advanceTurn: vi.fn(),
    boardState: null,
    boardStateRevision: 0,
    connected: false,
    error: null,
    room: null,
    sendBoardState: vi.fn(),
  }),
}));

function renderBoard() {
  return render(
    <MemoryRouter>
      <TacticalBoardPage />
    </MemoryRouter>,
  );
}

describe("TacticalBoardPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the standalone tactical board with controls and combat log", () => {
    renderBoard();

    expect(screen.getByText("D&D Simple")).toBeTruthy();
    expect(screen.getByText("Prototype board ready.")).toBeTruthy();
    expect(screen.getByDisplayValue("Forest Road")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Move" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Target" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Add Token/i })).toBeTruthy();
  });

  it("switches board tools, updates spell fields, places templates, and adds tokens", () => {
    renderBoard();

    fireEvent.click(screen.getByRole("button", { name: /Target/i }));
    expect(screen.getByText(/Hover or click a square/i)).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("Fireball"), {
      target: { value: "Cone of Cold" },
    });
    fireEvent.change(screen.getByDisplayValue("8d6 fire"), {
      target: { value: "8d8 cold" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Place" }));
    expect(screen.getByText(/Choose a target square/i)).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("New Hero"), {
      target: { value: "Vex" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Token/i }));
    expect(screen.getByText(/Vex added/i)).toBeTruthy();
  });

  it("exports, imports, and resets local board state", () => {
    renderBoard();

    fireEvent.click(screen.getByRole("button", { name: /Export/i }));
    expect(screen.getByText(/Board export code generated/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Reset Board/i }));
    expect(screen.getByText(/Board reset/i)).toBeTruthy();
  });
});
