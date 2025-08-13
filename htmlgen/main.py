import os
import sys
from io import StringIO
from mako.lookup import TemplateLookup
from mako.runtime import Context
from .context import context_data


def main():
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

    compiled = []
    lookup = TemplateLookup(directories=["htmlgen/templates"], input_encoding="utf-8")

    for nav_item in context_data["common"]["navigation"]:
        buffer = StringIO()
        page = nav_item["id"]
        template = lookup.get_template(f"pages/{page}.html")

        try:
            template.render_context(
                Context(
                    buffer,
                    **{
                        **context_data["common"],
                        **context_data[page],
                    }
                )
            )
        except KeyError:
            print('Could not find context for page "{page}".')
            sys.exit(1)

        with open(os.path.join(out_dir, f"{page}.html"), "w") as page_html:
            page_html.write(buffer.getvalue())

        compiled.append(os.path.join(out_dir, f"{page}.html"))
        buffer.close()

    print(
        f"Successfully compiled {len(compiled)} page{'s' if len(compiled) != 1 else ''}:"
    )

    for page in compiled:
        print(f"  - {os.path.abspath(page)}")


if __name__ == "__main__":
    main()
