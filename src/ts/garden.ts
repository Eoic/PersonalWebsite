import { clamp } from "./utils";

export { };

type Species = "daisy" | "tulip" | "poppy" | "fern";
type Stage = "seed" | "sprout" | "bud" | "bloom" | "wilt";
type Tool = "plant" | "water" | "prune";
type Weather = "clear" | "cloudy" | "rain" | "fog" | "snow";
type Season = "winter" | "spring" | "summer" | "autumn";
type Health = "thriving" | "healthy" | "steady" | "struggling" | "dormant";
type WindDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
type WindStrength = "calm" | "light" | "steady" | "gusty";

type Cell = {
  stage: Stage;
  author: string;
  species: Species;
  plantedAt: number;
  lastWater: number;
};

type Activity = {
  msg: string;
  tick: number;
  type: string;
};

type SpritePart = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity?: number;
};

type Wind = {
  dx: number;
  dy: number;
  strength: WindStrength;
  direction: WindDirection;
};

const CELL_PX = 28;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const LS_KEY = "ks.garden.v1";
const SPECIES_LIST: Species[] = ["daisy", "tulip", "poppy", "fern"];
const WATER_WARN_MS = 1000 * 60 * 60 * 24 * 3;
const WILT_MS = 1000 * 60 * 60 * 24 * 14;
const TOUCH_TAP_SLOP_PX = 12;

