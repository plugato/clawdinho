# Clawdinho

Assistente de mesa (Electron) que vive no canto da tela: conversa pelo Gemini, mostra a câmera do
[camera-monitor](https://github.com/plugato/camera-monitor) e fala os alertas dela.

```
start.bat            abre o app à mão no Windows
main.js              janela, mouse, carregador de features
preload.js           ponte genérica send/invoke/on entre balão e main
index.html           markup e CSS do balão
core/config.js       conf(ENV, 'arquivo.txt')
core/gemini.js       gemini(contents), image(url), auth
ui/app.js            balão, voz, arrastar, carregador de features no balão
ui/avatar.js         o bonequinho 3D
features/chat        caixa de pergunta → Gemini (com a imagem aberta, se houver)
features/camera      botão 📷: stream ao vivo no balão
features/alerts      alertas do ntfy, foto descrita pelo Gemini
features/update      abre com o login (Windows e Linux) e se atualiza pelo git
```

## Início automático e atualização (Windows e Linux)

Rode do clone do GitHub (`git clone` + `npm install`) e abra uma vez (`start.bat` no Windows,
`npm start` no Linux). A partir daí o app abre sozinho no login: no Windows fica em Configurações →
Apps → Inicialização; no Linux, em `~/.config/autostart/clawdinho.desktop`. A cada hora ele puxa a
`main` do GitHub: se mudou, faz fast-forward, roda `npm install` quando `package.json` mudou e
reinicia sozinho. Precisa de `git` e `npm` no PATH. Com alterações locais em arquivos versionados,
ou commits locais que ainda não estão no GitHub, ele não atualiza. Para desligar as duas coisas,
apague `features/update` e tire o Clawdinho da inicialização.

## Configuração

Variável de ambiente ou arquivo na raiz (fora do git):

As variáveis podem ser definidas no ambiente do sistema ou em `.env` na raiz. Para compatibilidade, a chave do Gemini e o stream também podem continuar em `key.txt` e `stream.txt`.

| Variável | Para quê |
| --- | --- |
| `GEMINI_API_KEY` | chave do Gemini |
| `NTFY_URL` | tópico ntfy do camera-monitor; vazio = sem alertas |
| `STREAM_URL` | stream MJPEG (padrão `https://camera.ancalagon.com.br/stream`); em casa aceita `http://usuario:senha@ip:8091/stream` |
| `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` | service token do Cloudflare Access, para ver a câmera de fora de casa |
| `GEMINI_MODEL` | modelo (padrão `gemini-3.5-flash-lite`) |

## Nova feature

Crie `features/<nome>/` com um ou os dois arquivos. Ela é carregada sozinha; apagar a pasta a desliga.

`main.js` (processo principal, CommonJS):

```js
module.exports = ctx => {
  // ctx: app, ipc (ipcMain), conf, gemini, image, auth, send(canal, ...), say(texto), thinking(bool)
  ctx.ipc.handle('<nome>:algo', async () => ctx.gemini([{ role: 'user', parts: [{ text: 'oi' }] }]));
};
```

`ui.js` (balão, ES module):

```js
export default ui => {
  // ui: send, invoke, on, say(t, manterImagem), think(), clear(), open(),
  //     showPic(src), hidePic(), pic(), form, input, button(ícone, título, onclick)
  ui.button('⭐', 'Minha feature', async () => ui.say(await ui.invoke('<nome>:algo')));
};
```

Use `<nome>:` como prefixo dos canais IPC para não colidir com outras features.
