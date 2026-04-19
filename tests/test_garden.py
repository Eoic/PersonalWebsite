import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from app import create_app
from app.db import db_proxy
from app.garden_state import GardenConflictError, apply_garden_action, get_garden_snapshot
from app.models import Page


def _fake_config_loader(database_path):
    def loader(self, filename, load, text=False, silent=False):
        self.update(
            SECRET_KEY="test-secret",
            DATABASE_PATH=database_path,
        )
        return True

    return loader


class GardenRoutesTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = f"{self.temp_dir.name}/test.db"
        config_loader = _fake_config_loader(self.database_path)

        with patch("flask.config.Config.from_file", new=config_loader):
            self.app = create_app()

        self.app.config.update(TESTING=True, RATELIMIT_ENABLED=False)
        self.client = self.app.test_client()

        db_proxy.connect(reuse_if_open=True)
        Page.create(
            slug="garden",
            title="Garden",
            description="Shared garden",
            url="/garden",
            sort_order=0,
        )
        db_proxy.close()

    def tearDown(self):
        if not db_proxy.is_closed():
            db_proxy.close()

        self.temp_dir.cleanup()

    def test_garden_page_renders_with_dedicated_script_and_endpoints(self):
        response = self.client.get("/garden")
        body = response.get_data(as_text=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn("/assets/js/garden.min.js", body)
        self.assertIn('data-state-endpoint="/garden/state"', body)
        self.assertIn('data-actions-endpoint="/garden/actions"', body)

    def test_get_garden_state_returns_authoritative_snapshot(self):
        response = self.client.get("/garden/state")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertRegex(data["serverNow"], r"Z$")
        self.assertIn("season", data["environment"])
        self.assertIn("weather", data["environment"])
        self.assertIn("wind", data["environment"])
        self.assertIn("time", data["environment"])
        self.assertGreaterEqual(len(data["cells"]), 1)
        self.assertGreaterEqual(data["stats"]["plantedTotal"], len(data["cells"]))

    def test_garden_action_persists_shared_state_across_requests(self):
        create_response = self.client.post(
            "/garden/actions",
            json={
                "tool": "plant",
                "x": 40,
                "y": 40,
                "species": "daisy",
            },
        )
        state_response = self.client.get("/garden/state")

        self.assertEqual(create_response.status_code, 200)
        self.assertEqual(state_response.status_code, 200)

        state_data = state_response.get_json()
        planted_cell = next(
            (
                cell
                for cell in state_data["cells"]
                if cell["x"] == 40 and cell["y"] == 40
            ),
            None,
        )

        self.assertIsNotNone(planted_cell)
        self.assertEqual(planted_cell["author"], "visitor")

    def test_snapshot_catches_up_once_for_large_idle_gap(self):
        db_proxy.connect(reuse_if_open=True)
        try:
            start = datetime(2026, 4, 19, 12, 0, tzinfo=UTC)
            end = start + timedelta(days=2)

            initial = get_garden_snapshot(now_utc=start)
            caught_up = get_garden_snapshot(now_utc=end)
            repeated = get_garden_snapshot(now_utc=end)
        finally:
            db_proxy.close()

        self.assertEqual(caught_up["serverNow"], "2026-04-21T12:00:00Z")
        self.assertEqual(repeated["serverNow"], caught_up["serverNow"])
        self.assertEqual(repeated["version"], caught_up["version"])
        self.assertGreaterEqual(caught_up["version"], initial["version"])

    def test_snapshot_environment_is_derived_from_utc_time(self):
        db_proxy.connect(reuse_if_open=True)
        try:
            winter_night = get_garden_snapshot(
                now_utc=datetime(2026, 1, 15, 2, 0, tzinfo=UTC)
            )
            summer_day = get_garden_snapshot(
                now_utc=datetime(2026, 7, 15, 12, 0, tzinfo=UTC)
            )
        finally:
            db_proxy.close()

        self.assertEqual(winter_night["environment"]["season"], "winter")
        self.assertEqual(winter_night["environment"]["time"], "night")
        self.assertEqual(summer_day["environment"]["season"], "summer")
        self.assertEqual(summer_day["environment"]["time"], "day")
        self.assertRegex(winter_night["serverNow"], r"Z$")
        self.assertRegex(summer_day["serverNow"], r"Z$")

    def test_direct_action_returns_shared_author_label(self):
        db_proxy.connect(reuse_if_open=True)
        try:
            snapshot = apply_garden_action(
                tool="plant",
                x=55,
                y=-13,
                species="fern",
                now_utc=datetime(2026, 4, 19, 12, 0, tzinfo=UTC),
            )
        finally:
            db_proxy.close()

        planted_cell = next(
            (
                cell
                for cell in snapshot["cells"]
                if cell["x"] == 55 and cell["y"] == -13
            ),
            None,
        )

        self.assertIsNotNone(planted_cell)
        self.assertEqual(planted_cell["author"], "visitor")

    def test_garden_state_returns_503_on_conflict(self):
        with patch(
            "app.routes.get_garden_snapshot",
            side_effect=GardenConflictError("garden is busy; try again in a moment"),
        ):
            response = self.client.get("/garden/state")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.get_json()["error"],
            "garden is busy; try again in a moment",
        )

    def test_garden_action_returns_503_on_conflict(self):
        with patch(
            "app.routes.apply_garden_action",
            side_effect=GardenConflictError(
                "garden is busy; your action was not applied; try again in a moment"
            ),
        ):
            response = self.client.post(
                "/garden/actions",
                json={
                    "tool": "plant",
                    "x": 1,
                    "y": 2,
                    "species": "daisy",
                },
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.get_json()["error"],
            "garden is busy; your action was not applied; try again in a moment",
        )


if __name__ == "__main__":
    unittest.main()
