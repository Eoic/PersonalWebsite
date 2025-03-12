(() => {
    const handleThemeSwitch = (_event) => {
        const element = document.documentElement;
        element.classList.toggle('light') && localStorage.setItem('theme', 'light');
        element.classList.toggle('dark') && localStorage.setItem('theme', 'dark');
    }

    const computeEntryTimespans = () => {
        const timespans = document.querySelectorAll('div[data-timespan]');

        timespans.forEach((timespan) => {
            const durationElement = timespan.querySelector('[data-duration=""]');
            const dateFrom = new Date(durationElement.getAttribute('data-date-from'));
            const dateUntil = new Date(durationElement.getAttribute('data-date-until') || new Date().toDateString());
            let months = (dateUntil.getFullYear() - dateFrom.getFullYear()) * 12;
            months -= dateFrom.getMonth();
            months += dateUntil.getMonth();
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
        themeSwitchBtn.addEventListener('click', handleThemeSwitch);
        computeEntryTimespans();
    });
})();