import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatBox } from "./StatBox";

describe("StatBox", () => {
  afterEach(cleanup);

  it("renders a label and numeric value", () => {
    render(<StatBox label="Armor Class" value={17} />);

    expect(screen.getByText("Armor Class")).toBeTruthy();
    expect(screen.getByText("17")).toBeTruthy();
  });
});