const SPRITES: Record<Species, Record<Stage, SpritePart[]>> = {
  daisy: {
    seed: [{ x: 7, y: 11, width: 2 }, { x: 8, y: 12, opacity: 0.5 }],
    sprout: [
      { x: 8, y: 13, height: 2 },
      { x: 7, y: 11, opacity: 0.7 },
      { x: 9, y: 11, opacity: 0.7 },
      { x: 8, y: 10 },
    ],
    bud: [
      { x: 8, y: 10, height: 5 },
      { x: 7, y: 12, opacity: 0.5 },
      { x: 7, y: 8, width: 3, height: 2 },
      { x: 8, y: 7 },
    ],
    bloom: [
      { x: 8, y: 11, height: 4 },
      { x: 6, y: 13, width: 2, opacity: 0.55 },
      { x: 8, y: 4 },
      { x: 8, y: 9 },
      { x: 5, y: 6 },
      { x: 11, y: 6 },
      { x: 4, y: 8 },
      { x: 12, y: 8 },
      { x: 5, y: 10 },
      { x: 11, y: 10 },
      { x: 7, y: 5, width: 3, height: 4, opacity: 0.18 },
      { x: 6, y: 6, height: 2, opacity: 0.3 },
      { x: 10, y: 6, height: 2, opacity: 0.3 },
      { x: 7, y: 4, width: 2, opacity: 0.3 },
      { x: 7, y: 9, width: 2, opacity: 0.3 },
      { x: 8, y: 6, height: 2 },
      { x: 7, y: 7, width: 3 },
    ],
    wilt: [
      { x: 7, y: 11, height: 4, opacity: 0.8 },
      { x: 6, y: 10, width: 2, opacity: 0.8 },
      { x: 5, y: 9, width: 2, opacity: 0.5 },
      { x: 4, y: 10, opacity: 0.3 },
      { x: 6, y: 12, opacity: 0.4 },
    ],
  },
  tulip: {
    seed: [{ x: 7, y: 12, width: 2 }, { x: 6, y: 11, opacity: 0.5 }],
    sprout: [
      { x: 8, y: 13, height: 2 },
      { x: 8, y: 11 },
      { x: 7, y: 10, opacity: 0.6 },
      { x: 9, y: 10, opacity: 0.6 },
    ],
    bud: [
      { x: 8, y: 10, height: 5 },
      { x: 7, y: 13, opacity: 0.5 },
      { x: 9, y: 11, opacity: 0.5 },
      { x: 8, y: 7, height: 3 },
      { x: 9, y: 8 },
    ],
    bloom: [
      { x: 8, y: 9, height: 6 },
      { x: 9, y: 12, width: 2, opacity: 0.55 },
      { x: 6, y: 11, width: 2, opacity: 0.55 },
      { x: 6, y: 6, height: 3 },
      { x: 10, y: 6, height: 3 },
      { x: 8, y: 5, height: 4 },
      { x: 7, y: 6, height: 2 },
      { x: 9, y: 6, height: 2 },
      { x: 6, y: 5 },
      { x: 10, y: 5 },
      { x: 7, y: 4, width: 2 },
      { x: 7, y: 7, opacity: 0.35 },
      { x: 9, y: 7, opacity: 0.35 },
      { x: 8, y: 8, opacity: 0.2 },
    ],
    wilt: [
      { x: 8, y: 12, height: 3, opacity: 0.8 },
      { x: 9, y: 14, opacity: 0.5 },
      { x: 8, y: 10, width: 2, height: 2, opacity: 0.7 },
      { x: 10, y: 11, opacity: 0.4 },
      { x: 7, y: 11, opacity: 0.4 },
    ],
  },
  poppy: {
    seed: [{ x: 7, y: 11, width: 2 }, { x: 8, y: 12, opacity: 0.5 }],
    sprout: [
      { x: 8, y: 13, height: 2 },
      { x: 8, y: 11 },
      { x: 7, y: 10, opacity: 0.6 },
      { x: 9, y: 10, opacity: 0.6 },
    ],
    bud: [
      { x: 8, y: 10, height: 5 },
      { x: 8, y: 8, height: 2 },
      { x: 7, y: 7, width: 3 },
      { x: 8, y: 6, opacity: 0.6 },
    ],
    bloom: [
      { x: 8, y: 8, height: 7 },
      { x: 6, y: 12, width: 2, opacity: 0.55 },
      { x: 9, y: 10, width: 2, opacity: 0.55 },
      { x: 8, y: 3, height: 3 },
      { x: 7, y: 4 },
      { x: 9, y: 4 },
      { x: 4, y: 6, width: 2 },
      { x: 10, y: 6, width: 2 },
      { x: 5, y: 5 },
      { x: 10, y: 5 },
      { x: 5, y: 7 },
      { x: 10, y: 7 },
      { x: 6, y: 5, width: 4, height: 3, opacity: 0.22 },
      { x: 7, y: 6, width: 3, height: 2 },
      { x: 8, y: 5 },
      { x: 7, y: 5, opacity: 0.5 },
      { x: 9, y: 5, opacity: 0.5 },
    ],
    wilt: [
      { x: 8, y: 11, height: 4, opacity: 0.8 },
      { x: 7, y: 9, width: 3, opacity: 0.5 },
      { x: 6, y: 10, opacity: 0.35 },
      { x: 10, y: 10, opacity: 0.35 },
      { x: 9, y: 12, opacity: 0.4 },
    ],
  },
  fern: {
    seed: [{ x: 7, y: 12, width: 2 }, { x: 6, y: 11, opacity: 0.5 }],
    sprout: [
      { x: 8, y: 13, height: 2 },
      { x: 7, y: 11, opacity: 0.7 },
      { x: 9, y: 11, opacity: 0.7 },
      { x: 8, y: 10 },
    ],
    bud: [
      { x: 8, y: 10, height: 5 },
      { x: 7, y: 12, opacity: 0.5 },
      { x: 9, y: 13, opacity: 0.5 },
      { x: 7, y: 8, width: 3, height: 2 },
      { x: 6, y: 9, opacity: 0.6 },
      { x: 10, y: 9, opacity: 0.6 },
    ],
    bloom: [
      { x: 8, y: 10, height: 5 },
      { x: 6, y: 13, width: 2, opacity: 0.55 },
      { x: 9, y: 11, width: 2, opacity: 0.55 },
      { x: 8, y: 3, height: 2 },
      { x: 8, y: 9 },
      { x: 3, y: 7, width: 2 },
      { x: 11, y: 7, width: 2 },
      { x: 5, y: 4 },
      { x: 10, y: 4 },
      { x: 5, y: 10 },
      { x: 10, y: 10 },
      { x: 4, y: 5 },
      { x: 11, y: 5 },
      { x: 4, y: 9, opacity: 0.7 },
      { x: 11, y: 9, opacity: 0.7 },
      { x: 7, y: 6, width: 3, height: 3, opacity: 0.25 },
      { x: 7, y: 7, width: 3 },
      { x: 8, y: 6, height: 3 },
    ],
    wilt: [
      { x: 8, y: 12, height: 3, opacity: 0.8 },
      { x: 6, y: 9, width: 5, opacity: 0.5 },
      { x: 5, y: 10, opacity: 0.3 },
      { x: 11, y: 10, opacity: 0.3 },
      { x: 7, y: 11, width: 3, opacity: 0.4 },
    ],
  },
};

const SVG_NS = "http://www.w3.org/2000/svg";

function createSprite(species: Species, stage: Stage, size: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.style.display = "block";
  svg.style.shapeRendering = "crispEdges";

  const parts = SPRITES[species][stage];

  for (const part of parts) {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(part.x));
    rect.setAttribute("y", String(part.y));
    rect.setAttribute("width", String(part.width ?? 1));
    rect.setAttribute("height", String(part.height ?? 1));
    rect.setAttribute("fill", "currentColor");
    rect.setAttribute("opacity", String(part.opacity ?? 1));
    svg.appendChild(rect);
  }

  return svg;
}

