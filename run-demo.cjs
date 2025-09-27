const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, prefix, message) {
  console.log(`${colors[color]}${colors.bright}[${prefix}]${colors.reset}${colors[color]} ${message}${colors.reset}`);
}

function startProcess(command, args, name, color, cwd = process.cwd()) {
  colorLog(color, name, `Starting ${name}...`);
  
  const proc = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: true
  });

  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        colorLog(color, name, line);
      });
    }
  });

  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        colorLog(color, name, line);
      });
    }
  });

  proc.on('close', (code) => {
    if (code === 0) {
      colorLog(color, name, `${name} exited successfully`);
    } else {
      colorLog('red', name, `${name} exited with code ${code}`);
    }
  });

  return proc;
}

console.log(`${colors.bright}${colors.cyan}`);
console.log('🚀 =========================================');
console.log('🏆 SMART INDIA HACKATHON 2025');
console.log('🏛️ Urban Guardians - Full Stack Demo');
console.log('🚀 =========================================');
console.log(`${colors.reset}`);

colorLog('yellow', 'DEMO', 'Starting Smart India Hackathon demo environment...');
colorLog('blue', 'INFO', 'Frontend: http://localhost:8080');
colorLog('blue', 'INFO', 'Backend API: http://localhost:5001/api');
colorLog('blue', 'INFO', 'Press Ctrl+C to stop all services');

console.log();

// Start backend demo server
const backendProcess = startProcess(
  'node',
  ['backend/demo-server.cjs'],
  'BACKEND',
  'green'
);

// Start frontend development server  
const frontendProcess = startProcess(
  'npm',
  ['run', 'dev'],
  'FRONTEND',
  'cyan'
);

// Handle graceful shutdown
process.on('SIGINT', () => {
  colorLog('yellow', 'DEMO', 'Shutting down demo environment...');
  
  backendProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  
  setTimeout(() => {
    colorLog('yellow', 'DEMO', 'Demo environment stopped');
    process.exit(0);
  }, 2000);
});

// Keep the main process alive
process.stdin.resume();