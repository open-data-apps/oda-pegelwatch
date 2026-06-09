/*
 * Pegelwatch
 *
 * App-spezifische Logik fuer die ODAS-Startseite.
 * Template-Dateien wie app-base.js bleiben unveraendert.
 */

const PEGELWATCH_DEFAULTS = {
  title: "Pegelwatch",
  apiurl: "https://open-data-musterstadt.ckan.de/api/3/action/",
  messstellenResourceId: "49306025-b8fa-49eb-b39b-dceb697ba557",
  messwerteResourceId: "a76c531e-fd9c-4fc4-a783-6d503446796d",
  refreshMs: 5 * 60 * 1000,
};

const PEGELWATCH_DEPENDENCIES = {
  chartJs: "https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.min.js",
};

const EPSG_31467_DEFINITION =
  "+proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +towgs84=598.1,73.7,418.2,0.202,0.045,-2.455,6.7 +units=m +no_defs";

const GERMAN_MONTHS = {
  januar: 0,
  jan: 0,
  februar: 1,
  feb: 1,
  maerz: 2,
  marz: 2,
  "märz": 2,
  mrz: 2,
  april: 3,
  apr: 3,
  mai: 4,
  juni: 5,
  jun: 5,
  juli: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  oktober: 9,
  okt: 9,
  november: 10,
  nov: 10,
  dezember: 11,
  dez: 11,
};

const dependencyCache = {};

function app(configdata = {}, enclosingHtmlDivElement) {
  if (!enclosingHtmlDivElement) {
    return "";
  }

  teardownPegelwatch(enclosingHtmlDivElement);

  const state = {
    config: normalizeAppConfig(configdata),
    stations: [],
    measurements: [],
    joinedStations: [],
    selectedStationId: null,
    sortKey: "name",
    sortDirection: "asc",
    lastLoadedAt: null,
    chart: null,
    refreshTimer: null,
    timeframe: 24,
  };

  enclosingHtmlDivElement._pegelWatchState = state;
  renderLoading(enclosingHtmlDivElement, state.config);

  loadDependencies()
    .then(() => loadDataAndRender(enclosingHtmlDivElement, state, false))
    .then(() => {
      state.refreshTimer = setInterval(() => {
        if (!document.body.contains(enclosingHtmlDivElement)) {
          teardownPegelwatch(enclosingHtmlDivElement);
          return;
        }
        loadDataAndRender(enclosingHtmlDivElement, state, true);
      }, PEGELWATCH_DEFAULTS.refreshMs);
    })
    .catch((error) => renderFatalError(enclosingHtmlDivElement, state.config, error));

  return null;
}

/*
 * Diese Funktion kann Bibliotheken und benoetigte Skripte laden.
 * App-spezifische Bibliotheken werden dynamisch in loadDependencies() geladen.
 */
function addToHead() {}

function normalizeAppConfig(config = {}) {
  return {
    ...config,
    titel: String(config.titel || PEGELWATCH_DEFAULTS.title),
    apiurl: String(config.apiurl || PEGELWATCH_DEFAULTS.apiurl),
    messstellenResourceId: String(
      config.messstellenResourceId || PEGELWATCH_DEFAULTS.messstellenResourceId
    ),
    messwerteResourceId: String(
      config.messwerteResourceId || PEGELWATCH_DEFAULTS.messwerteResourceId
    ),
    proxyAktiv: String(config.proxyAktiv || "nein").trim().toLowerCase(),
    urlDaten: String(config.urlDaten || ""),
  };
}

function teardownPegelwatch(container) {
  const state = container && container._pegelWatchState;
  if (!state) return;

  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
  }
  if (state.chart && typeof state.chart.destroy === "function") {
    state.chart.destroy();
  }

  container._pegelWatchState = null;
}

function loadDependencies() {
  loadCss("app.css?v=1.3.0");
  return Promise.all([
    loadScript(PEGELWATCH_DEPENDENCIES.chartJs),
  ]);
}

function loadScript(url) {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }
  if (dependencyCache[url]) {
    return dependencyCache[url];
  }
  if (document.querySelector(`script[src="${url}"]`)) {
    dependencyCache[url] = Promise.resolve();
    return dependencyCache[url];
  }

  dependencyCache[url] = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      delete dependencyCache[url];
      reject(new Error(`Bibliothek konnte nicht geladen werden: ${url}`));
    };
    document.head.appendChild(script);
  });

  return dependencyCache[url];
}

function loadCss(url) {
  if (typeof document === "undefined") {
    return;
  }
  if (document.querySelector(`link[href="${url}"]`)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Wie loadCss, gibt aber eine Promise zurück, die auflöst wenn die CSS geladen ist.
 * Wird für Leaflet-CSS genutzt, damit die Map erst nach dem CSS-Load initialisiert wird.
 */
function loadCssAsync(url) {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }
  if (document.querySelector(`link[href="${url}"]`)) {
    return Promise.resolve();
  }
  if (dependencyCache[url]) {
    return dependencyCache[url];
  }

  dependencyCache[url] = new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = resolve;
    link.onerror = resolve; // Im Fehlerfall trotzdem fortfahren
    document.head.appendChild(link);
  });

  return dependencyCache[url];
}

