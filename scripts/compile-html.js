const { execSync } = require('child_process');
const path = require('path');

const activateScript = process.platform === 'win32' ? path.join('.venv', 'Scripts', 'activate') : `source ${path.join('.venv', 'bin', 'activate')}`;
const pythonCommand = 'python -m htmlgen.main assets/';

try {
    execSync(`${activateScript} && ${pythonCommand}`, { stdio: 'inherit' });
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}
