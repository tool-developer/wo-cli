/* eslint global-require: "warn" */
/* eslint import/no-dynamic-require:"off" */

const chalk = require('chalk');
const debug = require('debug')('wo:scripts/update');
const path = require('path');
const download = require('../download');
const cmdRun = require('../cmd');
const {templateMetaRepo}  = require('../config');
const fs = require('fs-extra');
const {logError} = require('../BasicUtil');

// 下载模板方法
async function downloadTpl(key, obj) {
  const targetPath = path.resolve(__dirname, `../generators/${key}`);
  if(!fs.existsSync(targetPath)) {
    fs.mkdirp(targetPath);
  }
  const config = {
    repository: obj.repository,
    templatePath: targetPath
  };
  //
  await download(config);
}
// update meta type template
async function updateTemplate(type) {
  try {
    const metaDir = path.resolve(__dirname,'../meta/types.json');
    // 检测meta/types.json文件是否不存在
    if(!fs.existsSync(metaDir)) {
      //
      logError(chalk.red(`No meta config json file, to resolve this: wo update --meta`));
      process.exit(0);
    }
    const types = require('../meta/types.json');
    if (type && !types[type]) { // 未指定模板  更新所有的模板 并且更新的模板不是权限模块
      if (types) {
        const results = [];
        const keys = Object.keys(types);
        //
        keys.forEach((t)=>{
          //
          results.push(new Promise((resolve)=>{
            //
            console.log(chalk.green(`Update the ${t} template start`));
            //
            downloadTpl(t, types[t]);
            //
            console.log(chalk.green(`Update the ${t} template success`));
            //
            resolve(true);
          }));
        });
        //
        await Promise.all(results);
      }else{
        //
        console.log(chalk.red(`There is no meta data file, you can use 'wo update --meta ' to update`));
      }
    } else {
        const currentType = types[type];
        if (currentType) {
          //
          console.log(chalk.green(`Update the ${type} template start`));
          //
          await downloadTpl(type, currentType);
          //
          console.log(chalk.green(`Update the ${type} template success`));
        }
    }
    //
    return '';
  } catch (e) {
    //
    const info = `> Generate update failed`;
    debug(info);
    console.error(chalk.red(info), e);
    process.exit(1);
  }
}
//
module.exports.run = async function(opts = []) {
  //
  const {meta,type,_,...others} = opts;
  // update meta types.json
  if (meta) {
    //
    console.log(chalk.green('update template meta data start'));
    const config = {
      repository: templateMetaRepo,
      templatePath: path.resolve(__dirname, '../meta'),
      hasGitDir: true,
    };
    //
    await download(config);
    //
    console.log(chalk.green('update template meta data success'));
  }
  //
  const cmds = Object.keys(others);
  cmds.forEach(async (cmd)=>{
    try {
      //
      await cmdRun({cmd: `up-${cmd}`,args:opts});
    } catch(e) {
      //
      process.exit(1);
    }
  })
  // update meta type template
  updateTemplate(type);
};

// description
exports.description = 'update type template, meta config file, auth module files, or project';
// usage
exports.usage = 'wo update [options]';
// options
exports.options = {
  '--meta': 'Update meta types json file to local',
  '--type': 'Update the all type template or specified type template to local',
  //
  '--project':'Update project by branch to project',
};
