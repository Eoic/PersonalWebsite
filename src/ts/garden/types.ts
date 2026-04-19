export type Species = 'daisy' | 'tulip' | 'poppy' | 'fern';
export type Stage = 'seed' | 'sprout' | 'bud' | 'bloom' | 'wilt';
export type Tool = 'plant' | 'water' | 'prune';
export type Weather = 'clear' | 'cloudy' | 'rain' | 'fog' | 'snow';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Health = 'thriving' | 'healthy' | 'steady' | 'struggling' | 'dormant';
export type WindDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type WindStrength = 'calm' | 'light' | 'steady' | 'gusty';

export type Cell = {
  stage: Stage;
  author: string;
  species: Species;
  plantedAt: number;
  lastWater: number;
};

export type Activity = {
  msg: string;
  tick: number;
  type: string;
};

export type SpritePart = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity?: number;
};

export type SnapshotCell = {
  x: number;
  y: number;
  species: Species;
  stage: Stage;
  plantedAt: string;
  lastWaterAt: string;
  author: string;
};

export type SnapshotActivity = {
  msg: string;
  type: string;
  createdAt: string;
};

export type SnapshotResponse = {
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
    time: 'day' | 'night';
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

export type GardenWorldState = {
  planted: number;
  activity: Activity[];
  cells: Map<string, Cell>;
  version: number;
  serverNow: number;
  stats: SnapshotResponse['stats'];
  environment: SnapshotResponse['environment'];
};

export type GardenRefs = {
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
  activityStatus: HTMLElement;
  activity: HTMLElement;
};

export type Config = {
    world: GardenWorldState | null;
    tool: Tool;
    species: Species;
    pan: { x: number; y: number };
    zoom: number;
    viewport: { width: number; height: number };
    hover: { x: number; y: number; px: number; py: number } | null;
    panInteraction:
        | { pointerId: number; lastX: number; lastY: number }
        | { mode: 'gesture'; centroid: { x: number; y: number }; distance: number }
        | null;
    pendingTouchAction:
        | { pointerId: number; startX: number; startY: number; lastX: number; lastY: number; moved: boolean }
        | null;
    isSpacePressed: boolean;
    centered: boolean;
    isBooting: boolean;
    isLoaded: boolean;
    loadError: string;
    serverTimeOffsetMs: number;
    activePointers: Map<number, { clientX: number; clientY: number }>;
};
