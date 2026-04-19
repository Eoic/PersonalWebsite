import { Species } from './types';

export const CELL_PX = 28;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
export const LS_KEY = 'ks.garden.v1';
export const SPECIES_LIST: Species[] = ['daisy', 'tulip', 'poppy', 'fern'];
export const WATER_WARN_MS = 1000 * 60 * 60 * 24 * 3;
export const WILT_MS = 1000 * 60 * 60 * 24 * 14;
export const TOUCH_TAP_SLOP_PX = 12;
export const SVG_NS = 'http://www.w3.org/2000/svg';
export const SNAPSHOT_FETCH_INTERVAL_MS = 15 * 1000;
export const ACTIVITY_RENDER_INTERVAL_MS = 30 * 1000;
