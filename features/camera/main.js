const { session } = require('electron');

// câmera ao vivo do camera-monitor. stream.txt pode ter usuário:senha@ (acesso direto
// na rede local, login básico)
module.exports = ({ app, ipc, conf, auth }) => {
  const url = new URL(conf('STREAM_URL', 'stream.txt') || 'https://camera.ancalagon.com.br/stream');
  if (url.username) {
    const header = 'Basic ' + Buffer.from(`${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`).toString('base64');
    auth.set(url.origin, header); // image() do Gemini
    // o Chromium não pede login para <img> de outra origem, então o header vai em toda requisição ao Pi
    app.whenReady().then(() => session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: [url.origin + '/*'] },
      (d, cb) => cb({ requestHeaders: { ...d.requestHeaders, Authorization: header } })));
    url.username = url.password = '';
  }
  ipc.handle('camera:url', () => url.href);
};
