import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎥 Installing video call server dependencies...');

const videoCallPath = join(__dirname, 'backend', 'video-call-server');

const npm = spawn('npm', ['install'], {
    cwd: videoCallPath,
    shell: true,
    stdio: 'pipe'
});

npm.stdout.on('data', (data) => {
    console.log(`📦 ${data.toString().trim()}`);
});

npm.stderr.on('data', (data) => {
    console.log(`📦 ${data.toString().trim()}`);
});

npm.on('close', (code) => {
    if (code === 0) {
        console.log('✅ Video call server dependencies installed successfully!');
    } else {
        console.error(`❌ Failed to install video call server dependencies (code: ${code})`);
    }
});

npm.on('error', (error) => {
    console.error(`💥 Error installing video call server dependencies: ${error.message}`);
}); 