type SnapshotCell = {
  x: number;
  y: number;
  species: Species;
  stage: Stage;
  plantedAt: string;
  lastWaterAt: string;
  author: string;
};

type SnapshotActivity = {
  msg: string;
  type: string;
  createdAt: string;
};

type SnapshotResponse = {
  serverNow: string;
  version: number;
  environment: {
    season: Season;
    weather: Weather;
    wind: {
      direction: WindDirection;
      strength: WindStrength;
      label: string;
    };
    time: "day" | "night";
  };
  stats: {
    plantedTotal: number;
    aliveNow: number;
    health: Health;
    bloomPct: number;
  };
  cells: SnapshotCell[];
  activity: SnapshotActivity[];
};

type GardenWorldState = {
  planted: number;
  activity: Activity[];
  cells: Map<string, Cell>;
  version: number;
  serverNow: number;
  stats: SnapshotResponse["stats"];
  environment: SnapshotResponse["environment"];
};

type GardenRefs = {
  root: HTMLElement;
  surface: HTMLElement;
  gridDots: HTMLElement;
  axisH: HTMLElement;
  axisV: HTMLElement;
  flowers: HTMLElement;
  cellHover: HTMLElement;
  cellTip: HTMLElement;
  coordReadout: HTMLElement;
  originBtn: HTMLButtonElement;
  toolButtons: NodeListOf<HTMLButtonElement>;
  speciesGroup: HTMLElement;
  speciesButtons: HTMLElement;
  statTotal: HTMLElement;
  statAlive: HTMLElement;
  statHealth: HTMLElement;
  statBloom: HTMLElement;
  statSeason: HTMLElement;
  statWeather: HTMLElement;
  statWind: HTMLElement;
  statTime: HTMLElement;
  legend: HTMLElement;
  activity: HTMLElement;
};

function formatAgo(time: number, now: number = Date.now()): string {
  const seconds = Math.floor((now - time) / 1000);

  if (seconds < 60)
    return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60)
    return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24)
    return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function getHydrationLabel(cell: Cell, now: number): string {
  if (cell.stage === "wilt")
    return "wilted";

  const dryness = now - (cell.lastWater || cell.plantedAt);

  if (dryness < WATER_WARN_MS / 2)
    return "hydrated";

  if (dryness < WATER_WARN_MS)
    return "okay";

  if (dryness < WILT_MS / 2)
    return "watch soon";

  if (dryness < WILT_MS)
    return "thirsty";

  return "parched";
}

