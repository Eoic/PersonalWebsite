from __future__ import annotations

import random
import time
from datetime import UTC, datetime, timedelta

from peewee import IntegrityError, OperationalError

from .db import db_proxy
from .models import GardenActivity, GardenCell, GardenMeta

BOARD_SLUG = "main"
MAX_CELLS = 1500
ACTIVITY_LIMIT = 20
SIMULATION_SLICE = timedelta(hours=1)
WATER_WARN_MS = 1000 * 60 * 60 * 24 * 3
WILT_MS = 1000 * 60 * 60 * 24 * 14
NATURAL_WILT_MS = 1000 * 60 * 60 * 24 * 30
RETURN_TO_SOIL_MS = 1000 * 60 * 60 * 24 * 45
GROW_INTERVAL_MS = 1000 * 60 * 60 * 8
POPULATION_CAP_MSG = (
    "garden is at capacity; prune or wait for flowers to return to soil"
)
RETRY_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 0.05

INITIAL_LAYOUT = [
    (-3, -1, "daisy", "bloom"),
    (-2, 0, "daisy", "bud"),
    (-1, 1, "tulip", "bloom"),
    (0, 0, "poppy", "bloom"),
    (1, -1, "tulip", "bud"),
    (2, 0, "fern", "bloom"),
    (3, 1, "daisy", "sprout"),
    (0, -2, "fern", "bud"),
    (-1, -2, "tulip", "sprout"),
    (2, -2, "poppy", "seed"),
    (-4, 1, "poppy", "bloom"),
    (4, -1, "fern", "sprout"),
    (5, 1, "daisy", "bud"),
    (-5, 0, "tulip", "bloom"),
    (6, 0, "poppy", "seed"),
]

STAGE_ORDER = ["seed", "sprout", "bud", "bloom", "wilt"]


class GardenConflictError(RuntimeError):
    """Raised when a garden read/write cannot be completed safely after retries."""


def _coerce_utc(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=UTC)

    return timestamp.astimezone(UTC)


def _format_timestamp(timestamp: datetime) -> str:
    return (
        _coerce_utc(timestamp).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    )


def _prepend_activity(
    activities: list[dict], type_: str, msg: str, created_at: datetime
) -> None:
    activities.insert(0, {"type": type_, "msg": msg, "created_at": created_at})
    del activities[ACTIVITY_LIMIT:]


def _get_season(date: datetime) -> str:
    month = date.month

    if month in (12, 1, 2):
        return "winter"

    if month <= 5:
        return "spring"

    if month <= 8:
        return "summer"

    return "autumn"


