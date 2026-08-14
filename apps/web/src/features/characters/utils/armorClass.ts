function getArmorDexterityContribution(armorName: string, dexterityModifier: number) {
  const normalizedName = armorName.trim().toLowerCase();

  if (
    ["ring mail", "chain mail", "chainmail", "splint", "plate armor", "plate mail"].some(
      (name) => normalizedName.includes(name),
    )
  ) {
    return 0;
  }

  if (normalizedName.includes("serpent scale")) {
    return dexterityModifier;
  }

  if (
    ["hide armor", "chain shirt", "scale mail", "breastplate", "half plate"].some((name) =>
      normalizedName.includes(name),
    )
  ) {
    return Math.min(2, dexterityModifier);
  }

  return dexterityModifier;
}

export { getArmorDexterityContribution };
