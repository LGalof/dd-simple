import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { CharactersEmptyState } from "./CharactersEmptyState";

describe("CharactersEmptyState", () => {
  afterEach(cleanup);

  it("links users to the character creator", () => {
    render(
      <MemoryRouter>
        <CharactersEmptyState />
      </MemoryRouter>,
    );

    expect(screen.getByText("Create your first adventurer")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create a Character" }).getAttribute("href")).toBe(
      "/characters/new",
    );
  });
});
