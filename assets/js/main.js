(() => {
    let worker;

    function getColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('color');
    }

    const handleThemeSwitch = (_event) => {
        const classList = document.documentElement.classList;
        classList.toggle('light') && localStorage.setItem('theme', 'light');
        classList.toggle('dark') && localStorage.setItem('theme', 'dark');
        worker.postMessage({ type: 'theme', color: getColor() });
    };

    const computeEntryTimespans = () => {
        const timespans = document.querySelectorAll('div[data-timespan]');

        timespans.forEach((timespan) => {
            const durationElement = timespan.querySelector('[data-duration=""]');
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
            durationElement.textContent = durationText;
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('background');
        const offscreen = canvas.transferControlToOffscreen();

        worker = new Worker('js/background.js');
        worker.postMessage(
            {
                type: 'init',
                canvas: offscreen,
                width: window.innerWidth,
                height: window.innerHeight,
                dpr: window.devicePixelRatio || 1,
                color: getColor(),
            },
            [offscreen]
        );

        document.getElementById('theme-switcher').addEventListener('click', handleThemeSwitch);

        window.addEventListener('resize', () => {
            worker.postMessage({
                type: 'resize',
                width: window.innerWidth,
                height: window.innerHeight,
                dpr: window.devicePixelRatio || 1,
                color: getColor(),
            });
        });

        window.addEventListener('pointermove', (event) => {
            worker.postMessage({
                type: 'pointermove',
                clientX: event.clientX,
                clientY: event.clientY,
            });
        });

        computeEntryTimespans();
    });
})();
