const { app, BrowserWindow, ipcMain, screen, session } = require('electron');
const path = require('path');

// Google Gemini, plano gratuito — chave em https://aistudio.google.com/apikey
// Só o texto que você digita é enviado. Nada de captura de tela ou monitoramento.
const conf = (env, file) => process.env[env] || (() => { try { return require('fs').readFileSync(path.join(__dirname, file), 'utf8').trim(); } catch { return ''; } })();
const KEY = conf('GEMINI_API_KEY', 'key.txt');
// mesmo tópico ntfy do camera-monitor (NTFY_URL); vazio = não escuta
const NTFY = conf('NTFY_URL', 'ntfy.txt');
const STREAM = conf('STREAM_URL', 'stream.txt') || 'https://camera.ancalagon.com.br/stream';
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const W = 340, H = 460;

const SYSTEM = `Você é o Clawdinho, um assistente de mesa estilo "Clips" do Office, que vive no canto da tela do usuário.
Responda em português, de forma curta (até 3 frases), útil e com tom simpático e leve.`;

let win;

// clica "através" da janela fora do avatar/balão
const setClickThrough = ignore => win.setIgnoreMouseEvents(ignore, { forward: true });

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
  setClickThrough(true);
  win.loadFile('index.html');
  win.webContents.on('did-finish-load', () => {
    NTFY && win.webContents.send('ntfy', NTFY);
    win.webContents.send('stream', STREAM.replace(/\/\/[^/@]*@/, '//'));
  });

  // posição do mouse só para os olhos seguirem o cursor; fica local, não é enviada a lugar nenhum
  setInterval(() => {
    if (win.isDestroyed()) return;
    const p = screen.getCursorScreenPoint();
    const b = win.getBounds();
    win.webContents.send('cursor', { x: p.x - b.x, y: p.y - b.y });
  }, 33);
}

const history = []; // memória da conversa enquanto o app está aberto
let busy = false;
async function askModel(question) {
  if (busy) return;
  busy = true;
  win.webContents.send('thinking', true);
  history.push({ role: 'user', parts: [{ text: question }] });
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents: history.slice(-21) }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text).join('') || 'Hmm, fiquei sem palavras.';
    history.push({ role: 'model', parts: [{ text }] });
    win.webContents.send('tip', text);
  } catch (e) {
    history.pop();
    win.webContents.send('tip', `Ops, deu erro: ${e.message}`);
  } finally {
    busy = false;
    win.webContents.send('thinking', false);
  }
}

ipcMain.on('mouse', (_, overUi) => setClickThrough(!overUi));
ipcMain.on('ask', (_, q) => askModel(q));
ipcMain.on('move', (_, dx, dy) => {
  const [x, y] = win.getPosition();
  win.setPosition(x + dx, y + dy);
});
ipcMain.on('quit', () => app.quit());

// stream.txt pode ter usuário:senha@ (acesso direto na rede local, login básico)
// o Chromium não pede login para <img> de outra origem, então o header vai em toda requisição ao Pi
const cam = new URL(STREAM);
const camAuth = cam.username && 'Basic ' + Buffer.from(`${decodeURIComponent(cam.username)}:${decodeURIComponent(cam.password)}`).toString('base64');
app.whenReady().then(() => camAuth && session.defaultSession.webRequest.onBeforeSendHeaders(
  { urls: [cam.origin + '/*'] },
  (d, cb) => cb({ requestHeaders: { ...d.requestHeaders, Authorization: camAuth } })));

// só um Clawdinho por vez
if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(createWindow);
