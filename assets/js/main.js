(() => {
    const handleThemeSwitch = (_event) => {
        const classList = document.documentElement.classList;
        classList.toggle('light') && localStorage.setItem('theme', 'light');
        classList.toggle('dark') && localStorage.setItem('theme', 'dark');
        fillBackground();
    };

    const fillBackground = () => {
        let lastCenterChanged;
        const cellSize = 64;
        const flipCircleRadius = 256;
        const flipCircleRadiusSqr = flipCircleRadius * flipCircleRadius;
        const cellHalfSize = cellSize / 2;
        const charFlipChance = 0.2;
        const canvas = document.getElementById('background');
        const ctx = canvas.getContext('2d');
        const charPool = [
            '~',
            '#',
            '$',
            '%',
            '!',
            '?',
            '@',
            '^',
            '&',
            '*',
            '(',
            ')',
            '-',
            '+',
            '{',
            '}',
            '<',
            '>',
            '\\',
            '/',
            '=',
        ];
        const charPoolSize = charPool.length;
        const rootStyles = getComputedStyle(document.documentElement);

        function resizeCanvas() {
            let width, height;
            const dpr = window.devicePixelRatio;

            if (dpr >= 1) {
                width = Math.ceil(window.innerWidth * dpr);
                height = Math.ceil(window.innerHeight * dpr);
            } else {
                width = Math.ceil(window.innerWidth / dpr);
                height = Math.ceil(window.innerHeight / dpr);
            }

            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width / dpr}px`;
            canvas.style.height = `${height / dpr}px`;
            ctx.scale(dpr, dpr);
            drawGrid();
        }

        function debounce(func, delay) {
            let isCallable = true;

            return (...args) => {
                if (isCallable) {
                    func(...args);
                    isCallable = false;
                    setTimeout(() => (isCallable = true), delay);
                }
            };
        }

        function flipChars(event) {
            const cx = Math.floor(event.clientX / cellSize) * cellSize;
            const cy = Math.floor(event.clientY / cellSize) * cellSize;

            if (lastCenterChanged && lastCenterChanged.x == cx && lastCenterChanged.y == cy) return;

            lastCenterChanged = { x: cx, y: cy };

            for (let sqx = cx - flipCircleRadius; sqx <= cx + flipCircleRadius; sqx += cellSize) {
                for (
                    let sqy = cy - flipCircleRadius;
                    sqy <= cy + flipCircleRadius;
                    sqy += cellSize
                ) {
                    const dx = cx - sqx;
                    const dy = cy - sqy;

                    if (dx * dx + dy * dy <= flipCircleRadiusSqr) {
                        if (Math.random() > charFlipChance) continue;

                        ctx.clearRect(sqx, sqy, cellSize, cellSize);
                        ctx.fillText(
                            charPool[Math.floor(Math.random() * charPoolSize)],
                            sqx + cellHalfSize,
                            sqy + cellHalfSize
                        );
                    }
                }
            }
        }

        function drawGrid() {
            const columns = Math.ceil(canvas.width / cellSize);
            const rows = Math.ceil(canvas.height / cellSize);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 20px Fira Code';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.4;
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
        window.addEventListener('pointermove', debounce(flipChars, 0));
        resizeCanvas();
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
