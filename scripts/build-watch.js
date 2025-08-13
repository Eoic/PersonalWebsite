const http = require('http');
const chokidar = require('chokidar');
const { execSync } = require('child_process');

const SSE_PORT = 35730;
const HANDLER_DEBOUNCE_MS = 250;

let isInitialized = false;
const monitoredPaths = ['htmlgen/', 'assets/css/', 'assets/images/', 'assets/js/'];
const extensions = ['.html', '.css', '.js', '.py'];

function debounce(handler, timeout = 250) {
    let handlerTimeoutId = null;

    return (...args) => {
        if (handlerTimeoutId) clearTimeout(handlerTimeoutId);
        handlerTimeoutId = setTimeout(() => handler(...args), timeout);
    };
}

function handleChanges() {
    try {
        execSync(`npm run chore:compile-html`, { stdio: 'inherit' });
        if (isInitialized) broadcastReload();
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

const sseClients = new Set();

const sseServer = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        const requestedHeaders =
            req.headers['access-control-request-headers'] ||
            'cache-control, last-event-id, accept, content-type';

        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': requestedHeaders,
            'Access-Control-Max-Age': '600',
        });

        res.end();
        return;
    }

    if (req.url === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        res.write('\n');
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
    } else if (req.url === '/alive') {
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        res.end('ok');
    } else {
        res.writeHead(404);
        res.end();
    }
});

sseServer.listen(SSE_PORT, () => console.log(`Development reload SSE listening on :${SSE_PORT}.`));

function broadcastReload() {
    for (const client of sseClients) {
        client.write(`event: reload\ndata: now\n\n`);
    }
}

const handleChangesDebounced = debounce(handleChanges, HANDLER_DEBOUNCE_MS);

const watcher = chokidar.watch(monitoredPaths, {
    ignored: (path, stats) => stats?.isFile() && !extensions.some((ext) => path.endsWith(ext)),
    persistent: true,
});

const log = console.log.bind(console);

watcher
    .on('add', (path) => {
        if (!isInitialized) return;
        log(`Added ${path}.`);
        handleChangesDebounced();
    })
    .on('change', (path) => {
        if (!isInitialized) return;
        log(`Changed ${path}.`);
        handleChangesDebounced();
    })
    .on('unlink', (path) => {
        if (!isInitialized) return;
        log(`Removed ${path}.`);
        handleChangesDebounced();
    });

let retryCount = 0;
const maxRetries = 5;

watcher
    .on('error', (error) => {
        log(`Watcher error: ${error}`);

        if (retryCount < maxRetries) {
            retryCount++;
            log(`Retrying watcher initialization (${retryCount}/${maxRetries})...`);

            setTimeout(
                () => {
                    watcher.close();
                    watcher.add(['htmlgen/', 'assets/css', 'assets/images', 'assets/js']);
                },
                1000 * Math.pow(2, retryCount - 1)
            );
        } else {
            log('Max retries reached. Watcher will not be restarted.');
        }
    })
    .on('ready', () => {
        handleChangesDebounced();
        isInitialized = true;
        log('Watching for changes:');

        for (const path of monitoredPaths) {
            log(` - ${path}**/*.{${extensions.join(', ')}}`);
        }

        log();
    });
