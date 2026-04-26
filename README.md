# Na Ryby

Mobilna aplikacja webowa dla wędkarza: mapa miejsc, prywatny lokalny dziennik wypraw i fundament pod przyszły kalendarz.

## Założenia

- działa jako statyczna strona na GitHub Pages,
- nie wymaga backendu ani systemu kont,
- nie wysyła prywatnych danych na serwer,
- zapisuje dane lokalnie w przeglądarce przez `localStorage`,
- pozwala eksportować i importować kopię danych w JSON.

## Funkcje

- pełnoekranowa mapa Leaflet/OpenStreetMap wycentrowana na województwie opolskim,
- dodawanie wielu punktów na mapie bez kasowania poprzednich,
- lista zapisanych miejsc w dolnym panelu,
- popup markera ze szczegółami miejsca,
- lokalny dziennik wpisów przypisanych do wybranego punktu,
- osobny widok dziennika z wpisami od najnowszych,
- edycja miejsc i wpisów dziennika,
- osobne usuwanie wpisów dziennika,
- usuwanie punktu razem z powiązanymi wpisami,
- geolokalizacja,
- eksport i import danych aplikacji.

## Prywatność

Aplikacja działa bez logowania. Dane użytkownika zostają w przeglądarce na danym urządzeniu. Publiczne repozytorium GitHub Pages zawiera tylko kod aplikacji, nie prywatne punkty ani wpisy z dziennika.

Eksport JSON jest kopią prywatnych danych użytkownika. Nie należy commitować własnych eksportów do publicznego repozytorium.

## Model danych

Dane są zapisywane pod kluczem `naryby_app_data` i mają strukturę przygotowaną pod rozwój:

```json
{
  "version": 1,
  "spots": [],
  "journal": [],
  "albums": [],
  "calendar": []
}
```

Starsze dane zapisane jako sama lista punktów pod `naryby_app_spots` są automatycznie migrowane przy starcie.

## Struktura projektu

```text
index.html
styles/style.css
src/main.js
src/map.js
src/storage.js
README.md
```

## Uruchomienie lokalne

Aplikacja używa modułów ES, więc najlepiej uruchomić ją przez prosty serwer statyczny.

```bash
python -m http.server 8000
```

Następnie otwórz `http://localhost:8000`.

## GitHub Pages

Aplikacja jest kompatybilna z GitHub Pages. Wystarczy wypchnąć pliki do publicznego repozytorium i włączyć Pages dla katalogu głównego wybranej gałęzi.
