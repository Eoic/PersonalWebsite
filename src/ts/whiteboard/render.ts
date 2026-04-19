import {
    getAnchoredTransform,
    getCenteredOrigin,
    screenToWorld as transformScreenToWorld,
    worldToScreen as transformWorldToScreen
} from '../canvas';
import { clamp } from '../utils';
import { GRID_PX, MAX_ZOOM, MIN_ZOOM } from './constants';
import type {
    Point,
    Stroke,
    WhiteboardContexts,
    WhiteboardRefs,
    WhiteboardState
} from './types';
import { getWorldColorToken } from './utils';

function getTransform(state: WhiteboardState) {
    return {
        originX: state.camera.originX,
        originY: state.camera.originY,
        scale: state.camera.zoom,
    };
}

export function getScreenPoint(
    overlayCanvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
): Point {
    const rect = overlayCanvas.getBoundingClientRect();

    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    };
}

export function screenToWorld(state: WhiteboardState, point: Point): Point {
    return transformScreenToWorld(point, getTransform(state));
}

export function worldToScreen(state: WhiteboardState, point: Point): Point {
    return transformWorldToScreen(point, getTransform(state));
}

export function resetCamera(state: WhiteboardState): void {
    state.camera.zoom = 1;
    state.camera.originX = state.viewportWidth / 2;
    state.camera.originY = state.viewportHeight / 2;
}

export function zoomAt(state: WhiteboardState, screenPoint: Point, targetZoom: number): void {
    const nextZoom = clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);

    if (nextZoom === state.camera.zoom) 
        return;

    const nextTransform = getAnchoredTransform(getTransform(state), screenPoint, nextZoom);
    state.camera.zoom = nextTransform.scale;
    state.camera.originX = nextTransform.originX;
    state.camera.originY = nextTransform.originY;
}

function configureContext(context: CanvasRenderingContext2D): void {
    const devicePixelRatio = window.devicePixelRatio || 1;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

export function renderBackground(refs: WhiteboardRefs, state: WhiteboardState): void {
    const gridSize = GRID_PX * state.camera.zoom;
    const centeredOriginX = state.viewportWidth / 2;
    const centeredOriginY = state.viewportHeight / 2;
    const isCentered =
        Math.abs(state.camera.originX - centeredOriginX) < 0.01 &&
        Math.abs(state.camera.originY - centeredOriginY) < 0.01;

    if (isCentered) {
        refs.gridDots.style.backgroundPosition = '50% 50%';
        refs.axisH.style.top = '50%';
        refs.axisV.style.left = '50%';
    } else {
        refs.gridDots.style.backgroundPosition = `${state.camera.originX}px ${state.camera.originY}px`;
        refs.axisH.style.top = `${state.camera.originY}px`;
        refs.axisV.style.left = `${state.camera.originX}px`;
    }

    refs.gridDots.style.backgroundSize = `${gridSize}px ${gridSize}px`;
}

export function resizeCanvases(
    refs: WhiteboardRefs,
    state: WhiteboardState,
    contexts: WhiteboardContexts
): void {
    const rect = refs.canvasShell.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    const previousCenterWorld =
        state.viewportWidth > 0 && state.viewportHeight > 0
            ? screenToWorld(state, {
                x: state.viewportWidth / 2,
                y: state.viewportHeight / 2,
            })
            : null;

    state.viewportWidth = rect.width;
    state.viewportHeight = rect.height;

    [refs.committedCanvas, refs.overlayCanvas].forEach((canvas) => {
        canvas.width = Math.max(1, Math.round(rect.width * devicePixelRatio));
        canvas.height = Math.max(1, Math.round(rect.height * devicePixelRatio));
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    });

    configureContext(contexts.committed);
    configureContext(contexts.overlay);

    if (!state.hasInitializedView) {
        resetCamera(state);
        state.hasInitializedView = true;
    } else if (previousCenterWorld) {
        const nextOrigin = getCenteredOrigin(
            previousCenterWorld,
            { x: rect.width / 2, y: rect.height / 2 },
            state.camera.zoom
        );

        state.camera.originX = nextOrigin.x;
        state.camera.originY = nextOrigin.y;
    }
}

export function drawStroke(
    state: WhiteboardState,
    context: CanvasRenderingContext2D,
    stroke: Stroke,
    colorOverride?: string
): void {
    const lineWidth = Math.max(stroke.brushSize * state.camera.zoom, 1);
    const points = stroke.points.map((point) => worldToScreen(state, point));

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = colorOverride ?? stroke.color;
    context.fillStyle = colorOverride ?? stroke.color;
    context.lineWidth = lineWidth;

    if (points.length === 1) {
        context.beginPath();
        context.arc(points[0].x, points[0].y, lineWidth / 2, 0, Math.PI * 2);
        context.fill();
        context.restore();
        return;
    }

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length; index += 1) 
        context.lineTo(points[index].x, points[index].y);

    context.stroke();
    context.restore();
}

export function renderCommittedCanvas(
    state: WhiteboardState,
    contexts: WhiteboardContexts
): void {
    contexts.committed.clearRect(0, 0, state.viewportWidth, state.viewportHeight);

    state.strokes.forEach((stroke) => {
        drawStroke(state, contexts.committed, stroke);
    });
}

export function renderOverlayCanvas(
    state: WhiteboardState,
    contexts: WhiteboardContexts
): void {
    contexts.overlay.clearRect(0, 0, state.viewportWidth, state.viewportHeight);

    if (state.hoverEraseStrokeId !== null) {
        const hoverStroke = state.strokes.find((stroke) => stroke.id === state.hoverEraseStrokeId);

        if (hoverStroke) {
            drawStroke(
                state,
                contexts.overlay,
                hoverStroke,
                getWorldColorToken('--color-border-error') || '#dc2c2c'
            );
        }
    }

    if (state.interaction?.mode === 'draw') {
        drawStroke(state, contexts.overlay, {
            id: 0,
            tool: 'draw',
            color: state.color,
            brushSize: state.brushSize,
            points: state.interaction.points,
            createdAt: '',
        });
    }
}

export function redraw(
    refs: WhiteboardRefs,
    state: WhiteboardState,
    contexts: WhiteboardContexts,
    updateCursor: () => void
): void {
    renderBackground(refs, state);
    renderCommittedCanvas(state, contexts);
    renderOverlayCanvas(state, contexts);
    updateCursor();
}
