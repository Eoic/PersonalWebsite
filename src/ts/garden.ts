export {};

type Species = "daisy" | "tulip" | "poppy" | "fern";
type Stage = "seed" | "sprout" | "bud" | "bloom" | "wilt";
type Tool = "plant" | "water" | "prune";
type Weather = "clear" | "cloudy" | "rain" | "fog" | "snow";
type Season = "winter" | "spring" | "summer" | "autumn";
type Health = "thriving" | "healthy" | "steady" | "struggling" | "dormant";
type WindDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
type WindStrength = "calm" | "light" | "steady" | "gusty";

type Cell = {
  species: Species;
  stage: Stage;
  plantedAt: number;
  lastWater: number;
  author: string;
};

type Activity = {
  t: number;
  type: string;
  msg: string;
};

type State = {
  cells: Map<string, Cell>;
  activity: Activity[];
  planted: number;
};

type SpritePart = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  o?: number;
};

type Wind = {
  direction: WindDirection;
  strength: WindStrength;
  dx: number;
  dy: number;
};

const CELL_PX = 28;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const LS_KEY = "ks.garden.v1";
const SPECIES_LIST: Species[] = ["daisy", "tulip", "poppy", "fern"];
const STAGE_ORDER: Stage[] = ["seed", "sprout", "bud", "bloom", "wilt"];
const MAX_CELLS = 1500;
const WATER_WARN_MS = 1000 * 60 * 60 * 24 * 3;
const WILT_MS = 1000 * 60 * 60 * 24 * 14;
const NATURAL_WILT_MS = 1000 * 60 * 60 * 24 * 30;
const RETURN_TO_SOIL_MS = 1000 * 60 * 60 * 24 * 45;
const GROW_INTERVAL_MS = 1000 * 60 * 60 * 8;
const TOUCH_TAP_SLOP_PX = 12;
const STORAGE_WARNING_MSG = "storage full; garden progress will not persist until space is freed";
const POPULATION_CAP_MSG = "garden is at capacity; prune or wait for flowers to return to soil";

