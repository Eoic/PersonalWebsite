# Bookshelf Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bookshelf page with a compact cover grid, hover-based detail panel, client-side search, and external book links.

**Architecture:** Add `url` field to the Book model. Update the route to query books. Build a Mako template with a CSS grid of covers and a sticky detail panel. Add vanilla JS/TS for hover-to-detail and search filtering. On mobile, hide the detail panel and let taps open the external URL directly.

**Tech Stack:** Flask, Peewee, Mako, SCSS, TypeScript, Vite

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/models.py` | Modify | Add `url` field to Book |
| `app/routes.py` | Modify | Query books and pass to template |
| `app/templates/pages/bookshelf.html` | Modify | Page template with grid + detail panel + search |
| `src/scss/main.scss` | Modify | Bookshelf grid and detail panel styles |
| `src/ts/main.ts` | Modify | Hover-to-detail and search filtering |
| `assets/images/books/` | Create | Directory for cover images |

---

### Task 1: Add `url` field to Book model

**Files:**
- Modify: `app/models.py:124-128`

- [ ] **Step 1: Add url field to Book model**

In `app/models.py`, add `url` to the Book class:

```python
class Book(BaseModel):
    id = AutoField()
    title = CharField()
    author = CharField()
    cover = CharField()
    url = CharField(null=True)
```

- [ ] **Step 2: Create the cover images directory**

```bash
mkdir -p assets/images/books
```

- [ ] **Step 3: Verify the schema update applies**

```bash
uv run python -c "from app import create_app; create_app(); print('OK')"
```

Expected: `OK` (Peewee's `create_tables` with `safe=True` in `init_db` will add the table columns on startup).

Note: Peewee's `create_table(safe=True)` only creates tables that don't exist — it does NOT add new columns to existing tables. The `url` column must be added manually:

```bash
uv run python -c "
from app.db import init_db, db_proxy
init_db()
db_proxy.execute_sql('ALTER TABLE book ADD COLUMN url VARCHAR(255) NULL')
print('Column added')
"
```

If the column already exists, this will raise an error — that's fine, it means it was already applied.

- [ ] **Step 4: Commit**

```bash
git add app/models.py
git commit -m "feat(bookshelf): add url field to Book model"
```

---

### Task 2: Update bookshelf route to query books

**Files:**
- Modify: `app/routes.py:484-494`

- [ ] **Step 1: Update the bookshelf route**

In `app/routes.py`, update the `bookshelf()` function. Add the `Book` import to the existing imports at the top of the file (alongside the other model imports), then change the route:

```python
@bp.route("/bookshelf")
def bookshelf():
    """Render the bookshelf page."""
    ctx = get_common_context("bookshelf")
    books = list(Book.select().order_by(Book.title))

    ctx.update(
        page_intro=_PAGE_INTROS["bookshelf"],
        books=books,
    )

    return render_mako("pages/bookshelf.html", **ctx)
```

- [ ] **Step 2: Verify the route loads**

```bash
uv run python -c "
from app import create_app
app = create_app()
client = app.test_client()
resp = client.get('/bookshelf')
print(resp.status_code)
"
```

Expected: `200`

- [ ] **Step 3: Commit**

```bash
git add app/routes.py
git commit -m "feat(bookshelf): query books from database in route"
```

---

### Task 3: Build the bookshelf template

**Files:**
- Modify: `app/templates/pages/bookshelf.html`

- [ ] **Step 1: Rewrite the bookshelf template**

Replace the entire contents of `app/templates/pages/bookshelf.html`:

```mako
<%inherit file="../partials/layout.html" />

<div class="bookshelf">
    <input
        type="text"
        class="bookshelf-search"
        placeholder="filter by title or author"
        aria-label="Filter books by title or author"
    >

    % if books:
        <div class="bookshelf-body">
            <div class="bookshelf-grid">
                % for book in books:
                    % if book.url:
                        <a
                            href="${book.url}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="bookshelf-item"
                            data-title="${book.title}"
                            data-author="${book.author}"
                        >
                            <img
                                src="/assets/images/books/${book.cover}"
                                alt="${book.title} by ${book.author}"
                                loading="lazy"
                            >
                        </a>
                    % else:
                        <div
                            class="bookshelf-item"
                            data-title="${book.title}"
                            data-author="${book.author}"
                        >
                            <img
                                src="/assets/images/books/${book.cover}"
                                alt="${book.title} by ${book.author}"
                                loading="lazy"
                            >
                        </div>
                    % endif
                % endfor
            </div>

            <aside class="bookshelf-detail" aria-live="polite">
                <p class="bookshelf-detail-title"></p>
                <p class="bookshelf-detail-author"></p>
            </aside>
        </div>
    % else:
        <p>Nothing here yet.</p>
    % endif
</div>
```

- [ ] **Step 2: Verify the template renders**

Start the dev server and visit `/bookshelf` in the browser. It should render the search bar and either the grid (if books exist) or "Nothing here yet."

- [ ] **Step 3: Commit**

```bash
git add app/templates/pages/bookshelf.html
git commit -m "feat(bookshelf): build grid template with detail panel and search"
```

---

### Task 4: Add bookshelf styles

**Files:**
- Modify: `src/scss/main.scss`

- [ ] **Step 1: Add bookshelf SCSS**

Append the following styles at the end of `src/scss/main.scss` (before any final closing brace, after the `.actions` block around line 504):

```scss
.bookshelf {
  max-width: 46rem;
}

