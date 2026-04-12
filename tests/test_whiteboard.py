import json
import tempfile
import unittest
from unittest.mock import patch

from app import create_app
from app import limiter
from app.db import db_proxy
from app.models import Page, User, WhiteboardStroke


def _fake_config_loader(database_path):
    def loader(self, filename, load, text=False, silent=False):
        self.update(
            SECRET_KEY="test-secret",
            DATABASE_PATH=database_path,
        )
        return True

    return loader


class WhiteboardRoutesTestCase(unittest.TestCase):
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
            slug="whiteboard",
            title="Whiteboard",
            description="Shared board",
            url="/whiteboard",
            sort_order=0,
        )
        db_proxy.close()

    def tearDown(self):
        if not db_proxy.is_closed():
            db_proxy.close()

        self.temp_dir.cleanup()

    def _create_stroke(self, **overrides):
        payload = {
            "board_slug": "main",
            "client_session_id": "session-abcdef12",
            "tool": "draw",
            "color": "#112233",
            "brush_size": 4,
            "points_json": json.dumps([{"x": 0, "y": 0}, {"x": 12, "y": 8}]),
        }
        payload.update(overrides)

        db_proxy.connect(reuse_if_open=True)
        stroke = WhiteboardStroke.create(**payload)
        db_proxy.close()
        return stroke

    def _login_test_user(self):
        db_proxy.connect(reuse_if_open=True)
        user = User.create(username="admin", password="irrelevant")
        db_proxy.close()

        with self.client.session_transaction() as flask_session:
            flask_session["_user_id"] = str(user.id)
            flask_session["_fresh"] = True

        return user

    def test_whiteboard_page_renders_with_dedicated_script(self):
        response = self.client.get("/whiteboard")

        self.assertEqual(response.status_code, 200)
        self.assertIn("/assets/js/whiteboard.min.js", response.get_data(as_text=True))

    def test_get_whiteboard_strokes_returns_ordered_rows(self):
        first_stroke = self._create_stroke(
            color="#111111",
            points_json=json.dumps([{"x": 0, "y": 0}]),
        )
        second_stroke = self._create_stroke(
            color="#222222",
            points_json=json.dumps([{"x": 20, "y": 10}]),
        )

        response = self.client.get("/whiteboard/strokes")
        data = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in data["strokes"]], [first_stroke.id, second_stroke.id])
        self.assertEqual(data["strokes"][0]["brushSize"], 4)
        self.assertEqual(data["strokes"][1]["points"], [{"x": 20, "y": 10}])

    def test_post_whiteboard_stroke_persists_valid_payload(self):
        response = self.client.post(
            "/whiteboard/strokes",
            json={
                "clientSessionId": "session-abcdef12",
                "tool": "draw",
                "color": "#abcdef",
                "brushSize": 8,
                "points": [{"x": 1, "y": 2}, {"x": 5, "y": 6}],
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertIsInstance(response.get_json()["id"], int)

        db_proxy.connect(reuse_if_open=True)
        stored_stroke = WhiteboardStroke.get()
        db_proxy.close()

        self.assertEqual(stored_stroke.board_slug, "main")
        self.assertEqual(stored_stroke.client_session_id, "session-abcdef12")
        self.assertEqual(json.loads(stored_stroke.points_json), [{"x": 1.0, "y": 2.0}, {"x": 5.0, "y": 6.0}])

    def test_post_whiteboard_stroke_rejects_invalid_payload(self):
        response = self.client.post(
            "/whiteboard/strokes",
            json={
                "clientSessionId": "bad",
                "tool": "draw",
                "color": "red",
                "brushSize": 4,
                "points": [],
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("clientSessionId", response.get_json()["error"])

    def test_delete_whiteboard_stroke_requires_matching_session(self):
        stroke = self._create_stroke(client_session_id="session-erasable1")

        forbidden_response = self.client.delete(
            f"/whiteboard/strokes/{stroke.id}",
            json={"clientSessionId": "session-other001"},
        )
        self.assertEqual(forbidden_response.status_code, 403)

        allowed_response = self.client.delete(
            f"/whiteboard/strokes/{stroke.id}",
            json={"clientSessionId": "session-erasable1"},
        )
        self.assertEqual(allowed_response.status_code, 204)

        db_proxy.connect(reuse_if_open=True)
        remaining = WhiteboardStroke.select().count()
        db_proxy.close()

        self.assertEqual(remaining, 0)

    def test_authenticated_user_can_delete_any_stroke(self):
        stroke = self._create_stroke(client_session_id="session-someoneelse")
        self._login_test_user()

        response = self.client.delete(
            f"/whiteboard/strokes/{stroke.id}",
            json={"clientSessionId": "session-admin999"},
        )

        self.assertEqual(response.status_code, 204)

        db_proxy.connect(reuse_if_open=True)
        remaining = WhiteboardStroke.select().count()
        db_proxy.close()

        self.assertEqual(remaining, 0)

    def test_authenticated_user_can_clear_whiteboard(self):
        self._create_stroke(client_session_id="session-aaaabbbb")
        self._create_stroke(client_session_id="session-ccccdddd")
        self._login_test_user()

        response = self.client.delete("/whiteboard/strokes")

        self.assertEqual(response.status_code, 204)

        db_proxy.connect(reuse_if_open=True)
        remaining = WhiteboardStroke.select().count()
        db_proxy.close()

        self.assertEqual(remaining, 0)

    def test_clear_whiteboard_requires_login(self):
        self._create_stroke()

        response = self.client.delete("/whiteboard/strokes")

        self.assertEqual(response.status_code, 403)

    def test_post_whiteboard_strokes_is_rate_limited(self):
        self.app.config["RATELIMIT_ENABLED"] = True

        for _ in range(60):
            response = self.client.post(
                "/whiteboard/strokes",
                json={
                    "clientSessionId": "session-rate123",
                    "tool": "draw",
                    "color": "#123456",
                    "brushSize": 4,
                    "points": [{"x": 0, "y": 0}, {"x": 2, "y": 2}],
                },
            )
            self.assertEqual(response.status_code, 201)

        limited_response = self.client.post(
            "/whiteboard/strokes",
            json={
                "clientSessionId": "session-rate123",
                "tool": "draw",
                "color": "#123456",
                "brushSize": 4,
                "points": [{"x": 0, "y": 0}, {"x": 2, "y": 2}],
            },
        )

        self.assertEqual(limited_response.status_code, 429)


if __name__ == "__main__":
    unittest.main()
