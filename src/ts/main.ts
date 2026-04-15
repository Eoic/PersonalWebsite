type Theme = "light" | "dark";

const THEME_COLORS: Record<Theme, string> = {
  light: "#f3f3ef",
  dark: "#111111",
};

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const meta = document.getElementById("theme-color-meta");
  const switcher = document.getElementById("theme-switcher");

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  localStorage.setItem("theme", theme);

  if (meta) {
    meta.setAttribute("content", THEME_COLORS[theme]);
  }

  if (switcher) {
    switcher.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

function applyView(view: "wide" | "narrow"): void {
  const root = document.documentElement;
  const meta = document.getElementById("view-mode-meta");
  const switcher = document.getElementById("view-switcher");

  root.classList.remove("wide", "narrow");
  root.classList.add(view);
  localStorage.setItem("view", view);

  if (meta) {
    meta.setAttribute("content", view);
  }
  if (switcher) {
    switcher.setAttribute("aria-pressed", String(view === "wide"));
  }
}

function handleThemeSwitch(): void {
  const nextTheme: Theme = document.documentElement.classList.contains("dark")
    ? "light"
    : "dark";

  applyTheme(nextTheme);
}

function handleViewSwitch(): void {
  const nextView = document.documentElement.classList.contains("wide") ? "narrow" : "wide";
  applyView(nextView);
}

function formatDuration(months: number): string {
  if (months < 1) {
    return "(Less than a month)";
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} year${years > 1 ? "s" : ""}`);
  }

  if (remainingMonths > 0) {
    parts.push(`${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`);
  }

  if (parts.length > 0) {
    return `(${parts.join(", ")})`;
  }

  return "";
}

function computeEntryTimespans(): void {
  const timespans = document.querySelectorAll<HTMLElement>("[data-timespan]");

  timespans.forEach((timespan) => {
    const durationElement = timespan.querySelector<HTMLElement>("[data-duration]");
    const dateFromRaw = durationElement?.getAttribute("data-date-from");
    const dateUntilRaw =
      durationElement?.getAttribute("data-date-until") ?? new Date().toDateString();

    if (!durationElement || !dateFromRaw) {
      return;
    }

    const dateFrom = new Date(dateFromRaw);
    const dateUntil = new Date(dateUntilRaw);
    let months = (dateUntil.getFullYear() - dateFrom.getFullYear()) * 12;

    months -= dateFrom.getMonth();
    months += dateUntil.getMonth();
    months = Math.max(months, 0);
    durationElement.textContent = formatDuration(months);
  });
}

function initBookshelfDetail(): void {
  const grid = document.querySelector<HTMLElement>(".bookshelf-grid");
  const titleEl = document.querySelector<HTMLElement>(".bookshelf-detail-title");
  const authorEl = document.querySelector<HTMLElement>(".bookshelf-detail-author");

  if (!grid || !titleEl || !authorEl) return;

  grid.addEventListener("mouseover", (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>(".bookshelf-item");

    if (!item) {
      return;
    }

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

function initBookshelfCovers(): void {
  const items = document.querySelectorAll<HTMLElement>(".bookshelf-item");

  items.forEach((item) => {
    const image = item.querySelector<HTMLImageElement>("img");

    if (!image) return;

    const markLoaded = () => item.classList.add("is-loaded");

    if (image.complete) {
      markLoaded();
      return;
    }

    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markLoaded, { once: true });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const themeSwitcher = document.getElementById("theme-switcher");
  const viewSwitcher = document.getElementById("view-switcher");

  computeEntryTimespans();
  initBookshelfCovers();
  initBookshelfDetail();
  initBookshelfSearch();

  if (themeSwitcher) {
    themeSwitcher.addEventListener("click", handleThemeSwitch);
  }

  if (viewSwitcher) {
    viewSwitcher.addEventListener("click", handleViewSwitch);
  }
});