async function loadDataAndRender(container, state, silent) {
  setRefreshBusy(container, silent);

  const loadingTextEl = container.querySelector("#pegelwatch-loading-text");
  const refreshButton = container.querySelector("#pegelwatch-refresh");

  const onProgress = (loaded, total) => {
    const pct = total ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
    const msg = `Lade Messwerte: ${loaded} von ${total} geladen...`;
    if (loadingTextEl) {
      loadingTextEl.textContent = msg;
    }
    if (refreshButton) {
      refreshButton.textContent = `Lade (${pct}%)...`;
    }
    const progressBar = container.querySelector("#pegelwatch-progress-bar .progress-bar");
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
      progressBar.setAttribute("aria-valuenow", String(pct));
    }
  };

  try {
    const [stationsResponse, measurementsResponse] = await Promise.all([
      fetchCkanRecords(state.config, state.config.messstellenResourceId, 100, "Messstellen"),
      fetchCkanRecords(state.config, state.config.messwerteResourceId, null, "Messwerte", { sort: "zeitstempel desc" }, onProgress),
    ]);

    state.stations = stationsResponse;
    state.measurements = measurementsResponse;
    state.joinedStations = mergeStationsWithMeasurements(state.stations, state.measurements);
    state.lastLoadedAt = new Date();

    if (
      state.selectedStationId &&
      !state.joinedStations.some((station) => station.pegel_id === state.selectedStationId)
    ) {
      state.selectedStationId = null;
    }

    renderDashboard(container, state);
  } catch (error) {
    if (silent) {
      renderInlineError(container, error);
      setRefreshIdle(container);
    } else {
      renderFatalError(container, state.config, error);
    }
  }
}

async function fetchCkanRecords(config, resourceId, limit, label, extraParams = {}, onProgress) {
  let allRecords = [];
  let offset = 0;
  const pageSize = 500;

  while (true) {
    let currentLimit = pageSize;
    if (typeof limit === "number" && limit > 0) {
      currentLimit = Math.min(pageSize, limit - allRecords.length);
      if (currentLimit <= 0) break;
    }

    const params = { ...extraParams, offset };
    const url = buildCkanDatastoreUrl(config, resourceId, currentLimit, params);
    const rawContent = await fetchOdasResource(url, config);
    let data;

    try {
      data = JSON.parse(rawContent);
    } catch (error) {
      throw new Error(`${label}: Antwort ist kein gueltiges JSON.`);
    }

    if (!data || data.success !== true || !data.result || !Array.isArray(data.result.records)) {
      throw new Error(`${label}: CKAN-Antwort enthaelt keine Datensaetze.`);
    }

    const records = data.result.records;
    const total = typeof limit === "number" && limit > 0 ? Math.min(limit, data.result.total || 0) : (data.result.total || 0);
    allRecords.push(...records);

    if (typeof onProgress === "function") {
      onProgress(allRecords.length, total);
    }

    if (records.length < currentLimit || allRecords.length >= total) {
      break;
    }

    offset += pageSize;
  }

  return allRecords;
}

function buildCkanDatastoreUrl(config = {}, resourceId, limit = 100, extraParams = {}) {
  const baseUrl = normalizeCkanActionBase(config.apiurl || PEGELWATCH_DEFAULTS.apiurl);
  const url = new URL("datastore_search", baseUrl);
  url.searchParams.set("resource_id", resourceId);
  url.searchParams.set("limit", String(limit));

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function normalizeCkanActionBase(apiurl) {
  let baseUrl = String(apiurl || PEGELWATCH_DEFAULTS.apiurl).trim();
  if (!baseUrl) {
    baseUrl = PEGELWATCH_DEFAULTS.apiurl;
  }

  baseUrl = baseUrl.replace(/\/+$/, "");
  if (!/\/api\/(?:3\/)?action$/i.test(baseUrl)) {
    baseUrl = `${baseUrl}/api/3/action`;
  }

  return `${baseUrl}/`;
}

function isOdasProxyEnabled(config = {}) {
  return String(config.proxyAktiv || "").trim().toLowerCase() === "ja";
}

function extractPathFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch (error) {
    return String(url || "");
  }
}

function getOdasProxyEndpoint(targetUrl) {
  const appPath = window.location.pathname
    .replace(/\/index\.html?$/i, "")
    .replace(/\/+$/, "");
  return `${appPath}/odp-data?path=${encodeURIComponent(extractPathFromUrl(targetUrl))}`;
}

