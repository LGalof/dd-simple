import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Character, CharacterSavePayload } from "../../../types/character";

const dashboardAutosaveDelayMs = 900;

type DashboardAutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
type DashboardAutosaveFlushReason = "debounced" | "manual" | "lifecycle";

type DashboardAutosaveSaveOptions = {
  keepalive: boolean;
  reason: DashboardAutosaveFlushReason;
};

type DashboardAutosaveOptions = {
  characterId: string | null;
  getSavedPayload?: (
    character: Character,
    requestPayload: CharacterSavePayload,
  ) => CharacterSavePayload | null;
  onSaved: (character: Character) => void;
  payload: CharacterSavePayload | null;
  saveCharacter: (
    characterId: string,
    payload: CharacterSavePayload,
    options: DashboardAutosaveSaveOptions,
  ) => Promise<Character>;
};

function useDashboardAutosave({
  characterId,
  getSavedPayload,
  onSaved,
  payload,
  saveCharacter,
}: DashboardAutosaveOptions) {
  const [saveStatus, setSaveStatus] = useState<DashboardAutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const payloadSignature = useMemo(
    () => (payload ? stableStringify(payload) : null),
    [payload],
  );
  const latestCharacterIdRef = useRef(characterId);
  const latestPayloadRef = useRef(payload);
  const latestPayloadSignatureRef = useRef(payloadSignature);
  const lastSavedSignatureRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const requestSequenceRef = useRef(0);
  const mountedRef = useRef(true);
  const getSavedPayloadRef = useRef(getSavedPayload);
  const onSavedRef = useRef(onSaved);
  const saveCharacterRef = useRef(saveCharacter);

  latestCharacterIdRef.current = characterId;
  latestPayloadRef.current = payload;
  latestPayloadSignatureRef.current = payloadSignature;
  getSavedPayloadRef.current = getSavedPayload;
  onSavedRef.current = onSaved;
  saveCharacterRef.current = saveCharacter;

  const clearSaveTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flushSave = useCallback(
    async (reason: DashboardAutosaveFlushReason = "manual") => {
      clearSaveTimer();

      const currentCharacterId = latestCharacterIdRef.current;
      const currentPayload = latestPayloadRef.current;
      const currentSignature = latestPayloadSignatureRef.current;

      if (!currentCharacterId || !currentPayload || !currentSignature) {
        return null;
      }

      if (lastSavedSignatureRef.current === currentSignature) {
        if (mountedRef.current) {
          setSaveStatus((status) => (status === "idle" ? "idle" : "saved"));
          setSaveError(null);
        }

        return null;
      }

      const requestId = requestSequenceRef.current + 1;
      requestSequenceRef.current = requestId;

      if (mountedRef.current) {
        setSaveStatus("saving");
        setSaveError(null);
      }

      try {
        const updatedCharacter = await saveCharacterRef.current(
          currentCharacterId,
          currentPayload,
          {
            keepalive: reason === "lifecycle",
            reason,
          },
        );

        if (
          latestCharacterIdRef.current !== currentCharacterId ||
          latestPayloadSignatureRef.current !== currentSignature ||
          requestSequenceRef.current !== requestId
        ) {
          if (mountedRef.current && latestCharacterIdRef.current === currentCharacterId) {
            setSaveStatus("dirty");
          }

          return updatedCharacter;
        }

        const savedPayload =
          getSavedPayloadRef.current?.(updatedCharacter, currentPayload) ?? currentPayload;
        lastSavedSignatureRef.current = stableStringify(savedPayload);

        if (mountedRef.current) {
          setLastSavedAt(new Date());
          setSaveStatus("saved");
          setSaveError(null);
          onSavedRef.current(updatedCharacter);
        }

        return updatedCharacter;
      } catch (error) {
        if (
          mountedRef.current &&
          latestCharacterIdRef.current === currentCharacterId &&
          latestPayloadSignatureRef.current === currentSignature
        ) {
          setSaveStatus("error");
          setSaveError(error instanceof Error ? error.message : "Autosave failed.");
        }

        return null;
      }
    },
    [clearSaveTimer],
  );

  const scheduleSave = useCallback(() => {
    clearSaveTimer();
    timerRef.current = window.setTimeout(() => {
      void flushSave("debounced");
    }, dashboardAutosaveDelayMs);
  }, [clearSaveTimer, flushSave]);

  useEffect(() => {
    lastSavedSignatureRef.current = latestPayloadSignatureRef.current;
    setLastSavedAt(null);
    setSaveError(null);
    setSaveStatus(latestPayloadSignatureRef.current ? "saved" : "idle");
    clearSaveTimer();
  }, [characterId, clearSaveTimer]);

  useEffect(() => {
    if (!payloadSignature) {
      clearSaveTimer();
      setSaveStatus("idle");
      return;
    }

    if (lastSavedSignatureRef.current === null) {
      lastSavedSignatureRef.current = payloadSignature;
      setSaveStatus("saved");
      return;
    }

    if (payloadSignature === lastSavedSignatureRef.current) {
      setSaveStatus((status) => (status === "idle" ? "idle" : "saved"));
      setSaveError(null);
      clearSaveTimer();
      return;
    }

    setSaveStatus("dirty");
    setSaveError(null);
    scheduleSave();
  }, [clearSaveTimer, payloadSignature, scheduleSave]);

  useEffect(() => {
    function flushPendingSave() {
      void flushSave("lifecycle");
    }

    function flushWhenHidden() {
      if (document.visibilityState === "hidden") {
        flushPendingSave();
      }
    }

    window.addEventListener("blur", flushPendingSave);
    window.addEventListener("beforeunload", flushPendingSave);
    window.addEventListener("pagehide", flushPendingSave);
    document.addEventListener("visibilitychange", flushWhenHidden);

    return () => {
      window.removeEventListener("blur", flushPendingSave);
      window.removeEventListener("beforeunload", flushPendingSave);
      window.removeEventListener("pagehide", flushPendingSave);
      document.removeEventListener("visibilitychange", flushWhenHidden);
    };
  }, [flushSave]);

  useEffect(
    () => () => {
      mountedRef.current = false;
      void flushSave("lifecycle");
      clearSaveTimer();
    },
    [clearSaveTimer, flushSave],
  );

  return {
    flushSave,
    lastSavedAt,
    saveError,
    saveStatus,
  };
}

function formatDashboardSaveStatus(
  status: DashboardAutosaveStatus,
  lastSavedAt: Date | null,
) {
  if (status === "dirty") {
    return "Unsaved changes";
  }

  if (status === "saving") {
    return "Saving...";
  }

  if (status === "error") {
    return "Save failed.";
  }

  if (status === "saved" && lastSavedAt) {
    return `Saved ${lastSavedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  if (status === "saved") {
    return "Saved";
  }

  return "No character loaded";
}

function stableStringify(value: unknown) {
  return JSON.stringify(sortValueForFingerprint(value));
}

function sortValueForFingerprint(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValueForFingerprint);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([entryKey, entryValue]) => [entryKey, sortValueForFingerprint(entryValue)]),
  );
}

export {
  dashboardAutosaveDelayMs,
  formatDashboardSaveStatus,
  useDashboardAutosave,
};
export type {
  DashboardAutosaveFlushReason,
  DashboardAutosaveSaveOptions,
  DashboardAutosaveStatus,
};
