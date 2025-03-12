const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process');

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
    const filesToCopy = assetFiles.filter((file) => file === 'sitemap.xml' || file.endsWith('.html'));

    filesToCopy.map((file) =>
        fs.copyFileSync(
            path.join(source_dir, file),
            path.join(build_dir, file)
        )
    );

    console.info('Files copied successfully.');
} catch (error) {
    console.error('Error copying files:', error);
}

try {
    execSync(`npm run chore:minify-js`, { stdio: 'inherit' });
    execSync(`npm run chore:minify-css`, { stdio: 'inherit' });
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}