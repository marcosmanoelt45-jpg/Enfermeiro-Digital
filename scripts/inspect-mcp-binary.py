import re

with open(r'C:\Program Files\Voicebox\voicebox-mcp.exe', 'rb') as f:
    raw = f.read()

idx = raw.find(b'mcp_shim')
if idx != -1:
    chunk = raw[idx:idx+50000]
    printable = ''.join(chr(b) if 32 <= b < 127 else '\n' for b in chunk)
    lines = [l.strip() for l in printable.split('\n') if len(l.strip()) > 3]
    print('LINHAS:\n' + '\n'.join(lines[:60]))
