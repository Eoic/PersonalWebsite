# SSR Overhaul Design

## Context

The personal website at karolis-strazdas.lt is currently a static site built with a hybrid Python (Mako templates) + Node.js pipeline. Python dicts define content data, Mako compiles HTML to files, and Node.js handles watching, minification, and serving. Deployment targets Vercel.

This overhaul replaces the static build with server-side rendering via Flask, moves all content data into SQLite via Peewee, drops Vercel, and prepares the architecture for a future Posts/microblog section. Deployment target is Hetzner Cloud VPS with Apache2 as reverse proxy.

## Stack

- **Framework:** Flask (with Mako templates via manual TemplateLookup integration)
- **ORM:** Peewee with SQLite
- **WSGI server:** Gunicorn
- **Reverse proxy:** Apache2 (with mod_proxy)
- **Asset minification:** Python-based (rcssmin, rjsmin)
- **Dev live-reload:** Flask debug mode + custom SSE endpoint for browser reload on template/asset changes

## Project Structure

```
PersonalWebsite/
├── app/
│   ├── __init__.py          # Flask app factory (create_app)
│   ├── routes.py            # Route handlers
│   ├── models.py            # Peewee models
│   ├── db.py                # Database connection, initialization
│   ├── context.py           # Template context helpers (common data, build info)
│   ├── seed.py              # CLI: populate DB from existing content
│   ├── build_assets.py      # CLI: minify CSS/JS for production
│   └── templates/           # Mako templates (moved from htmlgen/templates/)
│       ├── pages/
│       │   ├── index.html
│       │   ├── positions.html
│       │   ├── education.html
│       │   └── projects.html
│       └── partials/
│           ├── layout.html
│           ├── header.html
│           ├── navigation.html
│           └── section.html
├── assets/                  # Static files served by Flask (dev) / Apache (prod)
│   ├── css/
│   │   └── main.css
│   ├── js/
│   │   └── main.js
│   └── images/
│       ├── favicon/
│       ├── icons/
│       ├── projects/
│       └── avatar.webp
├── data/
│   └── site.db              # SQLite database (gitignored)
├── pyproject.toml           # All Python dependencies
├── uv.lock
├── wsgi.py                  # Gunicorn entry: from app import create_app; app = create_app()
├── Makefile                 # dev, seed, build, serve commands
├── robots.txt               # Moved from assets/ to root (served by Flask route)
├── sitemap.xml              # Moved from assets/ to root (served by Flask route)
└── .gitignore
```

### Removed files

- `scripts/` (build-watch.js, build-prod.js, compile-html.js)
- `build/` directory
- `htmlgen/` (replaced by app/)
- `vercel.json`
- `package.json`, `package-lock.json`
- `node_modules/`
- `.prettierrc.json`, `.prettierignore` (no more JS toolchain)
- `assets/js/dev.js` (replaced by Flask-based live reload)

## Data Models

### Page

Stores page metadata and navigation info. Replaces hardcoded `navigation` list from `common.py`.

| Field       | Type    | Notes                          |
|-------------|---------|--------------------------------|
| id          | AutoField | PK                           |
| slug        | CharField | Unique. e.g., "index", "positions" |
| title       | CharField | Display title                 |
| description | TextField | SEO meta description          |
| url         | CharField | URL path, e.g., "/" or "/positions" |
| sort_order  | IntegerField | Navigation ordering        |

### Position

| Field          | Type         | Notes                    |
|----------------|--------------|--------------------------|
| id             | AutoField    | PK                       |
| title          | CharField    | e.g., "Programmer"       |
| company        | CharField    | e.g., "Indeform Ltd."    |
| date_from      | DateField    |                          |
| date_until     | DateField    | Nullable (current job)   |
| description    | TextField    | HTML content             |
| sort_order     | IntegerField |                          |

### Education

| Field          | Type         | Notes                    |
|----------------|--------------|--------------------------|
| id             | AutoField    | PK                       |
| title          | CharField    | Degree name              |
| institution    | CharField    |                          |
| date_from      | DateField    |                          |
| date_until     | DateField    | Nullable                 |
| description    | TextField    | HTML content (nullable)  |
| sort_order     | IntegerField |                          |

### Project

| Field          | Type         | Notes                    |
|----------------|--------------|--------------------------|
| id             | AutoField    | PK                       |
| title          | CharField    |                          |
| subtitle       | CharField    |                          |
| title_link     | CharField    | Nullable (GitHub URL)    |
| description    | TextField    | HTML content             |
| sort_order     | IntegerField |                          |

### ProjectMedia

| Field      | Type         | Notes                        |
|------------|--------------|------------------------------|
| id         | AutoField    | PK                           |
| project    | ForeignKeyField | FK to Project             |
| media_type | CharField    | "image" (extensible)         |
| src        | CharField    | Path relative to assets/     |
| alt        | CharField    |                              |

### Tag

Shared tag table. Deduplicated across all entities.

| Field | Type      | Notes        |
|-------|-----------|--------------|
| id    | AutoField | PK           |
| name  | CharField | Unique       |

### PositionTag, EducationTag, ProjectTag

Standard many-to-many through tables with composite FK references.

### About (key-value)

The About/index page has varied content (reading list, learning topics, working-on projects). Rather than a rigid model, use a simple key-value store:

| Field | Type      | Notes                           |
|-------|-----------|---------------------------------|
| id    | AutoField | PK                              |
| key   | CharField | e.g., "reading_list", "content" |
| value | TextField | JSON-encoded content            |

### Future: Post (not created now, schema sketch)

