import * as THREE from 'three';

// estado que o balão mexe e a animação lê
export const state = { cursor: { x: 0, y: 0 }, thinking: false, talkUntil: 0 };

const canvas = document.getElementById('avatar');

// --- cena 3D com fundo transparente ---
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(200, 200, false);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 6);
scene.add(new THREE.HemisphereLight(0xffffff, 0x553322, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(2, 3, 4); scene.add(sun);

// Clawdinho: bloco laranja com olhos, bracinhos e 4 patinhas (estilo voxel)
const orange = new THREE.MeshStandardMaterial({ color: 0xd77757, roughness: 0.6, flatShading: true });
const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 });
const box = (w, h, d, mat, x, y, z, parent) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); parent.add(m); return m;
};
const body = new THREE.Group(); scene.add(body);
box(2.2, 1.3, 1.0, orange, 0, 0.2, 0, body);                       // tronco
const arms = [-1, 1].map(s => box(0.35, 0.35, 0.6, orange, s * 1.27, 0.1, 0, body));
const legs = [-0.8, -0.3, 0.3, 0.8].map(x => box(0.22, 0.5, 0.5, orange, x, -0.7, 0, body));
const eyes = [-0.5, 0.5].map(x => box(0.18, 0.4, 0.05, black, x, 0.35, 0.52, body));

// --- animação ---
const rect = () => canvas.getBoundingClientRect();
function frame(t) {
  t /= 1000;
  const { cursor, thinking } = state;
  const talking = performance.now() < state.talkUntil;
  // patinhas andam quando fala/pensa
  legs.forEach((l, i) => l.position.y = -0.7 + ((talking || thinking) ? Math.max(0, Math.sin(t * 14 + i * Math.PI / 2)) * 0.12 : 0));
  arms.forEach((a, i) => a.position.y = 0.1 + Math.sin(t * (thinking ? 10 : 2) + i * Math.PI) * 0.06);

  // olhar para o cursor (posição global da tela)
  const r = rect();
  const dx = (cursor.x - (r.left + r.width / 2)) / 600;
  const dy = (cursor.y - (r.top + r.height / 2)) / 600;
  const lx = Math.max(-1, Math.min(1, dx)), ly = Math.max(-1, Math.min(1, dy));
  body.rotation.y += ((thinking ? Math.sin(t * 6) * 0.4 : lx * 0.5) - body.rotation.y) * 0.1;
  body.rotation.x += (ly * 0.3 - body.rotation.x) * 0.1;
  eyes.forEach((e, i) => {
    e.position.x = (i ? 0.5 : -0.5) + lx * 0.12; e.position.y = 0.35 - ly * 0.1;
    e.scale.y = (t % 4 < 0.12) ? 0.15 : 1; // piscar
  });

  body.position.y = Math.sin(t * 2) * 0.05 + (talking ? Math.abs(Math.sin(t * 15)) * 0.15 : 0);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
