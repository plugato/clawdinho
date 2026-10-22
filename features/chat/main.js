// conversa com o Gemini; pic é a imagem aberta no balão (stream ou foto de alerta),
// vai só nesta pergunta e o histórico guarda o texto
module.exports = ({ ipc, gemini, image, say, thinking }) => {
  const history = []; // memória da conversa enquanto o app está aberto
  let busy = false;

  ipc.on('chat:ask', async (_, question, pic) => {
    if (busy) return;
    busy = true;
    thinking(true);
    history.push({ role: 'user', parts: [{ text: question }] });
    try {
      const contents = history.slice(-21);
      if (pic) contents[contents.length - 1] = { role: 'user', parts: [{ inline_data: await image(pic) }, { text: question }] };
      const text = await gemini(contents) || 'Hmm, fiquei sem palavras.';
      history.push({ role: 'model', parts: [{ text }] });
      say(text);
    } catch (e) {
      history.pop();
      say(`Ops, deu erro: ${e.message}`);
    } finally {
      busy = false;
      thinking(false);
    }
  });
};