async function fetchOdasResource(targetUrl, config = {}) {
  if (isOdasProxyEnabled(config) && typeof window !== "undefined") {
    const response = await fetch(getOdasProxyEndpoint(targetUrl), { method: "POST" });
    if (!response.ok) {
      throw new Error(`ODAS-Proxy meldet HTTP ${response.status}.`);
    }

    const proxyData = await response.json();
    if (!proxyData || typeof proxyData.content !== "string") {
      throw new Error("ODAS-Proxy-Antwort enthaelt keinen content-String.");
    }
    return proxyData.content;
  }

  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Direkter Datenabruf meldet HTTP ${response.status}.`);
  }
  return response.text();
}

function mergeStationsWithMeasurements(stations = [], measurements = []) {
  const stationMap = new Map();

  stations.forEach((station) => {
    const id = String(station.pegel_id || station.id || station._id || "").trim();
    if (!id) return;

    stationMap.set(id, {
      ...station,
      pegel_id: id,
      currentValue: null,
      currentTimestamp: null,
      currentTimestampMs: null,
      history: [],
      trend: "unknown",
      active: isStationActive(station),
      maxLevel: null,
      minLevel: null,
      hourlyRateOfChange: null,
    });
  });

  measurements.forEach((measurement) => {
    const stationId = String(measurement.messstelle_id || "").trim();
    const station = stationMap.get(stationId);
    if (!station) return;

    const value = normalizePegelValue(measurement.pegelstand_in_m, station.pegelonline_unit);
    const timestampMs = parsePegelTimestamp(measurement.zeitstempel);
    if (value === null || timestampMs === null) return;

    station.history.push({
      value,
      timestamp: measurement.zeitstempel,
      timestampMs,
      raw: measurement,
    });
  });

  stationMap.forEach((station) => {
    station.history.sort((a, b) => a.timestampMs - b.timestampMs);
    const latest = station.history[station.history.length - 1] || null;
    const previous = station.history[station.history.length - 2] || null;

    if (latest) {
      station.currentValue = latest.value;
      station.currentTimestamp = latest.timestamp;
      station.currentTimestampMs = latest.timestampMs;
    }

    station.trend = calculateTrend(latest, previous);

    if (station.history.length > 0) {
      const values = station.history.map(entry => entry.value).filter(val => typeof val === "number");
      station.maxLevel = values.length ? Math.max(...values) : null;
      station.minLevel = values.length ? Math.min(...values) : null;
      station.hourlyRateOfChange = calculateRateOfChange(station.history);
    }
  });

  return Array.from(stationMap.values()).sort((a, b) =>
    String(a.name || a.pegel_id).localeCompare(String(b.name || b.pegel_id), "de")
  );
}

function calculateRateOfChange(history = []) {
  if (!Array.isArray(history) || history.length < 2) return null;

  const latest = history[history.length - 1];
  if (!latest || typeof latest.timestampMs !== "number" || typeof latest.value !== "number") {
    return null;
  }

  const targetTimeMs = latest.timestampMs - (60 * 60 * 1000);
  let closest = null;
  let minDiff = Infinity;

  for (let i = 0; i < history.length - 1; i++) {
    const entry = history[i];
    if (!entry || typeof entry.timestampMs !== "number" || typeof entry.value !== "number") {
      continue;
    }
    const diff = Math.abs(entry.timestampMs - targetTimeMs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  if (!closest) return null;

  // Do not accept measurements that deviate by more than 30 minutes from the 1-hour target
  const maxToleranceMs = 30 * 60 * 1000;
  if (minDiff > maxToleranceMs) {
    return null;
  }

  return latest.value - closest.value;
}

function normalizePegelValue(value, unit) {
  return parseNumber(value);
}

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value || "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePegelTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getTime();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const direct = Date.parse(raw);
  if (!Number.isNaN(direct)) {
    return direct;
  }

  const germanLong = raw.match(
    /(?:[A-Za-zÄÖÜäöü]{2,}\.?,?\s*)?(\d{1,2})\.\s*([A-Za-zÄÖÜäöü]+)\s+(\d{4})\s+(\d{1,2}):(\d{2})/
  );
  if (germanLong) {
    const [, day, monthName, year, hour, minute] = germanLong;
    const month = GERMAN_MONTHS[monthName.toLowerCase()];
    if (month !== undefined) {
      return new Date(
        Number(year),
        month,
        Number(day),
        Number(hour),
        Number(minute)
      ).getTime();
    }
  }

  const germanNumeric = raw.match(
    /(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,\s*|\s+)(\d{1,2}):(\d{2})/
  );
  if (germanNumeric) {
    const [, day, month, year, hour, minute] = germanNumeric;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ).getTime();
  }

  return null;
}

function calculateTrend(latest, previous) {
  if (!latest || !previous) {
    return "unknown";
  }

  const delta = latest.value - previous.value;
  if (delta > 0.005) return "up";
  if (delta < -0.005) return "down";
  return "stable";
}

function isStationActive(station = {}) {
  const value = String(station.aktiv ?? "").trim().toLowerCase();
  return value === "true" || value === "1" || value === "ja" || value === "aktiv";
}

function calculateMetrics(stations) {
  const values = stations
    .map((station) => station.currentValue)
    .filter((value) => typeof value === "number");
  const latestTimestamp = stations
    .map((station) => station.currentTimestampMs)
    .filter((value) => typeof value === "number")
    .sort((a, b) => b - a)[0];

  return {
    totalStations: stations.length,
    activeStations: stations.filter((station) => station.active).length,
    warnings: stations.filter((station) => isAlarmExceeded(station)).length,
    averageValue: values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null,
    latestTimestamp: latestTimestamp || null,
  };
}

function renderLoading(container, config) {
  container.innerHTML = `
    <section class="pegelwatch-shell" aria-live="polite">
      <div class="pegelwatch-loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Lade Pegeldaten...</span>
        </div>
        <div>
          <h1 class="h4 mb-1">${escapeHtml(config.titel)}</h1>
          <p class="mb-0 text-muted">Messstellen und Pegelwerte werden geladen.</p>
        </div>
      </div>
    </section>
  `;
}

function renderDashboard(container, state) {
  const stations = sortStations(state.joinedStations, state.sortKey, state.sortDirection);
  
  if (!state.selectedStationId && stations.length > 0) {
    state.selectedStationId = stations[0].pegel_id;
  }
  
  const selectedStation = stations.find((station) => station.pegel_id === state.selectedStationId) || stations[0];
  const metrics = calculateMetrics(state.joinedStations);

  if (state.chart && typeof state.chart.destroy === "function") {
    state.chart.destroy();
    state.chart = null;
  }

  const dropdownOptions = stations.map(s => {
    const isSel = s.pegel_id === state.selectedStationId ? "selected" : "";
    return `<option value="${escapeAttribute(s.pegel_id)}" ${isSel}>${escapeHtml(s.name || s.pegel_id)}</option>`;
  }).join("");

  const warning = selectedStation ? isAlarmExceeded(selectedStation) : false;
  const changeRateText = selectedStation && typeof selectedStation.hourlyRateOfChange === "number"
    ? `${selectedStation.hourlyRateOfChange > 0 ? "+" : ""}${(selectedStation.hourlyRateOfChange * 100).toFixed(0)} cm in der letzten Std.`
    : "nicht verfügbar";

  container.innerHTML = `
    <section class="pegelwatch-shell">
      <div id="pegelwatch-alerts"></div>
      
      <header class="pegelwatch-header mb-3">
        <div>
          <p class="pegelwatch-kicker mb-1">Neckar im Stadtgebiet Esslingen</p>
          <h1 class="h2 mb-2">${escapeHtml(state.config.titel)}</h1>
        </div>
        <div class="pegelwatch-actions">
          <span class="badge rounded-pill ${isOdasProxyEnabled(state.config) ? "text-bg-warning" : "text-bg-success"}">
            ${isOdasProxyEnabled(state.config) ? "ODAS-Proxy aktiv" : "Direktmodus"}
          </span>
          <button class="btn btn-primary btn-sm" type="button" id="pegelwatch-refresh">
            Aktualisieren
          </button>
        </div>
      </header>

      <div class="pegelwatch-statusbar mb-3">
        <span>Letzte Datenladung: ${formatDateTime(state.lastLoadedAt)}</span>
        <span>Neueste Messung: ${formatDateTime(metrics.latestTimestamp)}</span>
      </div>

      <div class="pegel-nav-bar mb-3">
        <button id="pegelwatch-prev" class="btn btn-outline-primary" type="button" aria-label="Vorherige Messstelle">
          &larr;<span class="d-none d-sm-inline"> Vorherige</span>
        </button>
        <select id="pegelwatch-station-select" class="form-select mx-2" aria-label="Messstelle auswählen">
          ${dropdownOptions}
        </select>
        <button id="pegelwatch-next" class="btn btn-outline-primary" type="button" aria-label="Nächste Messstelle">
          <span class="d-none d-sm-inline">Nächste </span>&rarr;
        </button>
      </div>

      ${selectedStation ? `
      <!-- Info-Leiste für ausgewählte Station -->
      <div class="pegel-info-bar mb-4">
        <div class="pegel-info-item">
          <span class="pegel-info-label">Gewässer / Standort</span>
          <span class="pegel-info-value">${escapeHtml(selectedStation.gewaesser || "keine Angabe")}</span>
        </div>
        <div class="pegel-info-item">
          <span class="pegel-info-label">Aktueller Pegel</span>
          <span class="pegel-info-value">${formatMeters(selectedStation.currentValue)}</span>
        </div>
        <div class="pegel-info-item">
          <span class="pegel-info-label">Trend &amp; Änderung</span>
          <span class="pegel-info-value">
            ${{ up: "↑", down: "↓", stable: "→", unknown: "–" }[selectedStation.trend] || "–"} 
            <span class="small font-monospace">(${escapeHtml(changeRateText)})</span>
          </span>
        </div>
        <div class="pegel-info-item">
          <span class="pegel-info-label">Status</span>
          <span class="pegel-info-value">
            <span class="badge ${warning ? 'text-bg-danger' : 'text-bg-success'}">
              ${warning ? 'Warnung' : selectedStation.currentValue === null ? 'Kein Wert' : 'Normal'}
            </span>
          </span>
        </div>
      </div>

      <!-- Verlaufskachel über volle Breite -->
      <section class="pegelwatch-panel mb-4">
        <div class="pegelwatch-panel-heading d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
          <h2 class="h5 mb-0">Pegelverlauf</h2>
          <div class="d-flex align-items-center">
            <label for="pegelwatch-timeframe-select" class="me-2 small fw-semibold text-muted mb-0">Zeitfenster:</label>
            <select id="pegelwatch-timeframe-select" class="form-select form-select-sm" style="width: auto;">
              <option value="24" ${state.timeframe === 24 ? "selected" : ""}>24 Std.</option>
              <option value="48" ${state.timeframe === 48 ? "selected" : ""}>48 Std.</option>
              <option value="72" ${state.timeframe === 72 ? "selected" : ""}>72 Std.</option>
              <option value="168" ${state.timeframe === 168 ? "selected" : ""}>7 Tage</option>
              <option value="720" ${state.timeframe === 720 ? "selected" : ""}>1 Monat</option>
              <option value="8760" ${state.timeframe === 8760 ? "selected" : ""}>1 Jahr</option>
            </select>
          </div>
        </div>
        <div class="pegelwatch-chart-wrap p-2 mb-3">
          <canvas id="pegel-chart" aria-label="Pegelverlauf" role="img"></canvas>
        </div>
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 px-3 pb-3 border-top pt-2 mt-2">
          <div>
            ${selectedStation.pegelonline_url ? `<a class="btn btn-outline-primary btn-sm w-100 w-sm-auto" href="${escapeAttribute(selectedStation.pegelonline_url)}" target="_blank" rel="noopener">PEGELONLINE öffnen</a>` : ""}
          </div>
          <span class="text-muted small">Letzte Messung: ${formatDateTime(selectedStation.currentTimestampMs)}</span>
        </div>
      </section>

      <!-- Detail- und Diagrammbereich (Stammdaten & Alarmschwelle) -->
      <div class="row g-4 mb-4">
        <div class="col-12">
          ${renderDetailPanel(selectedStation)}
        </div>
      </div>
      ` : `
      <div class="alert alert-info">Keine Messstellen-Daten vorhanden. Bitte laden Sie die Daten neu.</div>
      `}
    </section>
  `;

  initDashboardEvents(container, state);
  if (selectedStation) {
    renderChart(container, state, selectedStation);
  }
}

function renderMetricCard(label, value, subline, tone = "primary") {
  const isWarningTone = tone === "danger" && Number(value) > 0;
  const pulseDot = isWarningTone ? '<span class="pegel-metric-pulse-dot" aria-hidden="true"></span>' : '';
  
  return `
    <div class="col-md-4">
      <article class="pegelwatch-metric pegelwatch-metric-${tone}">
        <div class="d-flex justify-content-between align-items-start">
          <span>${escapeHtml(label)}</span>
          ${pulseDot}
        </div>
        <strong>${escapeHtml(String(value))}</strong>
        <small>${escapeHtml(subline)}</small>
      </article>
    </div>
  `;
}

function renderSortableHeader(key, label, state) {
  const active = state.sortKey === key;
  const direction = active && state.sortDirection === "asc" ? "aufsteigend" : "absteigend";
  const indicator = active ? (state.sortDirection === "asc" ? " A-Z" : " Z-A") : "";

  return `
    <th scope="col">
      <button class="pegelwatch-sort-button" type="button" data-sort-key="${key}" aria-label="${escapeHtml(label)} ${direction} sortieren">
        ${escapeHtml(label)}<span aria-hidden="true">${indicator}</span>
      </button>
    </th>
  `;
}

function renderStationRow(station, selectedStationId) {
  const selected = station.pegel_id === selectedStationId;
  const warning = isAlarmExceeded(station);
  const valueText = formatMeters(station.currentValue);

  return `
    <tr class="${selected ? "table-primary" : ""}">
      <td data-label="Messstelle">
        <div class="pegelwatch-cell-stack">
          <button class="btn btn-link p-0 text-start fw-semibold pegelwatch-station-link" type="button" data-station-id="${escapeAttribute(station.pegel_id)}">
            ${escapeHtml(station.name || station.pegel_id)}
          </button>
          <div class="text-muted small">Nr. ${escapeHtml(station.nummer || "nicht angegeben")}</div>
        </div>
      </td>
      <td data-label="Gewässer / Standort">
        <div class="pegelwatch-cell-stack">
          <span>${escapeHtml(station.gewaesser || "nicht angegeben")}</span>
          <div class="text-muted small">${escapeHtml(station.standort || "nicht angegeben")}</div>
        </div>
      </td>
      <td data-label="Aktueller Pegel"><span class="pegelwatch-value">${valueText}</span></td>
      <td data-label="Trend">${renderTrend(station.trend)}</td>
      <td data-label="Status">
        <span class="badge ${warning ? "text-bg-danger" : "text-bg-primary"}">
          ${warning ? "Warnung" : station.currentValue === null ? "Kein Wert" : "Normal"}
        </span>
      </td>
    </tr>
  `;
}

function renderDetailPanel(station) {
  if (!station) {
    return `
      <section class="pegelwatch-panel">
        <h2 class="h5 mb-2">Detailansicht</h2>
        <p class="mb-0 text-muted">
          Wähle eine Messstelle aus, um Details zu sehen.
        </p>
      </section>
    `;
  }

  const threshold = getAlarmThreshold(station.pegel_id);
  const warning = isAlarmExceeded(station);
  const changeText = typeof station.hourlyRateOfChange === "number"
    ? `${station.hourlyRateOfChange > 0 ? "+" : ""}${(station.hourlyRateOfChange * 100).toFixed(0)} cm in der letzten Std.`
    : "nicht verfügbar";

  return `
    <section class="pegelwatch-panel" id="pegelwatch-detail">
      <div class="pegelwatch-panel-heading border-bottom pb-2 mb-3">
        <div>
          <h2 class="h5 mb-0">${escapeHtml(station.name || station.pegel_id)}</h2>
          <span class="text-muted small">${escapeHtml(station.gewaesser || "Gewässer nicht angegeben")}</span>
        </div>
      </div>

      <div class="px-3 pb-3">
        <div class="row g-4">
          <!-- Stammdaten Links -->
          <div class="col-md-6">
            <h3 class="h6 fw-bold mb-3">Stammdaten</h3>
            <dl class="row small mb-0">
              <dt class="col-6 col-sm-5">Pegel-ID</dt>
              <dd class="col-6 col-sm-7">${escapeHtml(station.pegel_id)}</dd>
              <dt class="col-6 col-sm-5">Amtliche Nummer</dt>
              <dd class="col-6 col-sm-7">${escapeHtml(station.nummer || "nicht angegeben")}</dd>
              <dt class="col-6 col-sm-5">Standort</dt>
              <dd class="col-6 col-sm-7">${escapeHtml(station.standort || "nicht angegeben")}</dd>
              <dt class="col-6 col-sm-5">Aktueller Wert</dt>
              <dd class="col-6 col-sm-7">${formatMeters(station.currentValue)}</dd>
              <dt class="col-6 col-sm-5">Historisches Min</dt>
              <dd class="col-6 col-sm-7">${formatMeters(station.minLevel)}</dd>
              <dt class="col-6 col-sm-5">Historisches Max</dt>
              <dd class="col-6 col-sm-7">${formatMeters(station.maxLevel)}</dd>
              <dt class="col-6 col-sm-5">Änderungsrate</dt>
              <dd class="col-6 col-sm-7">${escapeHtml(changeText)}</dd>
            </dl>
          </div>

          <!-- Alarmschwelle Rechts -->
          <div class="col-md-6">
            <h3 class="h6 fw-bold mb-3">Alarmschwellen-Konfiguration</h3>
            <div class="pegelwatch-threshold ${warning ? "pegelwatch-threshold-warning" : ""}">
              <label class="form-label fw-semibold" for="pegelwatch-threshold-input">Lokale Alarmschwelle in Metern</label>
              <div class="input-group input-group-sm">
                <input class="form-control" id="pegelwatch-threshold-input" type="number" min="0" step="0.01" value="${threshold === null ? "" : escapeAttribute(String(threshold))}" placeholder="z. B. 1.80">
                <button class="btn btn-primary" type="button" id="pegelwatch-save-threshold">Speichern</button>
                <button class="btn btn-outline-secondary" type="button" id="pegelwatch-clear-threshold">Zurücksetzen</button>
              </div>
              <p class="small mb-0 mt-2 text-muted">
                Die Schwelle wird nur in diesem Browser gespeichert.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function initDashboardEvents(container, state) {
  const refreshButton = container.querySelector("#pegelwatch-refresh");
  if (refreshButton) {
    refreshButton.addEventListener("click", () => loadDataAndRender(container, state, true));
  }

  // Diashow Navigation Events
  const selectEl = container.querySelector("#pegelwatch-station-select");
  if (selectEl) {
    selectEl.addEventListener("change", (e) => {
      state.selectedStationId = e.target.value;
      renderDashboard(container, state);
    });
  }

  const timeframeEl = container.querySelector("#pegelwatch-timeframe-select");
  if (timeframeEl) {
    timeframeEl.addEventListener("change", (e) => {
      state.timeframe = parseInt(e.target.value, 10);
      renderDashboard(container, state);
    });
  }

  const stationsList = sortStations(state.joinedStations, state.sortKey, state.sortDirection);
  
  const prevBtn = container.querySelector("#pegelwatch-prev");
  if (prevBtn && stationsList.length > 1) {
    prevBtn.addEventListener("click", () => {
      const currentIndex = stationsList.findIndex(s => s.pegel_id === state.selectedStationId);
      const nextIndex = (currentIndex - 1 + stationsList.length) % stationsList.length;
      state.selectedStationId = stationsList[nextIndex].pegel_id;
      renderDashboard(container, state);
    });
  }

  const nextBtn = container.querySelector("#pegelwatch-next");
  if (nextBtn && stationsList.length > 1) {
    nextBtn.addEventListener("click", () => {
      const currentIndex = stationsList.findIndex(s => s.pegel_id === state.selectedStationId);
      const nextIndex = (currentIndex + 1) % stationsList.length;
      state.selectedStationId = stationsList[nextIndex].pegel_id;
      renderDashboard(container, state);
    });
  }

  const saveButton = container.querySelector("#pegelwatch-save-threshold");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const input = container.querySelector("#pegelwatch-threshold-input");
      setAlarmThreshold(state.selectedStationId, parseNumber(input && input.value));
      state.joinedStations = mergeStationsWithMeasurements(state.stations, state.measurements);
      renderDashboard(container, state);
    });
  }

  const clearButton = container.querySelector("#pegelwatch-clear-threshold");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      setAlarmThreshold(state.selectedStationId, null);
      renderDashboard(container, state);
    });
  }
}

