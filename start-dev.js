import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to check and install Python dependencies
function installPythonDependencies() {
    return new Promise((resolve, reject) => {
        console.log('🔍 Checking Python dependencies...');
        const backendPath = join(__dirname, 'backend');
        const requirementsPath = join(backendPath, 'requirements.txt');
        
        if (!existsSync(requirementsPath)) {
            console.log('⚠️  No requirements.txt found, skipping dependency check');
            resolve();
            return;
        }
        
        const pip = spawn('pip', ['install', '-r', 'requirements.txt'], {
            cwd: backendPath,
            shell: true,
            stdio: 'pipe'
        });
        
        pip.stdout.on('data', (data) => {
            console.log(`📦 Pip: ${data.toString().trim()}`);
        });
        
        pip.stderr.on('data', (data) => {
            console.log(`📦 Pip: ${data.toString().trim()}`);
        });
        
        pip.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Python dependencies installed successfully');
                resolve();
            } else {
                console.error(`❌ Failed to install Python dependencies (code: ${code})`);
                reject(new Error(`Pip install failed with code ${code}`));
            }
        });
        
        pip.on('error', (error) => {
            console.error(`💥 Pip install error: ${error.message}`);
            reject(error);
        });
    });
}

// Function to check and install video call server dependencies
function installVideoCallDependencies() {
    return new Promise((resolve, reject) => {
        console.log('🎥 Checking video call server dependencies...');
        const videoCallPath = join(__dirname, 'backend', 'video-call-server');
        const packageJsonPath = join(videoCallPath, 'package.json');
        
        if (!existsSync(packageJsonPath)) {
            console.log('⚠️  No package.json found in video call server, skipping dependency check');
            resolve();
            return;
        }
        
        const npm = spawn('npm', ['install'], {
            cwd: videoCallPath,
            shell: true,
            stdio: 'pipe'
        });
        
        npm.stdout.on('data', (data) => {
            console.log(`📦 Video Call: ${data.toString().trim()}`);
        });
        
        npm.stderr.on('data', (data) => {
            console.log(`📦 Video Call: ${data.toString().trim()}`);
        });
        
        npm.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Video call server dependencies installed successfully');
                resolve();
            } else {
                console.error(`❌ Failed to install video call server dependencies (code: ${code})`);
                reject(new Error(`NPM install failed with code ${code}`));
            }
        });
        
        npm.on('error', (error) => {
            console.error(`💥 NPM install error: ${error.message}`);
            reject(error);
        });
    });
}

// Function to start the friends backend server (Node.js/Express)
function startFriendsBackend() {
    console.log('👥 Starting friends backend server...');
    const friendsBackendPath = join(__dirname, 'src', 'api');
    const friendsBackend = spawn('node', ['friendsBackend.js'], {
        cwd: friendsBackendPath,
        shell: true,
        stdio: 'pipe',
        env: {
            ...process.env,
            PORT: '5000' // Friends backend on port 5000
        }
    });

    friendsBackend.stdout.on('data', (data) => {
        console.log(`👥 Friends Backend: ${data.toString().trim()}`);
    });

    friendsBackend.stderr.on('data', (data) => {
        console.error(`❌ Friends Backend Error: ${data.toString().trim()}`);
    });

    friendsBackend.on('close', (code) => {
        console.log(`🔴 Friends Backend process exited with code ${code}`);
    });

    friendsBackend.on('error', (error) => {
        console.error(`💥 Friends Backend failed to start: ${error.message}`);
    });

    return friendsBackend;
}

// Function to start the video call server (Node.js/Socket.IO)
function startVideoCallServer() {
    console.log('🎥 Starting video call server...');
    const videoCallPath = join(__dirname, 'backend', 'video-call-server');
    const videoCallServer = spawn('node', ['server.js'], {
        cwd: videoCallPath,
        shell: true,
        stdio: 'pipe',
        env: {
            ...process.env,
            PORT: '5002'
        }
    });

    videoCallServer.stdout.on('data', (data) => {
        console.log(`🎥 Video Call Server: ${data.toString().trim()}`);
    });

    videoCallServer.stderr.on('data', (data) => {
        console.error(`❌ Video Call Server Error: ${data.toString().trim()}`);
    });

    videoCallServer.on('close', (code) => {
        console.log(`🔴 Video Call Server process exited with code ${code}`);
    });

    videoCallServer.on('error', (error) => {
        console.error(`💥 Video Call Server failed to start: ${error.message}`);
    });

    return videoCallServer;
}

