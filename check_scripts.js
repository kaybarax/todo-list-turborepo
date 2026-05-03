const fs = require('fs');
const path = require('path');
const glob = require('glob');

const dirs = ['apps/*', 'packages/*'];
const requiredScripts = {
  web: ['build', 'typecheck', 'lint', 'test', 'start'],
  api: ['build', 'typecheck', 'lint', 'test', 'start'],
  ingestion: ['build', 'typecheck', 'lint', 'test', 'start'],
  mobile: ['build', 'typecheck', 'lint', 'test', 'start'],
  'smart-contracts': ['build', 'typecheck', 'lint', 'test'],
  'ui-web': ['build', 'typecheck', 'lint', 'test'],
  'ui-mobile': ['build', 'typecheck', 'lint', 'test'],
  services: ['build', 'typecheck', 'lint', 'test'],
  utils: ['build', 'typecheck', 'lint', 'test'],
  config: ['build', 'typecheck', 'lint', 'test'],
  tsconfig: [],
  'eslint-config': [],
};

glob('{apps/*,packages/*}/package.json', (err, files) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const scripts = data.scripts || {};
      const dirName = path.basename(path.dirname(file));

      console.log(`\n=== ${dirName} ===`);
      console.log(`Scripts:`, Object.keys(scripts).join(', '));
      const expected = requiredScripts[dirName] || ['build', 'typecheck', 'lint', 'test'];
      const missing = expected.filter(s => !scripts[s]);
      if (missing.length > 0) {
        console.log(`Missing expected: ${missing.join(', ')}`);
      }
    } catch (e) {
      console.log(`Error reading ${file}`);
    }
  });
});
