import * as T from './types';
import * as C from './constants';
import { SPRITES } from './sprites';

export function createSprite(species: T.Species, stage: T.Stage, size: number): SVGSVGElement {
    const parts = SPRITES[species][stage];
    const svg = document.createElementNS(C.SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.style.display = 'block';
    svg.style.shapeRendering = 'crispEdges';

    for (const part of parts) {
        const rect = document.createElementNS(C.SVG_NS, 'rect');
        rect.setAttribute('x', String(part.x));
        rect.setAttribute('y', String(part.y));
        rect.setAttribute('width', String(part.width ?? 1));
        rect.setAttribute('height', String(part.height ?? 1));
        rect.setAttribute('fill', 'currentColor');
        rect.setAttribute('opacity', String(part.opacity ?? 1));
        svg.appendChild(rect);
    }

    return svg;
}

export function formatAgo(time: number, now: number = Date.now()): string {
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

export function getHydrationLabel(cell: T.Cell, now: number): string {
    if (cell.stage === 'wilt')
        return 'wilted';

    const dryness = now - (cell.lastWater || cell.plantedAt);

    if (dryness < C.WATER_WARN_MS / 2)
        return 'hydrated';

    if (dryness < C.WATER_WARN_MS)
        return 'okay';

    if (dryness < C.WILT_MS / 2)
        return 'watch soon';

    if (dryness < C.WILT_MS)
        return 'thirsty';

    return 'parched';
}

function parseTimestamp(value: string): number {
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : 0;
}

export function normalizeSnapshot(snapshot: T.SnapshotResponse): T.GardenWorldState {
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
                }
            ])
        ),
        version: snapshot.version,
        serverNow: parseTimestamp(snapshot.serverNow),
        stats: snapshot.stats,
        environment: snapshot.environment,
    };
}
