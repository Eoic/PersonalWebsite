from __future__ import annotations

from datetime import UTC, datetime

CELL_PX = 28
HALF_CELL_PX = CELL_PX // 2
SPECIES_LIST = ("daisy", "tulip", "poppy", "fern")
SPRITES = {
    "daisy": {
        "seed": [{"x": 7, "y": 11, "width": 2}, {"x": 8, "y": 12, "opacity": 0.5}],
        "sprout": [
            {"x": 8, "y": 13, "height": 2},
            {"x": 7, "y": 11, "opacity": 0.7},
            {"x": 9, "y": 11, "opacity": 0.7},
            {"x": 8, "y": 10},
        ],
        "bud": [
            {"x": 8, "y": 10, "height": 5},
            {"x": 7, "y": 12, "opacity": 0.5},
            {"x": 7, "y": 8, "width": 3, "height": 2},
            {"x": 8, "y": 7},
        ],
        "bloom": [
            {"x": 8, "y": 11, "height": 4},
            {"x": 6, "y": 13, "width": 2, "opacity": 0.55},
            {"x": 8, "y": 4},
            {"x": 8, "y": 9},
            {"x": 5, "y": 6},
            {"x": 11, "y": 6},
            {"x": 4, "y": 8},
            {"x": 12, "y": 8},
            {"x": 5, "y": 10},
            {"x": 11, "y": 10},
            {"x": 7, "y": 5, "width": 3, "height": 4, "opacity": 0.18},
            {"x": 6, "y": 6, "height": 2, "opacity": 0.3},
            {"x": 10, "y": 6, "height": 2, "opacity": 0.3},
            {"x": 7, "y": 4, "width": 2, "opacity": 0.3},
            {"x": 7, "y": 9, "width": 2, "opacity": 0.3},
            {"x": 8, "y": 6, "height": 2},
            {"x": 7, "y": 7, "width": 3},
        ],
        "wilt": [
            {"x": 7, "y": 11, "height": 4, "opacity": 0.8},
            {"x": 6, "y": 10, "width": 2, "opacity": 0.8},
            {"x": 5, "y": 9, "width": 2, "opacity": 0.5},
            {"x": 4, "y": 10, "opacity": 0.3},
            {"x": 6, "y": 12, "opacity": 0.4},
        ],
    },
    "tulip": {
        "seed": [{"x": 7, "y": 12, "width": 2}, {"x": 6, "y": 11, "opacity": 0.5}],
        "sprout": [
            {"x": 8, "y": 13, "height": 2},
            {"x": 8, "y": 11},
            {"x": 7, "y": 10, "opacity": 0.6},
            {"x": 9, "y": 10, "opacity": 0.6},
        ],
        "bud": [
            {"x": 8, "y": 10, "height": 5},
            {"x": 7, "y": 13, "opacity": 0.5},
            {"x": 9, "y": 11, "opacity": 0.5},
            {"x": 8, "y": 7, "height": 3},
            {"x": 9, "y": 8},
        ],
        "bloom": [
            {"x": 8, "y": 9, "height": 6},
            {"x": 9, "y": 12, "width": 2, "opacity": 0.55},
            {"x": 6, "y": 11, "width": 2, "opacity": 0.55},
            {"x": 6, "y": 6, "height": 3},
            {"x": 10, "y": 6, "height": 3},
            {"x": 8, "y": 5, "height": 4},
            {"x": 7, "y": 6, "height": 2},
            {"x": 9, "y": 6, "height": 2},
            {"x": 6, "y": 5},
            {"x": 10, "y": 5},
            {"x": 7, "y": 4, "width": 2},
            {"x": 7, "y": 7, "opacity": 0.35},
            {"x": 9, "y": 7, "opacity": 0.35},
            {"x": 8, "y": 8, "opacity": 0.2},
        ],
        "wilt": [
            {"x": 8, "y": 12, "height": 3, "opacity": 0.8},
            {"x": 9, "y": 14, "opacity": 0.5},
            {"x": 8, "y": 10, "width": 2, "height": 2, "opacity": 0.7},
            {"x": 10, "y": 11, "opacity": 0.4},
            {"x": 7, "y": 11, "opacity": 0.4},
        ],
    },
    "poppy": {
        "seed": [{"x": 7, "y": 11, "width": 2}, {"x": 8, "y": 12, "opacity": 0.5}],
        "sprout": [
            {"x": 8, "y": 13, "height": 2},
            {"x": 8, "y": 11},
            {"x": 7, "y": 10, "opacity": 0.6},
            {"x": 9, "y": 10, "opacity": 0.6},
        ],
        "bud": [
            {"x": 8, "y": 10, "height": 5},
            {"x": 8, "y": 8, "height": 2},
            {"x": 7, "y": 7, "width": 3},
            {"x": 8, "y": 6, "opacity": 0.6},
        ],
        "bloom": [
            {"x": 8, "y": 8, "height": 7},
            {"x": 6, "y": 12, "width": 2, "opacity": 0.55},
            {"x": 9, "y": 10, "width": 2, "opacity": 0.55},
            {"x": 8, "y": 3, "height": 3},
            {"x": 7, "y": 4},
            {"x": 9, "y": 4},
            {"x": 4, "y": 6, "width": 2},
            {"x": 10, "y": 6, "width": 2},
            {"x": 5, "y": 5},
            {"x": 10, "y": 5},
            {"x": 5, "y": 7},
            {"x": 10, "y": 7},
            {"x": 6, "y": 5, "width": 4, "height": 3, "opacity": 0.22},
            {"x": 7, "y": 6, "width": 3, "height": 2},
            {"x": 8, "y": 5},
            {"x": 7, "y": 5, "opacity": 0.5},
            {"x": 9, "y": 5, "opacity": 0.5},
        ],
        "wilt": [
            {"x": 8, "y": 11, "height": 4, "opacity": 0.8},
            {"x": 7, "y": 9, "width": 3, "opacity": 0.5},
            {"x": 6, "y": 10, "opacity": 0.35},
            {"x": 10, "y": 10, "opacity": 0.35},
            {"x": 9, "y": 12, "opacity": 0.4},
        ],
    },
    "fern": {
        "seed": [{"x": 7, "y": 12, "width": 2}, {"x": 6, "y": 11, "opacity": 0.5}],
        "sprout": [
            {"x": 8, "y": 13, "height": 2},
            {"x": 7, "y": 11, "opacity": 0.7},
            {"x": 9, "y": 11, "opacity": 0.7},
            {"x": 8, "y": 10},
        ],
        "bud": [
            {"x": 8, "y": 10, "height": 5},
            {"x": 7, "y": 12, "opacity": 0.5},
            {"x": 9, "y": 13, "opacity": 0.5},
            {"x": 7, "y": 8, "width": 3, "height": 2},
            {"x": 6, "y": 9, "opacity": 0.6},
            {"x": 10, "y": 9, "opacity": 0.6},
        ],
        "bloom": [
            {"x": 8, "y": 10, "height": 5},
            {"x": 6, "y": 13, "width": 2, "opacity": 0.55},
            {"x": 9, "y": 11, "width": 2, "opacity": 0.55},
            {"x": 8, "y": 3, "height": 2},
            {"x": 8, "y": 9},
            {"x": 3, "y": 7, "width": 2},
            {"x": 11, "y": 7, "width": 2},
            {"x": 5, "y": 4},
            {"x": 10, "y": 4},
            {"x": 5, "y": 10},
            {"x": 10, "y": 10},
            {"x": 4, "y": 5},
            {"x": 11, "y": 5},
            {"x": 4, "y": 9, "opacity": 0.7},
            {"x": 11, "y": 9, "opacity": 0.7},
            {"x": 7, "y": 6, "width": 3, "height": 3, "opacity": 0.25},
            {"x": 7, "y": 7, "width": 3},
            {"x": 8, "y": 6, "height": 3},
        ],
        "wilt": [
            {"x": 8, "y": 12, "height": 3, "opacity": 0.8},
            {"x": 6, "y": 9, "width": 5, "opacity": 0.5},
            {"x": 5, "y": 10, "opacity": 0.3},
            {"x": 11, "y": 10, "opacity": 0.3},
            {"x": 7, "y": 11, "width": 3, "opacity": 0.4},
        ],
    },
}


