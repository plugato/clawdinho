const { session } = require('electron');

// câmera ao vivo do camera-monitor. Em casa, STREAM_URL pode ter usuário:senha@ (login básico
// direto no Pi); de fora, o domínio está atrás do Cloudflare Access e entra com o service token
// CF_ACCESS_CLIENT_ID/CF_ACCESS_CLIENT_SECRET
module.exports = ({ app, ipc, conf, auth }) => {
  const url = new URL(conf('STREAM_URL', 'stream.txt') || 'https://camera.ancalagon.com.br/stream');
  const headers = {};
  if (url.username) {
    headers.Authorization = 'Basic ' + Buffer.from(`${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`).toString('base64');
    url.username = url.password = '';
  }
  const id = conf('CF_ACCESS_CLIENT_ID'), secret = conf('CF_ACCESS_CLIENT_SECRET');
  if (id && secret) Object.assign(headers, { 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret });
  if (Object.keys(headers).length) {
    auth.set(url.origin, headers); // image() do Gemini
    // o Chromium não pede login para <img> de outra origem, então os headers vão em toda requisição à câmera
    app.whenReady().then(() => session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: [url.origin + '/*'] },
      (d, cb) => cb({ requestHeaders: { ...d.requestHeaders, ...headers } })));
  }
  ipc.handle('camera:url', () => url.href);
};
