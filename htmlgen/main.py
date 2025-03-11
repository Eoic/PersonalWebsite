import os
import sys
from io import StringIO
from mako.lookup import TemplateLookup
from mako.runtime import Context
from context import context_data

common_context = {
    "navigation": [
        {"id": "index", "title": "About"},
        {"id": "positions", "title": "Positions"},
        {"id": "education", "title": "Education"},
        {"id": "projects", "title": "Projects"},
    ],
}

if __name__ == "__main__":
    try:
        out_dir = sys.argv[1]
    except IndexError:
        print(
            "Please specify the output directory, for example: 'python main.py out/'.",
            file=sys.stderr,
        )
        sys.exit(1)

    if not os.path.isdir(out_dir):
        print(f"Specified output directory does not exist: {os.path.abspath(out_dir)}.")
        sys.exit(1)

    lookup = TemplateLookup(directories=["templates"], input_encoding="utf-8")

    for nav_item in common_context["navigation"]:
        buffer = StringIO()
        page = nav_item["id"]
        template = lookup.get_template(f"pages/{page}.html")
        template.render_context(Context(buffer, **common_context, **context_data[page]))

        with open(os.path.join(out_dir, f"{page}.html"), "w") as page_html:
            page_html.write(buffer.getvalue())

        buffer.close()