def _parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def _format_ago(value: str, now: datetime) -> str:
    delta_seconds = max(0, int((now - _parse_timestamp(value)).total_seconds()))

    if delta_seconds < 60:
        return f"{delta_seconds}s ago"

    delta_minutes = delta_seconds // 60

    if delta_minutes < 60:
        return f"{delta_minutes}m ago"

    delta_hours = delta_minutes // 60

    if delta_hours < 24:
        return f"{delta_hours}h ago"

    return f"{delta_hours // 24}d ago"


def _render_sprite(species: str, stage: str, size: int) -> str:
    rects = []

    for part in SPRITES[species][stage]:
        rects.append(
            (
                f'<rect x="{part["x"]}" y="{part["y"]}" '
                f'width="{part.get("width", 1)}" '
                f'height="{part.get("height", 1)}" '
                f'fill="currentColor" '
                f'opacity="{part.get("opacity", 1)}"></rect>'
            )
        )

    return (
        f'<svg viewBox="0 0 16 16" width="{size}" height="{size}" '
        'style="display:block;shape-rendering:crispEdges" '
        'xmlns="http://www.w3.org/2000/svg">'
        f"{''.join(rects)}</svg>"
    )


def _get_flower_style(x: int, y: int) -> str:
    return (
        f"left: calc(50% + {x * CELL_PX - HALF_CELL_PX}px); "
        f"top: calc(50% + {y * CELL_PX - HALF_CELL_PX}px); "
        f"width: {CELL_PX}px; "
        f"height: {CELL_PX}px;"
    )