const SPRITES: Record<Species, Record<Stage, SpritePart[]>> = {
  daisy: {
    seed: [{ x: 7, y: 11, w: 2 }, { x: 8, y: 12, o: 0.5 }],
    sprout: [
      { x: 8, y: 13, h: 2 },
      { x: 7, y: 11, o: 0.7 },
      { x: 9, y: 11, o: 0.7 },
      { x: 8, y: 10 },
    ],
    bud: [
      { x: 8, y: 10, h: 5 },
      { x: 7, y: 12, o: 0.5 },
      { x: 7, y: 8, w: 3, h: 2 },
      { x: 8, y: 7 },
    ],
    bloom: [
      { x: 8, y: 11, h: 4 },
      { x: 6, y: 13, w: 2, o: 0.55 },
      { x: 8, y: 4 },
      { x: 8, y: 9 },
      { x: 5, y: 6 },
      { x: 11, y: 6 },
      { x: 4, y: 8 },
      { x: 12, y: 8 },
      { x: 5, y: 10 },
      { x: 11, y: 10 },
      { x: 7, y: 5, w: 3, h: 4, o: 0.18 },
      { x: 6, y: 6, h: 2, o: 0.3 },
      { x: 10, y: 6, h: 2, o: 0.3 },
      { x: 7, y: 4, w: 2, o: 0.3 },
      { x: 7, y: 9, w: 2, o: 0.3 },
      { x: 8, y: 6, h: 2 },
      { x: 7, y: 7, w: 3 },
    ],
    wilt: [
      { x: 7, y: 11, h: 4, o: 0.8 },
      { x: 6, y: 10, w: 2, o: 0.8 },
      { x: 5, y: 9, w: 2, o: 0.5 },
      { x: 4, y: 10, o: 0.3 },
      { x: 6, y: 12, o: 0.4 },
    ],
  },
  tulip: {
    seed: [{ x: 7, y: 12, w: 2 }, { x: 6, y: 11, o: 0.5 }],
    sprout: [
      { x: 8, y: 13, h: 2 },
      { x: 8, y: 11 },
      { x: 7, y: 10, o: 0.6 },
      { x: 9, y: 10, o: 0.6 },
    ],
    bud: [
      { x: 8, y: 10, h: 5 },
      { x: 7, y: 13, o: 0.5 },
      { x: 9, y: 11, o: 0.5 },
      { x: 8, y: 7, h: 3 },
      { x: 9, y: 8 },
    ],
    bloom: [
      { x: 8, y: 9, h: 6 },
      { x: 9, y: 12, w: 2, o: 0.55 },
      { x: 6, y: 11, w: 2, o: 0.55 },
      { x: 6, y: 6, h: 3 },
      { x: 10, y: 6, h: 3 },
      { x: 8, y: 5, h: 4 },
      { x: 7, y: 6, h: 2 },
      { x: 9, y: 6, h: 2 },
      { x: 6, y: 5 },
      { x: 10, y: 5 },
      { x: 7, y: 4, w: 2 },
      { x: 7, y: 7, o: 0.35 },
      { x: 9, y: 7, o: 0.35 },
      { x: 8, y: 8, o: 0.2 },
    ],
    wilt: [
      { x: 8, y: 12, h: 3, o: 0.8 },
      { x: 9, y: 14, o: 0.5 },
      { x: 8, y: 10, w: 2, h: 2, o: 0.7 },
      { x: 10, y: 11, o: 0.4 },
      { x: 7, y: 11, o: 0.4 },
    ],
  },
  poppy: {
    seed: [{ x: 7, y: 11, w: 2 }, { x: 8, y: 12, o: 0.5 }],
    sprout: [
      { x: 8, y: 13, h: 2 },
      { x: 8, y: 11 },
      { x: 7, y: 10, o: 0.6 },
      { x: 9, y: 10, o: 0.6 },
    ],
    bud: [
      { x: 8, y: 10, h: 5 },
      { x: 8, y: 8, h: 2 },
      { x: 7, y: 7, w: 3 },
      { x: 8, y: 6, o: 0.6 },
    ],
    bloom: [
      { x: 8, y: 8, h: 7 },
      { x: 6, y: 12, w: 2, o: 0.55 },
      { x: 9, y: 10, w: 2, o: 0.55 },
      { x: 8, y: 3, h: 3 },
      { x: 7, y: 4 },
      { x: 9, y: 4 },
      { x: 4, y: 6, w: 2 },
      { x: 10, y: 6, w: 2 },
      { x: 5, y: 5 },
      { x: 10, y: 5 },
      { x: 5, y: 7 },
      { x: 10, y: 7 },
      { x: 6, y: 5, w: 4, h: 3, o: 0.22 },
      { x: 7, y: 6, w: 3, h: 2 },
      { x: 8, y: 5 },
      { x: 7, y: 5, o: 0.5 },
      { x: 9, y: 5, o: 0.5 },
    ],
    wilt: [
      { x: 8, y: 11, h: 4, o: 0.8 },
      { x: 7, y: 9, w: 3, o: 0.5 },
      { x: 6, y: 10, o: 0.35 },
      { x: 10, y: 10, o: 0.35 },
      { x: 9, y: 12, o: 0.4 },
    ],
  },
  fern: {
    seed: [{ x: 7, y: 12, w: 2 }, { x: 6, y: 11, o: 0.5 }],
    sprout: [
      { x: 8, y: 13, h: 2 },
      { x: 7, y: 11, o: 0.7 },
      { x: 9, y: 11, o: 0.7 },
      { x: 8, y: 10 },
    ],
    bud: [
      { x: 8, y: 10, h: 5 },
      { x: 7, y: 12, o: 0.5 },
      { x: 9, y: 13, o: 0.5 },
      { x: 7, y: 8, w: 3, h: 2 },
      { x: 6, y: 9, o: 0.6 },
      { x: 10, y: 9, o: 0.6 },
    ],
    bloom: [
      { x: 8, y: 10, h: 5 },
      { x: 6, y: 13, w: 2, o: 0.55 },
      { x: 9, y: 11, w: 2, o: 0.55 },
      { x: 8, y: 3, h: 2 },
      { x: 8, y: 9 },
      { x: 3, y: 7, w: 2 },
      { x: 11, y: 7, w: 2 },
      { x: 5, y: 4 },
      { x: 10, y: 4 },
      { x: 5, y: 10 },
      { x: 10, y: 10 },
      { x: 4, y: 5 },
      { x: 11, y: 5 },
      { x: 4, y: 9, o: 0.7 },
      { x: 11, y: 9, o: 0.7 },
      { x: 7, y: 6, w: 3, h: 3, o: 0.25 },
      { x: 7, y: 7, w: 3 },
      { x: 8, y: 6, h: 3 },
    ],
    wilt: [
      { x: 8, y: 12, h: 3, o: 0.8 },
      { x: 6, y: 9, w: 5, o: 0.5 },
      { x: 5, y: 10, o: 0.3 },
      { x: 11, y: 10, o: 0.3 },
      { x: 7, y: 11, w: 3, o: 0.4 },
    ],
  },
};

