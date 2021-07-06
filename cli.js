#!/usr/bin/env node

const yParser = require('yargs-parser');
const semver = require('semver');
const chalk = require('chalk');

const run = require('./lib/run');
const pkg = require('./package.json');
const help = require('./lib/help');

const args = yParser(process.argv.slice(0));
const cmd = args._[2] || '';
// 查看version
if (args.v || args.version || cmd === 'v' || cmd === 'version') {
  //
  console.log(pkg && pkg.version);
  process.exit(0);
}
// 用户输入help命令或者--help参数
if (args.help || args.h || cmd === 'help') {
  //
  help.run(args);
  process.exit(0);
}
// node version >= 8
if (!semver.satisfies(process.version, '>= 8.0.0')) {
  //
  console.error(chalk.red('✘ The generator will only work with Node v8.0.0 and up!'));
  process.exit(1);
}
//
run({
  cmd,
  args:args
});