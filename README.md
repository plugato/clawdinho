# Clawdinho

Assistente de mesa (Electron) que vive no canto da tela: conversa pelo Gemini, mostra a câmera do
[camera-monitor](https://github.com/plugato/camera-monitor) e fala os alertas dela.

```
start.bat            abre o app (é o que a inicialização do Windows chama)
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
```

## Configuração

Variável de ambiente ou arquivo na raiz (fora do git):

| Variável | Arquivo | Para quê |
| --- | --- | --- |
| `GEMINI_API_KEY` | `key.txt` | chave do Gemini |
| `NTFY_URL` | `ntfy.txt` | tópico ntfy do camera-monitor; vazio = sem alertas |
| `STREAM_URL` | `stream.txt` | stream MJPEG; aceita `http://usuario:senha@ip:8091/stream` |
| `GEMINI_MODEL` | | modelo (padrão `gemini-3.5-flash-lite`) |

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