function initMap(container, state) {
  const mapElement = container.querySelector("#pegel-map");
  if (!mapElement) return;

  // Fallback-Mindesthöhe: Wenn die externe CSS noch nicht geladen ist,
  // hätte die Karte 0px Höhe und wäre unsichtbar.
  if (!mapElement.offsetHeight) {
    mapElement.style.height = "430px";
  }

  if (typeof L === "undefined") {
    mapElement.innerHTML = `<div class="alert alert-warning m-3">Leaflet konnte nicht geladen werden.</div>`;
    return;
  }

  state.map = L.map(mapElement, {
    scrollWheelZoom: false,
  }).setView([48.742, 9.31], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
    subdomains: "abc",
    maxZoom: 19
  }).addTo(state.map);

  const bounds = [];

  state.joinedStations.forEach((station) => {
    const coords = convertEpsg31467ToWgs84(station.rechtswert, station.hochwert);
    if (!coords) return;

    // valueText: "kein Wert" → kompakter "k. A." auf der Karte
    const warning = isAlarmExceeded(station);
    const selected = station.pegel_id === state.selectedStationId;
    const trendArrowSymbol = { up: "↑", down: "↓", stable: "→" }[station.trend] || "";
    const trendClass = { up: "pegel-marker-trend-up", down: "pegel-marker-trend-down", stable: "pegel-marker-trend-stable" }[station.trend] || "";
    const markerValueText = station.currentValue !== null && typeof station.currentValue === "number"
      ? formatMeters(station.currentValue)
      : "k. A.";

    const markerHtml = `
      <div class="pegel-map-marker ${warning ? 'warning' : ''} ${selected ? 'selected' : ''}">
        ${warning ? '<div class="pegel-marker-pulse"></div>' : ''}
        <div class="pegel-marker-badge">
          <span>${escapeHtml(markerValueText)}</span>
          <span class="${trendClass}">${escapeHtml(trendArrowSymbol)}</span>
        </div>
        <div class="pegel-marker-name">${escapeHtml(station.name || station.pegel_id)}</div>
      </div>
    `;

    const markerIcon = L.divIcon({
      html: markerHtml,
      className: "pegel-custom-marker-container",
      // iconSize null: Leaflet soll keine feste Größe erzwingen – der Marker ist width:auto in CSS
      iconSize: null,
      iconAnchor: [0, 0],
    });

    const marker = L.marker([coords.lat, coords.lon], {
      icon: markerIcon,
    }).addTo(state.map);

    marker.bindPopup(`
      <strong>${escapeHtml(station.name || station.pegel_id)}</strong><br>
      Pegel: ${formatMeters(station.currentValue)}<br>
      Status: ${warning ? "Warnung" : "Normal"}
    `);

    marker.on("click", () => {
      state.selectedStationId = station.pegel_id;
      // setTimeout hebt renderDashboard aus dem Leaflet-Event-Stack,
      // damit state.map.remove() nicht innerhalb eines aktiven Leaflet-Events aufgerufen wird.
      setTimeout(() => renderDashboard(container, state), 0);
    });

    bounds.push([coords.lat, coords.lon]);
  });

  if (bounds.length >= 1) {
    state.map.fitBounds(bounds, { padding: [24, 24] });
  }

  // invalidateSize mehrfach aufrufen für robuste Initialisierung im ODAS-System
  setTimeout(() => {
    if (state.map) {
      state.map.invalidateSize();
    }
  }, 200);
  setTimeout(() => {
    if (state.map) {
      state.map.invalidateSize();
    }
  }, 600);
}

