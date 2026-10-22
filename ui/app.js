import { state } from './avatar.js';

const bridge = window.clawdinho;
const $ = id => document.getElementById(id);
const canvas = $('avatar'), bubble = $('bubble'), text = $('text'), pic = $('pic'), q = $('q');

bridge.on('cursor', c => state.cursor = c);

// --- voz ---
const voiceBtn = $('voice');
let voiceOn = true, typing;
try { voiceOn = localStorage.getItem('voice') !== 'off'; } catch {}
const paintVoice = () => voiceBtn.textContent = voiceOn ? '🔊' : '🔇';
paintVoice();
voiceBtn.onclick = () => {
  voiceOn = !voiceOn; paintVoice(); speechSynthesis.cancel();
  try { localStorage.setItem('voice', voiceOn ? 'on' : 'off'); } catch {}
};

const ptVoice = () => {
  const vs = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('pt'));
  return vs.find(v => /natural|online/i.test(v.name)) || vs.find(v => /br/i.test(v.lang)) || vs[0];
};
function speak(t) {
  speechSynthesis.cancel();
  if (!voiceOn) return;
  const u = new SpeechSynthesisUtterance(t);
  u.voice = ptVoice() || null; u.lang = 'pt-BR'; u.rate = 1.05; u.pitch = 1.15;
  u.onstart = () => state.talkUntil = Infinity;
  u.onend = u.onerror = () => state.talkUntil = 0;
  speechSynthesis.speak(u);
}

// --- balão ---
const open = () => bubble.classList.add('open');
// para de digitar/falar e limpa o texto
function clear() { clearInterval(typing); speechSynthesis.cancel(); open(); text.textContent = ''; }
function think() {
  clearInterval(typing); open();
  text.innerHTML = '<span class="dots"><span></span><span></span><span></span></span>';
}
const hidePic = () => { pic.hidden = true; pic.removeAttribute('src'); }; // sem src o stream para de baixar
const showPic = src => { open(); pic.src = src; pic.hidden = false; };
function say(t, keepPic) {
  if (!keepPic) hidePic();
  t = t.replace(/[*_#`]/g, '').trim(); // Gemini às vezes manda markdown
  clearInterval(typing); open(); text.textContent = '';
  state.talkUntil = performance.now() + Math.min(6000, t.length * 40);
  let i = 0;
  typing = setInterval(() => { text.textContent = t.slice(0, ++i * 2); if (i * 2 >= t.length) clearInterval(typing); }, 20);
  speak(t);
}
bridge.on('say', t => say(t, true)); // resposta mantém a imagem que estava aberta
bridge.on('thinking', v => { state.thinking = v; if (v) think(); });

// janela só captura o mouse quando ele está sobre o avatar/balão
document.querySelectorAll('.ui').forEach(el => {
  el.addEventListener('mouseenter', () => bridge.send('mouse', true));
  el.addEventListener('mouseleave', () => bridge.send('mouse', false));
});

// clique: conversar · arraste: mover · botão direito: sair
let drag = null, moved = false;
canvas.addEventListener('mousedown', e => { if (e.button === 0) { drag = { x: e.screenX, y: e.screenY }; moved = false; } });
addEventListener('mousemove', e => {
  if (!drag) return;
  const dx = e.screenX - drag.x, dy = e.screenY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) { moved = true; bridge.send('move', dx, dy); drag = { x: e.screenX, y: e.screenY }; }
});
addEventListener('mouseup', () => {
  if (drag && !moved) { if (!bubble.classList.contains('open')) say('Oi! Em que posso ajudar?'); q.focus(); }
  drag = null;
});
canvas.addEventListener('contextmenu', () => bridge.send('quit')); // confirm() bloqueava a janela
$('close').onclick = () => { bubble.classList.remove('open'); hidePic(); speechSynthesis.cancel(); };

// --- features: cada features/<nome>/ui.js exporta default (ui) => {} ---
const ui = {
  send: bridge.send, invoke: bridge.invoke, on: bridge.on, say, think, clear, open, showPic, hidePic,
  pic: () => pic.hidden ? '' : pic.src, // imagem aberta no balão, '' se nenhuma
  form: $('ask'), input: q,
  button(icon, title, onclick) { // botão no cabeçalho, antes do 🔊
    const b = Object.assign(document.createElement('button'), { textContent: icon, title, onclick });
    voiceBtn.before(b); return b;
  },
};
for (const f of await bridge.invoke('features')) {
  import(`../features/${f}/ui.js`).then(m => m.default(ui)).catch(e => console.error(`feature ${f}:`, e));
}
