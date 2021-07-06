/* eslint global-require: "warn" */
/* eslint import/no-dynamic-require:"off" */
/* eslint guard-for-in: "warn" */
/* eslint no-restricted-syntax: "warn" */
/* eslint no-useless-escape: "warn" */
/* eslint prefer-destructuring: "warn" */

const exec = require("execa");
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { padEnd } = require('lodash');
const debug = require('debug')('wo:scripts/init');
const {resolve} = path;
//
const { logError,getPadLength, runGenerator,getGeneratorMeta,getGitBranchInfo } = require('../BasicUtil');
const {getGitBranchFiles} = require('../BasicUpdate');
// questions
const questions = {
  isCoverd: {
    name: 'isCovered',
    message: 'Current directory is not empty, would your like to cover it?',
    type: 'confirm',
    default: false,
  },
  name: {
    name: 'name',
    message: 'Input project name:',
    type: 'input',
    default: '',
  },
  type: {
    name: 'type',
    message: 'Select the generator boilerplate type',
    type: 'list',
  },
  branch: {
    name: 'branch',
    message: 'Input the template repository branch',
    type: 'input',
    default: 'master',
  },
}

/**
 * 模板type列表选择
 * @param types
 * @returns {[]}
 */
const generateTypeChoice = types => {
  const arr = [];
  Object.keys(types).forEach(key => {
    const type = types[key];
    arr.push({
      name: `${key.padEnd(6)} - ${chalk.gray(type && type.description ? type.description : key)}`,
      value: key,
      short: key,
    });
  });
  //
  return arr;
};
//
module.exports.run = async function(config){
  const { type, name, branch } = config;
  let current = path.normalize(process.cwd());
  current = current.replace(/\\/g, '/');
  // 当前目录不为空 提示是否覆盖安装
  const files = fs.readdirSync(current);
  if (files && files.length) {
    const answers = await inquirer.prompt([questions.isCoverd]);
    if (!answers.isCovered) {
      process.exit(0);
    }
  }
  const prompts = [];
  const metaDir = resolve(__dirname,'../meta/types.json');
  // 检测meta/types.json文件是否不存在
  if(!fs.existsSync(metaDir)) {
    //
    logError(chalk.red(`No meta config json file, to resolve this: wo update --meta`));
    process.exit(0);
  }
  // 项目名
  if (!name) {
    const res = /\/([^\/]+)$/.exec(current);
    questions.name.default = res[1];
    prompts.push(questions.name);
  }
  // 指定模板类型
  if (!type) {
    const types = require(metaDir);
    const generatorTypes = generateTypeChoice(types);
    questions.type.choices = generatorTypes;
    prompts.push(questions.type);
  }
  // 指定分支
  if (!branch) {
    const branchOptions = questions.branch || {};
    branchOptions.type = 'list';// 调整为list
    branchOptions.choices= async function(prompts){
      //
      const {remoteBranches,originName} = await getGitBranchInfo({
        type:prompts.type,
        branch:'master'
      });
      //
      return remoteBranches.map(branch => {
        //
        const key = branch.replace(`remotes/${originName}/`,'');
        //
        return {
          name: `${key.padEnd(6)} - ${chalk.gray(branch)}`,
          value: key,
          short: key,
        }
      });
    }
    prompts.push(branchOptions);
  }
  //
  const answers = await inquirer.prompt(prompts);
  for (const key in answers) {
    config[key] = answers[key];
  }
  // 获得指定分支代码
  await getGitBranchFiles(config);
  //
  try {
    //
    runGenerator({
      name:config.name,
      args:config.args,
      answers:config
    }).then(() => {
      const meta = getGeneratorMeta(config.type);
      const runInfo = meta.run;
      const padLength = getPadLength(runInfo);
      for (const info in runInfo) {
        //
        console.log(`   ${chalk.green(padEnd(info, padLength))}${runInfo[info] || ''}`);
      }
      // 结束进程
      process.exit();
    });
  } catch (e) {
    const info = `> Generate failed`;
    debug(info);
    logError(chalk.red(info), e);
    process.exit(1);
  }
};

// options
module.exports.options = {
  '--type':'all template project type',
  '--meta':'project meta config json file',
  '--name':'project name',
  // '--key':'project application key',
  // '--description':'project description',
  // '--repo':'project repository',
  '--branch':'select template branch ',
  // '--typescript':'whether to use typescript',
  // '--mobile':'whether to use ant design mobile,only fe type project',
  // '--port ':'csr server port',
  // '--ssr':'whether to use ssr',
  // '--ssr-port':'ssr server port,default use csr port,only ssr is true and fe type project'
};

// description
module.exports.description = 'to init project';
// usage
module.exports.usage = 'wo [init] [options]';