def _get_weather(date: datetime) -> str:
    day = int(date.timestamp() // (60 * 60 * 24))
    hash_value = (day * 9301 + 49297) % 233280
    value = hash_value / 233280

    if value < 0.4:
        return "clear"

    if value < 0.65:
        return "cloudy"

    if value < 0.85:
        return "rain"

    if value < 0.95:
        return "fog"

    return "snow"


def _get_wind(date: datetime) -> dict:
    slot = int(date.timestamp() // (60 * 60 * 6))
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

    vectors = {
        "N": {"dx": 0, "dy": -1},
        "NE": {"dx": 1, "dy": -1},
        "E": {"dx": 1, "dy": 0},
        "SE": {"dx": 1, "dy": 1},
        "S": {"dx": 0, "dy": 1},
        "SW": {"dx": -1, "dy": 1},
        "W": {"dx": -1, "dy": 0},
        "NW": {"dx": -1, "dy": -1},
    }

    direction = directions[
        ((slot * 17 + 5) % len(directions) + len(directions)) % len(directions)
    ]

    strength_roll = ((slot * 48271 + 12820163) % 1000) / 1000

    if strength_roll < 0.18:
        strength = "calm"
    elif strength_roll < 0.52:
        strength = "light"
    elif strength_roll < 0.84:
        strength = "steady"
    else:
        strength = "gusty"

    return {
        "direction": direction,
        "strength": strength,
        "label": f"{strength} {direction}",
        **vectors[direction],
    }


def _is_daytime(date: datetime) -> bool:
    return 6 <= date.hour < 20


def _get_health(stage_counts: dict[str, int], total_cells: int) -> str:
    bloom_pct = round((stage_counts["bloom"] / total_cells) * 100) if total_cells else 0

    if stage_counts["wilt"] > total_cells / 2:
        return "struggling"

    if bloom_pct > 60:
        return "thriving"

    if bloom_pct > 35:
        return "healthy"

    if bloom_pct > 15:
        return "steady"

    return "dormant"


def _wind_strength_weight(strength: str) -> float:
    if strength == "calm":
        return 0.15

    if strength == "light":
        return 0.45

    if strength == "steady":
        return 0.9

    return 1.35


def _choose_neighbor(candidates: list[tuple[int, int]], wind: dict) -> tuple[int, int]:
    strength_weight = _wind_strength_weight(wind["strength"])
    weighted: list[tuple[tuple[int, int], float]] = []
    total = 0.0

    for dx, dy in candidates:
        alignment = dx * wind["dx"] + dy * wind["dy"]
        score = max(0.2, 1 + alignment * strength_weight)
        weighted.append(((dx, dy), score))
        total += score

    roll = random.random() * total

    for cell, score in weighted:
        roll -= score

        if roll <= 0:
            return cell

    return weighted[-1][0]


def _ensure_board(board_slug: str, now_utc: datetime) -> GardenMeta:
    meta, created = GardenMeta.get_or_create(
        board_slug=board_slug,
        defaults={
            "planted_total": len(INITIAL_LAYOUT),
            "last_simulated_at": now_utc,
            "version": 1,
            "created_at": now_utc,
            "updated_at": now_utc,
        },
    )

    if created:
        if INITIAL_LAYOUT:
            GardenCell.insert_many(
                [
                    {
                        "board_slug": board_slug,
                        "x": x,
                        "y": y,
                        "species": species,
                        "stage": stage,
                        "planted_at": now_utc,
                        "last_water_at": now_utc,
                        "author_label": "system",
                    }
                    for x, y, species, stage in INITIAL_LAYOUT
                ]
            ).execute()

        GardenActivity.create(
            board_slug=board_slug,
            type="system",
            msg="garden initialized",
            created_at=now_utc,
        )

    meta.last_simulated_at = _coerce_utc(meta.last_simulated_at)
    meta.created_at = _coerce_utc(meta.created_at)
    meta.updated_at = _coerce_utc(meta.updated_at)
    return meta


def _load_cells(board_slug: str) -> dict[tuple[int, int], dict]:
    cells: dict[tuple[int, int], dict] = {}

    for cell in GardenCell.select().where(GardenCell.board_slug == board_slug):
        cells[(cell.x, cell.y)] = {
            "species": cell.species,
            "stage": cell.stage,
            "planted_at": _coerce_utc(cell.planted_at),
            "last_water_at": _coerce_utc(cell.last_water_at),
            "author_label": cell.author_label,
        }

    return cells


def _load_activities(board_slug: str) -> list[dict]:
    query = (
        GardenActivity.select()
        .where(GardenActivity.board_slug == board_slug)
        .order_by(GardenActivity.created_at.desc(), GardenActivity.id.desc())
        .limit(ACTIVITY_LIMIT)
    )

    return [
        {
            "type": item.type,
            "msg": item.msg,
            "created_at": _coerce_utc(item.created_at),
        }
        for item in query
    ]


def _persist_cells(board_slug: str, cells: dict[tuple[int, int], dict]) -> None:
    GardenCell.delete().where(GardenCell.board_slug == board_slug).execute()

    if not cells:
        return

    GardenCell.insert_many(
        [
            {
                "board_slug": board_slug,
                "x": x,
                "y": y,
                "species": cell["species"],
                "stage": cell["stage"],
                "planted_at": cell["planted_at"],
                "last_water_at": cell["last_water_at"],
                "author_label": cell["author_label"],
            }
            for (x, y), cell in sorted(cells.items())
        ]
    ).execute()


def _persist_activities(board_slug: str, activities: list[dict]) -> None:
    GardenActivity.delete().where(GardenActivity.board_slug == board_slug).execute()

    if not activities:
        return

    GardenActivity.insert_many(
        [
            {
                "board_slug": board_slug,
                "type": activity["type"],
                "msg": activity["msg"],
                "created_at": activity["created_at"],
            }
            for activity in reversed(activities[:ACTIVITY_LIMIT])
        ]
    ).execute()


def _is_retryable_db_error(error: Exception) -> bool:
    if isinstance(error, IntegrityError):
        return True

    if not isinstance(error, OperationalError):
        return False

    message = str(error).lower()
    return "locked" in message or "busy" in message


def _run_with_retry(operation, error_message: str):
    last_error: Exception | None = None

    for attempt in range(RETRY_ATTEMPTS):
        try:
            return operation()
        except (IntegrityError, OperationalError) as error:
            if not _is_retryable_db_error(error):
                raise

            last_error = error

            if attempt == RETRY_ATTEMPTS - 1:
                break

            time.sleep(RETRY_DELAY_SECONDS * (attempt + 1))

    raise GardenConflictError(error_message) from last_error


def _simulate(
    meta: GardenMeta,
    cells: dict[tuple[int, int], dict],
    activities: list[dict],
    now_utc: datetime,
) -> bool:
    changed = False
    current = _coerce_utc(meta.last_simulated_at)

    while current < now_utc:
        step_end = min(current + SIMULATION_SLICE, now_utc)
        weather = _get_weather(step_end)
        wind = _get_wind(step_end)

        if weather == "rain" and cells:
            for cell in cells.values():
                cell["last_water_at"] = step_end

            changed = True

        for position, cell in list(cells.items()):
            age_ms = int((step_end - cell["planted_at"]).total_seconds() * 1000)
            dryness_ms = int(
                (
                    step_end - (cell["last_water_at"] or cell["planted_at"])
                ).total_seconds()
                * 1000
            )
            idx = STAGE_ORDER.index(cell["stage"])
            coord = f"{position[0]},{position[1]}"

            if cell["stage"] == "wilt" and age_ms > RETURN_TO_SOIL_MS:
                del cells[position]
                _prepend_activity(
                    activities,
                    "cycle",
                    f"{cell['species']} at ({coord}) returned to soil",
                    step_end,
                )
                changed = True
            elif (
                idx < 3
                and age_ms > GROW_INTERVAL_MS * (idx + 1)
                and dryness_ms < WILT_MS
            ):
                cell["stage"] = STAGE_ORDER[idx + 1]
                changed = True
            elif cell["stage"] != "wilt" and age_ms > NATURAL_WILT_MS:
                cell["stage"] = "wilt"
                _prepend_activity(
                    activities,
                    "cycle",
                    f"{cell['species']} at ({coord}) reached the end of its cycle",
                    step_end,
                )
                changed = True
            elif cell["stage"] != "wilt" and dryness_ms > WILT_MS:
                cell["stage"] = "wilt"
                _prepend_activity(
                    activities,
                    "wilt",
                    f"{cell['species']} at ({coord}) wilted",
                    step_end,
                )
                changed = True

        bloom_rate = (
            0.08
            if weather == "clear"
            else 0.04
            if weather == "cloudy"
            else 0.12
            if weather == "rain"
            else 0.02
        )

        for (x, y), cell in list(cells.items()):
            if cell["stage"] != "bloom":
                continue

            if random.random() > bloom_rate:
                continue

            if len(cells) >= MAX_CELLS:
                continue

            neighbors = [
                (x + 1, y),
                (x - 1, y),
                (x, y + 1),
                (x, y - 1),
                (x + 1, y + 1),
                (x - 1, y - 1),
                (x + 1, y - 1),
                (x - 1, y + 1),
            ]

            free = [(nx, ny) for nx, ny in neighbors if (nx, ny) not in cells]

            if not free:
                continue

            offsets = [(nx - x, ny - y) for nx, ny in free]
            dx, dy = _choose_neighbor(offsets, wind)
            nx, ny = x + dx, y + dy

            cells[(nx, ny)] = {
                "species": cell["species"],
                "stage": "seed",
                "planted_at": step_end,
                "last_water_at": step_end,
                "author_label": "pollen",
            }

            meta.planted_total += 1

            _prepend_activity(
                activities,
                "pollen",
                f"{cell['species']} seeded at ({nx},{ny})",
                step_end,
            )
            changed = True

        current = step_end

    meta.last_simulated_at = now_utc

    if changed:
        meta.version += 1
        meta.updated_at = now_utc

    return changed


def _apply_action(
    meta: GardenMeta,
    cells: dict[tuple[int, int], dict],
    activities: list[dict],
    tool: str,
    x: int,
    y: int,
    species: str | None,
    now_utc: datetime,
) -> bool:
    position = (x, y)
    cell = cells.get(position)

    if tool == "plant":
        if cell is not None:
            return False
        if len(cells) >= MAX_CELLS:
            _prepend_activity(activities, "system", POPULATION_CAP_MSG, now_utc)
            return True
        if species is None:
            return False

        cells[position] = {
            "species": species,
            "stage": "seed",
            "planted_at": now_utc,
            "last_water_at": now_utc,
            "author_label": "visitor",
        }
        meta.planted_total += 1
        _prepend_activity(
            activities, "plant", f"planted {species} at ({x},{y})", now_utc
        )
        return True

    if cell is None:
        return False

    if tool == "water":
        age_ms = int((now_utc - cell["planted_at"]).total_seconds() * 1000)
        revived = cell["stage"] == "wilt" and age_ms < NATURAL_WILT_MS
        cell["last_water_at"] = now_utc

        if revived:
            cell["stage"] = "bud"

        _prepend_activity(
            activities,
            "water",
            f"watered ({x},{y}) and revived it to bud"
            if revived
            else f"watered ({x},{y})",
            now_utc,
        )

        return True

    if tool == "prune":
        del cells[position]
        _prepend_activity(
            activities,
            "prune",
            f"pruned {cell['species']} at ({x},{y})",
            now_utc,
        )
        return True

    return False


def _serialize_snapshot(
    meta: GardenMeta,
    cells: dict[tuple[int, int], dict],
    activities: list[dict],
    now_utc: datetime,
) -> dict:
    stage_counts = {stage: 0 for stage in STAGE_ORDER}
    species_counts: dict[str, int] = {}

    for cell in cells.values():
        stage_counts[cell["stage"]] += 1
        species_counts[cell["species"]] = species_counts.get(cell["species"], 0) + 1

    total_cells = len(cells)
    alive_now = total_cells - stage_counts["wilt"]
    bloom_pct = round((stage_counts["bloom"] / total_cells) * 100) if total_cells else 0
    wind = _get_wind(now_utc)

    return {
        "serverNow": _format_timestamp(now_utc),
        "version": meta.version,
        "environment": {
            "season": _get_season(now_utc),
            "weather": _get_weather(now_utc),
            "wind": {
                "direction": wind["direction"],
                "strength": wind["strength"],
                "label": wind["label"],
            },
            "time": "day" if _is_daytime(now_utc) else "night",
        },
        "stats": {
            "plantedTotal": meta.planted_total,
            "aliveNow": alive_now,
            "health": _get_health(stage_counts, total_cells),
            "bloomPct": bloom_pct,
        },
        "cells": [
            {
                "x": x,
                "y": y,
                "species": cell["species"],
                "stage": cell["stage"],
                "plantedAt": _format_timestamp(cell["planted_at"]),
                "lastWaterAt": _format_timestamp(cell["last_water_at"]),
                "author": cell["author_label"],
            }
            for (x, y), cell in sorted(cells.items())
        ],
        "activity": [
            {
                "type": activity["type"],
                "msg": activity["msg"],
                "createdAt": _format_timestamp(activity["created_at"]),
            }
            for activity in activities[:ACTIVITY_LIMIT]
        ],
        "legend": species_counts,
    }


def get_garden_snapshot(
    board_slug: str = BOARD_SLUG,
    now_utc: datetime | None = None,
) -> dict:
    now_utc = _coerce_utc(now_utc or datetime.now(UTC))

    def operation() -> dict:
        with db_proxy.atomic():
            meta = _ensure_board(board_slug, now_utc)
            cells = _load_cells(board_slug)
            activities = _load_activities(board_slug)
            changed = _simulate(meta, cells, activities, now_utc)

            if changed:
                _persist_cells(board_slug, cells)
                _persist_activities(board_slug, activities)

            meta.save()
            return _serialize_snapshot(meta, cells, activities, now_utc)

    return _run_with_retry(
        operation,
        "garden is busy; try again in a moment",
    )


def apply_garden_action(
    tool: str,
    x: int,
    y: int,
    species: str | None = None,
    board_slug: str = BOARD_SLUG,
    now_utc: datetime | None = None,
) -> dict:
    now_utc = _coerce_utc(now_utc or datetime.now(UTC))

    def operation() -> dict:
        with db_proxy.atomic():
            meta = _ensure_board(board_slug, now_utc)
            cells = _load_cells(board_slug)
            activities = _load_activities(board_slug)
            changed = _simulate(meta, cells, activities, now_utc)

            action_changed = _apply_action(
                meta,
                cells,
                activities,
                tool,
                x,
                y,
                species,
                now_utc,
            )

            if action_changed:
                meta.version += 1
                meta.updated_at = now_utc

            if changed or action_changed:
                _persist_cells(board_slug, cells)
                _persist_activities(board_slug, activities)

            meta.save()
            return _serialize_snapshot(meta, cells, activities, now_utc)

    return _run_with_retry(
        operation,
        "garden is busy; your action was not applied; try again in a moment",
    )
