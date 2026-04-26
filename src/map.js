const OPOLSKIE_CENTER = [50.6751, 17.9213];
const OPOLSKIE_ZOOM = 9;

export function createMap({ onMapTap, onDeleteSpot, onLocationError }) {
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

  const markerIndex = new Map();

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
      onLocationError(event.message || "Location access failed.");
    }
  });

  map.on("popupopen", (event) => {
    const popupNode = event.popup.getElement();
    if (!popupNode) return;

    const deleteButton = popupNode.querySelector(".delete-spot-btn");
    if (!deleteButton) return;

    deleteButton.addEventListener("click", () => {
      const spotId = deleteButton.getAttribute("data-spot-id");
      if (spotId && typeof onDeleteSpot === "function") {
        onDeleteSpot(spotId);
      }
    });
  });

  return {
    renderSpots(spots) {
      markerIndex.forEach((marker) => marker.remove());
      markerIndex.clear();

      spots.forEach((spot) => {
        const marker = L.marker([spot.lat, spot.lng]).addTo(map);
        marker.bindPopup(buildPopupHtml(spot));
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

function buildPopupHtml(spot) {
  return `
    <div class="marker-popup">
      <h3>${escapeHtml(spot.name)}</h3>
      <p><strong>Water:</strong> ${escapeHtml(spot.waterType)}</p>
      <p><strong>Fish:</strong> ${escapeHtml(spot.fishSpecies || "-")}</p>
      <p><strong>Notes:</strong> ${escapeHtml(spot.notes || "-")}</p>
      <p><strong>Author:</strong> ${escapeHtml(spot.author)}</p>
      <button class="delete-spot-btn" type="button" data-spot-id="${escapeHtml(spot.id)}">
        Delete
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
