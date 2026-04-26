import { createMap } from "./map.js";
import { buildSpotId, exportSpots, loadSpots, parseImportedSpots, saveSpots } from "./storage.js";

const state = {
  spots: loadSpots(),
  pendingCoords: null,
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
};

const mapApi = createMap({
  onMapTap: openSpotDialogAt,
  onDeleteSpot: deleteSpot,
  onLocationError: (message) => alert(message),
});

init();

function init() {
  mapApi.renderSpots(state.spots);
  renderSpotList();
  bindEvents();
}

function bindEvents() {
  elements.addSpotBtn.addEventListener("click", () => {
    const originalText = elements.addSpotBtn.textContent;
    elements.addSpotBtn.textContent = "Tap map now";
    window.setTimeout(() => {
      elements.addSpotBtn.textContent = originalText;
    }, 1400);
  });

  elements.myLocationBtn.addEventListener("click", () => {
    mapApi.centerOnUserLocation();
  });

  elements.exportBtn.addEventListener("click", () => {
    exportSpots(state.spots);
  });

  elements.importBtn.addEventListener("click", () => {
    elements.importInput.click();
  });

  elements.importInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileText = await file.text();
      const imported = parseImportedSpots(fileText);
      state.spots = imported;
      syncAndRender();
    } catch (error) {
      alert(`Failed to import JSON: ${error.message}`);
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
    const button = event.target.closest("button[data-spot-id]");
    if (!button) return;
    const spotId = button.getAttribute("data-spot-id");
    if (spotId) {
      mapApi.zoomToSpot(spotId);
    }
  });

  elements.cancelSpotBtn.addEventListener("click", closeSpotDialog);

  elements.spotDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSpotDialog();
  });

  elements.spotForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.pendingCoords) return;

    const formData = new FormData(elements.spotForm);
    const name = String(formData.get("name") || "").trim();
    if (!name) return;

    const spot = {
      id: buildSpotId(),
      name,
      waterType: String(formData.get("waterType") || "other"),
      fishSpecies: String(formData.get("fishSpecies") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      author: String(formData.get("author") || "Łukasz"),
      lat: state.pendingCoords.lat,
      lng: state.pendingCoords.lng,
      createdAt: new Date().toISOString(),
    };

    state.spots.push(spot);
    syncAndRender();
    closeSpotDialog();
  });
}

function openSpotDialogAt(coords) {
  state.pendingCoords = coords;
  elements.spotCoordinates.textContent = `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`;
  elements.spotForm.reset();

  // This keeps a consistent author default after reset.
  const authorSelect = elements.spotForm.querySelector("#author");
  if (authorSelect) authorSelect.value = "Łukasz";

  openDialog(elements.spotDialog);
}

function closeSpotDialog() {
  state.pendingCoords = null;
  closeDialog(elements.spotDialog);
}

function deleteSpot(spotId) {
  const shouldDelete = confirm("Delete this fishing spot?");
  if (!shouldDelete) return;

  state.spots = state.spots.filter((spot) => spot.id !== spotId);
  syncAndRender();
}

function syncAndRender() {
  // Single sync point keeps storage and UI always in the same state.
  saveSpots(state.spots);
  mapApi.renderSpots(state.spots);
  renderSpotList();
}

function renderSpotList() {
  if (state.spots.length === 0) {
    elements.spotList.innerHTML = `<li>No spots yet. Tap the map to add your first spot.</li>`;
    return;
  }

  elements.spotList.innerHTML = state.spots
    .map(
      (spot) => `
        <li>
          <button class="spot-item-btn" type="button" data-spot-id="${escapeAttr(spot.id)}">
            <strong>${escapeHtml(spot.name)}</strong>
            <span>${escapeHtml(spot.waterType)}</span>
          </button>
        </li>
      `
    )
    .join("");
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
