type Tool = "draw" | "erase";

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: number;
  tool: "draw";
  color: string;
  brushSize: number;
  points: Point[];
  createdAt: string;
  localOnly?: boolean;
};

type CameraState = {
  originX: number;
  originY: number;
  zoom: number;
};

type DrawInteraction = {
  mode: "draw";
  pointerId: number;
  points: Point[];
};

type EraseInteraction = {
  mode: "erase";
  pointerId: number;
};

type PanInteraction = {
  mode: "pan";
  pointerId: number;
  lastScreenPoint: Point;
};

type GestureInteraction = {
  mode: "gesture";
  centroid: Point;
  distance: number;
};

type InteractionState = DrawInteraction | EraseInteraction | PanInteraction | GestureInteraction | null;

type PointerSnapshot = {
  clientX: number;
  clientY: number;
};

type StrokeResponse = {
  id: number;
  tool: "draw";
  color: string;
  brushSize: number;
  points: Point[];
  createdAt: string;
};

type StrokesResponse = {
  strokes: StrokeResponse[];
};

type CreateStrokeResponse = {
  id: number;
  createdAt: string;
};

const DEFAULT_BRUSH_SIZE = 4;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const MIN_POINT_DISTANCE = 0.75;
const DEFAULT_STATUS_DURATION_MS = 2500;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return distance(point, start);
  }

  const projection =
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const t = clamp(projection, 0, 1);

  return distance(point, {
    x: start.x + dx * t,
    y: start.y + dy * t,
  });
}

function getWorldColorToken(tokenName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
}

function generateClientSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {}

  return `Request failed (${response.status})`;
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector<HTMLElement>("[data-whiteboard-root]");

  if (!root) {
    return;
  }

  const shell = root.querySelector<HTMLElement>("[data-whiteboard-shell]");
  const canvasShell = root.querySelector<HTMLElement>("[data-canvas-shell]");
  const committedCanvas = root.querySelector<HTMLCanvasElement>("[data-whiteboard-committed]");
  const overlayCanvas = root.querySelector<HTMLCanvasElement>("[data-whiteboard-overlay]");
  const statusElement = root.querySelector<HTMLElement>("[data-status]");
  const brushColorInput = root.querySelector<HTMLInputElement>("[data-brush-color]");
  const brushSizeReadout = root.querySelector<HTMLOutputElement>("[data-brush-size-readout]");
  const fullscreenButton = root.querySelector<HTMLButtonElement>("[data-fullscreen]");
  const originButton = root.querySelector<HTMLButtonElement>("[data-reset-origin]");
  const clearWhiteboardButton = root.querySelector<HTMLButtonElement>("[data-clear-whiteboard]");
  const toolButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-tool]"),
  );
  const brushSizeIncrementButton = root.querySelector<HTMLButtonElement>("[data-brush-size-increment]");
  const brushSizeDecrementButton = root.querySelector<HTMLButtonElement>("[data-brush-size-decrement]");
  const strokesEndpoint = root.dataset.strokesEndpoint;
  const canManageWhiteboard = root.dataset.canManageWhiteboard === "true";

  if (
    !shell ||
    !canvasShell ||
    !committedCanvas ||
    !overlayCanvas ||
    !statusElement ||
    !brushColorInput ||
    !brushSizeReadout ||
    !fullscreenButton ||
    !originButton ||
    !brushSizeIncrementButton ||
    !brushSizeDecrementButton ||
    !strokesEndpoint
  ) {
    return;
  }

  const committedContext = committedCanvas.getContext("2d");
  const overlayContext = overlayCanvas.getContext("2d");

  if (!committedContext || !overlayContext) {
    return;
  }

  const whiteboardShell = shell;
  const whiteboardCanvasShell = canvasShell;
  const whiteboardCommittedCanvas = committedCanvas;
  const whiteboardOverlayCanvas = overlayCanvas;
  const whiteboardStatusElement = statusElement;
  const whiteboardBrushColorInput = brushColorInput;
  const whiteboardBrushSizeReadout = brushSizeReadout;
  const whiteboardFullscreenButton = fullscreenButton;
  const whiteboardOriginButton = originButton;
  const whiteboardClearButton = clearWhiteboardButton;
  const whiteboardBrushSizeIncrementButton = brushSizeIncrementButton;
  const whiteboardBrushSizeDecrementButton = brushSizeDecrementButton;
  const whiteboardStrokesEndpoint = strokesEndpoint;
  const whiteboardCommittedContext = committedContext;
  const whiteboardOverlayContext = overlayContext;

  const state = {
    strokes: [] as Stroke[],
    createdStrokeIds: new Set<number>(),
    pendingDeleteIds: new Set<number>(),
    activePointers: new Map<number, PointerSnapshot>(),
    interaction: null as InteractionState,
    hoverEraseStrokeId: null as number | null,
    camera: {
      originX: 0,
      originY: 0,
      zoom: 1,
    } satisfies CameraState,
    viewportWidth: 0,
    viewportHeight: 0,
    brushSize: DEFAULT_BRUSH_SIZE,
    tool: "draw" as Tool,
    color: getWorldColorToken("--color-text") || "#1a1a1a",
    statusTimer: 0,
    nextTemporaryStrokeId: -1,
    clientSessionId: generateClientSessionId(),
    isSpacePressed: false,
    hasInitializedView: false,
    canManageWhiteboard,
  };

  whiteboardBrushColorInput.value = state.color;

  function updateBrushSizeReadout(): void {
    whiteboardBrushSizeReadout.value = `${state.brushSize} px`;
    whiteboardBrushSizeReadout.textContent = `${state.brushSize} px`;
    whiteboardBrushSizeDecrementButton.disabled = state.brushSize <= 1;
    whiteboardBrushSizeIncrementButton.disabled = state.brushSize >= 48;
  }

  function setStatus(message: string, isError = false, durationMs = DEFAULT_STATUS_DURATION_MS): void {
    whiteboardStatusElement.textContent = message;
    whiteboardStatusElement.classList.toggle("is-error", isError);

    if (state.statusTimer) {
      window.clearTimeout(state.statusTimer);
      state.statusTimer = 0;
    }

    if (message && durationMs > 0) {
      state.statusTimer = window.setTimeout(() => {
        whiteboardStatusElement.textContent = "";
        whiteboardStatusElement.classList.remove("is-error");
      }, durationMs);
    }
  }

  function updateFullscreenButton(): void {
    renderFullscreenIcon();
  }

  function updateToolControls(): void {
    toolButtons.forEach((button) => {
      const isActive = button.dataset.tool === state.tool;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function updateCursor(): void {
    if (state.interaction?.mode === "pan" || state.interaction?.mode === "gesture") {
      whiteboardOverlayCanvas.style.cursor = "grabbing";
      return;
    }

    if (state.tool === "erase") {
      whiteboardOverlayCanvas.style.cursor = "not-allowed";
      return;
    }

    whiteboardOverlayCanvas.style.cursor = state.isSpacePressed ? "grab" : "crosshair";
  }

  function getScreenPoint(clientX: number, clientY: number): Point {
    const rect = whiteboardOverlayCanvas.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function screenToWorld(point: Point): Point {
    return {
      x: (point.x - state.camera.originX) / state.camera.zoom,
      y: (point.y - state.camera.originY) / state.camera.zoom,
    };
  }

  function worldToScreen(point: Point): Point {
    return {
      x: point.x * state.camera.zoom + state.camera.originX,
      y: point.y * state.camera.zoom + state.camera.originY,
    };
  }

  function resetCamera(): void {
    state.camera.zoom = 1;
    state.camera.originX = state.viewportWidth / 2;
    state.camera.originY = state.viewportHeight / 2;
  }

  function zoomAt(screenPoint: Point, targetZoom: number): void {
    const nextZoom = clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);

    if (nextZoom === state.camera.zoom) {
      return;
    }

    const worldPoint = screenToWorld(screenPoint);
    state.camera.zoom = nextZoom;
    state.camera.originX = screenPoint.x - worldPoint.x * nextZoom;
    state.camera.originY = screenPoint.y - worldPoint.y * nextZoom;
  }

  function configureContext(context: CanvasRenderingContext2D): void {
    const devicePixelRatio = window.devicePixelRatio || 1;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function resizeCanvases(): void {
    const rect = whiteboardCanvasShell.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    const previousCenterWorld =
      state.viewportWidth > 0 && state.viewportHeight > 0
        ? screenToWorld({
            x: state.viewportWidth / 2,
            y: state.viewportHeight / 2,
          })
        : null;

    state.viewportWidth = rect.width;
    state.viewportHeight = rect.height;

    [whiteboardCommittedCanvas, whiteboardOverlayCanvas].forEach((canvas) => {
      canvas.width = Math.max(1, Math.round(rect.width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(rect.height * devicePixelRatio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    });

    configureContext(whiteboardCommittedContext);
    configureContext(whiteboardOverlayContext);

    if (!state.hasInitializedView) {
      resetCamera();
      state.hasInitializedView = true;
    } else if (previousCenterWorld) {
      state.camera.originX = rect.width / 2 - previousCenterWorld.x * state.camera.zoom;
      state.camera.originY = rect.height / 2 - previousCenterWorld.y * state.camera.zoom;
    }

    renderCommittedCanvas();
    renderOverlayCanvas();
  }

  function drawStroke(context: CanvasRenderingContext2D, stroke: Stroke, colorOverride?: string): void {
    const lineWidth = Math.max(stroke.brushSize * state.camera.zoom, 1);
    const points = stroke.points.map(worldToScreen);

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
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

    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x, points[index].y);
    }

    context.stroke();
    context.restore();
  }

  function renderCommittedCanvas(): void {
    whiteboardCommittedContext.clearRect(0, 0, state.viewportWidth, state.viewportHeight);
    whiteboardCommittedContext.fillStyle = getWorldColorToken("--color-surface") || "#ffffff";
    whiteboardCommittedContext.fillRect(0, 0, state.viewportWidth, state.viewportHeight);

    state.strokes.forEach((stroke) => {
      drawStroke(whiteboardCommittedContext, stroke);
    });
  }

  function renderOverlayCanvas(): void {
    whiteboardOverlayContext.clearRect(0, 0, state.viewportWidth, state.viewportHeight);

    if (state.hoverEraseStrokeId !== null) {
      const hoverStroke = state.strokes.find((stroke) => stroke.id === state.hoverEraseStrokeId);

      if (hoverStroke) {
        drawStroke(
          whiteboardOverlayContext,
          hoverStroke,
          getWorldColorToken("--color-border-error") || "#dc2c2c",
        );
      }
    }

    if (state.interaction?.mode === "draw") {
      drawStroke(whiteboardOverlayContext, {
        id: 0,
        tool: "draw",
        color: state.color,
        brushSize: state.brushSize,
        points: state.interaction.points,
        createdAt: "",
      });
    }
  }

  function redraw(): void {
    renderCommittedCanvas();
    renderOverlayCanvas();
    updateCursor();
  }

  function createStrokeRecord(points: Point[]): Stroke {
    return {
      id: state.nextTemporaryStrokeId,
      tool: "draw",
      color: state.color,
      brushSize: state.brushSize,
      points,
      createdAt: new Date().toISOString(),
      localOnly: true,
    };
  }

  async function persistStroke(stroke: Stroke): Promise<void> {
    const response = await fetch(whiteboardStrokesEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientSessionId: state.clientSessionId,
        tool: "draw",
        color: stroke.color,
        brushSize: stroke.brushSize,
        points: stroke.points,
      }),
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response));
    }

    const data = (await response.json()) as CreateStrokeResponse;
    const strokeIndex = state.strokes.findIndex((item) => item.id === stroke.id);

    if (strokeIndex === -1) {
      return;
    }

    state.strokes[strokeIndex] = {
      ...stroke,
      id: data.id,
      createdAt: data.createdAt,
      localOnly: false,
    };
    state.createdStrokeIds.add(data.id);
    redraw();
  }

  async function saveStroke(points: Point[]): Promise<void> {
    const stroke = createStrokeRecord(points);
    state.nextTemporaryStrokeId -= 1;
    state.strokes.push(stroke);
    redraw();

    try {
      await persistStroke(stroke);
      setStatus("Stroke saved.");
    } catch (error) {
      state.strokes = state.strokes.filter((item) => item.id !== stroke.id);
      redraw();
      setStatus(
        error instanceof Error ? error.message : "Failed to save the stroke.",
        true,
      );
    }
  }

  async function deleteStroke(strokeId: number): Promise<void> {
    if (state.pendingDeleteIds.has(strokeId)) {
      return;
    }

    const strokeIndex = state.strokes.findIndex((stroke) => stroke.id === strokeId);

    if (strokeIndex === -1) {
      return;
    }

    const [removedStroke] = state.strokes.splice(strokeIndex, 1);
    state.pendingDeleteIds.add(strokeId);
    state.hoverEraseStrokeId = null;
    redraw();

    try {
      const response = await fetch(`${whiteboardStrokesEndpoint}/${strokeId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientSessionId: state.clientSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      state.createdStrokeIds.delete(strokeId);
      setStatus("Stroke erased.");
    } catch (error) {
      state.strokes.splice(strokeIndex, 0, removedStroke);
      setStatus(
        error instanceof Error ? error.message : "Failed to erase the stroke.",
        true,
      );
    } finally {
      state.pendingDeleteIds.delete(strokeId);
      redraw();
    }
  }

  async function clearWhiteboard(): Promise<void> {
    const response = await fetch(whiteboardStrokesEndpoint, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response));
    }
  }

  async function loadStrokes(): Promise<void> {
    setStatus("Loading whiteboard…", false, 0);

    try {
      const response = await fetch(whiteboardStrokesEndpoint, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      const data = (await response.json()) as StrokesResponse;
      state.strokes = data.strokes.map((stroke) => ({
        ...stroke,
        localOnly: false,
      }));
      redraw();
      setStatus(`Loaded ${state.strokes.length} stroke${state.strokes.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to load the whiteboard.",
        true,
        0,
      );
    }
  }

  function getGesturePointers(): PointerSnapshot[] {
    return Array.from(state.activePointers.values()).slice(0, 2);
  }

  function findErasableStrokeId(worldPoint: Point): number | null {
    for (let strokeIndex = state.strokes.length - 1; strokeIndex >= 0; strokeIndex -= 1) {
      const stroke = state.strokes[strokeIndex];

      if (
        (!state.canManageWhiteboard && !state.createdStrokeIds.has(stroke.id)) ||
        state.pendingDeleteIds.has(stroke.id)
      ) {
        continue;
      }

      const threshold = stroke.brushSize / 2 + 10 / state.camera.zoom;

      if (stroke.points.length === 1) {
        if (distance(worldPoint, stroke.points[0]) <= threshold) {
          return stroke.id;
        }

        continue;
      }

      for (let pointIndex = 1; pointIndex < stroke.points.length; pointIndex += 1) {
        const segmentDistance = distanceToSegment(
          worldPoint,
          stroke.points[pointIndex - 1],
          stroke.points[pointIndex],
        );

        if (segmentDistance <= threshold) {
          return stroke.id;
        }
      }
    }

    return null;
  }

  function beginDraw(pointerId: number, screenPoint: Point): void {
    state.hoverEraseStrokeId = null;

    state.interaction = {
      mode: "draw",
      pointerId,
      points: [screenToWorld(screenPoint)],
    };

    renderOverlayCanvas();
  }

  function extendDraw(screenPoint: Point): void {
    if (state.interaction?.mode !== "draw") {
      return;
    }

    const worldPoint = screenToWorld(screenPoint);
    const previousPoint = state.interaction.points[state.interaction.points.length - 1];

    if (distance(worldPoint, previousPoint) < MIN_POINT_DISTANCE / state.camera.zoom) {
      return;
    }

    state.interaction.points.push(worldPoint);
    renderOverlayCanvas();
  }

  function finishDraw(): void {
    if (state.interaction?.mode !== "draw") {
      return;
    }

    const points = state.interaction.points.slice();
    state.interaction = null;
    renderOverlayCanvas();

    if (points.length === 0) {
      return;
    }

    void saveStroke(points);
  }

  function beginErase(pointerId: number, screenPoint: Point): void {
    state.interaction = {
      mode: "erase",
      pointerId,
    };

    void eraseAt(screenPoint);
  }

  async function eraseAt(screenPoint: Point): Promise<void> {
    const strokeId = findErasableStrokeId(screenToWorld(screenPoint));
    state.hoverEraseStrokeId = strokeId;
    renderOverlayCanvas();

    if (strokeId !== null) {
      await deleteStroke(strokeId);
    }
  }

  function beginPan(pointerId: number, screenPoint: Point): void {
    state.interaction = {
      mode: "pan",
      pointerId,
      lastScreenPoint: screenPoint,
    };

    updateCursor();
  }

  function updatePan(screenPoint: Point): void {
    if (state.interaction?.mode !== "pan") {
      return;
    }

    const deltaX = screenPoint.x - state.interaction.lastScreenPoint.x;
    const deltaY = screenPoint.y - state.interaction.lastScreenPoint.y;

    state.camera.originX += deltaX;
    state.camera.originY += deltaY;
    state.interaction.lastScreenPoint = screenPoint;
    redraw();
  }

  function beginGesture(): void {
    const [firstPointer, secondPointer] = getGesturePointers();

    if (!firstPointer || !secondPointer) {
      return;
    }

    state.interaction = {
      mode: "gesture",
      centroid: {
        x: (firstPointer.clientX + secondPointer.clientX) / 2,
        y: (firstPointer.clientY + secondPointer.clientY) / 2,
      },
      distance: Math.max(
        Math.hypot(
          secondPointer.clientX - firstPointer.clientX,
          secondPointer.clientY - firstPointer.clientY,
        ),
        1,
      ),
    };
    updateCursor();
  }

  function updateGesture(): void {
    if (state.interaction?.mode !== "gesture") {
      return;
    }

    const [firstPointer, secondPointer] = getGesturePointers();

    if (!firstPointer || !secondPointer) {
      state.interaction = null;
      updateCursor();
      return;
    }

    const nextCentroidClient = {
      x: (firstPointer.clientX + secondPointer.clientX) / 2,
      y: (firstPointer.clientY + secondPointer.clientY) / 2,
    };

    const previousCentroidScreen = getScreenPoint(
      state.interaction.centroid.x,
      state.interaction.centroid.y,
    );

    const nextCentroidScreen = getScreenPoint(nextCentroidClient.x, nextCentroidClient.y);

    const nextDistance = Math.max(
      Math.hypot(
        secondPointer.clientX - firstPointer.clientX,
        secondPointer.clientY - firstPointer.clientY,
      ),
      1,
    );

    state.camera.originX += nextCentroidScreen.x - previousCentroidScreen.x;
    state.camera.originY += nextCentroidScreen.y - previousCentroidScreen.y;

    zoomAt(
      nextCentroidScreen,
      state.camera.zoom * (nextDistance / state.interaction.distance),
    );

    state.interaction.centroid = nextCentroidClient;
    state.interaction.distance = nextDistance;
    redraw();
  }

  function clearInteraction(): void {
    state.interaction = null;
    state.hoverEraseStrokeId = null;
    renderOverlayCanvas();
    updateCursor();
  }

  function handleToolButtonClick(event: Event): void {
    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    state.tool = button.dataset.tool === "erase" ? "erase" : "draw";
    updateToolControls();
    redraw();
  }

  function handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === "mouse" && event.button === 2) {
      return;
    }

    whiteboardOverlayCanvas.setPointerCapture(event.pointerId);
    state.activePointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    const screenPoint = getScreenPoint(event.clientX, event.clientY);

    if (event.pointerType === "touch") {
      event.preventDefault();

      if (state.activePointers.size === 1) {
        if (state.tool === "erase") {
          beginErase(event.pointerId, screenPoint);
        } else {
          beginDraw(event.pointerId, screenPoint);
        }

        return;
      }

      if (state.activePointers.size === 2) {
        clearInteraction();
        beginGesture();
      }

      return;
    }

    if (event.button === 1 || (event.button === 0 && state.isSpacePressed)) {
      event.preventDefault();
      beginPan(event.pointerId, screenPoint);
      return;
    }

    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    if (state.tool === "erase") {
      beginErase(event.pointerId, screenPoint);
      return;
    }

    beginDraw(event.pointerId, screenPoint);
  }

  function handlePointerMove(event: PointerEvent): void {
    if (state.activePointers.has(event.pointerId)) {
      state.activePointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
    }

    const screenPoint = getScreenPoint(event.clientX, event.clientY);

    if (state.interaction?.mode === "draw" && state.interaction.pointerId === event.pointerId) {
      event.preventDefault();
      extendDraw(screenPoint);
      return;
    }

    if (state.interaction?.mode === "erase" && state.interaction.pointerId === event.pointerId) {
      event.preventDefault();
      void eraseAt(screenPoint);
      return;
    }

    if (state.interaction?.mode === "pan" && state.interaction.pointerId === event.pointerId) {
      event.preventDefault();
      updatePan(screenPoint);
      return;
    }

    if (state.interaction?.mode === "gesture") {
      event.preventDefault();
      updateGesture();
      return;
    }

    if (state.tool === "erase" && event.pointerType === "mouse") {
      state.hoverEraseStrokeId = findErasableStrokeId(screenToWorld(screenPoint));
      renderOverlayCanvas();
    }
  }

  function handlePointerUp(event: PointerEvent): void {
    state.activePointers.delete(event.pointerId);

    if (state.interaction?.mode === "draw" && state.interaction.pointerId === event.pointerId) {
      finishDraw();
    } else if (
      (state.interaction?.mode === "erase" || state.interaction?.mode === "pan") &&
      state.interaction.pointerId === event.pointerId
    ) {
      clearInteraction();
    } else if (state.interaction?.mode === "gesture" && state.activePointers.size < 2) {
      clearInteraction();
    }

    updateCursor();
  }

  function handlePointerCancel(event: PointerEvent): void {
    state.activePointers.delete(event.pointerId);
    clearInteraction();
  }

  function handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const screenPoint = getScreenPoint(event.clientX, event.clientY);
    const scale = Math.exp(-event.deltaY * 0.0015);

    zoomAt(screenPoint, state.camera.zoom * scale);
    redraw();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    const target = event.target;

    const isFormField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement;

    if (event.code === "Space" && !isFormField) {
      state.isSpacePressed = true;
      event.preventDefault();
      updateCursor();
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      state.isSpacePressed = false;
      updateCursor();
    }
  }

  function handleThemeMutation(): void {
    renderCommittedCanvas();
    renderOverlayCanvas();
  }

  function handleFullscreenToggle(): void {
    if (document.fullscreenElement === whiteboardShell) {
      void document.exitFullscreen();
      return;
    }

    void whiteboardShell.requestFullscreen();
  }

  function renderFullscreenIcon(): void {
    const icon = whiteboardFullscreenButton.querySelector("i");

    if (!icon) {
      return;
    }

    const isFullscreen = document.fullscreenElement === whiteboardShell;
    icon.className = isFullscreen ? "fa-solid fa-compress" : "fa-solid fa-expand";

    whiteboardFullscreenButton.setAttribute(
      "aria-label",
      isFullscreen ? "Exit fullscreen" : "Fullscreen",
    );

    whiteboardFullscreenButton.title = isFullscreen ? "Exit fullscreen" : "Fullscreen";
  }

  toolButtons.forEach((button) => {
    button.addEventListener("click", handleToolButtonClick);
  });

  whiteboardBrushSizeDecrementButton.addEventListener("click", () => {
    state.brushSize = clamp(state.brushSize - 1, 1, 48);
    updateBrushSizeReadout();
  });

  whiteboardBrushSizeIncrementButton.addEventListener("click", () => {
    state.brushSize = clamp(state.brushSize + 1, 1, 48);
    updateBrushSizeReadout();
  });

  whiteboardBrushColorInput.addEventListener("input", () => {
    state.color = whiteboardBrushColorInput.value;
  });

  whiteboardOriginButton.addEventListener("click", () => {
    resetCamera();
    redraw();
    setStatus("Returned to origin.");
  });

  whiteboardClearButton?.addEventListener("click", async () => {
    const shouldClear = window.confirm("Clear the entire whiteboard?");

    if (!shouldClear) {
      return;
    }

    try {
      await clearWhiteboard();
      state.strokes = [];
      state.createdStrokeIds.clear();
      state.pendingDeleteIds.clear();
      state.hoverEraseStrokeId = null;
      redraw();
      setStatus("Whiteboard cleared.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to clear the whiteboard.",
        true,
      );
    }
  });

  whiteboardFullscreenButton.addEventListener("click", handleFullscreenToggle);

  document.addEventListener("fullscreenchange", () => {
    updateFullscreenButton();
    renderFullscreenIcon();
    resizeCanvases();
  });

  whiteboardOverlayCanvas.addEventListener("pointerdown", handlePointerDown);
  whiteboardOverlayCanvas.addEventListener("pointermove", handlePointerMove);
  whiteboardOverlayCanvas.addEventListener("pointerup", handlePointerUp);
  whiteboardOverlayCanvas.addEventListener("pointercancel", handlePointerCancel);

  whiteboardOverlayCanvas.addEventListener("pointerleave", () => {
    if (state.tool === "erase" && state.interaction === null) {
      state.hoverEraseStrokeId = null;
      renderOverlayCanvas();
    }
  });

  whiteboardOverlayCanvas.addEventListener("wheel", handleWheel, { passive: false });

  whiteboardOverlayCanvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("resize", resizeCanvases);

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvases();
  });

  resizeObserver.observe(whiteboardCanvasShell);

  const themeObserver = new MutationObserver(handleThemeMutation);

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  updateToolControls();
  updateBrushSizeReadout();
  updateFullscreenButton();
  renderFullscreenIcon();
  updateCursor();
  resizeCanvases();
  void loadStrokes();
});
