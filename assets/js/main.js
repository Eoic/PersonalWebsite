(() => {
    const loadPreferredTheme = () => {
        const selectedTheme = localStorage.getItem('theme') || 'dark';
        const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.body.classList.add(selectedTheme ?? defaultTheme);
    }

    const handleThemeSwitch = (_event) => {
        const body = document.body;
        body.classList.toggle('light') && localStorage.setItem('theme', 'light');
        body.classList.toggle('dark') && localStorage.setItem('theme', 'dark');
    }

    const handleTabSwitch = (event) => {
        const main = document.querySelector('main');
        const sections = main.querySelectorAll('section[data-content]');

        Array.from(event.target.parentElement.children).forEach((element) => {
            if (element === event.target)
                element.setAttribute('data-active', '');
            else element.removeAttribute('data-active');
        });

        Array.from(sections).forEach((element) => {
            if (element.dataset.content === event.target.dataset.contentTarget)
                element.setAttribute('data-active', '');
            else element.removeAttribute('data-active');
        });
    };

    const computeEntryTimespans = () => {
        const timespans = document.querySelectorAll('div[data-timespan]');

        timespans.forEach(timespan => {
            const durationElement = timespan.querySelector('[data-duration=""]');
            const dateFrom = new Date(durationElement.getAttribute('data-date-from'));
            const dateTo = new Date(durationElement.getAttribute('data-date-to') || new Date().toDateString());
            let months = (dateTo.getFullYear() - dateFrom.getFullYear()) * 12;
            months -= dateFrom.getMonth();
            months += dateTo.getMonth();
            months = Math.max(months, 0);

            if (months < 1) {
                durationElement.innerHTML = "(Less than a month)";
                return;
            }

            let durationText = '(';
            const years = Math.floor(months / 12);

            months = months % 12;

            if (years > 0) {
                durationText += `${years} year${years > 1 ? 's' : ''}`;
            }

            if (months > 0) {
                durationText += `${years > 0 ? ', ' : ''}${months} month${months > 1 ? 's' : ''}`;
            }

            durationText += ')';
            durationElement.innerHTML = durationText;
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        const themeSwitchBtn = document.getElementById('theme-switcher');
        const tabsNavigator = document.getElementById('tabs');
        themeSwitchBtn.addEventListener('click', handleThemeSwitch);
        tabsNavigator.addEventListener('mousedown', handleTabSwitch);

        loadPreferredTheme();
        computeEntryTimespans();
    });
})();