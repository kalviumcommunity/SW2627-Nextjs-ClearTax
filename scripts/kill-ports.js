const { execSync } = require('child_process');

const ports = [3000, 5000];

console.log('[Kill-Ports] Checking and freeing ports:', ports.join(', '));

for (const port of ports) {
  try {
    if (process.platform === 'win32') {
      let stdout;
      try {
        stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      } catch (err) {
        // netstat returns non-zero code if no match is found
        continue;
      }
      
      const lines = stdout.split('\n');
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (parseInt(pid, 10) > 0) {
            pids.add(pid);
          }
        }
      }
      
      for (const pid of pids) {
        console.log(`[Kill-Ports] Killing process ${pid} on port ${port}...`);
        try {
          execSync(`taskkill /F /PID ${pid}`);
        } catch (err) {
          // ignore error if process already exited
        }
      }
    } else {
      // macOS / Linux
      try {
        const stdout = execSync(`lsof -t -i:${port}`, { encoding: 'utf8' });
        const pids = stdout.trim().split('\n').filter(Boolean);
        for (const pid of pids) {
          console.log(`[Kill-Ports] Killing process ${pid} on port ${port}...`);
          execSync(`kill -9 ${pid}`);
        }
      } catch (err) {
        // ignore error if no process found or failed to kill
      }
    }
  } catch (e) {
    // ignore overall loop errors
  }
}

console.log('[Kill-Ports] Port cleanup finished.');
