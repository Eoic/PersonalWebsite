"""Build frontend assets with Vite.

Usage:
    uv run python -m app.build_assets
"""

import shutil
import subprocess
import sys
from pathlib import Path

_project_root = Path(__file__).resolve().parent.parent
_scripts = ("build:debug", "build")


def build():
    """Build debug and production assets with npm."""
    npm_bin = shutil.which("npm")

    if not npm_bin:
        raise RuntimeError("npm is required to build frontend assets.")

    for script_name in _scripts:
        print(f"Running npm script: {script_name}", flush=True)
        subprocess.run(
            [npm_bin, "run", script_name],
            check=True,
            cwd=_project_root,
        )


if __name__ == "__main__":
    try:
        build()
    except subprocess.CalledProcessError as exc:
        sys.exit(exc.returncode)
