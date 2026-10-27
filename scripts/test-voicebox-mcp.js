import { spawn } from 'child_process';

const proc = spawn('C:\\Program Files\\Voicebox\\voicebox-mcp.exe', [], {
  stdio: ['pipe', 'pipe', 'inherit']
});

function send(obj) {
  const reqStr = JSON.stringify(obj);
  proc.stdin.write(reqStr + '\n');
}

proc.stdout.on('data', (data) => {
  console.log('OUTPUT:', data.toString());
});

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' }
  }
});

setTimeout(() => {
  proc.kill();
  process.exit(0);
}, 3000);
