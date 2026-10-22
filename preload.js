const { contextBridge, ipcRenderer } = require('electron');

// ponte genérica: as features escolhem os próprios canais (ex.: 'chat:ask')
contextBridge.exposeInMainWorld('clawdinho', {
  send: (ch, ...a) => ipcRenderer.send(ch, ...a),
  invoke: (ch, ...a) => ipcRenderer.invoke(ch, ...a),
  on: (ch, fn) => ipcRenderer.on(ch, (_, ...a) => fn(...a)),
});
