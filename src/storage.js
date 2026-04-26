const STORAGE_KEY = "naryby_app_spots";

export function loadSpots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load spots from localStorage:", error);
    return [];
  }
}

export function saveSpots(spots) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
}

export function exportSpots(spots) {
  const json = JSON.stringify(spots, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `naryby_spots_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function parseImportedSpots(fileText) {
  const parsed = JSON.parse(fileText);
  if (!Array.isArray(parsed)) {
    throw new Error("JSON must be an array of spots.");
  }

  return parsed
    .filter((spot) => {
      return (
        spot &&
        typeof spot.id === "string" &&
        typeof spot.name === "string" &&
        typeof spot.waterType === "string" &&
        typeof spot.author === "string" &&
        Number.isFinite(spot.lat) &&
        Number.isFinite(spot.lng)
      );
    })
    .map((spot) => ({
      id: spot.id,
      name: spot.name.trim(),
      waterType: spot.waterType,
      fishSpecies: typeof spot.fishSpecies === "string" ? spot.fishSpecies : "",
      notes: typeof spot.notes === "string" ? spot.notes : "",
      author: spot.author,
      lat: spot.lat,
      lng: spot.lng,
      createdAt: typeof spot.createdAt === "string" ? spot.createdAt : new Date().toISOString(),
    }));
}

export function buildSpotId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `spot-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
