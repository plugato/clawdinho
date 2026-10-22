// escuta o tópico ntfy (EventSource reconecta sozinho)
export default async ui => {
  const url = await ui.invoke('alerts:url');
  if (!url) return;
  new EventSource(url.replace(/\/$/, '') + '/sse').onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.event !== 'message') return;
    const alert = [m.title, m.message].filter(Boolean).join(': ');
    if (!m.attachment?.url) return ui.say(alert);
    // mostra a foto já e só fala depois que o Gemini descrever a cena
    ui.think(); ui.showPic(m.attachment.url);
    ui.invoke('alerts:describe', alert, m.attachment.url)
      .then(d => ui.say(d ? `${alert}. ${d}` : alert, true), () => ui.say(alert, true));
  };
};