const SVG_NS = "http://www.w3.org/2000/svg";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

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
    rect.setAttribute("width", String(part.w ?? 1));
    rect.setAttribute("height", String(part.h ?? 1));
    rect.setAttribute("fill", "currentColor");
    rect.setAttribute("opacity", String(part.o ?? 1));
    svg.appendChild(rect);
  }

  return svg;
}

function seedGarden(): State {
  const cells = new Map<string, Cell>();
  const layout: Array<[number, number, Species, Stage]> = [
    [-3, -1, "daisy", "bloom"],
    [-2, 0, "daisy", "bud"],
    [-1, 1, "tulip", "bloom"],
    [0, 0, "poppy", "bloom"],
    [1, -1, "tulip", "bud"],
    [2, 0, "fern", "bloom"],
    [3, 1, "daisy", "sprout"],
    [0, -2, "fern", "bud"],
    [-1, -2, "tulip", "sprout"],
    [2, -2, "poppy", "seed"],
    [-4, 1, "poppy", "bloom"],
    [4, -1, "fern", "sprout"],
    [5, 1, "daisy", "bud"],
    [-5, 0, "tulip", "bloom"],
    [6, 0, "poppy", "seed"],
  ];

  const now = Date.now();

  for (const [x, y, sp, stg] of layout) {
    cells.set(`${x},${y}`, {
      species: sp,
      stage: stg,
      plantedAt: now - Math.random() * 1000 * 60 * 60 * 24 * 3,
      lastWater: now - Math.random() * 1000 * 60 * 60 * 12,
      author: "origin",
    });
  }

  return {
    cells,
    activity: [{ t: now, type: "system", msg: "garden initialized" }],
    planted: layout.length,
  };
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(LS_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cells: new Map(parsed.cells ?? []),
        activity: parsed.activity ?? [],
        planted: parsed.planted ?? 0,
      };
    }
  } catch {
    /* fall through */
  }

  return seedGarden();
}

