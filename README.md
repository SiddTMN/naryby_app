# naryby_app

Mobile-first web app for marking fishing spots in Opolskie Voivodeship (Poland).

## Tech

- HTML
- CSS
- Vanilla JavaScript (ES modules)
- Leaflet + OpenStreetMap
- `localStorage` for persistence

## Features

- Fullscreen interactive map centered on Opolskie
- Tap map to add fishing spots with details
- Marker popup with full spot info and delete action
- Bottom sliding panel listing saved spots
- Geolocation button (`My location`)
- Export spots to JSON file
- Import spots from JSON file
- Auto-load saved spots from `localStorage` at startup

## Project structure

```text
index.html
styles/style.css
src/main.js
src/map.js
src/storage.js
README.md
```

## Run locally

Because this app uses ES modules, serve it with a static server.

Example:

```bash
# Python example
python -m http.server 8000
```

Then open: `http://localhost:8000`

## GitHub Pages

This app is fully static and GitHub Pages compatible.
Deploy by pushing these files to your Pages-enabled repository (for example, from `main` branch root).
