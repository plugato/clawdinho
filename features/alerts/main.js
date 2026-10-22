// alertas do camera-monitor: mesmo tópico ntfy dele (NTFY_URL); vazio = não escuta
module.exports = ({ ipc, conf, gemini, image }) => {
  ipc.handle('alerts:url', () => conf('NTFY_URL', 'ntfy.txt'));

  // foto do alerta -> o que parece estar acontecendo; fica fora do histórico da conversa
  ipc.handle('alerts:describe', async (_, alert, url) => gemini([{ role: 'user', parts: [
    { inline_data: await image(url) },
    { text: `Foto do alerta "${alert}" da câmera de segurança do portão de casa. Em até 2 frases, diga o que você acha que está acontecendo. Só descreva, sem perguntas nem oferecer ações.` },
  ] }]));
};
