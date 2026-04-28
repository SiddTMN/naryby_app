const OPOLSKIE_CENTER = [50.6751, 17.9213];
const OPOLSKIE_ZOOM = 9;

export function createMap({ onMapTap, onEditSpot, onDeleteSpot, onAddJournalEntry, onLocationError }) {
  const map = L.map("map", {
    zoomControl: false,
    preferCanvas: true,
  }).setView(OPOLSKIE_CENTER, OPOLSKIE_ZOOM);

  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const centerCoordinates = document.getElementById("centerCoordinates");
  const markerIndex = new Map();
  const updateCenterReadout = () => {
    if (!centerCoordinates) return;

    const center = map.getCenter();
    centerCoordinates.textContent = formatCoordinates(center.lat, center.lng);
  };

  map.on("click", (event) => {
    if (typeof onMapTap === "function") {
      onMapTap({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    }
  });

  map.on("locationerror", (event) => {
    if (typeof onLocationError === "function") {
      onLocationError(event.message || "Nie udało się pobrać lokalizacji.");
    }
  });

  map.on("popupopen", (event) => {
    const popupNode = event.popup.getElement();
    if (!popupNode) return;

    const deleteButton = popupNode.querySelector(".delete-spot-btn");
    deleteButton?.addEventListener("click", () => {
      const spotId = deleteButton.getAttribute("data-spot-id");
      if (spotId && typeof onDeleteSpot === "function") {
        onDeleteSpot(spotId);
      }
    });

    const journalButton = popupNode.querySelector(".journal-entry-btn");
    journalButton?.addEventListener("click", () => {
      const spotId = journalButton.getAttribute("data-spot-id");
      if (spotId && typeof onAddJournalEntry === "function") {
        onAddJournalEntry(spotId);
      }
    });

    const editButton = popupNode.querySelector(".edit-spot-btn");
    editButton?.addEventListener("click", () => {
      const spotId = editButton.getAttribute("data-spot-id");
      if (spotId && typeof onEditSpot === "function") {
        onEditSpot(spotId);
      }
    });
  });

  map.on("move zoom locationfound", updateCenterReadout);
  updateCenterReadout();

  return {
    renderSpots(spots, journalEntries = []) {
      markerIndex.forEach((marker) => marker.remove());
      markerIndex.clear();

      spots.forEach((spot) => {
        const entryCount = journalEntries.filter((entry) => entry.spotId === spot.id).length;
        const marker = L.marker([spot.lat, spot.lng]).addTo(map);
        marker.bindPopup(buildPopupHtml(spot, entryCount));
        markerIndex.set(spot.id, marker);
      });
    },

    zoomToSpot(spotId) {
      const marker = markerIndex.get(spotId);
      if (!marker) return;
      map.setView(marker.getLatLng(), 14, { animate: true });
      marker.openPopup();
    },

    centerOnUserLocation() {
      map.locate({
        setView: true,
        maxZoom: 14,
        enableHighAccuracy: true,
      });
    },

    invalidateSize() {
      map.invalidateSize();
    },
  };
}

function formatCoordinates(lat, lng) {
  const latDirection = lat >= 0 ? "N" : "S";
  const lngDirection = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${latDirection}, ${Math.abs(lng).toFixed(5)}° ${lngDirection}`;
}

function buildPopupHtml(spot, entryCount) {
  return `
    <div class="marker-popup">
      <h3>${escapeHtml(spot.name)}</h3>
      <p><strong>Typ wody:</strong> ${escapeHtml(spot.waterType)}</p>
      <p><strong>Ryby:</strong> ${escapeHtml(spot.fishSpecies || "-")}</p>
      <p><strong>Notatki:</strong> ${escapeHtml(spot.notes || "-")}</p>
      <p><strong>Wpisy:</strong> ${entryCount}</p>
      <button class="journal-entry-btn" type="button" data-spot-id="${escapeHtml(spot.id)}">
        Dodaj wpis
      </button>
      <button class="edit-spot-btn" type="button" data-spot-id="${escapeHtml(spot.id)}">
        Edytuj punkt
      </button>
      <button class="delete-spot-btn" type="button" data-spot-id="${escapeHtml(spot.id)}">
        Usuń punkt
      </button>
    </div>
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
