export type CanvasPoint = {
    x: number;
    y: number;
};

export type CanvasTransform = {
    originX: number;
    originY: number;
    scale: number;
};

export function screenToWorld(point: CanvasPoint, transform: CanvasTransform): CanvasPoint {
    return {
        x: (point.x - transform.originX) / transform.scale,
        y: (point.y - transform.originY) / transform.scale,
    };
}

export function worldToScreen(point: CanvasPoint, transform: CanvasTransform): CanvasPoint {
    return {
        x: point.x * transform.scale + transform.originX,
        y: point.y * transform.scale + transform.originY,
    };
}

export function getAnchoredTransform(
    transform: CanvasTransform,
    anchor: CanvasPoint,
    nextScale: number
): CanvasTransform {
    const worldPoint = screenToWorld(anchor, transform);

    return {
        originX: anchor.x - worldPoint.x * nextScale,
        originY: anchor.y - worldPoint.y * nextScale,
        scale: nextScale,
    };
}

export function getCenteredOrigin(
    worldPoint: CanvasPoint,
    viewportCenter: CanvasPoint,
    scale: number
): CanvasPoint {
    return {
        x: viewportCenter.x - worldPoint.x * scale,
        y: viewportCenter.y - worldPoint.y * scale,
    };
}
