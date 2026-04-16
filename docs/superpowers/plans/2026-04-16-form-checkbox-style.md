# Form-scoped checkbox style — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a checkbox style scoped to the `form` block in `src/scss/main.scss` that matches the site's square, inverted-fill aesthetic and works with both light and dark themes.

**Architecture:** A single SCSS edit extends the existing `form { ... }` block. Native checkbox rendering is suppressed via `appearance: none`; a 1em square with 1px border is drawn instead. Checked state inverts to `--color-text` background (mirroring `.whiteboard-tool.is-active`). Layout for the wrapping label uses `:has()` to flip from block to inline-flex so the label sits next to the box. No template, markup, or JS changes are required for the style itself.

**Tech Stack:** SCSS compiled by Dart Sass (`npm run build:css:debug` for non-minified, `npm run build:css` for minified). Flask + Mako templates serve the result. Verification is visual in a real browser — there is no CSS test framework in this repo.

**Spec:** `docs/superpowers/specs/2026-04-16-form-checkbox-style-design.md`

---

### Task 1: Add the checkbox style to the form block

**Files:**
- Modify: `src/scss/main.scss` (the existing `form { ... }` block, currently around lines 501–529)

- [ ] **Step 1: Add a temporary visual harness so you can see the checkbox in the browser**

There is no checkbox in any existing template. Add one temporarily to `app/templates/pages/login.html` (which is publicly accessible at `/login`) so you can verify each state.

Edit `app/templates/pages/login.html` between line 14 (`${form.password.label} ${form.password}`) and line 16 (`<button class="btn" type="submit"> Login </button>`):

```html
    ${form.csrf_token}
    ${form.username.label} ${form.username}
    ${form.password.label} ${form.password}

    <label><input type="checkbox" name="remember"> Remember me</label>
    <label><input type="checkbox" name="remember-checked" checked> Pre-checked</label>
    <label><input type="checkbox" name="remember-disabled" disabled> Disabled</label>
    <label><input type="checkbox" name="remember-disabled-checked" disabled checked> Disabled, checked</label>

    <button class="btn" type="submit"> Login </button>
```

Do NOT commit this harness — it gets reverted in Task 2.

- [ ] **Step 2: Build CSS and start the dev server, then confirm checkboxes look unstyled**

In one terminal:

```bash
npm run build:css:debug
```

In another terminal:

```bash
make dev
```

Open `http://localhost:5000/login` in a browser. You should see four browser-default checkboxes — rounded corners, native look, label stacked above the box (because the existing `form { label, input { display: block } }` rule applies). Note this baseline so you can recognize the change after the next step.

Expected: native-looking checkboxes that obviously do NOT match the site aesthetic. This is the "test fails" state.

- [ ] **Step 3: Add the SCSS rule inside the existing `form` block**

Open `src/scss/main.scss`. The current `form` block (around lines 501–529) ends with a `button[type="submit"]` rule. Add the new rules INSIDE the same `form` block, AFTER the generic `input, textarea` rule (so the `input[type="checkbox"]` selector overrides `width: 100%`, `max-width: 30ch`, `padding`, and `margin-bottom` from the generic rule).

Replace the existing block:

```scss
form {
  label,
  input {
    display: block;
  }

  input,
  textarea {
    margin-bottom: 1em;
    padding: 0.5em;
    display: block;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    border-radius: 0;
    width: 100%;
    max-width: 30ch;
    color: var(--color-text);
  }

  textarea {
    width: 100%;
    min-width: 30ch;
    max-width: 100ch;
  }

  button[type="submit"] {
    margin-top: 0.5em;
  }
}
```

With:

```scss
form {
  label,
  input {
    display: block;
  }

  input,
  textarea {
    margin-bottom: 1em;
    padding: 0.5em;
    display: block;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    border-radius: 0;
    width: 100%;
    max-width: 30ch;
    color: var(--color-text);
  }

  textarea {
    width: 100%;
    min-width: 30ch;
    max-width: 100ch;
  }

  input[type="checkbox"] {
    -webkit-appearance: none;
    appearance: none;
    display: inline-block;
    width: 1em;
    height: 1em;
    margin: 0;
    padding: 0;
    max-width: none;
    vertical-align: middle;
    cursor: pointer;
  }

  input[type="checkbox"]:hover:not(:checked):not(:disabled) {
    background: var(--color-surface-muted);
  }

  input[type="checkbox"]:checked {
    background: var(--color-text);
  }

  input[type="checkbox"]:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }

  input[type="checkbox"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  label:has(> input[type="checkbox"]) {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    margin-bottom: 1em;
    cursor: pointer;
  }

  button[type="submit"] {
    margin-top: 0.5em;
  }
}
```

