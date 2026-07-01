import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Character, CharacterSavePayload } from "../../../types/character";
import {
  dashboardAutosaveDelayMs,
  useDashboardAutosave,
  type DashboardAutosaveSaveOptions,
} from "./useDashboardAutosave";

type SaveCharacter = (
  characterId: string,
  payload: CharacterSavePayload,
  options: DashboardAutosaveSaveOptions,
) => Promise<Character>;

function AutosaveHarness({
  characterId = "character-1",
  getSavedPayload,
  onSaved,
  payload,
  saveCharacter,
}: {
  characterId?: string | null;
  getSavedPayload?: (
    character: Character,
    requestPayload: CharacterSavePayload,
  ) => CharacterSavePayload | null;
  onSaved: (character: Character) => void;
  payload: CharacterSavePayload | null;
  saveCharacter: SaveCharacter;
}) {
  const autosave = useDashboardAutosave({
    characterId,
    getSavedPayload,
    onSaved,
    payload,
    saveCharacter,
  });

  return (
    <div>
      <button type="button" onClick={() => void autosave.flushSave("manual")}>
        Retry save
      </button>
      <span data-testid="status">{autosave.saveStatus}</span>
      <span data-testid="error">{autosave.saveError ?? ""}</span>
    </div>
  );
}

function createPayload(currentHp: number): CharacterSavePayload {
  return {
    abilityScores: {
      cha: 10,
      con: 10,
      dex: 10,
      int: 10,
      str: 10,
      wis: 10,
    },
    alignment: null,
    backgroundIndex: "acolyte",
    choices: [],
    classIndex: "fighter",
    currentHp,
    featureChoices: [],
    hitPointState: {
      bonusHp: 0,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: [10],
      tempHp: 0,
    },
    level: 1,
    name: "Autosave Test",
    skillIndexes: [],
    speciesIndex: "human",
    subclassIndex: null,
  };
}