| Field        | Type         | Notes                    |
|--------------|--------------|--------------------------|
| id           | AutoField    | PK                       |
| title        | CharField    |                          |
| slug         | CharField    | Unique, URL-friendly     |
| content      | TextField    | HTML or Markdown         |
| published_at | DateTimeField| Nullable                 |
| updated_at   | DateTimeField|                          |
| is_published | BooleanField | Default False            |

PostTag many-to-many through table.

## Flask Application

### App Factory (`app/__init__.py`)

```python
def create_app(config=None):
    app = Flask(__name__, static_folder='../assets', static_url_path='/assets')

    # Mako template lookup
    app.config['MAKO_TEMPLATE_DIR'] = os.path.join(app.root_path, 'templates')

    # Initialize database
    from .db import init_db
    init_db(app)

    # Register routes
    from .routes import register_routes
    register_routes(app)

    # Context processor for common data
    from .context import common_context
    app.context_processor(common_context)

    return app
```

### Mako Integration

Use `TemplateLookup` directly (same pattern as current `htmlgen/main.py`), wrapped in a helper function:

```python
def render_mako(template_name, **context):
    lookup = TemplateLookup(directories=[template_dir], input_encoding='utf-8')
    template = lookup.get_template(template_name)
    return template.render(**context)
```

### Routes (`app/routes.py`)

```python
@app.route('/')
def index():
    about_data = About.select()
    return render_mako('pages/index.html', **common, **about_context)

@app.route('/positions')
def positions():
    items = Position.select().order_by(Position.sort_order)
    # Prefetch tags via PositionTag join
    return render_mako('pages/positions.html', items=items, ...)

@app.route('/education')
def education():
    items = Education.select().order_by(Education.sort_order)
    return render_mako('pages/education.html', items=items, ...)

@app.route('/projects')
def projects():
    items = Project.select().order_by(Project.sort_order)
    # Prefetch media and tags
    return render_mako('pages/projects.html', items=items, ...)

@app.route('/robots.txt')
def robots():
    return send_file('robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_file('sitemap.xml')
```

### Common Context (`app/context.py`)

Replaces `htmlgen/context/common.py`. Provides data to every template render:

- `personal`: name, location (from config or DB)
- `position`: current job title/company
- `navigation`: from Page table, ordered by sort_order
- `build`: version (from pyproject.toml), current date/year
- `page`: current page slug (set per-route)

## Template Changes

Minimal changes required to existing Mako templates:

1. **layout.html**: Remove Vercel speed insights script, remove service worker unregistration script, update asset paths to use `/assets/` prefix
2. **All templates**: Data access stays the same (`${title}`, `%for item in items:`, etc.) — Peewee model instances support attribute access just like dict keys when we pass them as dicts or use `model_to_dict()`
3. **dev.js replacement**: In dev mode, inject a `<script>` tag with SSE live-reload client directly from Flask

## Asset Pipeline

### Development

- Flask serves `assets/` directory directly via `static_folder`
- `flask run --debug` auto-reloads on Python/template changes
- Custom SSE endpoint (`/dev/events`) for browser live-reload on CSS/JS/image changes
- File watcher (using `watchdog` Python package) monitors `assets/` and broadcasts reload events
- Single command: `make dev` runs Flask dev server with watcher

### Production

- `make build-assets` runs `app/build_assets.py`:
  - Minifies `assets/css/main.css` → `assets/css/main.min.css` using rcssmin
  - Minifies `assets/js/main.js` → `assets/js/main.min.js` using rjsmin
- Flask config toggle: `PRODUCTION=true` → templates reference `.min.css`/`.min.js`
- Apache2 serves `assets/` directly (no proxy needed for static files)

## Deployment Architecture

```
Internet → Apache2 (443/TLS via Let's Encrypt)
             ├── /assets/* → Alias to /path/to/assets/ (static, cached)
             └── /* → ProxyPass to Gunicorn (127.0.0.1:8000)

Gunicorn (2 workers, sync) → Flask app → SQLite (data/site.db)
```

- systemd service for Gunicorn with auto-restart
- Apache2 config: `mod_proxy`, `mod_proxy_http`, `mod_ssl`
- Static file caching headers: images 1 year, CSS/JS versioned via query string

## Dependencies

```toml
[project]
requires-python = ">=3.14"
dependencies = [
    "flask>=3.1",
    "mako>=1.3",
    "peewee>=3.17",
    "gunicorn>=23.0",
    "rcssmin>=1.1",
    "rjsmin>=1.2",
    "watchdog>=6.0",
]
```

## Migration / Seed Script

`app/seed.py` — a CLI command that:

1. Creates all tables via `db.create_tables([Page, Position, Education, ...])`
2. Reads the existing Python dict data from a frozen copy (or imports from `htmlgen/context/`)
3. Inserts rows into SQLite:
   - 4 Page records (index, positions, education, projects)
   - 2 Position records with their tags
   - 1 Education record with tags
   - 6 Project records with media and tags
   - About key-value pairs
4. Can be re-run safely (clears and re-seeds, or uses `get_or_create`)

Run via: `make seed` or `python -m app.seed`

## Dev Workflow Commands (Makefile)

```makefile
dev:          # Run Flask dev server with live reload
seed:         # Populate database from seed data
build-assets: # Minify CSS/JS for production
serve:        # Run Gunicorn production server
```

## Verification

1. `make seed` — populates the database, verify with `sqlite3 data/site.db ".tables"` and spot-check data
2. `make dev` — visit http://localhost:5000, verify all 4 pages render correctly
3. Compare rendered HTML with current `assets/*.html` — content should match
4. Edit a template or CSS file → verify browser auto-reloads
5. `make build-assets` — verify minified files are created
6. Test clean URLs: `/`, `/positions`, `/education`, `/projects`
7. Verify static assets load: CSS, JS, images, favicons
