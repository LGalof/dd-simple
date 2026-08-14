import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Hero } from "./Hero";

describe("Hero", () => {
  afterEach(cleanup);

  it("renders the hero copy", () => {
    render(<Hero eyebrow="Tools" subtitle="Build faster" title="D&D Simple" />);

    expect(screen.getByText("Tools")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "D&D Simple" })).toBeTruthy();
    expect(screen.getByText("Build faster")).toBeTruthy();
  });
});
