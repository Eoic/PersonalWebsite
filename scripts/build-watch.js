const chokidar = require('chokidar');
const { execSync } = require('child_process');

function handleChanges() {
    try {
        execSync(`npm run chore:compile-html`, { stdio: 'inherit' });
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

const watcher = chokidar.watch('htmlgen/', {
    ignored: (path, stats) => stats?.isFile() && !(path.endsWith('.html') || path.endsWith('.py')),
    persistent: true
});

const log = console.log.bind(console);
let isInitialized = false;

watcher
    .on('add', path => {
        if (!isInitialized)
            return;

        log(`Added ${path}.`);
        handleChanges();
    })
    .on('change', path => {
        if (!isInitialized)
            return;

        log(`Changed ${path}.`);
        handleChanges();
    })
    .on('unlink', path => {
        if (!isInitialized)
            return;

        log(`Removed ${path}.`);
        handleChanges();
    });

watcher
    .on('error', error => {
        log(`Watcher error: ${error}`);
        process.exit(1);
    })
    .on('ready', () => {
        handleChanges();
        isInitialized = true;
        log('Watching for changes...');
    });