function formatChartLabel(timestampMs, timeframe) {
  const date = new Date(timestampMs);
  if (isNaN(date.getTime())) return "";

  const pad = (num) => String(num).padStart(2, "0");
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const HH = pad(date.getHours());
  const MM = pad(date.getMinutes());

  if (timeframe <= 72) {
    return `${HH}:${MM}`;
  } else if (timeframe === 168) { // 7 Tage
    return `${dd}.${mm}. ${HH}:${MM}`;
  } else if (timeframe === 720) { // 1 Monat
    return `${dd}.${mm}.`;
  } else if (timeframe === 8760) { // 1 Jahr
    return `${mm}.${yyyy}`;
  }
  return `${dd}.${mm}. ${HH}:${MM}`;
}

function renderChart(container, state, station) {
  const canvas = container.querySelector("#pegel-chart");
  if (!canvas || !station || typeof Chart === "undefined") {
    return;
  }

  // Hintergrund-Verlauf für das Canvas-Becken
  canvas.style.background = "linear-gradient(to bottom, #f0f8ff, #ffffff)";
  canvas.style.borderRadius = "6px";

  const ctx = canvas.getContext("2d");
  const chartHeight = canvas.clientHeight || 460;
  
  // Vertikaler Wasser-Gradient unter der Linie
  const waterGradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
  waterGradient.addColorStop(0, "rgba(24, 123, 166, 0.65)"); // Oberfläche: lebendiges Wasserblau
  waterGradient.addColorStop(0.3, "rgba(24, 123, 166, 0.35)");
  waterGradient.addColorStop(1, "rgba(24, 123, 166, 0.02)");  // Boden: fast transparent

  // Filtere die Historie für das Chart auf das gewählte Zeitfenster relativ zur neuesten Messung
  const latestEntry = station.history[station.history.length - 1];
  const latestMs = latestEntry ? latestEntry.timestampMs : Date.now();
  const hours = state.timeframe || 24;
  const cutoffMs = latestMs - hours * 60 * 60 * 1000;

  let labels = [];
  let values = [];

  if (hours <= 72) {
    // Für Stundenansichten (24h, 48h, 72h) keine Resampling-Lücken anzeigen
    const chartHistory = station.history.filter((entry) => entry.timestampMs >= cutoffMs);
    labels = chartHistory.map((entry) => formatChartLabel(entry.timestampMs, hours));
    values = chartHistory.map((entry) => entry.value);
  } else {
    // Für Mehrtages- und Jahresansichten (7d, 1m, 1y) resampling mit Lücken
    const N = hours <= 168 ? 84 : // 7 Tage
              hours <= 720 ? 60 : // 1 Monat
              73; // 1 Jahr

    const stepMs = (latestMs - cutoffMs) / (N - 1);
    const tolerance = stepMs * 1.5;

    for (let i = 0; i < N; i++) {
      const binTimeMs = cutoffMs + i * stepMs;
      
      let closestEntry = null;
      let minDiff = Infinity;
      for (const entry of station.history) {
        const diff = Math.abs(entry.timestampMs - binTimeMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestEntry = entry;
        }
      }

      labels.push(formatChartLabel(binTimeMs, hours));

      if (closestEntry && minDiff <= tolerance) {
        values.push(closestEntry.value);
      } else {
        values.push(null);
      }
    }
  }

  const datasets = [
    {
      label: "Pegelstand (m)",
      data: values,
      borderColor: "#0077b6",
      backgroundColor: waterGradient,
      fill: true,
      pointRadius: 0, // Keine störenden Punkte im Normalzustand (verhindert Überfüllung)
      pointHitRadius: 10, // Leichtes Hovern auch auf Mobilgeräten
      pointBackgroundColor: "#ffffff",
      pointBorderColor: "#0077b6",
      pointBorderWidth: 2,
      pointHoverRadius: 6, // Punkt erscheint beim Hovern
      pointHoverBackgroundColor: "#0077b6",
      pointHoverBorderColor: "#ffffff",
      borderWidth: 3,
      tension: 0.4, // Geschmeidige Kurve ("Welle")
    },
  ];

  const threshold = getAlarmThreshold(station.pegel_id);
  if (threshold !== null && values.length) {
    datasets.push({
      label: "Lokale Alarmschwelle",
      data: values.map(() => threshold),
      borderColor: "#c53434",
      borderDash: [6, 6],
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
    });
  }

  state.chart = new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 12 },
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            autoSkipPadding: 15,
            maxTicksLimit: window.innerWidth < 576 ? 6 : 12,
            maxRotation: 0,
            minRotation: 0,
          },
        },
        y: {
          title: {
            display: true,
            text: "Meter",
          },
        },
      },
    },
  });
}

