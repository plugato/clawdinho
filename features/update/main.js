const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Abre junto com o login e se atualiza sozinho pelo git (o app roda de um clone do GitHub).
// A cada hora: se a main do GitHub andou, faz fast-forward, roda npm install quando as
// dependências mudaram e reinicia. Alterações locais em arquivos versionados = não atualiza.
const ROOT = path.join(__dirname, '..', '..');
const HOUR = 60 * 60 * 1000;

const run = (cmd, ...args) => new Promise((ok, fail) => execFile(cmd, args,
  { cwd: ROOT, shell: true, windowsHide: true, timeout: 10 * 60 * 1000 },
  (e, out, err) => e ? fail(new Error(`${cmd} ${args.join(' ')}: ${err || e.message}`)) : ok(out.trim())));

async function update({ app, say }) {
  // o npm install reescreve o package-lock.json; isso não conta como alteração local
  if (await run('git', 'status', '--porcelain', '--untracked-files=no', '--', '.', '":!package-lock.json"'))
    return console.log('update: alterações locais, pulando');
  await run('git', 'fetch', '--quiet', 'origin');
  const [head, remote] = [await run('git', 'rev-parse', 'HEAD'), await run('git', 'rev-parse', '@{u}')];
  if (head === remote) return;
  if (await run('git', 'merge-base', '--is-ancestor', 'HEAD', '@{u}').then(() => false, () => true))
    return console.log('update: há commits locais que não estão no GitHub, pulando');
  const changed = (await run('git', 'diff', '--name-only', 'HEAD', '@{u}')).split(/\r?\n/);
  await run('git', 'checkout', '--', 'package-lock.json');
  await run('git', 'merge', '--ff-only', '--quiet', '@{u}');
  if (changed.some(f => /^package(-lock)?\.json$/.test(f))) await run('npm', 'install', '--no-audit', '--no-fund');
  say('Chegou versão nova, já volto! 🔄');
  setTimeout(() => { app.relaunch(); app.exit(0); }, 3000);
}

// electron <pasta do projeto>, igual ao start.bat / npm start
function autostart(app) {
  if (process.platform !== 'linux')
    return app.setLoginItemSettings({ openAtLogin: true, name: 'Clawdinho', path: process.execPath, args: [ROOT] });
  // Linux: entrada XDG em ~/.config/autostart (GNOME, KDE, COSMIC…)
  const dir = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'autostart');
  const file = path.join(dir, 'clawdinho.desktop');
  const entry = `[Desktop Entry]
Type=Application
Name=Clawdinho
Comment=Assistente de mesa
Exec="${process.execPath}" "${ROOT}"
Path=${ROOT}
Terminal=false
X-GNOME-Autostart-enabled=true
`;
  try {
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === entry) return;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, entry);
  } catch (e) { console.error('autostart:', e.message); }
}

module.exports = ctx => {
  const { app } = ctx;
  autostart(app);
  let busy = false;
  const check = () => {
    if (busy) return;
    busy = true;
    update(ctx).catch(e => console.error('update:', e.message)).finally(() => { busy = false; });
  };
  app.whenReady().then(() => { setTimeout(check, 30 * 1000); setInterval(check, HOUR); });
};
