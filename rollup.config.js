import path from 'path';
import fs from 'fs';
import { version } from './package.json';

console.info(`Scriptable Template v${version}`);

const config = {
  author: 'Honye',
  input: './src',
  dest: 'dist'
};

const files = fs.readdirSync(config.input);
const modules = [];
files.forEach((filename) => {
  const matches = filename.match(/(^.+?)(\.js)$/);
  if (matches) {
    const [name, suffix] = matches.splice(1);
    let conf = {};
    try {
      conf = require(`./src/${name}.json`);
    } catch (e) {}
    const annotations = [];
    if (conf.description) {
      const { description } = conf;
      if (Array.isArray(description)) {
        for (const item of description) {
          annotations.push(` * ${item}`);
        }
      } else {
        annotations.push(` * ${description}`);
      }
      annotations.push(' *');
    }
    annotations.push(` * @version ${conf.version || '1.0.0'}`);
    if (config.author) {
      annotations.push(` * @author ${conf.author || config.author}`);
    }
    const banners = [
      '/**\n' + annotations.join('\n') + '\n */\n'
    ]
    if (conf.setting) {
      const { setting } = conf;
      const items = [];
      for (const key in setting) {
        items.push(`${key}: ${setting[key]};`)
      }
      if (items.length) {
        banners.unshift(
          '// Variables used by Scriptable.\n' +
          '// These must be at the very top of the file. Do not edit.\n' +
          `// ${items.join(' ')}`
        );
      }
    }
    modules.push({
      input: `./src/${filename}`,
      output: {
        banner: banners.join('\n'),
        file: path.join(
          config.dest,
          conf.name ? (conf.name + suffix) : filename
        ),
        format: 'es'
      }
    });
  }
});

export default modules;
