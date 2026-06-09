# Changelog - Pegelwatch

## 09.06.2026 (Version 1.2.0)

- Fix: Karten-Tiles nicht sichtbar – Tile-Server von CARTO auf OpenStreetMap gewechselt (CARTO-Tiles wurden durch ODAS-System-CSP blockiert).
- Fix: Leaflet-CSS wird jetzt als Promise geladen, sodass die Karte erst nach vollständigem CSS-Load initialisiert wird.
- Fix: Fallback-Höhe (430px) für `#pegel-map` falls externe CSS verzögert lädt.
- Fix: Marker-Klick rief `renderDashboard()` innerhalb des Leaflet-Event-Stacks auf – via `setTimeout(..., 0)` behoben.
- Fix: Marker-Überlappung durch `iconSize:null` und überarbeitete Marker-CSS (transform-basierte Zentrierung).
- Fix: `overflow:hidden` auf `.pegelwatch-panel` blockierte Leaflet-Controls – via `:has(#pegel-map)` auf `overflow:visible` gesetzt.

## 05.06.2026 (Version 1.1.0)

- Überarbeitung nach `app-konzept.md` mit klarer ODAS-Konfiguration für CKAN-Action-API, Messstellen-Ressource, Messwerte-Ressource und `proxyAktiv`.
- Verbesserte Datenkernlogik für CKAN-URL-Erzeugung, ODAS-Proxy-Pfadextraktion, deutsche Pegel-Zeitstempel, Einheiten-Normalisierung und Trendberechnung.
- Neues Dashboard mit Kennzahlen, Direkt/Proxy-Status, sortierbarer Messstellen-Tabelle, Karte, Detailansicht, Chart-Verlauf und lokalen Alarmschwellen.
- App-spezifische Beschreibung, README, lokales Config-Mirror und Schema nachgezogen.

## 05.06.2026 (Version 1.0.0)

- Initial release of the Pegelwatch app.
- Feat: Dynamic script loader for Leaflet, Proj4js, and Chart.js.
- Feat: Gauß-Krüger Zone 3 (EPSG:31467) to WGS84 coordinate projection.
- Feat: Parallel CKAN DataStore queries with dynamic ODAS Proxy routing.
- Feat: Responsive Bootstrap 5.3 dashboard with KPI cards and interactive map.
- Feat: Local alarm thresholds saved via localStorage and water-level trends in Chart.js.
