/* eslint no-useless-escape: "warn" */
/* eslint guard-for-in: "warn" */
/* eslint no-restricted-syntax: "warn" */
// const debug = require('debug')('wo:scripts/page');
const chalk = require('chalk');
const path = require('path');
const glob = require('glob');
const exfs = require('fs-extra');
const { existsSync, statSync, readdirSync } = require('fs-extra');
const memFs = require('mem-fs');
const editor = require('mem-fs-editor');

const { logGreen, logError } = require('../BasicUtil');
const parse = require('../parse');

const store = memFs.create();
const fs = editor.create(store);
const woOptions = parse.load() || {};

//
function templateFiles(dir){
  //
  const files = readdirSync(dir);
  console.log(`\n  template list:`);
  //
  for(const name in files){
    //
    console.log(chalk.green(`    ${files[name]}`));
  }
  console.log(`\n  wo page [page name] --template=${files[0]}`);
}

/**
 * 只有index.*文件，不能含有目录，及其他文件名
 * @param dir
 * @returns {boolean}
 */
function isIndexFiles(dir){
  const files = readdirSync(dir,{
    withFileTypes:true
  });
  //
  for(const name in files){
    //
    const file = files[name];
    // 含有目录
    if(file.isDirectory()){
      //
      return false;
    }
    // 非index.*命名文件
    if(!/^index\.[\w]+/.test(file.name)){
      //
      return false;
    }
  }
  //
  return true;
}

exports.run = async (opts = []) => {
  const args = opts._ || [];
  // 页面名称
  let name = args[3];
  // 页面模板 默认选择index模板
  const template = opts.template || opts.t || 'index';
  // 是否指定页面模板名称，指定则不自动创建index.*文件
  let noIndexFile = opts.index === false || opts.notIndex;
  // 项目模板类型 ae fe wo...
  const type = opts.type || woOptions.TYPE;
  if (!type) {
    //
    return logError(`Please enter the --type option , see the wo page --type fe`);
  }
  //
  const tmpPath = path.resolve(__dirname, `../generators/${type}`);
  const pageSourcePath = path.resolve(__dirname, `../generators/${type}/pages`);
  //
  // await cloneTemplate(type, '', tmpPath);
  if (opts.list) {
    if(!exfs.existsSync(tmpPath)){
      //
      logError(`No '${type}' template file, to resolve this: wo update --type ${type}`);
      process.exit(0);
    }
    //
    return templateFiles(pageSourcePath);
  }
  if (!name) {
    //
    logError(`Input page name,or run ${chalk.green('wo page --help')} to help`);

    return process.exit(0);;
  }
  // 存放页面的目标路径
  const src = opts.dir || woOptions[template.toUpperCase()] ||  woOptions.SRC_PAGES;
  if (!src) {
    //
    logError(`Please enter the --dir option , See the --dir src/pages`);
    return process.exit(0);
  }
  // 克隆页面模板
  const from = `${path.resolve(__dirname, pageSourcePath)}/${template}`;
  if(!exfs.existsSync(from)){
    //
    logError(`No the '${template}' in template list , to see: wo page --list`);
    return process.exit(0);
  }
  // 页面模板不能使用单文件方式处理
  if(!isIndexFiles(from)){
    //
    if(noIndexFile){
      logError(`The '${template}' is not index.* files, can not set 'not-index' option`);
    }
    noIndexFile = false;
  }
  // 复制模板到目标目录
  function writeFile(n) {
    const current = path.resolve(process.cwd(), src, n);
    if (existsSync(current)) {
      //
      logError(`${n} is exists,not to create`);
      //
      return process.exit(0);
    }
    let to = path.resolve(process.cwd(), current);
    to = to.replace(/\\/g, '/');
    if(noIndexFile){
      to = to.replace(/\/[^\/]+$/,'')
    }
    const res = /(?:\/)?([^\/\\.]+)(?:\.(?:js|jsx|ts|tsx))?$/.exec(n);
    const name = res[1] || '';
    const contextName = (name.charAt(0).toUpperCase() + name.slice(1)).replace(/\_(\w)/g, function(all, letter){
      //
      return letter.toUpperCase();
    });
    const context = {
      ...opts,
      contextName,
      pageName: name
    };
    //
    glob
      .sync('**/*', {
        cwd: from,
        dot: true,
      })
      .forEach(file => {
        const filePath = path.resolve(from, file);
        if (statSync(filePath).isFile()) {
          let newName = file;
          // 重命名
          if (noIndexFile) {
            //
            newName = [name, path.extname(file)].join('');
          }
          fs.copyTpl(path.resolve(from, file), path.resolve(to, newName), context);
        }
      });
  }
  // 同时创建多个文件目录
  name = name.split(',');
  name.forEach(n => {
    writeFile(n);
  });
  //
  fs.commit(function() {
    logGreen('Create success');
  });
  //
  return '';
};
// description
exports.description = 'create page by template';
// usage
exports.usage = 'wo page [page name] [options]';
// options
exports.options = {
  '--type': 'Set project template type ',
  '--dir': 'Set new page target path',
  '--template': 'Set new page templates',
  '--typescript':'Set typescript file,add .ts',
  '--no-less ': "Don't to create index.less file",
  '--no-index': "Don't to create index.* file",
  '--list': 'Show the page templates ',
};
