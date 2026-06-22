type CharacterPreviewQuery = {
  backgroundIndex?: string;
  classIndex?: string;
  featIndexes?: string[];
  level?: number;
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

function buildCharacterPreviewQueryPath(
  basePath: string,
  query: CharacterPreviewQuery = {},
) {
  const params = new URLSearchParams();

  if (query.backgroundIndex) {
    params.set("backgroundIndex", query.backgroundIndex);
  }

  if (query.classIndex) {
    params.set("classIndex", query.classIndex);
  }

  if (query.speciesIndex) {
    params.set("speciesIndex", query.speciesIndex);
  }

  if (query.subspeciesIndex) {
    params.set("subspeciesIndex", query.subspeciesIndex);
  }

  if (query.subclassIndex) {
    params.set("subclassIndex", query.subclassIndex);
  }

  if (typeof query.level === "number") {
    params.set("level", String(query.level));
  }

  for (const featIndex of query.featIndexes ?? []) {
    if (featIndex.trim().length > 0) {
      params.append("featIndex", featIndex);
    }
  }

  return params.size > 0 ? `${basePath}?${params.toString()}` : basePath;
}

export { buildCharacterPreviewQueryPath };
export type { CharacterPreviewQuery };
