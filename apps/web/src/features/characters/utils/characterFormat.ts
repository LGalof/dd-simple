function formatAlignment(alignment?: string | null) {
  if (!alignment?.trim()) {
    return "Not selected";
  }

  return alignment
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export { formatAlignment };
