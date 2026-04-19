import {
    clearWhiteboardRequest,
    createStrokeRequest,
    deleteStrokeRequest,
    loadStrokesRequest
} from './api';
import { DEFAULT_BRUSH_SIZE, DEFAULT_STATUS_DURATION_MS } from './constants';
import {
    getScreenPoint,
    redraw,
    renderOverlayCanvas,
    resetCamera,
    resizeCanvases,
    screenToWorld,
    zoomAt
} from './render';
import { createInteractions } from './interactions';
import type {
    Point,
    Stroke,
    Tool,
    WhiteboardContexts,
    WhiteboardRefs,
    WhiteboardState
} from './types';
import { generateClientSessionId, getWorldColorToken } from './utils';

export function initWhiteboard(root: HTMLElement): void {
    const shell = root.querySelector<HTMLElement>('[data-whiteboard-shell]');
    const canvasShell = root.querySelector<HTMLElement>('[data-canvas-shell]');
    const gridDots = root.querySelector<HTMLElement>('[data-grid-dots]');
    const axisH = root.querySelector<HTMLElement>('[data-axis-h]');
    const axisV = root.querySelector<HTMLElement>('[data-axis-v]');
    const committedCanvas = root.querySelector<HTMLCanvasElement>('[data-whiteboard-committed]');
    const overlayCanvas = root.querySelector<HTMLCanvasElement>('[data-whiteboard-overlay]');
    const statusElement = root.querySelector<HTMLElement>('[data-status]');
    const brushColorInput = root.querySelector<HTMLInputElement>('[data-brush-color]');
    const brushSizeReadout = root.querySelector<HTMLOutputElement>('[data-brush-size-readout]');
    const fullscreenButton = root.querySelector<HTMLButtonElement>('[data-fullscreen]');
    const fullscreenLabel = root.querySelector<HTMLElement>('[data-fullscreen-label]');
    const originButton = root.querySelector<HTMLButtonElement>('[data-reset-origin]');
    const clearWhiteboardButton = root.querySelector<HTMLButtonElement>('[data-clear-whiteboard]');
    const toolButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tool]'));
    const brushSizeIncrementButton = root.querySelector<HTMLButtonElement>('[data-brush-size-increment]');
    const brushSizeDecrementButton = root.querySelector<HTMLButtonElement>('[data-brush-size-decrement]');
    const strokesEndpoint = root.dataset.strokesEndpoint;
    const canManageWhiteboard = root.dataset.canManageWhiteboard === 'true';

    if (
        !shell ||
        !canvasShell ||
        !gridDots ||
        !axisH ||
        !axisV ||
        !committedCanvas ||
        !overlayCanvas ||
        !statusElement ||
        !brushColorInput ||
        !brushSizeReadout ||
        !fullscreenButton ||
        !fullscreenLabel ||
        !originButton ||
        !brushSizeIncrementButton ||
        !brushSizeDecrementButton ||
        !strokesEndpoint
    ) 
        return;
    

    const committedContext = committedCanvas.getContext('2d');
    const overlayContext = overlayCanvas.getContext('2d');

    if (!committedContext || !overlayContext) 
        return;
    

    const refs: WhiteboardRefs = {
        root,
        shell,
        canvasShell,
        gridDots,
        axisH,
        axisV,
        committedCanvas,
        overlayCanvas,
        statusElement,
        brushColorInput,
        brushSizeReadout,
        fullscreenButton,
        fullscreenLabel,
        originButton,
        clearWhiteboardButton,
        toolButtons,
        brushSizeIncrementButton,
        brushSizeDecrementButton,
        strokesEndpoint,
    };

    const contexts: WhiteboardContexts = {
        committed: committedContext,
        overlay: overlayContext,
    };

    const state: WhiteboardState = {
        strokes: [],
        createdStrokeIds: new Set<number>(),
        pendingDeleteIds: new Set<number>(),
        activePointers: new Map(),
        interaction: null,
        hoverEraseStrokeId: null,
        camera: {
            originX: 0,
            originY: 0,
            zoom: 1,
        },
        viewportWidth: 0,
        viewportHeight: 0,
        brushSize: DEFAULT_BRUSH_SIZE,
        tool: 'draw',
        color: getWorldColorToken('--color-text') || '#1a1a1a',
        statusTimer: 0,
        nextTemporaryStrokeId: -1,
        clientSessionId: generateClientSessionId(),
        isSpacePressed: false,
        hasInitializedView: false,
        canManageWhiteboard,
    };

    refs.brushColorInput.value = state.color;

    const redrawAll = () => {
        redraw(refs, state, contexts, updateCursor);
    };

    const renderOverlay = () => {
        renderOverlayCanvas(state, contexts);
    };

    function updateBrushSizeReadout(): void {
        refs.brushSizeReadout.value = `${state.brushSize} px`;
        refs.brushSizeReadout.textContent = `${state.brushSize} px`;
        refs.brushSizeDecrementButton.disabled = state.brushSize <= 1;
        refs.brushSizeIncrementButton.disabled = state.brushSize >= 48;
    }

    function setStatus(message: string, isError = false, durationMs = DEFAULT_STATUS_DURATION_MS): void {
        refs.statusElement.textContent = message;
        refs.statusElement.classList.toggle('is-error', isError);

        if (state.statusTimer) {
            window.clearTimeout(state.statusTimer);
            state.statusTimer = 0;
        }

        if (message && durationMs > 0) {
            state.statusTimer = window.setTimeout(() => {
                refs.statusElement.textContent = '';
                refs.statusElement.classList.remove('is-error');
            }, durationMs);
        }
    }

    function updateToolControls(): void {
        refs.toolButtons.forEach((button) => {
            const isActive = button.dataset.tool === state.tool;

            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    }

    function updateFullscreenButton(): void {
        const isFullscreen = document.fullscreenElement === refs.shell;

        refs.fullscreenLabel.textContent = isFullscreen ? 'windowed' : 'fullscreen';
        refs.fullscreenButton.setAttribute(
            'aria-label',
            isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
        );
        refs.fullscreenButton.title = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
    }

    function updateCursor(): void {
        if (state.interaction?.mode === 'pan' || state.interaction?.mode === 'gesture') {
            refs.overlayCanvas.style.cursor = 'grabbing';
            return;
        }

        if (state.tool === 'erase') {
            refs.overlayCanvas.style.cursor = 'not-allowed';
            return;
        }

        refs.overlayCanvas.style.cursor = state.isSpacePressed ? 'grab' : 'crosshair';
    }

    function setTool(nextTool: Tool): void {
        state.tool = nextTool;
        updateToolControls();
        redrawAll();
    }

    function adjustBrushSize(delta: number): void {
        const nextBrushSize = Math.min(Math.max(state.brushSize + delta, 1), 48);

        if (nextBrushSize === state.brushSize) 
            return;
        

        state.brushSize = nextBrushSize;
        updateBrushSizeReadout();
        renderOverlay();
    }

    async function persistStroke(stroke: Stroke): Promise<void> {
        const data = await createStrokeRequest(
            refs.strokesEndpoint,
            state.clientSessionId,
            stroke
        );
        const strokeIndex = state.strokes.findIndex((item) => item.id === stroke.id);

        if (strokeIndex === -1) 
            return;
        

        state.strokes[strokeIndex] = {
            ...stroke,
            id: data.id,
            createdAt: data.createdAt,
            localOnly: false,
        };
        state.createdStrokeIds.add(data.id);
        redrawAll();
    }

    async function saveStroke(points: Point[]): Promise<void> {
        const stroke: Stroke = {
            id: state.nextTemporaryStrokeId,
            tool: 'draw',
            color: state.color,
            brushSize: state.brushSize,
            points,
            createdAt: new Date().toISOString(),
            localOnly: true,
        };

        state.nextTemporaryStrokeId -= 1;
        state.strokes.push(stroke);
        redrawAll();

        try {
            await persistStroke(stroke);
            setStatus('Stroke saved.');
        } catch (error) {
            state.strokes = state.strokes.filter((item) => item.id !== stroke.id);
            redrawAll();
            setStatus(
                error instanceof Error ? error.message : 'Failed to save the stroke.',
                true
            );
        }
    }

    async function deleteStroke(strokeId: number): Promise<void> {
        if (state.pendingDeleteIds.has(strokeId)) 
            return;
        

        const strokeIndex = state.strokes.findIndex((stroke) => stroke.id === strokeId);

        if (strokeIndex === -1) 
            return;
        

        const [removedStroke] = state.strokes.splice(strokeIndex, 1);
        state.pendingDeleteIds.add(strokeId);
        state.hoverEraseStrokeId = null;
        redrawAll();

        try {
            await deleteStrokeRequest(refs.strokesEndpoint, strokeId, state.clientSessionId);
            state.createdStrokeIds.delete(strokeId);
            setStatus('Stroke erased.');
        } catch (error) {
            state.strokes.splice(strokeIndex, 0, removedStroke);
            setStatus(
                error instanceof Error ? error.message : 'Failed to erase the stroke.',
                true
            );
        } finally {
            state.pendingDeleteIds.delete(strokeId);
            redrawAll();
        }
    }

    async function clearWhiteboard(): Promise<void> {
        await clearWhiteboardRequest(refs.strokesEndpoint);
    }

    async function loadStrokes(): Promise<void> {
        setStatus('Loading whiteboard…', false, 0);

        try {
            const data = await loadStrokesRequest(refs.strokesEndpoint);
            state.strokes = data.strokes.map((stroke) => ({
                ...stroke,
                localOnly: false,
            }));
            redrawAll();
            setStatus(`Loaded ${state.strokes.length} stroke${state.strokes.length === 1 ? '' : 's'}.`);
        } catch (error) {
            setStatus(
                error instanceof Error ? error.message : 'Failed to load the whiteboard.',
                true,
                0
            );
        }
    }

    const interactions = createInteractions({
        state,
        redraw: redrawAll,
        renderOverlay,
        updateCursor,
        setTool,
        adjustBrushSize,
        setStatus,
        saveStroke,
        deleteStroke,
        clearWhiteboard,
        resetCamera: () => resetCamera(state),
        handleFullscreenToggle: () => {
            if (document.fullscreenElement === refs.shell) {
                void document.exitFullscreen();
                return;
            }

            void refs.shell.requestFullscreen();
        },
        getScreenPoint: (clientX, clientY) => getScreenPoint(refs.overlayCanvas, clientX, clientY),
        screenToWorld: (point) => screenToWorld(state, point),
        zoomAt: (screenPoint, targetZoom) => zoomAt(state, screenPoint, targetZoom),
    });

    refs.toolButtons.forEach((button) => {
        button.addEventListener('click', () => {
            setTool(button.dataset.tool === 'erase' ? 'erase' : 'draw');
        });
    });

    refs.brushSizeDecrementButton.addEventListener('click', () => {
        adjustBrushSize(-1);
    });

    refs.brushSizeIncrementButton.addEventListener('click', () => {
        adjustBrushSize(1);
    });

    refs.brushColorInput.addEventListener('input', () => {
        state.color = refs.brushColorInput.value;
        renderOverlay();
    });

    refs.originButton.addEventListener('click', interactions.handleResetOrigin);
    refs.fullscreenButton.addEventListener('click', () => {
        if (document.fullscreenElement === refs.shell) {
            void document.exitFullscreen();
            return;
        }

        void refs.shell.requestFullscreen();
    });
    refs.clearWhiteboardButton?.addEventListener('click', interactions.handleClearRequest);

    document.addEventListener('fullscreenchange', () => {
        updateFullscreenButton();
        resizeCanvases(refs, state, contexts);
        redrawAll();
    });

    refs.overlayCanvas.addEventListener('pointerdown', interactions.handlePointerDown);
    refs.overlayCanvas.addEventListener('pointermove', interactions.handlePointerMove);
    refs.overlayCanvas.addEventListener('pointerup', interactions.handlePointerUp);
    refs.overlayCanvas.addEventListener('pointercancel', interactions.handlePointerCancel);

    refs.overlayCanvas.addEventListener('pointerleave', () => {
        if (state.tool === 'erase' && state.interaction === null) {
            state.hoverEraseStrokeId = null;
            renderOverlay();
        }
    });

    refs.overlayCanvas.addEventListener('wheel', interactions.handleWheel, { passive: false });

    refs.overlayCanvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    window.addEventListener('keydown', interactions.handleKeyDown);
    window.addEventListener('keyup', interactions.handleKeyUp);
    window.addEventListener('resize', () => {
        resizeCanvases(refs, state, contexts);
        redrawAll();
    });

    const resizeObserver = new ResizeObserver(() => {
        resizeCanvases(refs, state, contexts);
        redrawAll();
    });

    resizeObserver.observe(refs.canvasShell);

    const themeObserver = new MutationObserver(() => {
        redrawAll();
    });

    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });

    updateToolControls();
    updateBrushSizeReadout();
    updateFullscreenButton();
    updateCursor();
    resizeCanvases(refs, state, contexts);
    redrawAll();
    void loadStrokes();
}
