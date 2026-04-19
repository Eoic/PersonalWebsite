import type { CreateStrokeResponse, StrokesResponse, Stroke } from './types';
import { parseErrorResponse } from './utils';

export async function createStrokeRequest(
    strokesEndpoint: string,
    clientSessionId: string,
    stroke: Stroke
): Promise<CreateStrokeResponse> {
    const response = await fetch(strokesEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            clientSessionId,
            tool: 'draw',
            color: stroke.color,
            brushSize: stroke.brushSize,
            points: stroke.points,
        }),
    });

    if (!response.ok) 
        throw new Error(await parseErrorResponse(response));

    return (await response.json()) as CreateStrokeResponse;
}

export async function deleteStrokeRequest(
    strokesEndpoint: string,
    strokeId: number,
    clientSessionId: string
): Promise<void> {
    const response = await fetch(`${strokesEndpoint}/${strokeId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            clientSessionId,
        }),
    });

    if (!response.ok) 
        throw new Error(await parseErrorResponse(response));
}

export async function clearWhiteboardRequest(strokesEndpoint: string): Promise<void> {
    const response = await fetch(strokesEndpoint, {
        method: 'DELETE',
    });

    if (!response.ok) 
        throw new Error(await parseErrorResponse(response));
}

export async function loadStrokesRequest(strokesEndpoint: string): Promise<StrokesResponse> {
    const response = await fetch(strokesEndpoint, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) 
        throw new Error(await parseErrorResponse(response));

    return (await response.json()) as StrokesResponse;
}
