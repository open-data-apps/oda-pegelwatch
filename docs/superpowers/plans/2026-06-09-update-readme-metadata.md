# Update README and app-package.json Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `README.md` and `app-package.json` to reflect the major UI and logic changes (removing Map, Table, and Aquarium references, adding Slideshow navigation, timeframe selection dropdown, conditional resampling, and spacing fixes).

**Architecture:**
- Modify `README.md` to describe the new diagram-centric slideshow UI, timeframe options, and conditional resampling behavior.
- Modify `app-package.json` to bump version to `1.2.0` and update description texts to match the mapless, slideshow-based layout.
- Run `make zip` to rebuild the release package.

---

### Task 1: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Edit README.md**
  Update the "Funktionen" and description texts to match the new dashboard.
  Replace lines 1-17 with:
  ```markdown
  # Pegelwatch

  **Pegelwatch** ist eine ODAS-App zur kompakten, diagrammzentrierten Visualisierung von Pegelständen am Neckar im Stadtgebiet Esslingen am Neckar. Die App verbindet Messstellen-Stammdaten mit aktuellen Messwerten, bietet ein großes Verlaufschart mit einstellbarem Zeitfenster (24h, 48h, 72h, 7 Tage, 1 Monat, 1 Jahr), ein Info-Panel pro Station und eine Dia-Show-Navigation (Vorherige/Nächste und Dropdown) zur schnellen Stationsauswahl.

  Die App ist für den [Open Data App Store](https://open-data-app-store.de/) umgesetzt und folgt der [Open-Data-App-Spezifikation](https://open-data-apps.github.io/open-data-app-docs/open-data-app-spezifikation/). Sie basiert auf dem `oda-generic`-Modell: App-spezifische Logik liegt in [app/app.js](app/app.js), App-spezifisches Styling in [app/app.css](app/app.css).

  ## Funktionen

  - **Dia-Show-Navigation**: Durchschalten der Messstellen via "Vorherige" / "Nächste" Buttons oder gezielte Auswahl über das Dropdown-Menü.
  - **Diagrammzentrierter Verlauf**: Großes Pegelstands-Chart (Chart.js) mit Unterstützung für unterschiedliche Zeitfenster (24h, 48h, 72h, 7 Tage, 1 Monat, 1 Jahr).
  - **Konditionales Resampling & Datenlücken**:
    - *Kurzzeitverlauf (<= 72 Std.)*: Stetiger Linienverlauf ohne künstliche Gaps zur detaillierten Trendbeobachtung.
    - *Langzeitverlauf (7 Tage, 1 Monat, 1 Jahr)*: Resampling auf ein gleichmäßiges Zeitgitter mit Erkennung von Datenlücken (Fehlzeiten werden im Chart leer gelassen).
  - **Optimierte X-Achse**: Horizontale, nicht rotierte Datums-/Zeitbeschriftungen mit automatischem Skipping und mobilem Limit zur Vermeidung von Überlagerungen.
  - **Detail- & Konfigurations-Panel**: Kachel für Stammdaten (Pegel-ID, Min/Max-Wert, Änderungsrate) und Alarmschwellen-Konfiguration in einem sauberen zweispaltigen Layout.
  - **Lokale Alarmschwellen**: Optische Warnungen (Status-Badge), die ausschließlich im `localStorage` des Browsers gespeichert werden.
  - **Direktmodus oder ODAS-Proxy-Modus** über die Instanz-Konfiguration `proxyAktiv`.
  - **Automatische Aktualisierung**: Daten-Refresh alle fünf Minuten mit visualisierter Ladeanimation.
  ```

---

### Task 2: Update app-package.json

**Files:**
- Modify: `app-package.json`

- [ ] **Step 1: Bump version and update descriptions**
  Update `app-package.json` to bump version to `1.2.0` and remove map/aquarium text.
  Change lines 6-15 and lines 97-99.

---

### Task 3: Rebuild ZIP Package

**Files:**
- Modify: `oda-wasserpegel.zip`

- [ ] **Step 1: Rebuild ZIP**
  Run: `make zip`
