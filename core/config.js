const fs = require('fs');
const path = require('path');

// variável de ambiente ou arquivo na raiz do projeto (fora do git); vazio se nenhum
module.exports = (env, file) => process.env[env] || (() => {
  try { return fs.readFileSync(path.join(__dirname, '..', file), 'utf8').trim(); } catch { return ''; }
})();
