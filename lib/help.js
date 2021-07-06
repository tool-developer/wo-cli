/* eslint global-require: "warn" */
/* eslint import/no-dynamic-require:"off" */
/* eslint guard-for-in: "warn" */
/* eslint no-restricted-syntax: "warn" */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { padEnd } = require('lodash');
const { getPadLength } = require('./BasicUtil');

//
function loadHelpOptions(scriptFile, cmd) {
  const current = require(scriptFile);
  const description = current.description || 'no cmd description';
  const {options} = current;
  const usage = current.usage || `wo ${cmd}`;
  //
  return {
    description,
    options,
    usage,
  };
}

//
function logMainHelpInfo(files) {
  console.log(`\n  Usage: wo <command> [options]\n`);
  console.log(`  Commands:\n`);
  const commands = {};
  files.forEach(file => {
    const cmd = file.replace(/\.js/, '');
    commands[cmd] = cmd;
  });
  const padLength = getPadLength(commands);
  const scriptFiles = path.resolve(__dirname, './scripts');
  for (const name in commands) {
    const opts = loadHelpOptions(path.resolve(scriptFiles, name));
    if (opts.hide !== true) {
      console.log(`    ${chalk.green(padEnd(name, padLength))}${opts.description || ''}`);
    }
  }
  console.log(
    `\n  Or run,\n  ${chalk.blue(`wo help [command]`)} for usage of a specific command.\n`,
  );
}
//
function logHelpForCommand(scriptFile, cmd) {
  const current = loadHelpOptions(scriptFile, cmd);
  const description = current.description || 'no cmd description';
  const {options} = current;
  const usage = current.usage || `wo ${cmd}`;
  console.log(`\n  Usage: ${usage}`);
  if (options) {
    console.log(`\n  Options:\n`);
    const padLength = getPadLength(options);
    for (const name in options) {
      console.log(`    ${chalk.green(padEnd(name, padLength))}${options[name]}`);
    }
  }
  if (description) {
    console.log(
      description
        .split('\n')
        .map(line => `  ${line}`)
        .join('\n'),
    );
  }
}
//
exports.run = function(opts = {}) {
  const args = opts._ || [];
  const cmd = args[2];
  // 支持wo page --help和wo help page
  const name = cmd === 'help' ? args[3] : args[2];
  const scriptFiles = path.resolve(__dirname, './scripts');
  const files = fs.readdirSync(scriptFiles);
  if (name) {
    if (!files.includes(`${name  }.js`)) {
      return console.log(`${name} is not a wo command, See 'wo --help'`);
    }
    return logHelpForCommand(path.resolve(scriptFiles, name), cmd);
  }
  return logMainHelpInfo(files);
};