function sortStations(stations, key, direction) {
  const factor = direction === "desc" ? -1 : 1;
  return [...stations].sort((a, b) => {
    if (key === "value") {
      return compareStationValues(a.currentValue, b.currentValue, direction);
    }
    if (key === "alarm") {
      return (Number(isAlarmExceeded(a)) - Number(isAlarmExceeded(b))) * factor;
    }
    if (key === "trend") {
      return String(a.trend).localeCompare(String(b.trend), "de") * factor;
    }
    if (key === "location") {
      return `${a.gewaesser || ""} ${a.standort || ""}`.localeCompare(
        `${b.gewaesser || ""} ${b.standort || ""}`,
        "de"
      ) * factor;
    }
    return String(a.name || a.pegel_id).localeCompare(String(b.name || b.pegel_id), "de") * factor;
  });
}

function compareNullableNumbers(a, b) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function compareStationValues(a, b, direction) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "desc" ? b - a : a - b;
}

function convertEpsg31467ToWgs84(rechtswert, hochwert) {
  const x = parseNumber(rechtswert);
  const y = parseNumber(hochwert);
  if (x === null || y === null) {
    return null;
  }

  if (typeof proj4 !== "undefined") {
    try {
      if (!proj4.defs("EPSG:31467")) {
        proj4.defs("EPSG:31467", EPSG_31467_DEFINITION);
      }
      const [lon, lat] = proj4("EPSG:31467", "EPSG:4326", [x, y]);
      return { lat, lon };
    } catch (error) {
      console.warn("Koordinatentransformation fehlgeschlagen, nutze Fallback.", error);
    }
  }

  return {
    lon: 9 + (x - 3500000) / 74000,
    lat: 48.74 + (y - 5400000) / 111000,
  };
}

