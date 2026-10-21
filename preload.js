const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clawdinho', {
  mouse: overUi => ipcRenderer.send('mouse', overUi),
  ask: q => ipcRenderer.send('ask', q),
  move: (dx, dy) => ipcRenderer.send('move', dx, dy),
  stream: () => ipcRenderer.send('stream'),
  quit: () => ipcRenderer.send('quit'),
  on: (ch, fn) => ipcRenderer.on(ch, (_, v) => fn(v)),
});