function createCharacter(currentHp: number) {
  return {
    currentHp,
    id: `saved-${currentHp}`,
  } as Character;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

async function advanceAutosaveDelay() {
  await act(async () => {
    vi.advanceTimersByTime(dashboardAutosaveDelayMs);
    await Promise.resolve();
  });
}

describe("useDashboardAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("autosaves changed dashboard payloads after the debounce delay", async () => {
    const onSaved = vi.fn();
    const saveCharacter = vi.fn<SaveCharacter>().mockResolvedValue(createCharacter(7));
    const { rerender } = render(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(10)}
        saveCharacter={saveCharacter}
      />,
    );

    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(7)}
        saveCharacter={saveCharacter}
      />,
    );

    expect(screen.getByTestId("status").textContent).toBe("dirty");
    expect(saveCharacter).not.toHaveBeenCalled();

    await advanceAutosaveDelay();

    expect(saveCharacter).toHaveBeenCalledTimes(1);
    expect(saveCharacter).toHaveBeenCalledWith(
      "character-1",
      createPayload(7),
      {
        keepalive: false,
        reason: "debounced",
      },
    );
    expect(onSaved).toHaveBeenCalledWith(createCharacter(7));
    expect(screen.getByTestId("status").textContent).toBe("saved");
  });

  it("stays saved when the next payload reflects server normalization after a successful save", async () => {
    const onSaved = vi.fn();
    const saveCharacter = vi.fn<SaveCharacter>().mockResolvedValue(createCharacter(7));
    const requestPayload = createPayload(7);
    const serverNormalizedPayload = {
      ...createPayload(7),
      skillIndexes: ["athletics"],
    };
    const getSavedPayload = vi.fn(() => serverNormalizedPayload);
    const { rerender } = render(
      <AutosaveHarness
        getSavedPayload={getSavedPayload}
        onSaved={onSaved}
        payload={createPayload(10)}
        saveCharacter={saveCharacter}
      />,
    );

    rerender(
      <AutosaveHarness
        getSavedPayload={getSavedPayload}
        onSaved={onSaved}
        payload={requestPayload}
        saveCharacter={saveCharacter}
      />,
    );

    expect(screen.getByTestId("status").textContent).toBe("dirty");

    await advanceAutosaveDelay();

    expect(screen.getByTestId("status").textContent).toBe("saved");

    rerender(
      <AutosaveHarness
        getSavedPayload={getSavedPayload}
        onSaved={onSaved}
        payload={serverNormalizedPayload}
        saveCharacter={saveCharacter}
      />,
    );

    expect(screen.getByTestId("status").textContent).toBe("saved");
    expect(saveCharacter).toHaveBeenCalledTimes(1);
  });

  it("debounces multiple quick edits into one save with the latest payload", async () => {
    const onSaved = vi.fn();
    const saveCharacter = vi.fn<SaveCharacter>().mockResolvedValue(createCharacter(4));
    const { rerender } = render(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(10)}
        saveCharacter={saveCharacter}
      />,
    );

    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(8)}
        saveCharacter={saveCharacter}
      />,
    );
    await act(async () => {
      vi.advanceTimersByTime(dashboardAutosaveDelayMs - 1);
    });
    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(4)}
        saveCharacter={saveCharacter}
      />,
    );

    await advanceAutosaveDelay();

    expect(saveCharacter).toHaveBeenCalledTimes(1);
    expect(saveCharacter).toHaveBeenCalledWith(
      "character-1",
      createPayload(4),
      {
        keepalive: false,
        reason: "debounced",
      },
    );
  });

  it("flushes the pending payload immediately through the retry action", async () => {
    const onSaved = vi.fn();
    const saveCharacter = vi.fn<SaveCharacter>().mockResolvedValue(createCharacter(6));
    const { rerender } = render(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(10)}
        saveCharacter={saveCharacter}
      />,
    );

    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(6)}
        saveCharacter={saveCharacter}
      />,
    );

    await act(async () => {
      screen.getByRole("button", { name: "Retry save" }).click();
      await Promise.resolve();
    });

    expect(saveCharacter).toHaveBeenCalledTimes(1);
    expect(saveCharacter).toHaveBeenCalledWith(
      "character-1",
      createPayload(6),
      {
        keepalive: false,
        reason: "manual",
      },
    );

    await advanceAutosaveDelay();

    expect(saveCharacter).toHaveBeenCalledTimes(1);
  });

  it("keeps dirty data retryable when an autosave fails", async () => {
    const onSaved = vi.fn();
    const saveCharacter = vi
      .fn<SaveCharacter>()
      .mockRejectedValueOnce(new Error("Network down"))
      .mockResolvedValueOnce(createCharacter(5));
    const { rerender } = render(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(10)}
        saveCharacter={saveCharacter}
      />,
    );

    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(5)}
        saveCharacter={saveCharacter}
      />,
    );

    await advanceAutosaveDelay();

    expect(screen.getByTestId("status").textContent).toBe("error");
    expect(screen.getByTestId("error").textContent).toBe("Network down");

    await act(async () => {
      screen.getByRole("button", { name: "Retry save" }).click();
      await Promise.resolve();
    });

    expect(saveCharacter).toHaveBeenCalledTimes(2);
    expect(saveCharacter).toHaveBeenLastCalledWith(
      "character-1",
      createPayload(5),
      {
        keepalive: false,
        reason: "manual",
      },
    );
    expect(onSaved).toHaveBeenCalledWith(createCharacter(5));
  });

  it("does not apply stale save responses over newer local edits", async () => {
    const firstSave = createDeferred<Character>();
    const secondSave = createDeferred<Character>();
    const onSaved = vi.fn();
    const saveCharacter = vi
      .fn<SaveCharacter>()
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise);
    const { rerender } = render(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(10)}
        saveCharacter={saveCharacter}
      />,
    );

    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(8)}
        saveCharacter={saveCharacter}
      />,
    );
    await advanceAutosaveDelay();

    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(3)}
        saveCharacter={saveCharacter}
      />,
    );

    await act(async () => {
      firstSave.resolve(createCharacter(8));
      await firstSave.promise;
    });

    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByTestId("status").textContent).toBe("dirty");

    await advanceAutosaveDelay();

    expect(saveCharacter).toHaveBeenCalledTimes(2);

    await act(async () => {
      secondSave.resolve(createCharacter(3));
      await secondSave.promise;
    });

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith(createCharacter(3));
  });

  it("flushes pending changes on blur with keepalive enabled", async () => {
    const onSaved = vi.fn();
    const saveCharacter = vi.fn<SaveCharacter>().mockResolvedValue(createCharacter(2));
    const { rerender } = render(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(10)}
        saveCharacter={saveCharacter}
      />,
    );

    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(2)}
        saveCharacter={saveCharacter}
      />,
    );

    await act(async () => {
      window.dispatchEvent(new Event("blur"));
      await Promise.resolve();
    });

    expect(saveCharacter).toHaveBeenCalledTimes(1);
    expect(saveCharacter).toHaveBeenCalledWith(
      "character-1",
      createPayload(2),
      {
        keepalive: true,
        reason: "lifecycle",
      },
    );

    await advanceAutosaveDelay();

    expect(saveCharacter).toHaveBeenCalledTimes(1);
  });

  it("flushes pending changes on unmount with keepalive enabled", () => {
    const onSaved = vi.fn();
    const saveCharacter = vi.fn<SaveCharacter>().mockResolvedValue(createCharacter(1));
    const { rerender, unmount } = render(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(10)}
        saveCharacter={saveCharacter}
      />,
    );

    rerender(
      <AutosaveHarness
        onSaved={onSaved}
        payload={createPayload(1)}
        saveCharacter={saveCharacter}
      />,
    );

    unmount();

    expect(saveCharacter).toHaveBeenCalledTimes(1);
    expect(saveCharacter).toHaveBeenCalledWith(
      "character-1",
      createPayload(1),
      {
        keepalive: true,
        reason: "lifecycle",
      },
    );
  });
});
