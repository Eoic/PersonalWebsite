import { clamp } from '../utils';
import type { Point } from './types';

export function distance(a: Point, b: Point): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distanceToSegment(point: Point, start: Point, end: Point): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (dx === 0 && dy === 0) 
        return distance(point, start);

    const projection =
        ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
    const t = clamp(projection, 0, 1);

    return distance(point, {
        x: start.x + dx * t,
        y: start.y + dy * t,
    });
}

export function getWorldColorToken(tokenName: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
}

export function generateClientSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') 
        return crypto.randomUUID();

    return `session-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export async function parseErrorResponse(response: Response): Promise<string> {
    try {
        const data: unknown = await response.json();

        if (
            typeof data === 'object' &&
            data !== null &&
            'error' in data &&
            typeof data.error === 'string' &&
            data.error.trim()
        ) 
            return data.error;
    } catch {
        return `Request failed (${response.status})`;
    }

    return `Request failed (${response.status})`;
}

export function isEditableTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
    );
}
