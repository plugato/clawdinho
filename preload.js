const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clawdinho', {
  mouse: overUi => ipcRenderer.send('mouse', overUi),
  ask: q => ipcRenderer.send('ask', q),
  describe: (alert, url) => ipcRenderer.invoke('describe', alert, url),
  move: (dx, dy) => ipcRenderer.send('move', dx, dy),
  quit: () => ipcRenderer.send('quit'),
  on: (ch, fn) => ipcRenderer.on(ch, (_, v) => fn(v)),
});
