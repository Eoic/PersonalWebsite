(() => {
    const THEME_COLORS = {
        light: '#f3f3ef',
        dark: '#111111',
    };

    function applyTheme(theme) {
        const root = document.documentElement;
        const meta = document.getElementById('theme-color-meta');
        const switcher = document.getElementById('theme-switcher');

        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);

        if (meta) {
            meta.setAttribute('content', THEME_COLORS[theme]);
        }

        if (switcher) {
            switcher.textContent = `theme: ${theme}`;
            switcher.setAttribute('aria-pressed', String(theme === 'dark'));
        }
    }

    function handleThemeSwitch() {
        const nextTheme = document.documentElement.classList.contains('dark')
            ? 'light'
            : 'dark';
        applyTheme(nextTheme);
    }

    function computeEntryTimespans() {
        const timespans = document.querySelectorAll('[data-timespan]');

        timespans.forEach((timespan) => {
            const durationElement = timespan.querySelector('[data-duration]');

            if (!durationElement) {
                return;
            }

            const dateFrom = new Date(durationElement.getAttribute('data-date-from'));
            const dateUntil = new Date(
                durationElement.getAttribute('data-date-until') || new Date().toDateString()
            );

            let months = (dateUntil.getFullYear() - dateFrom.getFullYear()) * 12;
            months -= dateFrom.getMonth();
            months += dateUntil.getMonth();
            months = Math.max(months, 0);

            if (months < 1) {
                durationElement.textContent = '(Less than a month)';
                return;
            }

            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            const parts = [];

            if (years > 0) {
                parts.push(`${years} year${years > 1 ? 's' : ''}`);
            }

            if (remainingMonths > 0) {
                parts.push(`${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`);
            }

            durationElement.textContent = `(${parts.join(', ')})`;
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const switcher = document.getElementById('theme-switcher');
        const initialTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

        applyTheme(initialTheme);
        computeEntryTimespans();

        if (switcher) {
            switcher.addEventListener('click', handleThemeSwitch);
        }
    });
})();
