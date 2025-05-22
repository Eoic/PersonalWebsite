const chokidar = require('chokidar');
const { execSync } = require('child_process');

let isInitialized = false;
const handlerDebounceMs = 250;

function debounce(handler, timeout = 250) {
    let handlerTimeoutId = null;

    return (...args) => {
        if (handlerTimeoutId)
            clearTimeout(handlerTimeoutId);

        handlerTimeoutId = setTimeout(() => handler(...args), timeout);
    }
}

function handleChanges() {
    try {
        execSync(`npm run chore:compile-html`, { stdio: 'inherit' });
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

const handleChangesDebounced = debounce(handleChanges, handlerDebounceMs);

const watcher = chokidar.watch('htmlgen/', {
    ignored: (path, stats) => stats?.isFile() && !(path.endsWith('.html') || path.endsWith('.py')),
    persistent: true
});

const log = console.log.bind(console);

watcher
    .on('add', path => {
        if (!isInitialized)
            return;

        log(`Added ${path}.`);
        handleChangesDebounced();
    })
    .on('change', path => {
        if (!isInitialized)
            return;

        log(`Changed ${path}.`);
        handleChangesDebounced();
    })
    .on('unlink', path => {
        if (!isInitialized)
            return;

        log(`Removed ${path}.`);
        handleChangesDebounced();
    });

watcher
    .on('error', error => {
        log(`Watcher error: ${error}`);
        process.exit(1);
    })
    .on('ready', () => {
        handleChangesDebounced();
        isInitialized = true;
        log('Watching for changes...');
    });
