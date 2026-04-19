import type { CanvasPoint } from '../canvas';

export type Tool = 'draw' | 'erase';
export type Point = CanvasPoint;

export type Stroke = {
    id: number;
    tool: 'draw';
    color: string;
    brushSize: number;
    points: Point[];
    createdAt: string;
    localOnly?: boolean;
};

export type CameraState = {
    originX: number;
    originY: number;
    zoom: number;
};

export type DrawInteraction = {
    mode: 'draw';
    pointerId: number;
    points: Point[];
};

export type EraseInteraction = {
    mode: 'erase';
    pointerId: number;
};

export type PanInteraction = {
    mode: 'pan';
    pointerId: number;
    lastScreenPoint: Point;
};

export type GestureInteraction = {
    mode: 'gesture';
    centroid: Point;
    distance: number;
};

export type InteractionState =
    | DrawInteraction
    | EraseInteraction
    | PanInteraction
    | GestureInteraction
    | null;

export type PointerSnapshot = {
    clientX: number;
    clientY: number;
};

export type StrokeResponse = {
    id: number;
    tool: 'draw';
    color: string;
    brushSize: number;
    points: Point[];
    createdAt: string;
};

export type StrokesResponse = {
    strokes: StrokeResponse[];
};

export type CreateStrokeResponse = {
    id: number;
    createdAt: string;
};

export type WhiteboardRefs = {
    root: HTMLElement;
    shell: HTMLElement;
    canvasShell: HTMLElement;
    gridDots: HTMLElement;
    axisH: HTMLElement;
    axisV: HTMLElement;
    committedCanvas: HTMLCanvasElement;
    overlayCanvas: HTMLCanvasElement;
    statusElement: HTMLElement;
    brushColorInput: HTMLInputElement;
    brushSizeReadout: HTMLOutputElement;
    fullscreenButton: HTMLButtonElement;
    fullscreenLabel: HTMLElement;
    originButton: HTMLButtonElement;
    clearWhiteboardButton: HTMLButtonElement | null;
    toolButtons: HTMLButtonElement[];
    brushSizeIncrementButton: HTMLButtonElement;
    brushSizeDecrementButton: HTMLButtonElement;
    strokesEndpoint: string;
};

export type WhiteboardContexts = {
    committed: CanvasRenderingContext2D;
    overlay: CanvasRenderingContext2D;
};

export type WhiteboardState = {
    strokes: Stroke[];
    createdStrokeIds: Set<number>;
    pendingDeleteIds: Set<number>;
    activePointers: Map<number, PointerSnapshot>;
    interaction: InteractionState;
    hoverEraseStrokeId: number | null;
    camera: CameraState;
    viewportWidth: number;
    viewportHeight: number;
    brushSize: number;
    tool: Tool;
    color: string;
    statusTimer: number;
    nextTemporaryStrokeId: number;
    clientSessionId: string;
    isSpacePressed: boolean;
    hasInitializedView: boolean;
    canManageWhiteboard: boolean;
};
