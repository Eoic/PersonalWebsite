const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

const build_dir = 'build'
const source_dir = 'assets'
const asset_dirs = ['js', 'css', 'images']

if (fs.existsSync(build_dir))
    fs.rmSync(build_dir, { force: true, recursive: true });

fs.mkdirSync(build_dir, { recursive: true })

asset_dirs.forEach((asset_dir) => {
    const asset_dir_full = path.join(build_dir, asset_dir);

    if (fs.existsSync(asset_dir_full))
        return;

    fs.mkdirSync(asset_dir_full, { recursive: true });
});

try {
    fs.cpSync(
        path.join(source_dir, 'images'),
        path.join(build_dir, 'images'),
        { recursive: true }
    );

    const assetFiles = fs.readdirSync('assets/');

    const filesToCopy = assetFiles.filter((file) =>
        file === 'sitemap.xml' ||
        file === 'robots.txt' ||
        file.endsWith('.html')
    );

    filesToCopy.map((file) =>
        fs.copyFileSync(
            path.join(source_dir, file),
            path.join(build_dir, file)
        )
    );

    if (fs.existsSync(path.join(source_dir, 'sw.js'))) {
        const swContent = fs.readFileSync(path.join(source_dir, 'sw.js'), 'utf8');
        const processedSwContent = swContent.replace(/__VERSION__/g, version);
        fs.writeFileSync(path.join(build_dir, 'sw.js'), processedSwContent);
        console.info(`Service worker processed with version: ${version}.`);
    }

    console.info('Files copied successfully.');
} catch (error) {
    console.error('Error copying files:', error);
}

try {
    execSync(`npm run chore:minify-js`, { stdio: 'inherit' });
    execSync(`npm run chore:minify-css`, { stdio: 'inherit' });

    if (fs.existsSync(path.join(build_dir, 'sw.js'))) {
        execSync(`uglifyjs --compress --mangle -- ./build/sw.js > ./build/sw.min.js && mv ./build/sw.min.js ./build/sw.js`, { stdio: 'inherit' });
        console.info('Service worker minified successfully.');
    }
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}
