const STORAGE_KEY = "naryby_app_data";
const LEGACY_SPOTS_KEY = "naryby_app_spots";
const APP_VERSION = 1;

const EMPTY_DATA = {
  version: APP_VERSION,
  spots: [],
  journal: [],
  albums: [],
  calendar: [],
};

export function loadAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeAppData(JSON.parse(raw));
    }

    const legacyRaw = localStorage.getItem(LEGACY_SPOTS_KEY);
    if (legacyRaw) {
      const legacySpots = JSON.parse(legacyRaw);
      return normalizeAppData({
        ...EMPTY_DATA,
        spots: Array.isArray(legacySpots) ? legacySpots : [],
      });
    }
  } catch (error) {
    console.error("Nie udało się wczytać danych aplikacji:", error);
  }

  return { ...EMPTY_DATA };
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeAppData(data)));
}

export function exportAppData(data) {
  const json = JSON.stringify(normalizeAppData(data), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `na-ryby_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function parseImportedData(fileText) {
  const parsed = JSON.parse(fileText);

  if (Array.isArray(parsed)) {
    return normalizeAppData({ ...EMPTY_DATA, spots: parsed });
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Plik JSON musi zawierać dane aplikacji.");
  }

  return normalizeAppData(parsed);
}

export function buildId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function normalizeAppData(data) {
  return {
    version: APP_VERSION,
    spots: Array.isArray(data?.spots) ? data.spots.map(normalizeSpot).filter(Boolean) : [],
    journal: Array.isArray(data?.journal) ? data.journal.map(normalizeJournalEntry).filter(Boolean) : [],
    albums: Array.isArray(data?.albums) ? data.albums : [],
    calendar: Array.isArray(data?.calendar) ? data.calendar : [],
  };
}

function normalizeSpot(spot) {
  if (
    !spot ||
    typeof spot.id !== "string" ||
    typeof spot.name !== "string" ||
    !Number.isFinite(Number(spot.lat)) ||
    !Number.isFinite(Number(spot.lng))
  ) {
    return null;
  }

  return {
    id: spot.id,
    name: spot.name.trim(),
    waterType: typeof spot.waterType === "string" ? spot.waterType : "Inne",
    fishSpecies: typeof spot.fishSpecies === "string" ? spot.fishSpecies.trim() : "",
    notes: typeof spot.notes === "string" ? spot.notes.trim() : "",
    lat: Number(spot.lat),
    lng: Number(spot.lng),
    createdAt: typeof spot.createdAt === "string" ? spot.createdAt : new Date().toISOString(),
  };
}

function normalizeJournalEntry(entry) {
  if (!entry || typeof entry.id !== "string" || typeof entry.spotId !== "string") {
    return null;
  }

  return {
    id: entry.id,
    spotId: entry.spotId,
    date: typeof entry.date === "string" ? entry.date : new Date().toISOString().slice(0, 10),
    catchSummary: typeof entry.catchSummary === "string" ? entry.catchSummary.trim() : "",
    conditions: typeof entry.conditions === "string" ? entry.conditions.trim() : "",
    notes: typeof entry.notes === "string" ? entry.notes.trim() : "",
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
  };
}
