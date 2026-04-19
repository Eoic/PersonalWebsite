import { MIN_POINT_DISTANCE } from './constants';
import type { Point, WhiteboardState } from './types';
import { distance, distanceToSegment, isEditableTarget } from './utils';

type InteractionDeps = {
    state: WhiteboardState;
    redraw: () => void;
    renderOverlay: () => void;
    updateCursor: () => void;
    setTool: (tool: 'draw' | 'erase') => void;
    adjustBrushSize: (delta: number) => void;
    saveStroke: (points: Point[]) => Promise<void>;
    deleteStroke: (strokeId: number) => Promise<void>;
    clearWhiteboard: () => Promise<void>;
    resetCamera: () => void;
    handleFullscreenToggle: () => void;
    getScreenPoint: (clientX: number, clientY: number) => Point;
    screenToWorld: (point: Point) => Point;
    zoomAt: (screenPoint: Point, targetZoom: number) => void;
};

export function createInteractions(deps: InteractionDeps) {
    const getGesturePointers = () => Array.from(deps.state.activePointers.values()).slice(0, 2);

    const findErasableStrokeId = (worldPoint: Point): number | null => {
        for (
            let strokeIndex = deps.state.strokes.length - 1;
            strokeIndex >= 0;
            strokeIndex -= 1
        ) {
            const stroke = deps.state.strokes[strokeIndex];

            if (
                (!deps.state.canManageWhiteboard &&
                    !deps.state.createdStrokeIds.has(stroke.id)) ||
                deps.state.pendingDeleteIds.has(stroke.id)
            ) 
                continue;

            const threshold = stroke.brushSize / 2 + 10 / deps.state.camera.zoom;

            if (stroke.points.length === 1) {
                if (distance(worldPoint, stroke.points[0]) <= threshold) 
                    return stroke.id;

                continue;
            }

            for (let pointIndex = 1; pointIndex < stroke.points.length; pointIndex += 1) {
                const segmentDistance = distanceToSegment(
                    worldPoint,
                    stroke.points[pointIndex - 1],
                    stroke.points[pointIndex]
                );

                if (segmentDistance <= threshold) 
                    return stroke.id;
            }
        }

        return null;
    };

    const beginDraw = (pointerId: number, screenPoint: Point): void => {
        deps.state.hoverEraseStrokeId = null;

        deps.state.interaction = {
            mode: 'draw',
            pointerId,
            points: [deps.screenToWorld(screenPoint)],
        };

        deps.renderOverlay();
    };

    const extendDraw = (screenPoint: Point): void => {
        if (deps.state.interaction?.mode !== 'draw') 
            return;

        const worldPoint = deps.screenToWorld(screenPoint);
        const previousPoint =
            deps.state.interaction.points[deps.state.interaction.points.length - 1];

        if (distance(worldPoint, previousPoint) < MIN_POINT_DISTANCE / deps.state.camera.zoom) 
            return;

        deps.state.interaction.points.push(worldPoint);
        deps.renderOverlay();
    };

    const finishDraw = (): void => {
        if (deps.state.interaction?.mode !== 'draw') 
            return;

        const points = deps.state.interaction.points.slice();
        deps.state.interaction = null;
        deps.renderOverlay();

        if (points.length === 0) 
            return;

        void deps.saveStroke(points);
    };

    const beginErase = (pointerId: number, screenPoint: Point): void => {
        deps.state.interaction = {
            mode: 'erase',
            pointerId,
        };

        void eraseAt(screenPoint);
    };

    const eraseAt = async (screenPoint: Point): Promise<void> => {
        const strokeId = findErasableStrokeId(deps.screenToWorld(screenPoint));
        deps.state.hoverEraseStrokeId = strokeId;
        deps.renderOverlay();

        if (strokeId !== null) 
            await deps.deleteStroke(strokeId);
    };

    const beginPan = (pointerId: number, screenPoint: Point): void => {
        deps.state.interaction = {
            mode: 'pan',
            pointerId,
            lastScreenPoint: screenPoint,
        };

        deps.updateCursor();
    };

    const updatePan = (screenPoint: Point): void => {
        if (deps.state.interaction?.mode !== 'pan') 
            return;

        const deltaX = screenPoint.x - deps.state.interaction.lastScreenPoint.x;
        const deltaY = screenPoint.y - deps.state.interaction.lastScreenPoint.y;

        deps.state.camera.originX += deltaX;
        deps.state.camera.originY += deltaY;
        deps.state.interaction.lastScreenPoint = screenPoint;
        deps.redraw();
    };

    const beginGesture = (): void => {
        const [firstPointer, secondPointer] = getGesturePointers();

        if (!firstPointer || !secondPointer) 
            return;

        deps.state.interaction = {
            mode: 'gesture',
            centroid: {
                x: (firstPointer.clientX + secondPointer.clientX) / 2,
                y: (firstPointer.clientY + secondPointer.clientY) / 2,
            },
            distance: Math.max(
                Math.hypot(
                    secondPointer.clientX - firstPointer.clientX,
                    secondPointer.clientY - firstPointer.clientY
                ),
                1
            ),
        };

        deps.updateCursor();
    };

    const updateGesture = (): void => {
        if (deps.state.interaction?.mode !== 'gesture') 
            return;

        const [firstPointer, secondPointer] = getGesturePointers();

        if (!firstPointer || !secondPointer) {
            deps.state.interaction = null;
            deps.updateCursor();
            return;
        }

        const nextCentroidClient = {
            x: (firstPointer.clientX + secondPointer.clientX) / 2,
            y: (firstPointer.clientY + secondPointer.clientY) / 2,
        };

        const previousCentroidScreen = deps.getScreenPoint(
            deps.state.interaction.centroid.x,
            deps.state.interaction.centroid.y
        );

        const nextCentroidScreen = deps.getScreenPoint(
            nextCentroidClient.x,
            nextCentroidClient.y
        );

        const nextDistance = Math.max(
            Math.hypot(
                secondPointer.clientX - firstPointer.clientX,
                secondPointer.clientY - firstPointer.clientY
            ),
            1
        );

        deps.state.camera.originX += nextCentroidScreen.x - previousCentroidScreen.x;
        deps.state.camera.originY += nextCentroidScreen.y - previousCentroidScreen.y;

        deps.zoomAt(
            nextCentroidScreen,
            deps.state.camera.zoom * (nextDistance / deps.state.interaction.distance)
        );

        deps.state.interaction.centroid = nextCentroidClient;
        deps.state.interaction.distance = nextDistance;
        deps.redraw();
    };

    const clearInteraction = (): void => {
        deps.state.interaction = null;
        deps.state.hoverEraseStrokeId = null;
        deps.renderOverlay();
        deps.updateCursor();
    };

    const handlePointerDown = (event: PointerEvent): void => {
        if (deps.state.isBooting) 
            return;

        if (event.pointerType === 'mouse' && event.button === 2) 
            return;

        const screenPoint = deps.getScreenPoint(event.clientX, event.clientY);

        deps.state.activePointers.set(event.pointerId, {
            clientX: event.clientX,
            clientY: event.clientY,
        });

        if (event.pointerType === 'touch') {
            event.preventDefault();

            if (deps.state.activePointers.size === 1) {
                if (deps.state.tool === 'erase') 
                    beginErase(event.pointerId, screenPoint);
                else 
                    beginDraw(event.pointerId, screenPoint);
                

                return;
            }

            if (deps.state.activePointers.size === 2) {
                clearInteraction();
                beginGesture();
            }

            return;
        }

        if (event.button === 1 || (event.button === 0 && deps.state.isSpacePressed)) {
            event.preventDefault();
            beginPan(event.pointerId, screenPoint);
            return;
        }

        if (event.button !== 0) 
            return;

        event.preventDefault();

        if (deps.state.tool === 'erase') {
            beginErase(event.pointerId, screenPoint);
            return;
        }

        beginDraw(event.pointerId, screenPoint);
    };

    const handlePointerMove = (event: PointerEvent): void => {
        if (deps.state.isBooting) 
            return;

        if (deps.state.activePointers.has(event.pointerId)) {
            deps.state.activePointers.set(event.pointerId, {
                clientX: event.clientX,
                clientY: event.clientY,
            });
        }

        const screenPoint = deps.getScreenPoint(event.clientX, event.clientY);

        if (
            deps.state.interaction?.mode === 'draw' &&
            deps.state.interaction.pointerId === event.pointerId
        ) {
            event.preventDefault();
            extendDraw(screenPoint);
            return;
        }

        if (
            deps.state.interaction?.mode === 'erase' &&
            deps.state.interaction.pointerId === event.pointerId
        ) {
            event.preventDefault();
            void eraseAt(screenPoint);
            return;
        }

        if (
            deps.state.interaction?.mode === 'pan' &&
            deps.state.interaction.pointerId === event.pointerId
        ) {
            event.preventDefault();
            updatePan(screenPoint);
            return;
        }

        if (deps.state.interaction?.mode === 'gesture') {
            event.preventDefault();
            updateGesture();
            return;
        }

        if (deps.state.tool === 'erase' && event.pointerType === 'mouse') {
            deps.state.hoverEraseStrokeId = findErasableStrokeId(
                deps.screenToWorld(screenPoint)
            );
            deps.renderOverlay();
        }
    };

    const handlePointerUp = (event: PointerEvent): void => {
        if (deps.state.isBooting) 
            return;

        deps.state.activePointers.delete(event.pointerId);

        if (
            deps.state.interaction?.mode === 'draw' &&
            deps.state.interaction.pointerId === event.pointerId
        ) 
            finishDraw();
        else if (
            (deps.state.interaction?.mode === 'erase' ||
                deps.state.interaction?.mode === 'pan') &&
            deps.state.interaction.pointerId === event.pointerId
        ) 
            clearInteraction();
        else if (
            deps.state.interaction?.mode === 'gesture' &&
            deps.state.activePointers.size < 2
        ) 
            clearInteraction();

        deps.updateCursor();
    };

    const handlePointerCancel = (event: PointerEvent): void => {
        if (deps.state.isBooting) 
            return;

        deps.state.activePointers.delete(event.pointerId);
        clearInteraction();
    };

    const handleWheel = (event: WheelEvent): void => {
        if (deps.state.isBooting) 
            return;

        event.preventDefault();

        const screenPoint = deps.getScreenPoint(event.clientX, event.clientY);
        const scale = Math.exp(-event.deltaY * 0.0015);

        deps.zoomAt(screenPoint, deps.state.camera.zoom * scale);
        deps.redraw();
    };

    const handleResetOrigin = (): void => {
        if (deps.state.isBooting) 
            return;

        deps.resetCamera();
        deps.redraw();
    };

    const handleClearRequest = (): void => {
        if (deps.state.isBooting) 
            return;

        if (!deps.state.canManageWhiteboard) 
            return;

        const shouldClear = window.confirm('Clear the entire whiteboard?');

        if (!shouldClear) 
            return;

        void (async () => {
            try {
                await deps.clearWhiteboard();
                deps.state.strokes = [];
                deps.state.createdStrokeIds.clear();
                deps.state.pendingDeleteIds.clear();
                deps.state.hoverEraseStrokeId = null;
                deps.redraw();
            } catch {
                // Keep the current board state if clearing fails.
            }
        })();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
        if (deps.state.isBooting) 
            return;

        const isEditable = isEditableTarget(event.target);

        if (event.code === 'Space' && !isEditable) {
            deps.state.isSpacePressed = true;
            event.preventDefault();
            deps.updateCursor();
            return;
        }

        if (isEditable) 
            return;

        switch (event.code) {
            case 'KeyD':
                event.preventDefault();
                deps.setTool('draw');
                break;
            case 'KeyE':
                event.preventDefault();
                deps.setTool('erase');
                break;
            case 'BracketLeft':
                event.preventDefault();
                deps.adjustBrushSize(-1);
                break;
            case 'BracketRight':
                event.preventDefault();
                deps.adjustBrushSize(1);
                break;
            case 'KeyO':
                if (!event.repeat) {
                    event.preventDefault();
                    handleResetOrigin();
                }
                break;
            case 'KeyF':
                if (!event.repeat) {
                    event.preventDefault();
                    deps.handleFullscreenToggle();
                }
                break;
            case 'Delete':
            case 'Backspace':
                if (deps.state.canManageWhiteboard && !event.repeat) {
                    event.preventDefault();
                    handleClearRequest();
                }
                break;
            default:
                break;
        }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
        if (deps.state.isBooting) 
            return;

        if (event.code === 'Space') {
            deps.state.isSpacePressed = false;
            deps.updateCursor();
        }
    };

    return {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        handleWheel,
        handleKeyDown,
        handleKeyUp,
        handleResetOrigin,
        handleClearRequest,
    };
}
