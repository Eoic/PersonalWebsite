(() => {
    const handleThemeSwitch = (_event) => {
        const element = document.documentElement;
        element.classList.toggle('light') && localStorage.setItem('theme', 'light');
        element.classList.toggle('dark') && localStorage.setItem('theme', 'dark');
        fillBackground();
    }

    const fillBackground = () => {
        const canvas = document.getElementById('background');
        const ctx = canvas.getContext('2d');
        const charPool = ['~', '#', '$', '%', '!', '?', '@', '^', '&', '*', '(', ')', '-', '+', '{', '}', '<', '>', '\\', '/', '='];
        const charPoolSize = charPool.length;

        function resizeCanvas() {
            const dpr = window.devicePixelRatio;
            const width = Math.ceil(window.innerWidth * dpr);
            const height = Math.ceil(window.innerHeight * dpr);
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width / dpr}px`;
            canvas.style.height = `${height / dpr}px`;
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            drawGrid();
        }

        function drawGrid() {
            const cellSize = 60;
            const cellHalfSize = cellSize / 2;
            const columns = Math.ceil(canvas.width / cellSize);
            const rows = Math.ceil(canvas.height / cellSize);
            const rootStyles = getComputedStyle(document.documentElement);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Fira Code';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = rootStyles.getPropertyValue('color');

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    const x = col * cellSize;
                    const y = row * cellSize;
                    const nextSymbolIndex = Math.floor(Math.random() * charPoolSize);
                    ctx.fillText(charPool[nextSymbolIndex], x + cellHalfSize, y + cellHalfSize);
                }
            }
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
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
                durationElement.innerHTML = '(Less than a month)';
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
        fillBackground();
    });
})();