function parseTimestamp(value: string): number {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function normalizeSnapshot(snapshot: SnapshotResponse): GardenWorldState {
  return {
    planted: snapshot.stats.plantedTotal,
    activity: snapshot.activity.map((item) => ({
      msg: item.msg,
      type: item.type,
      tick: parseTimestamp(item.createdAt),
    })),
    cells: new Map(
      snapshot.cells.map((cell) => [
        `${cell.x},${cell.y}`,
        {
          stage: cell.stage,
          author: cell.author,
          species: cell.species,
          plantedAt: parseTimestamp(cell.plantedAt),
          lastWater: parseTimestamp(cell.lastWaterAt),
        },
      ]),
    ),
    version: snapshot.version,
    serverNow: parseTimestamp(snapshot.serverNow),
    stats: snapshot.stats,
    environment: snapshot.environment,
  };
}

function initGarden(root: HTMLElement): void {
  const qs = <T extends HTMLElement>(sel: string): T => root.querySelector<T>(sel)!;
  const stateEndpoint = root.dataset.stateEndpoint;
  const actionsEndpoint = root.dataset.actionsEndpoint;

  if (!stateEndpoint || !actionsEndpoint) {
    return;
  }

  const refs: GardenRefs = {
    root,
    surface: qs("[data-garden-surface]"),
    gridDots: qs("[data-grid-dots]"),
    axisH: qs("[data-axis-h]"),
    axisV: qs("[data-axis-v]"),
    flowers: qs("[data-flowers]"),
    cellHover: qs("[data-cell-hover]"),
    cellTip: qs("[data-cell-tip]"),
    coordReadout: qs("[data-coord-readout]"),
    originBtn: qs<HTMLButtonElement>("[data-origin-btn]"),
    toolButtons: root.querySelectorAll<HTMLButtonElement>("[data-tool-group] [data-tool]"),
    speciesGroup: qs("[data-species-group]"),
    speciesButtons: qs("[data-species-buttons]"),
    statTotal: qs("[data-stat-total]"),
    statAlive: qs("[data-stat-alive]"),
    statHealth: qs("[data-stat-health]"),
    statBloom: qs("[data-stat-bloom]"),
    statSeason: qs("[data-stat-season]"),
    statWeather: qs("[data-stat-weather]"),
    statWind: qs("[data-stat-wind]"),
    statTime: qs("[data-stat-time]"),
    legend: qs("[data-legend]"),
    activity: qs("[data-activity]"),
  };

  try {
    localStorage.removeItem(LS_KEY);
  } catch { }

  let world: GardenWorldState | null = null;
  let tool: Tool = "plant";
  let species: Species = "daisy";
  let pan = { x: 0, y: 0 };
  let zoom = 1;
  let viewport = { w: 0, h: 0 };
  let hover: { x: number; y: number; px: number; py: number } | null = null;
  let panInteraction:
    | { pointerId: number; lastX: number; lastY: number }
    | { mode: "gesture"; centroid: { x: number; y: number }; distance: number }
    | null = null;
  let pendingTouchAction:
    | { pointerId: number; startX: number; startY: number; lastX: number; lastY: number; moved: boolean }
    | null = null;
  let isSpacePressed = false;
  let centered = false;
  let isLoaded = false;
  let loadError = "";
  let serverTimeOffsetMs = 0;
  const activePointers = new Map<number, { clientX: number; clientY: number }>();

  const getNow = (): number => Date.now() + serverTimeOffsetMs;
  const isPanning = (): boolean => panInteraction !== null;
  const getCellSize = (): number => CELL_PX * zoom;

  const renderStats = (): void => {
    refs.statTotal.textContent = String(world?.stats.plantedTotal ?? 0).padStart(4, "0");
    refs.statAlive.textContent = String(world?.stats.aliveNow ?? 0).padStart(4, "0");
    refs.statHealth.textContent = world?.stats.health ?? "dormant";
    refs.statBloom.textContent = `${world?.stats.bloomPct ?? 0}%`;
    refs.statSeason.textContent = world?.environment.season ?? "";
    refs.statWeather.textContent = world?.environment.weather ?? "";
    refs.statWind.textContent = world?.environment.wind.label ?? "";
    refs.statTime.textContent = world?.environment.time ?? "";

    const speciesCounts: Partial<Record<Species, number>> = {};

    if (world) {
      for (const [, cell] of world.cells) {
        speciesCounts[cell.species] = (speciesCounts[cell.species] ?? 0) + 1;
      }
    }

    refs.legend.replaceChildren();

    for (const sp of SPECIES_LIST) {
      const row = document.createElement("div");
      row.className = "garden-legend-row";
      const sprite = document.createElement("span");
      sprite.className = "garden-legend-sprite";
      sprite.appendChild(createSprite(sp, "bloom", 20));
      const name = document.createElement("span");
      name.className = "garden-legend-name";
      name.textContent = sp;
      const count = document.createElement("span");
      count.className = "garden-legend-count";
      count.textContent = `\u00d7 ${speciesCounts[sp] ?? 0}`;
      row.append(sprite, name, count);
      refs.legend.appendChild(row);
    }
  };

  const renderActivity = (): void => {
    refs.activity.replaceChildren();

    if (loadError) {
      const error = document.createElement("div");
      error.className = "garden-dim";
      error.textContent = loadError;
      refs.activity.appendChild(error);
      return;
    }

    if (!isLoaded) {
      const loading = document.createElement("div");
      loading.className = "garden-dim";
      loading.textContent = "loading garden...";
      refs.activity.appendChild(loading);
      return;
    }

    if (!world || world.activity.length === 0) {
      const empty = document.createElement("div");
      empty.className = "garden-dim";
      empty.textContent = "no activity yet";
      refs.activity.appendChild(empty);
      return;
    }

    for (const entry of world.activity.slice(0, 8)) {
      const row = document.createElement("div");
      row.className = "garden-activity-row";
      const type = document.createElement("span");
      type.className = "garden-activity-type";
      type.textContent = entry.type;
      const msg = document.createElement("span");
      msg.className = "garden-activity-msg";
      msg.textContent = entry.msg;
      const time = document.createElement("span");
      time.className = "garden-activity-time";
      time.textContent = formatAgo(entry.tick, getNow());
      row.append(type, msg, time);
      refs.activity.appendChild(row);
    }
  };

  const screenToWorld = (sx: number, sy: number) => {
    const cellSize = getCellSize();
    return {
      x: (sx - pan.x) / cellSize,
      y: (sy - pan.y) / cellSize,
    };
  };

  const screenToCell = (sx: number, sy: number) => {
    const worldPoint = screenToWorld(sx, sy);
    return {
      x: Math.floor(worldPoint.x),
      y: Math.floor(worldPoint.y),
    };
  };

  const cellToScreen = (x: number, y: number) => {
    const cellSize = getCellSize();
    return {
      x: pan.x + x * cellSize,
      y: pan.y + y * cellSize,
    };
  };

  const centerOrigin = (): void => {
    const rect = refs.surface.getBoundingClientRect();
    const cellSize = getCellSize();
    pan = { x: rect.width / 2 - cellSize / 2, y: rect.height / 2 - cellSize / 2 };
  };

  const resetView = (): void => {
    zoom = 1;
    centerOrigin();
  };

  const zoomAt = (sx: number, sy: number, targetZoom: number): void => {
    const nextZoom = clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);

    if (nextZoom === zoom) {
      return;
    }

    const worldPoint = screenToWorld(sx, sy);
    zoom = nextZoom;
    const cellSize = getCellSize();
    pan = {
      x: sx - worldPoint.x * cellSize,
      y: sy - worldPoint.y * cellSize,
    };
  };

  const renderOriginMarker = (): void => {
    const cellSize = getCellSize();
    refs.axisH.style.top = `${pan.y + cellSize / 2}px`;
    refs.axisV.style.left = `${pan.x + cellSize / 2}px`;
    refs.gridDots.style.backgroundPosition = `${pan.x}px ${pan.y}px`;
    refs.gridDots.style.backgroundSize = `${cellSize}px ${cellSize}px`;
  };

  const renderFlowers = (): void => {
    const cellSize = getCellSize();
    const pad = 2;
    const x0 = Math.floor(-pan.x / cellSize) - pad;
    const y0 = Math.floor(-pan.y / cellSize) - pad;
    const x1 = Math.ceil((viewport.w - pan.x) / cellSize) + pad;
    const y1 = Math.ceil((viewport.h - pan.y) / cellSize) + pad;

    refs.flowers.replaceChildren();

    if (!world) {
      return;
    }

    for (const [k, cell] of world.cells) {
      const [x, y] = k.split(",").map(Number);

      if (x < x0 || x > x1 || y < y0 || y > y1) {
        continue;
      }

      const screen = cellToScreen(x, y);
      const el = document.createElement("div");
      el.className = `garden-flower garden-flower-${cell.stage}`;
      el.style.left = `${screen.x}px`;
      el.style.top = `${screen.y}px`;
      el.style.width = `${cellSize}px`;
      el.style.height = `${cellSize}px`;
      el.title = `${cell.species} / ${cell.stage} / ${k}`;
      el.appendChild(createSprite(cell.species, cell.stage, cellSize));
      refs.flowers.appendChild(el);
    }
  };

  const renderHover = (): void => {
    if (!hover || isPanning()) {
      refs.cellHover.hidden = true;
      refs.cellTip.hidden = true;
      return;
    }

    refs.cellHover.hidden = false;
    refs.cellHover.className = `garden-cell-hover tool-${tool}`;
    const cellSize = getCellSize();
    const screen = cellToScreen(hover.x, hover.y);
    refs.cellHover.style.left = `${screen.x}px`;
    refs.cellHover.style.top = `${screen.y}px`;
    refs.cellHover.style.width = `${cellSize}px`;
    refs.cellHover.style.height = `${cellSize}px`;
    refs.cellHover.replaceChildren();

    const hoverCell = world?.cells.get(`${hover.x},${hover.y}`) ?? null;

    if (tool === "plant" && !hoverCell) {
      const ghost = document.createElement("div");
      ghost.className = "garden-ghost-flower";
      ghost.appendChild(createSprite(species, "seed", cellSize));
      refs.cellHover.appendChild(ghost);
    }

    if (!hoverCell) {
      refs.cellTip.hidden = true;
      return;
    }

    refs.cellTip.hidden = false;
    refs.cellTip.replaceChildren();
    const head = document.createElement("div");
    head.textContent = `${hoverCell.species} / ${hoverCell.stage}`;
    const coord = document.createElement("div");
    coord.className = "garden-dim";
    coord.textContent = `(${hover.x},${hover.y}) \u00b7 planted ${formatAgo(hoverCell.plantedAt, getNow())}`;
    const water = document.createElement("div");
    water.className = "garden-dim";
    water.textContent = `${getHydrationLabel(hoverCell, getNow())} \u00b7 last watered ${formatAgo(hoverCell.lastWater, getNow())}`;
    const author = document.createElement("div");
    author.className = "garden-dim";
    author.textContent = `by ${hoverCell.author}`;
    refs.cellTip.append(head, coord, water, author);

    const tipLeft = Math.min(hover.px + 14, viewport.w - 180);
    const tipTop = Math.min(hover.py + 14, viewport.h - 80);
    refs.cellTip.style.left = `${tipLeft}px`;
    refs.cellTip.style.top = `${tipTop}px`;
  };

  const renderCoord = (): void => {
    const center = viewport.w ? screenToCell(viewport.w / 2, viewport.h / 2) : { x: 0, y: 0 };
    const cx = hover ? hover.x : center.x;
    const cy = hover ? hover.y : center.y;
    refs.coordReadout.replaceChildren();

    const cursorLabel = document.createElement("span");
    cursorLabel.className = "garden-dim";
    cursorLabel.textContent = "cursor:";
    const cursorValue = document.createTextNode(` (${cx},${cy}) `);
    const centerLabel = document.createElement("span");
    centerLabel.className = "garden-dim";
    centerLabel.textContent = "\u00b7 center:";
    const centerValue = document.createTextNode(` (${center.x},${center.y})`);

    refs.coordReadout.append(cursorLabel, cursorValue, centerLabel, centerValue);
  };

  const renderSpecies = (): void => {
    refs.speciesGroup.hidden = tool !== "plant";
    refs.speciesButtons.replaceChildren();

    for (const sp of SPECIES_LIST) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `garden-btn garden-species-btn${sp === species ? " is-active" : ""}`;
      btn.setAttribute("aria-pressed", String(sp === species));
      btn.dataset.species = sp;
      const icon = document.createElement("span");
      icon.className = "garden-species-icon";
      icon.appendChild(createSprite(sp, "bloom", 16));
      btn.append(icon, document.createTextNode(sp));
      btn.addEventListener("click", () => {
        species = sp;
        renderSpecies();
        renderHover();
      });
      refs.speciesButtons.appendChild(btn);
    }
  };

  const updateCursor = (): void => {
    if (isPanning()) {
      refs.surface.dataset.cursor = "panning";
    } else if (isSpacePressed) {
      refs.surface.dataset.cursor = "pan";
    } else {
      refs.surface.dataset.cursor = tool;
    }
  };

  const renderTools = (): void => {
    for (const btn of Array.from(refs.toolButtons)) {
      const active = btn.dataset.tool === tool;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    }

    updateCursor();
  };

  const renderViewportDependent = (): void => {
    renderOriginMarker();
    renderFlowers();
    renderHover();
    renderCoord();
  };

  const setTool = (next: Tool): void => {
    tool = next;
    renderTools();
    renderSpecies();
    renderHover();
  };

  const applySnapshot = (snapshot: SnapshotResponse): void => {
    const next = normalizeSnapshot(snapshot);

    if (
      world &&
      (
        next.version < world.version ||
        (next.version === world.version && next.serverNow < world.serverNow)
      )
    ) {
      return;
    }

    world = next;
    isLoaded = true;
    loadError = "";
    serverTimeOffsetMs = next.serverNow - Date.now();
    renderViewportDependent();
    renderStats();
    renderActivity();
  };

  const fetchSnapshot = async (): Promise<void> => {
    const response = await fetch(stateEndpoint, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`Failed to load garden (${response.status}).`);
    }

    const data = await response.json() as SnapshotResponse;
    applySnapshot(data);
  };

  const submitAction = async (x: number, y: number): Promise<void> => {
    if (!isLoaded) {
      return;
    }

    const payload: Record<string, string | number> = { tool, x, y };

    if (tool === "plant") {
      payload.species = species;
    }

    const response = await fetch(actionsEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "" }));
      throw new Error(data.error || `Failed to update garden (${response.status}).`);
    }

    const data = await response.json() as SnapshotResponse;
    applySnapshot(data);
  };

  refs.toolButtons.forEach((btn) => {
    btn.addEventListener("click", () => setTool(btn.dataset.tool as Tool));
  });

  refs.originBtn.addEventListener("click", () => {
    resetView();
    renderViewportDependent();
  });

  const beginPointerPan = (e: PointerEvent, px: number, py: number): void => {
    panInteraction = { pointerId: e.pointerId, lastX: px, lastY: py };
    refs.surface.setPointerCapture(e.pointerId);
    updateCursor();
    renderHover();
  };

  const getGestureCentroid = (): { x: number; y: number } | null => {
    const pointers = Array.from(activePointers.values()).slice(0, 2);

    if (pointers.length < 2) {
      return null;
    }

    const rect = refs.surface.getBoundingClientRect();
    return {
      x: (pointers[0].clientX + pointers[1].clientX) / 2 - rect.left,
      y: (pointers[0].clientY + pointers[1].clientY) / 2 - rect.top,
    };
  };

  const getGestureDistance = (): number | null => {
    const pointers = Array.from(activePointers.values()).slice(0, 2);

    if (pointers.length < 2) {
      return null;
    }

    return Math.max(
      Math.hypot(
        pointers[1].clientX - pointers[0].clientX,
        pointers[1].clientY - pointers[0].clientY,
      ),
      1,
    );
  };

  const beginGesture = (): void => {
    const centroid = getGestureCentroid();
    const distance = getGestureDistance();

    if (!centroid || distance === null) {
      return;
    }

    panInteraction = { mode: "gesture", centroid, distance };
    updateCursor();
    renderHover();
  };

  const endPan = (): void => {
    panInteraction = null;
    updateCursor();
  };

  const clearPendingTouchAction = (): void => {
    pendingTouchAction = null;
  };

  refs.surface.addEventListener("pointerdown", (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button === 2) {
      return;
    }

    const rect = refs.surface.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    if (e.pointerType === "touch") {
      e.preventDefault();
      refs.surface.setPointerCapture(e.pointerId);

      if (activePointers.size === 1) {
        pendingTouchAction = {
          pointerId: e.pointerId,
          startX: px,
          startY: py,
          lastX: px,
          lastY: py,
          moved: false,
        };
        return;
      }

      if (activePointers.size === 2) {
        clearPendingTouchAction();
        endPan();
        beginGesture();
      }

      return;
    }

    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      beginPointerPan(e, px, py);
      return;
    }

    if (e.button !== 0) {
      return;
    }

    e.preventDefault();
    refs.surface.setPointerCapture(e.pointerId);
    const { x, y } = screenToCell(px, py);
    void submitAction(x, y).catch((error: unknown) => {
      loadError = error instanceof Error ? error.message : "failed to update garden";
      renderActivity();
    });
  });

  refs.surface.addEventListener("pointermove", (e: PointerEvent) => {
    if (activePointers.has(e.pointerId)) {
      activePointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    const rect = refs.surface.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (
      panInteraction &&
      "pointerId" in panInteraction &&
      panInteraction.pointerId === e.pointerId
    ) {
      e.preventDefault();
      pan = {
        x: pan.x + (px - panInteraction.lastX),
        y: pan.y + (py - panInteraction.lastY),
      };
      panInteraction.lastX = px;
      panInteraction.lastY = py;
      renderViewportDependent();
      return;
    }

    if (panInteraction && "mode" in panInteraction && panInteraction.mode === "gesture") {
      e.preventDefault();
      const next = getGestureCentroid();
      const nextDistance = getGestureDistance();

      if (next && nextDistance !== null) {
        pan = {
          x: pan.x + (next.x - panInteraction.centroid.x),
          y: pan.y + (next.y - panInteraction.centroid.y),
        };
        zoomAt(next.x, next.y, zoom * (nextDistance / panInteraction.distance));
        panInteraction.centroid = next;
        panInteraction.distance = nextDistance;
        renderViewportDependent();
      }

      return;
    }

    if (e.pointerType === "touch" && pendingTouchAction?.pointerId === e.pointerId) {
      const moved =
        Math.hypot(px - pendingTouchAction.startX, py - pendingTouchAction.startY) > TOUCH_TAP_SLOP_PX;
      pendingTouchAction.lastX = px;
      pendingTouchAction.lastY = py;
      pendingTouchAction.moved = pendingTouchAction.moved || moved;
      return;
    }

    const cell = screenToCell(px, py);
    hover = { ...cell, px, py };
    renderHover();
    renderCoord();
  });

  const handlePointerRelease = (e: PointerEvent): void => {
    const rect = refs.surface.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const shouldApplyTouchAction =
      e.pointerType === "touch" &&
      pendingTouchAction?.pointerId === e.pointerId &&
      !pendingTouchAction.moved &&
      (!panInteraction || !("mode" in panInteraction));

    activePointers.delete(e.pointerId);

    if (
      panInteraction &&
      "pointerId" in panInteraction &&
      panInteraction.pointerId === e.pointerId
    ) {
      endPan();
    } else if (
      panInteraction &&
      "mode" in panInteraction &&
      panInteraction.mode === "gesture" &&
      activePointers.size < 2
    ) {
      endPan();
    }

    if (shouldApplyTouchAction) {
      const { x, y } = screenToCell(px, py);
      void submitAction(x, y).catch((error: unknown) => {
        loadError = error instanceof Error ? error.message : "failed to update garden";
        renderActivity();
      });
    }

    if (pendingTouchAction?.pointerId === e.pointerId) {
      clearPendingTouchAction();
    }
  };

  refs.surface.addEventListener("pointerup", handlePointerRelease);
  refs.surface.addEventListener("pointercancel", (e: PointerEvent) => {
    activePointers.delete(e.pointerId);

    if (pendingTouchAction?.pointerId === e.pointerId) {
      clearPendingTouchAction();
    }

    if (
      panInteraction &&
      "pointerId" in panInteraction &&
      panInteraction.pointerId === e.pointerId
    ) {
      endPan();
    } else if (
      panInteraction &&
      "mode" in panInteraction &&
      panInteraction.mode === "gesture" &&
      activePointers.size < 2
    ) {
      endPan();
    }
  });

  refs.surface.addEventListener("pointerleave", (e: PointerEvent) => {
    if (e.pointerType === "mouse") {
      hover = null;
      renderHover();
      renderCoord();
    }
  });

  refs.surface.addEventListener("contextmenu", (e: Event) => {
    e.preventDefault();
  });

  refs.surface.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      e.preventDefault();

      const rect = refs.surface.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const scale = Math.exp(-e.deltaY * 0.0015);

      zoomAt(px, py, zoom * scale);
      renderViewportDependent();
    },
    { passive: false },
  );

  window.addEventListener("keydown", (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const isFormField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement;

    if (event.code === "Space" && !isFormField) {
      if (!isSpacePressed) {
        isSpacePressed = true;
        updateCursor();
      }

      event.preventDefault();
      return;
    }

    if (isFormField) {
      return;
    }

    const step = getCellSize() * (event.shiftKey ? 5 : 1);
    let handled = true;

    if (event.key === "ArrowLeft") pan = { ...pan, x: pan.x + step };
    else if (event.key === "ArrowRight") pan = { ...pan, x: pan.x - step };
    else if (event.key === "ArrowUp") pan = { ...pan, y: pan.y + step };
    else if (event.key === "ArrowDown") pan = { ...pan, y: pan.y - step };
    else if (event.key === "Home") resetView();
    else if (event.key === "p" || event.key === "P") setTool("plant");
    else if (event.key === "w" || event.key === "W") setTool("water");
    else if (event.key === "x" || event.key === "X") setTool("prune");
    else if (event.key === "1") {
      species = "daisy";
      renderSpecies();
    } else if (event.key === "2") {
      species = "tulip";
      renderSpecies();
    } else if (event.key === "3") {
      species = "poppy";
      renderSpecies();
    } else if (event.key === "4") {
      species = "fern";
      renderSpecies();
    } else {
      handled = false;
    }

    if (handled && event.key.startsWith("Arrow")) {
      event.preventDefault();
    }

    if (handled) {
      renderViewportDependent();
    }
  });

  window.addEventListener("keyup", (event: KeyboardEvent) => {
    if (event.code === "Space" && isSpacePressed) {
      isSpacePressed = false;
      updateCursor();
    }
  });

  const observer = new ResizeObserver(() => {
    const rect = refs.surface.getBoundingClientRect();
    const previousCenterWorld =
      centered && viewport.w > 0 && viewport.h > 0
        ? screenToWorld(viewport.w / 2, viewport.h / 2)
        : null;

    viewport = { w: rect.width, h: rect.height };

    if (!centered && rect.width > 0) {
      resetView();
      centered = true;
    } else if (previousCenterWorld) {
      const cellSize = getCellSize();
      pan = {
        x: rect.width / 2 - previousCenterWorld.x * cellSize,
        y: rect.height / 2 - previousCenterWorld.y * cellSize,
      };
    }

    renderViewportDependent();
  });

  observer.observe(refs.surface);

  setInterval(() => {
    void fetchSnapshot().catch((error: unknown) => {
      loadError = error instanceof Error ? error.message : "failed to load garden";
      renderActivity();
    });
  }, 15000);

  setInterval(() => {
    renderHover();
    renderActivity();
  }, 30000);

  renderTools();
  renderSpecies();
  renderStats();
  renderActivity();

  void fetchSnapshot().catch((error: unknown) => {
    isLoaded = true;
    loadError = error instanceof Error ? error.message : "failed to load garden";
    renderActivity();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector<HTMLElement>("[data-garden-root]");

  if (root) {
    initGarden(root);
  }
});
