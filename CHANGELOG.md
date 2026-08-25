# Changelog - Pegelwatch

## 1.28.0 - 2026-08-25
- **CHG:** apiurls-Standard „Eine Quelle = eine vollständige URL“ umgesetzt: Zwei vollständige `datastore_search`-URLs (`pegel-messstellen`, `pegel-messwerte`) ersetzen Basis-URL + separate Ressourcen-IDs.
- **CHG:** Instanzfelder `messstellenResourceId`/`messwerteResourceId` entfernt; der Code liest keine Resource-ID-Keys mehr, Pagination/Sortierung wird zur Laufzeit angehängt.

## 1.27.0 - 2026-08-22
- **CHG:** `version` in `app-package.json` zu `app-version` umbenannt.
- **ENH:** Top-Level-Feld `app-package-version` ergänzt (Wert `"2"`: mehrere benannte API-URLs über `instanz-config.apiurls`).

## 1.26.0 - 2026-08-21
- **CHG:** Skalares `apiurl` durch das Array-Feld `apiurls` ersetzt (`typ: "array"`, Eintrag `pegelstaende`). Neuer Standard portfolioweit; `apiurl` entfällt. `app.js` liest die Datenquelle jetzt über `getOdasApiUrl(configdata, "pegelstaende")`.

## 1.25.0 - 2026-08-20
- Markdown-Metadaten: Paketbeschreibungen auf echtes Markdown umgestellt, exakte Identität Top-Level/Instanz hergestellt, lokale HTML-Fixture semantisch gespiegelt.

## 1.24.0 - 2026-08-20
- FIX: Generierte IDs (u. a. `pegel-chart`, `pegelwatch-refresh`, `pegelwatch-alerts`, `pegelwatch-prev`/`-next`, `pegelwatch-station-select`, `pegelwatch-progress-bar`, `pegelwatch-detail`, `pegelwatch-save-threshold`, `pegelwatch-clear-threshold`) tragen jetzt durchgängig die Instanzkennung `state.uid`, damit zwei Instanzen dieser App auf derselben Seite nicht kollidieren; alle zugehörigen `querySelector`-Lookups wurden entsprechend nachgezogen (F-71)
- FIX: Toten Karten-Code entfernt (`initMap()`, `convertEpsg31467ToWgs84()`, die zugehörige `EPSG_31467_DEFINITION`-Projektion sowie die seit der Diashow-Umstellung (v1.2.0) ungenutzten `renderMetricCard()`, `renderSortableHeader()`, `renderStationRow()`, `compareNullableNumbers()` — alle verifiziert unreferenziert); Datenschutztext (`odas-config/config.json`, `app-package.json`) und README behaupteten weiterhin einen Laufzeitkontakt zu `tile.openstreetmap.org`, obwohl die Karte seit v1.2.0 nicht mehr existiert und kein Leaflet mehr ausgeliefert wird — Texte korrigiert; die veraltete, noch "Karte"/"Tabelle" erwähnende `beschreibung` in `odas-config/config.json` wurde außerdem mit der bereits aktualisierten Fassung in `app-package.json` synchronisiert (F-84)

## 1.23.0 - 2026-08-18
- FIX: `renderDetailPanel()` warf einen `ReferenceError: state is not defined`, sobald eine Messstelle ausgewählt war (praktisch immer, sobald Daten geladen sind) — der F-60-Fix (1.20.0) hatte `${state.uid}` in den Alarmschwellen-Feldern ergänzt, ohne `uid` als Parameter an `renderDetailPanel(station)` durchzureichen. Funktion nimmt jetzt `renderDetailPanel(station, uid)` entgegen, Aufrufstelle übergibt `state.uid`. Gefunden durch die neue Zwei-Instanz-Laufzeitprobe (`tools/odas-zweiinstanz-probe/`, Welle Z)

## 1.22.0 - 2026-08-17
- `fetchOdasJson()` wirft jetzt bei nicht-JSON-Antworten (CSV, HTML, leerer Body) eine sprechende Konfigurationsfehlermeldung statt der rohen `JSON.parse`-Parserfehlermeldung (F-66)

## 1.21.0 - 2026-08-17
- **CHG:** `instanz-config`-`category`-Vokabular auf Deutsch umgestellt (`allgemein`, `beschreibung`, `datenherkunft`, `kontakt-rechtliches`, `sonstiges`); die entfallenen Kategorien `metrics` und `advanced` wurden auf `beschreibung` bzw. `sonstiges` verteilt

