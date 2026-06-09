# Pegelwatch

**Pegelwatch** ist eine ODAS-App zur kompakten Visualisierung von Pegelständen am Neckar im Stadtgebiet Esslingen am Neckar. Die App verbindet Messstellen-Stammdaten mit aktuellen Messwerten und bietet eine detailreiche Visualisierung der Messstelle über eine Diashow-Navigation, eine große Verlaufsgrafik mit flexiblen Zeitfenstern und lokaler Alarmschwelle.

Die App ist für den [Open Data App Store](https://open-data-app-store.de/) umgesetzt und folgt der [Open-Data-App-Spezifikation](https://open-data-apps.github.io/open-data-app-docs/open-data-app-spezifikation/). Sie basiert auf dem `oda-generic`-Modell: App-spezifische Logik liegt in [app/app.js](app/app.js), App-spezifisches Styling in [app/app.css](app/app.css).

## Funktionen

- **Diashow-Navigation**: Komfortables Umschalten zwischen den Messstellen über Vor-/Zurück-Buttons und ein direktes Dropdown-Auswahlfeld.
- **Flexible Zeitfenster**: Anpassbare Visualisierung des Pegelverlaufs für verschiedene Intervalle (24 Std., 48 Std., 72 Std., 7 Tage, 1 Monat, 1 Jahr).
- **Intelligente Datenaufbereitung**:
  - Kontinuierliche Kurvendarstellung ohne Lücken für kurze Intervalle (bis zu 72 Std.).
  - Automatisches Resampling in Datenkörbe (Bins) mit visuellen Lücken (`null`-Werte) für längere Intervalle (ab 7 Tage), damit Datenfehlbestände sofort im Chart erkennbar sind.
- **Optimierte Verlaufsgrafik**: Verdoppelte Charthöhe, weicher Kurvenverlauf (Bezier-Kurven), interaktive Punktanzeige nur bei Hover (um optische Überladung zu vermeiden) und ein ansprechendes Wasser-Farbverlauf-Design.
- **Unbeschränkter Datenabruf**: Seitenweise Abfrage von jeweils 500 Einträgen bis zur vollständigen Datenladung, begleitet von einer Ladeanimation und Fortschrittsanzeige.
- **Stammdaten & Links**: Anzeige von Messstellen-Details (historisches Min/Max, Trend, Änderungsrate) inklusive Direktlinks zum Open Data Portal und zu PEGELONLINE.
- **Lokale Alarmschwellen**: Individuell konfigurierbare Warnschwellen pro Messstelle, die im lokalen Speicher (`localStorage`) des Browsers hinterlegt werden.
- **Netzwerkmodi**: Wahlweise Direktabruf oder abgesicherter ODAS-Proxy-Modus über die Instanz-Konfiguration (`proxyAktiv`).
- **Auto-Refresh**: Automatische Datenaktualisierung alle fünf Minuten.

Die App zeigt lokale optische Warnungen auf Basis frei gesetzter Browser-Schwellen. Sie ersetzt keine amtliche Warnmeldung.

## Datenquelle

Das App-Konzept sieht zwei CKAN-DataStore-Ressourcen vor:

| Ressource | Zweck | Default |
| --- | --- | --- |
| `messstellenResourceId` | Stammdaten der Messstellen, inklusive Name, Gewässer, Standort, Koordinaten und PEGELONLINE-Verweis | `49306025-b8fa-49eb-b39b-dceb697ba557` |
| `messwerteResourceId` | Dynamische Pegel-Messwerte mit Zeitstempel, Messstellenreferenz und Wasserstand | `a76c531e-fd9c-4fc4-a783-6d503446796d` |

Die Standard-URLs zeigen auf das im Konzept genannte CKAN-Musterportal `open-data-musterstadt.ckan.de`. Für produktive ODAS-Instanzen müssen `apiurl`, `urlDaten` und die Ressourcen-IDs auf das reale Open-Data-Portal gesetzt werden.

## Konfiguration

Die App liest nur die fachlich nötigen Instanzfelder:

| Key | Typ | Beschreibung |
| --- | --- | --- |
| `apiurl` | `url` | CKAN Action API Basis-URL, z. B. `https://portal.example/api/3/action/` |
| `messstellenResourceId` | `string` | Ressourcen-ID der Messstellen-Stammdaten |
| `messwerteResourceId` | `string` | Ressourcen-ID der Pegel-Messwerte |
| `proxyAktiv` | `dropdown` | `nein` für Direktabruf, `ja` für ODAS-Proxy `/app/odp-data` |

Zusätzlich bleiben die template-eigenen ODAS-Felder wie `titel`, `seitentitel`, `icon`, `beschreibung`, `kontakt`, `impressum`, `datenschutz`, `fusszeile`, `brandingCSS` und `brandingCSSFile` erhalten. Die lokale Testkonfiguration liegt in [odas-config/config.json](odas-config/config.json) und spiegelt die in [app-package.json](app-package.json) deklarierten Instanzfelder.

## Proxy-Modell

Im Direktmodus ruft die App CKAN über `GET {apiurl}/datastore_search?...` ab. Wenn `proxyAktiv` auf `ja` steht, sendet sie `POST`-Anfragen an den ODAS-Proxy und übergibt nur Pfad und Query-String des Zielendpunkts als `path`-Parameter.

Lokale Tests können die Proxy-Konfiguration und UI-Anzeige prüfen. Echte Proxy-Antworten sind erst in der ODAS-Live-Umgebung vollständig verifizierbar.

## Lokale Entwicklung

### Live Server

Starte VS Code Live Server aus der Projektwurzel und öffne:

```text
http://127.0.0.1:<live-server-port>/app/
```

Empfohlene Einstellungen:

```json
{
  "liveServer.settings.host": "127.0.0.1",
  "liveServer.settings.root": "/",
  "liveServer.settings.file": "app/index.html"
}
```

Für Live-Server-Tests mit [odas-config/config.json](odas-config/config.json) muss der bereits vorhandene localhost-Block in `app/app-base.js` temporär aktiviert werden. Vor ZIP-Erstellung oder ODAS-Auslieferung muss dieser Block wieder auskommentiert sein, damit die App im ODAS ihre Konfiguration über `/app/config` lädt.

### Docker

```bash
make build
make up
```

Die genaue Portbelegung ergibt sich aus [docker-compose.yml](docker-compose.yml).

### Tests

Die Kernlogik der Datenverarbeitung kann ohne Browser geprüft werden:

```bash
node tools/app-core.test.js
```

Die Tests decken CKAN-URL-Erzeugung, ODAS-Proxy-Pfadextraktion, deutsche Pegel-Zeitstempel, Join-Logik, Einheiten-Normalisierung und Trendberechnung ab.

## Wichtige Dateien

| Datei | Beschreibung |
| --- | --- |
| [app/app.js](app/app.js) | Datenabruf, CKAN/Proxy-Logik, Join, Diashow-Steuerung, Detailansicht, Chart-Verlaufsgrafik und Auto-Refresh |
| [app/app.css](app/app.css) | App-spezifisches Styling des Dashboards und der Steuerelemente |
| [app-package.json](app-package.json) | ODAS-Metadaten und Instanz-Konfigurationsfelder |
| [odas-config/config.json](odas-config/config.json) | Lokale Testkonfiguration |
| [assets/schema.json](assets/schema.json) | Frictionless-ähnliches Schema der verknüpften Tabellenansicht |
| [assets/odas-app-icon.svg](assets/odas-app-icon.svg) | ODAS-App-Icon |

## Auslieferung

Die ODAS-ZIP-Datei wird über das Makefile erzeugt:

```bash
make zip
```

Der ZIP-Inhalt umfasst `app/`, `assets/`, `app-package.json` und `CHANGELOG.md`. Lokale Dateien wie `odas-config/` und `tools/` sind nicht Teil der produktiven ODAS-Auslieferung.

## Autor

© 2026, Ondics GmbH
