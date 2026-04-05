"""Minify CSS and JS assets.

Usage:
    python -m app.build_assets
"""

import os

import rcssmin
import rjsmin

_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_assets_dir = os.path.join(_project_root, "assets")

_FILES = [
    {
        "input": os.path.join(_assets_dir, "css", "main.css"),
        "output": os.path.join(_assets_dir, "css", "main.min.css"),
        "minifier": rcssmin.cssmin,
    },
    {
        "input": os.path.join(_assets_dir, "js", "main.js"),
        "output": os.path.join(_assets_dir, "js", "main.min.js"),
        "minifier": rjsmin.jsmin,
    },
]


def build():
    """Minify all configured asset files."""
    for entry in _FILES:
        with open(entry["input"], "r", encoding="utf-8") as file:
            source = file.read()

        minified = entry["minifier"](source)

        with open(entry["output"], "w", encoding="utf-8") as file:
            file.write(minified)

        src_size = len(source.encode("utf-8"))
        out_size = len(minified.encode("utf-8"))
        ratio = (1 - out_size / src_size) * 100 if src_size else 0
        rel_in = os.path.relpath(entry["input"], _project_root)
        rel_out = os.path.relpath(entry["output"], _project_root)

        print(
            f"{rel_in} ({src_size:,}B) -> {rel_out} ({out_size:,}B) [{ratio:.1f}% reduction]"
        )


if __name__ == "__main__":
    build()
