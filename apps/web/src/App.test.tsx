import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

vi.mock("./features/auth/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

vi.mock("./components/routing/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
}));

vi.mock("./pages/AuthPage", () => ({
  AuthPage: ({ mode }: { mode: string }) => <div>Auth:{mode}</div>,
}));

vi.mock("./pages/CharacterDashboardPage", () => ({
  CharacterDashboardPage: () => <div>Dashboard</div>,
}));

vi.mock("./pages/CreateCharacterPage", () => ({
  CreateCharacterPage: () => <div>Create Character</div>,
}));

vi.mock("./pages/MyCharactersPage", () => ({
  MyCharactersPage: () => <div>My Characters</div>,
}));

vi.mock("./pages/TacticalBoardPage", () => ({
  TacticalBoardPage: ({ roomMode }: { roomMode?: boolean }) => (
    <div>Tactical Board:{String(Boolean(roomMode))}</div>
  ),
}));

vi.mock("./pages/CreateRoomPage", () => ({
  CreateRoomPage: () => <div>Create Room</div>,
}));

vi.mock("./pages/JoinRoomPage", () => ({
  JoinRoomPage: () => <div>Join Room</div>,
}));

vi.mock("./pages/MyRoomsPage", () => ({
  MyRoomsPage: () => <div>My Rooms</div>,
}));

async function renderAt(path: string) {
  window.history.pushState({}, "", path);
  render(<App />);
  await screen.findByTestId("auth-provider");
}

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("routes public auth pages and unknown paths", async () => {
    await renderAt("/login");

    expect(await screen.findByText("Auth:login")).toBeTruthy();

    cleanup();
    await renderAt("/register");

    expect(await screen.findByText("Auth:register")).toBeTruthy();

    cleanup();
    await renderAt("/missing");

    await waitFor(() => expect(window.location.pathname).toBe("/register"));
  });

  it("keeps the former Slovenian auth paths as redirects", async () => {
    await renderAt("/prijava");

    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(await screen.findByText("Auth:login")).toBeTruthy();

    cleanup();
    await renderAt("/registracija");

    await waitFor(() => expect(window.location.pathname).toBe("/register"));
    expect(await screen.findByText("Auth:register")).toBeTruthy();
  });

  it("routes protected dashboard, character, room, and board pages", async () => {
    await renderAt("/");
    expect(await screen.findByText("Dashboard")).toBeTruthy();
    expect(screen.getByTestId("protected-route")).toBeTruthy();

    cleanup();
    await renderAt("/characters");
    expect(await screen.findByText("My Characters")).toBeTruthy();

    cleanup();
    await renderAt("/characters/new");
    expect(await screen.findByText("Create Character")).toBeTruthy();

    cleanup();
    await renderAt("/rooms");
    expect(await screen.findByText("My Rooms")).toBeTruthy();

    cleanup();
    await renderAt("/rooms/create");
    expect(await screen.findByText("Create Room")).toBeTruthy();

    cleanup();
    await renderAt("/rooms/join");
    expect(await screen.findByText("Join Room")).toBeTruthy();

    cleanup();
    await renderAt("/room/ABC123");
    expect(await screen.findByText("Tactical Board:true")).toBeTruthy();
  });
});
