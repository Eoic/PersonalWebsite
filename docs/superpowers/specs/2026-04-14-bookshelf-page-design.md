# Bookshelf Page Design

## Overview

Redesign the bookshelf page to display a compact grid of self-hosted book covers with a hover-based detail panel and client-side search.

## Model Changes

**Book model** (`app/models.py`):
- Add `url` field: `CharField(null=True)` — external link (e.g. OpenLibrary page), manually managed
- Keep existing fields: `id`, `title`, `author`, `cover` (filename in `assets/images/books/`)

**Cover images** stored at `assets/images/books/<filename>.webp`.

## Page Layout

### Desktop

```
+------------------------------------------+
| [Search: filter by title or author     ] |
+------------------------------------------+
|                              |           |
|  [cover] [cover] [cover]    |  Title    |
|  [cover] [cover] [cover]    |  Author   |
|  [cover] [cover] [cover]    |           |
|  [cover] [cover] ...        |           |
|                              |           |
+------------------------------------------+
```

- **Left**: CSS grid of cover images (~100-120px wide, 2:3 aspect ratio)
- **Right**: fixed detail panel that updates on hover with title + author. Empty state: muted placeholder text
- **Top**: search input spanning full width above the grid area

### Mobile

- Detail panel hidden entirely
- Grid fills available width
- Search bar above the grid
- Tapping a cover opens the external URL directly (no info display)

## Interactions

| Action | Desktop | Mobile |
|--------|---------|--------|
| Hover cover | Subtle highlight, detail panel shows title + author | N/A |
| Click/tap cover | Opens `book.url` in new tab | Opens `book.url` in new tab |
| Search input | Filters grid client-side by title and author | Same |

## Styling

- Follows existing monospace/minimal aesthetic (IBM Plex Mono, CSS custom properties)
- No borders or cards around covers — images in a tight grid with small gaps
- Detail panel: muted text, consistent typography
- Covers without a URL: rendered as plain `<img>` (no wrapping `<a>`), cursor stays default
- Search input: minimal, matches existing `.btn` border style (no border-radius)

## Files to Create/Modify

| File | Action |
|------|--------|
| `app/models.py` | Add `url` field to Book model |
| `app/routes.py` | Update bookshelf route to query books from DB |
| `app/templates/pages/bookshelf.html` | Rewrite template with grid + detail panel |
| `app/templates/partials/bookshelf_entries.html` | New partial for book grid rendering |
| `src/scss/main.scss` | Add bookshelf grid and detail panel styles |
| `src/ts/main.ts` | Add hover-to-detail and client-side search logic |
| `assets/images/books/` | Directory for self-hosted cover images |
| `app/admin.py` | Already registered — no changes needed |

## Data Flow

1. Route queries `Book.select().order_by(Book.title)` and passes to template
2. Template renders covers as `<a>` tags (with `href=book.url`, `target=_blank`) inside grid
3. Each cover element carries `data-title` and `data-author` attributes
4. JS reads data attributes on hover to update the detail panel
5. JS search filters by matching input text against data attributes, toggling `display` on grid items
