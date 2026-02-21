(() => {
    const cellSize = 64;
    const flipCircleRadius = 256;
    const flipCircleRadiusSqr = flipCircleRadius * flipCircleRadius;
    const cellHalfSize = cellSize / 2;
    const charFlipChance = 0.2;
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

    let canvas, ctx, lastCenterChanged, pendingFlip;

    const handleThemeSwitch = (_event) => {
        const classList = document.documentElement.classList;
        classList.toggle('light') && localStorage.setItem('theme', 'light');
        classList.toggle('dark') && localStorage.setItem('theme', 'dark');
        drawGrid();
    };

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const width = Math.ceil(window.innerWidth * dpr);
        const height = Math.ceil(window.innerHeight * dpr);

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr);
        drawGrid();
    }

    function drawGrid() {
        const rootStyles = getComputedStyle(document.documentElement);
        const columns = Math.ceil(window.innerWidth / cellSize);
        const rows = Math.ceil(window.innerHeight / cellSize);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 20px Lekton';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = rootStyles.getPropertyValue('color');

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const x = col * cellSize;
                const y = row * cellSize;
                ctx.fillText(
                    charPool[Math.floor(Math.random() * charPoolSize)],
                    x + cellHalfSize,
                    y + cellHalfSize
                );
            }
        }
    }

    function flipChars(event) {
        const cx = Math.floor(event.clientX / cellSize) * cellSize;
        const cy = Math.floor(event.clientY / cellSize) * cellSize;

        if (lastCenterChanged && lastCenterChanged.x === cx && lastCenterChanged.y === cy) return;

        lastCenterChanged = { x: cx, y: cy };

        if (pendingFlip) return;

        pendingFlip = requestAnimationFrame(() => {
            pendingFlip = null;

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
        });
    }

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
        canvas = document.getElementById('background');
        ctx = canvas.getContext('2d');
        document.getElementById('theme-switcher').addEventListener('click', handleThemeSwitch);
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('pointermove', flipChars);
        computeEntryTimespans();
        resizeCanvas();
    });
})();
