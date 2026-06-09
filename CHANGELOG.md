# Changelog - Pegelwatch

## 09.06.2026 (Version 1.2.0)

- Feat: Redesign des Dashboards – Umstellung auf eine Diashow-Navigation (Dropdown-Auswahl & Nächste/Vorherige-Buttons) zur fokussierten Darstellung einzelner Messstellen. Vollständige Entfernung von Karte und Tabelle.
- Feat: Flexibler Zeitraum-Wähler für die Verlaufsgrafik (24 Std., 48 Std., 72 Std., 7 Tage, 1 Monat, 1 Jahr) zur Anpassung des angezeigten Zeitfensters.
- Feat: Intelligentes Resampling mit Erkennung unvollständiger Daten – kurze Intervalle (bis 72 Std.) werden kontinuierlich gezeichnet, ab 7 Tagen wird in Datenkörbe (Bins) gruppiert und Fehlwerte werden als Lücken (`null`-Werte) visualisiert.
- Feat: Optimierte Verlaufsgrafik – verdoppelte Charthöhe, weicher Kurvenverlauf (Bezier-Kurven), Reduzierung der überfüllten X-Achsen-Beschriftungen und Punkt-Einblendung nur bei Hover zur Vermeidung von visuellem Rauschen.
- Feat: Paging für unbeschränkten Datenabruf – Datensätze werden in 500er-Schritten vollständig geladen, unterstützt durch eine Ladeanimation mit Fortschrittsanzeige.
- Feat: Quellverlinkungen zum Open Data Portal und PEGELONLINE auf der Beschreibungsseite und im Detailbereich hinterlegt.

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
