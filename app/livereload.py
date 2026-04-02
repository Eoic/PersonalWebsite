"""SSE-based live reload for development.

Watches ``app/templates/`` and ``assets/`` for file changes and pushes
``reload`` events to connected browsers via Server-Sent Events.

Only active when the Flask app is running in debug mode.
"""

import os
import queue
import threading
import time

from flask import Response
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_RELOAD_EVENT_TYPES = {"created", "modified", "deleted", "moved"}

# All connected SSE clients receive events through these queues.
_clients: list[queue.Queue] = []
_clients_lock = threading.Lock()


class _ReloadHandler(FileSystemEventHandler):
    """Debounced file-change handler that notifies SSE clients."""

    def __init__(self, delay: float = 0.25):
        super().__init__()
        self._delay = delay
        self._timer: threading.Timer | None = None
        self._lock = threading.Lock()

    def _notify(self):
        with _clients_lock:
            for q in _clients:
                q.put("reload")

    def on_any_event(self, event):
        if event.is_directory:
            return
        if event.event_type not in _RELOAD_EVENT_TYPES:
            return

        with self._lock:
            if self._timer is not None:
                self._timer.cancel()
            self._timer = threading.Timer(self._delay, self._notify)
            self._timer.daemon = True
            self._timer.start()


def _sse_stream():
    """Generator that yields SSE formatted events."""
    q: queue.Queue = queue.Queue()
    with _clients_lock:
        _clients.append(q)
    try:
        while True:
            try:
                event = q.get(timeout=30)
                yield f"event: {event}\ndata: {{}}\n\n"
            except queue.Empty:
                # Send a keep-alive comment to prevent connection timeout.
                yield ": keepalive\n\n"
    except GeneratorExit:
        pass
    finally:
        with _clients_lock:
            _clients.remove(q)


def init_app(app):
    """Register the SSE endpoint and start the file watcher.

    This is a no-op when ``app.debug`` is ``False``.
    """
    if not app.debug:
        return

    @app.route("/dev/events")
    def _dev_sse():
        return Response(
            _sse_stream(),
            content_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    observer = Observer()
    handler = _ReloadHandler()

    watch_dirs = [
        os.path.join(_project_root, "app", "templates"),
        os.path.join(_project_root, "assets"),
    ]

    for directory in watch_dirs:
        if os.path.isdir(directory):
            observer.schedule(handler, directory, recursive=True)

    observer.daemon = True
    observer.start()

    app.logger.info("Live reload active — watching templates and assets")
