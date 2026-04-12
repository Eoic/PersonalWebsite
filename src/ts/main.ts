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
    switcher.textContent = `theme: ${theme}`;
    switcher.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

function handleThemeSwitch(): void {
  const nextTheme: Theme = document.documentElement.classList.contains("dark")
    ? "light"
    : "dark";

  applyTheme(nextTheme);
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

  return `(${parts.join(", ")})`;
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

document.addEventListener("DOMContentLoaded", () => {
  const switcher = document.getElementById("theme-switcher");
  const initialTheme: Theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

  applyTheme(initialTheme);
  computeEntryTimespans();

  if (switcher) {
    switcher.addEventListener("click", handleThemeSwitch);
  }
});