function getAlarmThreshold(stationId) {
  if (!stationId || typeof localStorage === "undefined") {
    return null;
  }
  const stored = localStorage.getItem(getAlarmStorageKey(stationId));
  const value = parseNumber(stored);
  return value !== null && value > 0 ? value : null;
}

function setAlarmThreshold(stationId, value) {
  if (!stationId || typeof localStorage === "undefined") {
    return;
  }
  if (value === null || value <= 0) {
    localStorage.removeItem(getAlarmStorageKey(stationId));
  } else {
    localStorage.setItem(getAlarmStorageKey(stationId), String(value));
  }
}

function getAlarmStorageKey(stationId) {
  return `pegel_alarm_${stationId}`;
}

function isAlarmExceeded(station) {
  const threshold = getAlarmThreshold(station.pegel_id);
  return threshold !== null && typeof station.currentValue === "number" && station.currentValue > threshold;
}

function renderTrend(trend) {
  const labels = {
    up: ["steigend", "text-danger"],
    down: ["fallend", "text-success"],
    stable: ["stabil", "text-muted"],
    unknown: ["unbekannt", "text-muted"],
  };
  const [label, className] = labels[trend] || labels.unknown;
  return `<span class="${className}">${label}</span>`;
}

function renderInlineError(container, error) {
  const alerts = container.querySelector("#pegelwatch-alerts");
  if (!alerts) return;

  alerts.innerHTML = `
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <strong>Aktualisierung fehlgeschlagen:</strong> ${escapeHtml(error.message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
    </div>
  `;
}

