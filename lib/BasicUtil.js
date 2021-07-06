/* eslint global-require: "warn" */
/* eslint import/no-dynamic-require:"off" */
/* eslint guard-for-in: "warn" */
/* eslint no-restricted-syntax: "warn" */

const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const exec = require("execa");
//
const downLoad = require('./download');
const {resolve} = path;
//
exports.cloneTemplate = async (t, branch, templatePath) => {
  const types = require(path.resolve(__dirname,'./meta/types.json'));
  const type = types[t];
  const {repository} = type;
  //
  await downLoad({ repository, templatePath, branch });
};
//
exports.getPrompting = function(opts = {}, data = {}) {
  const questions = [];
  const keys = Object.keys(opts);
  //
  keys.forEach(key => {
    const opt = opts[key] || {};
    // prompts.name处理，未设置name值，使用key值作为name值
    const name = opt.name || key;
    // 只改写了default，其他函数类未改写
    /* const defaultFun = opt['default'];
    if(typeof defaultFun === 'function'){
      opt.default = function(args){
        //
        defaultFun.call(this,{...args,...data})
      }
    }
     */
    //
    opt.name = name;
    //
    if (data[name] === undefined) {
      //
      questions.push(opt);
    }
  });
  //
  return questions;
};

/**
 * 模板同时支持meta.js和meta.json
 * @param type
 * @returns {*}
 */
exports.getGeneratorMeta = function(type){
  const metaJSFile = path.resolve(__dirname,`./generators/${type}/meta.js`);
  const metaJSONFile = path.resolve(__dirname,`./generators/${type}/meta.json`);
  let meta = null;
  if(fs.existsSync(metaJSFile)){
    meta = require(metaJSFile);
  }else{
    meta = require(metaJSONFile);
  }
  const {run,prompts} = meta;
  if(run && typeof run === 'function'){
    //
    meta.run = run();
  }
  //
  if(prompts && typeof prompts === 'function'){
    //
    meta.prompts = prompts();
  }
  //
  return meta;
}
//
exports.getPadLength = function(obj, len) {
  let longest = len || 10;
  // eslint-disable-line no-restricted-syntax
  for (const name in obj) {
    if (name.length + 1 > longest) {
      //
      longest = name.length + 1;
    }
  }
  //
  return longest;
};

//
exports.runGenerator = async ({ name = '', cwd = process.cwd(), args = [],answers }) => {
  //
  const generatorOpts = {
    name,
    env: {
      cwd,
    },
    args,
    answers,
    resolved: require.resolve('./generator'),
  };
  /*
  //
  const indexPath = path.resolve(tmpPath,'./index.js');
  //
  if(fs.existsSync(indexPath)){
    //
    const Generator = require(indexPath);
    await new Generator(generatorOpts).run();
  }
  */
  // 初始化项目
  return new Promise(resolve => {
    //
    const Generator = require('./generator');
    const generator = new Generator(generatorOpts);
    //
    return (
      generator &&
      generator.run(() => {
        //
        console.log('\n✨ File Generate Done!');
        resolve(true);
      })
    );
  }).catch(function(e) {
    //
    console.log('run generator', e);
  });
};
exports.logGreen = (...args) => {
  //
  console.log(`${chalk.green('>')}`, chalk.green(...args));
};
exports.logError = (...args) => {
  //
  console.log(`\n${chalk.red('>')}`, chalk.red(...args),'\n');
};
exports.logWarn = (...args) => {
  //
  console.log(`\n${chalk.yellow('>')}`, chalk.yellow(...args),'\n');
};
/**
 * ts文件识别
 * @param f
 * @returns {boolean|PrimitiveChain<boolean>|((string: string) => boolean)}
 */
exports.isTsFile = f => {
  //
  return f.endsWith('.ts') || f.endsWith('.tsx') || ['tsconfig.json', 'tslint.yml'].includes(f);
};
/**
 * git文件识别，忽略.gitignore
 * @param f
 * @returns {boolean|boolean}
 */
exports.isGitFile = f => {
  //
  return f.startsWith('.git') && f !== '.gitignore';
}

// 获取分支信息
exports.getGitBranchInfo = async function(config){
  //
  const typeDir = resolve(__dirname,`./generators/${config.type}/`);
  // 本地模板目录是否存在，不存在，则创建
  if(!fs.existsSync(typeDir)) {
    // 克隆模板
    await exports.cloneTemplate(config.type, config.branch||'main', typeDir);
  }else{
    try{
      // 更新本地仓库
      await exec("git", ["fetch"], { cwd: typeDir });
    }catch(e){
      //
      exports.logError(chalk.red(`git fetch error: ${e.message}`));
    }
  }
  // 获取远端，以及本地分支
  const result = await exec("git", ["branch","-a"], { cwd: typeDir });
  const stdout = result.all || result.stdout;
  const branches = stdout ? stdout.split("\n") : [];
  //
  const headReg = /remotes\/([\w-]+)\/HEAD/;
  const remoteReg = /^remotes\//;
  // 获取HEAD分支
  let currentHeadBranch = '';
  // 远端所有分支
  const remoteBranches = [];
  // 本地所有分支
  const localBranches = [];

  branches.forEach(item => {
    item = item.trim();
    if(headReg.test(item)){
      //
      currentHeadBranch = item;
    }else if(remoteReg.test(item)){
      //
      remoteBranches.push(item);
    }else{
      // '* main'
      item = item.replace(/\*\s+/,'');
      //
      localBranches.push(item);
    }
  });
  //
  const originNameMatch = currentHeadBranch.match(headReg);
  const originName = originNameMatch && originNameMatch[1] || 'origin';

  //
  return {
    remoteBranches,
    localBranches,
    currentHeadBranch,
    originName
  }
}  
/**
 * 读物文件内容
 * @param {*} fileSrc 
 */
exports.readFileStatContent = function(fileSrc){
  try {
    const stat = fs.statSync(fileSrc);
    // 当前路径为文件
    if (stat.isFile()) {
      //
      const content = fs.readFileSync(fileSrc).toString();
      //
      return {
        stat,
        content
      }
    }
    //
    return {
      stat
    }
  } catch (e) {}
  //
  return {}
}
