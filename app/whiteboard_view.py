from __future__ import annotations

from typing import Iterable

GRID_PX = 28


def _get_stroke_bounds(stroke: dict) -> tuple[float, float, float, float]:
    points = stroke["points"]
    padding = max(stroke["brushSize"] / 2, 1) + 1

    if len(points) == 1:
        point = points[0]
        return (
            point["x"] - padding,
            point["y"] - padding,
            point["x"] + padding,
            point["y"] + padding,
        )

    min_x = min(point["x"] for point in points) - padding
    min_y = min(point["y"] for point in points) - padding
    max_x = max(point["x"] for point in points) + padding
    max_y = max(point["y"] for point in points) + padding
    return min_x, min_y, max_x, max_y


def _render_stroke_svg(stroke: dict) -> dict:
    min_x, min_y, max_x, max_y = _get_stroke_bounds(stroke)
    width = max(max_x - min_x, 1)
    height = max(max_y - min_y, 1)

    style = (
        f"left: calc(50% + {min_x}px); "
        f"top: calc(50% + {min_y}px); "
        f"width: {width}px; "
        f"height: {height}px;"
    )

    if len(stroke["points"]) == 1:
        point = stroke["points"][0]
        content = (
            f'<circle cx="{point["x"]}" cy="{point["y"]}" '
            f'r="{max(stroke["brushSize"] / 2, 0.5)}" fill="{stroke["color"]}"></circle>'
        )
    else:
        path = " ".join(
            (
                f'M {stroke["points"][0]["x"]} {stroke["points"][0]["y"]}',
                *[
                    f'L {point["x"]} {point["y"]}'
                    for point in stroke["points"][1:]
                ],
            )
        )
        content = (
            f'<path d="{path}" '
            f'stroke="{stroke["color"]}" '
            f'stroke-width="{max(stroke["brushSize"], 1)}" '
            'stroke-linecap="round" '
            'stroke-linejoin="round" '
            'fill="none"></path>'
        )

    svg = (
        f'<svg viewBox="{min_x} {min_y} {width} {height}" '
        f'width="{width}" height="{height}" '
        'xmlns="http://www.w3.org/2000/svg" '
        'preserveAspectRatio="none">'
        f"{content}</svg>"
    )

    return {
        "id": stroke["id"],
        "style": style,
        "svg": svg,
    }


def build_whiteboard_page_state(strokes: Iterable[dict]) -> dict:
    stroke_svgs = [_render_stroke_svg(stroke) for stroke in strokes]

    return {
        "stroke_count": len(stroke_svgs),
        "stroke_svgs": stroke_svgs,
        "grid_style": f"background-position: 50% 50%; background-size: {GRID_PX}px {GRID_PX}px;",
        "axis_h_style": "top: 50%;",
        "axis_v_style": "left: 50%;",
    }