// Function to start the summarization backend server (Python/Flask)
function startSummarizationBackend() {
    console.log('📄 Starting summarization backend server...');
    const backendPath = join(__dirname, 'backend');
    const summarizationBackend = spawn('python', ['summarize_api.py'], {
        cwd: backendPath,
        shell: true,
        stdio: 'pipe',
        env: {
            ...process.env,
            FLASK_APP: 'summarize_api.py',
            FLASK_ENV: 'development'
        }
    });

    summarizationBackend.stdout.on('data', (data) => {
        console.log(`📄 Summarization Backend: ${data.toString().trim()}`);
    });

    summarizationBackend.stderr.on('data', (data) => {
        console.error(`❌ Summarization Backend Error: ${data.toString().trim()}`);
    });

    summarizationBackend.on('close', (code) => {
        console.log(`🔴 Summarization Backend process exited with code ${code}`);
    });

    summarizationBackend.on('error', (error) => {
        console.error(`💥 Summarization Backend failed to start: ${error.message}`);
    });

    return summarizationBackend;
}

// Function to start the frontend server
function startFrontend() {
    console.log('🎨 Starting frontend server...');
    const frontend = spawn('npm', ['run', 'dev'], {
        shell: true,
        stdio: 'pipe',
        env: {
            ...process.env,
            NODE_ENV: 'development'
        }
    });

    frontend.stdout.on('data', (data) => {
        console.log(`🌐 Frontend: ${data.toString().trim()}`);
    });

    frontend.stderr.on('data', (data) => {
        console.error(`❌ Frontend Error: ${data.toString().trim()}`);
    });

    frontend.on('close', (code) => {
        console.log(`🔴 Frontend process exited with code ${code}`);
    });

    frontend.on('error', (error) => {
        console.error(`💥 Frontend failed to start: ${error.message}`);
    });

    return frontend;
}

// Function to start the meeting server (Node.js/Socket.IO for group meetings)
function startMeetingServer() {
    console.log('🤝 Starting meeting server...');
    const meetingPath = join(__dirname, 'groups', 'meeting', 'backend');
    const meetingServer = spawn('node', ['server.js'], {
        cwd: meetingPath,
        shell: true,
        stdio: 'pipe',
        env: {
            ...process.env,
            PORT: '5003' // Meeting server on port 5003
        }
    });

    meetingServer.stdout.on('data', (data) => {
        console.log(`🤝 Meeting Server: ${data.toString().trim()}`);
    });

    meetingServer.stderr.on('data', (data) => {
        console.error(`❌ Meeting Server Error: ${data.toString().trim()}`);
    });

    meetingServer.on('close', (code) => {
        console.log(`🔴 Meeting Server process exited with code ${code}`);
    });

    meetingServer.on('error', (error) => {
        console.error(`💥 Meeting Server failed to start: ${error.message}`);
    });

    return meetingServer;
}

// Handle graceful shutdown
function handleShutdown(processes) {
    console.log('\n🛑 Shutting down all services...');
    processes.forEach(process => {
        if (process && !process.killed) {
            process.kill('SIGTERM');
        }
    });
    process.exit(0);
}

// Main function to start all services
async function startAllServices() {
    console.log('🎯 Starting StudySync - Complete Stack');
    console.log('=' .repeat(60));
    
    try {
        // Install dependencies first
        await Promise.all([
            installPythonDependencies(),
            installVideoCallDependencies()
        ]);
        
        const processes = [];
        
        // Start friends backend first (port 5000)
        const friendsBackendProcess = startFriendsBackend();
        processes.push(friendsBackendProcess);
        
        // Wait a bit, then start video call server (port 5002)
        setTimeout(() => {
            const videoCallServerProcess = startVideoCallServer();
            processes.push(videoCallServerProcess);
        }, 2000);
        
        // Wait a bit more, then start summarization backend (port 5001)
        setTimeout(() => {
            const summarizationBackendProcess = startSummarizationBackend();
            processes.push(summarizationBackendProcess);
        }, 4000);
        
        // Wait a bit more, then start meeting server (port 5003)
        setTimeout(() => {
            const meetingServerProcess = startMeetingServer();
            processes.push(meetingServerProcess);
        }, 6000);
        
        // Wait a bit more, then start frontend
        setTimeout(() => {
            const frontendProcess = startFrontend();
            processes.push(frontendProcess);
        }, 8000);
        
        // Handle process termination
        process.on('SIGINT', () => handleShutdown(processes));
        process.on('SIGTERM', () => handleShutdown(processes));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('💥 Uncaught Exception:', error);
            handleShutdown(processes);
        });
    } catch (error) {
        console.error('💥 Failed to start services:', error.message);
        process.exit(1);
    }
}

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    console.log('🏭 Production mode - starting backends only');
    installPythonDependencies().then(() => {
        startFriendsBackend();
        setTimeout(() => startSummarizationBackend(), 2000);
    });
} else {
    startAllServices();
} 