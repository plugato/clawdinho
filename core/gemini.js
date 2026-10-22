const conf = require('./config');

// Google Gemini, plano gratuito — chave em https://aistudio.google.com/apikey
// Vai para o Google só o que as features mandam por aqui: o texto que você digita, a foto
// de cada alerta e a imagem aberta no balão quando você pergunta com ela na tela.
// Nada de captura de tela ou monitoramento do PC.
const KEY = conf('GEMINI_API_KEY', 'key.txt');
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const SYSTEM = `Você é o Clawdinho, um assistente de mesa estilo "Clips" do Office, que vive no canto da tela do usuário.
Responda em português, de forma curta (até 3 frases), útil e com tom simpático e leve.`;

async function gemini(contents) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text).join('');
}

// origem -> header Authorization (a feature camera registra o login do Pi)
const auth = new Map();

// imagem de uma URL como inline_data do Gemini; MJPEG vira só o quadro atual
async function image(url) {
  const a = auth.get(new URL(url).origin);
  const res = await fetch(url, { headers: a ? { Authorization: a } : {} });
  if (!res.ok) throw new Error(`imagem ${res.status}`);
  const type = res.headers.get('content-type') || 'image/jpeg';
  if (!type.startsWith('multipart/')) return { mime_type: type, data: Buffer.from(await res.arrayBuffer()).toString('base64') };
  const reader = res.body.getReader();
  let buf = Buffer.alloc(0);
  for (;;) {
    const { value, done } = await reader.read();
    if (done) throw new Error('stream acabou sem quadro');
    buf = Buffer.concat([buf, value]);
    const s = buf.indexOf('\xff\xd8', 0, 'latin1'), e = s < 0 ? -1 : buf.indexOf('\xff\xd9', s + 2, 'latin1');
    if (e > 0) { reader.cancel(); return { mime_type: 'image/jpeg', data: buf.subarray(s, e + 2).toString('base64') }; }
  }
}

module.exports = { gemini, image, auth };