function saveState(state: State): boolean {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        cells: Array.from(state.cells.entries()),
        activity: state.activity.slice(0, 20),
        planted: state.planted,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

function prependActivity(state: State, entry: Activity): Activity[] {
  return [entry, ...state.activity].slice(0, 20);
}

function getSeason(date: Date): Season {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "autumn";
}

function getWeather(date: Date): Weather {
  const day = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const h = (day * 9301 + 49297) % 233280;
  const r = h / 233280;
  if (r < 0.4) return "clear";
  if (r < 0.65) return "cloudy";
  if (r < 0.85) return "rain";
  if (r < 0.95) return "fog";
  return "snow";
}

function getWind(date: Date): Wind {
  const slot = Math.floor(date.getTime() / (1000 * 60 * 60 * 6));
  const directionOrder: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const vectors: Record<WindDirection, { dx: number; dy: number }> = {
    N: { dx: 0, dy: -1 },
    NE: { dx: 1, dy: -1 },
    E: { dx: 1, dy: 0 },
    SE: { dx: 1, dy: 1 },
    S: { dx: 0, dy: 1 },
    SW: { dx: -1, dy: 1 },
    W: { dx: -1, dy: 0 },
    NW: { dx: -1, dy: -1 },
  };
  const direction = directionOrder[((slot * 17 + 5) % directionOrder.length + directionOrder.length) % directionOrder.length];
  const strengthRoll = ((slot * 48271 + 12820163) % 1000) / 1000;
  const strength: WindStrength =
    strengthRoll < 0.18 ? "calm" : strengthRoll < 0.52 ? "light" : strengthRoll < 0.84 ? "steady" : "gusty";

  return { direction, strength, ...vectors[direction] };
}

function isDaytime(date: Date): boolean {
  const h = date.getHours();
  return h >= 6 && h < 20;
}

function formatAgo(t: number, now: number = Date.now()): string {
  const s = Math.floor((now - t) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getHydrationLabel(cell: Cell, now: number = Date.now()): string {
  if (cell.stage === "wilt") return "wilted";

  const dryness = now - (cell.lastWater || cell.plantedAt);

  if (dryness < WATER_WARN_MS / 2) return "hydrated";
  if (dryness < WATER_WARN_MS) return "okay";
  if (dryness < WILT_MS / 2) return "watch soon";
  if (dryness < WILT_MS) return "thirsty";
  return "parched";
}

function getGardenHealth(stageCounts: Record<Stage, number>, totalCells: number): Health {
  const bloomPct = totalCells ? Math.round((stageCounts.bloom / totalCells) * 100) : 0;

  if (stageCounts.wilt > totalCells / 2) return "struggling";
  if (bloomPct > 60) return "thriving";
  if (bloomPct > 35) return "healthy";
  if (bloomPct > 15) return "steady";
  return "dormant";
}

function getWindLabel(wind: Wind): string {
  return `${wind.strength} ${wind.direction}`;
}

function chooseWindBiasedNeighbor(
  candidates: Array<[number, number]>,
  wind: Wind,
): [number, number] {
  const strengthWeight =
    wind.strength === "calm" ? 0.15 : wind.strength === "light" ? 0.45 : wind.strength === "steady" ? 0.9 : 1.35;

  let total = 0;
  const weighted = candidates.map(([dx, dy]) => {
    const alignment = dx * wind.dx + dy * wind.dy;
    const score = Math.max(0.2, 1 + alignment * strengthWeight);
    total += score;
    return { cell: [dx, dy] as [number, number], score };
  });

  let roll = Math.random() * total;
  for (const entry of weighted) {
    roll -= entry.score;
    if (roll <= 0) return entry.cell;
  }

  return weighted[weighted.length - 1].cell;
}

function tick(state: State, now: number = Date.now()): State {
  const nowDate = new Date(now);
  const weather = getWeather(nowDate);
  const wind = getWind(nowDate);
  const cells = new Map(state.cells);
  const activity = [...state.activity];
  let planted = state.planted;

  if (weather === "rain") {
    for (const [k, cell] of cells) {
      cells.set(k, { ...cell, lastWater: now });
    }
  }

  for (const [k, cell] of cells) {
    const age = now - cell.plantedAt;
    const dryness = now - (cell.lastWater || cell.plantedAt);
    const idx = STAGE_ORDER.indexOf(cell.stage);

    if (cell.stage === "wilt" && age > RETURN_TO_SOIL_MS) {
      cells.delete(k);
      activity.unshift({
        t: now,
        type: "cycle",
        msg: `${cell.species} at (${k}) returned to soil`,
      });
    } else if (idx < 3 && age > GROW_INTERVAL_MS * (idx + 1) && dryness < WILT_MS) {
      cells.set(k, { ...cell, stage: STAGE_ORDER[idx + 1] });
    } else if (cell.stage !== "wilt" && age > NATURAL_WILT_MS) {
      cells.set(k, { ...cell, stage: "wilt" });
      activity.unshift({
        t: now,
        type: "cycle",
        msg: `${cell.species} at (${k}) reached the end of its cycle`,
      });
    } else if (cell.stage !== "wilt" && dryness > WILT_MS) {
      cells.set(k, { ...cell, stage: "wilt" });
      activity.unshift({ t: now, type: "wilt", msg: `${cell.species} at (${k}) wilted` });
    }
  }

  const bloomRate =
    weather === "clear" ? 0.08 : weather === "cloudy" ? 0.04 : weather === "rain" ? 0.12 : 0.02;

  for (const [k, cell] of cells) {
    if (cell.stage !== "bloom") continue;
    if (Math.random() > bloomRate) continue;
    if (cells.size >= MAX_CELLS) continue;

    const [x, y] = k.split(",").map(Number);
    const neighbors: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
      [x + 1, y + 1],
      [x - 1, y - 1],
      [x + 1, y - 1],
      [x - 1, y + 1],
    ];
    const free = neighbors.filter(([nx, ny]) => !cells.has(`${nx},${ny}`));

    if (!free.length) continue;

    const offsets = free.map(([nx, ny]) => [nx - x, ny - y] as [number, number]);
    const [dx, dy] = chooseWindBiasedNeighbor(offsets, wind);
    const nx = x + dx;
    const ny = y + dy;
    cells.set(`${nx},${ny}`, {
      species: cell.species,
      stage: "seed",
      plantedAt: now,
      lastWater: now,
      author: "pollen",
    });
    planted++;
    activity.unshift({ t: now, type: "pollen", msg: `${cell.species} seeded at (${nx},${ny})` });
  }

  return { ...state, cells, activity: activity.slice(0, 20), planted };
}

function plant(state: State, x: number, y: number, species: Species, now: number = Date.now()): State {
  const k = `${x},${y}`;
  if (state.cells.has(k)) return state;
  if (state.cells.size >= MAX_CELLS) {
    return {
      ...state,
      activity: prependActivity(state, { t: now, type: "system", msg: POPULATION_CAP_MSG }),
    };
  }

  const cells = new Map(state.cells);
  cells.set(k, { species, stage: "seed", plantedAt: now, lastWater: now, author: "you" });
  const activity = prependActivity(state, {
    t: now,
    type: "plant",
    msg: `planted ${species} at (${x},${y})`,
  });

  return { ...state, cells, activity, planted: state.planted + 1 };
}

function water(state: State, x: number, y: number, now: number = Date.now()): State {
  const k = `${x},${y}`;
  if (!state.cells.has(k)) return state;

  const cells = new Map(state.cells);
  const cell = cells.get(k)!;
  const age = now - cell.plantedAt;
  const stage: Stage =
    cell.stage === "wilt" && age < NATURAL_WILT_MS ? "bud" : cell.stage;
  cells.set(k, { ...cell, lastWater: now, stage });
  const action =
    cell.stage === "wilt" && age < NATURAL_WILT_MS
      ? `watered (${x},${y}) and revived it to bud`
      : `watered (${x},${y})`;
  const activity = prependActivity(state, { t: now, type: "water", msg: action });

  return { ...state, cells, activity };
}

function prune(state: State, x: number, y: number, now: number = Date.now()): State {
  const k = `${x},${y}`;
  if (!state.cells.has(k)) return state;

  const cells = new Map(state.cells);
  const cell = cells.get(k)!;
  cells.delete(k);
  const activity = prependActivity(state, {
    t: now,
    type: "prune",
    msg: `pruned ${cell.species} at (${x},${y})`,
  });

  return { ...state, cells, activity };
}

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

function initGarden(root: HTMLElement): void {
  const qs = <T extends HTMLElement>(sel: string): T => root.querySelector<T>(sel)!;

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

  let state: State = loadState();
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
  let hasShownPersistenceWarning = false;
  const activePointers = new Map<number, { clientX: number; clientY: number }>();

  const isPanning = (): boolean => panInteraction !== null;
  const getCellSize = (): number => CELL_PX * zoom;

  const setState = (next: State): void => {
    state = next;
    if (saveState(state)) {
      hasShownPersistenceWarning = false;
    } else if (!hasShownPersistenceWarning) {
      state = {
        ...state,
        activity: prependActivity(state, {
          t: Date.now(),
          type: "system",
          msg: STORAGE_WARNING_MSG,
        }),
      };
      hasShownPersistenceWarning = true;
    }
    renderFlowers();
    renderHover();
    renderStats();
    renderActivity();
  };

  const screenToWorld = (sx: number, sy: number) => {
    const cellSize = getCellSize();
    return {
      x: (sx - pan.x) / cellSize,
      y: (sy - pan.y) / cellSize,
    };
  };

  const screenToCell = (sx: number, sy: number) => {
    const world = screenToWorld(sx, sy);
    return {
      x: Math.floor(world.x),
      y: Math.floor(world.y),
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

    if (nextZoom === zoom) return;

    const world = screenToWorld(sx, sy);
    zoom = nextZoom;
    const cellSize = getCellSize();
    pan = {
      x: sx - world.x * cellSize,
      y: sy - world.y * cellSize,
    };
  };

  const applyTool = (x: number, y: number): void => {
    if (tool === "plant") setState(plant(state, x, y, species));
    else if (tool === "water") setState(water(state, x, y));
    else if (tool === "prune") setState(prune(state, x, y));
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

    for (const [k, cell] of state.cells) {
      const [x, y] = k.split(",").map(Number);
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
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

    const hoverCell = state.cells.get(`${hover.x},${hover.y}`);

    if (tool === "plant" && !hoverCell) {
      const ghost = document.createElement("div");
      ghost.className = "garden-ghost-flower";
      ghost.appendChild(createSprite(species, "seed", cellSize));
      refs.cellHover.appendChild(ghost);
    }

    if (hoverCell) {
      refs.cellTip.hidden = false;
      refs.cellTip.replaceChildren();
      const head = document.createElement("div");
      head.textContent = `${hoverCell.species} / ${hoverCell.stage}`;
      const coord = document.createElement("div");
      coord.className = "garden-dim";
      coord.textContent = `(${hover.x},${hover.y}) \u00b7 planted ${formatAgo(hoverCell.plantedAt)}`;
      const water = document.createElement("div");
      water.className = "garden-dim";
      water.textContent = `${getHydrationLabel(hoverCell)} \u00b7 last watered ${formatAgo(hoverCell.lastWater)}`;
      const author = document.createElement("div");
      author.className = "garden-dim";
      author.textContent = `by ${hoverCell.author}`;
      refs.cellTip.appendChild(head);
      refs.cellTip.appendChild(coord);
      refs.cellTip.appendChild(water);
      refs.cellTip.appendChild(author);

      const tipLeft = Math.min(hover.px + 14, viewport.w - 180);
      const tipTop = Math.min(hover.py + 14, viewport.h - 80);
      refs.cellTip.style.left = `${tipLeft}px`;
      refs.cellTip.style.top = `${tipTop}px`;
    } else {
      refs.cellTip.hidden = true;
    }
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

  const renderStats = (): void => {
    const speciesCounts: Partial<Record<Species, number>> = {};
    const stageCounts: Record<Stage, number> = { seed: 0, sprout: 0, bud: 0, bloom: 0, wilt: 0 };

    for (const [, cell] of state.cells) {
      speciesCounts[cell.species] = (speciesCounts[cell.species] ?? 0) + 1;
      stageCounts[cell.stage]++;
    }

    const totalCells = state.cells.size;
    const alive = totalCells - stageCounts.wilt;
    const bloomPct = totalCells ? Math.round((stageCounts.bloom / totalCells) * 100) : 0;
    const health = getGardenHealth(stageCounts, totalCells);

    refs.statTotal.textContent = String(state.planted).padStart(4, "0");
    refs.statAlive.textContent = String(alive).padStart(4, "0");
    refs.statHealth.textContent = health;
    refs.statBloom.textContent = `${bloomPct}%`;

    const now = new Date();
    const weather = getWeather(now);
    const wind = getWind(now);
    const season = getSeason(now);
    const daytime = isDaytime(now);

    refs.statSeason.textContent = season;
    refs.statWeather.textContent = weather;
    refs.statWind.textContent = getWindLabel(wind);
    refs.statTime.textContent = daytime ? "day" : "night";

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

    if (state.activity.length === 0) {
      const empty = document.createElement("div");
      empty.className = "garden-dim";
      empty.textContent = "no activity yet";
      refs.activity.appendChild(empty);
      return;
    }

    for (const entry of state.activity.slice(0, 8)) {
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
      time.textContent = formatAgo(entry.t);
      row.append(type, msg, time);
      refs.activity.appendChild(row);
    }
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
      const label = document.createTextNode(sp);
      btn.append(icon, label);
      btn.addEventListener("click", () => {
        species = sp;
        renderSpecies();
        renderHover();
      });
      refs.speciesButtons.appendChild(btn);
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

  const updateCursor = (): void => {
    if (isPanning()) {
      refs.surface.dataset.cursor = "panning";
    } else if (isSpacePressed) {
      refs.surface.dataset.cursor = "pan";
    } else {
      refs.surface.dataset.cursor = tool;
    }
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
    if (pointers.length < 2) return null;
    const rect = refs.surface.getBoundingClientRect();
    return {
      x: (pointers[0].clientX + pointers[1].clientX) / 2 - rect.left,
      y: (pointers[0].clientY + pointers[1].clientY) / 2 - rect.top,
    };
  };

  const getGestureDistance = (): number | null => {
    const pointers = Array.from(activePointers.values()).slice(0, 2);
    if (pointers.length < 2) return null;
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
    if (!centroid || distance === null) return;
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
    if (e.pointerType === "mouse" && e.button === 2) return;

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

    if (e.button !== 0) return;

    e.preventDefault();
    refs.surface.setPointerCapture(e.pointerId);
    const { x, y } = screenToCell(px, py);
    applyTool(x, y);
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
      applyTool(x, y);
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

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isFormField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement;

    if (e.code === "Space" && !isFormField) {
      if (!isSpacePressed) {
        isSpacePressed = true;
        updateCursor();
      }
      e.preventDefault();
      return;
    }

    if (isFormField) return;

    const step = getCellSize() * (e.shiftKey ? 5 : 1);
    let handled = true;

    if (e.key === "ArrowLeft") pan = { ...pan, x: pan.x + step };
    else if (e.key === "ArrowRight") pan = { ...pan, x: pan.x - step };
    else if (e.key === "ArrowUp") pan = { ...pan, y: pan.y + step };
    else if (e.key === "ArrowDown") pan = { ...pan, y: pan.y - step };
    else if (e.key === "Home") resetView();
    else if (e.key === "p" || e.key === "P") setTool("plant");
    else if (e.key === "w" || e.key === "W") setTool("water");
    else if (e.key === "x" || e.key === "X") setTool("prune");
    else if (e.key === "1") {
      species = "daisy";
      renderSpecies();
    } else if (e.key === "2") {
      species = "tulip";
      renderSpecies();
    } else if (e.key === "3") {
      species = "poppy";
      renderSpecies();
    } else if (e.key === "4") {
      species = "fern";
      renderSpecies();
    } else {
      handled = false;
    }

    if (handled && e.key.startsWith("Arrow")) e.preventDefault();
    if (handled) renderViewportDependent();
  });

  window.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.code === "Space" && isSpacePressed) {
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

  setInterval(() => setState(tick(state, Date.now())), 6000);
  setInterval(() => {
    renderActivity();
    renderStats();
  }, 30000);

  renderTools();
  renderSpecies();
  renderStats();
  renderActivity();
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector<HTMLElement>("[data-garden-root]");
  if (root) initGarden(root);
});
