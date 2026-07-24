# Changelog - Pegelwatch

## 1.6.0 - 2026-07-24

- **FIX:** Laufzeit-Fehlermeldung wird vor der Anzeige HTML-maskiert (`escapeHtmlForBase`); ein Fehlertext kann kein Markup mehr in die Seite einschleusen (XSS)
- **FIX:** Startseiten-Renderer wird nun `await`et; bei asynchronen Apps erscheint kein kurzzeitiges `[object Promise]` in `#main-content`

## 1.5.0 - 2026-07-23

- **ENH:** Datenabruf auf den Schalter `proxyAktiv` umgestellt; direkte Abrufe sind der Standard, der ODAS-Proxy wird nur noch bei `ja` verwendet
- **ENH:** Einfachen Standalone-Betrieb hinter Traefik mit derselben `odas-config/config.json` wie in der Entwicklung ergänzt
- **ENH:** Traefik-Anbindung auf das externe Netzwerk `proxynet`, den EntryPoint `websecure` und den Zertifikatsresolver `letsencrypt` festgelegt
- **FIX:** Proxy-Basispfad funktioniert jetzt auch bei URLs mit `index.html`; der Ziel-Pfad wird URL-kodiert
- **FIX:** Fetch-Helper auf die kanonische Portfolio-Fassung vereinheitlicht
- **DOC:** Start über `STANDALONE=true make up` dokumentiert

## 16.06.2026 (Version 1.4.0)

- ENH: Methodikbox (ausklappbar) mit Datenquelle-Hinweis und Datenstand ergänzt (`datenquelleHinweis`, `datenStand`).

## 16.06.2026 (Version 1.3.0)

- ENH: Schale-4-Verstaendlichkeit ergaenzt – „Fuer wen ist diese App?"-Block in Beschreibung und README.
- ENH: Konfigurierbarer Abschnitt „Weitere Informationen" mit weiterfuehrenden Links (neues Feld `weiterfuehrendeLinks`, leer = ausgeblendet).

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
