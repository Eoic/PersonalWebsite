# Form-scoped checkbox style

## Goal

Add a checkbox style that matches the site's existing visual language: square corners, 1px borders, monospace, theme-aware via CSS custom properties. Scope is forms only — the rule lives inside the existing `form { ... }` block in `src/scss/main.scss`. No template or markup changes.

## Context

The site (`src/scss/main.scss`) already defines a small design system:

- Sharp corners everywhere (`border-radius: 0`).
- 1px borders using `--color-border`.
- Surface fills via `--color-surface` / `--color-surface-muted`.
- Light/dark themes through custom properties on `.theme.light` / `.theme.dark`.
- "Active" state pattern is full inversion: `.whiteboard-tool.is-active` and `.site-nav a[aria-current]` swap to `--color-text` background with `--color-bg` foreground.
- Existing `form { label, input { display: block } }` rule stacks labels above inputs — this would visually break a checkbox row.

No checkboxes exist in templates today. The user is mid-work on a "hidden posts" feature (see `routes.py` filtering `Post.hidden` and `.entry-post.entry-hidden` in SCSS); the post editor will likely gain a "Hidden" checkbox via WTForms, which renders `<label>${form.hidden} Hidden</label>`.

## Visual behavior

The checkbox uses inverted-fill on check plus a CSS-drawn checkmark for state legibility.

| State | Appearance |
|---|---|
| Default (unchecked) | 1em × 1em square, `1px solid var(--color-border)`, `background: var(--color-surface)` |
| `:checked` | `background: var(--color-text)`, border kept, plus a CSS-drawn checkmark in `--color-bg` rendered via `::after` |
| `:hover` (unchecked) | `background: var(--color-surface-muted)` |
| `:focus-visible` | `outline: 2px solid var(--color-text); outline-offset: 2px` |
| `:disabled` | `opacity: 0.5; cursor: not-allowed` |

The checkmark is a `::after` pseudo-element drawn from two borders (right + bottom) forming an L-shape rotated 45°. Color is `--color-bg` so it inverts cleanly against the filled box in both themes. Stroke width is 2px (visually distinct against the 1px box border). The base `input[type="checkbox"]` rule sets `position: relative` so the absolute-positioned pseudo-element anchors to the box. Browser support for pseudo-elements on `<input>` with `appearance: none` lines up with the `:has()` baseline already accepted (Chrome 84+, Safari 15.4+, Firefox 121+).

All colors come from existing CSS custom properties — light/dark themes work automatically.

## Layout

The existing `form` block sets `label` and `input` to `display: block` and gives inputs `width: 100%; max-width: 30ch; padding: 0.5em; margin-bottom: 1em`. For checkbox rows we need a different layout:

- The label wrapping a checkbox becomes a row: `display: inline-flex; align-items: center; gap: 0.5em; margin-bottom: 1em`.
- The checkbox itself overrides the generic `input` rule: `display: inline-block; width: 1em; height: 1em; padding: 0; margin: 0; vertical-align: middle`.

Selector strategy: `form label:has(> input[type="checkbox"])` for the row, and `form input[type="checkbox"]` for the box. `:has()` avoids any markup change. Browser baseline: Chrome 105+, Safari 15.4+, Firefox 121+ (all evergreen browsers since late 2023) — acceptable for this site.

## Implementation surface

Single edit: extend the `form { ... }` block in `src/scss/main.scss` (currently around lines 501–529) with the new rules. Native rendering is suppressed via `appearance: none` (with `-webkit-appearance: none` for older WebKit).

The rule must come after the generic `input` block so that the more specific `input[type="checkbox"]` overrides `width: 100%`, `max-width: 30ch`, `padding`, and `margin-bottom` from the generic rule.

## Markup contract

Works automatically when the checkbox sits inside its label, which is what WTForms produces by default:

```html
<label><input type="checkbox" name="hidden"> Hidden</label>
```

Standalone checkboxes (no wrapping label) get the box style but not the row layout — acceptable since the form block is the scope.

## Out of scope

- Indeterminate state styling.
- Radio buttons.
- Site-wide checkbox styling outside `form`.