def build_garden_page_state(snapshot: dict) -> dict:
    server_now = _parse_timestamp(snapshot["serverNow"])
    legend = snapshot.get("legend", {})
    species_buttons = [
        {
            "species": species,
            "sprite_html": _render_sprite(species, "bloom", 16),
        }
        for species in SPECIES_LIST
    ]

    flowers = [
        {
            "x": cell["x"],
            "y": cell["y"],
            "species": cell["species"],
            "stage": cell["stage"],
            "title": f"{cell['species']} / {cell['stage']} / {cell['x']},{cell['y']}",
            "style": _get_flower_style(cell["x"], cell["y"]),
            "sprite_html": _render_sprite(cell["species"], cell["stage"], CELL_PX),
        }
        for cell in snapshot["cells"]
    ]

    legend_rows = [
        {
            "species": species,
            "count": legend.get(species, 0),
            "sprite_html": _render_sprite(species, "bloom", 20),
        }
        for species in SPECIES_LIST
    ]

    activity_rows = [
        {
            "type": entry["type"],
            "msg": entry["msg"],
            "time_ago": _format_ago(entry["createdAt"], server_now),
        }
        for entry in snapshot["activity"][:8]
    ]

    return {
        "flowers": flowers,
        "species_buttons": species_buttons,
        "legend_rows": legend_rows,
        "activity_rows": activity_rows,
        "stats": {
            "planted_total": str(snapshot["stats"]["plantedTotal"]).rjust(4, "0"),
            "alive_now": str(snapshot["stats"]["aliveNow"]).rjust(4, "0"),
            "health": snapshot["stats"]["health"],
            "bloom_pct": f"{snapshot['stats']['bloomPct']}%",
        },
        "environment": snapshot["environment"],
        "coord_cursor": "(0,0)",
        "coord_center": "(0,0)",
        "grid_style": (
            f"background-position: calc(50% - {HALF_CELL_PX}px) calc(50% - {HALF_CELL_PX}px); "
            f"background-size: {CELL_PX}px {CELL_PX}px;"
        ),
        "axis_h_style": "top: 50%;",
        "axis_v_style": "left: 50%;",
    }
