import * as C from './constants';
import * as T from './types';
import {
    getAnchoredTransform,
    getCenteredOrigin,
    screenToWorld as transformScreenToWorld,
    worldToScreen as transformWorldToScreen
} from '../canvas';
import { clamp } from '../utils';
import { createSprite, formatAgo, getHydrationLabel, normalizeSnapshot } from './utils';

export function initGarden(root: HTMLElement): void {
    const qs = <T extends HTMLElement>(selector: string): T => root.querySelector<T>(selector)!;
    const stateEndpoint = root.dataset.stateEndpoint;
    const actionsEndpoint = root.dataset.actionsEndpoint;

    if (!stateEndpoint || !actionsEndpoint) 
        return;

    const refs: T.GardenRefs = {
        root,
        surface: qs('[data-garden-surface]'),
        gridDots: qs('[data-grid-dots]'),
        axisH: qs('[data-axis-h]'),
        axisV: qs('[data-axis-v]'),
        flowers: qs('[data-flowers]'),
        cellHover: qs('[data-cell-hover]'),
        cellTip: qs('[data-cell-tip]'),
        coordReadout: qs('[data-coord-readout]'),
        originBtn: qs<HTMLButtonElement>('[data-origin-btn]'),
        toolButtons: root.querySelectorAll<HTMLButtonElement>('[data-tool-group] [data-tool]'),
        speciesGroup: qs('[data-species-group]'),
        speciesButtons: qs('[data-species-buttons]'),
        statTotal: qs('[data-stat-total]'),
        statAlive: qs('[data-stat-alive]'),
        statHealth: qs('[data-stat-health]'),
        statBloom: qs('[data-stat-bloom]'),
        statSeason: qs('[data-stat-season]'),
        statWeather: qs('[data-stat-weather]'),
        statWind: qs('[data-stat-wind]'),
        statTime: qs('[data-stat-time]'),
        legend: qs('[data-legend]'),
        activityStatus: qs('[data-activity-status]'),
        activity: qs('[data-activity]'),
    };

    const config: T.Config = {
        world: null,
        tool: 'plant',
        species: 'daisy',
        pan: { x: 0, y: 0 },
        zoom: 1,
        viewport: { width: 0, height: 0 },
        hover: null,
        panInteraction: null,
        pendingTouchAction: null,
        isSpacePressed: false,
        centered: false,
        isBooting: root.dataset.booting === 'true',
        isLoaded: false,
        loadError: refs.activityStatus.textContent?.trim() ?? '',
        serverTimeOffsetMs: 0,
        activePointers: new Map<number, { clientX: number; clientY: number }>(),
    };

    const getNow = (): number => Date.now() + config.serverTimeOffsetMs;
    const isPanning = (): boolean => config.panInteraction !== null;
    const getCellSize = (): number => C.CELL_PX * config.zoom;
    const shouldPreserveServerRender = (): boolean => config.isBooting && config.world === null;
    const getTransform = () => ({
        originX: config.pan.x,
        originY: config.pan.y,
        scale: getCellSize(),
    });

    const renderBootState = (): void => {
        refs.root.dataset.booting = String(config.isBooting);
        refs.surface.setAttribute('aria-disabled', String(config.isBooting));
    };

    const renderActivityStatus = (): void => {
        const hasMessage = config.loadError.trim().length > 0;
        refs.activityStatus.hidden = !hasMessage;
        refs.activityStatus.classList.toggle('is-error', hasMessage);
        refs.activityStatus.textContent = config.loadError;
    };

    const renderStats = (): void => {
        if (!config.world) 
            return;

        refs.statTotal.textContent = String(config.world?.stats.plantedTotal ?? 0).padStart(4, '0');
        refs.statAlive.textContent = String(config.world?.stats.aliveNow ?? 0).padStart(4, '0');
        refs.statHealth.textContent = config.world?.stats.health ?? 'dormant';
        refs.statBloom.textContent = `${config.world?.stats.bloomPct ?? 0}%`;
        refs.statSeason.textContent = config.world?.environment.season ?? '';
        refs.statWeather.textContent = config.world?.environment.weather ?? '';
        refs.statWind.textContent = config.world?.environment.wind.label ?? '';
        refs.statTime.textContent = config.world?.environment.time ?? '';

        const speciesCounts: Partial<Record<T.Species, number>> = {};

        if (config.world) {
            for (const [, cell] of config.world.cells) 
                speciesCounts[cell.species] = (speciesCounts[cell.species] ?? 0) + 1;
        }

        refs.legend.replaceChildren();

        for (const species of C.SPECIES_LIST) {
            const row = document.createElement('div');
            row.className = 'garden-legend-row';
            const sprite = document.createElement('span');
            sprite.className = 'garden-legend-sprite';
            sprite.appendChild(createSprite(species, 'bloom', 20));
            const name = document.createElement('span');
            name.className = 'garden-legend-name';
            name.textContent = species;
            const count = document.createElement('span');
            count.className = 'garden-legend-count';
            count.textContent = `\u00d7 ${speciesCounts[species] ?? 0}`;
            row.append(sprite, name, count);
            refs.legend.appendChild(row);
        }
    };

    const renderActivity = (): void => {
        if (!config.world) 
            return;

        refs.activity.replaceChildren();

        if (config.world.activity.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'garden-dim';
            empty.textContent = 'no activity yet';
            refs.activity.appendChild(empty);
            return;
        }

        for (const entry of config.world.activity.slice(0, 8)) {
            const row = document.createElement('div');
            row.className = 'garden-activity-row';
            const type = document.createElement('span');
            type.className = 'garden-activity-type';
            type.textContent = entry.type;
            const msg = document.createElement('span');
            msg.className = 'garden-activity-msg';
            msg.textContent = entry.msg;
            const time = document.createElement('span');
            time.className = 'garden-activity-time';
            time.textContent = formatAgo(entry.tick, getNow());
            row.append(type, msg, time);
            refs.activity.appendChild(row);
        }
    };

    const screenToWorld = (sx: number, sy: number) => {
        return transformScreenToWorld({ x: sx, y: sy }, getTransform());
    };

    const screenToCell = (sx: number, sy: number) => {
        const worldPoint = screenToWorld(sx, sy);

        return {
            x: Math.floor(worldPoint.x),
            y: Math.floor(worldPoint.y),
        };
    };

    const cellToScreen = (x: number, y: number) => {
        return transformWorldToScreen({ x, y }, getTransform());
    };

    const centerOrigin = (): void => {
        const rect = refs.surface.getBoundingClientRect();
        const nextOrigin = getCenteredOrigin(
            { x: 0.5, y: 0.5 },
            { x: rect.width / 2, y: rect.height / 2 },
            getCellSize()
        );

        config.pan = { x: nextOrigin.x, y: nextOrigin.y };
    };

    const resetView = (): void => {
        config.zoom = 1;
        centerOrigin();
    };

    const zoomAt = (sx: number, sy: number, targetZoom: number): void => {
        const nextZoom = clamp(targetZoom, C.MIN_ZOOM, C.MAX_ZOOM);

        if (nextZoom === config.zoom) 
            return;

        const nextTransform = getAnchoredTransform(
            getTransform(),
            { x: sx, y: sy },
            C.CELL_PX * nextZoom
        );

        config.zoom = nextTransform.scale / C.CELL_PX;
        config.pan = {
            x: nextTransform.originX,
            y: nextTransform.originY,
        };
    };

    const syncViewport = (): void => {
        const rect = refs.surface.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) 
            return;

        const previousCenterWorld = config.centered && config.viewport.width > 0 && config.viewport.height > 0
            ? screenToWorld(config.viewport.width / 2, config.viewport.height / 2)
            : null;

        config.viewport = { width: rect.width, height: rect.height };

        if (!config.centered) {
            resetView();
            config.centered = true;
            return;
        }

        if (!previousCenterWorld) 
            return;

        const nextOrigin = getCenteredOrigin(
            previousCenterWorld,
            { x: rect.width / 2, y: rect.height / 2 },
            getCellSize()
        );

        config.pan = {
            x: nextOrigin.x,
            y: nextOrigin.y,
        };
    };

    const renderOriginMarker = (): void => {
        if (shouldPreserveServerRender()) 
            return;

        const cellSize = getCellSize();
        const centeredPanX = config.viewport.width / 2 - cellSize / 2;
        const centeredPanY = config.viewport.height / 2 - cellSize / 2;
        const isCentered =
            Math.abs(config.pan.x - centeredPanX) < 0.01 &&
            Math.abs(config.pan.y - centeredPanY) < 0.01;

        if (isCentered) {
            refs.axisH.style.top = '50%';
            refs.axisV.style.left = '50%';
            refs.gridDots.style.backgroundPosition = `calc(50% - ${cellSize / 2}px) calc(50% - ${cellSize / 2}px)`;
        } else {
            refs.axisH.style.top = `${config.pan.y + cellSize / 2}px`;
            refs.axisV.style.left = `${config.pan.x + cellSize / 2}px`;
            refs.gridDots.style.backgroundPosition = `${config.pan.x}px ${config.pan.y}px`;
        }

        refs.gridDots.style.backgroundSize = `${cellSize}px ${cellSize}px`;
    };

    const renderFlowers = (): void => {
        if (shouldPreserveServerRender()) 
            return;

        const cellSize = getCellSize();
        const pad = 2;
        const y0 = Math.floor(-config.pan.y / cellSize) - pad;
        const x0 = Math.floor(-config.pan.x / cellSize) - pad;
        const x1 = Math.ceil((config.viewport.width - config.pan.x) / cellSize) + pad;
        const y1 = Math.ceil((config.viewport.height - config.pan.y) / cellSize) + pad;

        refs.flowers.replaceChildren();

        if (!config.world) 
            return;

        for (const [k, cell] of config.world.cells) {
            const [x, y] = k.split(',').map(Number);

            if (x < x0 || x > x1 || y < y0 || y > y1) 
                continue;

            const screen = cellToScreen(x, y);
            const element = document.createElement('div');
            element.className = `garden-flower garden-flower-${cell.stage}`;
            element.style.left = `${screen.x}px`;
            element.style.top = `${screen.y}px`;
            element.style.width = `${cellSize}px`;
            element.style.height = `${cellSize}px`;
            element.title = `${cell.species} / ${cell.stage} / ${k}`;
            element.appendChild(createSprite(cell.species, cell.stage, cellSize));
            refs.flowers.appendChild(element);
        }
    };

    const getCoordinatesText = (config: T.Config, hoverCell: T.Cell): string => {
        if (!config.hover)
            return '(0,0) \u00b7 no cell';

        let text = `(${config.hover.x},${config.hover.y}) \u00b7 `;
        text += `planted ${formatAgo(hoverCell.plantedAt, getNow())}`;
        return text;
    };

    const getHydrationText = (hoverCell: T.Cell): string => {
        let text = `${getHydrationLabel(hoverCell, getNow())} \u00b7 `;
        text += `last watered ${formatAgo(hoverCell.lastWater, getNow())}`;
        return text;
    };

    const renderHover = (): void => {
        if (shouldPreserveServerRender()) {
            refs.cellHover.hidden = true;
            refs.cellTip.hidden = true;
            return;
        }

        if (!config.hover || isPanning()) {
            refs.cellHover.hidden = true;
            refs.cellTip.hidden = true;
            return;
        }

        const cellSize = getCellSize();
        const screen = cellToScreen(config.hover.x, config.hover.y);

        refs.cellHover.hidden = false;
        refs.cellHover.className = `garden-cell-hover tool-${config.tool}`;
        refs.cellHover.style.left = `${screen.x}px`;
        refs.cellHover.style.top = `${screen.y}px`;
        refs.cellHover.style.width = `${cellSize}px`;
        refs.cellHover.style.height = `${cellSize}px`;
        refs.cellHover.replaceChildren();

        const hoverCell = config.world?.cells.get(`${config.hover.x},${config.hover.y}`) ?? null;

        if (config.tool === 'plant' && !hoverCell) {
            const ghost = document.createElement('div');
            ghost.className = 'garden-ghost-flower';
            ghost.appendChild(createSprite(config.species, 'seed', cellSize));
            refs.cellHover.appendChild(ghost);
        }

        if (!hoverCell) {
            refs.cellTip.hidden = true;
            return;
        }

        refs.cellTip.hidden = false;
        refs.cellTip.replaceChildren();

        const head = document.createElement('div');
        head.textContent = `${hoverCell.species} / ${hoverCell.stage}`;

        const coord = document.createElement('div');
        coord.className = 'garden-dim';
        coord.textContent = getCoordinatesText(config, hoverCell);

        const water = document.createElement('div');
        water.className = 'garden-dim';
        water.textContent = getHydrationText(hoverCell);

        const author = document.createElement('div');
        author.className = 'garden-dim';
        author.textContent = `by ${hoverCell.author}`;
        refs.cellTip.append(head, coord, water, author);

        const tipLeft = Math.min(config.hover.px + 14, config.viewport.width - 180);
        const tipTop = Math.min(config.hover.py + 14, config.viewport.height - 80);
        refs.cellTip.style.left = `${tipLeft}px`;
        refs.cellTip.style.top = `${tipTop}px`;
    };

    const renderCoord = (): void => {
        if (shouldPreserveServerRender()) 
            return;

        const center =
            config.viewport.width ? screenToCell(config.viewport.width / 2, config.viewport.height / 2) :
                { x: 0, y: 0 };

        const cx = config.hover ? config.hover.x : center.x;
        const cy = config.hover ? config.hover.y : center.y;
        refs.coordReadout.replaceChildren();

        const cursorLabel = document.createElement('span');
        cursorLabel.className = 'garden-dim';
        cursorLabel.textContent = 'cursor:';

        const cursorValue = document.createTextNode(` (${cx},${cy}) `);
        const centerLabel = document.createElement('span');

        centerLabel.className = 'garden-dim';
        centerLabel.textContent = '\u00b7 center:';

        const centerValue = document.createTextNode(` (${center.x},${center.y})`);
        refs.coordReadout.append(cursorLabel, cursorValue, centerLabel, centerValue);
    };

    const renderSpecies = (): void => {
        refs.speciesGroup.hidden = (config.tool) !== ('plant' as T.Tool);
        refs.speciesButtons.replaceChildren();

        for (const species of C.SPECIES_LIST) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `garden-btn garden-species-btn${species === config.species ? ' is-active' : ''}`;
            btn.setAttribute('aria-pressed', String(species === config.species));
            btn.dataset.species = species;

            const icon = document.createElement('span');
            icon.className = 'garden-species-icon';
            icon.appendChild(createSprite(species, 'bloom', 16));
            btn.append(icon, document.createTextNode(species));

            btn.addEventListener('click', () => {
                if (config.isBooting) 
                    return;

                config.species = species;
                renderSpecies();
                renderHover();
            });

            refs.speciesButtons.appendChild(btn);
        }
    };

    const updateCursor = (): void => {
        if (isPanning()) 
            refs.surface.dataset.cursor = 'panning';
        else if (config.isSpacePressed) 
            refs.surface.dataset.cursor = 'pan';
        else 
            refs.surface.dataset.cursor = config.tool;
    };

    const renderTools = (): void => {
        for (const btn of Array.from(refs.toolButtons)) {
            const active = btn.dataset.tool === config.tool;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', String(active));
        }

        updateCursor();
    };

    const renderViewportDependent = (): void => {
        renderOriginMarker();
        renderFlowers();
        renderHover();
        renderCoord();
    };

    const setTool = (next: T.Tool): void => {
        if (config.isBooting) 
            return;

        config.tool = next;
        renderTools();
        renderSpecies();
        renderHover();
    };

    const isWorldStale = (config: T.Config, nextSnapshot: T.GardenWorldState): boolean => {
        return (
            config.world !== null &&
            (nextSnapshot.version < config.world.version ||
            (nextSnapshot.version === config.world.version && nextSnapshot.serverNow < config.world.serverNow))
        );
    };

    const applySnapshot = (snapshot: T.SnapshotResponse): void => {
        const nextSnapshot = normalizeSnapshot(snapshot);

        if (isWorldStale(config, nextSnapshot)) 
            return;
    
        config.world = nextSnapshot;
        config.isBooting = false;
        config.isLoaded = true;
        config.loadError = '';
        config.serverTimeOffsetMs = nextSnapshot.serverNow - Date.now();

        renderBootState();
        renderActivityStatus();
        renderViewportDependent();
        renderStats();
        renderActivity();
    };

    const fetchSnapshot = async (): Promise<void> => {
        const response = await fetch(stateEndpoint, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        });

        if (!response.ok) 
            throw new Error(`Failed to load garden (${response.status}).`);
    
        const data = await response.json() as T.SnapshotResponse;
        applySnapshot(data);
    };

    const parseError = (data: unknown, defaultMessage: string): string => {
        const isError =
            typeof data === 'object' &&
            data !== null && 'error' in data &&
            typeof data.error === 'string' &&
            data.error;

        return isError ? (data as { error: string }).error : defaultMessage;
    };

    const submitAction = async (x: number, y: number): Promise<void> => {
        if (!config.isLoaded || config.isBooting) 
            return;

        const payload: Record<string, string | number> = { tool: config.tool, x, y };

        if (config.tool === 'plant')
            payload.species = config.species;

        const response = await fetch(actionsEndpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const data: unknown = await response.json().catch((): unknown => null);
            const errorMessage = parseError(data, `Failed to update garden (${response.status}).`);
            throw new Error(errorMessage);
        }

        const data = await response.json() as T.SnapshotResponse;
        applySnapshot(data);
    };

    refs.toolButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (config.isBooting) 
                return;

            setTool(btn.dataset.tool as T.Tool);
        });
    });

    refs.originBtn.addEventListener('click', () => {
        if (config.isBooting) 
            return;

        resetView();
        renderViewportDependent();
    });

    const beginPointerPan = (event: PointerEvent, px: number, py: number): void => {
        config.panInteraction = { pointerId: event.pointerId, lastX: px, lastY: py };
        refs.surface.setPointerCapture(event.pointerId);
        updateCursor();
        renderHover();
    };

    const getGestureCentroid = (): { x: number; y: number } | null => {
        const pointers = Array.from(config.activePointers.values()).slice(0, 2);

        if (pointers.length < 2) 
            return null;
    
        const rect = refs.surface.getBoundingClientRect();
    
        return {
            x: (pointers[0].clientX + pointers[1].clientX) / 2 - rect.left,
            y: (pointers[0].clientY + pointers[1].clientY) / 2 - rect.top,
        };
    };

    const getGestureDistance = (): number | null => {
        const pointers = Array.from(config.activePointers.values()).slice(0, 2);

        if (pointers.length < 2) 
            return null;

        return Math.max(
            Math.hypot(
                pointers[1].clientX - pointers[0].clientX,
                pointers[1].clientY - pointers[0].clientY
            ),
            1
        );
    };

    const beginGesture = (): void => {
        const centroid = getGestureCentroid();
        const distance = getGestureDistance();

        if (!centroid || distance === null) 
            return;

        config.panInteraction = { mode: 'gesture', centroid, distance };
        updateCursor();
        renderHover();
    };

    const endPan = (): void => {
        config.panInteraction = null;
        updateCursor();
    };

    const clearPendingTouchAction = (): void => {
        config.pendingTouchAction = null;
    };

    refs.surface.addEventListener('pointerdown', (event: PointerEvent) => {
        if (config.isBooting) 
            return;

        if (event.pointerType === 'mouse' && event.button === 2) 
            return;

        const rect = refs.surface.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;

        config.activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

        if (event.pointerType === 'touch') {
            event.preventDefault();
            refs.surface.setPointerCapture(event.pointerId);

            if (config.activePointers.size === 1) {
                config.pendingTouchAction = {
                    pointerId: event.pointerId,
                    startX: px,
                    startY: py,
                    lastX: px,
                    lastY: py,
                    moved: false,
                };
                return;
            }

            if (config.activePointers.size === 2) {
                clearPendingTouchAction();
                endPan();
                beginGesture();
            }

            return;
        }

        if (event.button === 1 || (event.button === 0 && config.isSpacePressed)) {
            event.preventDefault();
            beginPointerPan(event, px, py);
            return;
        }

        if (event.button !== 0) 
            return;

        event.preventDefault();
        refs.surface.setPointerCapture(event.pointerId);
        const { x, y } = screenToCell(px, py);

        void submitAction(x, y).catch((error: unknown) => {
            config.loadError = error instanceof Error ? error.message : 'failed to update garden';
            renderActivityStatus();
        });
    });

    refs.surface.addEventListener('pointermove', (event: PointerEvent) => {
        if (config.isBooting) 
            return;

        if (config.activePointers.has(event.pointerId)) 
            config.activePointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    
        const rect = refs.surface.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;

        if (
            config.panInteraction &&
            'pointerId' in config.panInteraction &&
            config.panInteraction.pointerId === event.pointerId
        ) {
            event.preventDefault();

            config.pan = {
                x: config.pan.x + (px - config.panInteraction.lastX),
                y: config.pan.y + (py - config.panInteraction.lastY),
            };

            config.panInteraction.lastX = px;
            config.panInteraction.lastY = py;
            renderViewportDependent();
            return;
        }

        if (
            config.panInteraction &&
            'mode' in config.panInteraction &&
            config.panInteraction.mode === 'gesture'
        ) {
            event.preventDefault();
            const next = getGestureCentroid();
            const nextDistance = getGestureDistance();

            if (next && nextDistance !== null) {
                config.pan = {
                    x: config.pan.x + (next.x - config.panInteraction.centroid.x),
                    y: config.pan.y + (next.y - config.panInteraction.centroid.y),
                };

                zoomAt(next.x, next.y, config.zoom * (nextDistance / config.panInteraction.distance));
                config.panInteraction.centroid = next;
                config.panInteraction.distance = nextDistance;
                renderViewportDependent();
            }

            return;
        }

        if (event.pointerType === 'touch' && config.pendingTouchAction?.pointerId === event.pointerId) {
            const action = config.pendingTouchAction;
            const moved = Math.hypot(px - action.startX, py - action.startY) > C.TOUCH_TAP_SLOP_PX;
            config.pendingTouchAction.lastX = px;
            config.pendingTouchAction.lastY = py;
            config.pendingTouchAction.moved = config.pendingTouchAction.moved || moved;
            return;
        }

        const cell = screenToCell(px, py);
        config.hover = { ...cell, px, py };
        renderHover();
        renderCoord();
    });

    const pointerInteractionEnded = (event: PointerEvent): boolean => {
        return (
            config.panInteraction !== null &&
            'pointerId' in config.panInteraction &&
            config.panInteraction.pointerId === event.pointerId
        );
    };

    const gestureInteractionEnded = (): boolean => {
        return (
            config.panInteraction !== null &&
            'mode' in config.panInteraction &&
            config.panInteraction.mode === 'gesture' &&
            config.activePointers.size < 2
        );
    };

    const handlePointerRelease = (event: PointerEvent): void => {
        if (config.isBooting) 
            return;

        const rect = refs.surface.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;

        const shouldApplyTouchAction =
            event.pointerType === 'touch' &&
            config.pendingTouchAction?.pointerId === event.pointerId &&
            !config.pendingTouchAction.moved &&
            (!config.panInteraction || !('mode' in config.panInteraction));

        config.activePointers.delete(event.pointerId);

        if (pointerInteractionEnded(event) || gestureInteractionEnded())
            endPan();
    
        if (shouldApplyTouchAction) {
            const { x, y } = screenToCell(px, py);

            void submitAction(x, y).catch((error: unknown) => {
                config.loadError = error instanceof Error ? error.message : 'failed to update garden';
                renderActivityStatus();
            });
        }

        if (config.pendingTouchAction?.pointerId === event.pointerId) 
            clearPendingTouchAction();
    };

    refs.surface.addEventListener('pointerup', handlePointerRelease);

    refs.surface.addEventListener('pointercancel', (event: PointerEvent) => {
        if (config.isBooting) 
            return;

        config.activePointers.delete(event.pointerId);

        if (config.pendingTouchAction?.pointerId === event.pointerId) 
            clearPendingTouchAction();
    
        if (config.panInteraction && 'pointerId' in config.panInteraction &&
            config.panInteraction.pointerId === event.pointerId) 
            endPan();
        else if (
            config.panInteraction &&
            'mode' in config.panInteraction &&
            config.panInteraction.mode === 'gesture' &&
            config.activePointers.size < 2)
            endPan();
    });

    refs.surface.addEventListener('pointerleave', (event: PointerEvent) => {
        if (config.isBooting) 
            return;

        if (event.pointerType === 'mouse') {
            config.hover = null;
            renderHover();
            renderCoord();
        }
    });

    refs.surface.addEventListener('contextmenu', (event: Event) => {
        event.preventDefault();
    });

    refs.surface.addEventListener(
        'wheel',
        (event: WheelEvent) => {
            if (config.isBooting) 
                return;

            event.preventDefault();

            const rect = refs.surface.getBoundingClientRect();
            const px = event.clientX - rect.left;
            const py = event.clientY - rect.top;
            const scale = Math.exp(-event.deltaY * 0.0015);
            zoomAt(px, py, config.zoom * scale);
            renderViewportDependent();
        }, { passive: false }
    );

    window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (config.isBooting) 
            return;

        const target = event.target as HTMLElement | null;

        const isFormField =
            target instanceof HTMLInputElement ||
            target instanceof HTMLSelectElement ||
            target instanceof HTMLTextAreaElement;

        if (event.code === 'Space' && !isFormField) {
            if (!config.isSpacePressed) {
                config.isSpacePressed = true;
                updateCursor();
            }

            event.preventDefault();
            return;
        }

        if (isFormField) 
            return;

        let handled = true;
        const step = getCellSize() * (event.shiftKey ? 5 : 1);

        if (event.key === 'ArrowLeft') 
            config.pan = { ...config.pan, x: config.pan.x + step };
        else if (event.key === 'ArrowRight') config.pan = { ...config.pan, x: config.pan.x - step };
        else if (event.key === 'ArrowUp') config.pan = { ...config.pan, y: config.pan.y + step };
        else if (event.key === 'ArrowDown') config.pan = { ...config.pan, y: config.pan.y - step };
        else if (event.key.toLowerCase() === 'o') resetView();
        else if (event.key.toLowerCase() === 'p') setTool('plant' as T.Tool);
        else if (event.key.toLowerCase() === 'w') setTool('water' as T.Tool);
        else if (event.key.toLowerCase() === 'x') setTool('prune' as T.Tool);
        else if (event.key === '1') {
            config.species = 'daisy';
            renderSpecies();
        } else if (event.key === '2') {
            config.species = 'tulip';
            renderSpecies();
        } else if (event.key === '3') {
            config.species = 'poppy';
            renderSpecies();
        } else if (event.key === '4') {
            config.species = 'fern';
            renderSpecies();
        } else 
            handled = false;
    
        if (handled && event.key.startsWith('Arrow')) 
            event.preventDefault();

        if (handled) 
            renderViewportDependent();
    });

    window.addEventListener('keyup', (event: KeyboardEvent) => {
        if (config.isBooting) 
            return;

        if (event.code === 'Space' && config.isSpacePressed) {
            config.isSpacePressed = false;
            updateCursor();
        }
    });

    const observer = new ResizeObserver(() => {
        syncViewport();
        renderViewportDependent();
    });

    syncViewport();
    observer.observe(refs.surface);

    setInterval(() => {
        void fetchSnapshot().catch((error: unknown) => {
            config.loadError = error instanceof Error ? error.message : 'failed to load garden';
            renderActivityStatus();
        });
    }, C.SNAPSHOT_FETCH_INTERVAL_MS);

    setInterval(() => {
        renderHover();
        renderActivity();
        renderActivityStatus();
    }, C.ACTIVITY_RENDER_INTERVAL_MS);

    renderTools();
    renderSpecies();
    renderBootState();
    renderActivityStatus();
    renderStats();
    renderActivity();

    void fetchSnapshot().catch((error: unknown) => {
        config.loadError = error instanceof Error ? error.message : 'failed to load garden';
        renderActivityStatus();
    });
}