.bookshelf-search {
  display: block;
  width: 100%;
  max-width: 30ch;
  margin-bottom: 1.5rem;
  padding: 0.5em;
  border: 1px solid var(--color-border);
  border-radius: 0;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.bookshelf-body {
  display: grid;
  grid-template-columns: 1fr 14rem;
  gap: 2rem;
  align-items: start;
}

.bookshelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.75rem;
}

.bookshelf-item {
  display: block;
  text-decoration: none;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  opacity: 0.85;
  transition: opacity 0.15s ease;
}

.bookshelf-item:hover {
  opacity: 1;
}

.bookshelf-item::after {
  display: none;
}

.bookshelf-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bookshelf-detail {
  position: sticky;
  top: 2rem;
  min-height: 4rem;
}

.bookshelf-detail-title {
  margin-bottom: 0.25rem;
  font-weight: 600;
  line-height: 1.4;
}

.bookshelf-detail-author {
  color: var(--color-muted);
  margin-bottom: 0;
}

.bookshelf-item[hidden] {
  display: none;
}

@media (max-width: 42rem) {
  .bookshelf-body {
    grid-template-columns: 1fr;
  }

  .bookshelf-detail {
    display: none;
  }

  .bookshelf-grid {
    grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
  }

  .bookshelf-item {
    opacity: 1;
  }
}
```

- [ ] **Step 2: Verify styles compile and render**

The Vite dev server should hot-reload. Check `/bookshelf` in the browser — the grid and detail panel layout should be visible.

- [ ] **Step 3: Commit**

```bash
git add src/scss/main.scss
git commit -m "feat(bookshelf): add grid and detail panel styles"
```

---

### Task 5: Add hover-to-detail and search JS

**Files:**
- Modify: `src/ts/main.ts`

- [ ] **Step 1: Add bookshelf interactivity**

Add two functions and their initialization to `src/ts/main.ts`. Add the functions before the `DOMContentLoaded` listener, and the init calls inside it.

Add these functions after `computeEntryTimespans()` (after line 80):

```typescript
function initBookshelfDetail(): void {
  const grid = document.querySelector<HTMLElement>(".bookshelf-grid");
  const titleEl = document.querySelector<HTMLElement>(".bookshelf-detail-title");
  const authorEl = document.querySelector<HTMLElement>(".bookshelf-detail-author");

  if (!grid || !titleEl || !authorEl) return;

  grid.addEventListener("mouseover", (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(".bookshelf-item");

    if (!item) return;

    titleEl.textContent = item.dataset.title ?? "";
    authorEl.textContent = item.dataset.author ?? "";
  });

  grid.addEventListener("mouseleave", () => {
    titleEl.textContent = "";
    authorEl.textContent = "";
  });
}

function initBookshelfSearch(): void {
  const input = document.querySelector<HTMLInputElement>(".bookshelf-search");
  const grid = document.querySelector<HTMLElement>(".bookshelf-grid");

  if (!input || !grid) return;

  const items = grid.querySelectorAll<HTMLElement>(".bookshelf-item");

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase().trim();

    items.forEach((item) => {
      const title = (item.dataset.title ?? "").toLowerCase();
      const author = (item.dataset.author ?? "").toLowerCase();
      const match = !query || title.includes(query) || author.includes(query);

      item.hidden = !match;
    });
  });
}
```

Then inside the `DOMContentLoaded` callback (after `computeEntryTimespans();` on line 89), add:

```typescript
  initBookshelfDetail();
  initBookshelfSearch();
```

- [ ] **Step 2: Verify interactions work**

In the browser at `/bookshelf`:
1. Hover over a book cover — the detail panel should show title and author
2. Move mouse away — detail panel should clear
3. Type in the search bar — books that don't match should hide

- [ ] **Step 3: Commit**

```bash
git add src/ts/main.ts
git commit -m "feat(bookshelf): add hover detail and search filtering"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1: Add a test book via Flask-Admin**

Navigate to `/admin/book/new/` and create a book with:
- Title: "Fluent Python"
- Author: "Luciano Ramalho"
- Cover: a placeholder filename (e.g. `fluent-python.webp`)
- URL: the OpenLibrary link for the book

Place a test cover image at `assets/images/books/fluent-python.webp` (any small webp image will do for testing).

- [ ] **Step 2: Verify the full flow**

1. Visit `/bookshelf` — the book cover should appear in the grid
2. Hover the cover — detail panel shows "Fluent Python" / "Luciano Ramalho"
3. Click the cover — opens the external URL in a new tab
4. Type "fluent" in the search bar — the book remains visible
5. Type "nonexistent" — the book hides
6. Resize to mobile width — detail panel disappears, tap goes to URL

- [ ] **Step 3: Final commit with all files**

If any small adjustments were needed, commit them:

```bash
git add -A
git commit -m "feat(bookshelf): complete bookshelf page implementation"
```
