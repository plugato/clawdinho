const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const conf = require('./core/config');
const { gemini, image, auth } = require('./core/gemini');

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('use-gl', 'angle');
  app.commandLine.appendSwitch('use-angle', 'swiftshader');
  app.commandLine.appendSwitch('enable-unsafe-swiftshader');
  app.commandLine.appendSwitch('disable-features', 'Vulkan');
}

const W = 340, H = 460;
let win;

// clica "através" da janela fora do avatar/balão
const setClickThrough = ignore => {
  if (process.platform === 'linux' && process.env.WAYLAND_DISPLAY) return;
  win.setIgnoreMouseEvents(ignore, { forward: true });
};

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    width: W, height: H,
    x: workArea.x + workArea.width - W - 10,
    y: workArea.y + workArea.height - H - 10,
    transparent: true, frame: false, resizable: false,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
  win.loadFile('index.html').then(() => {
    if (win.isDestroyed()) return;
    win.show();
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true);
    setClickThrough(true);
  }).catch(error => console.error('Falha ao abrir a interface:', error));

  // Wayland não fornece posição global confiável; nesse backend a UI usa coordenadas locais.
  if (!(process.platform === 'linux' && process.env.WAYLAND_DISPLAY)) {
    setInterval(() => {
      if (win.isDestroyed()) return;
      const p = screen.getCursorScreenPoint();
      const b = win.getBounds();
      win.webContents.send('cursor', { x: p.x - b.x, y: p.y - b.y });
    }, 33);
  }
}

ipcMain.on('mouse', (_, overUi) => setClickThrough(!overUi));
ipcMain.on('quit', () => app.quit());

// features/<nome>/main.js recebe o ctx; features/<nome>/ui.js é carregado no balão (ver README)
const dir = path.join(__dirname, 'features');
const features = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
const ctx = {
  app, ipc: ipcMain, conf, gemini, image, auth,
  send: (ch, ...a) => win && !win.isDestroyed() && win.webContents.send(ch, ...a),
  say: t => ctx.send('say', t),
  thinking: v => ctx.send('thinking', v),
};
for (const f of features) {
  const m = path.join(dir, f, 'main.js');
  if (fs.existsSync(m)) require(m)(ctx);
}
ipcMain.handle('features', () => features.filter(f => fs.existsSync(path.join(dir, f, 'ui.js'))));

// só um Clawdinho por vez
if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(createWindow);