function renderFatalError(container, config, error) {
  container.innerHTML = `
    <section class="pegelwatch-shell">
      <div class="alert alert-danger" role="alert">
        <h1 class="h4 alert-heading">Pegeldaten konnten nicht geladen werden</h1>
        <p>
          Bitte pruefe die CKAN-Action-API, die beiden Ressourcen-IDs und den Proxy-Schalter.
          Bei CORS-Problemen kann die Instanz-Konfiguration <code>proxyAktiv</code> auf <code>ja</code> gesetzt werden.
        </p>
        <hr>
        <p class="mb-2"><strong>Modus:</strong> ${isOdasProxyEnabled(config) ? "ODAS-Proxy" : "Direkter Abruf"}</p>
        <p class="mb-0"><strong>Fehler:</strong> <code>${escapeHtml(error.message)}</code></p>
      </div>
    </section>
  `;
}

function setRefreshBusy(container, silent) {
  const button = container.querySelector("#pegelwatch-refresh");
  if (button) {
    button.disabled = true;
    button.textContent = "Aktualisiere...";
  }

  // Erstelle Fortschrittsanzeige (Ladeanimation)
  let progress = container.querySelector("#pegelwatch-progress-bar");
  if (!progress) {
    progress = document.createElement("div");
    progress.id = "pegelwatch-progress-bar";
    progress.className = "progress position-fixed top-0 start-0 w-100 rounded-0";
    progress.style.height = "4px";
    progress.style.zIndex = "9999";
    progress.innerHTML = `
      <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: 0%"></div>
    `;
    container.appendChild(progress);
  }
}

function setRefreshIdle(container) {
  const button = container.querySelector("#pegelwatch-refresh");
  if (!button) return;
  button.disabled = false;
  button.textContent = "Aktualisieren";
}

function formatMeters(value) {
  if (typeof value !== "number") {
    return "kein Wert";
  }
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`;
}

function formatDateTime(value) {
  const timestamp = parsePegelTimestamp(value);
  if (timestamp === null) {
    return "nicht bekannt";
  }
  return new Date(timestamp).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value) {
  const timestamp = parsePegelTimestamp(value);
  if (timestamp === null) {
    return "";
  }
  return new Date(timestamp).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildCkanDatastoreUrl,
    calculateRateOfChange,
    calculateTrend,
    convertEpsg31467ToWgs84,
    extractPathFromUrl,
    fetchOdasResource,
    formatChartLabel,
    isOdasProxyEnabled,
    mergeStationsWithMeasurements,
    normalizeAppConfig,
    normalizeCkanActionBase,
    normalizePegelValue,
    parsePegelTimestamp,
    sortStations,
  };
}