Notes on what each rule does (do NOT add these as comments to the SCSS file):
- `input[type="checkbox"]` is the base box style. It must come AFTER the generic `input, textarea` rule so it can override `width`, `max-width`, `padding`, `margin-bottom`. `max-width: none` explicitly removes the `30ch` cap from the generic rule.
- `:hover:not(:checked):not(:disabled)` — hover affordance only when interaction would change state.
- `:checked` — inverts the box to `--color-text`. The 1px border stays from the base rule, providing a subtle frame in both themes.
- `:focus-visible` — matches the `a:focus-visible` rule already in the file.
- `:disabled` — standard disabled affordance.
- `label:has(> input[type="checkbox"])` — overrides the generic `form { label { display: block } }` rule so the label sits inline next to the checkbox with a 0.5em gap.

- [ ] **Step 4: Rebuild CSS and verify each state visually**

```bash
npm run build:css:debug
```

Hard-refresh `http://localhost:5000/login` (Ctrl+Shift+R / Cmd+Shift+R).

Verify all of the following:

1. **Layout:** Each checkbox sits inline with its label text on the same line. Labels are no longer stacked above their boxes.
2. **Default (unchecked):** 1em square, 1px border in `--color-border`, surface background. Square corners.
3. **Pre-checked:** Box is filled with `--color-text` (dark in light theme, light in dark theme). 1px border still visible.
4. **Hover (unchecked):** Background shifts to `--color-surface-muted`. Move pointer over "Remember me" — the box gets slightly darker/lighter.
5. **Hover (checked):** No background change (filter excluded by `:not(:checked)`).
6. **Focus:** Tab to a checkbox — 2px outline of `--color-text` with 2px offset appears around the box.
7. **Click toggling:** Clicking the checkbox or its label text toggles the checked state. The fill animates instantly.
8. **Disabled:** Both disabled checkboxes show 50% opacity. Cursor is `not-allowed` over them. They don't toggle on click.
9. **Theme switch:** Click the theme switcher in the rail. All states above must still work — borders, fills, and focus outlines should swap to the dark-theme palette without any state looking broken.

If any state is wrong, fix the SCSS, rerun `npm run build:css:debug`, hard-refresh, re-verify.

- [ ] **Step 5: Commit the SCSS change only**

```bash
git add src/scss/main.scss
git commit -m "feat: add form-scoped checkbox style"
```

DO NOT include the harness edits in `app/templates/pages/login.html` — those get reverted in Task 2.

---

### Task 2: Revert the visual harness

**Files:**
- Modify: `app/templates/pages/login.html` (revert to its committed state)

- [ ] **Step 1: Revert the harness edits**

```bash
git checkout -- app/templates/pages/login.html
```

- [ ] **Step 2: Verify the revert**

```bash
git status
git diff app/templates/pages/login.html
```

Expected: `git status` shows no changes to `app/templates/pages/login.html`. `git diff` shows nothing for that file.

- [ ] **Step 3: Sanity-check the login page in the browser**

Hard-refresh `http://localhost:5000/login`. The page should look exactly as it did before this work began — no checkboxes visible.

No commit needed for this task — the revert restores the committed state.

---

### Task 3: Build the production CSS and confirm it bundles cleanly

**Files:**
- Modify: `assets/css/main.min.css` (regenerated artifact — track the rebuild but do not hand-edit)

- [ ] **Step 1: Build the minified CSS**

```bash
npm run build:css
```

Expected: command exits with no errors. `assets/css/main.min.css` is regenerated.

- [ ] **Step 2: Confirm the new selectors are present in the minified output**

```bash
grep -o 'input\[type="checkbox"\][^{]*{' assets/css/main.min.css | sort -u
grep -o 'label:has[^{]*{' assets/css/main.min.css
```

Expected: at least four matches for the checkbox selectors (base, `:hover`, `:checked`, `:focus-visible`, `:disabled`) and one match for `label:has(> input[type="checkbox"])`.

- [ ] **Step 3: Decide whether to commit the regenerated minified CSS**

Run:

```bash
git status assets/css/main.min.css
```

Check repo convention: look at `git log --oneline -- assets/css/main.min.css` to see whether minified CSS is normally committed alongside SCSS changes. If recent commits include `assets/css/main.min.css` updates, commit it now:

```bash
git add assets/css/main.min.css
git commit -m "chore: rebuild minified CSS"
```

If the minified CSS is not normally committed (build artifact), skip this commit — `make build-assets` regenerates it during deploy.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Square 1em box, 1px border, surface bg | Task 1 Step 3, base `input[type="checkbox"]` rule |
| `:checked` → text-color fill | Task 1 Step 3, `:checked` rule |
| `:hover` (unchecked) → surface-muted | Task 1 Step 3, `:hover:not(:checked):not(:disabled)` rule |
| `:focus-visible` → 2px text outline | Task 1 Step 3, `:focus-visible` rule |
| `:disabled` → 0.5 opacity, not-allowed | Task 1 Step 3, `:disabled` rule |
| Inline-flex label row via `:has()` | Task 1 Step 3, `label:has(> input[type="checkbox"])` rule |
| Override generic `input` width/padding/margin | Task 1 Step 3, `width/height/margin/padding/max-width: none` in base rule |
| Light/dark themes work without extra rules | Task 1 Step 4 verification #9 |
| Scoped to `form` only | All selectors are nested inside the `form { ... }` block |

All spec requirements are covered. No placeholders. No "TBD". No undefined references.
