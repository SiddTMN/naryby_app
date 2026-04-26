import { createMap } from "./map.js";
import { buildId, exportAppData, loadAppData, parseImportedData, saveAppData } from "./storage.js";

const state = {
  data: loadAppData(),
  pendingCoords: null,
  pendingJournalSpotId: null,
};

const elements = {
  addSpotBtn: document.getElementById("addSpotBtn"),
  myLocationBtn: document.getElementById("myLocationBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importInput: document.getElementById("importInput"),
  spotPanel: document.getElementById("spotPanel"),
  panelToggleBtn: document.getElementById("panelToggleBtn"),
  spotList: document.getElementById("spotList"),
  spotDialog: document.getElementById("spotDialog"),
  spotForm: document.getElementById("spotForm"),
  spotCoordinates: document.getElementById("spotCoordinates"),
  cancelSpotBtn: document.getElementById("cancelSpotBtn"),
  journalDialog: document.getElementById("journalDialog"),
  journalForm: document.getElementById("journalForm"),
  journalSpotName: document.getElementById("journalSpotName"),
  journalDate: document.getElementById("journalDate"),
  cancelJournalBtn: document.getElementById("cancelJournalBtn"),
};

const mapApi = createMap({
  onMapTap: openSpotDialogAt,
  onDeleteSpot: deleteSpot,
  onAddJournalEntry: openJournalDialog,
  onLocationError: (message) => alert(message),
});

init();

function init() {
  mapApi.renderSpots(state.data.spots, state.data.journal);
  renderSpotList();
  bindEvents();
}

function bindEvents() {
  elements.addSpotBtn.addEventListener("click", () => {
    const originalText = elements.addSpotBtn.textContent;
    elements.addSpotBtn.textContent = "Kliknij mapę";
    window.setTimeout(() => {
      elements.addSpotBtn.textContent = originalText;
    }, 1400);
  });

  elements.myLocationBtn.addEventListener("click", () => {
    mapApi.centerOnUserLocation();
  });

  elements.exportBtn.addEventListener("click", () => {
    exportAppData(state.data);
  });

  elements.importBtn.addEventListener("click", () => {
    elements.importInput.click();
  });

  elements.importInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileText = await file.text();
      state.data = parseImportedData(fileText);
      syncAndRender();
    } catch (error) {
      alert(`Nie udało się zaimportować JSON: ${error.message}`);
    } finally {
      elements.importInput.value = "";
    }
  });

  elements.panelToggleBtn.addEventListener("click", () => {
    const isOpen = elements.spotPanel.classList.toggle("open");
    elements.panelToggleBtn.setAttribute("aria-expanded", String(isOpen));
    mapApi.invalidateSize();
  });

  elements.spotList.addEventListener("click", (event) => {
    const zoomButton = event.target.closest("button[data-spot-id][data-action='zoom']");
    if (zoomButton) {
      mapApi.zoomToSpot(zoomButton.getAttribute("data-spot-id"));
      return;
    }

    const journalButton = event.target.closest("button[data-spot-id][data-action='journal']");
    if (journalButton) {
      openJournalDialog(journalButton.getAttribute("data-spot-id"));
    }
  });

  elements.cancelSpotBtn.addEventListener("click", closeSpotDialog);
  elements.cancelJournalBtn.addEventListener("click", closeJournalDialog);

  elements.spotDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSpotDialog();
  });

  elements.journalDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeJournalDialog();
  });

  elements.spotForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.pendingCoords) return;

    const formData = new FormData(elements.spotForm);
    const name = String(formData.get("name") || "").trim();
    if (!name) return;

    const spot = {
      id: buildId("spot"),
      name,
      waterType: String(formData.get("waterType") || "Inne"),
      fishSpecies: String(formData.get("fishSpecies") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      lat: state.pendingCoords.lat,
      lng: state.pendingCoords.lng,
      createdAt: new Date().toISOString(),
    };

    state.data.spots = [...state.data.spots, spot];
    syncAndRender();
    closeSpotDialog();
  });

  elements.journalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.pendingJournalSpotId) return;

    const formData = new FormData(elements.journalForm);
    const entry = {
      id: buildId("entry"),
      spotId: state.pendingJournalSpotId,
      date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
      catchSummary: String(formData.get("catchSummary") || "").trim(),
      conditions: String(formData.get("conditions") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      createdAt: new Date().toISOString(),
    };

    state.data.journal = [...state.data.journal, entry];
    syncAndRender();
    closeJournalDialog();
  });
}

function openSpotDialogAt(coords) {
  state.pendingCoords = coords;
  elements.spotCoordinates.textContent = `Współrzędne: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
  elements.spotForm.reset();
  openDialog(elements.spotDialog);
}

function closeSpotDialog() {
  state.pendingCoords = null;
  closeDialog(elements.spotDialog);
}

function openJournalDialog(spotId) {
  const spot = state.data.spots.find((item) => item.id === spotId);
  if (!spot) return;

  state.pendingJournalSpotId = spotId;
  elements.journalForm.reset();
  elements.journalDate.value = new Date().toISOString().slice(0, 10);
  elements.journalSpotName.textContent = spot.name;
  openDialog(elements.journalDialog);
}

function closeJournalDialog() {
  state.pendingJournalSpotId = null;
  closeDialog(elements.journalDialog);
}

function deleteSpot(spotId) {
  const shouldDelete = confirm("Usunąć ten punkt i powiązane wpisy z dziennika?");
  if (!shouldDelete) return;

  state.data.spots = state.data.spots.filter((spot) => spot.id !== spotId);
  state.data.journal = state.data.journal.filter((entry) => entry.spotId !== spotId);
  syncAndRender();
}

function syncAndRender() {
  saveAppData(state.data);
  mapApi.renderSpots(state.data.spots, state.data.journal);
  renderSpotList();
}

function renderSpotList() {
  if (state.data.spots.length === 0) {
    elements.spotList.innerHTML = `<li class="empty-state">Nie masz jeszcze punktów. Kliknij mapę, żeby dodać pierwsze miejsce.</li>`;
    return;
  }

  elements.spotList.innerHTML = state.data.spots.map(renderSpotItem).join("");
}

function renderSpotItem(spot) {
  const entries = state.data.journal
    .filter((entry) => entry.spotId === spot.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestEntry = entries[0];

  return `
    <li class="spot-item">
      <button class="spot-item-btn" type="button" data-action="zoom" data-spot-id="${escapeAttr(spot.id)}">
        <strong>${escapeHtml(spot.name)}</strong>
        <span>${escapeHtml(spot.waterType)} · wpisy: ${entries.length}</span>
      </button>
      ${
        latestEntry
          ? `<p class="latest-entry">${escapeHtml(latestEntry.date)}: ${escapeHtml(latestEntry.catchSummary || latestEntry.notes || "Wpis bez opisu")}</p>`
          : `<p class="latest-entry">Brak wpisów w dzienniku.</p>`
      }
      <button class="small-action-btn" type="button" data-action="journal" data-spot-id="${escapeAttr(spot.id)}">
        Dodaj wpis
      </button>
    </li>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function openDialog(dialogEl) {
  if (typeof dialogEl.showModal === "function") {
    if (!dialogEl.open) dialogEl.showModal();
    return;
  }
  dialogEl.setAttribute("open", "open");
}

function closeDialog(dialogEl) {
  if (typeof dialogEl.close === "function") {
    if (dialogEl.open) dialogEl.close();
    return;
  }
  dialogEl.removeAttribute("open");
}