## 1.20.0 - 2026-08-12
- FIX: Leaflet-Karte und asynchrone Render-Fortsetzungen beim Seitenwechsel sauber freigeben (F-57): `teardownPegelwatch()` ruft `state.map.remove()` auf und nullt Map-, Chart- und Timer-Referenzen; die Timer-Erzeugung nach `loadDataAndRender(...).then(...)` sowie das per Marker-Klick geplante `setTimeout(renderDashboard)` sind per `state.disposed`-Guard vor Wiederauferstehung nach dem Teardown geschützt; der äußere Promise-`.catch` prüft ebenfalls `state.disposed` vor `renderFatalError` und der defensive Detached-Interval-Zweig setzt `state.disposed`, ruft `teardownPegelwatch()` und entfernt die Instanz aus `pegelwatchInstances`, sodass späte Fortsetzungen nach `onPageLeave` keinen DOM-Fehler mehr rendern

## 1.19.0 - 2026-08-12
- FIX: `app/index.html` auf den Template-Stand (F-47): Datei byte-gleich aus `oda-generic` übernommen — gültiges HTML, deutsche ARIA-Labels, Footer im Body; Titel und Fußzeile bleiben Platzhalter und werden zur Laufzeit aus der Instanz-Config überschrieben

## 1.18.0 - 2026-08-12
- FIX: Alarm-Schwellen kapseln Storage-Zugriffe in try/catch — bei blockiertem Browserspeicher bricht das Rendern der Stationsliste nicht mehr ab, die App läuft ohne Persistenz weiter (F-50)

## 1.17.0 - 2026-08-11
- FIX: Laufzeitressourcen beim Seitenwechsel freigeben (F-43): neuer Top-Level-Hook `onPageLeave(page)`, der den 5-Minuten-Aktualisierungs-Timer stoppt, das Chart zerstört und den Container-State aufraeumt (ueber `teardownPegelwatch`); das `disposed`-Flag macht späte Timer-/Fetch-Renders (nach der await-Grenze in `loadDataAndRender`) wirkungslos — beim Wechsel auf eine Unterseite laufen keine Hintergrund-Renders mehr

## 1.16.0 - 2026-08-11
- FIX: XSS- und URL-Vertrag geschlossen (F-35): neuer Top-Level-Helfer `safeHttpUrl`; der PEGELONLINE-Button wird nur noch gerendert, wenn `pegelonline_url` ein gültiges http(s)-Schema hat (zusaetzlich zum bestehenden Attribut-Escaping)

## 1.15.0 - 2026-08-07
- FIX: Bootstrap-Ziele der Methodikbox instanzeindeutig gemacht (F-32) – `data-bs-target`, `aria-controls` und die zugehoerige div-ID der ausklappbaren Methodikbox erhalten eine per Instanz vergebene Kennung, damit zwei Instanzen derselben App auf einer Seite nicht mehr kollidieren

## 1.12.0 - 2026-08-06
- FIX: Base auf Template oda-generic 1.6.0 vereinheitlicht (Hook renderPageOverride)

## 1.11.0 - 2026-08-04
- FIX: Datenschutzhinweis nach Vendoring aktualisiert (F-07 Teil 2) — „Beim Aufruf kontaktierte Drittanbieter" nennt die vendorten Bibliotheken nicht mehr; weiterhin extern geladene Dienste (Kartenkacheln) bleiben genannt

## 1.10.0 - 2026-08-04
- FIX: Bootstrap und Chart.js vendored in `app/vendor/` statt von CDN geladen (F-07 Teil 2) — Standalone-Betrieb lädt diese Bibliotheken nicht mehr extern

## 1.9.0 - 2026-08-04
- FIX: Drittanbieter (CDN, Kartendienste) in `datenschutz`-Default und README dokumentiert (F-07 Teil 1)
- FIX: Bootstrap CSS/JS auf einheitlich 5.3.8 gezogen (vorher gemischt 5.3.0/5.3.1 bzw. 5.3.0/5.3.0) (F-31)

## 1.8.0 - 2026-07-31
- CHG: toter Konfigurationsschlüssel lizenz entfernt (F-17)
- CHG: brandingCSS und brandingCSSFile als Base-Abhängigkeiten deklariert und lokal gespiegelt (F-17)

## 1.7.0 - 2026-07-30

- **FIX:** Laufzeitfehler nach dem Laden der Konfiguration werden jetzt sichtbar gemeldet; `handleRouting()` wird `await`et und besitzt einen Fehlerpfad. Bisher blieb die Seite bei einem Fehler im Seitenaufbau stumm leer
- **FIX:** `getConfigUrl()` schneidet bei einer URL ohne abschliessenden Schraegstrich nicht mehr das letzte Verzeichnis ab; die Konfiguration wird auch unter `.../app` gefunden
- **FIX:** Klick auf einen Hash-Link, der bereits die aktive Seite bezeichnet, rendert die Seite neu (`setupSamePageLinks()`) - das Logo fuehrt damit aus Unteransichten zurueck zur Startseite
- **ENH:** `app/app-base.js` ist wieder byte-identisch zum Template `oda-generic` 1.4.0; app-spezifisches Aufraeumen laeuft ueber den neuen Hook `onPageLeave(page)` in `app/app.js`

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
