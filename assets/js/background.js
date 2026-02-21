const cellSize = 64;
const flipCircleRadius = 256;
const flipCircleRadiusSqr = flipCircleRadius * flipCircleRadius;
const cellHalfSize = cellSize / 2;
const charFlipChance = 0.2;
const charPool = [
    '~', '#', '$', '%', '!', '?', '@', '^', '&', '*',
    '(', ')', '-', '+', '{', '}', '<', '>', '\\', '/', '=',
];
const charPoolSize = charPool.length;

let canvas, ctx, fillColor, pendingFlip, lastCenterChanged;
let viewWidth, viewHeight;

function drawGrid() {
    const columns = Math.ceil(viewWidth / cellSize);
    const rows = Math.ceil(viewHeight / cellSize);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 20px Lekton';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = fillColor;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = col * cellSize;
            const y = row * cellSize;
            ctx.fillText(charPool[Math.floor(Math.random() * charPoolSize)], x + cellHalfSize, y + cellHalfSize);
        }
    }
}

function flipChars(clientX, clientY) {
    const cx = Math.floor(clientX / cellSize) * cellSize;
    const cy = Math.floor(clientY / cellSize) * cellSize;

    if (lastCenterChanged && lastCenterChanged.x === cx && lastCenterChanged.y === cy) return;

    lastCenterChanged = { x: cx, y: cy };

    if (pendingFlip) return;

    pendingFlip = requestAnimationFrame(() => {
        pendingFlip = null;

        for (let sqx = cx - flipCircleRadius; sqx <= cx + flipCircleRadius; sqx += cellSize) {
            for (let sqy = cy - flipCircleRadius; sqy <= cy + flipCircleRadius; sqy += cellSize) {
                const dx = cx - sqx;
                const dy = cy - sqy;

                if (dx * dx + dy * dy <= flipCircleRadiusSqr) {
                    if (Math.random() > charFlipChance) continue;

                    ctx.clearRect(sqx, sqy, cellSize, cellSize);
                    ctx.fillText(
                        charPool[Math.floor(Math.random() * charPoolSize)],
                        sqx + cellHalfSize,
                        sqy + cellHalfSize,
                    );
                }
            }
        }
    });
}

function resize(width, height, dpr) {
    viewWidth = width;
    viewHeight = height;
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    ctx.scale(dpr, dpr);
    drawGrid();
}

self.addEventListener('message', (event) => {
    const { type } = event.data;

    if (type === 'init') {
        canvas = event.data.canvas;
        ctx = canvas.getContext('2d');
        fillColor = event.data.color;
        resize(event.data.width, event.data.height, event.data.dpr);
    } else if (type === 'resize') {
        fillColor = event.data.color;
        resize(event.data.width, event.data.height, event.data.dpr);
    } else if (type === 'theme') {
        fillColor = event.data.color;
        drawGrid();
    } else if (type === 'pointermove') {
        flipChars(event.data.clientX, event.data.clientY);
    }
});
