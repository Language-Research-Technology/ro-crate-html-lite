import nunjucks from "nunjucks";
import { program } from 'commander';
import { fetchMapping, fetchJson } from './lib/utils.js';

var cmdpath = null;

program
  .name('precompile')
  .arguments('<path>')
  .action(function (path) {
    cmdpath = path;
  })
  .parse(process.argv);


const opts = program.opts();
const env = new nunjucks.Environment();

// async filters must be known at compile-time
//env.addFilter('asyncFilter', function (val, cb) {
  // do something
//}, true);

console.log(nunjucks.precompile(cmdpath, {
  env,
  name: opts.name,
  wrapper: (templates) => 'export const templates = {' + templates.map(t => `'${t.name}': (() => { ${t.template} })()`).join(',') + '};'
}));

